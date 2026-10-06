/**
 * Studio-Grade SFX Generator (lossless 44.1kHz 16-bit PCM Stereo WAV)
 * Acoustically tuned for audiophile clarity, soothing warmth, and earphone comfort.
 * Eliminates ear fatigue, digital aliasing, and harsh high-frequency spikes.
 */

import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

/**
 * Filtered pink/brown noise generator for organic acoustic warmth.
 * Replaces raw white noise to eliminate earphone hissing and static.
 */
function createNoiseFilter(cutoffHz = 800) {
  const rc = 1.0 / (2.0 * Math.PI * cutoffHz);
  const dt = 1.0 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  let y = 0;
  return (whiteSample) => {
    y = y + alpha * (whiteSample - y);
    return y;
  };
}

/**
 * Bandpass filter for organic aerodynamic whooshes.
 */
function createBandpassFilter(centerHz = 400, q = 1.8) {
  const w0 = (2 * Math.PI * centerHz) / SAMPLE_RATE;
  const alpha = Math.sin(w0) / (2 * q);
  const b0 = alpha;
  const b1 = 0;
  const b2 = -alpha;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;

  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = (b0 / a0) * x + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

/**
 * Encodes stereo float arrays into a 16-bit PCM WAV buffer.
 * targetPeak: Calibrated peak amplitude for professional dynamic staging.
 */
function createWavBuffer(left, right, targetPeak = 0.50) {
  const numSamples = left.length;
  const numChannels = 2;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = numSamples * blockAlign;
  const totalFileSize = 44 + dataSize;

  const buffer = Buffer.alloc(totalFileSize);

  // RIFF Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(totalFileSize - 8, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  buffer.writeUInt16LE(1, 20);  // AudioFormat 1 = PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Calculate measured peak
  let maxPeak = 0;
  for (let i = 0; i < numSamples; i++) {
    const absL = Math.abs(left[i]);
    const absR = Math.abs(right[i]);
    if (absL > maxPeak) maxPeak = absL;
    if (absR > maxPeak) maxPeak = absR;
  }

  // Smooth fade-out on the last 40 samples to prevent DC offset clicks
  const fadeOutLen = Math.min(40, numSamples);
  for (let j = 0; j < fadeOutLen; j++) {
    const idx = numSamples - 1 - j;
    const fade = j / fadeOutLen;
    left[idx] *= fade;
    right[idx] *= fade;
  }

  const gain = maxPeak > 0 ? targetPeak / maxPeak : 1.0;

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let sL = left[i] * gain;
    let sR = right[i] * gain;
    sL = Math.max(-0.999, Math.min(0.999, sL));
    sR = Math.max(-0.999, Math.min(0.999, sR));

    buffer.writeInt16LE(Math.round(sL * 32767), offset);
    buffer.writeInt16LE(Math.round(sR * 32767), offset + 2);
    offset += 4;
  }

  return buffer;
}

// ============================================================================
// 1. UI Button Click: Warm, soothing acoustic marimba / wooden tap
// Replaces ear-piercing 5.8kHz high click with gentle tactile feedback.
// ============================================================================
function generateButtonClick() {
  const duration = 0.055;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);
  const lp = createNoiseFilter(1600);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Smooth cosine attack (no pop/snap)
    const attack = Math.min(1, t / 0.002);
    // Warm body drop (360Hz down to 210Hz)
    const freq = 210 + 150 * Math.exp(-t * 90);
    const bodyEnv = Math.exp(-t * 70);
    const body = Math.sin(2 * Math.PI * freq * t) * bodyEnv;
    // Gentle overtone (second harmonic)
    const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.18 * Math.exp(-t * 120);
    // Filtered wooden micro-transient
    const noise = lp(Math.random() * 2 - 1) * Math.exp(-t * 220) * 0.25;

    const sample = (body * 0.75 + harmonic + noise) * attack;
    left[i] = sample * 0.98;
    right[i] = sample * 1.02;
  }
  return { left, right, peak: 0.32 }; // -10 dB: subtle and non-fatiguing
}

// ============================================================================
// 2. Touch Down Chimes (C Major Pentatonic Scale: C4 to E5)
// Pure, luminous, warm vibraphone / crystal waterdrop notes.
// ============================================================================
const PENTATONIC_FREQS = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25  // E5
];

function generateTouchDown(freq, index = 0) {
  const duration = 0.42;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);
  const pan = -0.25 + (index / 7) * 0.50; // Gentle earphone stereo spread

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Smooth sinusoidal attack (3ms) prevents earphone click
    const attack = Math.min(1, t / 0.0035);

    // Warm organic pitch drop in the first 10ms (waterdrop / mallet touch)
    const pitchEnv = Math.exp(-t * 80);
    const instFreq = freq * (1.0 + 0.22 * pitchEnv);

    // Fundamental note + warm 2nd & 3rd harmonics (soothing acoustic body)
    const decay = Math.exp(-t * 6.8);
    const harmonicDecay = Math.exp(-t * 14.0);

    const f0 = Math.sin(2 * Math.PI * instFreq * t) * 0.75;
    const f1 = Math.sin(2 * Math.PI * (instFreq * 2.0) * t) * 0.16 * harmonicDecay;
    const f2 = Math.sin(2 * Math.PI * (instFreq * 3.0) * t) * 0.05 * harmonicDecay;

    // Warm sub-fundamental for tactile speaker & earphone warmth
    const sub = Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.12 * Math.exp(-t * 25);

    const s = (f0 + f1 + f2) * attack * decay + sub * attack;

    left[i] = s * (0.5 - pan * 0.4);
    right[i] = s * (0.5 + pan * 0.4);
  }
  return { left, right, peak: 0.48 }; // -6.4 dB
}

// ============================================================================
// 3. Touch Up: Delicate, soft acoustic glass bubble release
// ============================================================================
function generateTouchUp() {
  const duration = 0.055;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.003);
    const env = Math.exp(-t * 70);
    // Smooth gentle upward slide
    const freq = 440 + 160 * (1 - Math.exp(-t * 80));
    const s = Math.sin(2 * Math.PI * freq * t) * env * attack;
    left[i] = s * 0.95;
    right[i] = s * 1.05;
  }
  return { left, right, peak: 0.28 }; // -11 dB
}

// ============================================================================
// 4. Countdown Tick (Normal & Urgent): Smooth woody sonar metronome
// ============================================================================
function generateCountdownTick(isUrgent = false) {
  const duration = 0.11;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const baseFreq = isUrgent ? 460 : 320;
  const lp = createNoiseFilter(1200);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.002);
    // Warm body pulse
    const toneEnv = Math.exp(-t * (isUrgent ? 35 : 45));
    const tone = Math.sin(2 * Math.PI * baseFreq * t) * toneEnv;
    const overtone = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.2 * Math.exp(-t * 70);

    // Warm rounded wood transient
    const woodTick = lp(Math.random() * 2 - 1) * Math.exp(-t * 120) * 0.25;

    let s = (tone * 0.75 + overtone + woodTick) * attack;

    // If urgent, add a tiny double-strike mallet bounce at 24ms
    if (isUrgent && t >= 0.024) {
      const dt = t - 0.024;
      const bounce = Math.sin(2 * Math.PI * (baseFreq * 1.25) * dt) * Math.exp(-dt * 50) * 0.35;
      s += bounce;
    }

    left[i] = s;
    right[i] = s;
  }
  return { left, right, peak: isUrgent ? 0.52 : 0.42 };
}

// ============================================================================
// 5. Target Decision Impact: Luxurious cinematic velvet bass boom + star bloom
// Eliminates ear-piercing static, shockwave zaps, and 808 clipping.
// ============================================================================
function generateTargetImpact() {
  const duration = 0.85;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);
  const lp = createNoiseFilter(300);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Layer 1: Smooth 68Hz down to 36Hz pure sub sweep (no distortion/tanh)
    const subFreq = 36 + 32 * Math.exp(-t * 5.0);
    const subEnv = Math.exp(-t * 3.6);
    const sub = Math.sin(2 * Math.PI * subFreq * t) * subEnv;

    // Layer 2: Punchy rounded acoustic transient (140Hz down to 70Hz)
    const punchAttack = Math.min(1, t / 0.004);
    const punchFreq = 70 + 70 * Math.exp(-t * 35);
    const punch = Math.sin(2 * Math.PI * punchFreq * t) * Math.exp(-t * 22) * punchAttack * 0.55;

    // Layer 3: Warm filtered low rumble (filtered pink noise)
    const rumble = lp(Math.random() * 2 - 1) * Math.exp(-t * 4.5) * 0.35;

    // Layer 4: Celebratory shimmer chord (E5 = 659.25, B5 = 987.77, E6 = 1318.5)
    let shimmer = 0;
    if (t >= 0.035) {
      const dt = t - 0.035;
      const shAttack = Math.min(1, dt / 0.015);
      const shDecay = Math.exp(-dt * 5.2);
      const b1 = Math.sin(2 * Math.PI * 659.25 * dt) * 0.22;
      const b2 = Math.sin(2 * Math.PI * 987.77 * dt) * 0.16;
      const b3 = Math.sin(2 * Math.PI * 1318.5 * dt) * 0.10;
      shimmer = (b1 + b2 + b3) * shAttack * shDecay;
    }

    const core = sub * 0.75 + punch + rumble * 0.3;
    left[i] = core + shimmer * 0.85;
    right[i] = core + shimmer * 1.15;
  }
  return { left, right, peak: 0.78 }; // -2.1 dB
}

// ============================================================================
// 6. Team Division Complete: Lush studio celeste / harp arpeggio
// ============================================================================
function generateTeamDivision() {
  const duration = 0.82;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const notes = [
    { freq: 523.25, time: 0.00, pan: -0.3 }, // C5
    { freq: 659.25, time: 0.06, pan: -0.15 }, // E5
    { freq: 783.99, time: 0.12, pan: 0.0 }, // G5
    { freq: 987.77, time: 0.18, pan: 0.15 }, // B5
    { freq: 1046.50, time: 0.24, pan: 0.3 }, // C6
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let sL = 0;
    let sR = 0;

    for (const note of notes) {
      if (t >= note.time) {
        const dt = t - note.time;
        const attack = Math.min(1, dt / 0.006);
        const decay = Math.exp(-dt * 5.2);

        // Warm sine fundamental + subtle 2nd harmonic (octave warmth)
        const fundamental = Math.sin(2 * Math.PI * note.freq * dt) * 0.65;
        const octave = Math.sin(2 * Math.PI * (note.freq * 2.0) * dt) * 0.18 * Math.exp(-dt * 8);

        const val = (fundamental + octave) * attack * decay;
        sL += val * (0.5 - note.pan * 0.4);
        sR += val * (0.5 + note.pan * 0.4);
      }
    }

    left[i] = sL * 0.75;
    right[i] = sR * 0.75;
  }
  return { left, right, peak: 0.60 }; // -4.4 dB
}

// ============================================================================
// 7. Bottle Flick / Launch: Aerodynamic air whoosh + gentle acoustic slide
// Replaces ear-piercing white noise and harsh 1450Hz sine scrape.
// ============================================================================
function generateBottleFlick() {
  const duration = 0.32;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const bp = createBandpassFilter(380, 1.4);
  const lp = createNoiseFilter(600);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Smooth aerodynamic whoosh envelope
    const whooshEnv = Math.pow(Math.sin((t / duration) * Math.PI), 1.8);
    const filteredNoise = bp(lp(Math.random() * 2 - 1));
    const whoosh = filteredNoise * whooshEnv * 0.70;

    // Low, soothing physical acrylic slide resonance (220Hz down to 140Hz)
    const slideFreq = 140 + 80 * Math.exp(-t * 12);
    const slide = Math.sin(2 * Math.PI * slideFreq * t) * Math.exp(-t * 14) * 0.35;

    const s = whoosh + slide;
    const pan = -0.2 + (t / duration) * 0.4;
    left[i] = s * (0.5 - pan * 0.5);
    right[i] = s * (0.5 + pan * 0.5);
  }
  return { left, right, peak: 0.45 }; // -6.9 dB
}

// ============================================================================
// 8. Bottle Spin Bearing / Ratchet Ticks: Silky wooden marble / ratchet clicks
// Replaces 5.8kHz ear-piercing screech with warm, soothing acoustic clicks.
// ============================================================================
function generateBottleTick(variation = 0) {
  const duration = 0.028;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  // Warm resonant frequencies around 650Hz - 900Hz (warm wood/resin range)
  const baseFreq = [680, 780, 720, 850][variation % 4];
  const lp = createNoiseFilter(1600);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.001);
    const fastDecay = Math.exp(-t * 220);

    // Warm rounded acoustic resonance
    const tone = Math.sin(2 * Math.PI * baseFreq * t) * fastDecay * 0.65;
    const subTone = Math.sin(2 * Math.PI * (baseFreq * 0.5) * t) * fastDecay * 0.25;
    const tap = lp(Math.random() * 2 - 1) * Math.exp(-t * 300) * 0.25;

    const s = (tone + subTone + tap) * attack;
    left[i] = s * 0.96;
    right[i] = s * 1.04;
  }
  return { left, right, peak: 0.28 }; // -11 dB: smooth purr in earphones
}

// ============================================================================
// 9. Bottle Settle: Singing crystal glass / warm meditation bell
// Eliminates 1175Hz tinnitus-like dissonant beating.
// ============================================================================
function generateBottleSettle() {
  const duration = 0.75;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const freq = 659.25; // E5 (rich, soothing fundamental instead of piercing D6)

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.0035);

    // Initial warm glass contact tap (380Hz)
    const tap = Math.sin(2 * Math.PI * 380 * t) * Math.exp(-t * 80) * 0.35;

    // Resonant crystal singing ring with slow 0.8Hz vibrato
    const ringDecay = Math.exp(-t * 4.5);
    const vibrato = Math.sin(2 * Math.PI * 0.8 * t) * 1.5;
    const f0 = Math.sin(2 * Math.PI * (freq + vibrato) * t) * 0.65;
    const octave = Math.sin(2 * Math.PI * (freq * 2.0) * t) * 0.16 * Math.exp(-t * 8);

    const s = (tap + (f0 + octave) * ringDecay) * attack;
    left[i] = s * 0.98;
    right[i] = s * 1.02;
  }
  return { left, right, peak: 0.50 }; // -6.0 dB
}

// ============================================================================
// 10. Bomb Explosion (Kaboom & Bomb Pong): Cinematic Deep Sub Detonation
// Deep, thunderous, warm club-grade rumble without harsh white noise or clipping.
// ============================================================================
function generateBombExplosion() {
  const duration = 0.95;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const lp = createNoiseFilter(240); // Deep lowpass keeps explosion velvety

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Sub-bass detonation drop (95Hz sweeping down to 32Hz)
    const subFreq = 32 + 63 * Math.exp(-t * 5.0);
    const subEnv = Math.exp(-t * 3.4);
    const sub = Math.sin(2 * Math.PI * subFreq * t) * subEnv;

    // Chest-punch thump (130Hz)
    const punch = Math.sin(2 * Math.PI * 130 * t) * Math.exp(-t * 22) * 0.55;

    // Filtered pink rumble shockwave
    const rumble = lp(Math.random() * 2 - 1) * Math.exp(-t * 3.8) * 0.65;

    const s = (sub * 0.70 + punch + rumble * 0.45);
    left[i] = s * 0.98;
    right[i] = s * 1.02;
  }
  return { left, right, peak: 0.75 }; // -2.5 dB
}

// ============================================================================
// 11. Safe Pop (Kaboom): Soft water bubble burst + crystal glass chime
// ============================================================================
function generateSafePop() {
  const duration = 0.28;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.002);

    // Liquid bubble pop (380Hz down to 180Hz over 35ms)
    const popFreq = 180 + 200 * Math.exp(-t * 85);
    const pop = Math.sin(2 * Math.PI * popFreq * t) * Math.exp(-t * 60) * 0.70;

    // Soft uplifting bell chime (880Hz A5)
    let chime = 0;
    if (t >= 0.015) {
      const dt = t - 0.015;
      chime = Math.sin(2 * Math.PI * 880 * dt) * Math.exp(-dt * 12) * 0.35;
    }

    const s = (pop + chime) * attack;
    left[i] = s * 0.95;
    right[i] = s * 1.05;
  }
  return { left, right, peak: 0.46 }; // -6.7 dB
}

// ============================================================================
// 12. Bonus Fanfare (Kaboom & Pong Win): Celebratory harmonic triumph chord
// ============================================================================
function generateBonusFanfare() {
  const duration = 0.65;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const notes = [
    { freq: 523.25, time: 0.00 }, // C5
    { freq: 659.25, time: 0.05 }, // E5
    { freq: 783.99, time: 0.10 }, // G5
    { freq: 1046.50, time: 0.15 }, // C6
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    for (const note of notes) {
      if (t >= note.time) {
        const dt = t - note.time;
        const attack = Math.min(1, dt / 0.005);
        const decay = Math.exp(-dt * 6.5);
        const fund = Math.sin(2 * Math.PI * note.freq * dt) * 0.65;
        const oct = Math.sin(2 * Math.PI * (note.freq * 2.0) * dt) * 0.18;
        s += (fund + oct) * attack * decay;
      }
    }

    left[i] = s * 0.70;
    right[i] = s * 0.70;
  }
  return { left, right, peak: 0.62 }; // -4.1 dB
}

// ============================================================================
// 13. HUD Coin / Star Currency Ping: Joyful arcade sparkle ping
// ============================================================================
function generateHudCoin() {
  const duration = 0.24;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Dual sparkle tones: B5 (987.77Hz) & E6 (1318.5Hz)
    const t1 = Math.sin(2 * Math.PI * 987.77 * t) * Math.exp(-t * 18) * 0.55;
    let t2 = 0;
    if (t >= 0.04) {
      const dt = t - 0.04;
      t2 = Math.sin(2 * Math.PI * 1318.5 * dt) * Math.exp(-dt * 15) * 0.55;
    }
    const s = t1 + t2;
    left[i] = s * 0.92;
    right[i] = s * 1.08;
  }
  return { left, right, peak: 0.45 }; // -6.9 dB
}

// ============================================================================
// 14. Paddle Hit (Bomb Pong): Warm wooden table tennis strike
// ============================================================================
function generatePaddleHit() {
  const duration = 0.085;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);
  const lp = createNoiseFilter(1400);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.002);
    // 320Hz fundamental drop
    const freq = 220 + 140 * Math.exp(-t * 60);
    const body = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 55) * 0.70;
    const tap = lp(Math.random() * 2 - 1) * Math.exp(-t * 180) * 0.25;

    const s = (body + tap) * attack;
    left[i] = s;
    right[i] = s;
  }
  return { left, right, peak: 0.48 }; // -6.4 dB
}

// ============================================================================
// 15. Wall Ping (Bomb Pong): Neon court border deflection
// ============================================================================
function generateWallPing() {
  const duration = 0.065;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.002);
    const freq = 440 * Math.exp(-t * 30);
    const s = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 50) * attack;
    left[i] = s * 0.95;
    right[i] = s * 1.05;
  }
  return { left, right, peak: 0.40 }; // -8.0 dB
}

// ============================================================================
// Registry of all sound assets to produce
// ============================================================================
const OUT_DIR = path.resolve(process.cwd(), 'public/sounds');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const sounds = [
  { name: 'button_click.wav', gen: generateButtonClick },
  { name: 'touch_up.wav', gen: generateTouchUp },
  { name: 'countdown_tick.wav', gen: () => generateCountdownTick(false) },
  { name: 'countdown_tick_urgent.wav', gen: () => generateCountdownTick(true) },
  { name: 'target_impact.wav', gen: generateTargetImpact },
  { name: 'team_division.wav', gen: generateTeamDivision },
  { name: 'bottle_flick.wav', gen: generateBottleFlick },
  { name: 'bottle_settle.wav', gen: generateBottleSettle },
  { name: 'bomb_explosion.wav', gen: generateBombExplosion },
  { name: 'safe_pop.wav', gen: generateSafePop },
  { name: 'bonus_fanfare.wav', gen: generateBonusFanfare },
  { name: 'hud_coin.wav', gen: generateHudCoin },
  { name: 'paddle_hit.wav', gen: generatePaddleHit },
  { name: 'wall_ping.wav', gen: generateWallPing },
];

// Touch down notes (8 pentatonic notes)
PENTATONIC_FREQS.forEach((f, idx) => {
  sounds.push({
    name: `touch_down_${idx}.wav`,
    gen: () => generateTouchDown(f, idx),
  });
});

// Bottle ticks (4 variations)
for (let i = 0; i < 4; i++) {
  sounds.push({
    name: `bottle_tick_${i}.wav`,
    gen: () => generateBottleTick(i),
  });
}

console.log(`Generating ${sounds.length} studio audio assets with earphone mastering...`);

const validFileNames = new Set(sounds.map((s) => s.name));

for (const sound of sounds) {
  const result = sound.gen();
  const wavBuffer = createWavBuffer(result.left, result.right, result.peak);
  const filePath = path.join(OUT_DIR, sound.name);
  fs.writeFileSync(filePath, wavBuffer);
  console.log(`✓ ${sound.name} (${(wavBuffer.length / 1024).toFixed(1)} KB, target: ${(result.peak * 100).toFixed(0)}%)`);
}

// Clean up any orphaned files
let cleanedCount = 0;
const currentFiles = fs.readdirSync(OUT_DIR);
for (const file of currentFiles) {
  if (!validFileNames.has(file)) {
    const orphanPath = path.join(OUT_DIR, file);
    try {
      if (fs.statSync(orphanPath).isFile()) {
        fs.unlinkSync(orphanPath);
        cleanedCount++;
        console.log(`🗑️ Cleaned orphan: ${file}`);
      }
    } catch (e) {
      console.warn(`Failed to clean orphan ${file}:`, e);
    }
  }
}

if (cleanedCount > 0) {
  console.log(`Pruned ${cleanedCount} orphaned sound files.`);
}

console.log('Studio audio generation complete!');
