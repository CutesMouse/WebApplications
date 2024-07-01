class Game {
    height = 0;
    width = 0;

    player_x = 1;
    player_y = 1;
    facing = FACING_LEFT;

    render_offset_x = 0;
    render_offset_y = 0;

    bomb_amount = 5;
    bullet_amount = 5;
    destroy_stones = 0;
    led = 0;

    dead = false;
    win = false;

    mode = BOMB_MODE;
    level = EASY_LEVEL;

    bombs = [];
    map = [];

    constructor() {
        this.easy_level_setup();
    }

    adjust_screen() {
        let screen_left = this.render_offset_x;
        let screen_right = this.render_offset_x + SCREEN_WIDTH;
        let player_left = this.player_x - 2;
        let player_right = this.player_x + 2;

        let screen_top = this.render_offset_y;
        let screen_bot = this.render_offset_y + SCREEN_HEIGHT;
        let player_top = this.player_y - 2;
        let player_bot = this.player_y + 2;

        if (player_left >= 0 && player_left < screen_left) { // 螢幕向上移動
            this.render_offset_x--;
        }
        if (player_right < this.width && player_right >= screen_right) {
            this.render_offset_x++;
        }

        if (player_top >= 0 && player_top < screen_top) { // 螢幕向上移動
            this.render_offset_y--;
        }
        if (player_bot < this.height && player_bot >= screen_bot) {
            this.render_offset_y++;
        }
    }

    player() {
        if (!this.level) {
            return PLAYER1;
        }
        return PLAYER2_UP + this.facing;
    }

    move_up() {
        if (!this.can_move_up()) return;
        this.pass_through(this.player_x, this.player_y - 1);
        this.map[this.player_x][this.player_y] = this.bombs[this.player_x][this.player_y] * BOMB;
        this.player_y = this.player_y - 1;
        this.facing = FACING_UP;
        this.map[this.player_x][this.player_y] = this.player();
        this.adjust_screen();
    }

    move_down() {
        if (!this.can_move_down()) return;
        this.pass_through(this.player_x, this.player_y + 1);
        this.map[this.player_x][this.player_y] = this.bombs[this.player_x][this.player_y] * BOMB;
        this.player_y = this.player_y + 1;
        this.facing = FACING_DOWN;
        this.map[this.player_x][this.player_y] = this.player();
        this.adjust_screen();
    }

    move_left() {
        if (!this.can_move_left()) return;
        this.pass_through(this.player_x - 1, this.player_y);
        this.map[this.player_x][this.player_y] = this.bombs[this.player_x][this.player_y] * BOMB;
        this.player_x = this.player_x - 1;
        this.facing = FACING_LEFT;
        this.map[this.player_x][this.player_y] = this.player();
        this.adjust_screen();
    }

    move_right() {
        if (!this.can_move_right()) return;
        this.pass_through(this.player_x + 1, this.player_y);
        this.map[this.player_x][this.player_y] = this.bombs[this.player_x][this.player_y] * BOMB;
        this.player_x = this.player_x + 1;
        this.facing = FACING_RIGHT;
        this.map[this.player_x][this.player_y] = this.player();
        this.adjust_screen();
    }

    interact() {
        if (this.mode === BOMB_MODE) this.place(); else this.shoot();
    }

    place() {
        if (this.bomb_amount === 0) return;
        if (this.win || this.dead) return;
        if (this.bombs[this.player_x][this.player_y]) return;
        this.bomb_amount--;
        if (this.bomb_amount === 0 && this.level === HARD_LEVEL) this.mode = GUN_MODE;
        this.bombs[this.player_x][this.player_y] = true;
        let px = this.player_x, py = this.player_y;
        let inst = this;
        setTimeout(function () {
            inst.explode(px, py);
        }, 4000);
    }

    shoot() {
        if (this.bullet_amount === 0) return
        if (this.win || this.dead) return;
        this.bullet_amount--;
        let dx = 0, dy = 0;
        let x = this.player_x, y = this.player_y;
        let face = this.facing;
        switch (face) {
            case FACING_UP:
                dy = -1;
                break;
            case FACING_DOWN:
                dy = 1;
                break;
            case FACING_LEFT:
                dx = -1;
                break;
            case FACING_RIGHT:
                dx = 1;
                break;
        }
        if (this.map[x + dx][y + dy] === STONE || this.map[x + dx][y + dy] === ROCK) return;
        let inst = this;
        let task = -1;
        let move = () => {
            if (this.map[x][y] !== this.player()) this.map[x][y] = 0;
            x = x + dx;
            y = y + dy;
            if (this.map[x][y] === BLANK) {
                this.map[x][y] = ARROW_UP + face;
                return;
            } else if (this.map[x][y] === MONSTER) {
                this.map[x][y] = BLANK;
                inst.chest_mob_led();
            }
            if (task !== -1) clearInterval(task);
            else task = 0;
        }
        move();
        if (task) {
            task = setInterval(move, 500);
        }
    }

    pass_through(x, y) {
        let val = this.map[x][y];
        if (val === BOMB_SUPPLY) this.bomb_amount++; else if (val === BULLET_SUPPLY) this.bullet_amount++; else if (val === STAR) {
            this.win = true;
            this.win_led();
        }
    }

    explode(x, y) {
        if (!this.bombs[x][y]) return;
        if (this.player_x === x && this.player_y === y) this.dead = true;
        let queue = [];
        this.map[x][y] = BLANK;
        this.bombs[x][y] = false;
        queue.push([x, y]);
        while (queue.length) {
            let _x = queue[0][0], _y = queue[0][1];
            queue.shift();
            for (let dx = -1; dx < 2; dx++) {
                for (let dy = -1; dy < 2; dy++) {
                    let val = this.map[_x + dx][_y + dy];
                    if (val === STONE) {
                        this.map[_x + dx][_y + dy] = BLANK;
                        this.destroy_stones++;
                    } else if (val === BOMB) {
                        queue.push([_x + dx, _y + dy]);
                        this.map[_x + dx][_y + dy] = BLANK;
                        this.bombs[_x + dx][_y + dy] = false;
                    } else if (val === MONSTER) {
                        this.map[_x + dx][_y + dy] = BLANK;
                        let inst = this;
                        this.chest_mob_led();
                    } else if (this.player_x === _x + dx && this.player_y === _y + dy) {
                        this.map[_x + dx][_y + dy] = BLANK;
                        this.dead = true;
                        this.dead_led();
                    }
                }
            }
        }
    }

    can_pass(x, y) {
        return !this.win && !this.dead && x > 0 && y > 0 && x < this.width - 1 && y < this.height - 1 && (this.map[x][y] === BLANK) || (this.map[x][y] === BULLET_SUPPLY) || (this.map[x][y] === BOMB_SUPPLY) || (this.map[x][y] === STAR);
    }

    can_move_up() {
        return this.can_pass(this.player_x, this.player_y - 1);
    }

    can_move_down() {
        return this.can_pass(this.player_x, this.player_y + 1);
    }

    can_move_left() {
        return this.can_pass(this.player_x - 1, this.player_y);
    }

    can_move_right() {
        return this.can_pass(this.player_x + 1, this.player_y);
    }

    chest_mob_led() {
        let cnt = 0;
        let inst = this;
        let task = setInterval(() => {
            if (this.dead || this.win) {
                clearInterval(task);
                return;
            }
            if (cnt < 4) {
                inst.led = 21845;
                if (cnt & 1) inst.led = ~inst.led;
                cnt++;
            } else {
                inst.led = 0;
                clearInterval(task);
            }
        }, 250);
    }

    win_led() {
        let left = 1;
        let right = 1 << 15;
        let inverse = false;
        let task = setInterval(() => {
            if (!this.win) {
                this.led = 0;
                clearInterval(task);
                return;
            }
            if (inverse && left === 0) { // from inside to out
                inverse = false;
                left = 1;
                right = 1 << 15;
            } else if (!inverse && left > right) {
                inverse = true;
                left = 1 << 7;
                right = 1 << 8;
            }
            this.led = left | right;
            if (inverse) {
                left = left >> 1;
                right = right << 1;
            } else {
                left = left << 1;
                right = right >> 1;
            }
        }, 500);
    }

    dead_led() {
        this.led = 1;
        let inverse = false;
        let task = setInterval(() => {
            if (!this.dead) {
                this.led = 0;
                clearInterval(task);
                return;
            }
            if (inverse && this.led === 1) {
                inverse = false;
            } else if (!inverse && (this.led >> 15) & 1) {
                inverse = true;
            }
            if (inverse) {
                this.led = this.led >> 1;
            } else {
                this.led = this.led << 1;
            }
        }, 500);
    }

    base_setup() {
        this.render_offset_x = 0;
        this.render_offset_y = 0;

        this.player_x = 1;
        this.player_y = 1;

        this.win = false;
        this.dead = false;

        this.bomb_amount = 5;
        this.bullet_amount = this.level * 5;

        for (let i = 0; i < this.width; i++) {
            this.map.push([]);
            this.bombs.push([]);
            for (let j = 0; j < this.height; j++) {
                this.map[i].push(BLANK);
                this.bombs[i].push(false);
            }
        }

        // WALLS
        for (let i = 0; i < this.width; i++) {
            this.map[i][0] = ROCK;
            this.map[i][this.height - 1] = ROCK;
        }
        for (let i = 0; i < this.height; i++) {
            this.map[0][i] = ROCK;
            this.map[this.width - 1][i] = ROCK;
        }
    }

    easy_level_setup() {
        this.map = [];
        this.bombs = [];
        this.width = 8;
        this.height = 6;

        this.base_setup();

        // GRASS
        this.map[3][1] = STONE;
        this.map[6][1] = STONE;
        this.map[2][2] = STONE;
        this.map[3][2] = STONE;
        this.map[4][2] = STONE;
        this.map[5][2] = STONE;
        this.map[4][3] = STONE;
        this.map[2][4] = STONE;
        this.map[5][4] = STONE;

        // STAR
        this.map[6][4] = STAR;

        // BOMB SUPPLY
        this.map[4][1] = BOMB_SUPPLY;
        this.map[6][3] = BOMB_SUPPLY;

        // MONSTER
        this.map[2][3] = MONSTER;

        // PLAYER
        this.map[this.player_x][this.player_y] = PLAYER1;
    }

    hard_level_setup() {
        this.map = [];
        this.bombs = [];
        this.width = 10;
        this.height = 12;

        this.base_setup();

        // GRASS
        this.map[2][2] = STONE;
        this.map[3][2] = STONE;
        this.map[4][2] = STONE;
        this.map[5][2] = STONE;
        this.map[8][2] = STONE;
        this.map[2][4] = STONE;
        this.map[4][4] = STONE;
        this.map[5][4] = STONE;
        this.map[6][4] = STONE;
        this.map[7][4] = STONE;
        this.map[2][5] = STONE;
        this.map[4][5] = STONE;
        this.map[8][5] = STONE;
        this.map[2][6] = STONE;
        this.map[8][6] = STONE;
        this.map[4][7] = STONE;
        this.map[7][7] = STONE;
        this.map[8][7] = STONE;
        this.map[2][8] = STONE;
        this.map[3][8] = STONE;
        this.map[4][8] = STONE;
        this.map[5][8] = STONE;
        this.map[7][8] = STONE;
        this.map[2][9] = STONE;
        this.map[5][9] = STONE;
        this.map[8][9] = STONE;
        this.map[4][10] = STONE;
        this.map[5][10] = STONE;
        this.map[6][10] = STONE;

        // STAR
        this.map[5][5] = STAR;

        // BOMB SUPPLY
        this.map[3][9] = BOMB_SUPPLY;

        // BULLET SUPPLY
        this.map[4][1] = BULLET_SUPPLY;
        this.map[6][3] = BULLET_SUPPLY;
        this.map[1][5] = BULLET_SUPPLY;
        this.map[5][6] = BULLET_SUPPLY;
        this.map[8][8] = BULLET_SUPPLY;

        // MONSTER
        this.map[8][1] = MONSTER;
        this.map[3][3] = MONSTER;
        this.map[3][7] = MONSTER;

        // PLAYER
        this.facing = FACING_LEFT;
        this.map[this.player_x][this.player_y] = this.player();
    }

    switch_level() {
        this.level = !this.level;
        if (this.level) this.hard_level_setup(); else this.easy_level_setup();
    }

    switch_mode() {
        if (this.bomb_amount === 0 || this.level === EASY_LEVEL) return;
        this.mode = !this.mode;
    }
}