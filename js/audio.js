/**
 * audio.js
 * Lightweight Web Audio API sound engine. No external files required.
 * audioCtx is lazily created on first user interaction to satisfy
 * browser autoplay policies.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, type, duration, vol = 0.3) {
  try {
    const ctx = getCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {
    // Silently ignore if audio is unavailable
  }
}

export function playFlipSound() {
  playTone(600, 'sine', 0.08, 0.15);
}

export function playMatchSound() {
  playTone(523, 'sine', 0.1, 0.3);
  setTimeout(() => playTone(659, 'sine', 0.1,  0.3), 100);
  setTimeout(() => playTone(784, 'sine', 0.2,  0.3), 200);
}

export function playMissSound() {
  playTone(200, 'sawtooth', 0.3, 0.2);
}

export function playLevelUpSound() {
  [523, 587, 659, 698, 784].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'sine', 0.2, 0.3), i * 100);
  });
}
