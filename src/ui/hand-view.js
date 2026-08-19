// 손패에서 카드를 골라 제출하는 UI. 샌드박스·퀴즈·미니판이 전부 이걸 쓴다.
// 실제 게임과 같은 동작(카드를 집어서 낸다)을 그대로 시키는 게 학습 목적에 맞다.

import { sortCards } from '../engine/cards.js';
import { playableCardIds } from '../engine/legal.js';
import { cardElement } from './card-view.js';

/**
 * @param options.cards     손패
 * @param options.current   테이블 위 조합 (있으면 낼 수 없는 카드를 흐리게)
 * @param options.wish      소원 랭크 (해당 카드에 표시를 붙인다)
 * @param options.dimUnplayable 낼 수 없는 카드를 흐리게 할지. 기본 true
 * @param options.onChange  선택이 바뀔 때 호출
 */
export function createHandView(options = {}) {
  const state = {
    cards: sortCards(options.cards || []),
    current: options.current ?? null,
    wish: options.wish ?? null,
    dimUnplayable: options.dimUnplayable !== false,
    selected: new Set(),
  };

  const element = document.createElement('div');
  element.className = 'card-row card-row--overlap hand';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', '내 손패');

  function selectedCards() {
    return state.cards.filter((card) => state.selected.has(card.id));
  }

  function toggle(cardId) {
    if (state.selected.has(cardId)) state.selected.delete(cardId);
    else state.selected.add(cardId);
    render();
    options.onChange?.(selectedCards());
  }

  function render() {
    const playable = state.dimUnplayable ? playableCardIds(state.cards, state.current) : null;
    const nodes = state.cards.map((card) => {
      const node = cardElement(card, {
        selectable: true,
        selected: state.selected.has(card.id),
        muted: playable ? !playable.has(card.id) && !state.selected.has(card.id) : false,
        tag: state.wish && card.suit !== null && card.rank === state.wish ? '소원' : null,
      });
      node.addEventListener('click', () => toggle(card.id));
      return node;
    });
    element.replaceChildren(...nodes);
  }

  render();

  return {
    element,
    getSelected: selectedCards,
    clear() {
      state.selected.clear();
      render();
      options.onChange?.([]);
    },
    /** 낸 카드를 손패에서 빼고 다시 그린다. */
    setCards(cards) {
      state.cards = sortCards(cards);
      state.selected = new Set([...state.selected].filter((id) => state.cards.some((c) => c.id === id)));
      render();
    },
    setCurrent(current) {
      state.current = current ?? null;
      render();
    },
    setWish(wish) {
      state.wish = wish ?? null;
      render();
    },
  };
}
