// 네 자리와 테이블 가운데를 그린다. 미니판에서 지금 누구 차례이고 무엇이 깔렸는지
// 한눈에 보이는 게 제일 중요하다.

import { rankLabel, sumPoints } from '../../engine/cards.js';
import { CALL_LABEL } from '../../engine/scoring.js';
import { SEAT, SEAT_LABEL } from '../../engine/seats.js';
import { cardElement } from '../../ui/card-view.js';
import { describeCombo } from '../../engine/describe.js';
import { element } from '../../ui/dom.js';

/** 자리에 앉은 사람. 단순한 평면 도형이라 작게 줄여도 뭉개지지 않는다. */
function avatarSvg() {
  return `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M4 64 C4 49 16 42 32 42 C48 42 60 49 60 64 Z" fill="#f6f3ea" stroke="#d5cfc0" stroke-width="1.5"/>
      <path d="M26 40 h12 v6 a6 6 0 0 1 -12 0 Z" fill="#e8c8a2"/>
      <circle cx="32" cy="24" r="16" fill="#eecfa8"/>
      <path d="M16 24 a16 16 0 0 1 32 0 a16 13 0 0 0 -32 0 Z" fill="#e3bf94"/>
      <ellipse cx="15.5" cy="26" rx="3" ry="4" fill="#eecfa8"/>
      <ellipse cx="48.5" cy="26" rx="3" ry="4" fill="#eecfa8"/>
      <g stroke="#4a3b2c" stroke-width="2" stroke-linecap="round" fill="none">
        <path d="M24 24 q3.5 3 7 0"/>
        <path d="M33 24 q3.5 3 7 0"/>
        <path d="M28 32 q4 3.5 8 0"/>
      </g>
    </svg>`;
}

/** 남의 손패. 실제로 든 것처럼 부채꼴로 편다. */
function fan(count) {
  const wrap = element('div', 'fan-wrap');
  const inner = element('div', 'fan');
  const shown = Math.min(count, 14);
  // 장수가 많아질수록 한 장당 각도를 줄여 부채가 지나치게 벌어지지 않게 한다.
  inner.style.setProperty('--n', String(shown));
  inner.style.setProperty('--fan-step', `${Math.min(6, 62 / Math.max(shown, 1))}deg`);
  // 회전은 레이아웃 크기를 안 바꾸므로 감싸는 칸을 손으로 잡아 준다. 14장 기준으로
  // 고정해 두면 3장 남은 자리도 200px 을 차지해 판이 쓸데없이 길어진다.
  wrap.style.setProperty('--fan-n', String(shown));
  for (let i = 0; i < shown; i += 1) {
    const card = element('span', 'fan__card');
    card.style.setProperty('--i', String(i));
    inner.append(card);
  }
  wrap.append(inner);
  return wrap;
}

function seatBox(state, seat) {
  const box = element('div', `seat seat--${seat}`);
  const count = state.hands[seat].length;
  const isOut = count === 0;

  box.classList.toggle('is-turn', state.turn === seat && !state.done);
  box.classList.toggle('is-out', isOut);

  const person = element('div', 'seat__person');
  const avatar = element('div', 'seat__avatar');
  avatar.innerHTML = avatarSvg();
  person.append(avatar);
  person.append(element('div', 'seat__name', SEAT_LABEL[seat]));

  if (isOut) {
    const place = state.finishOrder.indexOf(seat);
    person.append(element('div', 'seat__count', place >= 0 ? `${place + 1}등` : '없음'));
  } else {
    // 남쪽은 나다. 진짜 손패가 펠트 아래에 따로 붙으므로 부채는 그리지 않는다.
    if (seat !== SEAT.SOUTH) box.append(fan(count));
    person.append(element('div', 'seat__count', `${count}장`));
  }

  if (state.turn === seat && !state.done) {
    person.append(element('div', 'seat__turn', '차례'));
  }

  const points = sumPoints(state.tricks[seat]);
  const tags = element('div', 'row');
  if (state.calls?.[seat]) tags.append(element('span', 'badge badge--warn', CALL_LABEL[state.calls[seat]]));
  if (points !== 0) tags.append(element('span', 'badge', `${points}점`));
  if (tags.children.length) person.append(tags);

  box.append(person);
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

  // 무엇이 깔렸는지를 카드 바로 위에 붙여 둔다. 실제 앱이 그렇고,
  // 카드와 설명이 떨어져 있으면 눈이 두 번 움직인다.
  if (state.current) {
    center.append(element('div', 'table-call', describeCombo(state.current)));
  }

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
