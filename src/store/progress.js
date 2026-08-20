// 진도 저장. localStorage 접근을 이 파일 하나에 가둬둔다.
// 나중에 백엔드를 붙이게 되면 여기만 갈아끼우면 되도록.

const KEY = 'tichu-trainer:progress';
const THEME_KEY = 'tichu-trainer:theme';
const VERSION = 1;

function emptyState() {
  return { version: VERSION, chapters: {} };
}

/** localStorage는 사생활 보호 모드 등에서 던질 수 있으므로 항상 감싼다. */
function safeRead(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장이 안 되면 이번 세션 동안만 기억한다. 학습 자체는 계속할 수 있다.
  }
}

let state = load();

function load() {
  const raw = safeRead(KEY);
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== VERSION) return emptyState();
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function save() {
  safeWrite(KEY, JSON.stringify(state));
}

function chapterEntry(chapterId) {
  if (!state.chapters[chapterId]) {
    state.chapters[chapterId] = { read: false, quizzes: {}, minigames: {} };
  }
  return state.chapters[chapterId];
}

export function markRead(chapterId) {
  const entry = chapterEntry(chapterId);
  if (entry.read) return;
  entry.read = true;
  save();
}

/** 맞힌 퀴즈. 오답은 남기지 않는다 — 진도는 '몇 개를 풀어냈나'만 센다. */
export function recordQuiz(chapterId, quizId) {
  const entry = chapterEntry(chapterId);
  if (entry.quizzes[quizId] === 'correct') return;
  entry.quizzes[quizId] = 'correct';
  save();
}

export function recordMinigame(chapterId, minigameId) {
  const entry = chapterEntry(chapterId);
  if (entry.minigames[minigameId] === 'cleared') return;
  entry.minigames[minigameId] = 'cleared';
  save();
}

export function isMinigameCleared(chapterId, minigameId) {
  return state.chapters[chapterId]?.minigames?.[minigameId] === 'cleared';
}

/**
 * 한 챕터의 진행 상황.
 * @param chapter chapters.js 의 챕터 정의 (퀴즈·미니판 개수를 알기 위해)
 */
export function chapterStatus(chapter) {
  const entry = state.chapters[chapter.id] ?? { read: false, quizzes: {}, minigames: {} };
  const quizTotal = chapter.quizCount ?? 0;
  const quizDone = Object.values(entry.quizzes).filter((v) => v === 'correct').length;
  const minigameTotal = chapter.minigames?.length ?? 0;
  const minigameDone = Object.values(entry.minigames).filter((v) => v === 'cleared').length;

  const steps = 1 + quizTotal + minigameTotal;
  const done = (entry.read ? 1 : 0) + Math.min(quizDone, quizTotal) + Math.min(minigameDone, minigameTotal);

  return {
    read: entry.read,
    quizDone: Math.min(quizDone, quizTotal),
    quizTotal,
    minigameDone: Math.min(minigameDone, minigameTotal),
    minigameTotal,
    ratio: steps === 0 ? 0 : done / steps,
    complete: done >= steps,
  };
}

/** 전체 진도 비율. */
export function overallProgress(chapters) {
  if (!chapters.length) return 0;
  const sum = chapters.reduce((total, ch) => total + chapterStatus(ch).ratio, 0);
  return sum / chapters.length;
}

export function resetProgress() {
  state = emptyState();
  save();
}

// --- 테마 -------------------------------------------------------------

export function getTheme() {
  return safeRead(THEME_KEY);
}

export function setTheme(theme) {
  if (theme) {
    safeWrite(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
  } else {
    try { localStorage.removeItem(THEME_KEY); } catch { /* 무시 */ }
    delete document.documentElement.dataset.theme;
  }
}

/** 시스템 설정을 고려한 지금의 실제 테마. */
export function effectiveTheme() {
  const stored = getTheme();
  if (stored) return stored;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
