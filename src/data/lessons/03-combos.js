export default {
  id: 'combos',
  num: 3,
  title: '낼 수 있는 형태 여섯 가지',
  subtitle: '싱글, 페어, 트리플, 풀하우스, 연속 페어, 스트레이트',

  blocks: [
    { kind: 'p', text: '카드는 아무렇게나 못 냅니다. 정해진 **형태**로만 낼 수 있습니다. 폭탄은 따로 다룰 만큼 특별해서 6챕터로 미루고, 여기서는 나머지 여섯 가지를 봅니다.' },

    { kind: 'h', text: '1. 싱글 — 한 장' },
    { kind: 'cards', hand: 'G7', caption: '가장 단순합니다. 2가 제일 낮고 A가 제일 높으며, 그 위에 용이 있습니다.' },

    { kind: 'h', text: '2. 페어 — 같은 랭크 두 장' },
    { kind: 'cards', hand: 'G8 R8', caption: '수트는 아무거나 섞여도 됩니다. 랭크만 같으면 됩니다.' },

    { kind: 'h', text: '3. 트리플 — 같은 랭크 세 장' },
    { kind: 'cards', hand: 'G9 B9 U9' },

    { kind: 'h', text: '4. 풀하우스 — 트리플 + 페어 (다섯 장)' },
    { kind: 'cards', hand: 'G9 B9 U9 G4 R4', caption: '세기는 **트리플 쪽 랭크**로 정해집니다. 이 조합은 페어가 4라도 "9 풀하우스"입니다.' },

    { kind: 'h', text: '5. 연속 페어 — 이어지는 페어 두 쌍 이상' },
    { kind: 'cards', hand: 'G7 B7 G8 R8', caption: '77과 88처럼 랭크가 이어져야 합니다. 계단이라고도 부릅니다.' },
    {
      kind: 'examples',
      items: [
        { hand: 'G5 B5 G6 R6 G7 B7', label: '55 66 77 — 여섯 장짜리 연속 페어', ok: true, why: '쌍이 몇 개든 이어지기만 하면 됩니다.' },
        { hand: 'G5 B5 G7 B7', label: '55 77', ok: false, why: '5와 7 사이가 비어 있어 이어지지 않습니다.' },
      ],
    },

    { kind: 'h', text: '6. 스트레이트 — 이어지는 다섯 장 이상' },
    { kind: 'cards', hand: 'G5 B6 U7 R8 G9', caption: '5장부터 셀 수 있고 수트는 섞여도 됩니다. 최대는 A까지입니다.' },
    {
      kind: 'examples',
      items: [
        { hand: 'MAH G2 B3 U4 R5', label: '참새를 맨 아래에 끼운 스트레이트', ok: true, why: '[[MAH]]는 랭크 1이라 스트레이트의 최하단이 될 수 있습니다.' },
        { hand: 'G5 B6 U7 R8', label: '네 장짜리', ok: false, why: '스트레이트는 **최소 5장**입니다. 네 장은 아무것도 아닙니다.' },
        { hand: 'GJ BQ UK RA DRG', label: 'A 위에 용을 얹기', ok: false, why: '[[DRG]]은 어떤 조합에도 들어가지 못합니다. 혼자 싱글로만 냅니다.' },
      ],
    },

    { kind: 'h', text: '받아칠 때의 두 가지 조건' },
    { kind: 'p', text: '테이블에 깔린 것을 덮으려면 **종류가 같아야 하고, 장수도 같아야** 합니다. 그러고 나서 더 높아야 합니다.' },
    {
      kind: 'note',
      tone: 'warn',
      title: '장수 조건을 자주 놓칩니다',
      text: '5장짜리 스트레이트 위에는 **5장짜리 스트레이트만** 올릴 수 있습니다. 6장짜리는 더 길다고 이기는 게 아니라 아예 못 냅니다. 페어 위에 트리플도 마찬가지로 안 됩니다.',
    },

    { kind: 'demo', id: 'sandbox', title: '직접 만들어보기' },
  ],

  quizzes: [
    {
      id: 'combos-length',
      mode: 'select-cards',
      goal: 'legal',
      prompt: '테이블에 **5장짜리 스트레이트(3~7)**가 깔려 있습니다. 이걸 덮을 수 있는 카드를 골라 내보세요.',
      table: 'U3 R4 U5 R6 U7',
      hand: 'G4 B5 U6 R7 G8 G9 GK BK',
      explain: '4-5-6-7-8도 5장짜리 스트레이트이고 최고가 8이라 7보다 높습니다. 5-6-7-8-9도 됩니다. 다만 여섯 장을 한꺼번에 내면 장수가 달라 못 냅니다.',
    },
    {
      id: 'combos-fullhouse',
      mode: 'choice',
      prompt: '[[G9]] [[B9]] [[U9]] [[G4]] [[R4]] (9 트리플 + 4 페어) 위에 [[GJ]] [[BJ]] [[G2]] [[B2]] [[U2]] 를 낼 수 있을까요?',
      choices: [
        { text: '못 낸다. 이쪽은 2가 트리플이라 9보다 낮다', correct: true, why: '풀하우스의 세기는 **트리플 쪽 랭크**로 정해집니다. J 페어가 붙어 있어도 트리플이 2이면 2 풀하우스라 9 풀하우스를 못 이깁니다.' },
        { text: '낼 수 있다. J가 9보다 높다', correct: false, why: '페어 쪽 랭크는 세기 판정에 쓰이지 않습니다.' },
        { text: '낼 수 있다. 다섯 장으로 장수가 같다', correct: false, why: '장수가 같은 건 최소 조건일 뿐이고, 그 위에 더 높아야 합니다.' },
      ],
      explain: '풀하우스는 트리플만 보면 됩니다.',
    },
    {
      id: 'combos-build',
      mode: 'select-cards',
      goal: 'legal',
      prompt: '테이블에 **연속 페어 네 장(66 77)**이 깔려 있습니다. 받아쳐 보세요.',
      table: 'U6 R6 U7 R7',
      hand: 'G8 B8 G9 B9 GK BK G2 B3',
      explain: '88 99도 이어지는 페어 두 쌍이고 최고가 9라 7보다 높습니다. K 페어는 두 장뿐이라 장수가 맞지 않아 낼 수 없습니다.',
    },
  ],
};
