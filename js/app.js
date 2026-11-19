import { createAvatar } from './avatar.js';
import { createVoice } from './audio.js';

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const remap = (v, lo, hi) => clamp((v - lo) / (hi - lo), 0, 1);

// ---------- settings ----------
const DEFAULTS = {
  mirror: true,
  lipSource: 'both',
  micSensitivity: 3,
  noiseGate: 0.012,
  smoothing: 0.5,
  intensity: 1,
  followPosition: true,
  background: 'badge',
  customColor: '#00ff00',
  showPreview: true,
  showMesh: false,
};
let settings = { ...DEFAULTS };
try { Object.assign(settings, JSON.parse(localStorage.getItem('vtuber-settings') || '{}')); } catch {}
const save = () => { try { localStorage.setItem('vtuber-settings', JSON.stringify(settings)); } catch {} };

// ---------- avatar ----------
const avatar = createAvatar($('#avatar'));

const NEUTRAL = {
  yaw: 0, pitch: 0, roll: 0, x: 0, y: 0, zoom: 1,
  blinkL: 0, blinkR: 0, gazeX: 0, gazeY: 0, brow: 0, smile: 0,
  mouthOpen: 0, mouthWide: 0.5, breath: 0, blush: 0,
};
const state = { ...NEUTRAL };
const target = { ...NEUTRAL };

// ---------- DOM refs ----------
const video = $('#cam');
const overlay = $('#overlay');
const octx = overlay.getContext('2d');
const statusEl = $('#status');
const meterFill = $('#meter-fill');
const camDot = $('#cam-dot'), micDot = $('#mic-dot'), faceDot = $('#face-dot');

function setStatus(msg, kind = '') {
  statusEl.textContent = msg;
  statusEl.dataset.kind = kind;
}

// ---------- camera / face ----------
let tracker = null;
let camStream = null;
let calib = null;            // neutral pose
let calibSamples = [];
let lastFaceAt = 0;

async function startCamera() {
  if (camStream) return;
  setStatus('Requesting webcam…');
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false,
    });
  } catch (e) {
    camStream = null;
    setStatus('Webcam unavailable: ' + (e.message || e.name) + '. Voice lip sync still works.', 'warn');
    return;
  }
  video.srcObject = camStream;
  await video.play().catch(() => {});
  camDot.dataset.on = 'true';
  setStatus('Loading face tracker…');
  try {
    const { createFaceTracker } = await import('./face.js');
    tracker = await createFaceTracker();
    setStatus('Tracking. Look straight at the camera — calibrating…', 'ok');
    recalibrate();
  } catch (e) {
    console.error(e);
    setStatus('Face tracker failed to load: ' + (e.message || e), 'error');
  }
}

function recalibrate() {
  calib = null;
  calibSamples = [];
}

function addCalibSample(f) {
  calibSamples.push(f);
  if (calibSamples.length < 15) return;
  const avg = (k) => calibSamples.reduce((s, x) => s + x[k], 0) / calibSamples.length;
  calib = {
    yawRatio: avg('yawRatio'), pitchRatio: avg('pitchRatio'), roll: avg('roll'),
    cx: avg('cx'), cy: avg('cy'), eyeDist: avg('eyeDist'),
  };
  calibSamples = [];
  setStatus('Calibrated. Press C any time to recalibrate.', 'ok');
}

function applyFace(f) {
  if (!calib) { addCalibSample(f); }
  const c = calib || { yawRatio: 0.5, pitchRatio: 0.4, roll: 0, cx: 0.5, cy: 0.5, eyeDist: f.eyeDist };
  const sx = settings.mirror ? -1 : 1;     // camera image -> screen direction
  const k = settings.intensity;
  const bs = f.bs;
  const g = (n) => bs[n] || 0;

  target.yaw = clamp((f.yawRatio - c.yawRatio) * 2.6 * sx * k, -1, 1);
  target.pitch = clamp((f.pitchRatio - c.pitchRatio) * 5 * k, -1, 1);
  target.roll = clamp((f.roll - c.roll) * sx * k, -35, 35);
  if (settings.followPosition) {
    target.x = clamp((f.cx - c.cx) * sx * 900 * k, -380, 380);
    target.y = clamp((f.cy - c.cy) * 650 * k, -260, 260);
    target.zoom = clamp(1 + (f.eyeDist / c.eyeDist - 1) * 0.6, 0.7, 1.4);
  } else {
    target.x = target.y = 0; target.zoom = 1;
  }

  // Eyes: screen-left eye mirrors the user's left eye when mirrored.
  let bL = remap(g('eyeBlinkLeft'), 0.18, 0.6);
  let bR = remap(g('eyeBlinkRight'), 0.18, 0.6);
  if (Math.abs(bL - bR) < 0.3) bL = bR = (bL + bR) / 2;   // keep both eyes in sync unless winking
  if (settings.mirror) { target.blinkL = bL; target.blinkR = bR; }
  else { target.blinkL = bR; target.blinkR = bL; }

  const gx = (g('eyeLookOutLeft') + g('eyeLookInRight') - g('eyeLookInLeft') - g('eyeLookOutRight')) / 2;
  const gy = (g('eyeLookDownLeft') + g('eyeLookDownRight') - g('eyeLookUpLeft') - g('eyeLookUpRight')) / 2;
  target.gazeX = clamp(gx * 1.6 * sx, -1, 1);
  target.gazeY = clamp(gy * 1.6, -1, 1);

  target.brow = remap(Math.max(g('browInnerUp'), (g('browOuterUpLeft') + g('browOuterUpRight')) / 2), 0.1, 0.7);
  const smile = (g('mouthSmileLeft') + g('mouthSmileRight')) / 2;
  const frown = (g('mouthFrownLeft') + g('mouthFrownRight')) / 2;
  target.smile = clamp(remap(smile, 0.1, 0.7) - remap(frown, 0.1, 0.6) * 0.6, -1, 1);

  camMouth.open = remap(g('jawOpen'), 0.06, 0.55);
  camMouth.pucker = remap(g('mouthPucker'), 0.2, 0.8);
}
const camMouth = { open: 0, pucker: 0 };

// ---------- microphone ----------
let voice = null;
let voiceLevel = 0, voiceShape = 0.5;

async function startMic() {
  if (voice) return;
  try {
    voice = await createVoice();
    micDot.dataset.on = 'true';
  } catch (e) {
    voice = null;
    setStatus('Microphone unavailable: ' + (e.message || e.name) + '. Camera mouth tracking still works.', 'warn');
  }
}

// ---------- idle behaviour ----------
let nextBlinkAt = performance.now() + 2500;
let autoBlinkUntil = 0;

function idle(now, t) {
  // Ease toward neutral pose with a gentle sway.
  target.yaw = Math.sin(t * 0.5) * 0.08;
  target.pitch = Math.sin(t * 0.37) * 0.05;
  target.roll = Math.sin(t * 0.43) * 2.5;
  target.x = target.y = 0; target.zoom = 1;
  target.gazeX = Math.sin(t * 0.3) * 0.2; target.gazeY = 0;
  target.brow = 0; target.smile = 0.15;
  camMouth.open = 0; camMouth.pucker = 0;
  if (now > nextBlinkAt) { autoBlinkUntil = now + 140; nextBlinkAt = now + 2500 + Math.random() * 3500; }
  const b = now < autoBlinkUntil ? 1 : 0;
  target.blinkL = target.blinkR = b;
}

// ---------- preview overlay ----------
function drawOverlay(face) {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w) return;
  if (overlay.width !== w) { overlay.width = w; overlay.height = h; }
  octx.clearRect(0, 0, w, h);
  if (!settings.showMesh || !face) return;
  octx.fillStyle = '#7CF3FF';
  const lm = face.landmarks;
  for (let i = 0; i < lm.length; i += 2) {
    octx.fillRect(lm[i].x * w - 1, lm[i].y * h - 1, 2, 2);
  }
}

// ---------- main loop ----------
let last = performance.now();
let manualBlush = 0;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  if (window.vtuber && window.vtuber.paused) { requestAnimationFrame(frame); return; }

  // Face
  if (tracker && camStream) {
    try {
      const r = tracker.detect(video, now);
      if (r.fresh) {
        if (r.face) { applyFace(r.face); lastFaceAt = now; }
        if (settings.showPreview) drawOverlay(r.face);
      }
    } catch (e) { console.error(e); }
  }
  const tracking = tracker && now - lastFaceAt < 500;
  faceDot.dataset.on = tracking ? 'true' : 'false';
  if (!tracking) idle(now, t);

  // Voice
  let vTarget = 0;
  if (voice) {
    const { rms, centroid01 } = voice.sample();
    vTarget = clamp((rms - settings.noiseGate) * settings.micSensitivity * 8, 0, 1);
    voiceShape += (centroid01 - voiceShape) * 0.3;
    meterFill.style.width = (clamp(rms * 6, 0, 1) * 100).toFixed(1) + '%';
    meterFill.dataset.active = vTarget > 0.05 ? 'true' : 'false';
    $('#gate-mark').style.left = (clamp(settings.noiseGate * 6, 0, 1) * 100).toFixed(1) + '%';
  }
  // fast attack, slower release = natural talking flaps
  voiceLevel += (vTarget - voiceLevel) * (vTarget > voiceLevel ? 0.65 : 0.28);

  const useVoice = settings.lipSource !== 'camera' && voice;
  const useCam = settings.lipSource !== 'voice' && tracking;
  let open = 0;
  if (useVoice) open = Math.max(open, voiceLevel);
  if (useCam) open = Math.max(open, camMouth.open);
  target.mouthOpen = open;
  let wide = 0.5;
  if (useVoice && voiceLevel > 0.05) wide = 0.25 + voiceShape * 0.6;
  if (useCam) wide -= camMouth.pucker * 0.5;
  target.mouthWide = clamp(wide + Math.max(0, target.smile) * 0.3, 0, 1);

  // Smoothing (frame-rate independent)
  const s = settings.smoothing;
  const a = 1 - Math.pow(s, dt * 60);
  const aFast = 1 - Math.pow(s * 0.35, dt * 60);
  for (const k of ['yaw', 'pitch', 'roll', 'x', 'y', 'zoom', 'gazeX', 'gazeY', 'brow', 'smile', 'mouthWide']) {
    state[k] += (target[k] - state[k]) * a;
  }
  for (const k of ['blinkL', 'blinkR', 'mouthOpen']) state[k] += (target[k] - state[k]) * aFast;
  state.breath = Math.sin(t * 1.6);
  state.blush += (manualBlush - state.blush) * 0.1;

  avatar.update(state);
  requestAnimationFrame(frame);
}

// ---------- UI wiring ----------
function applyBackground() {
  const stage = $('#stage');
  const bg = settings.background;
  avatar.setBadge(bg === 'badge');
  const colors = { badge: '', green: '#00ff00', blue: '#0047bb', magenta: '#ff00ff', dark: '#14101f', transparent: 'transparent', custom: settings.customColor };
  stage.style.background = colors[bg] ?? '';
  stage.dataset.bg = bg;
  document.body.dataset.transparent = bg === 'transparent' ? 'true' : 'false';
  $('#custom-color').hidden = bg !== 'custom';
}

function applyMirror() {
  $('#preview').dataset.mirror = settings.mirror ? 'true' : 'false';
  recalibrate();
}

function bindRange(id, key, fmt = (v) => v) {
  const input = $('#' + id), out = $('#' + id + '-val');
  input.value = settings[key];
  const show = () => { if (out) out.textContent = fmt(+input.value); };
  show();
  input.addEventListener('input', () => { settings[key] = +input.value; show(); save(); });
}
function bindCheck(id, key, after) {
  const input = $('#' + id);
  input.checked = !!settings[key];
  input.addEventListener('change', () => { settings[key] = input.checked; save(); after && after(); });
}
function bindSelect(id, key, after) {
  const input = $('#' + id);
  input.value = settings[key];
  input.addEventListener('change', () => { settings[key] = input.value; save(); after && after(); });
}

bindRange('sensitivity', 'micSensitivity', (v) => v.toFixed(1));
bindRange('gate', 'noiseGate', (v) => v.toFixed(3));
bindRange('smoothing', 'smoothing', (v) => Math.round(v * 100) + '%');
bindRange('intensity', 'intensity', (v) => v.toFixed(2) + '×');
bindCheck('mirror', 'mirror', applyMirror);
bindCheck('follow', 'followPosition');
bindCheck('show-preview', 'showPreview', () => { $('#preview').hidden = !settings.showPreview; });
bindCheck('show-mesh', 'showMesh');
bindSelect('lip-source', 'lipSource');
bindSelect('background', 'background', applyBackground);
$('#custom-color').value = settings.customColor;
$('#custom-color').addEventListener('input', (e) => { settings.customColor = e.target.value; save(); applyBackground(); });

$('#preview').hidden = !settings.showPreview;
applyBackground();
applyMirror();

$('#start').addEventListener('click', async () => {
  const btn = $('#start');
  btn.disabled = true;
  btn.textContent = 'Starting…';
  // Mic first so the AudioContext is created inside the click gesture.
  await startMic();
  await startCamera();
  btn.textContent = 'Running';
});
$('#calibrate').addEventListener('click', () => {
  recalibrate();
  setStatus('Calibrating… look straight at the camera.', 'ok');
});

function setUiHidden(hidden) {
  document.body.dataset.uiHidden = hidden ? 'true' : 'false';
}
$('#hide-ui').addEventListener('click', () => setUiHidden(true));
$('#show-ui').addEventListener('click', () => setUiHidden(false));

window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea')) return;
  const k = e.key.toLowerCase();
  if (k === 'h') setUiHidden(document.body.dataset.uiHidden !== 'true');
  else if (k === 'c') { recalibrate(); setStatus('Calibrating… look straight at the camera.', 'ok'); }
  else if (k === 'm') { settings.mirror = !settings.mirror; $('#mirror').checked = settings.mirror; save(); applyMirror(); }
  else if (k === 'b') manualBlush = manualBlush ? 0 : 0.5;
});

if (!navigator.mediaDevices || !window.isSecureContext) {
  setStatus('Camera/mic need a secure page: open via http://localhost or https (see README).', 'error');
} else {
  setStatus('Press Start to connect your webcam and microphone.');
}

// Exposed for debugging / automation.
window.vtuber = { avatar, state, target, settings };

requestAnimationFrame(frame);
