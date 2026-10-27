import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Lock, Play, RotateCcw, Star } from 'lucide-react';
import type { Language } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';
import { DerpyTigerMascot, HunterAvatar, HunterId, SajaDemonBoss } from './CharacterArt';
import {
  CLOCK_BOSS_HP,
  CLOCK_LEVELS,
  CLOCK_QUESTIONS_PER_STAGE,
  CLOCK_REWARDS,
  ClockTask,
  ClockTime,
  MAX_CLOCK_LEVEL,
  buildClockStageDeck,
  clockStars,
  explainDayTime,
  explainDuration,
  explainTime,
  formatDigital,
  formatDuration,
  fromMinutes,
  generateClockTask,
  getClockLevel,
  handAngles,
  isSetAnswerCorrect,
  phrase,
  phraseWithDayPart,
  setSnapMinutes,
  toMinutes,
} from '../engine/clockEngine';
import {
  CLOCK_CHAPTERS,
  CLOCK_EVENTS,
  CLOCK_REACTIONS,
  StorySpeaker,
  getChapter,
  pickLine,
  taskPrompt,
} from '../engine/clockStory';

export type ClockMood = 'menu' | 'stage' | 'fever' | 'victory';

interface ClockQuestProps {
  lang: Language;
  hunter: HunterId;
  playerName: string;
  gems: number;
  clockLevelUnlocked: number;
  clockStars: Record<string, number>;
  onEarnReward: (gems: number, xp: number) => void;
  onLevelComplete: (levelId: number, stars: number) => void;
  onOpenPhotocards: () => void;
  onExit: () => void;
  onMoodChange?: (mood: ClockMood) => void;
}

type Phase = 'map' | 'story' | 'play' | 'bossIntro' | 'boss' | 'summary';

interface Feedback {
  correct: boolean;
  chosenIndex: number | null;
  message: string;
  explanation: string;
  gems: number;
}

const PHOTOCARD_PROMPT_GEMS = 50;

// ==================== Analog clock (SVG) ====================

interface AnalogClockProps {
  time: ClockTime;
  size?: number | string;
  interactive?: boolean;
  snapMinutes?: number;
  onChange?: (t: ClockTime) => void;
  show24h?: boolean;
  glow?: 'none' | 'correct' | 'wrong' | 'fever';
  compact?: boolean;
  testId?: string;
}

export const AnalogClock: React.FC<AnalogClockProps> = ({
  time,
  size = 240,
  interactive = false,
  snapMinutes = 5,
  onChange,
  show24h = false,
  glow = 'none',
  compact = false,
  testId,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const timeRef = useRef(time);
  timeRef.current = time;
  const { hour, minute } = handAngles(time);

  const minuteFromPointer = (clientX: number, clientY: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < rect.width * 0.06) return null;
    let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return (Math.round(deg / 6 / snapMinutes) * snapMinutes) % 60;
  };

  // Turning the long hand past 12 moves the short hand on, like a real clock.
  const applyMinute = (m: number) => {
    const prev = timeRef.current;
    if (m === prev.m || !onChange) return;
    let h = prev.h;
    if (prev.m >= 45 && m < 15) h += 1;
    else if (prev.m < 15 && m >= 45) h -= 1;
    const next = { h: ((h % 24) + 24) % 24, m };
    timeRef.current = next;
    onChange(next);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const m = minuteFromPointer(e.clientX, e.clientY);
    if (m !== null) applyMinute(m);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive || !dragging.current) return;
    const m = minuteFromPointer(e.clientX, e.clientY);
    if (m !== null) applyMinute(m);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };
  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (!interactive || !onChange) return;
    const delta =
      e.key === 'ArrowUp' || e.key === 'ArrowRight' ? snapMinutes : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -snapMinutes : 0;
    if (!delta) return;
    e.preventDefault();
    onChange(fromMinutes(toMinutes(timeRef.current) + delta));
  };

  const glowClass =
    glow === 'correct'
      ? 'drop-shadow-[0_0_22px_rgba(52,211,153,0.9)]'
      : glow === 'wrong'
      ? 'drop-shadow-[0_0_22px_rgba(244,63,94,0.9)] animate-shake'
      : glow === 'fever'
      ? 'drop-shadow-[0_0_26px_rgba(251,191,36,0.95)]'
      : 'drop-shadow-[0_0_18px_rgba(236,72,153,0.45)]';

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      style={{ width: size, height: size, touchAction: interactive ? 'none' : undefined }}
      className={`select-none ${glowClass} ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}`}
      data-testid={testId}
      data-time={`${time.h % 12}:${time.m}`}
      role={interactive ? 'slider' : 'img'}
      aria-label={interactive ? 'Clock' : undefined}
      aria-valuetext={interactive ? formatDigital(time, false) : undefined}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <defs>
        <linearGradient id="clockRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <radialGradient id="clockFace" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#3b0a57" />
          <stop offset="100%" stopColor="#14072e" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#clockRing)" />
      <circle cx="100" cy="100" r="89" fill="url(#clockFace)" />
      {Array.from({ length: 60 }, (_, i) => {
        const big = i % 5 === 0;
        const a = (i * 6 * Math.PI) / 180;
        const r1 = big ? 75 : 79;
        return (
          <line
            key={i}
            x1={100 + Math.sin(a) * r1}
            y1={100 - Math.cos(a) * r1}
            x2={100 + Math.sin(a) * 84}
            y2={100 - Math.cos(a) * 84}
            stroke={big ? '#fbbf24' : '#c4b5fd'}
            strokeOpacity={big ? 1 : 0.55}
            strokeWidth={big ? 2.6 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = (n * 30 * Math.PI) / 180;
        const r = show24h ? 62 : 64;
        return (
          <text
            key={n}
            x={100 + Math.sin(a) * r}
            y={100 - Math.cos(a) * r}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize={compact ? 17 : 15}
            fontWeight={900}
            fontFamily="inherit"
          >
            {n}
          </text>
        );
      })}
      {show24h &&
        Array.from({ length: 12 }, (_, i) => {
          const n = i + 13;
          const a = ((i + 1) * 30 * Math.PI) / 180;
          return (
            <text
              key={n}
              x={100 + Math.sin(a) * 45}
              y={100 - Math.cos(a) * 45}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#67e8f9"
              fontSize={8.5}
              fontWeight={800}
            >
              {n === 24 ? '00' : n}
            </text>
          );
        })}
      {/* Short hour hand (gold) */}
      <line
        x1="100"
        y1="100"
        x2={100 + Math.sin((hour * Math.PI) / 180) * 42}
        y2={100 - Math.cos((hour * Math.PI) / 180) * 42}
        stroke="#fbbf24"
        strokeWidth="8"
        strokeLinecap="round"
        style={{ transition: dragging.current ? undefined : 'all 0.35s ease' }}
      />
      {/* Long minute hand (pink) */}
      <line
        x1="100"
        y1="100"
        x2={100 + Math.sin((minute * Math.PI) / 180) * 70}
        y2={100 - Math.cos((minute * Math.PI) / 180) * 70}
        stroke="#f472b6"
        strokeWidth="4.5"
        strokeLinecap="round"
        style={{ transition: dragging.current ? undefined : 'all 0.35s ease' }}
      />
      {interactive && (
        <circle
          cx={100 + Math.sin((minute * Math.PI) / 180) * 70}
          cy={100 - Math.cos((minute * Math.PI) / 180) * 70}
          r="8"
          fill="#f472b6"
          stroke="#ffffff"
          strokeWidth="2"
          className="animate-pulse"
        />
      )}
      <circle cx="100" cy="100" r="6.5" fill="#fde68a" stroke="#ec4899" strokeWidth="2" />
    </svg>
  );
};

const DigitalClock: React.FC<{ text: string; big?: boolean }> = ({ text, big = true }) => (
  <div
    className={`inline-flex items-center justify-center rounded-2xl bg-[#0b0420] border-2 border-cyan-300/70 shadow-[0_0_24px_rgba(34,211,238,0.45)] font-mono font-black tracking-widest text-cyan-200 ${
      big ? 'px-6 py-3 text-4xl sm:text-5xl' : 'px-3 py-1.5 text-2xl'
    }`}
    data-testid="clock-digital"
  >
    {text}
  </div>
);

// ==================== Story speaker bubble ====================

const SpeakerAvatar: React.FC<{ speaker: StorySpeaker; size?: number }> = ({ speaker, size = 64 }) => {
  if (speaker === 'derpy') return <DerpyTigerMascot size={size} />;
  if (speaker === 'boss') return <SajaDemonBoss hpPercent={100} />;
  return <HunterAvatar hunter={speaker} size={size} animate={false} />;
};

const SPEAKER_NAME: Record<Exclude<StorySpeaker, 'boss'>, string> = {
  rumi: 'Rumi',
  mira: 'Mira',
  zoey: 'Zoey',
  derpy: 'Derpy',
};

// ==================== Main component ====================

export const ClockQuest: React.FC<ClockQuestProps> = ({
  lang,
  hunter,
  playerName,
  gems,
  clockLevelUnlocked,
  clockStars: savedStars,
  onEarnReward,
  onLevelComplete,
  onOpenPhotocards,
  onExit,
  onMoodChange,
}) => {
  const nl = lang === 'nl';
  const [phase, setPhase] = useState<Phase>('map');
  const [levelId, setLevelId] = useState(() => Math.min(clockLevelUnlocked, MAX_CLOCK_LEVEL));
  const [storyIndex, setStoryIndex] = useState(0);
  const [deck, setDeck] = useState<ClockTask[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [bossTask, setBossTask] = useState<ClockTask | null>(null);
  const [bossHp, setBossHp] = useState(CLOCK_BOSS_HP);
  const [bossFlash, setBossFlash] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [sessionGems, setSessionGems] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [setTime, setSetTime] = useState<ClockTime>({ h: 12, m: 0 });
  const [finalStars, setFinalStars] = useState<1 | 2 | 3>(1);
  const advanceTimer = useRef<number | null>(null);

  const level = getClockLevel(levelId);
  const chapter = getChapter(levelId);
  const fever = streak >= CLOCK_REWARDS.feverStreak;
  const task = phase === 'boss' ? bossTask : deck[qIndex] ?? null;

  useEffect(() => {
    const mood: ClockMood =
      phase === 'summary' ? 'victory' : phase === 'play' || phase === 'boss' ? (fever ? 'fever' : 'stage') : 'menu';
    onMoodChange?.(mood);
  }, [phase, fever, onMoodChange]);

  useEffect(
    () => () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    },
    []
  );

  const resetSetClock = useCallback((t: ClockTask | null) => {
    if (!t || t.kind !== 'set') return;
    // Start the hands away from the answer so the child has to move them.
    const offset = t.time.h % 12 === 0 ? 3 : -3;
    setSetTime({ h: (((t.time.h + offset) % 12) + 12) % 12 || 12, m: 0 });
  }, []);

  const startLevel = (id: number) => {
    soundEngine.playCardOpen();
    setLevelId(id);
    setStoryIndex(0);
    setPhase('story');
  };

  const beginPlay = () => {
    soundEngine.playTap();
    const newDeck = buildClockStageDeck(levelId, CLOCK_QUESTIONS_PER_STAGE, Math.random, CLOCK_EVENTS.length);
    setDeck(newDeck);
    setQIndex(0);
    setBossHp(CLOCK_BOSS_HP);
    setBossTask(null);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setAttempts(0);
    setSessionGems(0);
    setSessionXp(0);
    setFeedback(null);
    resetSetClock(newDeck[0]);
    setPhase('play');
  };

  const nextBossTask = () => {
    const kind = level.kinds[Math.floor(Math.random() * level.kinds.length)];
    const t = generateClockTask(levelId, kind, Math.random, CLOCK_EVENTS.length);
    setBossTask(t);
    resetSetClock(t);
  };

  const finishStage = () => {
    const stars = clockStars(correctCount, attempts);
    const gemsBonus = CLOCK_REWARDS.stageClearGems + stars * CLOCK_REWARDS.perStarGems;
    onEarnReward(gemsBonus, CLOCK_REWARDS.stageClearXp);
    setSessionGems((g) => g + gemsBonus);
    setSessionXp((x) => x + CLOCK_REWARDS.stageClearXp);
    setFinalStars(stars);
    onLevelComplete(levelId, stars);
    soundEngine.playVictoryFanfare();
    try {
      confetti({ particleCount: 110, spread: 85, origin: { y: 0.55 }, colors: ['#fbbf24', '#ec4899', '#a855f7', '#22d3ee'] });
    } catch {
      // ignore in headless browsers
    }
    setPhase('summary');
  };

  const goNext = () => {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setFeedback(null);
    if (phase === 'boss') {
      if (bossHp <= 0) finishStage();
      else nextBossTask();
      return;
    }
    if (qIndex + 1 >= deck.length) {
      soundEngine.playHint();
      setPhase('bossIntro');
      return;
    }
    resetSetClock(deck[qIndex + 1]);
    setQIndex(qIndex + 1);
  };

  const explanationFor = (t: ClockTask): string => {
    if (t.kind === 'duration' && t.endTime) return explainDuration(t.time, t.endTime, lang);
    if (t.kind === 'dayTime') return explainDayTime(t.time, lang);
    return explainTime(t.time, lang);
  };

  const submitAnswer = (isCorrect: boolean, chosenIndex: number | null) => {
    if (!task || feedback) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (isCorrect) {
      const nextStreak = streak + 1;
      const inFever = nextStreak >= CLOCK_REWARDS.feverStreak;
      const isBoss = phase === 'boss';
      const baseGems = isBoss ? CLOCK_REWARDS.bossHitGems : CLOCK_REWARDS.correctGems;
      const gained = inFever ? baseGems * CLOCK_REWARDS.feverMultiplier : baseGems;
      const xp = isBoss ? CLOCK_REWARDS.bossHitXp : CLOCK_REWARDS.correctXp;
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setCorrectCount((c) => c + 1);
      setSessionGems((g) => g + gained);
      setSessionXp((x) => x + xp);
      onEarnReward(gained, xp);
      soundEngine.playCorrect(nextStreak);
      let message = pickLine(CLOCK_REACTIONS.correct, nextAttempts)[lang];
      if (isBoss) {
        setBossHp((hp) => hp - 1);
        setBossFlash(true);
        window.setTimeout(() => setBossFlash(false), 450);
        message = pickLine(CLOCK_REACTIONS.bossHit, nextAttempts)[lang];
      }
      if (nextStreak === CLOCK_REWARDS.feverStreak) message = CLOCK_REACTIONS.fever[lang];
      setFeedback({ correct: true, chosenIndex, message, explanation: '', gems: gained });
      advanceTimer.current = window.setTimeout(() => goNextRef.current(), 1200);
    } else {
      setStreak(0);
      soundEngine.playGentleMiss();
      if (task.kind === 'set') setSetTime(task.time);
      setFeedback({
        correct: false,
        chosenIndex,
        message: pickLine(CLOCK_REACTIONS.wrong, nextAttempts)[lang],
        explanation: explanationFor(task),
        gems: 0,
      });
    }
  };

  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  // ---------- Renders ----------

  const header = (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        data-testid="clock-quest-back-btn"
        onClick={() => {
          soundEngine.playTap();
          if (phase === 'map') onExit();
          else setPhase('map');
        }}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-900/70 border border-purple-500/60 text-purple-100 text-xs sm:text-sm font-bold hover:bg-purple-800"
      >
        <ArrowLeft className="w-4 h-4" />
        {phase === 'map' ? (nl ? 'Dashboard' : 'Dashboard') : nl ? 'Kaart' : 'Map'}
      </button>
      <div className="font-display font-black text-amber-300 text-base sm:text-xl text-center leading-tight">
        ⏰ {nl ? 'Honmoon Klok-Missie' : 'Honmoon Clock Quest'}
      </div>
      <div className="px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-300/50 text-amber-200 text-xs sm:text-sm font-black">
        💎 {gems}
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="space-y-4">
      <div className="rounded-2xl bg-purple-950/60 border border-fuchsia-400/40 p-4 flex items-center gap-3">
        <HunterAvatar hunter={hunter} size={60} />
        <p className="text-sm sm:text-base text-purple-100 leading-relaxed">
          {nl
            ? `${playerName || 'Hunter'}, de demonen van Gwi-Ma hebben de wijzers van de Honmoon-Klok gestolen! Help HUNTR/X de tour-dag te redden, level na level.`
            : `${playerName || 'Hunter'}, Gwi-Ma's demons stole the hands of the Honmoon Clock! Help HUNTR/X save the tour day, level by level.`}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CLOCK_CHAPTERS.map((ch) => {
          const lv = getClockLevel(ch.levelId);
          const locked = ch.levelId > clockLevelUnlocked;
          const stars = savedStars[String(ch.levelId)] ?? 0;
          const isNext = ch.levelId === Math.min(clockLevelUnlocked, MAX_CLOCK_LEVEL);
          return (
            <button
              key={ch.levelId}
              type="button"
              disabled={locked}
              data-testid={`clock-level-card-${ch.levelId}`}
              onClick={() => startLevel(ch.levelId)}
              className={`kid-block-card text-left rounded-2xl p-4 border-2 transition-all ${
                locked
                  ? 'bg-purple-950/40 border-purple-800/50 opacity-55 cursor-not-allowed'
                  : isNext
                  ? 'bg-gradient-to-br from-fuchsia-900/90 to-purple-900/90 border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.35)]'
                  : 'bg-purple-950/70 border-fuchsia-500/40 hover:border-amber-300/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{locked ? '🔒' : ch.emoji}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/10 text-amber-200">Level {ch.levelId}</span>
              </div>
              <div className="font-display font-black text-white text-lg mt-1 leading-tight">{ch.title[lang]}</div>
              <div className="text-xs font-bold text-cyan-200 mt-0.5">{lv.skill[lang]}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= stars ? 'text-amber-300 fill-amber-300' : 'text-purple-600'}`} />
                  ))}
                </div>
                {locked ? (
                  <Lock className="w-4 h-4 text-purple-400" />
                ) : (
                  <span className="text-xs font-black text-pink-200">{isNext ? (nl ? 'Speel ▶' : 'Play ▶') : nl ? 'Opnieuw ▶' : 'Replay ▶'}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStory = () => {
    const line = chapter.intro[storyIndex];
    const isLast = storyIndex >= chapter.intro.length - 1;
    const name = line.speaker === 'boss' ? chapter.bossName[lang] : SPEAKER_NAME[line.speaker];
    return (
      <div className="max-w-xl mx-auto space-y-4 text-center">
        <div className="text-4xl">{chapter.emoji}</div>
        <div className="font-display font-black text-2xl sm:text-3xl text-white">
          Level {levelId}: {chapter.title[lang]}
        </div>
        <div key={storyIndex} className="animate-pop-in rounded-3xl bg-purple-950/75 border-2 border-pink-400/60 p-5 flex flex-col items-center gap-3 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
          <SpeakerAvatar speaker={line.speaker} size={84} />
          <div className="text-xs font-black uppercase tracking-wider text-amber-300">{name}</div>
          <p className="text-base sm:text-lg font-bold text-white leading-relaxed" data-testid="clock-story-line">
            {line.text[lang]}
          </p>
        </div>
        <button
          type="button"
          data-testid="clock-story-next-btn"
          onClick={() => {
            if (isLast) beginPlay();
            else {
              soundEngine.playTap();
              setStoryIndex(storyIndex + 1);
            }
          }}
          className="kid-block-card w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 text-slate-950 font-display font-black text-lg shadow-[0_0_28px_rgba(236,72,153,0.55)] flex items-center justify-center gap-2"
        >
          {isLast ? (
            <>
              <Play className="w-5 h-5 fill-slate-950" /> {nl ? 'Start de missie!' : 'Start the mission!'}
            </>
          ) : (
            <>{nl ? 'Verder ➔' : 'Next ➔'}</>
          )}
        </button>
      </div>
    );
  };

  const renderBossIntro = () => (
    <div className="max-w-xl mx-auto space-y-4 text-center">
      <div className="font-display font-black text-3xl text-rose-300 animate-pulse">⚠️ BOSS ⚠️</div>
      <div className="rounded-3xl bg-gradient-to-b from-rose-950/80 to-purple-950/90 border-2 border-rose-400/70 p-6 flex flex-col items-center gap-3 shadow-[0_0_35px_rgba(244,63,94,0.4)]">
        <div className="scale-150 my-3">
          <SajaDemonBoss hpPercent={100} />
        </div>
        <div className="font-display font-black text-2xl text-white">{chapter.bossName[lang]}</div>
        <p className="text-base font-bold text-rose-100 italic">"{chapter.bossTaunt[lang]}"</p>
        <p className="text-sm text-purple-200">
          {nl
            ? `Raak de demon ${CLOCK_BOSS_HP} keer met een goed antwoord!`
            : `Hit the demon ${CLOCK_BOSS_HP} times with correct answers!`}
        </p>
      </div>
      <button
        type="button"
        data-testid="clock-boss-fight-btn"
        onClick={() => {
          soundEngine.playCardOpen();
          setPhase('boss');
          nextBossTask();
        }}
        className="kid-block-card w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 text-slate-950 font-display font-black text-lg shadow-[0_0_28px_rgba(244,63,94,0.55)]"
      >
        ⚔️ {nl ? 'Vechten!' : 'Fight!'}
      </button>
    </div>
  );

  const choiceLabel = (t: ClockTask, idx: number): string => {
    const c = t.choices[idx];
    if (t.kind === 'duration' && c.minutes !== undefined) return formatDuration(c.minutes, lang);
    if (!c.time) return '';
    if (t.kind === 'read') return formatDigital(c.time, false);
    if (t.kind === 'dayTime') return phraseWithDayPart(c.time, lang);
    return phrase(c.time, lang);
  };

  const renderQuestion = (t: ClockTask) => {
    const answered = feedback !== null;
    const clockSize = 'min(64vw, 250px)';
    const glow = feedback ? (feedback.correct ? 'correct' : 'wrong') : fever ? 'fever' : 'none';

    let display: React.ReactNode = null;
    if (t.kind === 'read' || t.kind === 'words') {
      display = <AnalogClock time={t.time} size={clockSize} glow={glow} testId="clock-question-analog" />;
    } else if (t.kind === 'match') {
      display = <DigitalClock text={formatDigital(t.time, false)} />;
    } else if (t.kind === 'dayTime') {
      display = <DigitalClock text={formatDigital(t.time, true)} />;
    } else if (t.kind === 'duration' && t.endTime) {
      const showAnalog = t.showAs === 'analog';
      display = (
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-black uppercase text-emerald-300">{nl ? 'Begin' : 'Start'}</span>
            {showAnalog ? <AnalogClock time={t.time} size="min(36vw, 150px)" compact /> : <DigitalClock text={formatDigital(t.time, true)} big={false} />}
          </div>
          <span className="text-2xl text-amber-300 font-black">➔</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-black uppercase text-rose-300">{nl ? 'Eind' : 'End'}</span>
            {showAnalog ? <AnalogClock time={t.endTime} size="min(36vw, 150px)" compact /> : <DigitalClock text={formatDigital(t.endTime, true)} big={false} />}
          </div>
        </div>
      );
    } else if (t.kind === 'set') {
      const targetText = t.showAs === 'phrase' ? phrase(t.time, lang) : formatDigital(t.time, level.use24h);
      const snap = setSnapMinutes(level);
      display = (
        <div className="flex flex-col items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-amber-400/15 border-2 border-amber-300/60 font-display font-black text-xl sm:text-2xl text-amber-200" data-testid="clock-set-target">
            {targetText}
          </div>
          <AnalogClock
            time={setTime}
            size={clockSize}
            interactive={!answered}
            snapMinutes={snap}
            onChange={setSetTime}
            show24h={level.use24h}
            glow={glow}
            testId="clock-set-analog"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="clock-hour-minus-btn"
              disabled={answered}
              onClick={() => {
                soundEngine.playTap();
                setSetTime((p) => fromMinutes(toMinutes(p) - 60));
              }}
              className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-300/60 text-amber-200 font-black text-sm flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> {nl ? 'uur' : 'hour'}
            </button>
            <span className="text-[11px] text-purple-200 font-bold max-w-[9rem] text-center leading-tight">
              {nl ? 'Sleep de lange roze wijzer' : 'Drag the long pink hand'}
            </span>
            <button
              type="button"
              data-testid="clock-hour-plus-btn"
              disabled={answered}
              onClick={() => {
                soundEngine.playTap();
                setSetTime((p) => fromMinutes(toMinutes(p) + 60));
              }}
              className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-300/60 text-amber-200 font-black text-sm flex items-center gap-1"
            >
              {nl ? 'uur' : 'hour'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-center text-sm sm:text-base font-bold text-purple-100 leading-snug px-1" data-testid="clock-question-prompt">
          {taskPrompt(t, lang)}
        </p>
        <div className="flex justify-center">{display}</div>

        {t.kind === 'set' ? (
          !answered && (
            <button
              type="button"
              data-testid="clock-set-check-btn"
              onClick={() => submitAnswer(isSetAnswerCorrect(t.time, setTime), null)}
              className="kid-block-card w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-display font-black text-lg flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> {nl ? 'Klok vergrendelen!' : 'Lock the clock!'}
            </button>
          )
        ) : t.kind === 'match' ? (
          <div className="grid grid-cols-2 gap-3 justify-items-center">
            {t.choices.map((c, i) => {
              const state = answered ? (i === t.correctIndex ? 'correct' : i === feedback?.chosenIndex ? 'wrong' : 'none') : 'none';
              return (
                <button
                  key={c.key}
                  type="button"
                  data-testid="clock-choice"
                  data-choice-index={i}
                  disabled={answered}
                  onClick={() => submitAnswer(i === t.correctIndex, i)}
                  className={`rounded-2xl p-2 border-2 transition-all ${
                    state === 'correct'
                      ? 'border-emerald-300 bg-emerald-500/20'
                      : state === 'wrong'
                      ? 'border-rose-400 bg-rose-500/20'
                      : 'border-purple-600/60 bg-purple-950/50 hover:border-amber-300'
                  }`}
                >
                  {c.time && <AnalogClock time={c.time} size="min(36vw, 140px)" compact />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className={`grid gap-2.5 ${t.kind === 'read' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {t.choices.map((c, i) => {
              const state = answered ? (i === t.correctIndex ? 'correct' : i === feedback?.chosenIndex ? 'wrong' : 'none') : 'none';
              return (
                <button
                  key={c.key}
                  type="button"
                  data-testid="clock-choice"
                  data-choice-index={i}
                  disabled={answered}
                  onClick={() => submitAnswer(i === t.correctIndex, i)}
                  className={`kid-block-card px-3 py-3.5 rounded-2xl border-2 font-display font-black transition-all ${
                    t.kind === 'read' ? 'text-2xl font-mono tracking-wider' : 'text-base sm:text-lg'
                  } ${
                    state === 'correct'
                      ? 'border-emerald-300 bg-emerald-500/25 text-emerald-100'
                      : state === 'wrong'
                      ? 'border-rose-400 bg-rose-500/25 text-rose-100'
                      : 'border-fuchsia-500/50 bg-purple-950/70 text-white hover:border-amber-300'
                  }`}
                >
                  {choiceLabel(t, i)}
                </button>
              );
            })}
          </div>
        )}

        {feedback && (
          <div
            data-testid="clock-feedback"
            data-correct={feedback.correct}
            className={`animate-pop-in rounded-2xl p-3.5 border-2 flex items-start gap-3 ${
              feedback.correct ? 'bg-emerald-950/70 border-emerald-300/70' : 'bg-purple-950/85 border-amber-300/70'
            }`}
          >
            <HunterAvatar hunter={hunter} size={48} animate={false} />
            <div className="flex-1 space-y-1.5">
              <div className={`font-display font-black ${feedback.correct ? 'text-emerald-200' : 'text-amber-200'}`}>
                {feedback.message} {feedback.gems > 0 && <span className="text-amber-300">+{feedback.gems} 💎</span>}
              </div>
              {feedback.explanation && <p className="text-sm text-purple-100 leading-relaxed">{feedback.explanation}</p>}
              {!feedback.correct && (
                <button
                  type="button"
                  data-testid="clock-next-btn"
                  onClick={() => {
                    soundEngine.playTap();
                    goNext();
                  }}
                  className="mt-1 px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 font-display font-black text-sm"
                >
                  {nl ? 'Begrepen! Verder ➔' : 'Got it! Next ➔'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPlay = () => {
    if (!task) return null;
    const isBoss = phase === 'boss';
    return (
      <div
        className={`max-w-2xl mx-auto rounded-3xl p-4 sm:p-6 border-2 space-y-4 transition-all ${
          fever
            ? 'bg-gradient-to-b from-amber-900/40 via-fuchsia-950/80 to-purple-950/90 border-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.45)]'
            : isBoss
            ? 'bg-gradient-to-b from-rose-950/70 to-purple-950/90 border-rose-400/70'
            : 'bg-purple-950/70 border-fuchsia-400/50'
        }`}
        data-testid="clock-play-card"
      >
        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-black">
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-amber-200">
            {chapter.emoji} Level {levelId}
          </span>
          {isBoss ? (
            <div className="flex items-center gap-2">
              <SajaDemonBoss hpPercent={(bossHp / CLOCK_BOSS_HP) * 100} hitFlash={bossFlash} />
              <div className="w-24 sm:w-32 h-3 rounded-full bg-purple-900 border border-rose-400/60 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 transition-all duration-300" style={{ width: `${(bossHp / CLOCK_BOSS_HP) * 100}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex gap-1" data-testid="clock-progress-dots">
              {deck.map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                    i < qIndex ? 'bg-amber-300' : i === qIndex ? 'bg-pink-400 animate-pulse' : 'bg-purple-700'
                  }`}
                />
              ))}
            </div>
          )}
          <span className={`px-2.5 py-1 rounded-full ${fever ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-white/10 text-pink-200'}`}>
            {fever ? '🔥 FEVER' : '⚡'} x{streak}
          </span>
        </div>
        {renderQuestion(task)}
      </div>
    );
  };

  const renderSummary = () => {
    const accuracy = attempts ? Math.round((correctCount / attempts) * 100) : 0;
    const isFinal = levelId >= MAX_CLOCK_LEVEL;
    const nextChapter = isFinal ? null : getChapter(levelId + 1);
    const showPhotocardPrompt = gems >= PHOTOCARD_PROMPT_GEMS;
    return (
      <div className="max-w-xl mx-auto rounded-3xl bg-purple-950/75 border-2 border-amber-300/70 p-5 sm:p-7 space-y-4 text-center shadow-[0_0_40px_rgba(251,191,36,0.3)]" data-testid="clock-summary">
        <div className="flex items-end justify-center gap-3">
          <HunterAvatar hunter={hunter} size={76} />
          <SajaDemonBoss hpPercent={0} />
        </div>
        <div className="inline-flex px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/50 text-amber-200 text-xs font-black">
          +{sessionXp} XP • +{sessionGems} 💎
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
          {nl ? 'Hoofdstuk voltooid!' : 'Chapter complete!'} {chapter.emoji}
        </h2>
        <p className="text-sm sm:text-base text-purple-100">{chapter.outro.text[lang]}</p>
        <div className="flex justify-center gap-2" data-testid="clock-summary-stars">
          {[1, 2, 3].map((s) => (
            <Star key={s} className={`w-10 h-10 ${s <= finalStars ? 'text-amber-300 fill-amber-300 animate-pop-in' : 'text-purple-700'}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-purple-900/60 border border-fuchsia-500/40 p-2.5">
            <div className="text-xs text-purple-200 font-bold">{nl ? 'Goed' : 'Correct'}</div>
            <div className="font-display font-black text-xl text-emerald-300">{accuracy}%</div>
          </div>
          <div className="rounded-xl bg-purple-900/60 border border-fuchsia-500/40 p-2.5">
            <div className="text-xs text-purple-200 font-bold">{nl ? 'Beste combo' : 'Best combo'}</div>
            <div className="font-display font-black text-xl text-pink-300">{bestStreak}x 🔥</div>
          </div>
          <div className="rounded-xl bg-purple-900/60 border border-fuchsia-500/40 p-2.5">
            <div className="text-xs text-purple-200 font-bold">{nl ? 'Geleerd' : 'Skill'}</div>
            <div className="font-display font-black text-xs sm:text-sm text-cyan-200 leading-tight mt-1">{level.skill[lang]}</div>
          </div>
        </div>

        {showPhotocardPrompt && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-900/40 to-fuchsia-900/40 border-2 border-amber-300/60 p-3 flex items-center justify-between gap-3 text-left">
            <span className="text-sm font-bold text-amber-100">
              🎁 {nl ? `Je hebt ${gems} 💎! Open een nieuwe fotokaart.` : `You have ${gems} 💎! Unbox a new photocard.`}
            </span>
            <button
              type="button"
              data-testid="clock-open-photocard-btn"
              onClick={() => {
                soundEngine.playCardOpen();
                onOpenPhotocards();
              }}
              className="shrink-0 px-3 py-2 rounded-xl bg-amber-400 text-slate-950 font-display font-black text-xs"
            >
              {nl ? 'Open ✨' : 'Unbox ✨'}
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {nextChapter ? (
            <button
              type="button"
              data-testid="clock-next-level-btn"
              onClick={() => startLevel(levelId + 1)}
              className="kid-block-card w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 text-slate-950 font-display font-black text-base sm:text-lg shadow-[0_0_28px_rgba(236,72,153,0.55)] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-slate-950 shrink-0" />
              <span>
                {nl ? 'Volgende level' : 'Next level'} {levelId + 1}: {nextChapter.title[lang]}
              </span>
            </button>
          ) : (
            <div className="rounded-2xl bg-amber-400/20 border-2 border-amber-300 p-3 font-display font-black text-amber-200">
              👑 {nl ? 'Je bent een Honmoon Klok-Legende!' : 'You are a Honmoon Clock Legend!'}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              data-testid="clock-replay-btn"
              onClick={() => startLevel(levelId)}
              className="px-3 py-3 rounded-xl bg-purple-900/80 border-2 border-fuchsia-400/50 text-fuchsia-100 font-display font-black text-sm flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> {nl ? 'Opnieuw' : 'Replay'}
            </button>
            <button
              type="button"
              data-testid="clock-map-btn"
              onClick={() => {
                soundEngine.playTap();
                setPhase('map');
              }}
              className="px-3 py-3 rounded-xl bg-purple-900/80 border-2 border-cyan-400/50 text-cyan-100 font-display font-black text-sm"
            >
              🗺️ {nl ? 'Levelkaart' : 'Level map'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-6" data-testid="clock-quest">
      {header}
      {phase === 'map' && renderMap()}
      {phase === 'story' && renderStory()}
      {phase === 'bossIntro' && renderBossIntro()}
      {(phase === 'play' || phase === 'boss') && renderPlay()}
      {phase === 'summary' && renderSummary()}
    </div>
  );
};

