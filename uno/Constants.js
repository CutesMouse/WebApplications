const COLOR_RED = 0;
const COLOR_YELLOW = 1;
const COLOR_GREEN = 2;
const COLOR_BLUE = 3;
const COLOR_BLACK = 4;

const NUMBER_SKIP = 10; // 禁止符號
const NUMBER_REVERSE = 11; // 迴轉符號
const NUMBER_DRAW_TWO = 12; // +2

const NUMBER_WILD = 13; // 變換顏色
const NUMBER_WILD_DRAW_FOUR = 14;

const PICTURE_WIDTH = 80;
const PICTURE_HEIGHT = 120;

const GAMERULE_INITIAL_CARDS = 8;

function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

const HORI_OFFSET = 80;
const VERT_OFFSET = 200;
const HOVER_OFFSET = 30;

const HOVER_TRANSIENT_TIME = 150;
const THROW_TRANSIENT_TIME = 300;
const HINT_TRANSIENT_TIME = 200;
const CARD_TRANSIENT_TIME = 250;
const DRAW_TRANSIENT_TIME = 350;

const timeout = 10;

const CARD_ROTATE_PLAYER = [180, 90, 0, -90];

const GAME_TICK = 350;

const STACKING_POSITION_X = 450;
const STACKING_POSITION_Y = 200;

const COLOR_BAR_SIZE = 36;
const COLOR_BAR_DISTANCE = 30;

const COLOR_BAR_OFFSET = 78 + 126;
const COLOR_BAR_POSITION_OFFSET = 40;

const REVERSE_ANIMATION_WIDTH = 148;
const REVERSE_ANIMATION_HEIGHT = 240;

const SKIP_ANIMATION_WIDTH = 240;
const SKIP_ANIMATION_HEIGHT = 240;

const NUMBER_ANIMATION_SIZE = 120;

const OVER_FONT_BIG = 100;
const OVER_PERIOD = 50;

// ALL CENTER PLACE w/o block_scale
function ANIMATION_PLACE_X() {
    return [800, VERT_OFFSET + PICTURE_WIDTH * card_scale, 800, 1600 - VERT_OFFSET - PICTURE_HEIGHT * card_scale];
}

function ANIMATION_PLACE_Y() {
    return [HORI_OFFSET + PICTURE_HEIGHT * card_scale, 450, 900 - HORI_OFFSET - PICTURE_HEIGHT * self_card_scale, 450];
}

function CARD_OFFSET_Y() {
    return [HORI_OFFSET, VERT_OFFSET, 900 - HORI_OFFSET - PICTURE_HEIGHT * self_card_scale, 1600 - VERT_OFFSET - PICTURE_HEIGHT * card_scale];
}

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

function rand(max) {
    return Math.floor(Math.random() * max);
}

function wild_color_bar_position(color, scale) {
    let dx = (COLOR_BAR_DISTANCE + COLOR_BAR_SIZE) * block_scale;
    let base_x = canvas.width / 2 - (COLOR_BAR_DISTANCE * 3 / 2 + 2 * COLOR_BAR_SIZE) * block_scale;
    let base_y = (900 - HORI_OFFSET - PICTURE_HEIGHT * self_card_scale - COLOR_BAR_POSITION_OFFSET - COLOR_BAR_SIZE) * block_scale;
    return {
        x: base_x + color * dx + (COLOR_BAR_SIZE / 2 - COLOR_BAR_SIZE * scale / 2) * block_scale,
        y: base_y + (COLOR_BAR_SIZE / 2 - COLOR_BAR_SIZE * scale / 2) * block_scale,
        offset_x: COLOR_BAR_OFFSET + color * COLOR_BAR_SIZE,
        offset_y: 0,
        scale: block_scale * scale
    };
}