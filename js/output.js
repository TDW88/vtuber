// Clean 16:9 avatar-only window for OBS Window Capture → Virtual Camera.
// It mirrors the state broadcast by the studio window; it never touches the camera or mic.
import { createAvatar } from './avatar.js';
import { applyStageBackground } from './background.js';

const stage = document.getElementById('stage');
const waiting = document.getElementById('waiting');
const avatar = createAvatar(document.getElementById('avatar'));
let bgKey = '';
applyStageBackground(stage, avatar, 'gradient', '');

let lastMsgAt = 0;
let latest = null;
const channel = new BroadcastChannel('vtuber-output');
channel.onmessage = (e) => {
  latest = e.data;
  lastMsgAt = performance.now();
  const key = latest.bg + latest.customColor;
  if (key !== bgKey) { bgKey = key; applyStageBackground(stage, avatar, latest.bg, latest.customColor); }
};

function render() {
  if (latest) avatar.update(latest.state);
  waiting.hidden = performance.now() - lastMsgAt < 1500;
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
