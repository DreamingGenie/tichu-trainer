import { route, setNotFound, startRouter } from './router.js';
import { effectiveTheme, setTheme } from './store/progress.js';
import { createSandbox } from './ui/sandbox.js';
import { element } from './ui/dom.js';
import { homeView } from './views/home-view.js';
import { lessonView, notFoundPanel } from './views/lesson-view.js';
import { minigameIndexView, minigameView } from './views/minigame-view.js';
import { quizView } from './views/quiz-view.js';

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

function sandboxView() {
  const root = element('div', 'stack stack--loose');
  const header = element('header', 'stack stack--tight');
  header.append(element('h1', null, '조합 판정 샌드박스'));
  header.append(element('p', 'lede',
    '규칙이 헷갈릴 때 여기서 직접 확인해보세요. 카드를 고르면 무슨 조합인지, '
    + '테이블에 깔린 걸 이기는지 바로 알려줍니다.'));
  root.append(header);

  const panel = element('div', 'panel');
  panel.append(createSandbox());
  root.append(panel);
  return root;
}

route('/', homeView);
route('/chapter/:id', lessonView);
route('/quiz/:id', quizView);
route('/minigame', minigameIndexView);
route('/minigame/:id', minigameView);
route('/sandbox', sandboxView);
setNotFound(({ path }) => notFoundPanel(`"${path}" 라는 주소는 없습니다.`));

setupTheme();
startRouter(document.getElementById('app'));
