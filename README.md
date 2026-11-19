# VTuber Studio

Browser-based VTuber app. Your webcam drives a rigged 2D avatar (head turn, tilt, nod, position in frame, lean-in zoom, blinks, eyebrows, smile, gaze) and your microphone drives the lip sync. Everything runs locally in the browser — no server, no uploads.

## Run

Camera/mic access needs `localhost` or `https`, so serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(or `npx serve .`, or enable GitHub Pages on this repo.)

Click **Start webcam + mic**, look straight at the camera for a second (auto-calibration), then talk and move.

## What moves what

| Input | Avatar |
| --- | --- |
| Head turn left/right | Face features, bangs, headset cups and mic shift with parallax |
| Head nod up/down | Features/brows shift vertically |
| Head tilt | Head and hair rotate, body leans slightly |
| Moving in frame / leaning in | Whole avatar moves / scales |
| Blinks, winks, eye direction | Eyes close, pupils follow |
| Eyebrows, smile, frown | Brows raise, mouth curves, blush |
| Voice volume | Mouth opens (fast attack, softer release) |
| Voice tone (oo vs ee) | Mouth narrows / widens |
| Jaw open (camera) | Mouth opens even without mic |

## Controls

- **Mouth driven by**: voice + camera (default), voice only, camera only.
- **Mic sensitivity / Noise gate**: the meter shows mic level; the yellow marker is the gate. Raise the gate if background noise flaps the mouth.
- **Mirror movement**: avatar moves like a mirror image of you.
- **Movement strength / Smoothing**: exaggerate motion, trade latency for stability.
- **Background**: original badge, green/blue/magenta screen, dark, transparent, or custom color.
- Keys: `H` hide controls, `C` recalibrate, `M` mirror, `B` blush.

## Using it in Google Meet

Meet only accepts camera devices, so the avatar goes through OBS's free virtual camera:

1. Open the app, click **Start webcam + mic**, then **Set up for Google Meet**. This:
   - opens a clean 1280×720 **VTuber Output** window (avatar only, no controls),
   - turns mirroring off so people in the call see you move the way a real webcam shows you,
   - switches to a full-frame gradient background, hides the preview and caps tracking at 24 fps to leave CPU for Meet.
2. In OBS: add a **Window Capture** source → pick the *VTuber Output* window → fit to screen (canvas 1280×720) → **Start Virtual Camera**.
3. In Meet: Settings → Video → Camera → **OBS Virtual Camera**. Keep your real microphone as the Meet mic. Turn off Meet's background blur/effects for this camera.
4. Wear headphones — otherwise other people's voices from your speakers will move your avatar's mouth.

Notes:
- Keep the output window open and not minimized (it can sit behind other windows). The studio window keeps animating even when you're on the Meet tab.
- Meet's self-view is mirrored for you; others see it unmirrored, like a normal webcam.
- If your machine struggles, drop **Tracking rate** to 15 fps.

## Streaming with OBS

1. Set background to **Green screen** and press `H` to hide controls.
2. In OBS add a **Window Capture** of the browser window, then a **Chroma Key** filter.

## Project layout

```
index.html         UI (studio: controls + tracking)
output.html        avatar-only 16:9 window for OBS / video calls
css/style.css
js/app.js          main loop, smoothing, UI wiring
js/avatar.js       layered SVG avatar rig (edit here to restyle the character)
js/face.js         MediaPipe Face Landmarker → head pose + blendshapes
js/audio.js        mic RMS + spectral centroid for lip sync
js/output.js       output window (receives pose via BroadcastChannel)
js/background.js   shared background modes
vendor/mediapipe/  vendored @mediapipe/tasks-vision 0.10.14 + face model (Apache-2.0)
assets/reference.jpg  original avatar artwork
```
