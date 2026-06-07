// Web Audio API Synthesizer for high-tech gamified feedback
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// --- Electric zap sample (public/sfx/electric-zap.mp3) ---
const ZAP_URL = '/sfx/electric-zap.mp3';
let zapBuffer: AudioBuffer | null = null;
let zapLoading: Promise<AudioBuffer | null> | null = null;

function preloadZap(): Promise<AudioBuffer | null> {
  if (zapBuffer) return Promise.resolve(zapBuffer);
  if (zapLoading) return zapLoading;
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(null);
  zapLoading = fetch(ZAP_URL)
    .then(r => r.arrayBuffer())
    .then(ab => ctx.decodeAudioData(ab))
    .then(buf => { zapBuffer = buf; return buf; })
    .catch(() => null);
  return zapLoading;
}

// Pre-create + resume the AudioContext and fetch/decode the zap sample during a
// user gesture (e.g. login click) so the AWAKEN intro plays instantly, no lag.
export function warmupAudio(): void {
  getAudioContext();
  preloadZap();
}

export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Graceful fail
  }
}

export function playQuestSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // Play a dual note sharp chime
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.3);
    });
  } catch (e) {
    // Graceful fail
  }
}

export function playLevelUpSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // Epic low heavy dark synth swell, rising into high bright frequency
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(120, now);
    osc1.frequency.linearRampToValueAtTime(440, now + 0.8);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(240, now);
    osc2.frequency.exponentialRampToValueAtTime(880, now + 0.8);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.82);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.85);
    osc2.stop(now + 0.85);
  } catch (e) {
    // Graceful fail
  }
}

// Electric sparks — sharp, bright crackle/arc bursts like a Tesla coil or a
// shorting wire. Hits instantly and stays dense to match the noisy AWAKEN glitch.
// Resume-aware so it fires the moment the intro appears (no suspended-context lag).
export function playElectricZap(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const playBuffer = (b: AudioBuffer) => {
    const src = ctx.createBufferSource();
    src.buffer = b;
    const gain = ctx.createGain();
    gain.gain.value = 0.85;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  };
  const run = () => {
    try {
      if (zapBuffer) { playBuffer(zapBuffer); return; }
      // Not decoded yet: wait for the sample so we always play the real sound,
      // only fall back to synth sparks if the file genuinely failed to load.
      preloadZap().then(b => {
        try { b ? playBuffer(b) : renderSparks(ctx); } catch { /* unsupported */ }
      });
    } catch { /* unsupported */ }
  };
  // If the context is still warming up, wait for it so playback starts on the
  // live clock instead of being delayed/clumped.
  if (ctx.state === 'suspended') ctx.resume().then(run).catch(() => {});
  else run();
}

function renderSparks(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const DUR = 1.4;

  // Master bus + hard-ish saturation → crisp, gritty spark edges
  const master = ctx.createGain();
  master.gain.value = 0.85;
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(257);
  for (let i = 0; i < 257; i++) {
    const x = (i / 128) - 1;
    curve[i] = Math.tanh(x * 3);
  }
  shaper.curve = curve;
  master.connect(shaper);
  shaper.connect(ctx.destination);

  // Shared bright white-noise source for all sparks
  const bufSize = Math.floor(ctx.sampleRate * DUR);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;

  // High bandpass = thin, bright "sssk-tck" spark texture
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(5000, now);
  bp.Q.value = 7;
  const sparkGain = ctx.createGain();
  sparkGain.gain.setValueAtTime(0.0001, now);
  noise.connect(bp);
  bp.connect(sparkGain);
  sparkGain.connect(master);

  // Dense, sharp spark bursts — front-loaded, thinning toward the tail.
  // First spark lands at t≈0 so the crackle is instant with the visual.
  let t = now;
  while (t < now + DUR - 0.05) {
    const progress = (t - now) / DUR;           // 0 → 1
    const decay = 0.006 + Math.random() * 0.035; // 6–41ms snap
    const lvl = 0.35 + Math.random() * 0.55;
    sparkGain.gain.setValueAtTime(0.0001, t);
    sparkGain.gain.exponentialRampToValueAtTime(lvl, t + 0.0015); // near-instant attack
    sparkGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    // Each spark flicks the band to a new bright frequency → arcing shimmer
    bp.frequency.setValueAtTime(3500 + Math.random() * 5000, t);
    // Gaps widen as the discharge dies out (sparks get sparser)
    t += decay + 0.008 + progress * 0.07 + Math.random() * 0.04;
  }
  noise.start(now);
  noise.stop(now + DUR);

  // Tiny pitched "tick" transients on top of the brightest sparks — the audible
  // snap of an arc jumping a gap. Square wave, ultra-short, randomly pitched.
  const tick = ctx.createOscillator();
  tick.type = 'square';
  const tickGain = ctx.createGain();
  tickGain.gain.setValueAtTime(0.0001, now);
  let tt = now + 0.002;
  while (tt < now + DUR * 0.7) {
    tick.frequency.setValueAtTime(1500 + Math.random() * 4000, tt);
    tickGain.gain.setValueAtTime(0.0001, tt);
    tickGain.gain.exponentialRampToValueAtTime(0.12 + Math.random() * 0.1, tt + 0.001);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, tt + 0.006);
    tt += 0.03 + Math.random() * 0.12;
  }
  tick.connect(tickGain);
  tickGain.connect(master);
  tick.start(now);
  tick.stop(now + DUR * 0.7 + 0.02);

  // Faint electric hum bed for body — quiet, fades out early so sparks dominate
  const hum = ctx.createOscillator();
  hum.type = 'sawtooth';
  hum.frequency.setValueAtTime(70, now);
  const humGain = ctx.createGain();
  humGain.gain.setValueAtTime(0.06, now);
  humGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  const humLp = ctx.createBiquadFilter();
  humLp.type = 'lowpass';
  humLp.frequency.value = 400;
  hum.connect(humLp);
  humLp.connect(humGain);
  humGain.connect(master);
  hum.start(now);
  hum.stop(now + 0.65);
}

export function playTimerEndSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Dramatic siren pattern
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.3);
    osc.frequency.linearRampToValueAtTime(330, now + 0.6);
    osc.frequency.linearRampToValueAtTime(440, now + 0.9);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.start();
    osc.stop(now + 1.25);
  } catch (e) {
    // Graceful fail
  }
}
