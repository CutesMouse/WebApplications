class Player {
    cards = [];
    self = false;
    card_offset_scale = 0.7;
    game;
    player_index;

    constructor(game_inst, player_index) {
        this.game = game_inst;
        this.player_index = player_index;
    }

    assign_card(card) {
        this.cards.push(card);

        // Insertion sort
        let current = card;
        let j = this.cards.length - 2;

        while (j >= 0 && !this.cards[j].comp(current)) {
            this.cards[j + 1] = this.cards[j];
            j--;
        }

        this.cards[j + 1] = current;

        card.revealing = this.self;
        if (this.self && this.cards.length > 15) this.card_offset_scale = 0.65;
        if (this.self && this.cards.length > 20) this.card_offset_scale = 0.6;
        if (this.self && this.cards.length > 24) this.card_offset_scale = 0.6;
    }

    setSelf(self) {
        this.self = self;
        for (let card of this.cards) {
            card.revealing = self;
        }
    }

    await_action() {

    }

    throw(card) {
        card.revealing = true;
        let index = this.cards.indexOf(card);
        throwing_animation(this, card, index);
        this.cards.splice(index, 1);
        this.game.idle = false;
    }

    throw_wild_card(card, color) {
        card.color = color;
        this.throw(card, true);
    }

    can_throw_card() {
        return (this.player_index === game.turn) && game.idle;
    }

    estimateIndex(card) {
        let i = 0;
        while (i < this.cards.length && !card.comp(this.cards[i])) i++;
        return i;
    }

    pick_new_card(bypass = false) {
        if (!bypass && !this.can_throw_card()) return;
        let pick_amt = 1;
        if (this.game.drawing_combo !== 0) {
            pick_amt = this.game.drawing_combo;
            play_drawing_animation(this.game.players.indexOf(this), this.game.drawing_combo);
            this.game.drawing_combo = 0;
        }
        let new_cards = [];
        while (pick_amt--) {
            let newCard = game.get_new_card();
            if (newCard !== null) {
                new_cards.push(newCard);
            }
        }

        let index = 1;
        let inst = this;
        let task = () => {
            if (index === new_cards.length) return;
            this.game.awaiting = true;
            let card = new_cards[index++];
            picking_animation(inst, card, this.estimateIndex(card), task);
        }
        picking_animation(this, new_cards[0], this.estimateIndex(new_cards[0]), task);
        this.game.idle = false;
    }
}

class ManualPlayer extends Player {

    selecting_wild = false;
    wild_card = null;

    constructor(game_inst, player_index) {
        super(game_inst, player_index);
        this.setSelf(true);
    }

    throw(card, bypass = false) {
        if (!this.can_throw_card()) return;
        if (!bypass && this.selecting_wild) {
            this.selecting_wild = false;
            this.wild_card.selected = false;
            this.wild_card = null;
            game.close_wild_color_bar();
        }
        if (card.color === COLOR_BLACK) {
            this.selecting_wild = true;
            card.selected = true;
            this.wild_card = card;
            this.game.display_wild_color_bar();
            return;
        }
        if (!bypass && !this.game.available_card(card)) return;
        super.throw(card);
    }

    pick_new_card(bypass = false) {
        if (!bypass && this.selecting_wild) {
            this.selecting_wild = false;
            this.wild_card.selected = false;
            this.wild_card = null;
            game.close_wild_color_bar();
        }
        super.pick_new_card(bypass);
    }

    throw_wild_card(color) {
        if (this.wild_card === null) return; // unreachable
        super.throw_wild_card(this.wild_card, color);
        this.wild_card = null;
        this.selecting_wild = false;
        this.game.close_wild_color_bar();
    }
}

class AIPlayer extends Player {

    color_cnt = [0, 0, 0, 0];
    wild_cnt = [0, 0];
    number_cnt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    constructor(game_inst, player_index) {
        super(game_inst, player_index);
        this.setSelf(false);
    }

    assign_card(card) {
        super.assign_card(card);
        if (card.color !== COLOR_BLACK) {
            this.color_cnt[card.color]++;
            this.number_cnt[card.number]++;
        } else this.wild_cnt[card.number - NUMBER_WILD]++;
    }

    get_card_by_color(color) {
        if (color === COLOR_BLACK) {
            let w = this.wild_cnt[0] + this.wild_cnt[1];
            if (w === 0) return null;
            w = this.wild_cnt[0] / w;
            let card = this.cards[this.cards.length - 1];
            if (Math.random() < w) {
                card = this.cards[this.cards.length - 1 - this.wild_cnt[1]];
            }
            card.color = this.AI_wild_color();
            return card;
        }
        let cnt = this.color_cnt[color];
        if (cnt === 0) return null;
        let choose = rand(cnt);
        let base = 0;
        for (let i = 0; i < color; i++) base += this.color_cnt[i];
        return this.cards[base + choose];
    }

    get_card_by_number(number) {
        let pool = this.number_cnt[number];
        let base = 0;
        if (pool === 0) return null;
        let choose = rand(pool);
        for (let i = 0; i < this.cards.length; i++) {
            if (this.cards[i].number !== number) continue;
            if (choose === base) return this.cards[i];
            base++;
        }
        // unreachable
        return null;
    }

    get_drawing_card(total_drawing) {
        let choose = rand(total_drawing);
        let base = 0;
        for (let i = 0; i < this.cards.length; i++) {
            let card = this.cards[i];
            if (!this.game.available_card(card)) continue;
            if (base++ === choose) {
                if (card.color === COLOR_BLACK) card.color = this.AI_wild_color();
                return card;
            }
        }
        // unreachable
        return null;
    }

    AI_wild_color() {
        let pool_cnt = 0;
        let pool = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
            pool[i] = (this.color_cnt[i] ** 2);
            pool_cnt += pool[i];
        }
        let choose = rand(pool_cnt);
        let base = 0;
        for (let i = 0; i < 4; i++) {
            base += pool[i];
            if (choose <= base && pool[i]) return i;
        }
        // when there's only black cards in AI's hand
        return rand(4);
    }

    // AI機制
    // 若顏色為c、數字為n，而玩家有a張顏色為c的牌，和b張數字為n的牌，則
    // 比重1 AI選擇出變色或變色罰牌(如果有，依照比例隨機出牌)
    // 比重0.25 AI選擇抽牌
    // 比重5a AI選擇出顏色相同的牌
    // 比重5b AI選擇出數字相同的牌

    // 若AI被前家罰牌，目前累計k張，手牌有r張可以出的牌，則
    // 比重r(k+1) AI選擇累加(如果可以)
    // 比重1 AI接受加牌

    // 若AI選擇出變色牌，此時四種顏色的牌各有a、b、c、d張，則
    // 依照比重 a^2 b^2 c^2 d^2 隨機變色
    AI_action() {
        // 已經沒有任何手牌
        if (this.cards.length === 0) return;
        let top = game.top_card();
        let rand = Math.random();

        let wild = 1 * (this.wild_cnt[0] !== 0 || this.wild_cnt[1] !== 0);
        let pick = 0.25; // todo-確認可以抽牌
        let same_color = this.color_cnt[top.color];

        // 正在罰牌階段
        if (this.game.drawing_combo !== 0) {
            let r = 0;
            let k = this.game.drawing_combo;
            for (let i = 0; i < this.cards.length; i++) r += this.game.available_card(this.cards[i]);
            let agree_rate = 1 / (r * (k + 1) + 1);
            console.log(r);
            if (rand < agree_rate) this.pick_new_card();
            else this.throw(this.get_drawing_card(r));
            return;
        }

        // 上一張是變色牌 -> 只能出變色牌或抽卡
        if (top.number === NUMBER_WILD || top.number === NUMBER_WILD_DRAW_FOUR) {
            let pick_rate = pick / (pick + wild + same_color * 5);
            let wild_rate = wild / (pick + wild + same_color * 5);
            if (rand < pick_rate) { // 選擇抽牌
                this.pick_new_card();
            } else if (rand < (pick_rate + wild_rate)) { // 選擇出變色牌
                this.throw(this.get_card_by_color(COLOR_BLACK));
            } else { // 選擇出顏色牌
                this.throw(this.get_card_by_color(top.color));
            }
            return;
        }
        // 上一張是正常牌
        let same_number = this.number_cnt[top.number]

        let pick_rate = pick / (pick + wild + same_color * 5 + same_number * 5);
        let wild_rate = wild / (pick + wild + same_color * 5 + same_number * 5);
        let color_rate = same_color * 5 / (pick + wild + same_color * 5 + same_number * 5);

        if (rand < pick_rate) { // 選擇抽牌
            this.pick_new_card();
            console.log('a');
        } else if (rand < (pick_rate + wild_rate)) { // 選擇出變色牌
            this.throw(this.get_card_by_color(COLOR_BLACK));
            console.log('b')
        } else if (rand < (pick_rate + wild_rate + color_rate)) { // 選擇出顏色牌
            this.throw(this.get_card_by_color(top.color));
            console.log('c')
        } else { // 選擇出數字牌
            this.throw(this.get_card_by_number(top.number));
            console.log('d')
        }
    }

    throw(card) {
        if (card.number !== NUMBER_WILD && card.number !== NUMBER_WILD_DRAW_FOUR) {
            this.color_cnt[card.color]--;
            this.number_cnt[card.number]--;
        } else this.wild_cnt[card.number - NUMBER_WILD]--;
        super.throw(card);
    }

    await_action() {
        this.AI_action();
    }
}
