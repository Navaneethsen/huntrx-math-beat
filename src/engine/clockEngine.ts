import type { Language } from '../i18n/translations';

/**
 * Clock Quest engine: pure clock-reading logic (no React) so it can be unit tested.
 * Levels follow the Dutch school curriculum (whole/half hours → quarters → 10/5 minutes
 * → exact minutes, plus durations and the 24-hour clock) without naming school years.
 */

export type ClockTaskKind = 'read' | 'words' | 'match' | 'set' | 'duration' | 'dayTime';

/** h is 0–23, m is 0–59. */
export interface ClockTime {
  h: number;
  m: number;
}

export interface ClockLevel {
  id: number;
  stepMinutes: 60 | 30 | 15 | 10 | 5 | 1;
  use24h: boolean;
  kinds: ClockTaskKind[];
  durationStep: number;
  maxDurationMinutes: number;
  choiceCount: 3 | 4;
  skill: { nl: string; en: string };
}

export interface ClockChoice {
  key: string;
  time?: ClockTime;
  minutes?: number;
}

export interface ClockTask {
  id: string;
  kind: ClockTaskKind;
  levelId: number;
  time: ClockTime;
  endTime?: ClockTime;
  durationMinutes?: number;
  /** How the time in the question is displayed. */
  showAs: 'analog' | 'digital' | 'phrase';
  choices: ClockChoice[];
  correctIndex: number;
  /** Index into the story event list, used to theme the question text. */
  eventIndex: number;
}

export type Rng = () => number;

export const CLOCK_LEVELS: ClockLevel[] = [
  {
    id: 1,
    stepMinutes: 60,
    use24h: false,
    kinds: ['read', 'words', 'match', 'set'],
    durationStep: 60,
    maxDurationMinutes: 180,
    choiceCount: 3,
    skill: { nl: 'Hele uren', en: "O'clock times" },
  },
  {
    id: 2,
    stepMinutes: 30,
    use24h: false,
    kinds: ['read', 'words', 'match', 'set'],
    durationStep: 30,
    maxDurationMinutes: 180,
    choiceCount: 3,
    skill: { nl: 'Halve uren', en: 'Half hours' },
  },
  {
    id: 3,
    stepMinutes: 15,
    use24h: false,
    kinds: ['read', 'words', 'match', 'set'],
    durationStep: 30,
    maxDurationMinutes: 180,
    choiceCount: 4,
    skill: { nl: 'Kwartieren', en: 'Quarter hours' },
  },
  {
    id: 4,
    stepMinutes: 15,
    use24h: false,
    kinds: ['read', 'words', 'match', 'set', 'duration'],
    durationStep: 15,
    maxDurationMinutes: 180,
    choiceCount: 4,
    skill: { nl: 'Kwartieren & hoe lang duurt het?', en: 'Quarters & how long?' },
  },
  {
    id: 5,
    stepMinutes: 10,
    use24h: false,
    kinds: ['read', 'words', 'match', 'set', 'duration'],
    durationStep: 10,
    maxDurationMinutes: 150,
    choiceCount: 4,
    skill: { nl: 'Per 10 minuten', en: 'To 10 minutes' },
  },
  {
    id: 6,
    stepMinutes: 5,
    use24h: false,
    kinds: ['read', 'words', 'match', 'set', 'duration'],
    durationStep: 5,
    maxDurationMinutes: 120,
    choiceCount: 4,
    skill: { nl: 'Per 5 minuten', en: 'To 5 minutes' },
  },
  {
    id: 7,
    stepMinutes: 5,
    use24h: true,
    kinds: ['dayTime', 'read', 'match', 'set', 'duration'],
    durationStep: 5,
    maxDurationMinutes: 120,
    choiceCount: 4,
    skill: { nl: '24-uursklok', en: '24-hour clock' },
  },
  {
    id: 8,
    stepMinutes: 1,
    use24h: false,
    kinds: ['read', 'words', 'match', 'set'],
    durationStep: 5,
    maxDurationMinutes: 90,
    choiceCount: 4,
    skill: { nl: 'Op de minuut', en: 'To the minute' },
  },
  {
    id: 9,
    stepMinutes: 1,
    use24h: true,
    kinds: ['dayTime', 'read', 'words', 'match', 'set', 'duration'],
    durationStep: 1,
    maxDurationMinutes: 90,
    choiceCount: 4,
    skill: { nl: 'Legende: alles door elkaar', en: 'Legend: everything mixed' },
  },
];

export const MAX_CLOCK_LEVEL = CLOCK_LEVELS.length;
export const CLOCK_QUESTIONS_PER_STAGE = 8;
export const CLOCK_BOSS_HP = 3;

export function getClockLevel(id: number): ClockLevel {
  return CLOCK_LEVELS.find((l) => l.id === id) ?? CLOCK_LEVELS[0];
}

// ---------- Basic time helpers ----------

export function toMinutes(t: ClockTime): number {
  return t.h * 60 + t.m;
}

export function fromMinutes(total: number): ClockTime {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return { h: Math.floor(wrapped / 60), m: wrapped % 60 };
}

/** Hour as shown on an analog clock face: 1–12. */
export function analogHour(h: number): number {
  const r = h % 12;
  return r === 0 ? 12 : r;
}

/** True when two times look identical on an analog clock (12-hour face). */
export function sameOnAnalog(a: ClockTime, b: ClockTime): boolean {
  return a.h % 12 === b.h % 12 && a.m === b.m;
}

export function handAngles(t: ClockTime): { hour: number; minute: number } {
  return { hour: (t.h % 12) * 30 + t.m * 0.5, minute: t.m * 6 };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export function formatDigital(t: ClockTime, use24h: boolean): string {
  return `${pad2(use24h ? t.h : analogHour(t.h))}:${pad2(t.m)}`;
}

// ---------- Spoken time phrases ----------

const NL_WORDS = [
  'nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien',
  'elf', 'twaalf', 'dertien', 'veertien',
];

const EN_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
];

function enNumber(n: number): string {
  if (n <= 20) return EN_WORDS[n];
  return `twenty-${EN_WORDS[n - 20]}`;
}

/** Dutch spoken time, e.g. "kwart voor vier", "vijf voor half drie", "zeven over half tien". */
export function phraseNl(t: ClockTime): string {
  const H = analogHour(t.h);
  const N = analogHour(H + 1);
  const m = t.m;
  if (m === 0) return `${NL_WORDS[H]} uur`;
  if (m === 15) return `kwart over ${NL_WORDS[H]}`;
  if (m < 15) return `${NL_WORDS[m]} over ${NL_WORDS[H]}`;
  if (m < 30) return `${NL_WORDS[30 - m]} voor half ${NL_WORDS[N]}`;
  if (m === 30) return `half ${NL_WORDS[N]}`;
  if (m < 45) return `${NL_WORDS[m - 30]} over half ${NL_WORDS[N]}`;
  if (m === 45) return `kwart voor ${NL_WORDS[N]}`;
  return `${NL_WORDS[60 - m]} voor ${NL_WORDS[N]}`;
}

/** English spoken time, e.g. "quarter to four", "twenty-five past two", "seven minutes to ten". */
export function phraseEn(t: ClockTime): string {
  const H = analogHour(t.h);
  const N = analogHour(H + 1);
  const m = t.m;
  const minutesWord = (k: number) =>
    k % 5 === 0 ? enNumber(k) : `${enNumber(k)} ${k === 1 ? 'minute' : 'minutes'}`;
  if (m === 0) return `${EN_WORDS[H]} o'clock`;
  if (m === 15) return `quarter past ${EN_WORDS[H]}`;
  if (m === 30) return `half past ${EN_WORDS[H]}`;
  if (m === 45) return `quarter to ${EN_WORDS[N]}`;
  if (m < 30) return `${minutesWord(m)} past ${EN_WORDS[H]}`;
  return `${minutesWord(60 - m)} to ${EN_WORDS[N]}`;
}

export function phrase(t: ClockTime, lang: Language): string {
  return lang === 'nl' ? phraseNl(t) : phraseEn(t);
}

export type DayPart = 'night' | 'morning' | 'afternoon' | 'evening';

export function dayPart(h: number): DayPart {
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

const DAY_PART_LABEL: Record<DayPart, { nl: string; en: string }> = {
  night: { nl: "'s nachts", en: 'at night' },
  morning: { nl: "'s ochtends", en: 'in the morning' },
  afternoon: { nl: "'s middags", en: 'in the afternoon' },
  evening: { nl: "'s avonds", en: 'in the evening' },
};

/** e.g. 16:45 → "kwart voor vijf 's middags". */
export function phraseWithDayPart(t: ClockTime, lang: Language): string {
  return `${phrase(t, lang)} ${DAY_PART_LABEL[dayPart(t.h)][lang]}`;
}

export function formatDuration(minutes: number, lang: Language): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (lang === 'nl') {
    const mins = `${m} ${m === 1 ? 'minuut' : 'minuten'}`;
    if (h === 0) return mins;
    if (m === 0) return `${h} uur`;
    return `${h} uur en ${mins}`;
  }
  const mins = `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  const hours = `${h} ${h === 1 ? 'hour' : 'hours'}`;
  if (h === 0) return mins;
  if (m === 0) return hours;
  return `${hours} ${mins}`;
}

/** Child-friendly explanation of how to read a time on the analog clock. */
export function explainTime(t: ClockTime, lang: Language): string {
  const H = analogHour(t.h);
  const N = analogHour(H + 1);
  const pointsAt = t.m / 5;
  const exactNumber = Number.isInteger(pointsAt);
  const minuteNumber = analogHour(Math.round(pointsAt));
  if (lang === 'nl') {
    const hourPart =
      t.m === 0
        ? `De korte wijzer staat precies op de ${H}.`
        : `De korte wijzer staat tussen de ${H} en de ${N}.`;
    const minutePart = exactNumber
      ? `De lange wijzer wijst naar de ${t.m === 0 ? 12 : minuteNumber}: dat is ${t.m} minuten.`
      : `De lange wijzer staat op streepje ${t.m}: dat is ${t.m} minuten.`;
    return `${hourPart} ${minutePart} Dus: ${phraseNl(t)}.`;
  }
  const hourPart =
    t.m === 0
      ? `The short hand points exactly at ${H}.`
      : `The short hand is between ${H} and ${N}.`;
  const minutePart = exactNumber
    ? `The long hand points at ${t.m === 0 ? 12 : minuteNumber}: that is ${t.m} minutes.`
    : `The long hand is on tick ${t.m}: that is ${t.m} minutes.`;
  return `${hourPart} ${minutePart} So: ${phraseEn(t)}.`;
}

export function explainDayTime(t: ClockTime, lang: Language): string {
  const digital = formatDigital(t, true);
  const said = phraseWithDayPart(t, lang);
  if (t.h > 12) {
    return lang === 'nl'
      ? `${t.h} − 12 = ${t.h - 12}. Dus ${digital} is ${said}.`
      : `${t.h} − 12 = ${t.h - 12}. So ${digital} is ${said}.`;
  }
  if (t.h === 0) {
    return lang === 'nl'
      ? `00 is middernacht (12 uur). Dus ${digital} is ${said}.`
      : `00 is midnight (12 o'clock). So ${digital} is ${said}.`;
  }
  return lang === 'nl' ? `${digital} is ${said}.` : `${digital} is ${said}.`;
}

export function explainDuration(start: ClockTime, end: ClockTime, lang: Language): string {
  const d = toMinutes(end) - toMinutes(start);
  const nextFullHour = Math.min(toMinutes(end), (start.h + 1) * 60);
  const toHour = nextFullHour - toMinutes(start);
  const rest = d - toHour;
  const s = formatDigital(start, true);
  const e = formatDigital(end, true);
  const mid = formatDigital(fromMinutes(nextFullHour), true);
  if (lang === 'nl') {
    if (rest <= 0 || toHour <= 0) return `Van ${s} tot ${e} is ${formatDuration(d, 'nl')}.`;
    return `Van ${s} tot ${mid} is ${toHour} min. Van ${mid} tot ${e} is ${formatDuration(rest, 'nl')}. Samen: ${formatDuration(d, 'nl')}.`;
  }
  if (rest <= 0 || toHour <= 0) return `From ${s} to ${e} is ${formatDuration(d, 'en')}.`;
  return `From ${s} to ${mid} is ${toHour} min. From ${mid} to ${e} is ${formatDuration(rest, 'en')}. Together: ${formatDuration(d, 'en')}.`;
}

// ---------- Random helpers ----------

function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(rng: Rng, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function shuffle<T>(rng: Rng, items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Random time on the level's minute grid. Half/quarter levels favour the new skill. */
export function randomTimeForLevel(level: ClockLevel, rng: Rng, use24h = level.use24h): ClockTime {
  const h = use24h ? randInt(rng, 0, 23) : randInt(rng, 1, 12);
  let m: number;
  if (level.stepMinutes === 60) {
    m = 0;
  } else if (level.stepMinutes === 30) {
    m = rng() < 0.7 ? 30 : 0;
  } else if (level.stepMinutes === 15) {
    m = rng() < 0.75 ? pick(rng, [15, 45]) : pick(rng, [0, 30]);
  } else {
    m = randInt(rng, 0, 60 / level.stepMinutes - 1) * level.stepMinutes;
  }
  return { h, m };
}

// ---------- Distractors built from typical mistakes ----------

/**
 * Wrong answers that children typically give: swapping the hands, the "half vier"
 * one-hour mix-up, past/to mirror, and being one step off.
 */
export function timeDistractors(
  answer: ClockTime,
  level: ClockLevel,
  count: number,
  rng: Rng
): ClockTime[] {
  const step = level.stepMinutes;
  const candidates: ClockTime[] = [];
  const add = (t: ClockTime) => candidates.push(fromMinutes(toMinutes(t)));

  // Swapped hands: the short hand read as minutes and the long hand as hours.
  const swappedHour = Math.round(answer.m / 5) % 12;
  add({ h: swappedHour === 0 ? 12 : swappedHour, m: (answer.h % 12) * 5 });
  // "half vier" means 3:30, a common mistake is 4:30. Also off by an hour the other way.
  add({ h: answer.h + 1, m: answer.m });
  add({ h: answer.h - 1, m: answer.m });
  // Past/to mirror: kwart over ↔ kwart voor.
  add({ h: answer.h, m: (60 - answer.m) % 60 });
  // One step off on the minute hand.
  add(fromMinutes(toMinutes(answer) + step));
  add(fromMinutes(toMinutes(answer) - step));

  const seen = new Set<string>([`${answer.h % 12}:${answer.m}`]);
  const result: ClockTime[] = [];
  for (const c of shuffle(rng, candidates)) {
    if (c.m % step !== 0) continue;
    const normalized = { h: analogHour(c.h), m: c.m };
    const key = `${normalized.h % 12}:${normalized.m}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length === count) return result;
  }
  let guard = 0;
  while (result.length < count && guard++ < 200) {
    const t = randomTimeForLevel(level, rng, false);
    const key = `${t.h % 12}:${t.m}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(t);
  }
  return result;
}

/** 24h distractors: same clock in the wrong part of the day, or reading "16" as "6". */
function dayTimeDistractors(answer: ClockTime, count: number, rng: Rng): ClockTime[] {
  const candidates: ClockTime[] = [
    { h: (answer.h + 12) % 24, m: answer.m },
    { h: answer.h % 10, m: answer.m },
    { h: (answer.h + 1) % 24, m: answer.m },
    { h: answer.h, m: (60 - answer.m) % 60 },
    { h: (answer.h + 23) % 24, m: answer.m },
  ];
  const seen = new Set<string>([`${answer.h}:${answer.m}`]);
  const out: ClockTime[] = [];
  for (const c of shuffle(rng, candidates)) {
    const key = `${c.h}:${c.m}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length === count) break;
  }
  return out;
}

function durationDistractors(answer: number, level: ClockLevel, count: number, rng: Rng): number[] {
  const step = level.durationStep;
  const candidates = [answer + step, answer - step, answer + 60, answer - 60, answer + 30, answer - 30, answer + 2 * step];
  const seen = new Set<number>([answer]);
  const out: number[] = [];
  for (const c of shuffle(rng, candidates)) {
    if (c <= 0 || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length === count) break;
  }
  let extra = 1;
  while (out.length < count) {
    const c = answer + step * (extra + 2);
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
    extra++;
  }
  return out;
}

// ---------- Task generation ----------

/** Snap size for dragging the minute hand on the interactive clock. */
export function setSnapMinutes(level: ClockLevel): number {
  if (level.stepMinutes >= 15) return 15;
  if (level.stepMinutes === 10) return 5;
  return level.stepMinutes;
}

export function isSetAnswerCorrect(target: ClockTime, attempt: ClockTime): boolean {
  return sameOnAnalog(target, attempt);
}

let taskCounter = 0;

export function generateClockTask(
  levelId: number,
  kind: ClockTaskKind,
  rng: Rng = Math.random,
  eventCount = 12
): ClockTask {
  const level = getClockLevel(levelId);
  const id = `clock-${levelId}-${kind}-${taskCounter++}`;
  const eventIndex = Math.floor(rng() * eventCount);
  const optionsCount = level.choiceCount - 1;

  const withChoices = (answer: ClockChoice, wrong: ClockChoice[]) => {
    const all = shuffle(rng, [answer, ...wrong]);
    return { choices: all, correctIndex: all.findIndex((c) => c.key === answer.key) };
  };
  const timeChoice = (t: ClockTime): ClockChoice => ({ key: `${t.h}:${t.m}`, time: t });

  if (kind === 'duration') {
    const durationSteps = Math.max(1, Math.floor(level.maxDurationMinutes / level.durationStep));
    const durationMinutes = randInt(rng, 1, durationSteps) * level.durationStep;
    const startGrid = Math.min(level.durationStep, 15);
    const startHour = randInt(rng, level.use24h ? 7 : 1, level.use24h ? 20 : 9);
    const startMin = level.stepMinutes === 1 ? randInt(rng, 0, 59) : randInt(rng, 0, 60 / startGrid - 1) * startGrid;
    const start = { h: startHour, m: startMin };
    const end = fromMinutes(toMinutes(start) + durationMinutes);
    const answer: ClockChoice = { key: `d${durationMinutes}`, minutes: durationMinutes };
    const wrong = durationDistractors(durationMinutes, level, optionsCount, rng).map((d) => ({ key: `d${d}`, minutes: d }));
    return {
      id,
      kind,
      levelId,
      time: start,
      endTime: end,
      durationMinutes,
      showAs: level.use24h || level.stepMinutes <= 5 ? 'digital' : 'analog',
      eventIndex,
      ...withChoices(answer, wrong),
    };
  }

  if (kind === 'dayTime') {
    const time = randomTimeForLevel(level, rng, true);
    if (time.h < 13 && rng() < 0.75) time.h += 12;
    const wrong = dayTimeDistractors(time, optionsCount, rng).map(timeChoice);
    return { id, kind, levelId, time, showAs: 'digital', eventIndex, ...withChoices(timeChoice(time), wrong) };
  }

  const time = kind === 'set' && level.use24h ? randomTimeForLevel(level, rng, true) : randomTimeForLevel(level, rng, false);

  if (kind === 'set') {
    const showAs = level.use24h ? 'digital' : rng() < 0.6 ? 'phrase' : 'digital';
    return { id, kind, levelId, time, showAs, eventIndex, choices: [], correctIndex: -1 };
  }

  const wrong = timeDistractors(time, level, optionsCount, rng).map(timeChoice);
  const showAs = kind === 'match' ? 'digital' : 'analog';
  return { id, kind, levelId, time, showAs, eventIndex, ...withChoices(timeChoice(time), wrong) };
}

/** Builds a varied question deck: every kind of the level appears before any repeats. */
export function buildClockStageDeck(levelId: number, count: number, rng: Rng = Math.random, eventCount = 12): ClockTask[] {
  const level = getClockLevel(levelId);
  const kinds: ClockTaskKind[] = [];
  while (kinds.length < count) kinds.push(...shuffle(rng, level.kinds));
  return kinds.slice(0, count).map((k) => generateClockTask(levelId, k, rng, eventCount));
}

export function clockStars(correct: number, attempts: number): 1 | 2 | 3 {
  if (attempts <= 0) return 1;
  const accuracy = correct / attempts;
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  return 1;
}

export const CLOCK_REWARDS = {
  correctGems: 2,
  correctXp: 10,
  feverMultiplier: 2,
  feverStreak: 3,
  bossHitGems: 3,
  bossHitXp: 15,
  stageClearGems: 10,
  stageClearXp: 60,
  perStarGems: 5,
};
