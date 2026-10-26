export type Language = 'nl' | 'en';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  tagline: string;
  langSwitchLabel: string;
  soundOn: string;
  soundOff: string;
  beatOn: string;
  beatOff: string;
  howToPlayBtn: string;

  // Game Modes
  chooseModeTitle: string;
  modes: {
    soloPractice: {
      title: string;
      badge: string;
      desc: string;
    };
    honmoonChain: {
      title: string;
      badge: string;
      desc: string;
    };
    timedRush: {
      title: string;
      badge: string;
      desc: string;
    };
    coopDuet: {
      title: string;
      badge: string;
      desc: string;
    };
    versusBattle: {
      title: string;
      badge: string;
      desc: string;
    };
  };

  // Math Skill Levels (Addition, Subtraction, Multiplication, Division, Fractions)
  chooseSkillTitle: string;
  skills: {
    add10: { name: string; sub: string; badge: string };
    add20: { name: string; sub: string; badge: string };
    add50: { name: string; sub: string; badge: string };
    sub20: { name: string; sub: string; badge: string };
    sub100: { name: string; sub: string; badge: string };
    multEasy: { name: string; sub: string; badge: string };
    multAll: { name: string; sub: string; badge: string };
    divAll: { name: string; sub: string; badge: string };
    fracEasy: { name: string; sub: string; badge: string };
    fracPro: { name: string; sub: string; badge: string };
    mixBoss: { name: string; sub: string; badge: string };
  };

  // Seal Size
  sealSizeTitle: string;
  sealSizeDesc: string;
  orbsCount: (n: number) => string;
  sealSizes: {
    s4: string;
    s5: string;
    s6: string;
  };

  // Characters
  chooseHunterTitle: string;
  hunters: {
    rumi: { name: string; role: string; weapon: string; quote: string };
    mira: { name: string; role: string; weapon: string; quote: string };
    zoey: { name: string; role: string; weapon: string; quote: string };
  };

  // 2-Player Handicap / Settings
  twoPlayerSetupTitle: string;
  daughterLabel: string;
  parentLabel: string;
  daughterSkillLabel: string;
  parentSkillLabel: string;
  fairHandicapNote: string;

  // Gameplay UI
  startShowBtn: string;
  backToStageBtn: string;
  ruleBannerAdd: string;
  ruleBannerSub: string;
  ruleBannerMult: string;
  ruleBannerDiv: string;
  ruleBannerFrac: string;
  masterSealBannerAdd: string;
  masterSealBannerSub: string;
  masterSealBannerMult: string;
  masterSealBannerDiv: string;
  outerSealsProgress: (solved: number, total: number) => string;
  masterSealLocked: string;
  masterSealUnlocked: string;
  tapSubSealPrompt: string;

  // Hints & Coaching
  derpyHintBtn: string;
  derpyReady: string;
  derpyHintAdd1: (num: string) => string;
  derpyHintSub1: (maxNum: string) => string;
  derpyHintMult1: (num: string) => string;
  derpyHintDiv1: (maxNum: string) => string;
  derpyHintFullAdd: (a: string, b: string) => string;
  derpyHintFullSub: (maxNum: string, subNum: string) => string;
  derpyHintFullMult: (a: string, b: string) => string;
  derpyHintFullDiv: (maxNum: string, divNum: string) => string;
  wrongTapAdd: (tapped: string) => string;
  wrongTapSub: (tapped: string) => string;
  wrongTapMult: (tapped: string) => string;
  wrongTapDiv: (tapped: string) => string;
  correctEquation: (a: string, op: string, b: string, target: string) => string;
  showPairToggle: string;
  xrayToggleBtn: string;
  dojoBtnLabel: string;

  // Greg Tang / Kakooma Creator Credits
  gregTangCreditBadge: string;
  gregTangCreditTitle: string;
  gregTangCreditText: string;
  gregTangVisitLink: string;

  // HUD & Stats
  scoreLabel: string;
  streakLabel: string;
  honmoonCharge: string;
  timeRemaining: string;
  elapsedTime: string;
  puzzlesSolved: string;
  demonBossName: string;
  sajaBoysStatus: string;
  goldenModeActive: string;

  // Co-op & Versus
  turnDaughter: string;
  turnParent: string;
  coopTeamScore: string;
  versusWinnerDaughter: string;
  versusWinnerParent: string;
  versusTie: string;
  firstToPoints: (pts: number) => string;

  // Round Summary / Victory Modal
  encoreTitle: string;
  honmoonGoldenMsg: string;
  avgSpeedLabel: string;
  accuracyLabel: string;
  bestStreakLabel: string;
  starsEarned: string;
  playAgainBtn: string;
  nextLevelBtn: string;
  changeSettingsBtn: string;
  equationsMasteredTitle: string;

  // Tutorial Modal
  tutorialTitle: string;
  tutorialIntro: string;
  tutorialStep1Title: string;
  tutorialStep1Desc: string;
  tutorialStep2Title: string;
  tutorialStep2Desc: string;
  tutorialStep3Title: string;
  tutorialStep3Desc: string;
  tutorialGotItBtn: string;

  // Learning loop (Dojo spaced review + session summary)
  learn: {
    reviewTab: string;
    reviewIntro: string;
    reviewProgress: (done: number, needed: number) => string;
    resting: (count: number) => string;
    restingHelp: string;
    allCaughtUpTitle: string;
    allCaughtUpHelp: string;
    playStageBtn: string;
    correctComeBack: string;
    wrongTryLater: string;
    masteredReward: (gems: number, xp: number) => string;
    masteredAgain: string;
    alsoTrue: string;
    continueBtn: string;
    strategyTitle: string;
    tryItTitle: string;
    tryItCorrect: string;
    tryItWrong: string;
    factsConquered: (count: number) => string;
    summaryLearningTitle: string;
    strategiesPracticedLabel: string;
    reviewWaitingLabel: string;
    nextFocusTitle: string;
    nextFocusFact: (equation: string) => string;
    nextFocusSkill: (skillName: string) => string;
    speedNote: string;
  };

  // Stage-by-Stage Wizard, Returning Player Dashboard & Multi-User Profiles
  wizard: {
    stepOf: (step: number, total: number) => string;
    backBtn: string;
    nextBtn: string;
    step1Short: string;
    step2Short: string;
    step3Short: string;
    step4Short: string;
    step1Title: string;
    step1Subtitle: string;
    playerNameLabel: string;
    playerNamePlaceholder: string;
    saveProfileAndNextBtn: string;
    savedPlayersTitle: string;
    orCreateNewTitle: string;
    step2Title: string;
    step2Subtitle: string;
    step3Title: string;
    step3Subtitle: string;
    recommendedBadge: string;
    step4Title: string;
    step4Subtitle: string;
    complexity: {
      s4: { title: string; badge: string; desc: string };
      s5: { title: string; badge: string; desc: string };
      s6: { title: string; badge: string; desc: string };
    };
  };
  welcomeBack: {
    greeting: (name: string) => string;
    playingAs: (idolName: string, role: string) => string;
    currentStageBadge: (stageNum: number) => string;
    continueStageBtn: (stageNum: number, skillName: string) => string;
    continueStageSub: (modeTitle: string, complexityTitle: string) => string;
    tryOtherPowerBtn: string;
    changeActivityBtn: string;
    switchPlayerBtn: string;
    customizeWizardBtn: string;
  };
  profiles: {
    modalTitle: string;
    modalSubtitle: string;
    activeBadge: string;
    selectBtn: string;
    newPlayerBtn: string;
    resetProgressBtn: string;
    confirmResetBtn: string;
    deletePlayerBtn: string;
    confirmDeleteBtn: string;
    cancelBtn: string;
    stagesClearedLabel: (count: number) => string;
    nextStageAutoBtn: (stageNum: number, skillName: string, complexityTitle: string) => string;
    tryAnotherPowerVictoryBtn: string;
  };
}

export const translations: Record<Language, Translations> = {
  nl: {
    appTitle: 'HUNTR/X: HONMOON BEAT',
    appSubtitle: 'K-Pop Reken-Game (Kakooma Stijl)',
    tagline: 'Kraak de getallen-zegels met Rumi, Mira & Zoey! ✨',
    langSwitchLabel: 'Taal',
    soundOn: 'Geluid Aan',
    soundOff: 'Geluid Uit',
    beatOn: 'Beat Aan',
    beatOff: 'Beat Uit',
    howToPlayBtn: 'Uitleg',

    chooseModeTitle: '1. Kies je Show',
    modes: {
      soloPractice: {
        title: 'Idol Training',
        badge: 'Zonder Klok',
        desc: 'Relaxed oefenen op eigen tempo met hints 🐯',
      },
      honmoonChain: {
        title: 'Honmoon Keten',
        badge: 'Kakooma Boss',
        desc: 'Los de kleine sterren op → kraak het Midden-Zegel!',
      },
      timedRush: {
        title: 'Speed Rush (60s)',
        badge: 'Snelheid',
        desc: 'Hoeveel zegels kraak jij in 60 seconden? ⚡',
      },
      coopDuet: {
        title: 'Samen Duet',
        badge: '2 Spelers',
        desc: 'Speel samen om de beurt als 1 team! 🎤',
      },
      versusBattle: {
        title: '1-tegen-1 Battle',
        badge: 'Duel',
        desc: 'Race tegen elkaar op 1 scherm! 🏆',
      },
    },

    chooseSkillTitle: '2. Kies je Reken-Kracht',
    skills: {
      add10: {
        name: 'Optellen tot 10',
        sub: '3 + 5 = 8',
        badge: '+ Niveau 1',
      },
      add20: {
        name: 'Optellen tot 20',
        sub: '7 + 8 = 15',
        badge: '+ Niveau 2',
      },
      add50: {
        name: 'Optellen tot 50',
        sub: '14 + 18 = 32',
        badge: '+ Niveau 3',
      },
      sub20: {
        name: 'Aftrekken tot 20',
        sub: '15 − 8 = 7',
        badge: '− Nieuw!',
      },
      sub100: {
        name: 'Aftrekken tot 100',
        sub: '42 − 15 = 27',
        badge: '− Pro',
      },
      multEasy: {
        name: 'Tafels 2, 3, 4, 5, 10',
        sub: '4 × 5 = 20',
        badge: '× Basis',
      },
      multAll: {
        name: 'Alle Tafels (2–10)',
        sub: '7 × 8 = 56',
        badge: '× Golden',
      },
      divAll: {
        name: 'Deeltafels (2–10)',
        sub: '56 ÷ 8 = 7',
        badge: '÷ Nieuw!',
      },
      fracEasy: {
        name: 'Breuken Basis',
        sub: '1/8 + 3/8 = 4/8',
        badge: '½ Visueel',
      },
      fracPro: {
        name: 'Breuken Pro',
        sub: '1/4 + 1/2 = 3/4',
        badge: '½ Groep 6/7',
      },
      mixBoss: {
        name: 'Eindbaas tot 100',
        sub: '36 + 48 = 84',
        badge: '★ Legend',
      },
    },

    sealSizeTitle: '3. Hoeveel Getallen?',
    sealSizeDesc: 'Kies de grootte van de ster:',
    orbsCount: (n: number) => `${n} Getallen`,
    sealSizes: {
      s4: 'Zon ⭐ (Makkelijk)',
      s5: 'Ster 🌟 (Normaal)',
      s6: 'Hexagon 🔥 (Uitdagend)',
    },

    chooseHunterTitle: '4. Kies je Idol',
    hunters: {
      rumi: {
        name: 'Rumi',
        role: 'Lead Vocal',
        weapon: 'Sterrenzwaard',
        quote: '"Samen maken we de Honmoon goud!"',
      },
      mira: {
        name: 'Mira',
        role: 'Main Dancer',
        weapon: 'Maan-Speer',
        quote: '"Voel het ritme van de getallen!"',
      },
      zoey: {
        name: 'Zoey',
        role: 'Main Rapper',
        weapon: 'Spirit-Messen',
        quote: '"Snel denken, scherp mikken!"',
      },
    },

    twoPlayerSetupTitle: '2-Speler Niveau Balans',
    daughterLabel: '🌟 Dochter',
    parentLabel: '🎸 Ouder',
    daughterSkillLabel: 'Niveau Dochter:',
    parentSkillLabel: 'Niveau Ouder:',
    fairHandicapNote: 'Geef ieder een eigen niveau voor een eerlijke race!',

    startShowBtn: 'START DE SHOW! ✨',
    backToStageBtn: 'Menu',
    ruleBannerAdd: '✨ Welk getal is de SOM (+) van 2 andere?',
    ruleBannerSub: '✨ Welk getal is het VERSCHIL (−) van 2 andere?',
    ruleBannerMult: '✨ Welk getal is het KEER-ANTWOORD (×) van 2 andere?',
    ruleBannerDiv: '✨ Welk getal is het DEEL-ANTWOORD (÷) van 2 andere?',
    ruleBannerFrac: '✨ Welke breuk is de SOM (+) van 2 andere?',
    masterSealBannerAdd: '🌟 FINALE! Welk getal is de SOM (+) van 2 andere?',
    masterSealBannerSub: '🌟 FINALE! Welk getal is het VERSCHIL (−) van 2 andere?',
    masterSealBannerMult: '🌟 FINALE! Welk getal is het KEER-ANTWOORD (×)?',
    masterSealBannerDiv: '🌟 FINALE! Welk getal is het DEEL-ANTWOORD (÷)?',
    outerSealsProgress: (solved: number, total: number) => `Sterren: ${solved} / ${total}`,
    masterSealLocked: 'Los eerst de buitenste sterren op!',
    masterSealUnlocked: '🌟 MIDDEN-ZEGEL OPEN!',
    tapSubSealPrompt: 'Tik op een ster!',

    derpyHintBtn: '🐯 Hint',
    derpyReady: 'Even hulp nodig? Tik op 🐯 Hint!',
    derpyHintAdd1: (num: string) => `🐯 Tip: Gebruik ${num}!`,
    derpyHintSub1: (maxNum: string) => `🐯 Tip: Begin bij ${maxNum}!`,
    derpyHintMult1: (num: string) => `🐯 Tip: Gebruik ${num}!`,
    derpyHintDiv1: (maxNum: string) => `🐯 Tip: Deel ${maxNum}!`,
    derpyHintFullAdd: (a: string, b: string) => `🐯 Wat is ${a} + ${b}?`,
    derpyHintFullSub: (maxNum: string, subNum: string) => `🐯 Wat is ${maxNum} − ${subNum}?`,
    derpyHintFullMult: (a: string, b: string) => `🐯 Wat is ${a} × ${b}?`,
    derpyHintFullDiv: (maxNum: string, divNum: string) => `🐯 Wat is ${maxNum} ÷ ${divNum}?`,
    wrongTapAdd: (tapped: string) => `Bijna! ${tapped} is het niet. Probeer nog eens! 💫`,
    wrongTapSub: (tapped: string) => `Bijna! ${tapped} is het niet. Probeer nog eens! 💫`,
    wrongTapMult: (tapped: string) => `Bijna! ${tapped} is het niet. Probeer nog eens! 💫`,
    wrongTapDiv: (tapped: string) => `Bijna! ${tapped} is het niet. Probeer nog eens! 💫`,
    correctEquation: (a: string, op: string, b: string, target: string) => `JAAA! ${a} ${op} ${b} = ${target}!`,
    showPairToggle: 'Toon verbindingen',
    xrayToggleBtn: '🔍 Inzicht',
    dojoBtnLabel: '🥋 Dojo',

    gregTangCreditBadge: 'Originele Puzzel-Inspiratie: Kakooma® door Greg Tang',
    gregTangCreditTitle: 'Geïnspireerd door Kakooma® van Greg Tang',
    gregTangCreditText: 'Het Kakooma®-puzzelconcept is bedacht door wiskunde-educator en auteur Greg Tang (Greg Tang Math) om kinderen spelenderwijs sterk getalbegrip en rekenplezier te geven.',
    gregTangVisitLink: 'Speel het originele Kakooma op TangMath.com ↗',

    scoreLabel: 'Score',
    streakLabel: 'Streak',
    honmoonCharge: 'Honmoon',
    timeRemaining: 'Tijd',
    elapsedTime: 'Tijd',
    puzzlesSolved: 'Gekraakt',
    demonBossName: 'Saja Boys',
    sajaBoysStatus: 'Versla ze met rekenen!',
    goldenModeActive: '✨ GOLDEN COMBO! Slash opgeladen!',

    turnDaughter: '🌟 Beurt: Dochter!',
    turnParent: '🎸 Beurt: Ouder!',
    coopTeamScore: 'Team Score',
    versusWinnerDaughter: '🏆 DOCHTER WINT!',
    versusWinnerParent: '🏆 OUDER WINT!',
    versusTie: '✨ GELIJKSPEL!',
    firstToPoints: (pts: number) => `Eerste bij ${pts} punten wint!`,

    encoreTitle: 'SHOW VOLTOOID! GOUDEN HONMOON! 🌟',
    honmoonGoldenMsg: 'Super gerekend! De Honmoon straalt helemaal goud!',
    avgSpeedLabel: 'Snelheid',
    accuracyLabel: 'Goed',
    bestStreakLabel: 'Beste Streak',
    starsEarned: 'Sterren',
    playAgainBtn: 'Nog een Show! 🎤',
    nextLevelBtn: 'Volgend Niveau 🚀',
    changeSettingsBtn: 'Menu',
    equationsMasteredTitle: 'Jouw Gekraakte Sommen:',

    tutorialTitle: 'Hoe werkt het? ✨',
    tutorialIntro: 'Elke ster verbergt een geheime som:',
    tutorialStep1Title: '1. Kijk naar de getallen in de ster',
    tutorialStep1Desc: 'Bijvoorbeeld: 3, 4, 7 en 9.',
    tutorialStep2Title: '2. Zoek twee getallen die samen een derde maken!',
    tutorialStep2Desc: 'Bijv: 3 + 4 = 7 of 7 − 4 = 3.',
    tutorialStep3Title: '3. Tik alleen op de uitkomst!',
    tutorialStep3Desc: 'Het midden laat daarna stap voor stap zien waarom het klopt!',
    tutorialGotItBtn: 'Snap ik! Spelen! ✨',

    learn: {
      reviewTab: 'Weetjes-Training',
      reviewIntro: '🎯 Oefen een som die je eerder lastig vond. Twee keer goed (met pauze ertussen) = gekraakt!',
      reviewProgress: (done, needed) => `Herhaling ${done}/${needed} goed`,
      resting: (count) =>
        count === 1 ? '😴 Jouw oefensom rust even.' : `😴 Jouw ${count} oefensommen rusten even.`,
      restingHelp:
        'Je brein onthoudt het beter met een pauze! Los eerst 3 andere puzzels op in een show, en kom dan terug.',
      allCaughtUpTitle: '🌟 Alles bijgewerkt!',
      allCaughtUpHelp:
        'Geen oefensommen meer. Speel een show: sommen die je mist komen hier vanzelf terug om te oefenen.',
      playStageBtn: 'Naar de show! 🎤',
      correctComeBack: 'Goed zo! Deze som komt na 3 andere puzzels nog één keer terug.',
      wrongTryLater: 'Bijna! Lees de truc hieronder. Deze som komt na 3 andere puzzels terug.',
      masteredReward: (gems, xp) => `🏆 GEKRAAKT! Twee keer goed met pauze! +${gems} 💎 & +${xp} XP`,
      masteredAgain: '🏆 Weer gekraakt! (De beloning had je al verdiend.)',
      alsoTrue: 'Dus weet je ook:',
      continueBtn: 'Verder ➜',
      strategyTitle: 'Derpy’s Slimme Truc:',
      tryItTitle: 'Probeer het zelf:',
      tryItCorrect: '✅ Goed! Je gebruikte de truc.',
      tryItWrong: '🤔 Nog niet. Gebruik de truc stap voor stap en probeer opnieuw:',
      factsConquered: (count) => `${count} Sommen Gekraakt`,
      summaryLearningTitle: 'Wat heb je geoefend?',
      strategiesPracticedLabel: 'Trucs gebruikt',
      reviewWaitingLabel: 'Oefensommen in de Dojo',
      nextFocusTitle: '🎯 Volgende keer oefenen:',
      nextFocusFact: (equation) => `Oefen ${equation} in de Dojo (na 3 andere puzzels).`,
      nextFocusSkill: (skillName) => `Blijf ${skillName} oefenen, of probeer een iets groter level.`,
      speedNote: 'Snelheid is een bonus. Goed nadenken telt het meest!',
    },
    wizard: {
      stepOf: (step, total) => `Stap ${step} van ${total}`,
      backBtn: '← Terug',
      nextBtn: 'Volgende →',
      step1Short: '1. Speler & Idol',
      step2Short: '2. Activiteit',
      step3Short: '3. Reken-Kracht',
      step4Short: '4. Uitdaging',
      step1Title: 'Wie speelt er vandaag? 🎤',
      step1Subtitle: 'Kies jouw HUNTR/X Idol en vul je naam in (wordt bewaard op dit apparaat!):',
      playerNameLabel: 'Jouw Idol-Naam:',
      playerNamePlaceholder: 'Typ je naam (bijv. Nova, Mila...)',
      saveProfileAndNextBtn: 'Bewaar Speler & Kies Activiteit →',
      savedPlayersTitle: 'Bestaande Spelers op dit apparaat:',
      orCreateNewTitle: 'Of maak een nieuwe speler aan:',
      step2Title: 'Wat voor show wil je spelen? 🎶',
      step2Subtitle: 'Kies jouw favoriete activiteit voor deze ronde:',
      step3Title: 'Welke Reken-Kracht wil je oefenen? ⚡',
      step3Subtitle: 'Kies een sommen-kracht (of ga verder met je aanbevolen level!):',
      recommendedBadge: '⭐ Jouw Volgende Stage',
      step4Title: 'Hoe uitdagend maken we de ster? 🌟',
      step4Subtitle: 'Kies de moeilijkheid (hoeveel getallen per zegel) en start de show!',
      complexity: {
        s4: {
          title: 'Makkelijk (Warm-Up)',
          badge: '⭐ 4 Getallen',
          desc: 'Rustig opwarmen met 4 getallen in elke ster.',
        },
        s5: {
          title: 'Gemiddeld (Idol Uitdaging)',
          badge: '⭐⭐ 5 Getallen',
          desc: 'De klassieke Kakooma-ster met 5 getallen!',
        },
        s6: {
          title: 'Uitdagend (Meester-Zegel)',
          badge: '⭐⭐⭐ 6 Getallen',
          desc: 'Voor echte reken-idols: 6 getallen om te kraken!',
        },
      },
    },
    welcomeBack: {
      greeting: (name) => `Welkom terug, ${name}! ✨`,
      playingAs: (idolName, role) => `Jouw Idol: ${idolName} (${role})`,
      currentStageBadge: (stageNum) => `Stage ${stageNum}`,
      continueStageBtn: (stageNum, skillName) =>
        `Ga Verder: Stage ${stageNum} • ${skillName}`,
      continueStageSub: (modeTitle, complexityTitle) =>
        `${modeTitle} • ${complexityTitle}`,
      tryOtherPowerBtn: '🔀 Andere Reken-Kracht Proberen',
      changeActivityBtn: '🎮 Andere Activiteit Kiezen',
      switchPlayerBtn: 'Andere Speler / Nieuw',
      customizeWizardBtn: '⚙️ Stap-voor-Stap Kiezen',
    },
    profiles: {
      modalTitle: 'Spelers op dit Apparaat 👥',
      modalSubtitle: 'Wissel van speler, maak een nieuw profiel aan of begin opnieuw:',
      activeBadge: '✓ Actief',
      selectBtn: 'Kies Speler',
      newPlayerBtn: '+ Nieuwe Speler Aanmaken',
      resetProgressBtn: 'Reset Voortgang',
      confirmResetBtn: 'Ja, Reset naar Stage 1!',
      deletePlayerBtn: 'Verwijder',
      confirmDeleteBtn: 'Ja, Verwijder!',
      cancelBtn: 'Annuleren',
      stagesClearedLabel: (count) => `${count} stages voltooid`,
      nextStageAutoBtn: (stageNum, skillName, complexityTitle) =>
        `Volgende Stage (${stageNum}): ${skillName} • ${complexityTitle} 🚀`,
      tryAnotherPowerVictoryBtn: '🔀 Andere Reken-Kracht Kiezen',
    },
  },
  en: {
    appTitle: 'HUNTR/X: HONMOON BEAT',
    appSubtitle: 'K-Pop Math Game (Kakooma Style)',
    tagline: 'Crack the number seals with Rumi, Mira & Zoey! ✨',
    langSwitchLabel: 'Language',
    soundOn: 'Sound On',
    soundOff: 'Sound Off',
    beatOn: 'Beat On',
    beatOff: 'Beat Off',
    howToPlayBtn: 'Rules',

    chooseModeTitle: '1. Pick Your Mode',
    modes: {
      soloPractice: {
        title: 'Idol Training',
        badge: 'No Timer',
        desc: 'Chill practice at your own pace with hints 🐯',
      },
      honmoonChain: {
        title: 'Honmoon Chain',
        badge: 'Kakooma Boss',
        desc: 'Solve outer stars → unlock the Boss Seal!',
      },
      timedRush: {
        title: 'Speed Rush (60s)',
        badge: 'Speed',
        desc: 'How many seals can you crack in 60s? ⚡',
      },
      coopDuet: {
        title: 'Team Duet',
        badge: '2 Players',
        desc: 'Play together as one K-Pop squad! 🎤',
      },
      versusBattle: {
        title: '1v1 Battle',
        badge: 'Duel',
        desc: 'Race head-to-head on 1 screen! 🏆',
      },
    },

    chooseSkillTitle: '2. Pick Your Math Power',
    skills: {
      add10: {
        name: 'Add to 10',
        sub: '3 + 5 = 8',
        badge: '+ Level 1',
      },
      add20: {
        name: 'Add to 20',
        sub: '7 + 8 = 15',
        badge: '+ Level 2',
      },
      add50: {
        name: 'Add to 50',
        sub: '14 + 18 = 32',
        badge: '+ Level 3',
      },
      sub20: {
        name: 'Subtract to 20',
        sub: '15 − 8 = 7',
        badge: '− New!',
      },
      sub100: {
        name: 'Subtract to 100',
        sub: '42 − 15 = 27',
        badge: '− Pro',
      },
      multEasy: {
        name: 'Tables 2, 3, 4, 5, 10',
        sub: '4 × 5 = 20',
        badge: '× Core',
      },
      multAll: {
        name: 'All Tables (2–10)',
        sub: '7 × 8 = 56',
        badge: '× Golden',
      },
      divAll: {
        name: 'Division (2–10)',
        sub: '56 ÷ 8 = 7',
        badge: '÷ New!',
      },
      fracEasy: {
        name: 'Fractions Easy',
        sub: '1/8 + 3/8 = 4/8',
        badge: '½ Visual',
      },
      fracPro: {
        name: 'Fractions Pro',
        sub: '1/4 + 1/2 = 3/4',
        badge: '½ Grade 4/5',
      },
      mixBoss: {
        name: 'Boss to 100',
        sub: '36 + 48 = 84',
        badge: '★ Legend',
      },
    },

    sealSizeTitle: '3. How Many Numbers?',
    sealSizeDesc: 'Choose star size:',
    orbsCount: (n: number) => `${n} Numbers`,
    sealSizes: {
      s4: 'Sun ⭐ (Easy)',
      s5: 'Star 🌟 (Classic)',
      s6: 'Hexagon 🔥 (Pro)',
    },

    chooseHunterTitle: '4. Pick Your Idol',
    hunters: {
      rumi: {
        name: 'Rumi',
        role: 'Lead Vocal',
        weapon: 'Star-Sword',
        quote: '"Together we turn the Honmoon golden!"',
      },
      mira: {
        name: 'Mira',
        role: 'Main Dancer',
        weapon: 'Moon-Spear',
        quote: '"Feel the rhythm of the numbers!"',
      },
      zoey: {
        name: 'Zoey',
        role: 'Main Rapper',
        weapon: 'Spirit-Blades',
        quote: '"Think fast, aim sharp!"',
      },
    },

    twoPlayerSetupTitle: '2-Player Skill Balancer',
    daughterLabel: '🌟 Daughter',
    parentLabel: '🎸 Parent',
    daughterSkillLabel: 'Daughter Level:',
    parentSkillLabel: 'Parent Level:',
    fairHandicapNote: 'Pick each player\'s level for a fair race!',

    startShowBtn: 'START THE SHOW! ✨',
    backToStageBtn: 'Menu',
    ruleBannerAdd: '✨ Tap the SUM (+) of 2 numbers!',
    ruleBannerSub: '✨ Tap the DIFFERENCE (−) of 2 numbers!',
    ruleBannerMult: '✨ Tap the PRODUCT (×) of 2 numbers!',
    ruleBannerDiv: '✨ Tap the QUOTIENT (÷) of 2 numbers!',
    ruleBannerFrac: '✨ Tap the SUM (+) of 2 fractions!',
    masterSealBannerAdd: '🌟 FINALE! Tap the SUM (+) of 2 numbers!',
    masterSealBannerSub: '🌟 FINALE! Tap the DIFFERENCE (−) of 2 numbers!',
    masterSealBannerMult: '🌟 FINALE! Tap the PRODUCT (×) of 2 numbers!',
    masterSealBannerDiv: '🌟 FINALE! Tap the QUOTIENT (÷) of 2 numbers!',
    outerSealsProgress: (solved: number, total: number) => `Stars: ${solved} / ${total}`,
    masterSealLocked: 'Solve the outer stars first!',
    masterSealUnlocked: '🌟 BOSS SEAL UNLOCKED!',
    tapSubSealPrompt: 'Tap a star!',

    derpyHintBtn: '🐯 Hint',
    derpyReady: 'Need a clue? Tap 🐯 Hint!',
    derpyHintAdd1: (num: string) => `🐯 Tip: Start with ${num}!`,
    derpyHintSub1: (maxNum: string) => `🐯 Tip: Start with ${maxNum}!`,
    derpyHintMult1: (num: string) => `🐯 Tip: Start with ${num}!`,
    derpyHintDiv1: (maxNum: string) => `🐯 Tip: Divide ${maxNum}!`,
    derpyHintFullAdd: (a: string, b: string) => `🐯 What is ${a} + ${b}?`,
    derpyHintFullSub: (maxNum: string, subNum: string) => `🐯 What is ${maxNum} − ${subNum}?`,
    derpyHintFullMult: (a: string, b: string) => `🐯 What is ${a} × ${b}?`,
    derpyHintFullDiv: (maxNum: string, divNum: string) => `🐯 What is ${maxNum} ÷ ${divNum}?`,
    wrongTapAdd: (tapped: string) => `Almost! Not ${tapped}. Try another one! 💫`,
    wrongTapSub: (tapped: string) => `Almost! Not ${tapped}. Try another one! 💫`,
    wrongTapMult: (tapped: string) => `Almost! Not ${tapped}. Try another one! 💫`,
    wrongTapDiv: (tapped: string) => `Almost! Not ${tapped}. Try another one! 💫`,
    correctEquation: (a: string, op: string, b: string, target: string) => `YES! ${a} ${op} ${b} = ${target}!`,
    showPairToggle: 'Show bonds',
    xrayToggleBtn: '🔍 X-Ray',
    dojoBtnLabel: '🥋 Dojo',

    gregTangCreditBadge: 'Original Puzzle Inspiration: Kakooma® by Greg Tang',
    gregTangCreditTitle: 'Inspired by Kakooma® by Greg Tang',
    gregTangCreditText: 'The Kakooma® number-bond puzzle concept was invented by math educator and bestselling author Greg Tang (Greg Tang Math) to help kids build joyful number sense.',
    gregTangVisitLink: 'Play original Kakooma on TangMath.com ↗',

    scoreLabel: 'Score',
    streakLabel: 'Streak',
    honmoonCharge: 'Honmoon',
    timeRemaining: 'Time',
    elapsedTime: 'Time',
    puzzlesSolved: 'Solved',
    demonBossName: 'Saja Boys',
    sajaBoysStatus: 'Defeat them with math!',
    goldenModeActive: '✨ GOLDEN COMBO! Slash charged!',

    turnDaughter: '🌟 Turn: Daughter!',
    turnParent: '🎸 Turn: Parent!',
    coopTeamScore: 'Squad Score',
    versusWinnerDaughter: '🏆 DAUGHTER WINS!',
    versusWinnerParent: '🏆 PARENT WINS!',
    versusTie: '✨ IT\'S A TIE!',
    firstToPoints: (pts: number) => `First to ${pts} points wins!`,

    encoreTitle: 'STAGE CLEAR! GOLDEN HONMOON! 🌟',
    honmoonGoldenMsg: 'Awesome math! You turned the Honmoon pure GOLD!',
    avgSpeedLabel: 'Speed',
    accuracyLabel: 'Accuracy',
    bestStreakLabel: 'Best Streak',
    starsEarned: 'Stars',
    playAgainBtn: 'Play Again! 🎤',
    nextLevelBtn: 'Next Level 🚀',
    changeSettingsBtn: 'Menu',
    equationsMasteredTitle: 'Equations Cracked:',

    tutorialTitle: 'How to Play ✨',
    tutorialIntro: 'Every star hides one secret math bond:',
    tutorialStep1Title: '1. Look at the numbers in the star',
    tutorialStep1Desc: 'For example: 3, 4, 7, and 9.',
    tutorialStep2Title: '2. Spot two numbers that make a third!',
    tutorialStep2Desc: 'E.g. 3 + 4 = 7 or 7 − 4 = 3.',
    tutorialStep3Title: '3. Tap only the answer!',
    tutorialStep3Desc: 'The center loop expands to show the step-by-step math!',
    tutorialGotItBtn: 'Got it! Let\'s Play! ✨',

    learn: {
      reviewTab: 'Fact Training',
      reviewIntro: '🎯 Practice a fact you found tricky. Right twice (with a break in between) = cracked!',
      reviewProgress: (done, needed) => `Review ${done}/${needed} correct`,
      resting: (count) =>
        count === 1 ? '😴 Your practice fact is resting.' : `😴 Your ${count} practice facts are resting.`,
      restingHelp:
        'Your brain remembers better after a break! Solve 3 other puzzles in a show first, then come back.',
      allCaughtUpTitle: '🌟 All caught up!',
      allCaughtUpHelp:
        'No practice facts left. Play a show: any fact you miss will come back here to practice.',
      playStageBtn: 'Go to the show! 🎤',
      correctComeBack: 'Nice! This fact comes back one more time after 3 other puzzles.',
      wrongTryLater: 'Almost! Read the trick below. This fact comes back after 3 other puzzles.',
      masteredReward: (gems, xp) => `🏆 CRACKED! Right twice with a break! +${gems} 💎 & +${xp} XP`,
      masteredAgain: '🏆 Cracked again! (You already earned this reward.)',
      alsoTrue: 'So you also know:',
      continueBtn: 'Continue ➜',
      strategyTitle: 'Derpy’s Smart Trick:',
      tryItTitle: 'Try it yourself:',
      tryItCorrect: '✅ Correct! You used the trick.',
      tryItWrong: '🤔 Not yet. Use the trick step by step and try again:',
      factsConquered: (count) => `${count} Facts Cracked`,
      summaryLearningTitle: 'What did you practice?',
      strategiesPracticedLabel: 'Tricks used',
      reviewWaitingLabel: 'Practice facts in the Dojo',
      nextFocusTitle: '🎯 Practice next time:',
      nextFocusFact: (equation) => `Practice ${equation} in the Dojo (after 3 other puzzles).`,
      nextFocusSkill: (skillName) => `Keep practicing ${skillName}, or try a slightly bigger level.`,
      speedNote: 'Speed is a bonus. Careful thinking counts the most!',
    },
    wizard: {
      stepOf: (step, total) => `Step ${step} of ${total}`,
      backBtn: '← Back',
      nextBtn: 'Next →',
      step1Short: '1. Player & Idol',
      step2Short: '2. Activity',
      step3Short: '3. Math Power',
      step4Short: '4. Challenge',
      step1Title: 'Who is playing today? 🎤',
      step1Subtitle: 'Pick your HUNTR/X Idol and enter your name (saved on this device!):',
      playerNameLabel: 'Your Idol Name:',
      playerNamePlaceholder: 'Type your name (e.g. Nova, Mila...)',
      saveProfileAndNextBtn: 'Save Player & Pick Activity →',
      savedPlayersTitle: 'Saved Players on this device:',
      orCreateNewTitle: 'Or create a new player:',
      step2Title: 'What kind of activity do you want to play? 🎶',
      step2Subtitle: 'Pick your favorite concert mode for this round:',
      step3Title: 'Which Math Power do you want to try? ⚡',
      step3Subtitle: 'Pick any math skill (or continue with your recommended stage!):',
      recommendedBadge: '⭐ Your Next Stage',
      step4Title: 'Choose your Challenge Level! 🌟',
      step4Subtitle: 'How many numbers in each seal? Pick your complexity and start the show!',
      complexity: {
        s4: {
          title: 'Easy (Warm-Up)',
          badge: '⭐ 4 Numbers',
          desc: 'Smooth warm-up with 4 numbers in every star.',
        },
        s5: {
          title: 'Medium (Idol Challenge)',
          badge: '⭐⭐ 5 Numbers',
          desc: 'The classic Kakooma star with 5 numbers!',
        },
        s6: {
          title: 'Challenging (Master Seal)',
          badge: '⭐⭐⭐ 6 Numbers',
          desc: 'For true math idols: 6 numbers to crack!',
        },
      },
    },
    welcomeBack: {
      greeting: (name) => `Welcome back, ${name}! ✨`,
      playingAs: (idolName, role) => `Playing as ${idolName} (${role})`,
      currentStageBadge: (stageNum) => `Stage ${stageNum}`,
      continueStageBtn: (stageNum, skillName) =>
        `Continue Stage ${stageNum} • ${skillName}`,
      continueStageSub: (modeTitle, complexityTitle) =>
        `${modeTitle} • ${complexityTitle}`,
      tryOtherPowerBtn: '🔀 Try Another Math Power',
      changeActivityBtn: '🎮 Change Activity Mode',
      switchPlayerBtn: 'Switch / New Player',
      customizeWizardBtn: '⚙️ Step-by-Step Setup',
    },
    profiles: {
      modalTitle: 'Players on this Device 👥',
      modalSubtitle: 'Switch players, create a new profile, or reset progress:',
      activeBadge: '✓ Active',
      selectBtn: 'Select Player',
      newPlayerBtn: '+ Create New Player',
      resetProgressBtn: 'Reset Progress',
      confirmResetBtn: 'Yes, Reset to Stage 1!',
      deletePlayerBtn: 'Delete',
      confirmDeleteBtn: 'Yes, Delete!',
      cancelBtn: 'Cancel',
      stagesClearedLabel: (count) => `${count} stages cleared`,
      nextStageAutoBtn: (stageNum, skillName, complexityTitle) =>
        `Next Stage (${stageNum}): ${skillName} • ${complexityTitle} 🚀`,
      tryAnotherPowerVictoryBtn: '🔀 Try Another Math Power',
    },
  },
};
