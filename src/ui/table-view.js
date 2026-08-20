// 네 자리와 테이블 가운데를 그린다. 미니판에서 지금 누구 차례이고 무엇이 깔렸는지
// 한눈에 보이는 게 제일 중요하다.

import { rankLabel, sumPoints } from '../engine/cards.js';
import { CALL_LABEL } from '../engine/scoring.js';
import { SEAT, SEAT_LABEL } from '../engine/seats.js';
import { cardElement } from './card-view.js';
import { describeCombo } from '../engine/describe.js';
import { element } from './dom.js';

function seatBox(state, seat) {
  const box = element('div', `seat seat--${seat}`);
  const count = state.hands[seat].length;
  const isOut = count === 0;

  box.classList.toggle('is-turn', state.turn === seat && !state.done);
  box.classList.toggle('is-out', isOut);

  box.append(element('div', 'seat__name', SEAT_LABEL[seat]));

  if (isOut) {
    const place = state.finishOrder.indexOf(seat);
    box.append(element('div', 'seat__meta', place >= 0 ? `${place + 1}등으로 나감` : '손패 없음'));
  } else {
    const mini = element('div', 'mini-cards');
    for (let i = 0; i < count; i += 1) mini.append(element('span', 'mini-card'));
    box.append(mini);
    box.append(element('div', 'seat__meta', `${count}장`));
  }

  const points = sumPoints(state.tricks[seat]);
  const tags = element('div', 'row');
  if (state.calls?.[seat]) tags.append(element('span', 'badge badge--warn', CALL_LABEL[state.calls[seat]]));
  if (points !== 0) tags.append(element('span', 'badge', `${points}점`));
  if (tags.children.length) box.append(tags);

  return box;
}

/** 테이블 전체. 남쪽(나)의 실제 손패는 이 밑에 따로 붙는다. */
export function renderTable(state) {
  const felt = element('div', 'felt');
  const seats = element('div', 'seats');

  for (const seat of [SEAT.NORTH, SEAT.WEST, SEAT.EAST, SEAT.SOUTH]) {
    seats.append(seatBox(state, seat));
  }

  const center = element('div', 'table-center');
  const drop = element('div', 'table-drop');

  if (state.current && state.current.cards) {
    const row = element('div', 'card-row');
    for (const card of state.current.cards) row.append(cardElement(card));
    drop.append(row);
  } else {
    drop.append(element('div', 'table-drop__empty', '테이블이 비어 있습니다'));
  }
  center.append(drop);

  const meta = element('div', 'row');
  if (state.current) meta.append(element('span', 'badge badge--accent', describeCombo(state.current)));
  const pilePoints = sumPoints(state.pile);
  if (pilePoints !== 0) meta.append(element('span', 'badge badge--warn', `무더기 ${pilePoints}점`));
  if (state.wish) meta.append(element('span', 'badge badge--bad', `소원 ${rankLabel(state.wish)}`));
  if (meta.children.length) center.append(meta);

  seats.append(center);
  felt.append(seats);
  return felt;
}

/** 진행 기록. 무슨 일이 있었는지 되짚을 수 있어야 미니판이 학습이 된다. */
export function renderLog(state) {
  const log = element('div', 'log');
  const entries = state.log.slice(-14);
  if (!entries.length) {
    log.append(element('div', 'log__item muted', '아직 아무도 카드를 내지 않았습니다.'));
    return log;
  }
  for (const entry of entries) {
    const item = element('div', 'log__item');
    if (entry.action === 'trick' || entry.action === 'end') item.classList.add('is-highlight');
    item.append(element('span', null, entry.label));
    if (entry.cards?.length) {
      item.append(element('span', 'small muted', ` ${entry.cards.map((c) => c.name).join(', ')}`));
    }
    log.append(item);
  }
  log.scrollTop = log.scrollHeight;
  return log;
}
