// Layered, rigged SVG version of the headset avatar.
// Every part lives in its own group so it can be moved independently:
// hair-back, body, head (face, features, bangs, headset, mic) — giving a
// parallax "2.5D" look when the head turns.

const SVG_NS = 'http://www.w3.org/2000/svg';

const star = (cx, cy, s) => {
  const h = s * 0.55;
  return `M${cx},${cy - s} Q${cx},${cy} ${cx + h},${cy} Q${cx},${cy} ${cx},${cy + s} ` +
         `Q${cx},${cy} ${cx - h},${cy} Q${cx},${cy} ${cx},${cy - s} Z`;
};

const TEMPLATE = `
<svg xmlns="${SVG_NS}" viewBox="0 0 1024 1024" class="avatar-svg" aria-label="Avatar">
  <defs>
    <linearGradient id="av-bg" x1="0" y1="0.15" x2="1" y2="0.85">
      <stop offset="0" stop-color="#e64dbb"/>
      <stop offset="0.45" stop-color="#d667d3"/>
      <stop offset="1" stop-color="#8530e0"/>
    </linearGradient>
    <radialGradient id="av-glow" cx="0.5" cy="0.4" r="0.5">
      <stop offset="0" stop-color="#fff" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="av-hair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fdeea4"/>
      <stop offset="1" stop-color="#f4b63f"/>
    </linearGradient>
    <linearGradient id="av-beard" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dc9c35"/>
      <stop offset="1" stop-color="#bd7824"/>
    </linearGradient>
    <clipPath id="av-badge-clip"><circle cx="512" cy="512" r="474"/></clipPath>
    <clipPath id="av-face-clip"><ellipse id="av-face-clip-shape" cx="512" cy="498" rx="153" ry="246"/></clipPath>
    <clipPath id="av-mouth-clip"><path id="av-mouth-clip-path" d=""/></clipPath>
  </defs>

  <g id="av-badge">
    <circle cx="512" cy="512" r="492" fill="#fff"/>
    <circle cx="512" cy="512" r="474" fill="url(#av-bg)"/>
    <circle cx="512" cy="512" r="474" fill="url(#av-glow)"/>
    <g class="av-sparkles" fill="#fbeefe">
      <path class="sp sp1" d="${star(800, 215, 54)}"/>
      <path class="sp sp2" d="${star(208, 330, 32)}"/>
      <path class="sp sp3" d="${star(852, 690, 31)}"/>
      <path class="sp sp4" d="${star(183, 682, 23)}"/>
    </g>
  </g>

  <g id="av-character">
    <g id="av-zoom">
      <!-- long hair behind everything -->
      <g id="av-hair-back">
        <path fill="url(#av-hair)" d="M512,182 C348,182 258,282 254,450 C250,560 262,625 242,722
          C226,795 206,852 196,900 L828,900 C818,852 798,795 782,722 C762,625 774,560 770,450
          C766,282 676,182 512,182 Z"/>
      </g>

      <!-- body -->
      <g id="av-body">
        <path fill="#e9ae8d" d="M448,680 L576,680 L576,830 L448,830 Z"/>
        <path fill="#1f0f3c" d="M130,1140 L130,905 C210,832 358,790 512,790 C666,790 814,832 894,905 L894,1140 Z"/>
        <path fill="none" stroke="#ff7ac8" stroke-width="7" stroke-linecap="round"
              d="M378,811 C430,852 594,852 646,811"/>
        <circle cx="280" cy="915" r="8" fill="#fde68a"/>
        <circle cx="368" cy="963" r="5" fill="#fde68a"/>
        <circle cx="656" cy="963" r="5" fill="#fde68a"/>
        <circle cx="744" cy="915" r="8" fill="#fde68a"/>
      </g>

      <!-- head -->
      <g id="av-head">
        <g id="av-face">
          <ellipse cx="512" cy="498" rx="153" ry="246" fill="#f3cbae"/>
        </g>

        <g clip-path="url(#av-face-clip)">
        <g id="av-features">
          <ellipse id="av-blush-l" cx="430" cy="566" rx="30" ry="16" fill="#ff7aa8" opacity="0"/>
          <ellipse id="av-blush-r" cx="594" cy="566" rx="30" ry="16" fill="#ff7aa8" opacity="0"/>

          <path fill="url(#av-beard)" d="M363,540 C380,566 420,590 462,590 L562,590
            C604,590 644,566 661,540 C668,652 604,744 512,744 C420,744 356,652 363,540 Z"/>
          <path fill="none" stroke="#e7b04e" stroke-width="5" stroke-linecap="round" opacity="0.7"
                d="M436,712 C478,724 548,722 596,692"/>

          <g id="av-mouth">
            <path id="av-mouth-shape" fill="#5c0b28" d=""/>
            <g clip-path="url(#av-mouth-clip)">
              <ellipse id="av-tongue" cx="508" cy="670" rx="22" ry="14" fill="#e8577f"/>
              <rect id="av-teeth" x="440" y="600" width="140" height="18" fill="#fff"/>
            </g>
          </g>
          <path id="av-mustache" fill="#c4822b" d="M428,612 C444,584 490,584 512,600
            C534,584 580,584 596,612 C572,601 540,606 512,613 C484,606 452,601 428,612 Z"/>

          <path fill="#e0a283" d="M512,515 C506,540 497,560 499,573 C501,586 523,586 525,573 C527,560 518,540 512,515 Z"/>

          <g id="av-eye-l">
            <g class="av-eye-open">
              <circle cx="452" cy="510" r="17" fill="#2a1240"/>
              <g class="av-pupil"><circle cx="458" cy="503" r="6" fill="#fff"/></g>
            </g>
            <path class="av-eye-closed" d="M433,511 Q452,523 471,511" fill="none" stroke="#2a1240"
                  stroke-width="6" stroke-linecap="round" opacity="0"/>
          </g>
          <g id="av-eye-r">
            <g class="av-eye-open">
              <circle cx="572" cy="510" r="17" fill="#2a1240"/>
              <g class="av-pupil"><circle cx="578" cy="503" r="6" fill="#fff"/></g>
            </g>
            <path class="av-eye-closed" d="M553,511 Q572,523 591,511" fill="none" stroke="#2a1240"
                  stroke-width="6" stroke-linecap="round" opacity="0"/>
          </g>

          <path id="av-brow-l" fill="none" stroke="#c98a2e" stroke-width="15" stroke-linecap="round"
                d="M440,471 Q466,458 496,467"/>
          <path id="av-brow-r" fill="none" stroke="#c98a2e" stroke-width="15" stroke-linecap="round"
                d="M530,467 Q575,452 618,469"/>
        </g>
        </g>

        <g id="av-bangs">
          <path fill="url(#av-hair)" d="M352,566 C344,380 410,256 512,254 C616,256 676,362 670,478
            C652,414 616,372 578,352 C546,402 470,474 360,566 Z"/>
          <path fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.35"
                d="M392,430 C404,352 446,304 500,290"/>
        </g>

        <g id="av-headset">
          <path fill="none" stroke="#24103f" stroke-width="22" stroke-linecap="round"
                d="M330,530 C324,330 400,224 512,224 C624,224 700,330 694,530"/>
          <path fill="none" stroke="#ff8fd0" stroke-width="4"
                d="M347,520 C343,344 412,244 512,244 C612,244 681,344 677,520"/>
          <g id="av-cup-r">
            <rect x="662" y="488" width="62" height="128" rx="31" fill="#24103f"/>
            <circle cx="692" cy="552" r="13" fill="#ff47a8"/>
          </g>
          <g id="av-cup-l">
            <rect x="300" y="488" width="62" height="128" rx="31" fill="#24103f"/>
            <circle cx="332" cy="552" r="13" fill="#ff47a8"/>
          </g>
        </g>

        <g id="av-mic">
          <path id="av-mic-boom" fill="none" stroke="#24103f" stroke-width="10" stroke-linecap="round" d=""/>
          <g id="av-mic-head">
            <circle cx="460" cy="685" r="23" fill="#24103f"/>
            <circle cx="453" cy="678" r="7" fill="#ff8fd0"/>
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>`;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = (v) => Math.round(v * 10) / 10;

export function createAvatar(container) {
  container.innerHTML = TEMPLATE;
  const svg = container.querySelector('svg');
  const q = (id) => svg.querySelector('#' + id);

  const el = {
    character: q('av-character'), badge: q('av-badge'), zoom: q('av-zoom'),
    hairBack: q('av-hair-back'), body: q('av-body'), head: q('av-head'),
    face: q('av-face'), faceClip: q('av-face-clip-shape'), features: q('av-features'), bangs: q('av-bangs'),
    headset: q('av-headset'), cupL: q('av-cup-l'), cupR: q('av-cup-r'),
    micBoom: q('av-mic-boom'), micHead: q('av-mic-head'),
    mouthShape: q('av-mouth-shape'), mouthClip: q('av-mouth-clip-path'),
    teeth: q('av-teeth'), tongue: q('av-tongue'), mustache: q('av-mustache'),
    browL: q('av-brow-l'), browR: q('av-brow-r'),
    blushL: q('av-blush-l'), blushR: q('av-blush-r'),
    eyes: ['av-eye-l', 'av-eye-r'].map((id, i) => {
      const g = q(id);
      return {
        cx: i === 0 ? 452 : 572, cy: 510,
        open: g.querySelector('.av-eye-open'),
        closed: g.querySelector('.av-eye-closed'),
        pupil: g.querySelector('.av-pupil'),
      };
    }),
  };

  function setBadge(on) {
    el.badge.style.display = on ? '' : 'none';
    if (on) el.character.setAttribute('clip-path', 'url(#av-badge-clip)');
    else el.character.removeAttribute('clip-path');
  }

  function mouthPath(open, smile, wide) {
    const cx = 508;
    const halfW = 24 + wide * 24 + open * 6;
    const cornerY = 619 - smile * 9;
    const topCtrl = 611 - open * 6 + smile * 2;
    const botCtrl = cornerY + 10 + open * 82 + Math.max(0, smile) * 10;
    return {
      d: `M${r1(cx - halfW)},${r1(cornerY)} Q${cx},${r1(topCtrl)} ${r1(cx + halfW)},${r1(cornerY)} ` +
         `Q${cx},${r1(botCtrl)} ${r1(cx - halfW)},${r1(cornerY)} Z`,
      cx, halfW, cornerY, topCtrl, botCtrl,
    };
  }

  /**
   * s: { yaw, pitch, roll (deg), x, y (px offsets), zoom, blinkL, blinkR,
   *      gazeX, gazeY, brow, smile, mouthOpen, mouthWide, breath }
   * All of yaw/pitch/gaze in [-1, 1]; blink/brow/smile/mouth in [0, 1].
   */
  function update(s) {
    const yaw = clamp(s.yaw, -1, 1);
    const pitch = clamp(s.pitch, -1, 1);
    const roll = clamp(s.roll, -35, 35);
    const breath = s.breath || 0;

    el.zoom.setAttribute('transform',
      `translate(${r1(s.x)},${r1(s.y)}) translate(512,900) scale(${clamp(s.zoom, 0.6, 1.6).toFixed(3)}) translate(-512,-900)`);

    // Body follows loosely, leans a little with head tilt.
    el.body.setAttribute('transform',
      `translate(${r1(yaw * 6)},${r1(breath * 3)}) rotate(${r1(roll * 0.2)},512,1000)`);

    // Head pivots around the neck.
    const headT = `translate(${r1(yaw * 8)},${r1(pitch * 6 + breath * 4)}) rotate(${r1(roll)},512,720)`;
    el.head.setAttribute('transform', headT);
    el.hairBack.setAttribute('transform',
      `translate(${r1(yaw * 4)},${r1(breath * 3)}) rotate(${r1(roll * 0.75)},512,720) translate(${r1(-yaw * 16)},${r1(-pitch * 6)})`);

    // Parallax layers inside the head: things "in front" move further.
    const sx = 1 - Math.abs(yaw) * 0.07;
    const faceT = `translate(${r1(yaw * 10)},${r1(pitch * 6)}) translate(512,498) scale(${sx.toFixed(3)},1) translate(-512,-498)`;
    el.face.setAttribute('transform', faceT);
    el.faceClip.setAttribute('transform', faceT);
    el.features.setAttribute('transform',
      `translate(${r1(yaw * 34)},${r1(pitch * 28)}) translate(512,560) scale(${(1 - Math.abs(yaw) * 0.12).toFixed(3)},${(1 - Math.abs(pitch) * 0.06).toFixed(3)}) translate(-512,-560)`);
    el.bangs.setAttribute('transform', `translate(${r1(yaw * 22)},${r1(pitch * 12)})`);
    el.headset.setAttribute('transform', `translate(${r1(-yaw * 3)},${r1(pitch * 2)})`);
    // The cup on the side the head turns toward slides inward (goes "behind").
    el.cupL.setAttribute('transform', `translate(${r1(Math.max(0, yaw) * 26 + Math.min(0, yaw) * 4)},0)`);
    el.cupR.setAttribute('transform', `translate(${r1(Math.min(0, yaw) * 26 + Math.max(0, yaw) * 4)},0)`);

    // Mic boom: from left cup down to the mic head, which sits in front of the face.
    const cupDx = Math.max(0, yaw) * 26 + Math.min(0, yaw) * 4 - yaw * 3;
    const micDx = yaw * 34, micDy = pitch * 20;
    const sxp = 330 + cupDx, syp = 606;
    const ex = 448 + micDx, ey = 690 + micDy;
    el.micBoom.setAttribute('d',
      `M${r1(sxp)},${syp} C${r1(sxp - 8)},${r1(668 + micDy * 0.3)} ${r1(372 + micDx * 0.5)},${r1(706 + micDy)} ${r1(ex)},${r1(ey)}`);
    el.micHead.setAttribute('transform', `translate(${r1(micDx)},${r1(micDy)})`);

    // Eyes
    const blinks = [s.blinkL, s.blinkR];
    const squint = clamp(s.smile, 0, 1) * 0.25;
    el.eyes.forEach((e, i) => {
      const b = clamp(blinks[i] + squint, 0, 1);
      const k = Math.max(0.08, 1 - b * 1.05);
      const closed = b > 0.8;
      e.open.setAttribute('transform',
        `translate(0,${e.cy}) scale(1,${closed ? 0.01 : k.toFixed(3)}) translate(0,${-e.cy})`);
      e.closed.setAttribute('opacity', closed ? '1' : '0');
      e.pupil.setAttribute('transform', `translate(${r1(s.gazeX * 6)},${r1(s.gazeY * 5)})`);
    });

    // Brows
    const by = -clamp(s.brow, 0, 1) * 16 + Math.max(0, -pitch) * 2;
    el.browL.setAttribute('transform', `translate(0,${r1(by)}) rotate(${r1(-s.brow * 4)},468,466)`);
    el.browR.setAttribute('transform', `translate(0,${r1(by)}) rotate(${r1(s.brow * 4)},574,462)`);

    // Mouth
    const open = clamp(s.mouthOpen, 0, 1);
    const smile = clamp(s.smile, -1, 1);
    const m = mouthPath(open, smile, clamp(s.mouthWide, 0, 1));
    el.mouthShape.setAttribute('d', m.d);
    el.mouthClip.setAttribute('d', m.d);
    el.teeth.setAttribute('x', r1(m.cx - m.halfW));
    el.teeth.setAttribute('width', r1(m.halfW * 2));
    el.teeth.setAttribute('y', r1(m.topCtrl - 6));
    el.teeth.setAttribute('height', r1(14 + open * 6));
    el.tongue.setAttribute('cy', r1((m.cornerY + m.botCtrl) / 2 + 10));
    el.tongue.setAttribute('rx', r1(m.halfW * 0.6));
    el.tongue.setAttribute('ry', r1(6 + open * 14));
    el.mustache.setAttribute('transform', `translate(0,${r1(-open * 4 - Math.max(0, smile) * 3)})`);

    const blush = clamp(s.smile, 0, 1) * 0.45 + (s.blush || 0);
    el.blushL.setAttribute('opacity', clamp(blush, 0, 0.8).toFixed(2));
    el.blushR.setAttribute('opacity', clamp(blush, 0, 0.8).toFixed(2));
  }

  return { svg, update, setBadge };
}
