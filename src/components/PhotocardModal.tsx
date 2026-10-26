import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, X, Gift, Lock, CheckCircle2 } from 'lucide-react';
import { Language } from '../i18n/translations';
import {
  PHOTOCARD_CATALOG,
  PhotocardItem,
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

export const PhotocardModal: React.FC<PhotocardModalProps> = ({
  isOpen,
  onClose,
  lang,
  progress,
  onUnlockCard,
}) => {
  const [newlyPulledCard, setNewlyPulledCard] = useState<PhotocardItem | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  if (!isOpen) return null;

  const PACK_COST = 50;
  const lockedCards = PHOTOCARD_CATALOG.filter(
    (c) => !progress.unlockedCards.includes(c.id)
  );
  const canBuyPack = progress.gems >= PACK_COST && lockedCards.length > 0;

  const handleOpenPack = () => {
    if (!canBuyPack || isOpening) return;
    soundEngine.playHint();
    setIsOpening(true);
    setNewlyPulledCard(null);

    setTimeout(() => {
      const randomCard =
        lockedCards[Math.floor(Math.random() * lockedCards.length)];
      onUnlockCard(randomCard.id, PACK_COST);
      setNewlyPulledCard(randomCard);
      setIsOpening(false);
      soundEngine.playVictoryFanfare();
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#fbbf24', '#ec4899', '#22d3ee', '#a855f7'],
        });
      } catch {
        // ignore
      }
    }, 650);
  };

  return (
    <div
      data-testid="photocard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
    >
      <div className="light-surface-card relative w-full max-w-4xl bg-gradient-to-b from-[#230c47] via-[#15072c] to-[#0a0316] border-2 border-amber-300/70 rounded-3xl p-5 sm:p-6 text-white shadow-[0_0_60px_rgba(236,72,153,0.45)] my-auto max-h-[92vh] flex flex-col">
        <button
          type="button"
          data-testid="close-photocard-btn"
          onClick={() => {
            setNewlyPulledCard(null);
            onClose();
          }}
          className="light-pill-btn absolute top-4 right-4 p-2 rounded-full bg-purple-900/80 hover:bg-purple-800 text-purple-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header + Mystery Pack Gacha Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-700/50 pr-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-300 text-xs font-black mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {lang === 'nl'
                  ? `VERZAMELD: ${progress.unlockedCards.length} / ${PHOTOCARD_CATALOG.length}`
                  : `COLLECTED: ${progress.unlockedCards.length} / ${PHOTOCARD_CATALOG.length}`}
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-3xl text-white">
              {lang === 'nl'
                ? '✨ HUNTR/X Idol Fotoboek & Stickers'
                : '✨ HUNTR/X Idol Photobook & Stickers'}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200">
              {lang === 'nl'
                ? 'Verdien Starlight Gems (💎) met elke rekensom en open mysterie-fotokaarten!'
                : 'Earn Starlight Gems (💎) with every solved puzzle and unbox holographic photocards!'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            <div className="px-3.5 py-2 rounded-2xl bg-purple-950 border border-cyan-400/50 font-display font-black text-base text-cyan-300 flex items-center gap-1.5 shadow">
              <span>💎</span>
              <span>{progress.gems}</span>
            </div>

            {lockedCards.length > 0 ? (
              <button
                type="button"
                disabled={!canBuyPack || isOpening}
                onClick={handleOpenPack}
                className={`px-4 py-2.5 rounded-2xl font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
                  canBuyPack
                    ? 'bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-500 text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.7)] hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Gift className={`w-4 h-4 ${isOpening ? 'animate-spin' : 'animate-bounce'}`} />
                <span>
                  {isOpening
                    ? lang === 'nl'
                      ? 'Openen...'
                      : 'Unboxing...'
                    : lang === 'nl'
                    ? `Open Mysterie Kaart (50 💎)`
                    : `Open Mystery Card (50 💎)`}
                </span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-display font-black text-xs">
                {lang === 'nl' ? '🏆 ALLE KAARTEN COMPLEET!' : '🏆 ALL CARDS UNLOCKED!'}
              </div>
            )}
          </div>
        </div>

        {/* Newly Pulled Holographic Card Reveal Banner */}
        {newlyPulledCard && (
          <div className="my-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/30 via-fuchsia-600/30 to-cyan-500/30 border-2 border-amber-300 flex items-center justify-between gap-4 animate-bounce">
            <div className="flex items-center gap-3.5">
              <img
                src={newlyPulledCard.image}
                alt={newlyPulledCard.title[lang]}
                draggable={false}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)] shrink-0"
              />
              <div>
                <div className="text-xs font-black uppercase text-amber-300">
                  {lang === 'nl' ? '🎉 NIEUWE HOLO-KAART GEOPEND!' : '🎉 NEW HOLO CARD UNBOXED!'}
                </div>
                <div className="font-display font-black text-lg text-white">
                  {newlyPulledCard.title[lang]}
                </div>
                <div className="text-xs text-purple-100">
                  {newlyPulledCard.subtitle[lang]}
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase">
              {newlyPulledCard.rarity}
            </span>
          </div>
        )}

        {/* 12 Photocard Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-4 overflow-y-auto pr-1">
          {PHOTOCARD_CATALOG.map((card) => {
            const unlocked = progress.unlockedCards.includes(card.id);
            const isJustPulled = newlyPulledCard?.id === card.id;
            return (
              <div
                key={card.id}
                className={`group relative rounded-2xl p-3 border-2 transition-all flex flex-col justify-between min-h-[190px] ${
                  unlocked
                    ? `keep-dark-card bg-gradient-to-br ${card.color} border-white/80 text-white shadow-[0_0_20px_rgba(236,72,153,0.35)] ${
                        isJustPulled ? 'ring-4 ring-yellow-300 scale-105' : 'hover:scale-[1.03]'
                      }`
                    : 'bg-purple-950/50 border-purple-800/50 text-purple-400/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      unlocked
                        ? 'bg-black/45 text-amber-200 backdrop-blur-sm'
                        : 'bg-purple-900/60 text-purple-400'
                    }`}
                  >
                    {card.rarity}
                  </span>
                  {unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                  ) : (
                    <Lock className="w-4 h-4 text-purple-500" />
                  )}
                </div>

                <div className="my-2 flex items-center justify-center relative h-24 sm:h-28">
                  {unlocked ? (
                    <img
                      src={card.image}
                      alt={card.title[lang]}
                      draggable={false}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <img
                        src={card.image}
                        alt=""
                        draggable={false}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain brightness-0 opacity-25 select-none pointer-events-none"
                      />
                      <span className="absolute text-2xl sm:text-3xl opacity-60">❓</span>
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-xl p-2 ${
                    unlocked ? 'bg-black/50 backdrop-blur-sm' : 'bg-purple-900/30'
                  }`}
                >
                  <div className="font-display font-black text-xs sm:text-sm leading-tight text-white">
                    {unlocked
                      ? card.title[lang]
                      : lang === 'nl'
                      ? 'Geheime Idol Kaart'
                      : 'Mystery Idol Card'}
                  </div>
                  <div className="text-[10px] text-purple-100/90 mt-0.5 leading-snug">
                    {unlocked
                      ? card.subtitle[lang]
                      : lang === 'nl'
                      ? 'Speel rekenshows om te openen!'
                      : 'Play math shows to unlock!'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
