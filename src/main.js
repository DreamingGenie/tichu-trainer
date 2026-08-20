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
    // 접근 이름은 보이는 글자를 그대로 품어야 한다. 음성 제어 사용자가 화면에 보이는
    // "다크"라고 말했는데 이름이 "어두운 테마로 바꾸기"면 그 버튼을 못 누른다.
    const label = theme === 'dark' ? '라이트' : '다크';
    button.textContent = label;
    button.setAttribute('aria-label', `${label} 테마로 바꾸기`);
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
