import type { Language } from '../i18n/translations';
import type { ClockTask } from './clockEngine';

/**
 * "The Honmoon Time Heist": Gwi-Ma's demons stole the hands of the Honmoon Clock on the
 * last day of the HUNTR/X World Tour. Every level is one part of that day.
 */

export type StorySpeaker = 'rumi' | 'mira' | 'zoey' | 'derpy' | 'boss';
type Bilingual = { nl: string; en: string };

export interface StoryLine {
  speaker: StorySpeaker;
  text: Bilingual;
}

export interface ClockChapter {
  levelId: number;
  emoji: string;
  title: Bilingual;
  intro: StoryLine[];
  bossName: Bilingual;
  bossTaunt: Bilingual;
  outro: StoryLine;
}

export const CLOCK_CHAPTERS: ClockChapter[] = [
  {
    levelId: 1,
    emoji: '🎤',
    title: { nl: 'De Ochtendrepetitie', en: 'Morning Rehearsal' },
    intro: [
      { speaker: 'derpy', text: { nl: 'Grrraaauw! De wijzers van de Honmoon-Klok zijn gestolen!', en: 'Rrrawr! The hands of the Honmoon Clock have been stolen!' } },
      { speaker: 'rumi', text: { nl: 'Zonder klok weet niemand wanneer de repetitie begint. Wij lossen dit op!', en: "Without the clock, nobody knows when rehearsal starts. We'll fix this!" } },
      { speaker: 'mira', text: { nl: 'Tip: de korte wijzer wijst het uur aan. Staat de lange wijzer op de 12? Dan is het precies ... uur.', en: "Tip: the short hand shows the hour. Is the long hand on 12? Then it's exactly ... o'clock." } },
    ],
    bossName: { nl: 'Tik-Tak Imp', en: 'Tick-Tock Imp' },
    bossTaunt: { nl: 'Hihi! Ik draai alle uren door elkaar!', en: 'Hee hee! I scramble all the hours!' },
    outro: { speaker: 'rumi', text: { nl: 'De uren zijn terug! De repetitie kan beginnen. 🎶', en: 'The hours are back! Rehearsal can start. 🎶' } },
  },
  {
    levelId: 2,
    emoji: '🍜',
    title: { nl: 'De Ramyeon-Pauze', en: 'The Ramyeon Break' },
    intro: [
      { speaker: 'zoey', text: { nl: 'Mijn maag knort... maar de ramyeon-tent gaat pas om HALF open!', en: 'My tummy is rumbling... but the ramyeon stand only opens at HALF past!' } },
      { speaker: 'mira', text: { nl: 'Let op: "half vier" betekent een half uur vóór vier uur. Dus 3:30!', en: 'Careful: in Dutch "half vier" means half an hour BEFORE four. So 3:30!' } },
      { speaker: 'rumi', text: { nl: 'Staat de lange wijzer op de 6? Dan is het half.', en: "Is the long hand on 6? Then it's half past." } },
    ],
    bossName: { nl: 'Slurp-Demon', en: 'Slurp Demon' },
    bossTaunt: { nl: 'Slurrrp! Ik eet alle halve uren op!', en: 'Slurrrp! I eat all the half hours!' },
    outro: { speaker: 'zoey', text: { nl: 'Ramyeon-tijd! Precies op tijd. 🍜', en: 'Ramyeon time! Right on time. 🍜' } },
  },
  {
    levelId: 3,
    emoji: '💃',
    title: { nl: 'De Dansrepetitie', en: 'Dance Practice' },
    intro: [
      { speaker: 'mira', text: { nl: 'Onze nieuwe dans wisselt elk kwartier. Ik moet de kwartieren kennen!', en: 'Our new dance switches every quarter hour. I need to know my quarters!' } },
      { speaker: 'rumi', text: { nl: 'Lange wijzer op de 3: kwart over. Op de 9: kwart voor.', en: 'Long hand on 3: quarter past. On 9: quarter to.' } },
      { speaker: 'derpy', text: { nl: 'Ik dans mee! ...Of ik val om. Grrr.', en: "I'll dance too! ...Or fall over. Grrr." } },
    ],
    bossName: { nl: 'Kwartier-Kobold', en: 'Quarter Goblin' },
    bossTaunt: { nl: 'Over? Voor? Ik maak je helemaal in de war!', en: "Past? To? I'll mix you up completely!" } ,
    outro: { speaker: 'mira', text: { nl: 'Perfecte timing! De dans staat. 💃', en: 'Perfect timing! The dance is ready. 💃' } },
  },
  {
    levelId: 4,
    emoji: '💌',
    title: { nl: 'De Fanmeeting', en: 'The Fan Meeting' },
    intro: [
      { speaker: 'rumi', text: { nl: 'Honderden fans staan in de rij. Hoe lang moeten ze wachten?', en: 'Hundreds of fans are in line. How long do they have to wait?' } },
      { speaker: 'zoey', text: { nl: 'Tel van de begintijd naar de eindtijd. Eerst naar het hele uur, dan de rest!', en: 'Count from the start time to the end time. First to the full hour, then the rest!' } },
    ],
    bossName: { nl: 'Wachtrij-Demon', en: 'Queue Demon' },
    bossTaunt: { nl: 'Muhaha! Ik laat iedereen eeuwig wachten!', en: 'Muhaha! I make everyone wait forever!' },
    outro: { speaker: 'zoey', text: { nl: 'Alle fans hebben een handtekening! 💌', en: 'Every fan got an autograph! 💌' } },
  },
  {
    levelId: 5,
    emoji: '📻',
    title: { nl: 'Het Radio-Interview', en: 'The Radio Interview' },
    intro: [
      { speaker: 'mira', text: { nl: 'Op de radio telt elke tien minuten. Zeg je tijden precies!', en: 'On the radio every ten minutes counts. Say your times exactly!' } },
      { speaker: 'rumi', text: { nl: 'Elk cijfer op de klok is 5 minuten. Twee cijfers verder is 10 minuten.', en: 'Each number on the clock is 5 minutes. Two numbers further is 10 minutes.' } },
    ],
    bossName: { nl: 'Ruis-Demon', en: 'Static Demon' },
    bossTaunt: { nl: 'Krrrssshhh! Hoe laat? Niemand hoort het!', en: 'Krrrssshhh! What time? Nobody can hear!' },
    outro: { speaker: 'mira', text: { nl: 'Live op de radio, en helemaal op tijd! 📻', en: 'Live on air, and perfectly on time! 📻' } },
  },
  {
    levelId: 6,
    emoji: '🔊',
    title: { nl: 'Soundcheck in het Stadion', en: 'Stadium Soundcheck' },
    intro: [
      { speaker: 'zoey', text: { nl: 'De soundcheck loopt per 5 minuten. Vijf voor half, vijf over half... let goed op!', en: 'Soundcheck runs in 5-minute slots. Twenty-five past, twenty-five to... pay attention!' } },
      { speaker: 'rumi', text: { nl: 'Kijk waar de lange wijzer staat: tel per 5 vanaf de 12.', en: 'Look where the long hand is: count in fives from 12.' } },
    ],
    bossName: { nl: 'Piep-Demon', en: 'Feedback Fiend' },
    bossTaunt: { nl: 'PIEEEEP! Mijn herrie verstoort je tijd!', en: 'SQUEEEAL! My noise wrecks your timing!' },
    outro: { speaker: 'zoey', text: { nl: 'Het geluid is perfect! Het stadion is klaar. 🔊', en: 'The sound is perfect! The stadium is ready. 🔊' } },
  },
  {
    levelId: 7,
    emoji: '🚌',
    title: { nl: 'De Tourbus bij Nacht', en: 'The Night Tour Bus' },
    intro: [
      { speaker: 'mira', text: { nl: 'Het tour-schema gebruikt de 24-uursklok. 16:45 is kwart voor vijf \'s middags!', en: 'The tour schedule uses the 24-hour clock. 16:45 is quarter to five in the afternoon!' } },
      { speaker: 'rumi', text: { nl: 'Na 12 uur tel je door: 13, 14, 15... Haal er 12 af om het klokuur te vinden.', en: 'After 12 you keep counting: 13, 14, 15... Take away 12 to find the clock hour.' } },
      { speaker: 'derpy', text: { nl: 'Ik slaap al om 20:00. Dat is acht uur \'s avonds. Zzz...', en: 'I go to sleep at 20:00. That is eight in the evening. Zzz...' } },
    ],
    bossName: { nl: 'Middernacht-Saja', en: 'Midnight Saja' },
    bossTaunt: { nl: 'Is het ochtend of avond? Jij weet het niet!', en: "Is it morning or evening? You'll never know!" },
    outro: { speaker: 'rumi', text: { nl: 'De bus rijdt op schema naar de finale! 🚌', en: 'The bus is right on schedule for the finale! 🚌' } },
  },
  {
    levelId: 8,
    emoji: '⏱️',
    title: { nl: 'Backstage Aftellen', en: 'Backstage Countdown' },
    intro: [
      { speaker: 'zoey', text: { nl: 'Backstage telt elke minuut. Kijk naar de kleine streepjes!', en: 'Backstage every minute counts. Look at the little ticks!' } },
      { speaker: 'mira', text: { nl: 'Tel vanaf het dichtstbijzijnde cijfer: 7 over half is 37 minuten.', en: 'Count from the nearest number: two ticks after the 7 is 37 minutes.' } },
    ],
    bossName: { nl: 'Minuten-Rover', en: 'Minute Snatcher' },
    bossTaunt: { nl: 'Ik steel één minuutje... en nog één... en nog één!', en: "I'll steal one little minute... and another... and another!" },
    outro: { speaker: 'zoey', text: { nl: 'Op de minuut klaar! Het licht gaat uit... 🌟', en: 'Ready to the minute! The lights go down... 🌟' } },
  },
  {
    levelId: 9,
    emoji: '👑',
    title: { nl: 'Het Gouden Finaleconcert', en: 'The Golden Finale' },
    intro: [
      { speaker: 'boss', text: { nl: 'Ik ben Gwi-Ma! Zonder tijd valt jullie Honmoon voor altijd!', en: 'I am Gwi-Ma! Without time, your Honmoon falls forever!' } },
      { speaker: 'rumi', text: { nl: 'Niet vandaag! Alles wat we geleerd hebben, gebruiken we nu.', en: 'Not today! We use everything we have learned.' } },
      { speaker: 'mira', text: { nl: 'Uren, kwartieren, minuten, 24 uur, hoe lang... samen kunnen we het!', en: 'Hours, quarters, minutes, 24-hour, how long... together we can do it!' } },
    ],
    bossName: { nl: 'Gwi-Ma', en: 'Gwi-Ma' },
    bossTaunt: { nl: 'Jullie klok zal nooit meer tikken!', en: 'Your clock will never tick again!' },
    outro: { speaker: 'rumi', text: { nl: 'De Honmoon-Klok tikt weer! Het Gouden Concert is gered! 👑', en: 'The Honmoon Clock ticks again! The Golden Concert is saved! 👑' } },
  },
];

export function getChapter(levelId: number): ClockChapter {
  return CLOCK_CHAPTERS.find((c) => c.levelId === levelId) ?? CLOCK_CHAPTERS[0];
}

export const CLOCK_EVENTS: Bilingual[] = [
  { nl: 'de soundcheck', en: 'the soundcheck' },
  { nl: 'de dansrepetitie', en: 'dance practice' },
  { nl: 'de ramyeon-pauze', en: 'the ramyeon break' },
  { nl: 'de fanmeeting', en: 'the fan meeting' },
  { nl: 'het radio-interview', en: 'the radio interview' },
  { nl: 'de fotoshoot', en: 'the photo shoot' },
  { nl: 'de tourbus', en: 'the tour bus' },
  { nl: 'de zangles', en: 'the vocal lesson' },
  { nl: 'make-up en haar', en: 'hair and make-up' },
  { nl: 'de livestream', en: 'the livestream' },
  { nl: 'het concert', en: 'the concert' },
  { nl: "Derpy's dutje", en: "Derpy's nap" },
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The tour-day event a question belongs to, shown as a small tag. */
export function taskEvent(task: ClockTask, lang: Language): string {
  return capitalize(CLOCK_EVENTS[task.eventIndex % CLOCK_EVENTS.length][lang]);
}

/** The short, one-line question text. */
export function taskPrompt(task: ClockTask, lang: Language): string {
  const nl = lang === 'nl';
  switch (task.kind) {
    case 'read':
      return nl ? 'Hoe laat is het?' : 'What time is it?';
    case 'words':
    case 'dayTime':
      return nl ? 'Welke tijd is dit?' : 'Which time is this?';
    case 'match':
      return nl ? 'Welke klok klopt?' : 'Which clock is right?';
    case 'set':
      return nl ? 'Zet de wijzers!' : 'Set the hands!';
    case 'duration':
      return nl ? 'Hoe lang duurt het?' : 'How long does it take?';
  }
}

export const CLOCK_REACTIONS = {
  correct: [
    { nl: 'Yes! Precies goed!', en: 'Yes! Spot on!' },
    { nl: 'De Honmoon gloeit! ✨', en: 'The Honmoon glows! ✨' },
    { nl: 'Strak op de beat!', en: 'Right on the beat!' },
    { nl: 'Golden timing!', en: 'Golden timing!' },
    { nl: 'Dat is een HUNTR/X-move!', en: "That's a HUNTR/X move!" },
  ],
  wrong: [
    { nl: 'Bijna! Kijk nog eens samen:', en: "Almost! Let's look together:" },
    { nl: 'Geen zorgen, zo leer je het:', en: "No worries, here's the trick:" },
    { nl: 'Oei, die demon was slim. Kijk:', en: 'Oops, that demon was sneaky. Look:' },
  ],
  fever: { nl: '🔥 FEVER! Dubbele gems!', en: '🔥 FEVER! Double gems!' },
  bossHit: [
    { nl: 'Raak! De demon wankelt!', en: 'Hit! The demon staggers!' },
    { nl: 'Golden Honmoon-slag!', en: 'Golden Honmoon strike!' },
    { nl: 'Nog even volhouden!', en: 'Keep going!' },
  ],
};

export function pickLine<T>(lines: T[], seed: number): T {
  return lines[Math.abs(seed) % lines.length];
}
