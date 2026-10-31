import React, { useState } from 'react';
import { Language, translations } from '../i18n/translations';
import { PlayerProgress, TrickyFactItem } from '../engine/progressionStore';
import {
  REVIEWS_TO_MASTER,
  claimMasteryReward,
  createReviewState,
  getNextDueFactId,
  recordReviewAnswer,
} from '../engine/learningLoop';
import { soundEngine } from '../audio/soundEngine';
import { localizeFormulaLabel } from '../engine/tangGamesEngine';

export const MASTERY_GEMS = 2;
export const MASTERY_XP = 30;

interface NumberDojoModalProps {
  lang: Language;
  progress: PlayerProgress;
  /** Persists the review result; the parent applies the same pure transitions. */
  onReviewAttempt: (factId: string, correct: boolean) => void;
  onClose: () => void;
}

type ReviewFeedback = {
  fact: TrickyFactItem;
  choice: string;
  kind: 'wrong' | 'correct' | 'mastered' | 'masteredAgain';
  doneCount: number;
};

/** The inverse fact from the same fact family, e.g. 7 × 8 = 56 → 56 ÷ 8 = 7. */
function inverseFact(fact: TrickyFactItem): string {
  const { aLabel: a, bLabel: b, targetLabel: t } = fact;
  if (b === '?') {
    return `${a.replace('[ ? ]', t)} → ${t}`;
  }
  switch (fact.op) {
    case '+':
      return `${t} − ${b} = ${a}`;
    case '−':
      return `${t} + ${b} = ${a}`;
    case '×':
      return `${t} ÷ ${b} = ${a}`;
    case '÷':
      return `${t} × ${b} = ${a}`;
  }
}

interface SecretCheck {
  question: string;
  choices: string[];
  answer: string;
  explainNl: string;
  explainEn: string;
}

const SECRET_CHECKS: SecretCheck[] = [
  {
    question: '9 + 6 = ?',
    choices: ['13', '14', '15', '16'],
    answer: '15',
    explainNl: '9 heeft 1 nodig om 10 te worden. Leen 1 van de 6 (blijft 5). 10 + 5 = 15.',
    explainEn: '9 needs 1 to make 10. Borrow 1 from the 6 (leaving 5). 10 + 5 = 15.',
  },
  {
    question: '52 − 48 = ?',
    choices: ['3', '4', '6', '14'],
    answer: '4',
    explainNl: 'Tel omhoog: van 48 naar 50 is +2, van 50 naar 52 is +2. Samen 4.',
    explainEn: 'Count up: from 48 to 50 is +2, from 50 to 52 is +2. Together 4.',
  },
  {
    question: '6 × 7 = ?',
    choices: ['36', '42', '48', '49'],
    answer: '42',
    explainNl: '5 × 7 = 35. Nog één keer 7 erbij: 35 + 7 = 42.',
    explainEn: '5 × 7 = 35. Add one more 7: 35 + 7 = 42.',
  },
  {
    question: '4 × 9 = ?',
    choices: ['27', '32', '36', '38'],
    answer: '36',
    explainNl: 'Dubbel-dubbel: 9 verdubbeld is 18, en 18 verdubbeld is 36.',
    explainEn: 'Double-double: 9 doubled is 18, and 18 doubled is 36.',
  },
  {
    question: '1/3 = ?/6',
    choices: ['1', '2', '3', '4'],
    answer: '2',
    explainNl: 'Zesden zijn half zo groot als derden. Elk derde stuk wordt 2 zesde stukjes: 1/3 = 2/6.',
    explainEn: 'Sixths are half the size of thirds. Each third becomes 2 sixths: 1/3 = 2/6.',
  },
  {
    question: 'GGD / HCF(12, 18) = ?',
    choices: ['3', '6', '9', '36'],
    answer: '6',
    explainNl: 'De delers van 12 zijn 1,2,3,4,6,12 en van 18 zijn 1,2,3,6,9,18. De grootste gedeelde deler (GGD) is 6!',
    explainEn: 'The factors of 12 are 1,2,3,4,6,12 and of 18 are 1,2,3,6,9,18. The Highest Common Factor (HCF) is 6!',
  },
  {
    question: 'KGV / LCM(4, 6) = ?',
    choices: ['2', '12', '18', '24'],
    answer: '12',
    explainNl: 'Tafel van 4: 4, 8, 12... Tafel van 6: 6, 12... Ze landen voor het eerst samen op 12 (het KGV)!',
    explainEn: 'Multiples of 4: 4, 8, 12... Multiples of 6: 6, 12... They first land together at 12 (the LCM)!',
  },
];

interface BondFamilyPreset {
  id: string;
  label: string;
  top: string;
  left: string;
  right: string;
  type: 'addSub' | 'multDiv';
  secretNl: string;
  secretEn: string;
}

const BOND_PRESETS: BondFamilyPreset[] = [
  {
    id: '7-8-56',
    label: '7 × 8 = 56',
    top: '56',
    left: '7',
    right: '8',
    type: 'multDiv',
    secretNl:
      'Ken je 7 × 8 = 56? Dan weet je automatisch ook 8 × 7 = 56, én 56 ÷ 7 = 8, én 56 ÷ 8 = 7! 4 sommen voor de prijs van 1!',
    secretEn:
      'Know 7 × 8 = 56? Then you automatically know 8 × 7 = 56, 56 ÷ 7 = 8, and 56 ÷ 8 = 7! 4 facts for the price of 1!',
  },
  {
    id: '6-9-54',
    label: '6 × 9 = 54',
    top: '54',
    left: '6',
    right: '9',
    type: 'multDiv',
    secretNl:
      '10 × 6 = 60. Haal er één keer 6 vanaf → 54! Daarmee kraak je meteen 54 ÷ 6 = 9 en 54 ÷ 9 = 6.',
    secretEn:
      '10 × 6 = 60. Subtract one 6 → 54! That immediately unlocks 54 ÷ 6 = 9 and 54 ÷ 9 = 6.',
  },
  {
    id: '8-7-15',
    label: '8 + 7 = 15',
    top: '15',
    left: '8',
    right: '7',
    type: 'addSub',
    secretNl:
      'Splits de 7 in 2 + 5 → 8 + 2 = 10, + 5 = 15! Daardoor weet je meteen zonder tellen dat 15 − 8 = 7 en 15 − 7 = 8.',
    secretEn:
      'Split 7 into 2 + 5 → 8 + 2 = 10, + 5 = 15! That means you instantly know 15 − 8 = 7 and 15 − 7 = 8 without counting.',
  },
  {
    id: '18-14-32',
    label: '18 + 14 = 32',
    top: '32',
    left: '18',
    right: '14',
    type: 'addSub',
    secretNl:
      'Geef 2 van de 14 aan de 18 → dan wordt het 20 + 12 = 32! En 32 − 18 is dus gewoon 14!',
    secretEn:
      'Give 2 from 14 to 18 → it turns into 20 + 12 = 32! And 32 − 18 is automatically 14!',
  },
  {
    id: 'frac-quarters',
    label: '1/4 + 1/2 = 3/4',
    top: '3/4',
    left: '1/4',
    right: '1/2 (2/4)',
    type: 'addSub',
    secretNl:
      '1/2 is precies 2/4. Samen met 1/4 geeft dat 3/4! En 3/4 − 1/2 laat dus altijd 1/4 over.',
    secretEn:
      '1/2 is equal to 2/4. Together with 1/4 that makes 3/4! And 3/4 − 1/2 always leaves 1/4.',
  },
];

export const NumberDojoModal: React.FC<NumberDojoModalProps> = ({
  lang,
  progress,
  onReviewAttempt,
  onClose,
}) => {
  const L = translations[lang].learn;
  const [activeTab, setActiveTab] = useState<'blitz' | 'triangle' | 'secrets'>(
    'blitz'
  );
  const [selectedPreset, setSelectedPreset] = useState<BondFamilyPreset>(
    BOND_PRESETS[0]
  );
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null);
  const [secretAnswers, setSecretAnswers] = useState<Record<number, string>>({});

  const dueId = getNextDueFactId(
    progress.trickyFacts.map((f) => f.id),
    progress.factReview
  );
  const dueFact = progress.trickyFacts.find((f) => f.id === dueId) ?? null;
  const shownFact = feedback?.fact ?? dueFact;
  const shownState = shownFact
    ? progress.factReview[shownFact.id] ?? createReviewState()
    : null;

  const handleChoiceTap = (choice: string) => {
    if (!dueFact || feedback) return;
    const correct = choice === dueFact.targetLabel;
    const before = progress.factReview[dueFact.id] ?? createReviewState();
    const result = recordReviewAnswer(before, correct);
    let kind: ReviewFeedback['kind'] = correct ? 'correct' : 'wrong';
    if (result.masteredNow) {
      kind = claimMasteryReward(result.state).rewardGranted ? 'mastered' : 'masteredAgain';
    }
    if (correct) {
      soundEngine.playCorrect(result.masteredNow ? 5 : 2);
    } else {
      soundEngine.playGentleMiss();
    }
    onReviewAttempt(dueFact.id, correct);
    setFeedback({ fact: dueFact, choice, kind, doneCount: result.state.consecutiveCorrect });
  };

  return (
    <div
      data-testid="dojo-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
    >
      <div className="light-surface-card relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 border-2 border-cyan-400/60 p-4 sm:p-6 shadow-[0_0_60px_rgba(34,211,238,0.3)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>🥋 HUNTR/X Number Sense Lab</span>
              <span>•</span>
              <span>
                {L.factsConquered(progress.conqueredTrickyCount)}
              </span>
            </div>
            <h2 className="dojo-title font-display font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-200 to-pink-400">
              {lang === 'nl'
                ? 'HUNTR/X Getallen-Dojo (Word een Reken-Expert!)'
                : 'HUNTR/X Number Dojo (Become a Math Expert!)'}
            </h2>
          </div>

          <button
            onClick={onClose}
            data-testid="dojo-close-btn"
            className="light-pill-btn px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-200 text-xs font-bold border border-purple-500/30 cursor-pointer"
          >
            ✕ {lang === 'nl' ? 'Sluiten' : 'Close'}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => {
              soundEngine.playTap();
              setActiveTab('blitz');
            }}
            className={`py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition border cursor-pointer ${
              activeTab === 'blitz'
                ? 'keep-white-text bg-gradient-to-r from-pink-600 to-purple-600 text-white border-amber-300 shadow-lg'
                : 'light-pill-btn bg-slate-900/80 text-purple-200 border-purple-500/30 hover:border-purple-400'
            }`}
          >
            🎯 {L.reviewTab}
          </button>
          <button
            onClick={() => {
              soundEngine.playTap();
              setActiveTab('triangle');
            }}
            className={`py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition border cursor-pointer ${
              activeTab === 'triangle'
                ? 'keep-white-text bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-amber-300 shadow-lg'
                : 'light-pill-btn bg-slate-900/80 text-purple-200 border-purple-500/30 hover:border-purple-400'
            }`}
          >
            🔺 {lang === 'nl' ? 'Sommen-Driehoek' : 'Fact-Family Lab'}
          </button>
          <button
            onClick={() => {
              soundEngine.playTap();
              setActiveTab('secrets');
            }}
            className={`py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition border cursor-pointer ${
              activeTab === 'secrets'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 border-yellow-200 shadow-lg'
                : 'light-pill-btn bg-slate-900/80 text-purple-200 border-purple-500/30 hover:border-purple-400'
            }`}
          >
            🧠 {lang === 'nl' ? '5 Reken-Geheimen' : '5 Math Secrets'}
          </button>
        </div>

        {/* TAB 1: SPACED FACT REVIEW */}
        {activeTab === 'blitz' && !shownFact && (
          <div className="light-subcard rounded-2xl bg-slate-900/90 border border-pink-500/40 p-5 space-y-3 text-center">
            <div className="font-display font-black text-lg text-amber-300">
              {progress.trickyFacts.length > 0
                ? L.resting(progress.trickyFacts.length)
                : L.allCaughtUpTitle}
            </div>
            <p className="text-sm text-purple-100">
              {progress.trickyFacts.length > 0 ? L.restingHelp : L.allCaughtUpHelp}
            </p>
            <button
              type="button"
              onClick={onClose}
              data-testid="dojo-play-stage-btn"
              className="keep-white-text px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold border border-amber-300 cursor-pointer"
            >
              {L.playStageBtn}
            </button>
          </div>
        )}

        {activeTab === 'blitz' && shownFact && shownState && (
          <div className="light-subcard rounded-2xl bg-slate-900/90 border border-pink-500/40 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-pink-300">{L.reviewIntro}</span>
              <div className="flex items-center gap-1.5">
                <span
                  data-testid="dojo-practice-reward-badge"
                  className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-[11px] font-bold"
                >
                  {lang === 'nl'
                    ? `Rustig oefenen • +${MASTERY_GEMS} 💎 bij meesterschap`
                    : `No-timer practice • +${MASTERY_GEMS} 💎 on mastery`}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-extrabold">
                  {L.reviewProgress(
                    feedback ? feedback.doneCount : shownState.consecutiveCorrect,
                    REVIEWS_TO_MASTER
                  )}
                </span>
              </div>
            </div>

            {/* Equation Display */}
            <div
              data-testid="dojo-equation-box"
              className="dojo-eq-box py-6 px-4 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 border-2 border-cyan-400/50 text-center shadow-inner"
            >
              <div className="font-display font-black text-3xl sm:text-5xl text-white tracking-wide">
                {shownFact.bLabel === '?' ? (
                  <>
                    <span>
                      {localizeFormulaLabel(shownFact.aLabel, lang).replace(
                        '[ ? ]',
                        feedback ? shownFact.targetLabel : '[ ? ]'
                      )}
                    </span>{' '}
                    {!shownFact.aLabel.includes('[ ? ]') && (
                      <>
                        <span className="text-cyan-300">=</span>{' '}
                        <span className="inline-block px-3 py-0.5 rounded-xl bg-amber-400/20 border border-amber-300 text-amber-300">
                          {feedback ? shownFact.targetLabel : '?'}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span>{localizeFormulaLabel(shownFact.aLabel, lang)}</span>{' '}
                    <span className="text-amber-400">{shownFact.op}</span>{' '}
                    <span>{shownFact.bLabel}</span>{' '}
                    <span className="text-cyan-300">=</span>{' '}
                    <span className="inline-block px-3 py-0.5 rounded-xl bg-amber-400/20 border border-amber-300 text-amber-300">
                      {feedback ? shownFact.targetLabel : '?'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 4 Answer Choices (locked while feedback is shown) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {shownFact.choices.map((ch) => {
                const isAnswer = ch === shownFact.targetLabel;
                const picked = feedback?.choice === ch;
                return (
                  <button
                    key={ch}
                    type="button"
                    data-testid="dojo-choice-btn"
                    disabled={!!feedback}
                    onClick={() => handleChoiceTap(ch)}
                    className={`btn-3d-key py-4 rounded-2xl font-display font-black text-2xl sm:text-3xl border-2 transition ${
                      feedback && isAnswer
                        ? 'bg-emerald-900/80 border-emerald-400 text-emerald-100'
                        : feedback && picked
                        ? 'bg-rose-950/90 border-rose-400 text-rose-200 animate-shake'
                        : feedback
                        ? 'bg-slate-800/50 border-purple-400/20 text-purple-300/60'
                        : 'dojo-choice-btn bg-slate-800/90 hover:bg-purple-800/80 border-purple-400/50 hover:border-amber-300 text-white shadow-md cursor-pointer'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div
                data-testid="dojo-feedback"
                className={`p-3 rounded-xl border font-bold text-center text-sm animate-pop-in space-y-1 ${
                  feedback.kind === 'wrong'
                    ? 'bg-amber-500/15 border-amber-300 text-amber-100'
                    : 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                }`}
              >
                <div>
                  {feedback.kind === 'wrong'
                    ? L.wrongTryLater
                    : feedback.kind === 'correct'
                    ? L.correctComeBack
                    : feedback.kind === 'mastered'
                    ? L.masteredReward(MASTERY_GEMS, MASTERY_XP)
                    : L.masteredAgain}
                </div>
                {feedback.kind !== 'wrong' && (
                  <div className="text-xs font-semibold">
                    {L.alsoTrue} {inverseFact(feedback.fact)}
                  </div>
                )}
              </div>
            )}

            {/* Strategy is shown only after an attempt, so the child retrieves first */}
            {feedback && (
              <div className="p-3.5 rounded-xl bg-cyan-950/50 border border-cyan-400/40 flex items-start gap-3">
                <span className="text-2xl">🐯</span>
                <div className="text-xs sm:text-sm text-cyan-100">
                  <div className="font-bold text-cyan-300 mb-0.5">{L.strategyTitle}</div>
                  <div>{lang === 'nl' ? feedback.fact.hintNl : feedback.fact.hintEn}</div>
                </div>
              </div>
            )}

            {feedback && (
              <button
                type="button"
                data-testid="dojo-continue-btn"
                onClick={() => setFeedback(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-display font-bold border border-amber-300 cursor-pointer keep-white-text"
              >
                {L.continueBtn}
              </button>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE FACT-FAMILY TRIANGLE LAB */}
        {activeTab === 'triangle' && (
          <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/40 p-4 sm:p-5 space-y-4">
            <div className="text-xs sm:text-sm text-purple-100">
              {lang === 'nl'
                ? '💡 Geheim van Reken-Kampioenen: Getallen horen bij elkaar in drietallen (Sommen-Families). Kies een drietal hieronder om te zien hoe 1 weetje meteen 4 sommen oplost!'
                : '💡 Math Champion Secret: Numbers live in families of three (Fact Families). Pick a trio below to see how knowing 1 bond unlocks 4 equations at once!'}
            </div>

            <div className="flex flex-wrap gap-2">
              {BOND_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    soundEngine.playTap();
                    setSelectedPreset(p);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                    selectedPreset.id === p.id
                      ? 'bg-amber-400 text-slate-950 border-white shadow'
                      : 'light-pill-btn bg-slate-800 text-purple-200 border-purple-500/30 hover:border-amber-300/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-950/80 rounded-2xl p-4 border border-purple-500/30">
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 200 135" className="w-48 h-32">
                  <line
                    x1="100"
                    y1="28"
                    x2="42"
                    y2="105"
                    stroke="#fbbf24"
                    strokeWidth="3.5"
                  />
                  <line
                    x1="100"
                    y1="28"
                    x2="158"
                    y2="105"
                    stroke="#fbbf24"
                    strokeWidth="3.5"
                  />
                  <line
                    x1="42"
                    y1="105"
                    x2="158"
                    y2="105"
                    stroke="#22d3ee"
                    strokeWidth="3.5"
                  />

                  <circle
                    cx="100"
                    cy="28"
                    r="24"
                    fill="#4c1d95"
                    stroke="#fbbf24"
                    strokeWidth="3"
                  />
                  <text
                    x="100"
                    y="33"
                    textAnchor="middle"
                    fill="#fde68a"
                    fontSize="15"
                    fontWeight="900"
                  >
                    {selectedPreset.top}
                  </text>

                  <circle
                    cx="42"
                    cy="105"
                    r="23"
                    fill="#0f172a"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                  />
                  <text
                    x="42"
                    y="110"
                    textAnchor="middle"
                    fill="#cffafe"
                    fontSize="13"
                    fontWeight="800"
                  >
                    {selectedPreset.left}
                  </text>

                  <circle
                    cx="158"
                    cy="105"
                    r="23"
                    fill="#0f172a"
                    stroke="#f472b6"
                    strokeWidth="2.5"
                  />
                  <text
                    x="158"
                    y="110"
                    textAnchor="middle"
                    fill="#fbcfe8"
                    fontSize="12"
                    fontWeight="800"
                  >
                    {selectedPreset.right}
                  </text>
                </svg>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  {lang === 'nl'
                    ? 'De 4 Verbonden Sommen:'
                    : 'The 4 Connected Equations:'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm font-black">
                  {selectedPreset.type === 'multDiv' ? (
                    <>
                      <div className="p-2 rounded-lg bg-purple-900/50 text-amber-200 border border-amber-400/30">
                        {selectedPreset.left} × {selectedPreset.right} ={' '}
                        {selectedPreset.top}
                      </div>
                      <div className="p-2 rounded-lg bg-purple-900/50 text-amber-200 border border-amber-400/30">
                        {selectedPreset.right} × {selectedPreset.left} ={' '}
                        {selectedPreset.top}
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/70 text-cyan-200 border border-cyan-400/30">
                        {selectedPreset.top} ÷ {selectedPreset.left} ={' '}
                        {selectedPreset.right}
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/70 text-cyan-200 border border-cyan-400/30">
                        {selectedPreset.top} ÷ {selectedPreset.right} ={' '}
                        {selectedPreset.left}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 rounded-lg bg-purple-900/50 text-amber-200 border border-amber-400/30">
                        {selectedPreset.left} + {selectedPreset.right} ={' '}
                        {selectedPreset.top}
                      </div>
                      <div className="p-2 rounded-lg bg-purple-900/50 text-amber-200 border border-amber-400/30">
                        {selectedPreset.right} + {selectedPreset.left} ={' '}
                        {selectedPreset.top}
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/70 text-cyan-200 border border-cyan-400/30">
                        {selectedPreset.top} − {selectedPreset.left} ={' '}
                        {selectedPreset.right}
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/70 text-cyan-200 border border-cyan-400/30">
                        {selectedPreset.top} − {selectedPreset.right} ={' '}
                        {selectedPreset.left}
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-purple-200 pt-1">
                  {lang === 'nl'
                    ? selectedPreset.secretNl
                    : selectedPreset.secretEn}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GREG TANG'S 5 MENTAL MATH SECRETS */}
        {activeTab === 'secrets' && (
          <div className="space-y-2.5">
            {[
              {
                icon: '🔟',
                titleNl: '1. De "Eerst-naar-de-10" Brug (Optellen)',
                titleEn: '1. The "Make-10 First" Bridge (Addition)',
                descNl:
                  'Tel nooit op je vingers! Bij 8 + 6 kijk je eerst hoeveel 8 nodig heeft om 10 te worden (+2). Die 2 leen je van de 6 (blijft 4 over). 10 + 4 = 14!',
                descEn:
                  'Never count on fingers! For 8 + 6, see what 8 needs to make 10 (+2). Borrow 2 from 6 (leaving 4). 10 + 4 = 14!',
              },
              {
                icon: '🚀',
                titleNl: '2. De Aanvul-Sprong (Slim Aftrekken)',
                titleEn: '2. The Count-Up Jump (Smart Subtraction)',
                descNl:
                  'Lijkt 42 − 37 lastig? Draai hem om en tel omhoog! Van 37 naar 40 is +3, en van 40 naar 42 is +2. Samen 3 + 2 = 5!',
                descEn:
                  'Does 42 − 37 look tough? Flip it and count up! From 37 to 40 is +3, and from 40 to 42 is +2. Together 3 + 2 = 5!',
              },
              {
                icon: '⭐',
                titleNl: '3. De 5× Springplank (Voor 6×, 7× en 8×)',
                titleEn: '3. The 5× Stepping Stone (For 6×, 7×, and 8×)',
                descNl:
                  'De tafel van 5 is supermakkelijk! Gebruik hem als steunpunt: 7 × 8 = (5 × 8 = 40) + (2 × 8 = 16) = 56!',
                descEn:
                  'The 5× table is super easy! Use it as a stepping stone: 7 × 8 = (5 × 8 = 40) + (2 × 8 = 16) = 56!',
              },
              {
                icon: '⚡',
                titleNl: '4. Dubbel-Dubbel & Halveer-Halveer (4× en ÷4)',
                titleEn: '4. Double-Double & Half-Half (4× and ÷4)',
                descNl:
                  '4× betekent gewoon twee keer verdubbelen (4 × 7 → 14 → 28). En delen door 4 (÷4) is twee keer de helft nemen (36 ÷ 4 → 18 → 9)!',
                descEn:
                  '4× just means doubling twice (4 × 7 → 14 → 28). And dividing by 4 (÷4) means taking half twice (36 ÷ 4 → 18 → 9)!',
              },
              {
                icon: '🍕',
                titleNl: '5. Breuken Zien als Taartpunten',
                titleEn: '5. Seeing Fractions as Pie Slices',
                descNl:
                  'Een halve taart (1/2) is precies even groot als 2 kwarten (2/4) of 3 zesden (3/6). Zo tel je 1/2 + 1/4 in één seconde op tot 3/4!',
                descEn:
                  'Half a pie (1/2) is the exact same size as 2 quarters (2/4) or 3 sixths (3/6). That lets you add 1/2 + 1/4 = 3/4 in one second!',
              },
            ].map((card, i) => {
              const check = SECRET_CHECKS[i];
              const picked = secretAnswers[i];
              const solved = picked === check.answer;
              return (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/30 flex items-start gap-3"
                >
                  <span className="text-2xl">{card.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-display font-bold text-xs sm:text-sm text-amber-300">
                      {lang === 'nl' ? card.titleNl : card.titleEn}
                    </h4>
                    <p className="text-xs text-purple-100/90 mt-0.5">
                      {lang === 'nl' ? card.descNl : card.descEn}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5" data-testid="secret-try-it">
                      <span className="text-xs font-extrabold text-cyan-300">
                        {L.tryItTitle} {check.question}
                      </span>
                      {check.choices.map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          disabled={solved}
                          onClick={() => {
                            if (ch === check.answer) soundEngine.playCorrect(2);
                            else soundEngine.playGentleMiss();
                            setSecretAnswers((prev) => ({ ...prev, [i]: ch }));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black border transition ${
                            picked === ch && solved
                              ? 'bg-emerald-900/80 border-emerald-400 text-emerald-100'
                              : picked === ch
                              ? 'bg-rose-950/90 border-rose-400 text-rose-200'
                              : 'light-pill-btn bg-slate-800 border-purple-400/40 text-white hover:border-amber-300 cursor-pointer'
                          }`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                    {picked !== undefined && (
                      <p
                        className={`mt-1.5 text-xs font-semibold ${
                          solved ? 'text-emerald-300' : 'text-amber-200'
                        }`}
                      >
                        {solved ? L.tryItCorrect : L.tryItWrong}{' '}
                        {lang === 'nl' ? check.explainNl : check.explainEn}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
