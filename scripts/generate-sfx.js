/**
 * High-Bitrate SFX Generator
 * Produces lossless 44.1kHz 16-bit PCM Stereo WAV files (1,411 kbps)
 * with studio-grade acoustics, physical glass modeling, and cinematic punch.
 */

import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

function createWavBuffer(left, right) {
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

  // Peak normalize to -0.5 dB (max amplitude ~0.94)
  let maxPeak = 0;
  for (let i = 0; i < numSamples; i++) {
    const absL = Math.abs(left[i]);
    const absR = Math.abs(right[i]);
    if (absL > maxPeak) maxPeak = absL;
    if (absR > maxPeak) maxPeak = absR;
  }
  const gain = maxPeak > 0 ? 0.94 / maxPeak : 1.0;

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Soft clamp
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

// 1. Tactile UI Click (Crisp, modern glass tap)
function generateButtonClick() {
  const duration = 0.065;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Layer 1: High frequency snap
    const snapEnv = Math.exp(-t * 220);
    const snap = Math.sin(2 * Math.PI * 3200 * t) * 0.4 + Math.sin(2 * Math.PI * 5800 * t) * 0.3;
    // Layer 2: Warm body drop
    const bodyEnv = Math.exp(-t * 85);
    const bodyFreq = 480 * Math.exp(-t * 30);
    const body = Math.sin(2 * Math.PI * bodyFreq * t) * 0.6;
    // Layer 3: Initial crisp impulse
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 500) * 0.35;

    const sample = (snap * snapEnv + body * bodyEnv + noise) * Math.min(1, t / 0.001);
    left[i] = sample * 0.98;
    right[i] = sample * 1.02;
  }
  return { left, right };
}

// 2. Multi-Touch Chimes (Juicy Neon Pop + Luminous Crystal Bloom)
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
  const duration = 0.48;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);
  const pan = -0.4 + (index / 7) * 0.8; // Stereo spread based on finger index

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // --- Layer 1: Juicy Tactile Pop Transient (Bubble / Cyber Waterdrop Snap) ---
    // Pitch drops swiftly from 2.5x down to fundamental over ~18ms
    const popPitchEnv = Math.exp(-t * 110);
    const instFreq = freq * (1.0 + 1.5 * popPitchEnv);
    const popEnv = Math.exp(-t * 36);
    let pop = Math.sin(2 * Math.PI * instFreq * t) * 0.85 * popEnv;
    pop = Math.tanh(pop * 1.6); // Warm saturation for punchy rounded presence

    // --- Layer 2: Neon Glass Bell & Shimmer Overtones ---
    const bellAttack = Math.min(1, t / 0.0025);
    const bellDecay = Math.exp(-t * 6.5);
    const harmonicDecay = Math.exp(-t * 13.0);

    const f0 = Math.sin(2 * Math.PI * freq * t) * 0.58;
    const f1 = Math.sin(2 * Math.PI * (freq * 2.76) * t) * 0.32 * harmonicDecay;
    const f2 = Math.sin(2 * Math.PI * (freq * 2.00) * t) * 0.24;
    const f3 = Math.sin(2 * Math.PI * (freq * 4.02) * t) * 0.12 * harmonicDecay;

    // --- Layer 3: High Electric Plasma Sparkle ---
    const sparkleEnv = Math.exp(-t * 40);
    const sparkleFreq = freq * 5.8 + 240 * Math.sin(2 * Math.PI * 16 * t);
    const sparkle = Math.sin(2 * Math.PI * sparkleFreq * t) * 0.16 * sparkleEnv;

    // --- Layer 4: Warm Tactile Sub Body (for punchy mobile speaker presence) ---
    const subEnv = Math.exp(-t * 38);
    const sub = Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.32 * subEnv;

    const core = pop + (f0 + f1 + f2 + f3) * bellAttack * bellDecay + sparkle + sub;

    // Subtle stereo chorus spread
    const chorus = Math.sin(2 * Math.PI * 0.8 * t) * 0.06;
    left[i] = core * (0.5 - pan * 0.38 - chorus);
    right[i] = core * (0.5 + pan * 0.38 + chorus);
  }
  return { left, right };
}

// 3. Touch Up (Crisp, bubbly, satisfying glass release)
function generateTouchUp() {
  const duration = 0.08;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 65);
    // Upward micro-pitch blip gives an uplifting bubbly release
    const freq = 460 + 360 * (1 - Math.exp(-t * 70));
    const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.22;
    const s = (Math.sin(2 * Math.PI * freq * t) * 0.72 + harmonic) * env * Math.min(1, t / 0.001);
    left[i] = s * 0.88;
    right[i] = s * 0.88;
  }
  return { left, right };
}

// 4. Countdown Tick (Deep pulse + crisp tension click)
function generateCountdownTick(isUrgent = false) {
  const duration = 0.14;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const baseFreq = isUrgent ? 950 : 540;
  const subFreq = isUrgent ? 140 : 95;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Sharp transient click
    const clickEnv = Math.exp(-t * 240);
    const click = Math.sin(2 * Math.PI * (baseFreq * 2.5) * t) * 0.4 +
                  (Math.random() * 2 - 1) * Math.exp(-t * 300) * 0.3;

    // Resonant tonal heart
    const toneEnv = Math.exp(-t * 35);
    const tone = Math.sin(2 * Math.PI * baseFreq * t) * 0.5;

    // Sub thump
    const subEnv = Math.exp(-t * 40);
    const sub = Math.sin(2 * Math.PI * subFreq * t) * 0.4;

    const s = (click * clickEnv + tone * toneEnv + sub * subEnv) * Math.min(1, t / 0.001);
    left[i] = s;
    right[i] = s;
  }
  return { left, right };
}

// 5. Target Decision Impact (Cinematic 808 Sub Drop + Shockwave Lightning Transient)
function generateTargetImpact() {
  const duration = 0.95;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Layer 1: Massive 808 sub sweep (110 Hz down to 34 Hz with subtle tube drive)
    const subEnv = Math.exp(-t * 4.2);
    const subFreq = 34 + 76 * Math.exp(-t * 6.5);
    let sub = Math.sin(2 * Math.PI * subFreq * t);
    // Soft saturation for deep club low-end presence
    sub = Math.tanh(sub * 1.6);

    // Layer 2: Punch punch (180 Hz chest punch)
    const punchEnv = Math.exp(-t * 32);
    const punch = Math.sin(2 * Math.PI * (180 * Math.exp(-t * 15)) * t) * 0.6;

    // Layer 3: High-Voltage Shockwave crackle (stereo spread)
    const crackleEnv = Math.exp(-t * 22);
    const noiseL = (Math.random() * 2 - 1) * crackleEnv * 0.35;
    const noiseR = (Math.random() * 2 - 1) * crackleEnv * 0.35;
    const zapFreq = 1200 * Math.exp(-t * 12);
    const zap = Math.sin(2 * Math.PI * zapFreq * t) * crackleEnv * 0.3;

    // Layer 4: Distant low rumble tail
    const rumble = Math.sin(2 * Math.PI * 42 * t) * Math.exp(-t * 3.0) * 0.25;

    const monoCore = (sub * 0.75 * subEnv) + (punch * punchEnv) + (rumble);
    left[i] = monoCore + (noiseL + zap) * 0.5;
    right[i] = monoCore + (noiseR + zap) * 0.5;
  }
  return { left, right };
}

// 6. Team Division Chime (Lush arpeggiated glass fanfare chord)
function generateTeamDivision() {
  const duration = 0.9;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  // Cascading notes: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), C6 (1046.50)
  const notes = [
    { freq: 523.25, time: 0.00, pan: -0.4 },
    { freq: 659.25, time: 0.05, pan: -0.2 },
    { freq: 783.99, time: 0.10, pan: 0.0 },
    { freq: 987.77, time: 0.15, pan: 0.2 },
    { freq: 1046.50, time: 0.20, pan: 0.4 }
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let sL = 0;
    let sR = 0;

    for (const note of notes) {
      if (t >= note.time) {
        const dt = t - note.time;
        const attack = Math.min(1, dt / 0.006);
        const decay = Math.exp(-dt * 4.8);
        const shimmer = Math.sin(2 * Math.PI * (note.freq * 2.76) * dt) * 0.22 * Math.exp(-dt * 9);
        const fundamental = Math.sin(2 * Math.PI * note.freq * dt) * 0.55;
        const octave = Math.sin(2 * Math.PI * (note.freq * 2.0) * dt) * 0.25;
        const val = (fundamental + octave + shimmer) * attack * decay;

        sL += val * (0.5 - note.pan * 0.4);
        sR += val * (0.5 + note.pan * 0.4);
      }
    }

    left[i] = sL * 0.8;
    right[i] = sR * 0.8;
  }
  return { left, right };
}

// 7. Bottle Flick / Launch (Authentic air whoosh + glass sliding momentum)
function generateBottleFlick() {
  const duration = 0.38;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Whoosh envelope (rises, peaks around 70ms, then decays)
    const whooshEnv = Math.pow(Math.sin((t / duration) * Math.PI), 1.6);
    // Center frequency rises then falls
    const centerFreq = 380 + 720 * Math.sin((t / duration) * Math.PI);

    // Bandpass noise simulation
    const rawNoise = (Math.random() * 2 - 1);
    const whoosh = rawNoise * Math.sin(2 * Math.PI * centerFreq * t) * whooshEnv * 0.65;

    // Physical glass friction impulse on table (fast scrape)
    const frictionEnv = Math.exp(-t * 18);
    const glassScrape = Math.sin(2 * Math.PI * 1450 * t) * 0.25 * frictionEnv;

    const s = whoosh + glassScrape;
    // Subtle stereo whoosh pan from left to right
    const pan = -0.3 + (t / duration) * 0.6;
    left[i] = s * (0.5 - pan * 0.5);
    right[i] = s * (0.5 + pan * 0.5);
  }
  return { left, right };
}

// 8. Bottle Spin Bearing / Table Ticks (Variations of realistic glass contact clicks)
function generateBottleTick(variation = 0) {
  const duration = 0.038;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const baseFreqs = [
    [3400, 5200, 780, 520],
    [3800, 5800, 840, 560],
    [3200, 4900, 720, 480],
    [3600, 5500, 810, 540],
  ][variation % 4];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const fastDecay = Math.exp(-t * 260);
    const bodyDecay = Math.exp(-t * 120);

    // High glass contact transient
    const glass1 = Math.sin(2 * Math.PI * baseFreqs[0] * t) * 0.35 * fastDecay;
    const glass2 = Math.sin(2 * Math.PI * baseFreqs[1] * t) * 0.25 * fastDecay;
    // Acrylic table tap resonance
    const tableTap = Math.sin(2 * Math.PI * baseFreqs[2] * t) * 0.35 * bodyDecay;
    const tableThud = Math.sin(2 * Math.PI * baseFreqs[3] * t) * 0.25 * bodyDecay;
    const click = (Math.random() * 2 - 1) * Math.exp(-t * 400) * 0.2;

    const s = (glass1 + glass2 + tableTap + tableThud + click) * Math.min(1, t / 0.0006);
    left[i] = s * 0.96;
    right[i] = s * 1.04;
  }
  return { left, right };
}

// 9. Bottle Settle (Clear resonant crystal glass bell ring-out)
function generateBottleSettle() {
  const duration = 0.85;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const freq = 1174.66; // D6 crystal glass pitch
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.002);
    // Initial contact tap
    const tapEnv = Math.exp(-t * 90);
    const tap = Math.sin(2 * Math.PI * 520 * t) * 0.4 * tapEnv;

    // Resonant crystal singing glass ring
    const ringDecay = Math.exp(-t * 4.2);
    // Beating vibrato between two very close modes (1174.66 and 1178.2 Hz) creates natural acoustic glass shimmer
    const f0 = Math.sin(2 * Math.PI * freq * t) * 0.55;
    const fBeat = Math.sin(2 * Math.PI * (freq + 3.2) * t) * 0.25;
    const overtone = Math.sin(2 * Math.PI * (freq * 2.76) * t) * 0.18 * Math.exp(-t * 8);

    const s = (tap + (f0 + fBeat + overtone) * ringDecay) * attack;

    // Subtle stereo chorus
    left[i] = (s + fBeat * 0.1) * 0.95;
    right[i] = (s - fBeat * 0.1) * 0.95;
  }
  return { left, right };
}

// Generate all sound files
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

console.log(`Generating ${sounds.length} high-bitrate studio audio files (44.1kHz 16-bit PCM)...`);

const validFileNames = new Set(sounds.map((s) => s.name));

for (const sound of sounds) {
  const { left, right } = sound.gen();
  const wavBuffer = createWavBuffer(left, right);
  const filePath = path.join(OUT_DIR, sound.name);
  fs.writeFileSync(filePath, wavBuffer);
  console.log(`✓ Generated ${sound.name} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);
}

// Clean up any orphaned files in OUT_DIR that do not belong to the active sound registry
let cleanedCount = 0;
const currentFiles = fs.readdirSync(OUT_DIR);
for (const file of currentFiles) {
  if (!validFileNames.has(file)) {
    const orphanPath = path.join(OUT_DIR, file);
    try {
      if (fs.statSync(orphanPath).isFile()) {
        fs.unlinkSync(orphanPath);
        cleanedCount++;
        console.log(`🗑️ Cleaned orphaned sound file: ${file}`);
      }
    } catch (e) {
      console.warn(`Failed to clean orphan ${file}:`, e);
    }
  }
}

if (cleanedCount > 0) {
  console.log(`Pruned ${cleanedCount} orphaned files to preserve PWA caching limits.`);
}

console.log('All high-bitrate audio files generated and directory sanitized successfully!');
