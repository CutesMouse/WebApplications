class Card {
    number = 1;
    color = COLOR_RED;
    revealing = false;
    offset = 0; // between 0 and 1
    selected = false;

    marked = false; // 卡片功能被觸發後，marked會變為true

    get hover_offset() {
        if (this.selected) return 1;
        //if (this.revealing && game.available_card(this)) return Math.max(0.5, this.offset);
        return this.offset;
    }

    constructor(number, color) {
        this.number = number;
        this.color = color;
    }

    picture_address() {
        if (!this.revealing) return [PICTURE_WIDTH * 15, PICTURE_HEIGHT * 2];
        if (this.color !== COLOR_BLACK) return [this.number * PICTURE_WIDTH, this.color * PICTURE_HEIGHT];
        if (this.number === NUMBER_WILD) return [PICTURE_WIDTH * 15, 0];
        if (this.number === NUMBER_WILD_DRAW_FOUR) return [PICTURE_WIDTH * 15, PICTURE_HEIGHT];
        return [PICTURE_WIDTH * 15, PICTURE_HEIGHT * 3];
    }

    transient_time = 0;
    task = null;
    hovering = false;

    hover() {
        if (this.task !== null) return;
        this.hovering = true;

        let inst = this;

        this.task = setInterval(() => {
            if (inst.hovering) inst.transient_time = Math.min(inst.transient_time + timeout, HOVER_TRANSIENT_TIME);
            else inst.transient_time = Math.max(0, inst.transient_time - timeout);

            this.offset = Math.sin(Math.PI / 2 * this.transient_time / HOVER_TRANSIENT_TIME);

            if (!inst.hovering && inst.transient_time === 0) {
                clearInterval(inst.task);
                inst.task = null;
            }
        }, timeout);
    }

    dehover() {
        this.hovering = false;
    }

    // true: this is less than b
    comp(b) {
        if (this.color !== b.color) return this.color < b.color;
        if (this.number !== b.number) return this.number < b.number;
        return false;
    }
}

class UNO {
    players = [];
    cards = [];

    thrown_cards = [];

    player_count = 4;

    turn = 1;
    direction = 1;

    idle = true; // 玩家是否可進行操作 (true: 玩家可進行操作)
    awaiting = false; // 是否正在等待動畫播放 (true: 還在等待)

    hovering_card_stack = false;
    card_stack_opacity = 0;
    card_stack_offset_y = 0;
    card_stack_hint = null; //Hint

    wild_color_bar_scale = [1, 1, 1, 1];
    hovering_wild_color_bar = [false, false, false, false];
    show_wild_color_bar = false;

    activating_cards = true;

    drawing_combo = 0;

    is_over = false;
    winner = 0;

    constructor(canvas, player_count = 4) {
        this.generate_cards();
        this.player_count = player_count;
        shuffle(this.cards);
        for (let i = 0; i < player_count; i++) {
            let player = new AIPlayer(this, i);
            if (i === 2) player = new ManualPlayer(this, i);
            for (let j = 0; j < GAMERULE_INITIAL_CARDS; j++) {
                player.assign_card(this.get_new_card());
            }
            this.players[i] = player;
        }
        let firstCard = this.get_new_card();
        while (firstCard.color === COLOR_BLACK) {
            this.cards.push(firstCard);
            firstCard = this.get_new_card();
        }
        firstCard.revealing = true;
        firstCard.marked = true;
        this.thrown_cards.push({
            x: canvas.width / 2 - thrown_card_scale * PICTURE_WIDTH * block_scale / 2,
            y: canvas.height / 2 - thrown_card_scale * PICTURE_HEIGHT * block_scale / 2,
            rotate: 0,
            scale: thrown_card_scale * block_scale,
            card: firstCard
        });
        setInterval(() => this.game_thread(), GAME_TICK);
    }

    game_thread() {
        if (!this.awaiting) {
            for (let i = 0; i < this.player_count; i++) {
                if (this.players[i].cards.length === 0) {
                    game.is_over = true;
                    game.winner = i;
                    return;
                }
            }
            if (!this.activating_cards) {
                this.handle_spacial_card(this.top_card(), this.players[this.turn]);
                this.activating_cards = true;
            } else {
                this.idle = true;
                this.awaiting = true;
                this.activating_cards = false;
                this.next_action();
            }
        }
    }

    next_action() {
        this.turn = (this.turn + this.direction + this.player_count) % this.player_count;
        this.players[this.turn].await_action();
    }

    top_card() {
        if (this.thrown_cards.length === 0) return null;
        return this.thrown_cards[this.thrown_cards.length - 1].card;
    }

    available_card(card) {
        let top = this.top_card();
        // 如果現在正在加牌階段
        if (top !== null && this.drawing_combo) {
            // 變色+4牌一定能出
            if (card.number === NUMBER_WILD_DRAW_FOUR) return true;
            // 如果頂牌是+2牌 則所有+2牌都能出
            if (card.number === NUMBER_DRAW_TWO && top.number === NUMBER_DRAW_TWO) return true;
            // 如果+2牌和頂牌顏色一樣也能出
            if (card.color === top.color && card.number === NUMBER_DRAW_TWO) return true;
            // 其餘都不能出
            return false;
        }
        return top === null || top.color === card.color || top.number === card.number;
    }

    get_new_card() {
        if (this.cards.length === 0) {
            if (this.thrown_cards.length > 1) {
                for (let i = 0; i < this.thrown_cards.length - 1; i++) {
                    let thrownCard = this.thrown_cards[i];
                    thrownCard.card.hovering = false;
                    thrownCard.card.revealing = false;
                    thrownCard.card.marked = false;
                    if (thrownCard.card.number === NUMBER_WILD || thrownCard.card.number === NUMBER_WILD_DRAW_FOUR) {
                        thrownCard.card.color = COLOR_BLACK;
                    }
                    this.cards.push(thrownCard.card);
                }
                this.thrown_cards = [this.thrown_cards.pop()];
                shuffle(this.cards);
            } else return null; // out of cards
        }
        return this.cards.shift();
    }

    generate_cards() {
        // 數字牌 + SKIP + REVERSE + DRAW_TWO
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 4; j++) {
                this.cards.push(new Card(i, j));
                this.cards.push(new Card(i, j));
            }
        }
        // WILD + WILD_DRAW_FOUR
        for (let i = 0; i < 4; i++) {
            this.cards.push(new Card(NUMBER_WILD, COLOR_BLACK));
            this.cards.push(new Card(NUMBER_WILD_DRAW_FOUR, COLOR_BLACK));
        }
    }

    // This method is run immediately after each pass
    // turn and combo aren't updated yet
    handle_spacial_card(card, player) {
        if (card === null || card.marked) return;
        if (card.number === NUMBER_SKIP) { // SKIP activated
            this.turn = (this.turn + this.direction + this.player_count) % this.player_count;
            play_skip_animation(this.turn);
        } else if (card.number === NUMBER_REVERSE) { // REVERSE activated
            this.direction = -this.direction;
            play_reverse_animation(this.direction);
        } else if (card.number === NUMBER_DRAW_TWO) { // DRAW TWO activated
            this.drawing_combo += 2;
            play_drawing_animation(-1, this.drawing_combo);
        } else if (card.number === NUMBER_WILD_DRAW_FOUR) {
            this.drawing_combo += 4;
            play_drawing_animation(-1, this.drawing_combo);
        }
        card.marked = true;
    }

    hover_card_stack() {
        this.hovering_card_stack = true;
        this.card_stack_hint = (!this.drawing_combo ? pick_new_card_hint(this.players[2]) : accept_drawing_hint(this.players[2]));
        let inst = this;
        let transient_time = 0;

        let task = setInterval(() => {
            if (inst.hovering_card_stack) transient_time = Math.min(transient_time + timeout, HINT_TRANSIENT_TIME);
            else transient_time = Math.max(0, transient_time - timeout);

            inst.card_stack_offset_y = Math.sin(Math.PI / 2 * transient_time / HINT_TRANSIENT_TIME);
            inst.card_stack_opacity = Math.sin(Math.PI / 2 * transient_time / HINT_TRANSIENT_TIME);

            if (!inst.hovering_card_stack && transient_time === 0) {
                this.card_stack_hint = null;
                clearInterval(task);
            }
        }, timeout);
    }

    dehover_card_stack() {
        this.hovering_card_stack = false;
    }

    display_wild_color_bar() {
        for (let i = 0; i < 4; i++) {
            this.hovering_wild_color_bar[i] = false;
            this.wild_color_bar_scale[i] = 1;
            let from_pos = wild_color_bar_position(i, 0);
            let to_pos = wild_color_bar_position(i, this.wild_color_bar_scale[i]);
            let render_data = {
                from_x: from_pos.x,
                from_y: from_pos.y,
                from_rotate: 0,
                from_scale: 0,
                from_opacity: 0,
                to_x: to_pos.x,
                to_y: to_pos.y,
                to_scale: to_pos.scale,
                to_rotate: 0,
                to_opacity: 1,
                duration: HINT_TRANSIENT_TIME,
                img: button,
                offset_x: from_pos.offset_x,
                offset_y: from_pos.offset_y,
                width: COLOR_BAR_SIZE,
                height: COLOR_BAR_SIZE
            };
            transformation_animation(render_data, (data) => {
                this.show_wild_color_bar = true;
                if (!this.players[2].selecting_wild) this.close_wild_color_bar();
            });
        }
    }

    close_wild_color_bar() {
        this.show_wild_color_bar = false;
        for (let i = 0; i < 4; i++) {
            let from_pos = wild_color_bar_position(i, this.wild_color_bar_scale[i]);
            let to_pos = wild_color_bar_position(i, 0);
            let render_data = {
                from_x: from_pos.x,
                from_y: from_pos.y,
                from_rotate: 0,
                from_scale: from_pos.scale,
                from_opacity: 1,
                to_x: to_pos.x,
                to_y: to_pos.y,
                to_scale: to_pos.scale,
                to_rotate: 0,
                to_opacity: 0,
                duration: HINT_TRANSIENT_TIME,
                img: button,
                offset_x: from_pos.offset_x,
                offset_y: from_pos.offset_y,
                width: COLOR_BAR_SIZE,
                height: COLOR_BAR_SIZE
            };
            transformation_animation(render_data, (data) => {
            });
        }
    }

    hover_wild_color_bar(color) {
        this.hovering_wild_color_bar[color] = true;
        let inst = this;
        let transient_time = 0;

        let task = setInterval(() => {
            if (!this.show_wild_color_bar) {
                clearInterval(task);
                return;
            }
            if (inst.hovering_wild_color_bar[color]) transient_time = Math.min(transient_time + timeout, HINT_TRANSIENT_TIME);
            else transient_time = Math.max(0, transient_time - timeout);

            inst.wild_color_bar_scale[color] = 1 + 0.2 * Math.sin(Math.PI / 2 * transient_time / HINT_TRANSIENT_TIME);

            if (!inst.hovering_wild_color_bar[color] && transient_time === 0) {
                clearInterval(task);
            }
        }, timeout);
    }

    dehover_wild_color_bar(color) {
        this.hovering_wild_color_bar[color] = false;
    }
}