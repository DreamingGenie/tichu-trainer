// 해시 라우팅. 빌드 도구도 서버 설정도 없이 새로고침이 되고, 나중에 정적 호스팅에
// 그대로 올려도 404가 나지 않는다.

const routes = [];
let notFound = null;

/**
 * @param pattern '/chapter/:id' 처럼 :파라미터를 쓸 수 있다.
 * @param handler ({params}) => HTMLElement
 */
export function route(pattern, handler) {
  const keys = [];
  const regex = new RegExp(
    '^' + pattern.replace(/:([\w]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    }) + '$',
  );
  routes.push({ regex, keys, handler });
}

export function setNotFound(handler) {
  notFound = handler;
}

export function currentPath() {
  const hash = location.hash.replace(/^#/, '');
  return hash || '/';
}

export function navigate(path, options = {}) {
  if (options.replace) {
    location.replace(`#${path}`);
  } else {
    location.hash = path;
  }
}

function match(path) {
  for (const { regex, keys, handler } of routes) {
    const found = path.match(regex);
    if (!found) continue;
    const params = {};
    keys.forEach((key, i) => { params[key] = decodeURIComponent(found[i + 1]); });
    return { handler, params };
  }
  return null;
}

/** 라우팅을 시작한다. outlet 안이 화면마다 통째로 교체된다. */
export function startRouter(outlet) {
  const render = () => {
    const path = currentPath();
    const found = match(path);
    const view = found ? found.handler({ params: found.params, path }) : notFound?.({ path });

    outlet.replaceChildren(view ?? document.createTextNode(''));

    // 화면이 바뀌면 맨 위에서 시작하고, 키보드 포커스도 새 화면으로 옮긴다.
    window.scrollTo({ top: 0, behavior: 'instant' });
    const heading = outlet.querySelector('h1, h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  };

  addEventListener('hashchange', render);
  render();
}
