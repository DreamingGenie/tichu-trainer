import { sumPoints } from '../../engine/cards.js';
import { SEAT } from '../../engine/seats.js';

export default {
  id: 'trick-basics',
  chapterId: 'trick',
  title: '파트너의 트릭을 지켜주기',
  goal: '이 트릭을 파트너가 가져가게 하세요.',

  intro: '오른쪽 상대가 10을 냈고, 파트너가 K로 덮었습니다. 왼쪽 상대는 낼 게 없어 패스했습니다. '
    + '무더기에는 이미 20점이 쌓였고, 내 손에는 이걸 덮을 수 있는 A가 있습니다.',

  hands: {
    [SEAT.SOUTH]: 'GA G4 G3',
    [SEAT.EAST]: 'B10 B6 B2',
    [SEAT.NORTH]: 'UK U7 U5',
    [SEAT.WEST]: 'R8 R2 R4',
  },
  startingSeat: SEAT.EAST,

  script: [
    { seat: SEAT.EAST, cards: 'B10' },
    { seat: SEAT.NORTH, cards: 'UK' },
    { seat: SEAT.WEST, action: 'pass' },
  ],

  hints: [
    {
      when: (state) => state.turn === SEAT.SOUTH && state.currentOwner === SEAT.NORTH,
      text: '지금 트릭을 잡고 있는 건 파트너입니다. 이 무더기는 이미 우리 팀 것입니다.',
    },
  ],

  successWhen: (state) => state.tricks[SEAT.NORTH].length > 0,
  failWhen: (state) => state.tricks[SEAT.SOUTH].length > 0,

  successText: (state) => `파트너가 ${sumPoints(state.tricks[SEAT.NORTH])}점짜리 무더기를 가져갔습니다.`,
  failText: 'A로 덮어서 내가 무더기를 가져왔습니다. 점수는 어차피 우리 팀이지만, 파트너에게서 선을 뺏었고 아까운 A를 상대가 아니라 파트너를 이기는 데 써버렸습니다.',

  debrief: '"덮을 수 있다"와 "덮어야 한다"는 다릅니다. 상대 둘이 모두 패스한 뒤라면 그 트릭은 이미 끝난 것이고, '
    + '거기에 높은 카드를 얹는 건 순수한 손해입니다. 카드를 내기 전에 **지금 잡고 있는 게 누구인지**부터 보세요.',
};
