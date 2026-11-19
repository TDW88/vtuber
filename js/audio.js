// Microphone volume + rough vowel shape for lip sync.

export async function createVoice() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: false,
  });
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  if (ctx.state === 'suspended') await ctx.resume();
  const src = ctx.createMediaStreamSource(stream);

  // Focus on the speech band so fans / rumble don't move the mouth.
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 85;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.3;
  src.connect(hp); hp.connect(lp); lp.connect(analyser);

  const time = new Float32Array(analyser.fftSize);
  const freq = new Float32Array(analyser.frequencyBinCount);
  const binHz = ctx.sampleRate / analyser.fftSize;

  /** Returns { rms, centroid01 } — centroid01 ~0 for "oo", ~1 for "ee/ss". */
  function sample() {
    analyser.getFloatTimeDomainData(time);
    let sum = 0;
    for (let i = 0; i < time.length; i++) sum += time[i] * time[i];
    const rms = Math.sqrt(sum / time.length);

    analyser.getFloatFrequencyData(freq);
    let num = 0, den = 0;
    const lo = Math.floor(250 / binHz), hi = Math.floor(3500 / binHz);
    for (let i = lo; i < hi; i++) {
      const p = Math.pow(10, freq[i] / 20);
      num += p * i * binHz; den += p;
    }
    const centroid = den > 0 ? num / den : 1000;
    const centroid01 = Math.max(0, Math.min(1, (centroid - 700) / 1600));
    return { rms, centroid01 };
  }

  function stop() {
    stream.getTracks().forEach((t) => t.stop());
    ctx.close();
  }

  return { sample, stop };
}
