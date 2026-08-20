// DOM 요소를 만드는 최소 헬퍼. 이 프로젝트에는 템플릿 엔진이 없고 마크업을
// 전부 JS 에서 만들기 때문에, 거의 모든 뷰가 이 함수 하나로 시작한다.

/** 텍스트를 담은 요소. text 는 textContent 로 들어가므로 이스케이프가 필요 없다. */
export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
