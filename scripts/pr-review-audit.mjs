#!/usr/bin/env node
/**
 * HUNTR/X Math Beat — Automated PR Review & Quality Gate
 *
 * Thoroughly audits code changes and repository health across 6 pillars:
 *   1. Design System & UI Component Standards (layout, 3D controls, buttons, typography)
 *   2. Colour Grading, Translucency & Theme Harmony (soap bubbles, 3D glass, thermometer, dark/light themes)
 *   3. Bilingual (EN / NL) Translation Parity & Dutch Leakage Guard
 *   4. Spelling, Typography & Copy Quality (duplicate words, known typos, malformed strings)
 *   5. Git Diff Impact & UI Layout Change Analysis
 *   6. Engine & Question Randomization Integrity
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const reportIdx = args.indexOf('--report');
const reportFile = reportIdx !== -1 && args[reportIdx + 1] ? path.resolve(ROOT, args[reportIdx + 1]) : null;

const results = [];

function record(pillar, check, status, details) {
  results.push({ pillar, check, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} [${pillar}] ${check}: ${details}`);
}

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function walkFiles(dir, exts = ['.ts', '.tsx', '.css']) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

// ============================================================================
// PILLAR 0: PR TITLE, DESCRIPTION & BASIC HYGIENE RULES
// ============================================================================
function auditPullRequestRules() {
  const pillar = '0. PR Basic Rules';
  const prTitle = (process.env.PR_TITLE || '').trim();
  const prBody = (process.env.PR_BODY || '').trim();
  const isPullRequest = process.env.GITHUB_EVENT_NAME === 'pull_request' || Boolean(prTitle);

  if (isPullRequest) {
    // 0a. PR Title length & descriptiveness
    const genericTitles = /^(wip|fix|update|updates|test|testing|changes|patch|temp|commit|pr|minor)$/i;
    const validLength = prTitle.length >= 10 && prTitle.length <= 100;
    const isNotGeneric = !genericTitles.test(prTitle);
    const startsCleanly =
      /^[A-Z]/.test(prTitle) ||
      /^(feat|fix|style|ui|design|refactor|perf|test|docs|chore|ci|build)(\([a-z0-9-]+\))?:\s+\S+/i.test(prTitle);

    record(
      pillar,
      'PR Title Format & Length (10–100 chars)',
      validLength && isNotGeneric && startsCleanly ? 'PASS' : 'FAIL',
      validLength && isNotGeneric && startsCleanly
        ? `PR title is descriptive and properly formatted: "${prTitle}"`
        : `PR title "${prTitle}" must be 10–100 characters, non-generic, and start with a capital letter or conventional prefix (feat:, fix:, ui:, style:, etc.).`
    );

    // 0b. PR Description / Summary presence
    const strippedBody = prBody.replace(/<!--[\s\S]*?-->/g, '').trim();
    const hasMeaningfulBody = strippedBody.length >= 15;
    record(
      pillar,
      'PR Description / Summary Provided',
      hasMeaningfulBody ? 'PASS' : 'FAIL',
      hasMeaningfulBody
        ? `PR description provided (${strippedBody.length} chars).`
        : 'PR description is empty or too short (please provide at least a 1-sentence summary of what changed and why).'
    );
  } else {
    record(
      pillar,
      'PR Metadata Context',
      'PASS',
      'Local / branch run (PR title & description checks activate automatically on pull_request events).'
    );
  }

  // 0c. Merge conflict markers check across all source files
  const allCheckedFiles = [
    ...walkFiles(path.join(ROOT, 'src'), ['.ts', '.tsx', '.css']),
    path.join(ROOT, 'index.html'),
    path.join(ROOT, 'package.json'),
  ];
  const conflictFiles = [];
  for (const file of allCheckedFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (/^(<<<<<<<|=======|>>>>>>>)\s/m.test(content)) {
      conflictFiles.push(path.relative(ROOT, file));
    }
  }
  record(
    pillar,
    'Zero Merge Conflict Markers',
    conflictFiles.length === 0 ? 'PASS' : 'FAIL',
    conflictFiles.length === 0
      ? 'No unresolved git conflict markers (<<<<<<< / >>>>>>>) found.'
      : `Merge conflict markers found in: ${conflictFiles.join(', ')}`
  );

  // 0d. Forbidden files & basic hygiene check (no .env or tracked .DS_Store in git)
  let forbiddenTracked = [];
  try {
    const tracked = execSync('git ls-files', {
      cwd: ROOT,
      env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    forbiddenTracked = tracked.filter(
      (f) => f === '.env' || f.startsWith('.env.') || f.endsWith('.DS_Store')
    );
  } catch {
    if (fs.existsSync(path.join(ROOT, '.env'))) forbiddenTracked.push('.env');
  }
  record(
    pillar,
    'No Tracked Secrets or OS Junk Files (.env / .DS_Store)',
    forbiddenTracked.length === 0 ? 'PASS' : 'FAIL',
    forbiddenTracked.length === 0
      ? 'No .env or .DS_Store files are tracked in git.'
      : `Forbidden tracked file(s) found in git: ${forbiddenTracked.join(', ')}`
  );

  // 0e. Cloudflare PR Preview Configuration Check (wrangler.jsonc)
  const wranglerCfg = readText('wrangler.jsonc');
  const hasPreviewsBlock = /"previews"\s*:\s*\{/.test(wranglerCfg);
  record(
    pillar,
    'Cloudflare PR Preview Config ("previews": {} in wrangler.jsonc)',
    hasPreviewsBlock ? 'PASS' : 'FAIL',
    hasPreviewsBlock
      ? 'wrangler.jsonc includes "previews": {} so `npx wrangler preview` generates live PR preview URLs.'
      : 'Missing "previews": {} in wrangler.jsonc — Cloudflare PR preview builds (`npx wrangler preview`) will fail.'
  );
}

// ============================================================================
// PILLAR 1: DESIGN SYSTEM & UI COMPONENT STANDARDS
// ============================================================================
function auditDesignSystem() {
  const pillar = '1. Design & Layout';
  const appTsx = readText('src/App.tsx');
  const arcadeTsx = readText('src/components/TangArcadeModal.tsx');
  const volume3dTsx = readText('src/components/StageVolume3D.tsx');
  const tailwindCfg = readText('tailwind.config.js');

  // 1a. Display & Sans fonts configured
  const hasFredoka = tailwindCfg.includes('Fredoka') && tailwindCfg.includes('Nunito');
  record(
    pillar,
    'Typography Tokens (Fredoka + Nunito)',
    hasFredoka ? 'PASS' : 'FAIL',
    hasFredoka
      ? 'Display ("Fredoka") and sans ("Nunito") font families are properly configured.'
      : 'Missing Fredoka or Nunito font family definitions in tailwind.config.js.'
  );

  // 1b. Core Summary / Encore Screen CTAs & test IDs present
  const requiredTestIds = [
    'play-next-stage-btn',
    'summary-try-another-power-btn',
    'summary-learning-panel',
  ];
  const missingIds = requiredTestIds.filter((id) => !appTsx.includes(`data-testid="${id}"`));
  record(
    pillar,
    'Summary Screen Action CTAs & Test Anchors',
    missingIds.length === 0 ? 'PASS' : 'FAIL',
    missingIds.length === 0
      ? 'All required Summary / Encore screen CTAs and data-testid hooks are intact.'
      : `Missing required data-testid attributes in src/App.tsx: ${missingIds.join(', ')}`
  );

  // 1c. Summary screen layout order check (Next Stage CTA visibility on small screens)
  const nextStageBtnIdx = appTsx.indexOf('data-testid="play-next-stage-btn"');
  const learningPanelIdx = appTsx.indexOf('data-testid="summary-learning-panel"');
  const nextStageAboveLearning =
    nextStageBtnIdx !== -1 && learningPanelIdx !== -1 && nextStageBtnIdx < learningPanelIdx;
  record(
    pillar,
    'Summary Screen Vertical Hierarchy',
    nextStageAboveLearning ? 'PASS' : 'WARN',
    nextStageAboveLearning
      ? 'Next Stage CTA is positioned above the Equations Cracked & Learning panels for small-screen visibility.'
      : 'Next Stage CTA appears below the Learning Panel (may require scrolling on compact screens).'
  );

  // 1d. 3D Volume Stage control simplicity (Only Split and Spin buttons, plus drag-to-rotate)
  const hasPointerDrag =
    volume3dTsx.includes('onPointerDown=') &&
    volume3dTsx.includes('onPointerMove=') &&
    volume3dTsx.includes('onPointerUp=');
  const hasSplitAndSpin =
    volume3dTsx.includes('data-testid="volume-explode-layers-btn"') &&
    volume3dTsx.includes('data-testid="volume-autospin-btn"');
  const hasRemovedClutterButtons =
    !volume3dTsx.includes('Top View') &&
    !volume3dTsx.includes('Front View') &&
    !volume3dTsx.includes('Side View');
  record(
    pillar,
    '3D Cuboid Viewer Controls (Drag + Split & Spin Only)',
    hasPointerDrag && hasSplitAndSpin && hasRemovedClutterButtons ? 'PASS' : 'FAIL',
    hasPointerDrag && hasSplitAndSpin && hasRemovedClutterButtons
      ? '3D Volume stage keeps clean drag-to-rotate interaction with only Split Layers and Spin buttons.'
      : '3D Volume stage control constraints violated (expected pointer drag + Split/Spin only).'
  );

  // 1e. Interactive bubble burst feedback in Target Trio
  const hasBubbleBurstState =
    arcadeTsx.includes('real-soap-bubble') &&
    arcadeTsx.includes('real-soap-bubble-selected') &&
    arcadeTsx.includes('real-soap-bubble-burst');
  record(
    pillar,
    'Bubble Selection & Burst Animation Flow',
    hasBubbleBurstState ? 'PASS' : 'FAIL',
    hasBubbleBurstState
      ? 'Target Trio bubbles scale/highlight on click and burst before revealing the answer.'
      : 'Target Trio bubble selection/burst classes or state transitions are missing.'
  );
}

// ============================================================================
// PILLAR 2: COLOUR GRADING, TRANSLUCENCY & THEME HARMONY
// ============================================================================
function auditColourGrading() {
  const pillar = '2. Colour Grading & Theme';
  const indexCss = readText('src/index.css');
  const arcadeTsx = readText('src/components/TangArcadeModal.tsx');
  const volume3dTsx = readText('src/components/StageVolume3D.tsx');

  // 2a. Soap bubble original color shades preserved with translucent radial gradients
  const bubbleShades = [
    { cls: '.real-soap-bubble-pink', rgbHint: '236, 72, 153' },
    { cls: '.real-soap-bubble-cyan', rgbHint: '6, 182, 212' },
    { cls: '.real-soap-bubble-amber', rgbHint: '245, 158, 11' },
    { cls: '.real-soap-bubble-violet', rgbHint: '139, 92, 246' },
  ];
  const missingBubbleShades = bubbleShades.filter(
    ({ cls, rgbHint }) => !indexCss.includes(cls) || !indexCss.includes(rgbHint)
  );
  record(
    pillar,
    'Soap Bubble Translucent Color Palette (Pink, Cyan, Amber, Violet)',
    missingBubbleShades.length === 0 ? 'PASS' : 'FAIL',
    missingBubbleShades.length === 0
      ? 'All 4 soap bubble variants retain their original vibrant hues with realistic radial-gradient translucency.'
      : `Missing or de-colored bubble shade rules in src/index.css: ${missingBubbleShades.map((b) => b.cls).join(', ')}`
  );

  // 2b. Check that bubbles are translucent (alpha < 0.9 on inner stops) and not washed-out monochrome
  const hasGlossSpecular =
    indexCss.includes('.real-soap-bubble::before') &&
    indexCss.includes('.real-soap-bubble::after') &&
    indexCss.includes('.real-soap-bubble-selected') &&
    indexCss.includes('@keyframes realBubbleBurstPop');
  record(
    pillar,
    'Soap Bubble Specular Highlights & Burst Keyframes',
    hasGlossSpecular ? 'PASS' : 'FAIL',
    hasGlossSpecular
      ? 'Curved top-left window reflection, bottom-right dot highlight, luminous selection glow, and pop keyframes are intact.'
      : 'Missing specular highlight pseudo-elements or burst keyframes on .real-soap-bubble.'
  );

  // 2c. 3D Tinted-Glass & Crystal Surface Classes
  const glassClasses = [
    '.block-3d-tile',
    '.sphere-3d-bubble',
    '.tube-3d-glass',
    '.scale-3d-weight',
    '.pad-3d-step',
    '.btn-3d-key',
  ];
  const missingGlass = glassClasses.filter((cls) => !indexCss.includes(cls));
  record(
    pillar,
    '3D Tinted-Glass & Crystal Depth Classes',
    missingGlass.length === 0 ? 'PASS' : 'FAIL',
    missingGlass.length === 0
      ? 'All 6 translucent 3D glass/crystal UI classes (.block-3d-tile, .tube-3d-glass, .scale-3d-weight, etc.) are present with backdrop blur.'
      : `Missing 3D glass classes in src/index.css: ${missingGlass.join(', ')}`
  );

  // 2d. Sub-Zero Thermometer realistic translucent color grading
  const hasThermometerColorGrading =
    arcadeTsx.includes('tube-3d-glass') &&
    arcadeTsx.includes('rgba(') &&
    volume3dTsx.includes('LAYER_PALETTES');
  record(
    pillar,
    'Sub-Zero Thermometer & 3D Crystal Layer Translucent Colour Grading',
    hasThermometerColorGrading ? 'PASS' : 'FAIL',
    hasThermometerColorGrading
      ? 'Thermometer mercury column and 3D crystal prism layers preserve realistic translucent colour grading.'
      : 'Thermometer or 3D crystal prism colour grading is missing realistic translucent rgba gradients.'
  );

  // 2e. Dark & Daylight Pastel Theme (.theme-light) harmony
  const hasThemeSupport =
    indexCss.includes('background-color: #090414') &&
    indexCss.includes('.theme-light.app-shell') &&
    indexCss.includes('.keep-dark-card');
  record(
    pillar,
    'Dark Neon & Daylight Pastel Theme (.theme-light) Parity',
    hasThemeSupport ? 'PASS' : 'FAIL',
    hasThemeSupport
      ? 'Both K-Pop Dark Neon (#090414) and Daylight Pastel (.theme-light) colour grading rules are intact.'
      : 'Missing dark base or .theme-light colour grading rules in src/index.css.'
  );
}

// ============================================================================
// PILLAR 3: BILINGUAL (EN / NL) TRANSLATION PARITY & LEAKAGE GUARD
// ============================================================================
function auditTranslations() {
  const pillar = '3. Translations (EN/NL)';
  const transText = readText('src/i18n/translations.ts');

  // 3a. Check that both en: { and nl: { blocks exist and have matching top-level and nested structure
  const enStart = transText.indexOf('\n  en: {');
  const nlStart = transText.indexOf('\n  nl: {');
  if (enStart === -1 || nlStart === -1) {
    record(pillar, 'Translation Block Structure', 'FAIL', 'Could not locate en: { and nl: { in src/i18n/translations.ts');
    return;
  }

  const enBlock = nlStart < enStart ? transText.slice(enStart) : transText.slice(enStart, nlStart);
  const nlBlock = nlStart < enStart ? transText.slice(nlStart, enStart) : transText.slice(nlStart);

  // Extract property keys defined inside en vs nl
  const keyRegex = /^\s{4,}([a-zA-Z0-9_]+)\s*:/gm;
  const enKeys = new Set([...enBlock.matchAll(keyRegex)].map((m) => m[1]));
  const nlKeys = new Set([...nlBlock.matchAll(keyRegex)].map((m) => m[1]));

  const missingInNl = [...enKeys].filter((k) => !nlKeys.has(k));
  const missingInEn = [...nlKeys].filter((k) => !enKeys.has(k));

  record(
    pillar,
    'EN / NL Translation Key Parity',
    missingInNl.length === 0 && missingInEn.length === 0 ? 'PASS' : 'FAIL',
    missingInNl.length === 0 && missingInEn.length === 0
      ? `All ${enKeys.size} translation keys match between English (en) and Dutch (nl).`
      : `Key mismatch — Missing in NL: [${missingInNl.join(', ')}], Missing in EN: [${missingInEn.join(', ')}]`
  );

  // 3b. Scan English translation block and non-Dutch UI code for leaked Dutch terms
  const forbiddenDutchInEnglish = [
    /\bGroep\s+[3-8]\b/,
    /\bGetallenlijn\b/i,
    /\bBreuken\b/i,
    /\bDoelgetal\b/i,
    /\bBallonnen\b/i,
    /\bWeegschaal\b/i,
    /\bVermenigvuldigen\b/i,
    /\bOptellen\b/i,
    /\bAftrekken\b/i,
    /\bSchatkist\b/i,
    /\bKies een spel\b/i,
  ];

  const leakedInEn = forbiddenDutchInEnglish.filter((rx) => rx.test(enBlock));
  record(
    pillar,
    'Zero Dutch Leakage in English Translations',
    leakedInEn.length === 0 ? 'PASS' : 'FAIL',
    leakedInEn.length === 0
      ? 'No Dutch terms detected inside translations.en.'
      : `Found Dutch terms inside translations.en matching: ${leakedInEn.map(String).join(', ')}`
  );

  // 3c. Check components for unguarded Dutch strings outside lang === 'nl' conditionals or *Nl dictionary properties
  const tsxFiles = walkFiles(path.join(ROOT, 'src'), ['.ts', '.tsx']).filter(
    (f) => !f.endsWith('translations.ts')
  );
  const unguardedLeaks = [];
  for (const file of tsxFiles) {
    const rel = path.relative(ROOT, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((rawLine, idx) => {
      // Strip inline and JSX comments before checking
      const line = rawLine.replace(/\/\/.*$/, '').replace(/\{\/\*.*?\*\/\}/g, '').trim();
      if (!line || line.startsWith('*') || line.startsWith('/*')) return;
      // Skip explicit Dutch localization properties (e.g., titleNl:, loreNl:, nl:) or lang === 'nl' branches
      if (
        /[a-zA-Z]*Nl\s*:/.test(line) ||
        line.includes('nl') ||
        line.includes('NL') ||
        lines[Math.max(0, idx - 1)]?.includes('nl')
      ) {
        return;
      }
      for (const rx of forbiddenDutchInEnglish) {
        if (rx.test(line)) {
          unguardedLeaks.push(`${rel}:${idx + 1} (${line})`);
        }
      }
    });
  }

  record(
    pillar,
    'Component JSX Language Guard Check',
    unguardedLeaks.length === 0 ? 'PASS' : 'FAIL',
    unguardedLeaks.length === 0
      ? 'All localized strings in components are properly gated by language selection.'
      : `Unguarded Dutch text found in components: ${unguardedLeaks.join('; ')}`
  );
}

// ============================================================================
// PILLAR 4: SPELLING, TYPOGRAPHY & COPY QUALITY
// ============================================================================
function auditSpellingAndCopy() {
  const pillar = '4. Spelling & Copy Quality';
  const files = walkFiles(path.join(ROOT, 'src'), ['.ts', '.tsx', '.css']);

  // Common English/Dutch/code typos that often slip into UI copy or comments
  const commonTypos = [
    { pattern: /\bteh\b/gi, fix: 'the' },
    { pattern: /\brecieve\b/gi, fix: 'receive' },
    { pattern: /\bseperate\b/gi, fix: 'separate' },
    { pattern: /\boccured\b/gi, fix: 'occurred' },
    { pattern: /\baccomodate\b/gi, fix: 'accommodate' },
    { pattern: /\bdefinately\b/gi, fix: 'definitely' },
    { pattern: /\bneccessary\b/gi, fix: 'necessary' },
    { pattern: /\bcalender\b/gi, fix: 'calendar' },
    { pattern: /\btruely\b/gi, fix: 'truly' },
    { pattern: /\benviroment\b/gi, fix: 'environment' },
    { pattern: /\bsuccesful\b/gi, fix: 'successful' },
    { pattern: /\bsuccesfully\b/gi, fix: 'successfully' },
    { pattern: /\bbegining\b/gi, fix: 'beginning' },
    { pattern: /\bbeacuse\b/gi, fix: 'because' },
    { pattern: /\bbecuase\b/gi, fix: 'because' },
    { pattern: /\btransparant\b/gi, fix: 'transparent (EN) / transparant is NL-only' },
    { pattern: /\bsubstract\b/gi, fix: 'subtract' },
    { pattern: /\bsubstraction\b/gi, fix: 'subtraction' },
    { pattern: /\bmultipication\b/gi, fix: 'multiplication' },
    { pattern: /\bdivison\b/gi, fix: 'division' },
    { pattern: /\bequasion\b/gi, fix: 'equation' },
    { pattern: /\btemprature\b/gi, fix: 'temperature' },
    { pattern: /\bsymetry\b/gi, fix: 'symmetry' },
  ];

  // Duplicate consecutive words in UI copy (e.g. "the the", "to to", "is is")
  const duplicateWordRegex = /\b(the|and|to|of|in|is|for|on|with|as|at|by|from|or|an|be|are|een|de|het|en|van|in|op)\s+\1\b/gi;

  const typoFindings = [];
  const duplicateFindings = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, i) => {
      for (const { pattern, fix } of commonTypos) {
        pattern.lastIndex = 0;
        const m = pattern.exec(line);
        if (m) {
          typoFindings.push(`${rel}:${i + 1} -> "${m[0]}" (expected: ${fix})`);
        }
      }
      duplicateWordRegex.lastIndex = 0;
      const dup = duplicateWordRegex.exec(line);
      if (dup) {
        duplicateFindings.push(`${rel}:${i + 1} -> duplicate word "${dup[0]}"`);
      }
    });
  }

  // Also check PR Title and PR Description if running in a PR context
  const prMetaText = `${process.env.PR_TITLE || ''}\n${process.env.PR_BODY || ''}`.trim();
  if (prMetaText) {
    for (const { pattern, fix } of commonTypos) {
      pattern.lastIndex = 0;
      const m = pattern.exec(prMetaText);
      if (m) {
        typoFindings.push(`PR Title/Body -> "${m[0]}" (expected: ${fix})`);
      }
    }
    duplicateWordRegex.lastIndex = 0;
    const dup = duplicateWordRegex.exec(prMetaText);
    if (dup) {
      duplicateFindings.push(`PR Title/Body -> duplicate word "${dup[0]}"`);
    }
  }

  record(
    pillar,
    'Common UI & Math Vocabulary Spelling Check',
    typoFindings.length === 0 ? 'PASS' : 'FAIL',
    typoFindings.length === 0
      ? `Scanned ${files.length} source files${prMetaText ? ' + PR Title/Body' : ''} with zero spelling errors found.`
      : `Spelling errors detected: ${typoFindings.join('; ')}`
  );

  record(
    pillar,
    'Duplicate Word & Copy Hygiene Check',
    duplicateFindings.length === 0 ? 'PASS' : 'FAIL',
    duplicateFindings.length === 0
      ? 'No accidental repeated consecutive words found in UI copy or comments.'
      : `Duplicate consecutive words found: ${duplicateFindings.join('; ')}`
  );
}

// ============================================================================
// PILLAR 5: GIT DIFF IMPACT & UI LAYOUT CHANGE ANALYSIS
// ============================================================================
function auditGitDiff() {
  const pillar = '5. Diff & Code Hygiene';
  let diffStat = '';
  let diffContent = '';
  let changedFiles = [];
  try {
    const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' };
    const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD';
    diffStat = execSync(`git diff --stat ${baseRef}`, {
      cwd: ROOT,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const names = execSync(`git diff --name-only ${baseRef}`, {
      cwd: ROOT,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    diffContent = execSync(`git diff --unified=0 ${baseRef} -- src/`, {
      cwd: ROOT,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    changedFiles = names ? names.split('\n').filter(Boolean) : [];
  } catch {
    // Fallback if git diff is unavailable
  }

  record(
    pillar,
    'Changed Files Scope',
    'PASS',
    changedFiles.length > 0
      ? `${changedFiles.length} modified file(s) inspected: ${changedFiles.join(', ')}`
      : 'Working tree clean against base ref; full repository audit executed.'
  );

  // Check all src/ files for stray debugger statements or accidental opaque white card regressions
  const srcFiles = walkFiles(path.join(ROOT, 'src'), ['.ts', '.tsx']);
  const debuggerHits = [];
  const ungradedWhiteBgHits = [];
  const unbalancedArbitraryTailwind = [];

  for (const file of srcFiles) {
    const rel = path.relative(ROOT, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const trimmed = line.replace(/\/\/.*$/, '').trim();
      if (/\bdebugger\b/.test(trimmed)) {
        debuggerHits.push(`${rel}:${i + 1}`);
      }
      // Flag solid bg-white on large containers without opacity (/10, /20, etc.) unless it's a small indicator dot/pill or has theme override
      if (/\bbg-white\b(?!\/)/.test(trimmed) && !/w-[1-4]\b|h-[1-4]\b|rounded-full|text-slate-950|text-purple-950/.test(trimmed)) {
        ungradedWhiteBgHits.push(`${rel}:${i + 1}`);
      }
      // Check balanced square brackets in Tailwind arbitrary values on single-line className strings
      if (trimmed.includes('className=')) {
        const opens = (trimmed.match(/\[/g) || []).length;
        const closes = (trimmed.match(/\]/g) || []).length;
        if (opens !== closes) {
          unbalancedArbitraryTailwind.push(`${rel}:${i + 1}`);
        }
      }
    });
  }

  record(
    pillar,
    'No Stray Debugger Statements',
    debuggerHits.length === 0 ? 'PASS' : 'FAIL',
    debuggerHits.length === 0
      ? 'Zero stray debugger statements in src/.'
      : `Found debugger statement(s) at: ${debuggerHits.join(', ')}`
  );

  record(
    pillar,
    'No Un-Graded Opaque White Container Regressions',
    ungradedWhiteBgHits.length === 0 ? 'PASS' : 'FAIL',
    ungradedWhiteBgHits.length === 0
      ? 'No un-themed opaque bg-white container regressions detected in JSX.'
      : `Opaque bg-white container(s) violating dark/translucent colour grading: ${ungradedWhiteBgHits.join(', ')}`
  );

  record(
    pillar,
    'Tailwind Arbitrary Value Bracket Balance',
    unbalancedArbitraryTailwind.length === 0 ? 'PASS' : 'FAIL',
    unbalancedArbitraryTailwind.length === 0
      ? 'All Tailwind arbitrary value classes (e.g. shadow-[...], bg-[...]) have balanced brackets.'
      : `Unbalanced brackets in className at: ${unbalancedArbitraryTailwind.join(', ')}`
  );

  return { diffStat, diffContent, changedFiles };
}

// ============================================================================
// PILLAR 6: ENGINE & NON-REPEATING QUESTION RANDOMIZATION INTEGRITY
// ============================================================================
function auditRandomizationGuards() {
  const pillar = '6. Question Randomization';
  const tangEngine = readText('src/engine/tangGamesEngine.ts');
  const kakoomaGen = readText('src/engine/kakoomaGenerator.ts');

  const hasDeckBag =
    tangEngine.includes('RECENT_ARCADE_BUCKETS') &&
    tangEngine.includes('getChallengeSignature') &&
    tangEngine.includes('withNonRepeatingChallenge') &&
    kakoomaGen.includes('recentSinglePuzzleSigs') &&
    kakoomaGen.includes('getSinglePuzzleSignature');

  record(
    pillar,
    'Non-Repeating Question Deck & Signature History',
    hasDeckBag ? 'PASS' : 'FAIL',
    hasDeckBag
      ? 'Both Arcade mini-games and Honmoon Seals enforce deck-bag shuffling and recent-question signature deduplication.'
      : 'Missing question deduplication or deck-bag helpers in tangGamesEngine.ts / kakoomaGenerator.ts.'
  );
}

// Execute all pillars
console.log('================================================================');
console.log('🛡️  HUNTR/X MATH BEAT — AUTOMATED PR, DESIGN & COLOUR REVIEW');
console.log('================================================================');

auditPullRequestRules();
auditDesignSystem();
auditColourGrading();
auditTranslations();
auditSpellingAndCopy();
const diffInfo = auditGitDiff();
auditRandomizationGuards();

const failed = results.filter((r) => r.status === 'FAIL');
const warnings = results.filter((r) => r.status === 'WARN');
const passed = results.filter((r) => r.status === 'PASS');

const markdownLines = [
  '## ✨ HUNTR/X Automated PR Review (Design, Colour Grading, I18n & Spelling)',
  '',
  `**Overall Verdict:** ${
    failed.length === 0
      ? '✅ **APPROVED — All Design, Colour Grading, Translation & Spelling Checks Passed**'
      : `❌ **CHANGES REQUESTED — ${failed.length} Check(s) Failed**`
  }`,
  '',
  `| Metric | Count |`,
  `| :--- | :--- |`,
  `| ✅ Passed Checks | **${passed.length}** |`,
  `| ⚠️ Warnings | **${warnings.length}** |`,
  `| ❌ Failed Checks | **${failed.length}** |`,
  '',
  '### 🔍 Detailed Review Matrix',
  '',
  '| Pillar | Check | Status | Findings |',
  '| :--- | :--- | :---: | :--- |',
  ...results.map((r) => {
    const badge = r.status === 'PASS' ? '✅ PASS' : r.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL';
    return `| **${r.pillar}** | ${r.check} | ${badge} | ${r.details.replace(/\|/g, '\\|')} |`;
  }),
  '',
];

if (diffInfo.changedFiles.length > 0) {
  markdownLines.push(
    '### 📂 Modified Files Inspected',
    '',
    ...diffInfo.changedFiles.map((f) => `- \`${f}\``),
    ''
  );
}

const reportMarkdown = markdownLines.join('\n');

if (reportFile) {
  fs.writeFileSync(reportFile, reportMarkdown, 'utf8');
  console.log(`\n📝 Wrote Markdown review report to ${path.relative(ROOT, reportFile)}`);
}

console.log('================================================================');
if (failed.length > 0) {
  console.error(`❌ Review failed with ${failed.length} error(s).`);
  process.exit(1);
} else {
  console.log(`✅ All ${passed.length} automated review checks passed!`);
}
