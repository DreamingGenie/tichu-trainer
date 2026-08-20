import { route, setNotFound, startRouter } from './router.js';
import { effectiveTheme, setTheme } from './store/progress.js';
import { homeView } from './views/home-view.js';
import { lessonView } from './views/lesson-view.js';
import { minigameIndexView, minigameView } from './views/minigame-view.js';
import { notFoundPanel } from './views/not-found-view.js';
import { quizView } from './views/quiz-view.js';
import { sandboxView } from './views/sandbox-view.js';

// --- 테마 토글 ---

function setupTheme() {
  const button = document.getElementById('theme-toggle');
  const apply = (theme) => {
    setTheme(theme);
    button.textContent = theme === 'dark' ? '라이트' : '다크';
    button.setAttribute('aria-label', `${theme === 'dark' ? '밝은' : '어두운'} 테마로 바꾸기`);
  };
  apply(effectiveTheme());
  button.addEventListener('click', () => {
    apply(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

// --- 라우트 ---

route('/', homeView);
route('/chapter/:id', lessonView);
route('/quiz/:id', quizView);
route('/minigame', minigameIndexView);
route('/minigame/:id', minigameView);
route('/sandbox', sandboxView);
setNotFound(({ path }) => notFoundPanel(`"${path}" 라는 주소는 없습니다.`));

setupTheme();
startRouter(document.getElementById('app'));
