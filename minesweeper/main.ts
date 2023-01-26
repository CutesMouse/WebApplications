// @ts-ignore
let game: Minesweeper;
// @ts-ignore
let screen: Display;

// @ts-ignore
type GameInfo = ScreenInfo | {
    size_x: number,
    size_y: number,
    sweep_amount: number
}

let default_easy: GameInfo = {
    size_x: 8,
    size_y: 8,
    sweep_amount: 10,
    blank_x: 40,
    blank_y: 40,
    boarder_x: 25,
    boarder_y: 25,
    width: 5
}
let default_medium: GameInfo = {
    size_x: 16,
    size_y: 16,
    sweep_amount: 40,
    blank_x: 40,
    blank_y: 40,
    boarder_x: 25,
    boarder_y: 25,
    width: 5
}
let default_hard: GameInfo = {
    size_x: 30,
    size_y: 16,
    sweep_amount: 99,
    blank_x: 40,
    blank_y: 40,
    boarder_x: 25,
    boarder_y: 25,
    width: 5
}

function setDifficulty(input: 0 | 1 | 2) {
    switch (input) {
        case 0:
            set_gameinfo(default_easy);
            break;
        case 1:
            set_gameinfo(default_medium);
            break;
        case 2:
            set_gameinfo(default_hard);
            break;
    }
}

function get_gameinfo() : GameInfo {
    let selected = {};
    for (let key in default_easy) {
        if (key == 'boarder_x' || key == 'boarder_y') continue;
        // @ts-ignore
        selected[key] = parseInt(document.getElementById(key).value);
    }
    selected["boarder_x"] = 25;
    selected["boarder_y"] = 25;
    return selected;
}

function set_gameinfo(selected: GameInfo) {
    for (let key in default_easy) {
        if (key == 'boarder_x' || key == 'boarder_y') continue;
        // @ts-ignore
        document.getElementById(key).value = selected[key];
    }
}

function ready() {
    // @ts-ignore
    document.getElementById('info_box').style = "display: none";
    // @ts-ignore
    document.getElementById('screen').style = "display: none";
}

function equip() {
    // @ts-ignore
    document.getElementById('sets').style = "display: none";
    // @ts-ignore
    document.getElementById('map_settings').style = "display: none";
    // @ts-ignore
    document.getElementById('settings').style = "display: none";
    // @ts-ignore
    document.getElementById('finish').style = "display: none";
    // @ts-ignore
    document.getElementById('info_box').style = "display: block";
    // @ts-ignore
    document.getElementById('screen').style = "display: inline-block";
    setupGame(get_gameinfo());
}

// @ts-ignore
function setupMouseEvents(canva: any, game: Minesweeper, screen: Display) {
    let left_click = false;
    let right_click = false;
    let cd = 0;
    canva.addEventListener('mouseup', function (e) {
        if (left_click && right_click) {
            screen.onMouseClicked(e.offsetX, e.offsetY, 'both');
            game.checkStatus();
            cd = 2;
        }
        if (cd <= 0) {
            if (left_click) {
                screen.onMouseClicked(e.offsetX, e.offsetY, 'left');
                game.checkStatus();
            }
            if (right_click) {
                screen.onMouseClicked(e.offsetX, e.offsetY, 'right');
                game.checkStatus();
            }
        }
        if (e.button == 0) {
            left_click = false;
            cd--;
        }
        if (e.button == 2) {
            cd--;
            right_click = false;
        }
    })

    canva.addEventListener('mousedown', function (e) {
        if (e.button == 0) left_click = true;
        if (e.button == 2) right_click = true;
    })
    canva.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    })
    canva.addEventListener('mousemove', function (e) {
        screen.onMouseMove(e.offsetX, e.offsetY);
    })
}

function setupGame(info: GameInfo) {
    // @ts-ignore
    game = new Minesweeper(info.size_x, info.size_y, info.sweep_amount);
    const canva = document.getElementById('screen');
    // @ts-ignore
    canva.width = info.width + (info.width + info.blank_x) * game.size_x + info.boarder_x * 2;
    // @ts-ignore
    canva.height = info.width + (info.width + info.blank_y) * game.size_y + info.boarder_y * 2;

    // @ts-ignore
    screen = new Display(canva.getContext('2d'), game, info);
    const info_box = document.getElementById('info_box');

    setupMouseEvents(canva, game, screen);

    info_box.innerHTML = game.info_box_message();
    setInterval(() => {
        info_box.innerHTML = game.info_box_message();
    }, 500);
    // @ts-ignore
    screen.paint();
}