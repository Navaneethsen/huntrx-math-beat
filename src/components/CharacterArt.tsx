import React from 'react';

export type HunterId = 'rumi' | 'mira' | 'zoey';

const HUNTER_AVATAR_META: Record<
  HunterId,
  {
    src: string;
    alt: string;
    borderClass: string;
    bgClass: string;
    glowColor: string;
  }
> = {
  rumi: {
    src: '/images/avatar-rumi.png',
    alt: 'Rumi - Golden Leader',
    borderClass: 'border-amber-300',
    bgClass: 'from-purple-900/90 via-[#1e1035] to-fuchsia-950/95',
    glowColor: 'rgba(251, 191, 36, 0.55)',
  },
  mira: {
    src: '/images/avatar-mira.png',
    alt: 'Mira - Neon Dancer',
    borderClass: 'border-cyan-300',
    bgClass: 'from-pink-950/90 via-[#2a0a2e] to-cyan-950/95',
    glowColor: 'rgba(34, 211, 238, 0.55)',
  },
  zoey: {
    src: '/images/avatar-zoey.png',
    alt: 'Zoey - Maknae Rapper',
    borderClass: 'border-lime-300',
    bgClass: 'from-indigo-950/90 via-[#0f172a] to-emerald-950/95',
    glowColor: 'rgba(163, 230, 53, 0.55)',
  },
};

export const HunterAvatar: React.FC<{
  hunter: HunterId;
  size?: number;
  animate?: boolean;
}> = ({ hunter, size = 76, animate = true }) => {
  const meta = HUNTER_AVATAR_META[hunter];
  return (
    <div
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 18px ${meta.glowColor}`,
      }}
      className={`relative inline-flex items-end justify-center rounded-full overflow-hidden border-2 ${meta.borderClass} bg-gradient-to-b ${meta.bgClass} shrink-0 select-none ${
        animate ? 'animate-float' : ''
      }`}
    >
      <img
        src={meta.src}
        alt={meta.alt}
        draggable={false}
        className="w-[92%] h-[92%] object-contain object-bottom drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]"
      />
    </div>
  );
};

export const DerpyTigerMascot: React.FC<{ size?: number; excited?: boolean }> = ({
  size = 58,
  excited = false,
}) => (
  <div
    style={{ width: size, height: size }}
    className={`relative inline-flex items-center justify-center shrink-0 select-none ${
      excited ? 'animate-bounce' : 'animate-float'
    }`}
  >
    <img
      src="/images/mascot-derpy.png"
      alt="Derpy the Blue Tiger Mascot"
      draggable={false}
      className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.65)]"
    />
  </div>
);

export const SajaDemonBoss: React.FC<{ hpPercent: number; hitFlash?: boolean }> = ({
  hpPercent,
  hitFlash = false,
}) => {
  const isPurified = hpPercent <= 0;
  return (
    <div
      style={{ width: 68, height: 68 }}
      className={`relative inline-flex items-end justify-center rounded-full overflow-hidden border-2 transition-transform duration-200 shrink-0 select-none ${
        isPurified
          ? 'border-amber-300 bg-gradient-to-b from-amber-400/40 via-yellow-500/30 to-amber-900/60 shadow-[0_0_20px_rgba(251,191,36,0.75)]'
          : 'border-rose-500 bg-gradient-to-b from-purple-950 via-[#1f0638] to-rose-950 shadow-[0_0_18px_rgba(244,63,94,0.55)]'
      } ${hitFlash ? 'scale-125 brightness-150' : ''}`}
    >
      <img
        src="/images/boss-saja.png"
        alt="Saja Demon Boss"
        draggable={false}
        className={`w-[94%] h-[94%] object-contain object-bottom transition-all duration-300 ${
          isPurified ? 'sepia brightness-125 saturate-150' : ''
        }`}
      />
    </div>
  );
};
