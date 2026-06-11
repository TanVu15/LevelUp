// Web Audio API Synthesizer for high-tech gamified feedback
let audioCtx: AudioContext | null = null;

// iOS suspend AudioContext khi app vào nền → node đang phát bị treo, lúc context
// thức dậy (mở lại app / warmupAudio) chúng burst ra thành tiếng "xoẹt" ma.
// Fix (feat-device-feedback-fixes REQ-01): app ẩn → CLOSE context (node chết hẳn),
// lần play kế tiếp tạo context mới — luôn từ user gesture nên không vướng autoplay.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
      if (!zapBuffer) zapLoading = null; // promise decode gắn ctx cũ — cho phép thử lại
    }
  });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (document.hidden) return null; // không schedule âm thanh khi app đang ẩn
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext
      || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

// BootIntro chờ promise này (có timeout phía gọi) rồi mới bắt đầu CẢ hình lẫn tiếng
// cùng một khung hình — hết cảnh tiếng zap vào trễ so với màn hình nhiễu (iOS decode chậm).
export function zapReady(): Promise<boolean> {
  return preloadZap().then(b => !!b).catch(() => false);
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

// AWAKEN intro zap — plays ONLY the sample public/sfx/electric-zap.mp3 (latest).
// The old synthesized spark fallback was removed so no duplicate/legacy sound plays.
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
      // Not decoded yet: wait for the sample, then play it. If it genuinely fails
      // to load, stay silent (no synth fallback).
      preloadZap().then(b => {
        if (b) { try { playBuffer(b); } catch { /* unsupported */ } }
      });
    } catch { /* unsupported */ }
  };
  // Context suspended (mount sau reload — CHƯA có user gesture, iOS không cho resume):
  // thử resume trong cửa sổ ngắn; quá hạn thì BỎ HẲN tiếng zap. Tuyệt đối không để
  // lệnh phát nằm chờ — nó sẽ bắn ra cùng tiếng tick ở cú chạm kế tiếp (device test round 3).
  if (ctx.state === 'suspended') {
    let expired = false;
    const tryRun = () => { if (!expired && ctx.state === 'running') { expired = true; run(); } };
    ctx.resume().then(tryRun).catch(() => {});
    setTimeout(tryRun, 150);                    // resume kịp trong gesture còn hiệu lực
    setTimeout(() => { expired = true; }, 600); // quá hạn → vứt, intro chạy không tiếng
  } else {
    run();
  }
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
