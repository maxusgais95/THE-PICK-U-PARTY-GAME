/**
 * Trail Visual FX & Specialized Theme Dynamics Engine
 * Features:
 * - Image sprites rendered with Screen Blending Mode
 * - Dynamic Rotation Jitter
 * - Smaller initial size that smoothly shrinks to 0 to disappear
 * - Strict 1:1 aspect ratio (never stretched) with high quality unblurred sampling
 */

export interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  glowColor?: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
  type: 'webp_sprite' | 'glow_light' | 'spark' | 'flame' | 'ember';
  spriteIndex?: number;
  seed?: number;
  customData?: Record<string, number>;
}

export interface TrailHistoryPoint {
  x: number;
  y: number;
  time: number;
  radius: number;
}

/**
 * Applies custom theme physics, scattering forces, rotation jitter, inward scatter pull, and faded lifespans
 */
export function updateTrailParticlePhysics(
  p: TrailParticle,
  trailId: string,
  time: number
): void {
  p.seed = p.seed ?? (Math.random() * 100);
  p.life += 1;
  const progress = p.life / p.maxLife;

  // Dynamic rotation jitter per frame for lively sparkle and flutter
  const baseJitter = (Math.sin(p.life * 0.55 + p.seed * 3.2) * 0.14) + (Math.random() - 0.5) * 0.16;

  // Strong inward convergence pull: actively pulling scattered particles inward toward the center trajectory as they age
  const inwardPull = Math.pow(progress, 0.9) * 0.32;
  p.vx *= (1 - inwardPull);
  p.vy *= (1 - inwardPull);

  switch (trailId) {
    case 'particle_electric_shock': {
      // Smooth kinetic electric plasma drift: removed harsh angular zig-zag snaps
      p.x += p.vx * 0.94 + Math.sin(p.life * 0.45 + p.seed) * 0.35;
      p.y += p.vy * 0.94 + Math.cos(p.life * 0.45 + p.seed) * 0.35;
      p.vx *= 0.91;
      p.vy *= 0.91;
      p.rotation += p.rotSpeed * 1.2 + baseJitter;
      const zapFlicker = 0.85 + Math.sin(p.life * 0.8 + p.seed) * 0.15;
      p.alpha = Math.max(0, Math.pow(1 - progress, 1.6) * zapFlicker);
      break;
    }

    case 'particle_neon_trail': {
      // Soft, clean aerodynamic drift without lingering long tail
      const lateral = Math.sin(p.life * 0.25 + p.seed) * 0.35;
      p.x += p.vx * 0.92 + lateral;
      p.y += p.vy * 0.92;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.rotation += p.rotSpeed * 0.8 + baseJitter * 0.8;
      p.alpha = Math.max(0, Math.pow(1 - progress, 1.7));
      break;
    }

    case 'particle_classic_blaze': {
      // Rising thermal drafts and turbulent heat wave scattering with inward tail tapering
      p.vy -= 0.18 * (1 - progress * 0.5);
      p.vx += Math.sin(p.life * 0.4 + p.seed) * 0.45 * (1 - progress * 0.6);
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.94;
      p.rotation += p.rotSpeed + baseJitter * 1.3;
      const flameFlicker = 0.85 + Math.sin(p.life * 0.8 + p.seed) * 0.15;
      p.alpha = Math.max(0, Math.pow(1 - progress, 1.8) * flameFlicker);
      break;
    }

    case 'particle_music_notes': {
      // Harmonic floating wave oscillation & rhythm bounce with rotation jitter
      const oscY = Math.sin(p.life * 0.28 + p.seed) * 1.1 * (1 - progress * 0.5);
      const oscX = Math.cos(p.life * 0.22 + p.seed) * 0.6 * (1 - progress * 0.5);
      p.x += p.vx + oscX;
      p.y += p.vy + oscY - 0.08;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.rotation += p.rotSpeed * 0.85 + baseJitter * 1.2;
      p.alpha = Math.max(0, Math.pow(1 - progress, 1.8));
      break;
    }

    case 'particle_star_spark': {
      // Crystalline starburst deceleration with sparkling rotation jitter
      const spreadX = (Math.random() - 0.5) * 0.35 * (1 - progress * 0.6);
      const spreadY = (Math.random() - 0.5) * 0.35 * (1 - progress * 0.6);
      p.x += p.vx + spreadX;
      p.y += p.vy + spreadY;
      p.vx *= 0.90;
      p.vy *= 0.90;
      p.rotation += p.rotSpeed * 1.3 + baseJitter * 1.4;
      const twinkle = 0.75 + 0.25 * Math.sin(p.life * 0.7 + p.seed);
      p.alpha = Math.max(0, Math.pow(1 - progress, 1.9) * twinkle);
      break;
    }

    case 'particle_galaxy_trail': {
      // Orbital spiral vortex: tangential acceleration creating galactic spiral arms tapering inward
      const tanX = -p.vy * 0.14 * (1 - progress * 0.5);
      const tanY = p.vx * 0.14 * (1 - progress * 0.5);
      p.vx += tanX;
      p.vy += tanY;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.rotation += p.rotSpeed * 1.5 + baseJitter * 1.2;
      const pulsarPulse = 0.8 + 0.2 * Math.sin(p.life * 0.45 + p.seed);
      p.alpha = Math.max(0, Math.pow(1 - progress, 1.9) * pulsarPulse);
      break;
    }

    case 'particle_sakura': {
      // Gentle wind breeze sway & fluttering petal tumble with rotation jitter
      const breeze = Math.sin(p.life * 0.15 + p.seed) * 0.9 * (1 - progress * 0.5);
      p.x += p.vx + breeze;
      p.y += p.vy + 0.05;
      p.vx *= 0.91;
      p.vy *= 0.93;
      p.rotation += p.rotSpeed * 0.8 + baseJitter * 1.5;
      p.alpha = Math.max(0, Math.pow(1 - progress, 1.8));
      break;
    }

    case 'particle_blizzard_ice': {
      // Crisp crystalline frost drift with icy gravity & shivering scatter
      const shiver = Math.sin(p.life * 1.8 + p.seed) * 0.38 * (1 - progress * 0.6);
      p.x += p.vx + shiver;
      p.y += p.vy + 0.08;
      p.vx *= 0.91;
      p.vy *= 0.93;
      p.rotation += p.rotSpeed + baseJitter * 1.2;
      p.alpha = Math.max(0, Math.pow(1 - progress, 1.9));
      break;
    }

    case 'particle_nature_leaves': {
      // Firefly wandering Brownian meander + spirit leaf buoyant flutter
      const wanderX = Math.sin(p.life * 0.25 + p.seed * 2) * 0.9 * (1 - progress * 0.5);
      const wanderY = Math.cos(p.life * 0.2 + p.seed) * 0.7 * (1 - progress * 0.5);
      p.x += p.vx + wanderX;
      p.y += p.vy + wanderY - 0.06;
      p.vx *= 0.91;
      p.vy *= 0.91;
      p.rotation += p.rotSpeed * 0.8 + baseJitter * 1.2;
      const fireflyBlink = 0.4 + 0.6 * Math.pow(Math.sin(p.life * 0.28 + p.seed), 4);
      p.alpha = Math.max(0, Math.pow(1 - progress, 1.8) * fireflyBlink);
      break;
    }

    default: {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.rotation += p.rotSpeed + baseJitter;
      p.alpha = Math.max(0, Math.pow(1 - progress, 1.9));
      break;
    }
  }
}

/**
 * Renders connected background trail effects (e.g. Sleek Neon Laser Stream, Fine Electric Arcs, Acoustic Waves)
 */
export function renderTrailThemeBackground(
  ctx: CanvasRenderingContext2D,
  trailId: string,
  historyPoints: TrailHistoryPoint[],
  activePalette: string[],
  time: number
): void {
  if (historyPoints.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Background continuous ribbons:
  // Note: Long tail trail effect for neon trail and harsh zig-zag electric arc trail have been removed.
  if (trailId === 'particle_music_notes') {
    // Acoustic Soundwave Ripples pulsing along the path
    const latest = historyPoints[0];
    if (latest) {
      const pulsePhase = (time * 0.005) % 1;
      const rippleR = 8 + pulsePhase * 20;
      const rippleAlpha = (1 - pulsePhase) * 0.35;
      ctx.beginPath();
      ctx.arc(latest.x, latest.y, rippleR, 0, Math.PI * 2);
      ctx.strokeStyle = activePalette[1] || '#ec4899';
      ctx.lineWidth = 1.0 * (1 - pulsePhase);
      ctx.globalAlpha = rippleAlpha;
      ctx.stroke();
    }
  } else if (trailId === 'particle_galaxy_trail') {
    // Subtle Cosmic Nebula Trail Haze
    const pts = historyPoints;
    const len = Math.min(pts.length, 4);
    for (let i = 0; i < len; i++) {
      const p = pts[i];
      const radius = 9 - i * 2;
      const haloGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      haloGrad.addColorStop(0, 'rgba(192, 132, 252, 0.22)');
      haloGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.10)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.globalAlpha = 0.28 - i * 0.06;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Renders a specialized trail particle:
 * - Image sprites: Screen blending mode, rotation jitter, smoothly shrink to 0 to disappear, strict 1:1 aspect ratio.
 * - Electric & Neon particles: decay smaller and faster towards the tail.
 * - Theme glow dots & sparks: refined, delicate scattering motes.
 */
export function renderStyledTrailParticle(
  ctx: CanvasRenderingContext2D,
  p: TrailParticle,
  trailId: string,
  webpImages: HTMLImageElement[],
  getCachedGlow: (color: string) => HTMLCanvasElement,
  time: number
): void {
  const progress = p.life / p.maxLife;

  if (p.type === 'webp_sprite') {
    const targetImg = webpImages.length > 0 ? webpImages[(p.spriteIndex ?? 0) % webpImages.length] : null;
    if (targetImg && targetImg.complete) {
      ctx.save();
      // Screen blending mode with smooth alpha fade
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      // Electric and Neon trails shrink cleanly to eliminate lingering tail effects
      const shrinkExp = trailId === 'particle_electric_shock' ? 1.6 : trailId === 'particle_neon_trail' ? 1.45 : 1.25;

      // Smoothly shrink to disappear over lifetime, keeping strict 1:1 aspect ratio
      const curSize = Math.max(0, p.size * (1 - Math.pow(progress, shrinkExp)));
      if (curSize > 0.3) {
        ctx.drawImage(targetImg, -curSize / 2, -curSize / 2, curSize, curSize);
      }

      ctx.restore();
    }
  } else if (p.type === 'glow_light') {
    // Theme glow light dot with soft core
    const decayRate = trailId === 'particle_electric_shock' ? 0.75 : 0.45;
    const curSize = Math.max(0.4, p.size * (1 - progress * decayRate));
    ctx.globalAlpha = p.alpha * 0.85;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, curSize, 0, Math.PI * 2);
    ctx.fill();

    // Small white pinprick core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, curSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Fine sparkling spark motes
    const decayRate = trailId === 'particle_electric_shock' ? 0.75 : 0.45;
    ctx.globalAlpha = p.alpha * 0.85;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.3, p.size * (1 - progress * decayRate)), 0, Math.PI * 2);
    ctx.fill();
  }
}
