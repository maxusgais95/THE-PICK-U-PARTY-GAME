/**
 * High-Performance AAA Trail Renderer for Bomb Pong & Trail Simulation
 *
 * Supports:
 * - "Light Smooth Long Tail Trail" for Cyber Neon, Super Nova, Cosmic Galaxy, and Music Rhythm.
 * - "Hyper Zig-Zag Kinetic Lightning" for High-Voltage Electric Trail.
 * - Themed luminous ribbons for Blaze, Sakura, Blizzard, and Nature trails.
 *
 * Zero ctx.shadowBlur for silky 60FPS hardware acceleration.
 */

export interface TrailPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  time: number;
}

export class TrailHistoryManager {
  private points: TrailPoint[] = [];
  private maxPoints: number;
  private minDistance: number;

  constructor(maxPoints = 36, minDistance = 2.0) {
    this.maxPoints = maxPoints;
    this.minDistance = minDistance;
  }

  public setMaxPoints(max: number) {
    this.maxPoints = max;
  }

  public addPoint(x: number, y: number, vx = 0, vy = 0, speed = 0, time = performance.now()): void {
    if (this.points.length > 0) {
      const head = this.points[0];
      const distSq = (x - head.x) ** 2 + (y - head.y) ** 2;
      // Skip if ball barely moved to avoid point cluttering
      if (distSq < this.minDistance ** 2) {
        // Update head speed/time smoothly
        head.vx = vx;
        head.vy = vy;
        head.speed = speed;
        return;
      }
    }

    this.points.unshift({ x, y, vx, vy, speed, time });
    if (this.points.length > this.maxPoints) {
      this.points.length = this.maxPoints;
    }
  }

  public getPoints(): TrailPoint[] {
    return this.points;
  }

  public reset(): void {
    this.points = [];
  }
}

/**
 * Renders the light smooth long tail or hyper zig zag electric trail.
 */
export function drawTrailMesh(
  ctx: CanvasRenderingContext2D,
  trailId: string,
  points: TrailPoint[],
  palette: string[],
  time: number,
  baseHeadRadius = 14
): void {
  if (points.length < 2) return;

  const count = points.length;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const isElectric = trailId === 'particle_electric_shock';
  const isNeon = trailId === 'particle_neon_trail';
  const isSupernova = trailId === 'particle_star_spark';
  const isCosmic = trailId === 'particle_galaxy_trail';
  const isMusic = trailId === 'particle_music_notes';

  // 1. ==============================================================
  //    HYPER ZIG ZAG ELECTRIC ARC TRAIL
  // ==============================================================
  if (isElectric) {
    drawHyperZigZagElectricTrail(ctx, points, palette, time, baseHeadRadius);
    ctx.restore();
    return;
  }

  // 2. ==============================================================
  //    LIGHT SMOOTH LONG TAIL TRAILS (Cyber Neon, Super Nova, Cosmic, Music Rhythm)
  //    & OTHER TAILORED SMOOTH RIBBONS
  // ==============================================================
  drawSmoothLongLightTrail(
    ctx,
    points,
    palette,
    time,
    baseHeadRadius,
    isNeon,
    isSupernova,
    isCosmic,
    isMusic,
    trailId
  );

  ctx.restore();
}

/**
 * Smooth Long Tail Trail with multi-pass glow, quadratic spline curves,
 * tapering thickness, and theme-specific wave / pulse modulations.
 */
function drawSmoothLongLightTrail(
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  palette: string[],
  time: number,
  headRadius: number,
  isNeon: boolean,
  isSupernova: boolean,
  isCosmic: boolean,
  isMusic: boolean,
  trailId: string
): void {
  const count = points.length;
  if (count < 2) return;

  // Primary Theme Colors
  const primaryGlow = palette[0] || '#00f3ff';
  const secondaryGlow = palette[1] || palette[0] || '#ec4899';
  const accentGlow = palette[2] || palette[1] || '#ffffff';

  // Build smoothed spline coordinates with theme-based kinetic offsets
  // (Cosmic has subtle spiral wave drift, Music has audio equalizer ripple)
  const smoothed: Array<{ x: number; y: number; width: number; alpha: number }> = [];

  for (let i = 0; i < count; i++) {
    const p = points[i];
    const progress = i / (count - 1); // 0 at head (ball), 1 at tail tip
    const decay = Math.pow(1 - progress, 1.15);

    let offsetPerpX = 0;
    let offsetPerpY = 0;

    // Calculate perpendicular normal vector to motion
    if (i < count - 1) {
      const next = points[i + 1];
      const dx = next.x - p.x;
      const dy = next.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      if (isCosmic) {
        // Deep interstellar subtle accretion spiral wave
        const wave = Math.sin(i * 0.38 - time * 0.008) * 4.2 * (1 - progress * 0.5);
        offsetPerpX = nx * wave;
        offsetPerpY = ny * wave;
      } else if (isMusic) {
        // High-frequency dance rhythmic acoustic pulsation
        const wave = Math.sin(i * 0.65 - time * 0.02) * 3.5 * decay;
        offsetPerpX = nx * wave;
        offsetPerpY = ny * wave;
      }
    }

    // Width calculation
    let w = headRadius * 1.5 * Math.pow(1 - progress, 1.25);

    if (isMusic) {
      // Audio frequency spectrum equalizer width modulation
      const eqPulse = 1 + 0.45 * Math.sin(i * 0.52 - time * 0.016) * Math.cos(time * 0.008);
      w *= eqPulse;
    } else if (isNeon) {
      // High-speed cyber photon laser ribbon width
      w *= 1.1;
    } else if (isSupernova) {
      // Comet stardust radiant flare
      w *= 1.15;
    }

    smoothed.push({
      x: p.x + offsetPerpX,
      y: p.y + offsetPerpY,
      width: Math.max(1.2, w),
      alpha: Math.max(0, decay),
    });
  }

  // --- PASS 1: WIDE SOFT DIFFUSE NEON AURA ---
  // Renders a wide, soft atmospheric light beam
  for (let i = 0; i < smoothed.length - 1; i++) {
    const curr = smoothed[i];
    const next = smoothed[i + 1];
    const midX = (curr.x + next.x) * 0.5;
    const midY = (curr.y + next.y) * 0.5;

    ctx.beginPath();
    ctx.moveTo(curr.x, curr.y);
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);

    const auraWidth = Math.max(2, curr.width * 2.2);
    ctx.lineWidth = auraWidth;
    ctx.strokeStyle = isNeon
      ? i % 2 === 0 ? primaryGlow : secondaryGlow
      : isSupernova
      ? primaryGlow
      : isCosmic
      ? secondaryGlow
      : isMusic
      ? i % 3 === 0 ? primaryGlow : secondaryGlow
      : primaryGlow;
    ctx.globalAlpha = curr.alpha * 0.38;
    ctx.stroke();
  }

  // --- PASS 2: VIBRANT CHROMATIC CORE RIBBON ---
  // Solid, dense saturated light beam
  for (let i = 0; i < smoothed.length - 1; i++) {
    const curr = smoothed[i];
    const next = smoothed[i + 1];
    const midX = (curr.x + next.x) * 0.5;
    const midY = (curr.y + next.y) * 0.5;

    ctx.beginPath();
    ctx.moveTo(curr.x, curr.y);
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);

    ctx.lineWidth = curr.width;
    ctx.strokeStyle = isNeon
      ? secondaryGlow
      : isSupernova
      ? secondaryGlow
      : isCosmic
      ? primaryGlow
      : isMusic
      ? accentGlow
      : secondaryGlow;
    ctx.globalAlpha = curr.alpha * 0.78;
    ctx.stroke();
  }

  // --- PASS 3: WHITE-HOT INCANDESCENT LASER FILAMENT ---
  // Intense radiant center light spine (illuminating front 70% of tail)
  const coreLimit = Math.min(smoothed.length - 1, Math.ceil(smoothed.length * 0.72));
  for (let i = 0; i < coreLimit; i++) {
    const curr = smoothed[i];
    const next = smoothed[i + 1];
    const midX = (curr.x + next.x) * 0.5;
    const midY = (curr.y + next.y) * 0.5;
    const coreDecay = 1 - i / coreLimit;

    ctx.beginPath();
    ctx.moveTo(curr.x, curr.y);
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);

    ctx.lineWidth = Math.max(1.0, curr.width * 0.28);
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = curr.alpha * coreDecay * 0.95;
    ctx.stroke();
  }

  // --- PASS 4: THEME-SPECIFIC DYNAMIC LIGHT EMBELLISHMENTS ---
  if (isNeon) {
    // High-speed Cyber Neon traveling photon pulses
    const pulsePhase = (time * 0.004) % 1;
    const pulseIndex = Math.floor(pulsePhase * (smoothed.length - 2));
    const pPt = smoothed[pulseIndex];
    if (pPt) {
      ctx.beginPath();
      ctx.arc(pPt.x, pPt.y, pPt.width * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = pPt.alpha * 0.9;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pPt.x, pPt.y, pPt.width * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = primaryGlow;
      ctx.globalAlpha = pPt.alpha * 0.6;
      ctx.fill();
    }
  } else if (isSupernova) {
    // Supernova diamond sparkle glints along the ribbon spine
    const glintIndex = Math.floor(((time * 0.003) % 1) * (smoothed.length - 3));
    const gPt = smoothed[glintIndex];
    if (gPt && gPt.alpha > 0.4) {
      const glintSize = gPt.width * 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = gPt.alpha * 0.85;
      // 4-point diamond sparkle glint
      ctx.beginPath();
      ctx.moveTo(gPt.x, gPt.y - glintSize);
      ctx.lineTo(gPt.x + glintSize * 0.25, gPt.y);
      ctx.lineTo(gPt.x, gPt.y + glintSize);
      ctx.lineTo(gPt.x - glintSize * 0.25, gPt.y);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(gPt.x - glintSize, gPt.y);
      ctx.lineTo(gPt.x, gPt.y + glintSize * 0.25);
      ctx.lineTo(gPt.x + glintSize, gPt.y);
      ctx.lineTo(gPt.x, gPt.y - glintSize * 0.25);
      ctx.closePath();
      ctx.fill();
    }
  } else if (isMusic) {
    // Neon sound beats pulsating nodes along the crests
    for (let i = 2; i < smoothed.length - 1; i += 4) {
      const mPt = smoothed[i];
      if (mPt.alpha > 0.25) {
        ctx.beginPath();
        ctx.arc(mPt.x, mPt.y, Math.max(1.5, mPt.width * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? primaryGlow : secondaryGlow;
        ctx.globalAlpha = mPt.alpha * 0.85;
        ctx.fill();
      }
    }
  }
}

/**
 * Hyper-kinetic Zig-Zag Electric Lightning Trail.
 * Produces jagged, crackling, high-frequency high-voltage tesla arcs,
 * jittering plasma filaments, and branching electric forks!
 */
function drawHyperZigZagElectricTrail(
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  palette: string[],
  time: number,
  headRadius: number
): void {
  const count = points.length;
  if (count < 2) return;

  const cyanPlasma = palette[0] || '#00f3ff';
  const electricBlue = palette[1] || '#3b82f6';
  const highVoltWhite = '#ffffff';

  // Seeded/Time-based pseudo-random generator for reproducible 60fps lightning jitter
  let seed = Math.sin(time * 0.05) * 10000;
  const hyperRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Build jagged zigzag vertices
  interface ArcVertex {
    x: number;
    y: number;
    alpha: number;
    width: number;
    isNode: boolean;
  }

  const mainBolt: ArcVertex[] = [];
  const branchArcs: Array<[ArcVertex, ArcVertex]> = [];

  for (let i = 0; i < count - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const progress = i / (count - 1);
    const decay = Math.pow(1 - progress, 1.2);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const nx = dist > 0 ? -dy / dist : 0;
    const ny = dist > 0 ? dx / dist : 0;

    // Add anchor vertex
    mainBolt.push({
      x: p1.x,
      y: p1.y,
      alpha: decay,
      width: Math.max(1.5, headRadius * (1 - progress * 0.75)),
      isNode: true,
    });

    // Subdivide segment into aggressive zig-zag vertices
    const subSegments = Math.max(2, Math.min(4, Math.ceil(dist / 8)));
    for (let s = 1; s < subSegments; s++) {
      const t = s / subSegments;
      const baseSubX = p1.x + dx * t;
      const baseSubY = p1.y + dy * t;

      // Hyper-kinetic alternating zigzag displacement + high frequency chaotic jitter
      const zigDir = (i * 3 + s) % 2 === 0 ? 1 : -1;
      const jitterIntensity = (7.5 + hyperRandom() * 9.5) * decay;
      const offset = zigDir * jitterIntensity;

      const subX = baseSubX + nx * offset;
      const subY = baseSubY + ny * offset;

      const subVertex: ArcVertex = {
        x: subX,
        y: subY,
        alpha: decay * 0.95,
        width: Math.max(1, headRadius * 0.8 * (1 - (progress + t / count) * 0.8)),
        isNode: false,
      };

      mainBolt.push(subVertex);

      // Random lightning branch offshoot (forking into the dark)
      if (hyperRandom() < 0.28 && decay > 0.3) {
        const branchLen = 8 + hyperRandom() * 14;
        const branchAngle = (zigDir * 0.9 + (hyperRandom() - 0.5) * 0.8);
        const branchX = subX + (nx * Math.cos(branchAngle) - ny * Math.sin(branchAngle)) * branchLen;
        const branchY = subY + (nx * Math.sin(branchAngle) + ny * Math.cos(branchAngle)) * branchLen;

        branchArcs.push([
          subVertex,
          {
            x: branchX,
            y: branchY,
            alpha: decay * 0.65,
            width: 1,
            isNode: false,
          },
        ]);
      }
    }
  }

  // Final point
  const last = points[count - 1];
  mainBolt.push({
    x: last.x,
    y: last.y,
    alpha: 0.1,
    width: 1,
    isNode: true,
  });

  // --- PASS 1: WIDE CYAN PLASMA FIELD GLOW ---
  ctx.lineWidth = 14;
  ctx.strokeStyle = cyanPlasma;
  ctx.globalAlpha = 0.32;
  ctx.beginPath();
  for (let i = 0; i < mainBolt.length; i++) {
    const v = mainBolt[i];
    if (i === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  }
  ctx.stroke();

  // --- PASS 2: MEDIUM ELECTRIC BLUE ARC ---
  ctx.lineWidth = 6;
  ctx.strokeStyle = electricBlue;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  for (let i = 0; i < mainBolt.length; i++) {
    const v = mainBolt[i];
    if (i === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  }
  ctx.stroke();

  // --- PASS 3: HIGH-VOLTAGE WHITE FILAMENT (SHARP ZIG ZAG) ---
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = highVoltWhite;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  for (let i = 0; i < mainBolt.length; i++) {
    const v = mainBolt[i];
    if (i === 0) ctx.moveTo(v.x, v.y);
    else ctx.lineTo(v.x, v.y);
  }
  ctx.stroke();

  // --- PASS 4: BRANCHING LIGHTNING FORKS ---
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = cyanPlasma;
  for (const [start, end] of branchArcs) {
    ctx.globalAlpha = start.alpha * 0.75;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  // --- PASS 5: CONCENTRATED PLASMA DISCHARGE NODES ---
  for (let i = 0; i < mainBolt.length; i += 3) {
    const v = mainBolt[i];
    if (v.alpha > 0.25) {
      const sparkRadius = Math.max(1.8, 3.5 * v.alpha * (0.8 + hyperRandom() * 0.4));
      ctx.beginPath();
      ctx.arc(v.x, v.y, sparkRadius, 0, Math.PI * 2);
      ctx.fillStyle = highVoltWhite;
      ctx.globalAlpha = v.alpha * 0.9;
      ctx.fill();

      // Outer micro aura
      ctx.beginPath();
      ctx.arc(v.x, v.y, sparkRadius * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = cyanPlasma;
      ctx.globalAlpha = v.alpha * 0.45;
      ctx.fill();
    }
  }
}
