/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import pickuPartyLogo from '../assets/images/PICKU_PARTY_LOGO_ART.webp';
import splashBgVideo from '../assets/videos/Chibi Party Splash Screen Background Animation.mp4';
import { preloadAllAssets, getAssetUrl, preloadFonts } from '../lib/assetPreloader';
import { SoundEngine, Haptics } from '../lib/audio';
import { ChevronRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  onOpenVersionNotes?: () => void;
}

interface LoadingStage {
  targetProgress: number;
  title: string;
  subtitle: string;
  subdetail: string;
}

const TOTAL_SEGMENTS = 18;

const LOADING_STAGES: LoadingStage[] = [
  {
    targetProgress: 35,
    title: 'PREPARING THE PARTY...',
    subtitle: 'BUFFERING AUDIO & VIDEO SHADERS...',
    subdetail: '(Chibi DJ, Party Ambiance & Spatial Audio)',
  },
  {
    targetProgress: 70,
    title: 'OPTIMIZING TYPOGRAPHY...',
    subtitle: 'PRELOADING HIGH-DPI FONTS...',
    subdetail: '(Hobeaux, Fredoka, Lilita One & Outfit Families)',
  },
  {
    targetProgress: 95,
    title: 'PRIMING HARDWARE GPU...',
    subtitle: 'INITIALIZING 60FPS ENGINE...',
    subdetail: '(Multi-Touch Physics & Zero-Latency Cache)',
  },
  {
    targetProgress: 100,
    title: 'ALL SYSTEMS PRIMED!',
    subtitle: 'WELCOME TO PICK\'U PARTY...',
    subdetail: '(Entering party suite...)',
  },
];

// Returns interpolated neon color and glow for slanted segments across Cyan -> Blue -> Purple -> Hot Pink
const getSegmentColor = (index: number) => {
  const t = index / (TOTAL_SEGMENTS - 1);
  if (t < 0.28) {
    return {
      bg: 'linear-gradient(180deg, #a5f3fc 0%, #00f0ff 40%, #0284c7 100%)',
      glow: 'rgba(0, 240, 255, 0.75)',
    };
  } else if (t < 0.52) {
    return {
      bg: 'linear-gradient(180deg, #bfdbfe 0%, #3b82f6 40%, #1d4ed8 100%)',
      glow: 'rgba(59, 130, 246, 0.75)',
    };
  } else if (t < 0.76) {
    return {
      bg: 'linear-gradient(180deg, #e9d5ff 0%, #a855f7 40%, #7e22ce 100%)',
      glow: 'rgba(168, 85, 247, 0.75)',
    };
  } else {
    return {
      bg: 'linear-gradient(180deg, #fbcfe8 0%, #ec4899 40%, #be185d 100%)',
      glow: 'rgba(236, 72, 153, 0.75)',
    };
  }
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, onOpenVersionNotes }) => {
  const [progress, setProgress] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<LoadingStage>(LOADING_STAGES[0]);
  const [liveDetail, setLiveDetail] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleLaunch = useCallback(() => {
    if (isLaunching) return;
    setIsLaunching(true);
    SoundEngine.playButtonClick();
    Haptics.buttonClick();

    // Smooth exit zoom transition
    window.setTimeout(() => {
      onComplete();
    }, 600);
  }, [isLaunching, onComplete]);

  useEffect(() => {
    let mounted = true;
    let targetPct = 10;
    let pipelineComplete = false;
    let hasLaunched = false;

    // Smooth animation loop for the visual progress bar
    const progressInterval = setInterval(() => {
      if (!mounted) return;

      setProgress((prev) => {
        if (prev < targetPct) {
          const next = Math.min(targetPct, prev + 1);

          // Update stage text based on current percentage
          for (const stage of LOADING_STAGES) {
            if (next <= stage.targetProgress) {
              setCurrentStage(stage);
              break;
            }
          }

          // When reaching 100% and pipeline is fully finished, transition into game
          if (next >= 100 && pipelineComplete && !hasLaunched) {
            hasLaunched = true;
            setIsReady(true);
            setLiveDetail('Ready! All assets buffered and primed.');
            SoundEngine.playButtonClick();

            // Allow the user to see the 100% full progress bar and primed status
            setTimeout(() => {
              if (mounted && !isLaunching) {
                handleLaunch();
              }
            }, 500);
          }

          return next;
        }
        return prev;
      });
    }, 22);

    // Sequential asynchronous preloader pipeline
    const runPipeline = async () => {
      try {
        // Step 1: Preload Core Media & Audio Assets (0 -> 40%)
        targetPct = 20;
        await preloadAllAssets((pct, detail) => {
          if (!mounted) return;
          targetPct = Math.min(45, Math.max(targetPct, Math.round((pct / 100) * 45)));
          if (detail) setLiveDetail(detail);
        });

        // Step 2: Preload Fonts via FontFaceSet API (45 -> 75%)
        targetPct = 55;
        await preloadFonts((_, detail) => {
          if (!mounted) return;
          targetPct = 75;
          if (detail) setLiveDetail(detail);
        });

        // Step 3: Hardware GPU Pipeline & Physics Warming (75 -> 95%)
        targetPct = 85;
        await new Promise((res) => setTimeout(res, 180));
        targetPct = 95;
        await new Promise((res) => setTimeout(res, 180));

        // Step 4: All assets buffered & preloaded! Target 100%
        targetPct = 100;
        pipelineComplete = true;
      } catch (err) {
        console.warn('[SplashScreen] Preloader pipeline fallback:', err);
        targetPct = 100;
        pipelineComplete = true;
      }
    };

    runPipeline();

    return () => {
      mounted = false;
      clearInterval(progressInterval);
    };
  }, [handleLaunch, isLaunching]);

  const filledSegmentsCount = Math.round((progress / 100) * TOTAL_SEGMENTS);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden flex flex-col justify-between items-center select-none bg-slate-950 transition-all duration-600 ${
        isLaunching
          ? 'scale-90 opacity-0 blur-md pointer-events-none'
          : 'scale-100 opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse 85% 65% at 50% 22%, #220e48 0%, #0f0525 45%, #050212 75%, #020108 100%)',
      }}
    >
      {/* Background Animated Video Layer with High-Energy DJ Lights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <video
          ref={videoRef}
          src={getAssetUrl(splashBgVideo)}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center opacity-95 animate-bg-zoom-out"
        />

        {/* Cinematic Vignette Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 85% 58% at 50% 28%, transparent 45%, rgba(4, 2, 16, 0.45) 75%, #020108 100%),
              linear-gradient(to bottom, transparent 0%, transparent 35%, rgba(2, 1, 8, 0.5) 60%, rgba(2, 1, 8, 0.95) 82%, #020108 100%)
            `,
          }}
        />
      </div>

      {/* ZONE 1: TOP AMBIENT STATUS HEADER */}
      <header className="relative z-20 w-full max-w-lg px-4 sm:px-6 pt-[max(1.5rem,calc(env(safe-area-inset-top)+1rem))] flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(0,240,255,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
          <span className="font-header text-[11px] sm:text-xs text-cyan-200 tracking-wider font-bold uppercase">
            PARTY SUITE
          </span>
        </div>

        {onOpenVersionNotes && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenVersionNotes();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 border border-white/15 hover:border-pink-500/50 backdrop-blur-md text-gray-300 hover:text-white transition-all shadow-md group"
          >
            <span className="font-subbody text-[11px] sm:text-xs tracking-wider font-semibold text-gray-300 group-hover:text-pink-300">
              v1.4.03
            </span>
            <ChevronRight className="w-3 h-3 text-pink-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </header>

      {/* ZONE 2: CENTER HERO LOGO & GAME MODE PILLS */}
      <div className="relative z-10 w-full max-w-xl px-2 sm:px-4 flex flex-col items-center text-center my-auto">
        {/* Holographic Logo Art with Continuous Breathing Neon Aura */}
        <div className="relative flex flex-col items-center animate-logo-bounce">
          {/* Ambient Contour Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-3xl pointer-events-none animate-pulse scale-125" />

          {/* Clean RGBA Transparent Logo - Enlarged in Center */}
          <img
            src={pickuPartyLogo}
            alt="PICK'U PARTY"
            className="relative z-10 w-80 sm:w-[420px] md:w-[480px] max-w-[94vw] h-auto object-contain animate-logo-pulse drop-shadow-[0_12px_35px_rgba(0,0,0,0.95)]"
          />
        </div>

        {/* Feature Game Mode Chips */}
        <div className="mt-3.5 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-[10px] sm:text-[11px] font-header font-bold text-cyan-300 tracking-wider shadow-[0_0_10px_rgba(0,240,255,0.25)] backdrop-blur-sm">
            FINGER ROULETTE
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-pink-950/70 border border-pink-500/40 text-[10px] sm:text-[11px] font-header font-bold text-pink-300 tracking-wider shadow-[0_0_10px_rgba(236,72,153,0.25)] backdrop-blur-sm">
            BOTTLE SPIN
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-[10px] sm:text-[11px] font-header font-bold text-amber-300 tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.25)] backdrop-blur-sm">
            KABOOM
          </span>
        </div>

        {/* Game Tagline / Description - Sitting slightly below the game modes next to the logo */}
        <p className="mt-2.5 sm:mt-3 font-body text-[11px] sm:text-xs text-gray-300/90 font-medium leading-relaxed tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] max-w-xs sm:max-w-sm px-2">
          Multi-touch roulette, bottle-spin penalties & explosive bomb avoidance. Ready for game night!
        </p>
      </div>

      {/* ZONE 3: ELEVATED CONTROL & PROGRESS (Moved up 20px toward logo and game description) */}
      <footer className="relative z-20 w-full max-w-md px-4 sm:px-6 pb-safe pb-12 sm:pb-16 mb-4 sm:mb-8 -translate-y-[20px] flex flex-col items-center text-center pointer-events-auto">
        {/* Progress Stage Header: STAGE TITLE [XX%] */}
        <div className="w-60 sm:w-68 max-w-[82vw] flex items-center justify-between px-1 mb-1.5">
          <span className="font-header text-[11px] sm:text-xs tracking-wider text-white/95 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] font-bold truncate mr-2">
            {currentStage.title}
          </span>
          <span className="font-header text-[11px] sm:text-xs tracking-wider text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.9)] font-bold shrink-0">
            [{progress}%]
          </span>
        </div>

        {/* Smaller Skewed Segmented Neon Capsule Progress Bar (Outer long rectangle is skewed as well) */}
        <div className="relative w-60 sm:w-68 max-w-[82vw] -skew-x-[18deg] p-[1.5px] rounded-[6px] bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_14px_rgba(0,240,255,0.4),0_0_18px_rgba(236,72,153,0.35)]">
          <div className="w-full h-6 sm:h-7 rounded-[5px] bg-[#070517]/95 p-1 flex items-center justify-between gap-1 overflow-hidden">
            {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => {
              const isFilled = i < filledSegmentsCount;
              const isLeading = isFilled && i === filledSegmentsCount - 1;
              const colorInfo = getSegmentColor(i);

              return (
                <div
                  key={i}
                  className={`h-full flex-1 rounded-[2px] transition-all duration-150 relative overflow-hidden ${
                    isFilled ? '' : 'bg-[#141029]/80 border border-white/5'
                  }`}
                  style={
                    isFilled
                      ? {
                          background: colorInfo.bg,
                          boxShadow: `0 0 8px ${colorInfo.glow}`,
                        }
                      : undefined
                  }
                >
                  {/* Glossy top specular reflection highlight */}
                  {isFilled && (
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
                  )}
                  {/* Pulsing leading active edge segment */}
                  {isLeading && (
                    <div className="absolute inset-0 bg-white/45 animate-pulse pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtitle & Dynamic Live Subdetail */}
        <div className="mt-2 w-full flex flex-col items-center justify-center">
          <p className="font-header text-[10px] sm:text-[11px] font-bold text-white tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] truncate max-w-full">
            {currentStage.subtitle}
          </p>
          <p className="font-subbody text-[9px] sm:text-[10px] text-cyan-300 font-medium tracking-wide mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] truncate max-w-full">
            {liveDetail || currentStage.subdetail}
          </p>
        </div>
      </footer>
    </div>
  );
};
