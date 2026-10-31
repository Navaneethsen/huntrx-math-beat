import type { SkillId, SealSize } from './kakoomaGenerator';
import type { SchoolGroupId } from './progressionStore';

export interface GroupMissionCard {
  id: string;
  skill: SkillId;
  sealSize: SealSize;
  badgeEmoji: string;
  title: { nl: string; en: string };
  ixlSkillCode: { nl: string; en: string };
  description: { nl: string; en: string };
}

export interface CurriculumGroupSpec {
  id: SchoolGroupId;
  shortLabel: { nl: string; en: string };
  fullTitle: { nl: string; en: string };
  ageRange: string;
  mascotEmoji: string;
  hunterGuide: 'rumi' | 'mira' | 'zoey';
  accentGradient: string;
  defaultSkill: SkillId;
  defaultSealSize: SealSize;
  transcriptQuote: { nl: string; en: string };
  ixlSummary: { nl: string; en: string };
  conceptTags: { nl: string[]; en: string[] };
  missions: GroupMissionCard[];
}

export const SCHOOL_GROUP_ORDER: SchoolGroupId[] = [
  'g3',
  'g4',
  'g5',
  'g6',
  'g7',
  'g8',
];

export const CURRICULUM_GROUPS: CurriculumGroupSpec[] = [
  {
    id: 'g3',
    shortLabel: { nl: 'Groep 3', en: 'Year 1 • PYP 1' },
    fullTitle: {
      nl: 'Groep 3 (IB PYP 1) • Derpy’s Sterren-Start',
      en: 'Year 1 / IB PYP 1 • Derpy’s Star Starter',
    },
    ageRange: '6–7',
    mascotEmoji: '🐯',
    hunterGuide: 'zoey',
    accentGradient: 'from-cyan-400 via-sky-500 to-blue-600',
    defaultSkill: 'add10',
    defaultSealSize: 4,
    transcriptQuote: {
      nl: '“Wacht... lach je nou naar mij, tijger?” — Jinu tegen Derpy 🐯',
      en: '“Wait... You’re smiling?” — Jinu to Derpy the Tiger 🐯',
    },
    ixlSummary: {
      nl: 'Vriendjes van 10, getallenlijn-sprongen (0–20), dubbelen, halveren en eerste plus- & minsommen.',
      en: 'Number bonds to 10, number-line hops (0–20), doubles, halves, and first addition & subtraction.',
    },
    conceptTags: {
      nl: ['📏 Getallenlijn 0–20', '🤝 Vriendjes van 10', '🎲 Dubbelen & Halveren', '➕ Plus & Min tot 20'],
      en: ['📏 Number Line 0–20', '🤝 Bonds to 10', '🎲 Doubles & Halves', '➕ Add & Sub to 20'],
    },
    missions: [
      {
        id: 'g3_m1',
        skill: 'add10',
        sealSize: 4,
        badgeEmoji: '🤝',
        title: { nl: 'Vriendjes van 10', en: 'Number Bonds to 10' },
        ixlSkillCode: { nl: 'Groep 3 • Start 1', en: 'PYP 1 • Stage 1' },
        description: {
          nl: 'Zoek 2 getallen die samen een som tot 10 maken!',
          en: 'Spot 2 friendly numbers that bond up to 10!',
        },
      },
      {
        id: 'g3_m2',
        skill: 'add10',
        sealSize: 5,
        badgeEmoji: '🌟',
        title: { nl: '5-Blad Ster tot 10', en: '5-Petal Star to 10' },
        ixlSkillCode: { nl: 'Groep 3 • Start 2', en: 'PYP 1 • Stage 2' },
        description: {
          nl: '5 blaadjes met vrolijke sommen tot 10!',
          en: '5 petals with friendly sums up to 10!',
        },
      },
      {
        id: 'g3_m3',
        skill: 'add20',
        sealSize: 4,
        badgeEmoji: '🚀',
        title: { nl: 'Sprong naar de 20', en: 'Jump to 20' },
        ixlSkillCode: { nl: 'Groep 3 • Start 3', en: 'PYP 1 • Stage 3' },
        description: {
          nl: 'Dubbelen (6+6) en optellen via de 10 tot 20!',
          en: 'Doubles (6+6) and bridging through 10 up to 20!',
        },
      },
      {
        id: 'g3_m4',
        skill: 'sub20',
        sealSize: 4,
        badgeEmoji: '➖',
        title: { nl: 'Eerste Minsommen', en: 'First Subtraction' },
        ixlSkillCode: { nl: 'Groep 3 • Start 4', en: 'PYP 1 • Stage 4' },
        description: {
          nl: 'Verschil zoeken en terugtellen onder de 20.',
          en: 'Find the difference and count back within 20.',
        },
      },
    ],
  },
  {
    id: 'g4',
    shortLabel: { nl: 'Groep 4', en: 'Year 2 • PYP 2' },
    fullTitle: {
      nl: 'Groep 4 (IB PYP 2) • Zoey’s Ritme Crew',
      en: 'Year 2 / IB PYP 2 • Zoey’s Rhythm Crew',
    },
    ageRange: '7–8',
    mascotEmoji: '🎤',
    hunterGuide: 'zoey',
    accentGradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    defaultSkill: 'add20',
    defaultSealSize: 4,
    transcriptQuote: {
      nl: '“Wassup! Ga lekker zitten allemaal, showtime!” — Zoey 🎤',
      en: '“Wassup! Take a seat, guys — it’s showtime!” — Zoey 🎤',
    },
    ixlSummary: {
      nl: 'Getallenlijn tot 100, tiental-sprongen, afronden, thermometer onder nul en tafels 2, 5, 10.',
      en: 'Number line to 100, ten-jumps, rounding to 10, sub-zero thermometer, and 2×, 5×, 10× tables.',
    },
    conceptTags: {
      nl: ['📏 Getallenlijn 0–100', '❄️ Thermometer −5 tot +15', '✖️ Tafels 2, 5, 10', '🎯 Afronden op 10'],
      en: ['📏 Number Line 0–100', '❄️ Sub-Zero −5 to +15', '✖️ 2×, 5×, 10× Tables', '🎯 Rounding to 10'],
    },
    missions: [
      {
        id: 'g4_m1',
        skill: 'add20',
        sealSize: 5,
        title: { nl: 'Over de 10 Kampioen', en: 'Bridge-Through-10 Champion' },
        badgeEmoji: '➕',
        ixlSkillCode: { nl: 'Groep 4 • Ritme 1', en: 'PYP 2 • Stage 1' },
        description: {
          nl: 'Reken razendsnel 8 + 7 en 9 + 6 uit via de 10!',
          en: 'Master 8 + 7 and 9 + 6 by bridging through 10!',
        },
      },
      {
        id: 'g4_m2',
        skill: 'sub20',
        sealSize: 5,
        title: { nl: 'Minsommen tot 20', en: 'Subtraction within 20' },
        badgeEmoji: '⚔️',
        ixlSkillCode: { nl: 'Groep 4 • Ritme 2', en: 'PYP 2 • Stage 2' },
        description: {
          nl: 'Versterk het Honmoon-schild met minsommen tot 20.',
          en: 'Power the Honmoon shield with subtraction facts to 20.',
        },
      },
      {
        id: 'g4_m3',
        skill: 'multEasy',
        sealSize: 4,
        title: { nl: 'Start-Tafels (2, 5, 10)', en: 'Starter Tables (2, 5, 10)' },
        badgeEmoji: '✖️',
        ixlSkillCode: { nl: 'Groep 4 • Ritme 3', en: 'PYP 2 • Stage 3' },
        description: {
          nl: 'Begin met de vrolijke tafels van 2, 3, 4, 5 en 10!',
          en: 'Jump into the friendly 2×, 3×, 4×, 5× and 10× tables!',
        },
      },
      {
        id: 'g4_m4',
        skill: 'add50',
        sealSize: 4,
        title: { nl: 'Tiental-Sprong tot 50', en: 'Ten-Jumps up to 50' },
        badgeEmoji: '🎯',
        ixlSkillCode: { nl: 'Groep 4 • Ritme 4', en: 'PYP 2 • Stage 4' },
        description: {
          nl: 'Optellen tot 50 met handige sprongen van 10.',
          en: 'Add two-digit numbers up to 50 with ten-jumps.',
        },
      },
    ],
  },
  {
    id: 'g5',
    shortLabel: { nl: 'Groep 5', en: 'Year 3 • PYP 3' },
    fullTitle: {
      nl: 'Groep 5 (IB PYP 3) • Mira’s Gokdo Dans-Dojo',
      en: 'Year 3 / IB PYP 3 • Mira’s Gokdo Dance Dojo',
    },
    ageRange: '8–9',
    mascotEmoji: '💃',
    hunterGuide: 'mira',
    accentGradient: 'from-pink-500 via-fuchsia-500 to-purple-600',
    defaultSkill: 'multEasy',
    defaultSealSize: 4,
    transcriptQuote: {
      nl: '“Want wij zijn jagers, onze stemmen zijn sterk!” — Mira 💃',
      en: '“Cause we are hunters, voices strong and I know I believe!” — Mira 💃',
    },
    ixlSummary: {
      nl: 'Tafels 2 t/m 10, delers & veelvouden (start GGD & KGV), getallenlijn-middelpunt, negatieve sprongen tot −20 en omtrek.',
      en: 'Times tables 2–10, factors & multiples (starter HCF & LCM), number-line midpoints, negative jumps to −20, and perimeter.',
    },
    conceptTags: {
      nl: ['📏 Getallenlijn & Midden', '❄️ Sub-Zero −20 tot +20', '✖️ Alle Tafels 2–10', '🎸 Start GGD & KGV'],
      en: ['📏 Number Line Midpoints', '❄️ Sub-Zero −20 to +20', '✖️ All Tables 2–10', '🎸 Starter HCF & LCM'],
    },
    missions: [
      {
        id: 'g5_m1',
        skill: 'multEasy',
        sealSize: 5,
        title: { nl: 'Tafels 2, 3, 4, 5 & 10', en: 'Core Tables 2, 3, 4, 5 & 10' },
        badgeEmoji: '💃',
        ixlSkillCode: { nl: 'Groep 5 • Dans 1', en: 'PYP 3 • Stage 1' },
        description: {
          nl: 'Dans op de beat van de basis-keersommen!',
          en: 'Dance to the beat of the core multiplication tables!',
        },
      },
      {
        id: 'g5_m2',
        skill: 'add50',
        sealSize: 5,
        title: { nl: 'Gouden Sommen tot 50', en: 'Golden Sums to 50' },
        badgeEmoji: '✨',
        ixlSkillCode: { nl: 'Groep 5 • Dans 2', en: 'PYP 3 • Stage 2' },
        description: {
          nl: 'Twee getallen bij elkaar optellen tot 50.',
          en: 'Combine two numbers smoothly up to 50.',
        },
      },
      {
        id: 'g5_m3',
        skill: 'sub100',
        sealSize: 4,
        title: { nl: 'Aftrekken tot 100', en: 'Subtraction to 100' },
        badgeEmoji: '🛡️',
        ixlSkillCode: { nl: 'Groep 5 • Dans 3', en: 'PYP 3 • Stage 3' },
        description: {
          nl: 'Gebruik de aanvul-truc om grote minsommen te kraken!',
          en: 'Use the count-up trick to crack bigger subtractions!',
        },
      },
      {
        id: 'g5_m4',
        skill: 'multAll',
        sealSize: 4,
        title: { nl: 'Alle Tafels (6, 7, 8, 9)', en: 'All Tables (6, 7, 8, 9)' },
        badgeEmoji: '🔥',
        ixlSkillCode: { nl: 'Groep 5 • Dans 4', en: 'PYP 3 • Stage 4' },
        description: {
          nl: 'Ontdek de 5×-steunpunt truc voor de tafels van 6, 7, 8 en 9!',
          en: 'Unlock the 5× stepping-stone trick for 6×, 7×, 8× and 9×!',
        },
      },
    ],
  },
  {
    id: 'g6',
    shortLabel: { nl: 'Groep 6', en: 'Year 4 • PYP 4' },
    fullTitle: {
      nl: 'Groep 6 (IB PYP 4) • Rumi’s Saingeom Squad',
      en: 'Year 4 / IB PYP 4 • Rumi’s Saingeom Squad',
    },
    ageRange: '9–10',
    mascotEmoji: '⚔️',
    hunterGuide: 'rumi',
    accentGradient: 'from-amber-400 via-pink-500 to-purple-600',
    defaultSkill: 'multAll',
    defaultSealSize: 4,
    transcriptQuote: {
      nl: '“Nu staan we in het gevecht — dit wordt een TAKEDOWN!” — Rumi ⚔️',
      en: '“Now we’re in the fight, it’s a takedown!” — Rumi ⚔️',
    },
    ixlSummary: {
      nl: 'Negatieve getallenlijn (−30 tot +30), deeltafels, GGD & KGV (delers en veelvouden), breuken en oppervlakte.',
      en: 'Negative number line (−30 to +30), division facts, HCF & LCM (factors and multiples), fractions, and area.',
    },
    conceptTags: {
      nl: ['❄️ Negatieve Lijn −30..+30', '➗ Deeltafels 2–12', '🍕 Breuken & Kommagetallen', '🎸 GGD & KGV (Delers & Veelvouden)'],
      en: ['❄️ Negative Line −30..+30', '➗ Division Facts 2–12', '🍕 Fractions & Decimals', '🎸 HCF & LCM (Factors & Multiples)'],
    },
    missions: [
      {
        id: 'g6_m1',
        skill: 'multAll',
        sealSize: 5,
        title: { nl: 'Tafel-Meester 2 t/m 10', en: 'Times Table Master 2–10' },
        badgeEmoji: '⚔️',
        ixlSkillCode: { nl: 'Groep 6 • Zwaard 1', en: 'PYP 4 • Stage 1' },
        description: {
          nl: 'Versla de Saja Boys met alle tafels door elkaar!',
          en: 'Outshine the Saja Boys with all multiplication tables!',
        },
      },
      {
        id: 'g6_m2',
        skill: 'divAll',
        sealSize: 4,
        title: { nl: 'Deelsommen Kraker', en: 'Division Rune Breaker' },
        badgeEmoji: '➗',
        ixlSkillCode: { nl: 'Groep 6 • Zwaard 2', en: 'PYP 4 • Stage 2' },
        description: {
          nl: 'Gebruik de omgekeerde tafel-truc om deelsommen te vinden!',
          en: 'Use inverse multiplication to solve division seals!',
        },
      },
      {
        id: 'g6_m3',
        skill: 'fracEasy',
        sealSize: 4,
        title: { nl: 'Eerste Breuken (1/4 + 2/4)', en: 'Intro Fractions (1/4 + 2/4)' },
        badgeEmoji: '🍕',
        ixlSkillCode: { nl: 'Groep 6 • Zwaard 3', en: 'PYP 4 • Stage 3' },
        description: {
          nl: 'Tel gelijknamige breuken bij elkaar op met taartdiagrammen!',
          en: 'Add fractions with matching denominators and pie visuals!',
        },
      },
      {
        id: 'g6_m4',
        skill: 'sub100',
        sealSize: 5,
        title: { nl: 'Minsommen tot 100 Pro', en: 'Subtraction to 100 Pro' },
        badgeEmoji: '💎',
        ixlSkillCode: { nl: 'Groep 6 • Zwaard 4', en: 'PYP 4 • Stage 4' },
        description: {
          nl: '5-bladige sterren met grote minsommen onder de 100.',
          en: '5-petal star seals with two-digit subtraction.',
        },
      },
    ],
  },
  {
    id: 'g7',
    shortLabel: { nl: 'Groep 7', en: 'Year 5 • PYP 5' },
    fullTitle: {
      nl: 'Groep 7 (IB PYP 5) • Jinu’s Harmonie Arena',
      en: 'Year 5 / IB PYP 5 • Jinu’s Harmony Arena',
    },
    ageRange: '10–11',
    mascotEmoji: '🎸',
    hunterGuide: 'rumi',
    accentGradient: 'from-violet-500 via-purple-500 to-cyan-400',
    defaultSkill: 'divAll',
    defaultSealSize: 5,
    transcriptQuote: {
      nl: '“Dankjewel dat je mijn ziel hebt bevrijd, Rumi.” — Jinu 🎸',
      en: '“Thank you for freeing my soul, Rumi.” — Jinu 🎸',
    },
    ixlSummary: {
      nl: 'Kommagetallen & negatieve getallenlijn, priemfactoren, GGD & KGV voor ongelijknamige breuken, procenten en kwadraten.',
      en: 'Decimal & negative number lines, prime factors, HCF & LCM for unlike fractions, percentages & square numbers.',
    },
    conceptTags: {
      nl: ['📏 Komma & Negatieve Lijn', '🎸 GGD & KGV + Priemfactoren', '💯 Procenten & Kommagetallen', '⚔️ Kwadraten & Haakjes'],
      en: ['📏 Decimal & Negative Line', '🎸 HCF & LCM + Prime Factors', '💯 Percentages & Decimals', '⚔️ Squares & Order of Ops'],
    },
    missions: [
      {
        id: 'g7_m1',
        skill: 'divAll',
        sealSize: 5,
        title: { nl: 'Deeltafels Turbo', en: 'Rapid Division Turbo' },
        badgeEmoji: '⚡',
        ixlSkillCode: { nl: 'Groep 7 • Arena 1', en: 'PYP 5 • Stage 1' },
        description: {
          nl: '5-bladige deelsommen op volle K-Pop snelheid!',
          en: '5-petal division puzzles at full K-Pop concert speed!',
        },
      },
      {
        id: 'g7_m2',
        skill: 'fracEasy',
        sealSize: 5,
        title: { nl: 'Breuken-Harmonie', en: 'Fraction Harmony' },
        badgeEmoji: '🎵',
        ixlSkillCode: { nl: 'Groep 7 • Arena 2', en: 'PYP 5 • Stage 2' },
        description: {
          nl: 'Gelijknamige breuken optellen in een 5-bladige ster.',
          en: 'Combine like fractions inside a 5-petal Honmoon star.',
        },
      },
      {
        id: 'g7_m3',
        skill: 'fracPro',
        sealSize: 4,
        title: { nl: 'Breuken Gelijknamig Maken', en: 'Unlike Fractions (1/2 + 1/4)' },
        badgeEmoji: '🧪',
        ixlSkillCode: { nl: 'Groep 7 • Arena 3', en: 'PYP 5 • Stage 3' },
        description: {
          nl: 'Tel 1/2 + 1/4 en 1/3 + 1/6 bij elkaar op!',
          en: 'Add 1/2 + 1/4 and 1/3 + 1/6 using common denominators!',
        },
      },
      {
        id: 'g7_m4',
        skill: 'multAll',
        sealSize: 6,
        title: { nl: '6-Blad Tafel Kampioen', en: '6-Petal Multiplication Star' },
        badgeEmoji: '🌟',
        ixlSkillCode: { nl: 'Groep 7 • Arena 4', en: 'PYP 5 • Stage 4' },
        description: {
          nl: 'Grote 6-bladige ster met alle tafels!',
          en: '6-petal star challenge with all times tables!',
        },
      },
    ],
  },
  {
    id: 'g8',
    shortLabel: { nl: 'Groep 8', en: 'Year 6 • PYP 6' },
    fullTitle: {
      nl: 'Groep 8 (IB PYP 6) • Golden Honmoon Legenden',
      en: 'Year 6 / IB PYP 6 • Golden Honmoon Legends',
    },
    ageRange: '11–12',
    mascotEmoji: '👑',
    hunterGuide: 'rumi',
    accentGradient: 'from-amber-300 via-yellow-400 to-fuchsia-600',
    defaultSkill: 'fracPro',
    defaultSealSize: 5,
    transcriptQuote: {
      nl: '“Niet meer verstoppen, ik ga stralen zoals ik bedoeld ben!” — Rumi ("Golden") 👑',
      en: '“No more hiding, I’ll be shining, like I’m born to be!” — Rumi ("Golden") 👑',
    },
    ixlSummary: {
      nl: 'Negatieve getallen (+, −, ×, ÷), GGD & KGV van 3 getallen, verhoudingen, procenten, machten (n², n³) en Eindbaas Mix.',
      en: 'Negative integers (+, −, ×, ÷), 3-number HCF & LCM, ratios, percentages, powers (n², n³) & Final Boss Mix.',
    },
    conceptTags: {
      nl: ['❄️ Negatief +, −, ×, ÷', '🎸 3-Getallen GGD & KGV', '⚔️ Algebra & Machten (n³)', '👑 Golden Eindbaas Mix'],
      en: ['❄️ Negative +, −, ×, ÷', '🎸 3-Number HCF & LCM', '⚔️ Algebra & Powers (n³)', '👑 Golden Final Boss Mix'],
    },
    missions: [
      {
        id: 'g8_m1',
        skill: 'fracPro',
        sealSize: 5,
        title: { nl: 'Breuken Pro (Gelijknamig Maken)', en: 'Pro Fractions (Common Denom)' },
        badgeEmoji: '🧪',
        ixlSkillCode: { nl: 'Groep 8 • Legende 1', en: 'PYP 6 • Stage 1' },
        description: {
          nl: 'Los 5-bladige sterren op met 1/2, 1/3, 1/4, 1/6 en 1/8!',
          en: 'Solve 5-petal seals with 1/2, 1/3, 1/4, 1/6, and 1/8!',
        },
      },
      {
        id: 'g8_m2',
        skill: 'mixBoss',
        sealSize: 5,
        title: { nl: 'Gwi-Ma Eindbaas Mix', en: 'Gwi-Ma Final Boss Mix' },
        badgeEmoji: '🔥',
        ixlSkillCode: { nl: 'Groep 8 • Legende 2', en: 'PYP 6 • Stage 2' },
        description: {
          nl: 'Plus, min, keer én delen wisselen elkaar razendsnel af!',
          en: 'Addition, subtraction, multiplication & division all mixed!',
        },
      },
      {
        id: 'g8_m3',
        skill: 'fracPro',
        sealSize: 6,
        title: { nl: '6-Blad Breuken Finale', en: '6-Petal Fractions Finale' },
        badgeEmoji: '🍕',
        ixlSkillCode: { nl: 'Groep 8 • Legende 3', en: 'PYP 6 • Stage 3' },
        description: {
          nl: 'De ultieme breuken-uitdaging met 6 blaadjes!',
          en: 'The ultimate 6-petal fraction mastery challenge!',
        },
      },
      {
        id: 'g8_m4',
        skill: 'mixBoss',
        sealSize: 6,
        title: { nl: 'Golden Honmoon Wereldtour', en: 'Golden Honmoon World Tour' },
        badgeEmoji: '👑',
        ixlSkillCode: { nl: 'Groep 8 • Legende 4', en: 'PYP 6 • Stage 4' },
        description: {
          nl: '6-bladige eindbaas-ster voor echte Groep 8 / PYP 6 kampioenen!',
          en: '6-petal final boss star for true Year 6 / PYP 6 legends!',
        },
      },
    ],
  },
];

export function getCurriculumGroup(groupId?: SchoolGroupId): CurriculumGroupSpec {
  return (
    CURRICULUM_GROUPS.find((g) => g.id === groupId) ?? CURRICULUM_GROUPS[2] // default Groep 5 / Year 3
  );
}

export function getNextSchoolGroup(groupId: SchoolGroupId): SchoolGroupId {
  const idx = SCHOOL_GROUP_ORDER.indexOf(groupId);
  if (idx >= 0 && idx < SCHOOL_GROUP_ORDER.length - 1) {
    return SCHOOL_GROUP_ORDER[idx + 1];
  }
  return 'g8';
}

/**
 * Smoothly advances the player through the missions of their current school group,
 * and automatically promotes them to the next school group (e.g. g3 -> g4 -> g5 -> g6 -> g7 -> g8)
 * when they master their current group's missions!
 */
export function getAutoProgressedCurriculum(
  currentGroupId: SchoolGroupId,
  currentSkill: SkillId,
  currentSealSize: SealSize
): {
  nextGroupId: SchoolGroupId;
  nextSkill: SkillId;
  nextSealSize: SealSize;
  promotedGroup: boolean;
  missionTitle: { nl: string; en: string };
} {
  const group = getCurriculumGroup(currentGroupId);
  const currentMissionIdx = group.missions.findIndex(
    (m) => m.skill === currentSkill && m.sealSize === currentSealSize
  );

  // If currently on one of the first 3 missions of this group, move to the next mission in this group
  if (currentMissionIdx >= 0 && currentMissionIdx < group.missions.length - 1) {
    const nextMission = group.missions[currentMissionIdx + 1];
    return {
      nextGroupId: group.id,
      nextSkill: nextMission.skill,
      nextSealSize: nextMission.sealSize,
      promotedGroup: false,
      missionTitle: nextMission.title,
    };
  }

  // If completed the last mission of this group (or a higher sealSize), promote to the next group!
  const nextGroupId = getNextSchoolGroup(group.id);
  const nextGroup = getCurriculumGroup(nextGroupId);
  const promoted = nextGroupId !== group.id;
  const targetMission = promoted
    ? nextGroup.missions[0]
    : nextGroup.missions[nextGroup.missions.length - 1];

  return {
    nextGroupId,
    nextSkill: targetMission.skill,
    nextSealSize: targetMission.sealSize,
    promotedGroup: promoted,
    missionTitle: targetMission.title,
  };
}
