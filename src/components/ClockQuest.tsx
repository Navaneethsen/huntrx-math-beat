import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock, Flame, Lock, Play, RotateCcw, Star } from 'lucide-react';
import { translations } from '../i18n/translations';
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
  analogHour,
  buildClockStageDeck,
  clockStars,
  explainDayTime,
  explainDuration,
  explainTime,
  explainWords,
  formatDigital,
  formatDurationShort,
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
  taskEvent,
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
const MAX_SLASH = 3;

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
  /** Tiny answer-button clock: only 12, 3, 6 and 9, with thicker hands. */
  mini?: boolean;
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
  mini = false,
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
        if (mini && n % 3 !== 0) return null;
        const a = (n * 30 * Math.PI) / 180;
        const r = mini ? 60 : show24h ? 62 : 64;
        return (
          <text
            key={n}
            x={100 + Math.sin(a) * r}
            y={100 - Math.cos(a) * r}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize={mini ? 30 : compact ? 17 : 15}
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
        strokeWidth={mini ? 13 : 8}
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
        strokeWidth={mini ? 8 : 4.5}
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
  const [score, setScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [slashCharges, setSlashCharges] = useState(MAX_SLASH);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [coachMessage, setCoachMessage] = useState('');
  const advanceTimer = useRef<number | null>(null);
  const t = translations[lang];

  const level = getClockLevel(levelId);
  const chapter = getChapter(levelId);
  const fever = streak >= CLOCK_REWARDS.feverStreak;
  const task = phase === 'boss' ? bossTask : deck[qIndex] ?? null;
  const inBattle = phase === 'play' || phase === 'boss';

  // Same running stage timer as the other games; it pauses outside the questions.
  useEffect(() => {
    if (!inBattle) return;
    const id = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [inBattle]);

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

  const resetHelpers = () => {
    setEliminated([]);
    setHintLevel(0);
    setCoachMessage('');
  };

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
    setScore(0);
    setElapsedSeconds(0);
    setSlashCharges(MAX_SLASH);
    resetHelpers();
    setFeedback(null);
    resetSetClock(newDeck[0]);
    setPhase('play');
  };

  const nextBossTask = () => {
    const kind = level.kinds[Math.floor(Math.random() * level.kinds.length)];
    const t = generateClockTask(levelId, kind, Math.random, CLOCK_EVENTS.length);
    setBossTask(t);
    resetHelpers();
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
    resetHelpers();
    resetSetClock(deck[qIndex + 1]);
    setQIndex(qIndex + 1);
  };

  const explanationFor = (t: ClockTask): string => {
    if (t.kind === 'duration' && t.endTime) return explainDuration(t.time, t.endTime, lang);
    if (t.kind === 'dayTime') return explainDayTime(t.time, lang);
    if (t.kind === 'words') return explainWords(t.time, lang);
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
      const fullGems = inFever ? baseGems * CLOCK_REWARDS.feverMultiplier : baseGems;
      // Using Derpy's hint still earns gems, just a little less (like the speed gems in the stages).
      const gained = hintLevel > 0 ? Math.max(1, fullGems - hintLevel) : fullGems;
      const xp = isBoss ? CLOCK_REWARDS.bossHitXp : CLOCK_REWARDS.correctXp;
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setCorrectCount((c) => c + 1);
      setScore((sc) => sc + (isBoss ? 150 : 100) + nextStreak * 10);
      if (nextStreak % 3 === 0) setSlashCharges((c) => Math.min(MAX_SLASH, c + 1));
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

  const hintClue = (tk: ClockTask): string => {
    const hourWord = (h: number) => String(analogHour(h));
    switch (tk.kind) {
      case 'set':
        return nl
          ? `Zet eerst de lange wijzer op ${tk.time.m === 0 ? 'de 12' : `${tk.time.m} minuten`}. Daarna de korte wijzer bij de ${hourWord(tk.time.h)}.`
          : `First put the long hand on ${tk.time.m === 0 ? 'the 12' : `${tk.time.m} minutes`}. Then the short hand near ${hourWord(tk.time.h)}.`;
      case 'duration':
        return nl
          ? 'Tel eerst hele uren vanaf de begintijd, daarna de losse minuten.'
          : 'Count whole hours from the start time first, then the extra minutes.';
      case 'words':
        return nl
          ? 'Zoek eerst het uur. Onthoud: half drie = 2:30, kwart over = :15, kwart voor = :45.'
          : 'Find the hour first. Remember: half past = :30, quarter past = :15, quarter to = :45.';
      case 'dayTime':
        return nl
          ? 'Na 12 uur tel je 12 erbij: 3 uur \'s middags = 15:00.'
          : 'After 12 noon you add 12: 3 in the afternoon = 15:00.';
      default:
        return nl
          ? `Kijk eerst naar de lange wijzer (minuten). De korte wijzer staat bij de ${hourWord(tk.time.m >= 20 ? tk.time.h + 1 : tk.time.h)}.`
          : `Look at the long hand first (minutes). The short hand is near ${hourWord(tk.time.m >= 20 ? tk.time.h + 1 : tk.time.h)}.`;
    }
  };

  const handleHint = () => {
    if (!task || feedback) return;
    soundEngine.playHint();
    const next: 1 | 2 = hintLevel < 1 ? 1 : 2;
    setHintLevel(next);
    setCoachMessage(next === 1 ? hintClue(task) : explanationFor(task));
  };

  const slashableIndices = task && task.kind !== 'set'
    ? task.choices.map((_, i) => i).filter((i) => i !== task.correctIndex && !eliminated.includes(i))
    : [];

  const handleSlash = () => {
    if (!task || feedback || slashCharges <= 0 || slashableIndices.length <= 1) return;
    soundEngine.playHint();
    const idx = slashableIndices[Math.floor(Math.random() * slashableIndices.length)];
    setEliminated((prev) => [...prev, idx]);
    setSlashCharges((c) => c - 1);
    setCoachMessage(
      nl
        ? `⚔️ ${t.hunters[hunter].name} hakte een fout antwoord weg!`
        : `⚔️ ${t.hunters[hunter].name} slashed away a wrong answer!`
    );
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

  const choiceLabel = (t: ClockTask, idx: number): React.ReactNode => {
    const c = t.choices[idx];
    if (t.kind === 'duration' && c.minutes !== undefined) {
      return formatDurationShort(c.minutes, lang).map((part) => (
        <span key={part} className="block">
          {part}
        </span>
      ));
    }
    if (!c.time) return '';
    return formatDigital(c.time, t.kind === 'dayTime');
  };

  const renderQuestion = (t: ClockTask) => {
    const answered = feedback !== null;
    const clockSize = 'min(54vw, 230px)';
    const glow = feedback ? (feedback.correct ? 'correct' : 'wrong') : fever ? 'fever' : 'none';

    let display: React.ReactNode = null;
    if (t.kind === 'read') {
      display = <AnalogClock time={t.time} size={clockSize} glow={glow} testId="clock-question-analog" />;
    } else if (t.kind === 'words' || t.kind === 'dayTime') {
      display = (
        <div
          className="px-5 py-4 rounded-2xl bg-amber-400/15 border-2 border-amber-300/60 font-display font-black text-2xl sm:text-3xl text-amber-200 text-center leading-snug"
          data-testid="clock-phrase"
        >
          {t.kind === 'dayTime' ? phraseWithDayPart(t.time, lang) : phrase(t.time, lang)}
        </div>
      );
    } else if (t.kind === 'match') {
      display = <DigitalClock text={formatDigital(t.time, false)} />;
    } else if (t.kind === 'duration' && t.endTime) {
      const showAnalog = t.showAs === 'analog';
      display = (
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-black uppercase text-emerald-300">{nl ? 'Begin' : 'Start'}</span>
            {showAnalog ? <AnalogClock time={t.time} size="min(30vw, 130px)" compact /> : <DigitalClock text={formatDigital(t.time, true)} big={false} />}
          </div>
          <span className="text-2xl text-amber-300 font-black">➔</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-black uppercase text-rose-300">{nl ? 'Eind' : 'End'}</span>
            {showAnalog ? <AnalogClock time={t.endTime} size="min(30vw, 130px)" compact /> : <DigitalClock text={formatDigital(t.endTime, true)} big={false} />}
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
            size="min(48vw, 210px)"
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
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3 justify-items-center">
            {t.choices.map((c, i) => {
              const state = answered ? (i === t.correctIndex ? 'correct' : i === feedback?.chosenIndex ? 'wrong' : 'none') : 'none';
              return (
                <button
                  key={c.key}
                  type="button"
                  data-testid="clock-choice"
                  data-choice-index={i}
                  disabled={answered || eliminated.includes(i)}
                  onClick={() => submitAnswer(i === t.correctIndex, i)}
                  className={`w-full flex justify-center rounded-2xl p-1 sm:p-2 border-2 transition-all ${eliminated.includes(i) && !answered ? 'opacity-25 grayscale line-through' : ''} ${
                    state === 'correct'
                      ? 'border-emerald-300 bg-emerald-500/20'
                      : state === 'wrong'
                      ? 'border-rose-400 bg-rose-500/20'
                      : 'border-purple-600/60 bg-purple-950/50 hover:border-amber-300'
                  }`}
                >
                  {c.time && <AnalogClock time={c.time} size="min(19vw, 120px)" mini />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
            {t.choices.map((c, i) => {
              const state = answered ? (i === t.correctIndex ? 'correct' : i === feedback?.chosenIndex ? 'wrong' : 'none') : 'none';
              return (
                <button
                  key={c.key}
                  type="button"
                  data-testid="clock-choice"
                  data-choice-index={i}
                  disabled={answered || eliminated.includes(i)}
                  onClick={() => submitAnswer(i === t.correctIndex, i)}
                  className={`kid-block-card min-h-[3.5rem] px-1 py-3 rounded-2xl border-2 font-display font-black leading-tight transition-all ${eliminated.includes(i) && !answered ? 'opacity-25 grayscale line-through' : ''} ${
                    t.kind === 'duration' ? 'text-sm sm:text-lg' : 'text-lg sm:text-2xl font-mono'
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
    const chargePercent = isBoss
      ? ((CLOCK_BOSS_HP - bossHp) / CLOCK_BOSS_HP) * 100
      : deck.length
      ? (qIndex / deck.length) * 100
      : 0;
    const bossHpPercent = isBoss ? (bossHp / CLOCK_BOSS_HP) * 100 : 100 - chargePercent;
    return (
      <div className="space-y-3.5">
        {/* Top HUD bar, matching the other stages: idol + Honmoon charge, score, streak, timer, boss */}
        <div
          className="bg-purple-950/65 border border-fuchsia-500/35 rounded-3xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3"
          data-testid="clock-hud"
        >
          <div className="flex items-center gap-3">
            <HunterAvatar hunter={hunter} size={52} animate={false} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-black text-sm sm:text-base text-amber-300">{t.hunters[hunter].name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 font-bold">
                  {chapter.emoji} Level {levelId} • {level.skill[lang]}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[11px] font-bold text-purple-200">{t.honmoonCharge}:</span>
                <div className="w-28 sm:w-44 h-3 bg-purple-950 rounded-full overflow-hidden border border-purple-600/50 p-0.5">
                  <div
                    style={{ width: `${chargePercent}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-amber-300 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase text-purple-300">{t.scoreLabel}</div>
              <div className="font-display font-black text-lg sm:text-2xl text-amber-300" data-testid="clock-score">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase text-purple-300">{t.streakLabel}</div>
              <div
                className={`font-display font-black text-lg sm:text-2xl flex items-center justify-center gap-0.5 ${
                  fever ? 'text-amber-300 scale-110 animate-pulse' : 'text-pink-400'
                }`}
              >
                <Flame className="w-4 h-4 fill-current" />
                {streak}x
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase text-purple-300">{t.elapsedTime}</div>
              <div className="font-display font-black text-lg sm:text-2xl flex items-center gap-1 text-cyan-300" data-testid="clock-timer">
                <Clock className="w-4 h-4" />
                {elapsedSeconds}s
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2.5 bg-purple-900/40 px-3 py-1.5 rounded-2xl border border-rose-500/30">
            <div className="text-right">
              <div className="text-xs font-extrabold text-rose-300">{chapter.bossName[lang]}</div>
              <div className="text-[10px] text-purple-200">{isBoss ? `HP ${bossHp}/${CLOCK_BOSS_HP}` : nl ? 'Versla ze met klokkijken!' : 'Beat them by reading the clock!'}</div>
            </div>
            <SajaDemonBoss hpPercent={bossHpPercent} hitFlash={bossFlash} />
          </div>
        </div>

        {fever && (
          <div className="bg-gradient-to-r from-amber-500/25 via-yellow-400/35 to-pink-500/25 border-2 border-amber-300 rounded-2xl py-1.5 px-4 flex items-center justify-center gap-3 font-display font-black text-xs sm:text-sm text-amber-200 shadow-[0_0_25px_rgba(251,191,36,0.45)]">
            <span className="inline-block animate-lightstick text-lg">🪄</span>
            <span>{t.goldenModeActive}</span>
            <span className="inline-block animate-lightstick text-lg">🪄</span>
          </div>
        )}

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
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-white/10 text-amber-200">
              {isBoss ? `⚔️ BOSS` : `${Math.min(qIndex + 1, deck.length)}/${deck.length}`}
            </span>
            <div className="flex-1 min-w-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              {!isBoss && (
                <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/50 text-[11px] sm:text-xs font-black text-fuchsia-200 whitespace-nowrap" data-testid="clock-event-tag">
                  🎤 {taskEvent(task, lang)}
                </span>
              )}
              <p className="text-base sm:text-lg font-display font-black text-white leading-snug text-center" data-testid="clock-question-prompt">
                {taskPrompt(task, lang)}
              </p>
            </div>
            {isBoss ? (
              <div className="shrink-0 flex items-center gap-2">
                <div className="md:hidden w-11 h-11 flex items-center justify-center">
                  <div className="scale-[0.65]">
                    <SajaDemonBoss hpPercent={bossHpPercent} hitFlash={bossFlash} />
                  </div>
                </div>
                <div className="w-14 sm:w-32 h-3 rounded-full bg-purple-900 border border-rose-400/60 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 transition-all duration-300" style={{ width: `${bossHpPercent}%` }} />
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex shrink-0 gap-1" data-testid="clock-progress-dots">
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
          </div>
          {renderQuestion(task)}
        </div>

        {/* Bottom coaching bar with Derpy, like the other stages */}
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-sky-950/80 via-purple-950/85 to-indigo-950/80 border-2 border-sky-400/50 rounded-3xl p-2.5 sm:p-4 flex items-center justify-between gap-2 sm:gap-3 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="shrink-0">
              <DerpyTigerMascot size={40} excited={Boolean(feedback?.correct)} />
            </div>
            <p className="font-display font-bold text-xs sm:text-base text-sky-100 leading-snug" data-testid="clock-coach-message">
              {coachMessage || t.derpyReady}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              data-testid="clock-slash-btn"
              disabled={slashCharges <= 0 || slashableIndices.length <= 1 || Boolean(feedback)}
              onClick={handleSlash}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                slashCharges > 0 && slashableIndices.length > 1 && !feedback
                  ? 'keep-white-text bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white border border-pink-300 shadow-[0_0_16px_rgba(236,72,153,0.6)] hover:brightness-110 active:scale-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <span>⚔️</span>
              <span>{`Slash (${slashCharges})`}</span>
            </button>
            <button
              type="button"
              data-testid="clock-hint-btn"
              disabled={Boolean(feedback)}
              onClick={handleHint}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-display font-bold text-xs sm:text-sm shadow-[0_0_18px_rgba(251,191,36,0.5)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {t.derpyHintBtn}
            </button>
          </div>
        </div>
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
        <div className="grid grid-cols-3 gap-2" data-testid="clock-summary-stats">
          <div className="rounded-xl bg-purple-900/60 border border-fuchsia-500/40 p-2.5">
            <div className="text-xs text-purple-200 font-bold">{t.scoreLabel}</div>
            <div className="font-display font-black text-xl text-amber-300">{score}</div>
          </div>
          <div className="rounded-xl bg-purple-900/60 border border-fuchsia-500/40 p-2.5">
            <div className="text-xs text-purple-200 font-bold">{t.elapsedTime}</div>
            <div className="font-display font-black text-xl text-cyan-300 flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" />
              {elapsedSeconds}s
            </div>
          </div>
          <div className="rounded-xl bg-purple-900/60 border border-fuchsia-500/40 p-2.5">
            <div className="text-xs text-purple-200 font-bold">{t.avgSpeedLabel}</div>
            <div className="font-display font-black text-xl text-fuchsia-300">{attempts ? Math.round(elapsedSeconds / attempts) : 0}s</div>
          </div>
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

