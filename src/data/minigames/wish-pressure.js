import { SEAT } from '../../engine/seats.js';

export default {
  id: 'wish-pressure',
  chapterId: 'specials',
  title: '소원에 묶이면',
  goal: '소원 규칙대로 처리해서 트릭을 넘기세요.',

  intro: '오른쪽 상대가 참새를 내면서 **K를 소원**했습니다. 지금 테이블에는 8이 깔려 있고, '
    + '내 손에는 K도 있고 A도 있습니다. A가 더 세니 A로 확실히 잡고 싶은 마음이 들지만…',

  hands: {
    [SEAT.SOUTH]: 'GA GK G3',
    [SEAT.EAST]: 'MAH B4 B2',
    [SEAT.NORTH]: 'U6 U7 U4',
    [SEAT.WEST]: 'R8 R9 R5',
  },
  startingSeat: SEAT.EAST,
  wish: 13,

  script: [
    { seat: SEAT.EAST, cards: 'MAH' },
    { seat: SEAT.NORTH, cards: 'U6' },
    { seat: SEAT.WEST, cards: 'R8' },
  ],

  hints: [
    {
      when: (state) => state.turn === SEAT.SOUTH && state.wish === 13,
      text: 'K를 포함해서 낼 수 있는 방법이 하나라도 있으면 반드시 그렇게 내야 합니다. 패스도 안 됩니다.',
    },
  ],

  successWhen: (state) => state.wish === null,
  failWhen: () => false, // 규칙이 막아주므로 실패할 방법이 없다. 직접 부딪혀 보는 게 목적이다.

  successText: 'K를 내며 소원을 풀었습니다. A는 아직 손에 남아 있습니다.',

  debrief: '소원은 **강제**입니다. 더 좋은 수가 보여도 그 랭크를 낼 수 있으면 그걸 내야 하고, 패스도 못 합니다. '
    + '그래서 참새의 소원은 상대의 계획을 흔드는 무기가 됩니다. 다만 [[PHX]]은 소원을 이행하지 못하고, '
    + '차례가 아닐 때 터뜨리는 폭탄은 의무에서 면제된다는 두 가지 예외가 있습니다.',
};
