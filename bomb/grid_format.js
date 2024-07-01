const BLANK = 0; // 空白
const PLAYER1 = 1; // 簡單模式 玩家
const ROCK = 2; // 地圖邊界
const BOMB_SUPPLY = 3; // 炸彈補給
const STAR = 4; // 終點
const BOMB = 5; // 放置的炸彈
const STONE = 6; // 草
const MONSTER = 7; // 寶箱怪
const BULLET_SUPPLY = 8; // 子彈補給
const PLAYER2_UP = 9; // 困難模式 玩家 向上
const PLAYER2_DOWN = 10; // 困難模式 玩家 向下
const PLAYER2_LEFT = 11; // 困難模式 玩家 向左
const PLAYER2_RIGHT = 12; // 困難模式 玩家 向右
const ARROW_UP = 13; // 子彈向上
const ARROW_DOWN = 14; // 子彈向下
const ARROW_LEFT = 15; // 子彈向左
const ARROW_RIGHT = 16; // 子彈向右

const GUN_MODE = true;
const BOMB_MODE = false;

const EASY_LEVEL = false;
const HARD_LEVEL = true;

const MASK = (1 << 16) - 1;

const FACING_UP = 0;
const FACING_DOWN = 1;
const FACING_LEFT = 2;
const FACING_RIGHT = 3;

const SCREEN_WIDTH = 8;
const SCREEN_HEIGHT = 6;