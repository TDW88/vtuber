// Webcam face tracking with MediaPipe Face Landmarker (vendored, runs locally).
import { FaceLandmarker, FilesetResolver } from '../vendor/mediapipe/vision_bundle.mjs';

const WASM_PATH = new URL('../vendor/mediapipe/wasm', import.meta.url).href;
const MODEL_PATH = new URL('../vendor/mediapipe/face_landmarker.task', import.meta.url).href;

// Landmark indices (MediaPipe 468-point mesh)
const L = {
  noseTip: 1, between: 168, chin: 152,
  eyeOuterR: 33, eyeOuterL: 263, // subject's right / left eye outer corners
  cheekR: 234, cheekL: 454,
};

export async function createFaceTracker() {
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
  const opts = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
  });
  let landmarker;
  try {
    landmarker = await FaceLandmarker.createFromOptions(fileset, opts('GPU'));
  } catch (e) {
    console.warn('GPU delegate failed, falling back to CPU', e);
    landmarker = await FaceLandmarker.createFromOptions(fileset, opts('CPU'));
  }

  let lastVideoTime = -1;

  /**
   * Returns raw measurements in *camera image* space (not mirrored), or null
   * if no face / no new frame. `fresh` false means frame unchanged.
   */
  function detect(video, nowMs) {
    if (video.readyState < 2 || video.currentTime === lastVideoTime) return { fresh: false };
    lastVideoTime = video.currentTime;
    const res = landmarker.detectForVideo(video, nowMs);
    if (!res.faceLandmarks || !res.faceLandmarks.length) return { fresh: true, face: null };

    const lm = res.faceLandmarks[0];
    const W = video.videoWidth || 640, H = video.videoHeight || 480;
    const P = (i) => ({ x: lm[i].x * W, y: lm[i].y * H });

    const eR = P(L.eyeOuterR), eL = P(L.eyeOuterL);
    const nose = P(L.noseTip), btw = P(L.between), chin = P(L.chin);
    const cR = P(L.cheekR), cL = P(L.cheekL);

    const roll = Math.atan2(eL.y - eR.y, eL.x - eR.x) * 180 / Math.PI;
    const yawRatio = (nose.x - cR.x) / Math.max(1, cL.x - cR.x);           // ~0.5 facing camera
    const pitchRatio = (nose.y - btw.y) / Math.max(1, chin.y - btw.y);      // ~0.35-0.45 neutral
    const eyeDist = Math.hypot(eL.x - eR.x, eL.y - eR.y) / W;

    const bs = {};
    const cats = res.faceBlendshapes && res.faceBlendshapes[0] ? res.faceBlendshapes[0].categories : [];
    for (const c of cats) bs[c.categoryName] = c.score;

    return {
      fresh: true,
      face: {
        roll, yawRatio, pitchRatio, eyeDist,
        cx: lm[L.between].x, cy: lm[L.between].y,
        bs, landmarks: lm,
      },
    };
  }

  return { detect, close: () => landmarker.close() };
}
