// 자리와 팀.
//
// 진행 방향은 반시계 (공식 룰의 "오른쪽으로"). 화면에서 아래에 앉은 내가 남쪽이고,
// 내 오른쪽에 앉은 상대가 화면 오른쪽에 보인다. 파트너는 항상 맞은편이다.
//   남(나) → 동(오른쪽 상대) → 북(파트너) → 서(왼쪽 상대) → 다시 남

export const SEAT = Object.freeze({
  SOUTH: 'south',
  EAST: 'east',
  NORTH: 'north',
  WEST: 'west',
});

export const SEAT_ORDER = Object.freeze([SEAT.SOUTH, SEAT.EAST, SEAT.NORTH, SEAT.WEST]);

export const SEAT_LABEL = Object.freeze({
  [SEAT.SOUTH]: '나',
  [SEAT.EAST]: '오른쪽 상대',
  [SEAT.NORTH]: '파트너',
  [SEAT.WEST]: '왼쪽 상대',
});

export const TEAM = Object.freeze({ US: 'us', THEM: 'them' });

export const TEAM_LABEL = Object.freeze({
  [TEAM.US]: '우리 팀',
  [TEAM.THEM]: '상대 팀',
});

const TEAM_BY_SEAT = Object.freeze({
  [SEAT.SOUTH]: TEAM.US,
  [SEAT.NORTH]: TEAM.US,
  [SEAT.EAST]: TEAM.THEM,
  [SEAT.WEST]: TEAM.THEM,
});

export function teamOf(seat) {
  return TEAM_BY_SEAT[seat];
}

export function partnerOf(seat) {
  const i = SEAT_ORDER.indexOf(seat);
  return SEAT_ORDER[(i + 2) % 4];
}

export function nextSeat(seat) {
  const i = SEAT_ORDER.indexOf(seat);
  return SEAT_ORDER[(i + 1) % 4];
}

export function opponentsOf(seat) {
  return SEAT_ORDER.filter((s) => teamOf(s) !== teamOf(seat));
}

export function arePartners(a, b) {
  return a !== b && teamOf(a) === teamOf(b);
}
