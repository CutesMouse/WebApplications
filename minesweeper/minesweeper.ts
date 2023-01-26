type pos = {
    x: number, y: number
}

class Minesweeper {
    private static shuffle(array: any[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    readonly size_x;
    readonly size_y;
    readonly sweepAmount;
    private readonly _sweeperMap: boolean[][];
    private readonly _blankMap: number[][];
    private readonly _revealed: boolean[][];
    private readonly dx = [-1, -1, -1, 0, 0, 1, 1, 1];
    private readonly dy = [-1, 0, 1, 1, -1, -1, 0, 1];
    private readonly _noticed: boolean[][];
    private noticeAmount;
    private status: GameStatus;
    private start_time: Date;
    private reveal_Amount: number;
    private finish_time: number;

    constructor(size_x: number, size_y: number, sweepAmount: number) {
        this.size_x = size_x;
        this.size_y = size_y;
        this.sweepAmount = sweepAmount;
        this._sweeperMap = [];
        this._blankMap = [];
        this._revealed = [];
        this._noticed = [];
        this.status = GameStatus.NOT_START;
        this.noticeAmount = 0;
        this.finish_time = 0;
        this.reveal_Amount = 0;
        this.generate();
    }

    private generate(): void {
        let straight: boolean[] = [];
        for (let i: number = 0; i < this.sweepAmount; i++) {
            straight.push(true);
        }
        for (let i: number = straight.length; i < this.size_x * this.size_y; i++) {
            straight.push(false);
        }
        Minesweeper.shuffle(straight);

        for (let x: number = 0; x < this.size_x; x++) {
            this._sweeperMap.push([]);
            this._blankMap.push([]);
            this._revealed.push([]);
            this._noticed.push([]);
            for (let y: number = 0; y < this.size_y; y++) {
                this._sweeperMap[x][y] = straight[x + y * this.size_x];
                this._blankMap[x][y] = (this._sweeperMap[x][y] ? -1 : 0);
                this._revealed[x][y] = false;
                this._noticed[x][y] = false;
            }
        }
        this.generate_blankMap();
    }

    public trigger(trigger_x: number, trigger_y: number, is_first = false): void {
        if (this.status == GameStatus.NOT_START) {
            this.start_time = new Date();
            this.status = GameStatus.ONGOING;
        }
        if (this.status !== GameStatus.ONGOING) return;
        if (this._revealed[trigger_x][trigger_y]) return;
        if (this._noticed[trigger_x][trigger_y]) return;

        const dx = this.dx;
        const dy = this.dy;
        if (this._blankMap[trigger_x][trigger_y] == 0) {
            let bfs: pos[] = [{x: trigger_x, y: trigger_y}];
            let searched: pos[] = [];

            while (bfs.length !== 0) {
                let current: pos = bfs.shift();
                searched.push(current);
                this.reveal(current.x, current.y);
                for (let i = 0; i < 8; i++) {
                    let nx = current.x + dx[i];
                    let ny = current.y + dy[i];
                    if (nx < 0 || ny < 0 || nx >= this.size_x || ny >= this.size_y) continue;
                    this.reveal(nx, ny);
                    if (this._blankMap[nx][ny] != 0) continue;
                    let valid = true;
                    for (let spos of searched) {
                        if (spos.x == nx && spos.y == ny) valid = false;
                    }
                    if (valid) {
                        bfs.push({x: nx, y: ny});
                    }
                }
            }
            return;
        }
        if (is_first) {
            while (true) {
                let near_sweeps = this.get_near_sweeps(trigger_x, trigger_y);
                if (near_sweeps.length == 0) break;
                for (let sweep of near_sweeps) {
                    this.remove_sweep(sweep.x, sweep.y);
                }
            }

            this.generate_blankMap();
            this.trigger(trigger_x, trigger_y);
            return;
        }
        if (!this._sweeperMap[trigger_x][trigger_y]) {
            this.reveal(trigger_x, trigger_y);
            return;
        }
        if (!is_first) {
            this.lose();
            return;
        }
    }

    private remove_sweep(x: number, y: number) : void {
        let nx = 0;
        let ny = 0;
        do {
            nx = Math.floor(Math.random() * this.size_x);
            ny = Math.floor(Math.random() * this.size_y);
        } while (this._sweeperMap[nx][ny]);
        this._sweeperMap[x][y] = false;
        this._sweeperMap[nx][ny] = true;
    }
    private get_near_sweeps(x: number, y: number) : pos[] {
        let represent: pos[] = [];
        for (let i: number = 0; i < 8; i++) {
            let nx = x + this.dx[i];
            let ny = y + this.dy[i];
            if (nx < 0 || ny < 0 || nx >= this.size_x || ny >= this.size_y) continue;
            if (this._sweeperMap[nx][ny]) represent.push({x: nx, y: ny});
        }
        if (this._sweeperMap[x][y]) represent.push({x: x, y: y});
        return represent;
    }

    private reveal(x: number, y: number) {
        if (this._revealed[x][y]) return;
        this.reveal_Amount++;
        if (this._noticed[x][y]) this.notice(x, y);
        this._revealed[x][y] = true;
    }

    public autoDetect(x: number, y: number) {
        if (!this._revealed[x][y]) return;
        let surroundings = 0;
        let clicks: pos[] = [];
        for (let i = 0; i < 8; i++) {
            let nx = x + this.dx[i];
            let ny = y + this.dy[i];
            if (nx < 0 || ny < 0 || nx >= this.size_x || ny >= this.size_y) continue;
            if (this.noticed[nx][ny]) surroundings++;
            else if (!this._revealed[nx][ny]) {
                clicks.push({x: nx, y: ny});
            }
        }
        if (this._blankMap[x][y] == surroundings) {
            for (let click of clicks) {
                this.trigger(click.x, click.y);
            }
        }
    }

    private generate_blankMap(): void {
        const dx = this.dx;
        const dy = this.dy;

        for (let x: number = 0; x < this.size_x; x++) {
            for (let y: number = 0; y < this.size_y; y++) {
                if (this._sweeperMap[x][y]) continue;
                this._blankMap[x][y] = this.get_near_sweeps(x, y).length;
            }
        }
    }

    private checkStatus() {
        if (this.status != GameStatus.ONGOING) return;
        if (this.size_x * this.size_y - this.reveal_Amount != this.noticeAmount) return;
        for (let x = 0; x < this.size_x; x++) {
            for (let y = 0; y < this.size_y; y++) {
                if (this._sweeperMap[x][y] != this.noticed[x][y]) return;
            }
        }
        this.status = GameStatus.WIN;
        this.finish_time = (Date.now() - this.start_time.getTime()) / 1000;
    }

    public notice(x: number, y: number) {
        if (this.status != GameStatus.ONGOING) return;
        if (this._revealed[x][y]) return;

        this._noticed[x][y] = !this._noticed[x][y];
        if (this._noticed[x][y]) this.noticeAmount++;
        else this.noticeAmount--;
    }

    public info_box_message(): string {
        switch (this.status) {
            case GameStatus.LOSE:
                return `您失敗了！請再接再厲！`
            case GameStatus.ONGOING:
                return `遊戲時間: ${Math.round((Date.now() - this.start_time.getTime()) / 1000)}秒,` +
                    `空格總數: ${this.size_x * this.size_y - this.reveal_Amount}, 您已標示出: ${this.noticeAmount} 個地雷`;
            case GameStatus.WIN:
                return `您在${this.finish_time}秒內全破了踩地雷！`;
            case GameStatus.NOT_START:
                return `點擊任一空格開始遊戲！`
        }
    }

    private lose(): void {
        this.status = GameStatus.LOSE;
        for (let x = 0; x < this.size_x; x++) {
            for (let y = 0; y < this.size_y; y++) {
                this._revealed[x][y] = this._revealed[x][y] || this._sweeperMap[x][y];
            }
        }
    }


    get sweeperMap(): boolean[][] {
        return this._sweeperMap;
    }

    get blankMap(): number[][] {
        return this._blankMap;
    }

    get revealed(): boolean[][] {
        return this._revealed;
    }

    get noticed(): boolean[][] {
        return this._noticed;
    }
}

const enum GameStatus {
    NOT_START, ONGOING, WIN, LOSE
}