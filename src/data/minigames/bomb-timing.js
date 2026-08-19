import { sumPoints } from '../../engine/cards.js';
import { SEAT } from '../../engine/seats.js';

const stillHasBomb = (state) => state.hands[SEAT.SOUTH].filter((card) => card.rank === 7).length === 4;

export default {
  id: 'bomb-timing',
  chapterId: 'bombs',
  title: '폭탄은 언제 터뜨리나',
  goal: '폭탄을 아꼈다가 점수가 몰린 무더기를 가져오세요.',

  intro: '내 손에는 7 포카드 폭탄이 있습니다. 언제든 터뜨릴 수 있지만 한 번 쓰면 끝입니다. '
    + '기다릴수록 무더기가 커지지만, 너무 기다리다 기회를 놓칠 수도 있습니다.',

  hands: {
    [SEAT.SOUTH]: 'G7 B7 U7 R7 G2 G3',
    [SEAT.EAST]: 'B4 B10 B2',
    [SEAT.NORTH]: 'U6 UK U2',
    [SEAT.WEST]: 'RA R5 R3',
  },
  startingSeat: SEAT.EAST,

  script: [
    // 첫 트릭: 점수가 하나도 없다. 여기서 터뜨리면 낭비다.
    { seat: SEAT.EAST, cards: 'B4' },
    { seat: SEAT.NORTH, cards: 'U6' },
    { seat: SEAT.WEST, cards: 'RA' },
    // (내 차례 — 패스해야 한다)
    { seat: SEAT.EAST, action: 'pass' },
    { seat: SEAT.NORTH, action: 'pass' },
    // 왼쪽 상대가 트릭을 가져가고 5를 냅니다.
    { seat: SEAT.WEST, cards: 'R5' },
    // (내 차례 — 아직 5점뿐이다)
    { seat: SEAT.EAST, cards: 'B10' },
    { seat: SEAT.NORTH, cards: 'UK' },
    // (내 차례 — 이제 25점이 쌓였다)
  ],

  hints: [
    {
      when: (state) => state.turn === SEAT.SOUTH && stillHasBomb(state) && sumPoints(state.pile) === 0,
      text: '이 무더기에는 점수 카드가 한 장도 없습니다. 여기에 폭탄을 쓰면 0점을 위해 폭탄을 버리는 셈입니다.',
    },
    {
      when: (state) => state.turn === SEAT.SOUTH && stillHasBomb(state) && sumPoints(state.pile) >= 25,
      text: `무더기에 점수가 충분히 쌓였습니다. 지금이 그때입니다.`,
    },
  ],

  successWhen: (state) => sumPoints(state.tricks[SEAT.SOUTH]) >= 25,
  failWhen: (state) => !stillHasBomb(state) && sumPoints(state.tricks[SEAT.SOUTH]) < 25,

  successText: (state) => `25점짜리 무더기를 폭탄으로 가져왔습니다. (${sumPoints(state.tricks[SEAT.SOUTH])}점)`,
  failText: '폭탄을 너무 일찍 썼습니다. 그 무더기에는 점수가 거의 없었고, 정작 점수가 몰렸을 때는 쓸 폭탄이 남지 않았습니다.',

  debrief: '폭탄은 **종류도 장수도 차례도 무시**하지만, 한 번 쓰면 사라집니다. '
    + '그래서 "지금 이길 수 있나"가 아니라 **"지금 이길 값어치가 있나"**로 판단해야 합니다. '
    + '점수가 몰린 무더기, 상대의 티츄를 깨는 순간, 꼭 선을 잡아야 할 때 — 이 셋이 폭탄의 자리입니다. '
    + '다만 손에 쥔 채 꼴찌가 되면 그 카드들이 그대로 상대 점수가 되니, 너무 아끼는 것도 위험합니다.',
};
