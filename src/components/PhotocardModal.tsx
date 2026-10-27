import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  X,
  Gift,
  Lock,
  CheckCircle2,
  BookOpen,
  Quote,
  Volume2,
} from 'lucide-react';
import { Language } from '../i18n/translations';
import {
  PHOTOCARD_CATALOG,
  RARITY_COSTS,
  PhotocardItem,
  PhotocardRarity,
  PhotocardCategory,
  PlayerProgress,
} from '../engine/progressionStore';
import { soundEngine } from '../audio/soundEngine';

interface PhotocardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  progress: PlayerProgress;
  onUnlockCard: (cardId: string, cost: number) => void;
}

type FilterTab = 'all' | 'unlocked' | PhotocardCategory;

const CATEGORY_LABELS: Record<
  FilterTab,
  { nl: string; en: string; emoji: string }
> = {
  all: { nl: 'Alle (100)', en: 'All (100)', emoji: '✨' },
  unlocked: { nl: 'Verzameld', en: 'Unlocked', emoji: '🔓' },
  huntrx: { nl: 'HUNTR/X', en: 'HUNTR/X', emoji: '🎤' },
  saja: { nl: 'Saja Boys', en: 'Saja Boys', emoji: '🥤' },
  weapons: { nl: 'Wapens & Honmoon', en: 'Weapons & Seals', emoji: '⚔️' },
  songs: { nl: 'Songs & Podium', en: 'Songs & Stages', emoji: '🎵' },
  allies: { nl: 'Geesten & Vrienden', en: 'Spirits & Allies', emoji: '🐯' },
  seoul: { nl: 'Seoul & Cultuur', en: 'Seoul & Lore', emoji: '🍜' },
};

const RARITY_BADGE_STYLES: Record<
  PhotocardRarity,
  {
    symbol: string;
    shapeNameNl: string;
    shapeNameEn: string;
    labelNl: string;
    labelEn: string;
    pillClass: string;
    clipPath: string;
    unlockedStroke: string;
    unlockedGlow: string;
  }
> = {
  common: {
    symbol: '●',
    shapeNameNl: 'Cirkel',
    shapeNameEn: 'Circle',
    labelNl: '● Common • 100 💎',
    labelEn: '● Common • 100 💎',
    pillClass: 'bg-cyan-500/25 border-cyan-300/60 text-cyan-200',
    clipPath: 'circle(46% at 50% 50%)',
    unlockedStroke: '#22d3ee',
    unlockedGlow: 'drop-shadow(0 0 8px rgba(34,211,238,0.65))',
  },
  rare: {
    symbol: '◆',
    shapeNameNl: 'Diamant',
    shapeNameEn: 'Diamond',
    labelNl: '◆ Rare • 200 💎',
    labelEn: '◆ Rare • 200 💎',
    pillClass: 'bg-purple-500/30 border-purple-300/70 text-purple-100',
    clipPath: 'polygon(50% 3%, 97% 50%, 50% 97%, 3% 50%)',
    unlockedStroke: '#c084fc',
    unlockedGlow: 'drop-shadow(0 0 10px rgba(192,132,252,0.75))',
  },
  epic: {
    symbol: '⬢',
    shapeNameNl: 'Hexagon',
    shapeNameEn: 'Hexagon',
    labelNl: '⬢ Epic • 350 💎',
    labelEn: '⬢ Epic • 350 💎',
    pillClass: 'bg-pink-500/30 border-pink-300/80 text-pink-100',
    clipPath: 'polygon(50% 3%, 93% 26.5%, 93% 73.5%, 50% 97%, 7% 73.5%, 7% 26.5%)',
    unlockedStroke: '#f472b6',
    unlockedGlow: 'drop-shadow(0 0 11px rgba(244,114,182,0.8))',
  },
  golden: {
    symbol: '★',
    shapeNameNl: 'Ster',
    shapeNameEn: 'Star',
    labelNl: '★ Golden • 600 💎',
    labelEn: '★ Golden • 600 💎',
    pillClass: 'bg-amber-400/30 border-amber-300 text-amber-200',
    clipPath:
      'polygon(50% 2%, 66% 27%, 97% 35%, 76% 58%, 80% 90%, 50% 76%, 20% 90%, 24% 58%, 3% 35%, 34% 27%)',
    unlockedStroke: '#fbbf24',
    unlockedGlow: 'drop-shadow(0 0 13px rgba(251,191,36,0.9))',
  },
};

const RarityShapeOutline: React.FC<{
  rarity: PhotocardRarity;
  unlocked: boolean;
}> = ({ rarity, unlocked }) => {
  const stroke = unlocked ? RARITY_BADGE_STYLES[rarity].unlockedStroke : '#64748b';
  const strokeWidth = rarity === 'golden' ? 3.5 : 3;

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      aria-hidden="true"
    >
      {rarity === 'common' && (
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
      {rarity === 'rare' && (
        <polygon
          points="50,3 97,50 50,97 3,50"
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}
      {rarity === 'epic' && (
        <polygon
          points="50,3 93,26.5 93,73.5 50,97 7,73.5 7,26.5"
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}
      {rarity === 'golden' && (
        <polygon
          points="50,2 66,27 97,35 76,58 80,90 50,76 20,90 24,58 3,35 34,27"
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

export const PhotocardModal: React.FC<PhotocardModalProps> = ({
  isOpen,
  onClose,
  lang,
  progress,
  onUnlockCard,
}) => {
  const [newlyPulledCard, setNewlyPulledCard] = useState<PhotocardItem | null>(
    null
  );
  const [selectedCard, setSelectedCard] = useState<PhotocardItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<FilterTab>('all');
  const [activeRarity, setActiveRarity] = useState<PhotocardRarity | 'all'>(
    'all'
  );
  const [isOpening, setIsOpening] = useState(false);

  const lockedCards = useMemo(
    () =>
      PHOTOCARD_CATALOG.filter((c) => !progress.unlockedCards.includes(c.id)),
    [progress.unlockedCards]
  );

  const filteredCards = useMemo(() => {
    return PHOTOCARD_CATALOG.filter((card) => {
      if (
        activeCategory === 'unlocked' &&
        !progress.unlockedCards.includes(card.id)
      ) {
        return false;
      }
      if (
        activeCategory !== 'all' &&
        activeCategory !== 'unlocked' &&
        card.category !== activeCategory
      ) {
        return false;
      }
      if (activeRarity !== 'all' && card.rarity !== activeRarity) {
        return false;
      }
      return true;
    });
  }, [activeCategory, activeRarity, progress.unlockedCards]);

  if (!isOpen) return null;

  // Find lowest cost locked card or tier pack
  const lockedByRarity = (rarity: PhotocardRarity) =>
    lockedCards.filter((c) => c.rarity === rarity);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#fbbf24', '#ec4899', '#22d3ee', '#a855f7'],
      });
    } catch {
      // ignore in headless environments
    }
  };

  const handleOpenTierPack = (rarity: PhotocardRarity) => {
    const pool = lockedByRarity(rarity);
    const cost = RARITY_COSTS[rarity];
    if (pool.length === 0 || progress.gems < cost || isOpening) return;

    soundEngine.playCardOpen();
    setIsOpening(true);
    setNewlyPulledCard(null);

    setTimeout(() => {
      const randomCard = pool[Math.floor(Math.random() * pool.length)];
      onUnlockCard(randomCard.id, cost);
      setNewlyPulledCard(randomCard);
      setSelectedCard(randomCard);
      setIsOpening(false);
      soundEngine.playCardUnlock(randomCard.rarity);
      triggerConfetti();
    }, 520);
  };

  const handleDirectUnlockCard = (card: PhotocardItem) => {
    if (
      progress.unlockedCards.includes(card.id) ||
      progress.gems < card.cost ||
      isOpening
    ) {
      return;
    }
    onUnlockCard(card.id, card.cost);
    setNewlyPulledCard(card);
    setSelectedCard(card);
    soundEngine.playCardUnlock(card.rarity);
    triggerConfetti();
  };

  const handleInspectCard = (card: PhotocardItem) => {
    soundEngine.playCardOpen();
    setSelectedCard(card);
  };

  // Next affordable pack tier for quick button
  const nextPackTier: PhotocardRarity =
    lockedByRarity('common').length > 0
      ? 'common'
      : lockedByRarity('rare').length > 0
      ? 'rare'
      : lockedByRarity('epic').length > 0
      ? 'epic'
      : 'golden';
  const nextPackCost = RARITY_COSTS[nextPackTier];
  const canBuyQuickPack =
    lockedByRarity(nextPackTier).length > 0 && progress.gems >= nextPackCost;

  const isSelectedUnlocked = selectedCard
    ? progress.unlockedCards.includes(selectedCard.id)
    : false;

  return (
    <div
      data-testid="photocard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div className="light-surface-card relative w-full max-w-5xl bg-gradient-to-b from-[#230c47] via-[#15072c] to-[#0a0316] border-2 border-amber-300/70 rounded-3xl p-4 sm:p-6 text-white shadow-[0_0_60px_rgba(236,72,153,0.45)] my-auto max-h-[94vh] flex flex-col">
        <button
          type="button"
          data-testid="close-photocard-btn"
          onClick={() => {
            setNewlyPulledCard(null);
            setSelectedCard(null);
            onClose();
          }}
          className="light-pill-btn absolute top-4 right-4 p-2 rounded-full bg-purple-900/80 hover:bg-purple-800 text-purple-200 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header + Mystery Pack Gacha Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-purple-700/50 pr-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-300 text-xs font-black mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span data-testid="photocard-collected-count">
                {lang === 'nl'
                  ? `VERZAMELD: ${progress.unlockedCards.length} / ${PHOTOCARD_CATALOG.length}`
                  : `COLLECTED: ${progress.unlockedCards.length} / ${PHOTOCARD_CATALOG.length}`}
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white">
              {lang === 'nl'
                ? '✨ HUNTR/X 100-Kaarten Lore Album & Encyclopedie'
                : '✨ HUNTR/X 100-Card Lore Album & Encyclopedia'}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200">
              {lang === 'nl'
                ? 'Klik op een kaart om KPop Demon Hunters verhalen, film-citaten & rekenkrachten te ontdekken!'
                : 'Click any card to hear its chime and discover KPop Demon Hunters lore, movie quotes & math powers!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
            <div
              data-testid="photocard-gems-balance"
              className="px-3.5 py-2 rounded-2xl bg-purple-950 border border-cyan-400/50 font-display font-black text-base text-cyan-300 flex items-center gap-1.5 shadow"
            >
              <span>💎</span>
              <span>{progress.gems}</span>
            </div>

            {lockedCards.length > 0 ? (
              <button
                type="button"
                data-testid="open-mystery-pack-btn"
                disabled={!canBuyQuickPack || isOpening}
                onClick={() => handleOpenTierPack(nextPackTier)}
                className={`px-4 py-2.5 rounded-2xl font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
                  canBuyQuickPack
                    ? 'bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-500 text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.7)] hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Gift
                  className={`w-4 h-4 ${
                    isOpening ? 'animate-spin' : 'animate-bounce'
                  }`}
                />
                <span>
                  {isOpening
                    ? lang === 'nl'
                      ? 'Openen...'
                      : 'Unboxing...'
                    : lang === 'nl'
                    ? `Open ${nextPackTier.toUpperCase()} Pakket (${nextPackCost} 💎)`
                    : `Open ${nextPackTier.toUpperCase()} Pack (${nextPackCost} 💎)`}
                </span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-display font-black text-xs">
                {lang === 'nl'
                  ? '🏆 ALLE 100 KAARTEN COMPLEET!'
                  : '🏆 ALL 100 CARDS UNLOCKED!'}
              </div>
            )}
          </div>
        </div>

        {/* Tiered Pack Buttons + Rarity Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 border-b border-purple-800/40">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {(Object.keys(CATEGORY_LABELS) as FilterTab[]).map((tab) => {
              const info = CATEGORY_LABELS[tab];
              const isActive = activeCategory === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  data-testid={`photocard-tab-${tab}`}
                  onClick={() => {
                    soundEngine.playSelect();
                    setActiveCategory(tab);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 font-black shadow'
                      : 'bg-purple-900/50 hover:bg-purple-800/70 text-purple-200 border border-purple-700/50'
                  }`}
                >
                  <span>{info.emoji}</span>
                  <span>{info[lang]}</span>
                </button>
              );
            })}
          </div>

          {/* Rarity Tier Filter & Pack Prices */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveRarity('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase border ${
                activeRarity === 'all'
                  ? 'bg-white text-slate-950 border-white'
                  : 'bg-purple-950/60 text-purple-300 border-purple-700/50'
              }`}
            >
              {lang === 'nl' ? 'Alle Rangen' : 'All Tiers'}
            </button>
            {(['common', 'rare', 'epic', 'golden'] as PhotocardRarity[]).map(
              (r) => {
                const badge = RARITY_BADGE_STYLES[r];
                const remaining = lockedByRarity(r).length;
                return (
                  <button
                    key={r}
                    type="button"
                    data-testid={`photocard-rarity-${r}`}
                    onClick={() =>
                      setActiveRarity((prev) => (prev === r ? 'all' : r))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all ${
                      activeRarity === r
                        ? 'ring-2 ring-amber-300 scale-105 ' + badge.pillClass
                        : badge.pillClass + ' opacity-80 hover:opacity-100'
                    }`}
                  >
                    {lang === 'nl' ? badge.labelNl : badge.labelEn} (
                    {remaining > 0 ? `${remaining} 🔒` : '✓'})
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Selected Card Lore & Quote Inspector Drawer / Modal */}
        {selectedCard && (
          <div
            data-testid="photocard-lore-inspector"
            className="my-3 p-4 rounded-2xl bg-gradient-to-br from-[#2d125c] via-[#1c0a3a] to-[#110526] border-2 border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.35)] animate-fadeIn"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0"
                  style={{
                    filter: isSelectedUnlocked
                      ? RARITY_BADGE_STYLES[selectedCard.rarity].unlockedGlow
                      : 'none',
                  }}
                >
                  <div
                    className={`w-full h-full overflow-hidden bg-slate-950 ${
                      isSelectedUnlocked
                        ? ''
                        : 'grayscale contrast-95 brightness-75 opacity-75'
                    }`}
                    style={{
                      clipPath: RARITY_BADGE_STYLES[selectedCard.rarity].clipPath,
                    }}
                  >
                    <img
                      src={selectedCard.image}
                      alt={selectedCard.title[lang]}
                      draggable={false}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <RarityShapeOutline
                    rarity={selectedCard.rarity}
                    unlocked={isSelectedUnlocked}
                  />
                  <span className="absolute -top-1 -left-1 z-20 px-2 py-0.5 rounded-full bg-slate-950 border border-amber-300 text-amber-300 font-black text-[10px]">
                    #{String(selectedCard.cardNumber).padStart(3, '0')}
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                      {RARITY_BADGE_STYLES[selectedCard.rarity].symbol}{' '}
                      {selectedCard.rarity} (
                      {lang === 'nl'
                        ? RARITY_BADGE_STYLES[selectedCard.rarity].shapeNameNl
                        : RARITY_BADGE_STYLES[selectedCard.rarity].shapeNameEn}
                      ) • {selectedCard.cost} 💎
                    </span>
                    <span
                      data-testid="inspector-card-excitement"
                      className="px-2.5 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/60 text-rose-200 font-black text-[10px]"
                    >
                      🔥 {selectedCard.excitement}/100 HYPE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-800/80 text-purple-100 font-bold text-[10px]">
                      {CATEGORY_LABELS[selectedCard.category]?.emoji}{' '}
                      {CATEGORY_LABELS[selectedCard.category]?.[lang]}
                    </span>
                    {isSelectedUnlocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-400 text-emerald-200 font-black text-[10px]">
                        {lang === 'nl' ? '✓ VERZAMELD' : '✓ COLLECTED'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-900/90 border border-cyan-400/40 text-cyan-200 font-black text-[10px]">
                        🔒 {selectedCard.cost} 💎
                      </span>
                    )}
                    {newlyPulledCard?.id === selectedCard.id && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px]">
                        {lang === 'nl' ? '🎉 NET GEOPEND!' : '🎉 JUST UNBOXED!'}
                      </span>
                    )}
                  </div>

                  <h3
                    data-testid="inspector-card-title"
                    className="font-display font-black text-lg sm:text-xl text-white"
                  >
                    {selectedCard.title[lang]}
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-200 font-semibold">
                    {selectedCard.subtitle[lang]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  data-testid="inspector-replay-sound-btn"
                  onClick={() => soundEngine.playCardOpen()}
                  title={lang === 'nl' ? 'Speel kaartgeluid' : 'Play card chime'}
                  className="p-2 rounded-xl bg-purple-800/70 hover:bg-purple-700 text-cyan-200 border border-cyan-400/40 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                {!isSelectedUnlocked && (
                  <button
                    type="button"
                    data-testid="inspector-unlock-card-btn"
                    disabled={progress.gems < selectedCard.cost}
                    onClick={() => handleDirectUnlockCard(selectedCard)}
                    className={`px-3.5 py-2 rounded-xl font-display font-black text-xs flex items-center gap-1.5 transition-all ${
                      progress.gems >= selectedCard.cost
                        ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 shadow-lg hover:scale-105 cursor-pointer'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>
                      {lang === 'nl'
                        ? `Koop Kaart (${selectedCard.cost} 💎)`
                        : `Unlock Card (${selectedCard.cost} 💎)`}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  data-testid="close-inspector-btn"
                  onClick={() => setSelectedCard(null)}
                  className="px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-xs font-bold text-purple-200 cursor-pointer"
                >
                  {lang === 'nl' ? 'Sluiten' : 'Close'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-purple-700/50">
              <div className="p-3 rounded-xl bg-black/40 border border-purple-500/40">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-cyan-300 mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'nl'
                      ? '📖 KPop Demon Hunters Wiki Weetje'
                      : '📖 KPop Demon Hunters Fandom Lore'}
                  </span>
                </div>
                <p
                  data-testid="inspector-card-lore"
                  className="text-xs sm:text-sm text-purple-100 leading-relaxed"
                >
                  {selectedCard.lore[lang]}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-amber-400/40 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-300 mb-1">
                    <Quote className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'nl'
                        ? '🎬 Film Transcript Citaat'
                        : '🎬 Movie Transcript Quote'}
                    </span>
                  </div>
                  <p
                    data-testid="inspector-card-quote"
                    className="text-xs sm:text-sm italic text-amber-100 font-semibold"
                  >
                    {selectedCard.quote[lang]}
                  </p>
                </div>

                <div className="text-[11px] font-black text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-lg px-2.5 py-1">
                  {selectedCard.mathBonus[lang]}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 100 Photocard Grid */}
        <div
          data-testid="photocard-grid"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 overflow-y-auto pr-1"
        >
          {filteredCards.map((card) => {
            const unlocked = progress.unlockedCards.includes(card.id);
            const isJustPulled = newlyPulledCard?.id === card.id;
            const isSelected = selectedCard?.id === card.id;
            const rarityStyle = RARITY_BADGE_STYLES[card.rarity];
            return (
              <button
                key={card.id}
                type="button"
                data-testid={`photocard-item-${card.id}`}
                data-shape={rarityStyle.shapeNameEn.toLowerCase()}
                data-collected={unlocked ? 'true' : 'false'}
                onClick={() => handleInspectCard(card)}
                className={`group text-left relative rounded-2xl p-2.5 border-2 transition-all flex flex-col justify-between min-h-[215px] cursor-pointer ${
                  unlocked
                    ? `keep-dark-card bg-gradient-to-br ${card.color} border-white/85 text-white shadow-[0_0_22px_rgba(236,72,153,0.4)] ${
                        isJustPulled || isSelected
                          ? 'ring-4 ring-yellow-300 scale-[1.03]'
                          : 'hover:scale-[1.03]'
                      }`
                    : `keep-dark-card bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-slate-700/70 text-slate-400 hover:border-slate-500 hover:scale-[1.02] ${
                        isSelected
                          ? 'ring-2 ring-amber-300 border-amber-300'
                          : ''
                      }`
                }`}
              >
                <div className="relative z-10 flex items-center justify-between w-full gap-1">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      unlocked
                        ? 'bg-black/55 text-amber-200 backdrop-blur-sm'
                        : 'bg-slate-800/90 text-slate-400 border border-slate-700'
                    }`}
                  >
                    #{card.cardNumber} • 🔥{card.excitement}
                  </span>
                  {unlocked ? (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-400/50 flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      {card.cost}💎
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-600/60 flex items-center gap-0.5 shrink-0">
                      <Lock className="w-2.5 h-2.5" />
                      {card.cost}💎
                    </span>
                  )}
                </div>

                {/* Rarity-Shaped Medallion (Star / Hexagon / Diamond / Circle) */}
                <div className="my-2 flex items-center justify-center relative w-full">
                  <div
                    className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center"
                    style={{
                      filter: unlocked ? rarityStyle.unlockedGlow : 'none',
                    }}
                  >
                    <div
                      className={`w-full h-full overflow-hidden bg-slate-950 transition-all duration-300 ${
                        unlocked
                          ? ''
                          : 'grayscale contrast-95 brightness-70 opacity-55 group-hover:opacity-75'
                      }`}
                      style={{
                        clipPath: rarityStyle.clipPath,
                      }}
                    >
                      <img
                        src={card.image}
                        alt={card.title[lang]}
                        draggable={false}
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <RarityShapeOutline
                      rarity={card.rarity}
                      unlocked={unlocked}
                    />
                  </div>

                  <span
                    className={`absolute bottom-0 right-1 z-20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                      unlocked
                        ? 'bg-black/80 text-amber-300 border-amber-400/60 shadow'
                        : 'bg-slate-900/90 text-slate-400 border-slate-700'
                    }`}
                  >
                    {rarityStyle.symbol} {card.rarity}
                  </span>
                </div>

                <div
                  className={`relative z-10 rounded-xl p-2 w-full ${
                    unlocked
                      ? 'bg-black/60 backdrop-blur-sm'
                      : 'bg-slate-950/80 border border-slate-800/80'
                  }`}
                >
                  <div
                    className={`font-display font-black text-xs leading-tight truncate ${
                      unlocked ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {card.title[lang]}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${
                      unlocked ? 'text-purple-100/90' : 'text-slate-500'
                    }`}
                  >
                    {card.subtitle[lang]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
