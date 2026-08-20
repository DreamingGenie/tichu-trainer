import { route, setNotFound, startRouter } from './router.js';
import { effectiveTheme, setTheme } from './store/progress.js';
import { homeView } from './views/home-view.js';
import { lessonView } from './views/lesson-view.js';
import { minigameIndexView, minigameView } from './views/minigame-view.js';
import { notFoundPanel } from './views/not-found-view.js';
import { quizView } from './views/quiz-view.js';
import { sandboxView } from './views/sandbox-view.js';

// --- 테마 토글 ---

// 해와 달. 페이지 이동 버튼(글자)과 테마 토글(아이콘)이 한 줄에 나란히 서 있어서,
// 생김새가 다르지 않으면 누르기 전에는 무엇이 다른지 알 수 없다.
const SUN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" aria-hidden="true">
  <circle cx="12" cy="12" r="4.2"/>
  <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
</svg>`;
const MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z"/>
</svg>`;

function setupTheme() {
  const button = document.getElementById('theme-toggle');
  const apply = (theme) => {
    setTheme(theme);
    // 아이콘만 있는 버튼이라 이름은 aria-label 이 전부다. 지금 상태가 아니라
    // 누르면 무엇이 되는지를 적는다.
    const goingDark = theme !== 'dark';
    button.innerHTML = goingDark ? MOON : SUN;
    button.setAttribute('aria-label', goingDark ? '어두운 테마로 바꾸기' : '밝은 테마로 바꾸기');
    button.setAttribute('title', goingDark ? '어두운 테마' : '밝은 테마');
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
