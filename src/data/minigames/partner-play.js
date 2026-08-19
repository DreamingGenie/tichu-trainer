import { CALL } from '../../engine/scoring.js';
import { SEAT } from '../../engine/seats.js';

export default {
  id: 'partner-play',
  chapterId: 'partner',
  title: '파트너의 티츄를 지켜주기',
  goal: '파트너가 1등으로 손패를 털게 만드세요.',

  intro: '**파트너가 티츄를 선언했습니다.** 파트너가 9를 냈는데 왼쪽 상대가 J로 덮었습니다. '
    + '내 손에는 A와 개가 있습니다. 파트너를 1등으로 만들려면 두 번의 선택을 제대로 해야 합니다.',

  hands: {
    [SEAT.SOUTH]: 'GA DOG G2',
    [SEAT.NORTH]: 'UK U9',
    [SEAT.EAST]: 'BQ B7',
    [SEAT.WEST]: 'RJ R6',
  },
  startingSeat: SEAT.NORTH,
  calls: { [SEAT.NORTH]: CALL.TICHU },

  script: [
    { seat: SEAT.NORTH, cards: 'U9' },
    { seat: SEAT.WEST, cards: 'RJ' },
  ],

  hints: [
    {
      when: (state) => state.turn === SEAT.SOUTH && state.currentOwner === SEAT.WEST,
      text: '지금 잡고 있는 건 상대입니다. 이대로 두면 상대가 선을 가져가고 파트너의 티츄가 어려워집니다.',
    },
    {
      when: (state) => state.turn === SEAT.SOUTH && !state.current && state.tricks[SEAT.SOUTH].length > 0,
      text: '선을 잡았습니다. 그런데 파트너가 털어야 하는 상황이라, 이 선은 내가 아니라 파트너에게 있어야 합니다.',
    },
  ],

  successWhen: (state) => state.finishOrder[0] === SEAT.NORTH,
  failWhen: (state) => state.finishOrder.length > 0 && state.finishOrder[0] !== SEAT.NORTH,

  successText: '파트너가 1등으로 손패를 털었습니다. 티츄 성공으로 우리 팀에 100점이 들어옵니다.',
  failText: '파트너보다 다른 사람이 먼저 털었습니다. 파트너의 티츄는 −100점이 됩니다.',

  debrief: '파트너가 티츄를 선언하면 내 역할이 바뀝니다. **내가 이기는 게 아니라 파트너를 1등으로 만드는 것**이 목표가 됩니다. '
    + '상대가 파트너를 막으면 내가 높은 카드로 끊어주고, 끊은 뒤에는 [[DOG]]으로 선을 파트너에게 돌려줍니다. '
    + '개가 없었다면 내가 선을 잡은 채로 파트너의 흐름이 끊겼을 겁니다.',
};
