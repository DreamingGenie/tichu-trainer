import { SPECIAL } from '../../engine/cards.js';
import { CALL } from '../../engine/scoring.js';
import { SEAT } from '../../engine/seats.js';

const hasDragon = (cards) => cards.some((card) => card.special === SPECIAL.DRAGON);

export default {
  id: 'dragon-and-dog',
  chapterId: 'specials',
  title: '용으로 잡고, 개로 넘기기',
  goal: '용으로 트릭을 잡되 무더기는 티츄를 선언한 상대를 피해서 주고, 개로 파트너에게 선을 넘기세요.',

  intro: '**오른쪽 상대가 티츄를 선언했습니다.** 지금 테이블에는 10이 깔려 있고, 내 손에는 용과 개가 있습니다. '
    + '용을 쓰면 확실히 선을 잡을 수 있지만, 딴 무더기는 상대 팀 중 한 명에게 줘야 합니다.',

  hands: {
    [SEAT.SOUTH]: 'DRG DOG G3',
    [SEAT.EAST]: 'BK B4 B2',
    [SEAT.NORTH]: 'U9 U2 U5',
    [SEAT.WEST]: 'R10 R5 R6',
  },
  startingSeat: SEAT.EAST,
  calls: { [SEAT.EAST]: CALL.TICHU },

  script: [
    { seat: SEAT.EAST, cards: 'B4' },
    { seat: SEAT.NORTH, cards: 'U9' },
    { seat: SEAT.WEST, cards: 'R10' },
  ],

  hints: [
    {
      when: (state) => state.pendingDragon != null,
      text: '오른쪽 상대는 티츄를 선언했습니다. 여기에 점수를 보태주면 상대의 100점을 도와주는 셈입니다.',
    },
    {
      when: (state) => state.turn === SEAT.SOUTH && !state.current && state.tricks[SEAT.WEST].length > 0,
      text: '선을 잡았습니다. 이제 개를 내면 파트너가 선을 이어받습니다.',
    },
  ],

  successWhen: (state) => hasDragon(state.tricks[SEAT.WEST])
    && state.log.some((entry) => entry.action === 'dog'),
  failWhen: (state) => hasDragon(state.tricks[SEAT.EAST]),

  successText: '티츄를 선언한 오른쪽 상대를 피해 왼쪽 상대에게 무더기를 넘겼고, 개로 선까지 파트너에게 돌려줬습니다.',
  failText: '티츄를 선언한 상대에게 용 무더기를 줬습니다. 상대가 노리던 점수를 그대로 보태준 셈입니다.',

  debrief: '용은 **가장 센 카드이면서 가장 비싼 카드**입니다. 무더기를 넘겨야 하니 용의 25점까지 상대에게 갑니다. '
    + '그래도 쓰는 이유는 **선이 확실히 오기 때문**입니다. 그리고 그 선은 [[DOG]]으로 파트너에게 넘길 수 있습니다. '
    + '이 두 장은 따로 보면 애매하지만 같이 쓰면 강력한 조합입니다.',
};
