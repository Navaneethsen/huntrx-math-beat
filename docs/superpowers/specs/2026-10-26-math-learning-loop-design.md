# Math Learning Loop Design

## Goal

Improve the math game's learning value and replay experience for ages 9–11. Keep the K-pop theme, all five game modes, Dutch/English support, and local-only progress. Encourage useful practice without treating speed, points, or collectibles as proof of mastery.

## Review findings

- Correct answers earn more points for speed, and answers under 3.2 seconds earn extra gems. This can favor rushing over choosing and explaining a strategy.
- A missed main-game fact is added to the Dojo queue, but one correct answer removes it and awards rewards. Starter facts can return as fallback content when the queue empties.
- The X-Ray, fact-family examples, and Math Secrets teach useful ideas, but the secrets are passive and do not check independent application.
- Session summaries foreground speed and streaks; they do not recommend review based on recent errors.
- 1v1 misses are not added to the child's review queue, unlike the main modes.
- Fraction generation chooses denominators randomly, including 7 and 9, and can produce values greater than one in skills presented as basic. Skill labels and generated practice need a consistency check.

## Design

### Learning loop and rewards

- Keep solo practice, Honmoon Chain, Timed Rush, co-op, and 1v1. Timed Rush remains optional.
- Give the same base points and ordinary rewards for every correct answer, regardless of answer time or streak. Keep combo/streak effects visual only.
- Capture the child's missed facts in every mode, including the child's side of 1v1. Do not add the parent's 1v1 errors to the child's review queue.
- In the Dojo, show a missed fact again only after at least three other prompts have been answered. Mark it mastered after two correct retrievals, with at least three other prompts between those two correct reviews. A miss resets its consecutive-correct count; it returns after three other prompts.
- Pay the mastery reward only once per fact ID in a saved profile, including starter facts. A fact can return for practice after a later miss, but cannot be used to farm mastery rewards.
- Give incorrect attempts a supportive, relevant explanation and another chance later. Keep starter facts as onboarding content, not repeatable reward content.

### Skill content and coaching

- Audit the generated ranges and examples against each skill's displayed name and description. Keep labels accurate and progression understandable for ages 9–11; do not claim alignment to a particular school curriculum.
- Make fraction practice progressive and its labels truthful. Fraction seals stay at or below one whole. Denominators are chosen per seal size from sets that can actually produce a unique-answer seal (bigger seals need larger denominators).
- Keep the X-Ray visual models and fact-family triangle as optional scaffolds.
- For each Math Secret, show a worked example separately from a fresh, unsolved application check. Do not reveal the check's answer before the child attempts it.
- Keep the strategy and feedback support available in each game mode, including 1v1 for the child.

### Replay and session summary

- Summarize accuracy, strategies practiced, and facts due for review. Recommend a next practice focus based on recent misses.
- Retain collectibles and celebratory visual effects as motivation, but do not present them as evidence of mathematical mastery.
- Do not add daily streak loss, attendance pressure, or penalties for taking a break.

## Data and architecture

- Extend the existing `PlayerProgress` / tricky-fact records and progression helpers; do not add a backend, analytics, dependencies, or new game modes.
- Persist review spacing, mastery count, and whether the mastery reward has already been paid in the existing `localStorage` progress record.
- Load old saves safely without discarding XP, gems, unlocked cards, or prior tricky facts. Preserve Dutch and English by adding all new player-facing copy to both translation dictionaries.
- Keep the implementation focused on shared learning behavior and the affected game/Dojo flows; avoid unrelated refactors.

## Verification

- Run `npm run build` for TypeScript and Vite validation.
- Verify in every mode that a child's missed fact enters the queue and parent 1v1 misses do not.
- Verify review spacing (three other prompts), two separated correct answers to master, and reset after a miss.
- Verify starter and previously rewarded facts cannot generate repeat mastery rewards.
- Verify equal ordinary rewards regardless of answer time/streak, while visual combo feedback still works.
- Verify fraction generation and labels against the selected skill progression, including that basic practice does not silently generate values greater than one.
- Verify the strategy check does not expose its answer before an attempt and that the feedback/retry flow works.
- Verify old local saves load without losing existing progress.

## Out of scope

- A full curriculum/grade placement overhaul or a claim of alignment to a specific school standard.
- Accounts, cloud sync, analytics, notifications, daily attendance mechanics, new game modes, or a change to the K-pop theme.
- Guaranteeing that children return or that a game alone produces mathematical improvement; those outcomes require observation and learning data.
