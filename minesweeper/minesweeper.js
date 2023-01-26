var Minesweeper = /** @class */ (function () {
    function Minesweeper(size_x, size_y, sweepAmount) {
        this.dx = [-1, -1, -1, 0, 0, 1, 1, 1];
        this.dy = [-1, 0, 1, 1, -1, -1, 0, 1];
        this.size_x = size_x;
        this.size_y = size_y;
        this.sweepAmount = sweepAmount;
        this._sweeperMap = [];
        this._blankMap = [];
        this._revealed = [];
        this._noticed = [];
        this.status = 0 /* GameStatus.NOT_START */;
        this.noticeAmount = 0;
        this.finish_time = 0;
        this.reveal_Amount = 0;
        this.generate();
    }
    Minesweeper.shuffle = function (array) {
        var _a;
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            _a = [array[j], array[i]], array[i] = _a[0], array[j] = _a[1];
        }
    };
    Minesweeper.prototype.generate = function () {
        var straight = [];
        for (var i = 0; i < this.sweepAmount; i++) {
            straight.push(true);
        }
        for (var i = straight.length; i < this.size_x * this.size_y; i++) {
            straight.push(false);
        }
        Minesweeper.shuffle(straight);
        for (var x = 0; x < this.size_x; x++) {
            this._sweeperMap.push([]);
            this._blankMap.push([]);
            this._revealed.push([]);
            this._noticed.push([]);
            for (var y = 0; y < this.size_y; y++) {
                this._sweeperMap[x][y] = straight[x + y * this.size_x];
                this._blankMap[x][y] = (this._sweeperMap[x][y] ? -1 : 0);
                this._revealed[x][y] = false;
                this._noticed[x][y] = false;
            }
        }
        this.generate_blankMap();
    };
    Minesweeper.prototype.trigger = function (trigger_x, trigger_y, is_first) {
        if (is_first === void 0) { is_first = false; }
        if (this.status == 0 /* GameStatus.NOT_START */) {
            this.start_time = new Date();
            this.status = 1 /* GameStatus.ONGOING */;
        }
        if (this.status !== 1 /* GameStatus.ONGOING */)
            return;
        if (this._revealed[trigger_x][trigger_y])
            return;
        if (this._noticed[trigger_x][trigger_y])
            return;
        var dx = this.dx;
        var dy = this.dy;
        if (this._blankMap[trigger_x][trigger_y] == 0) {
            var bfs = [{ x: trigger_x, y: trigger_y }];
            var searched = [];
            while (bfs.length !== 0) {
                var current = bfs.shift();
                searched.push(current);
                this.reveal(current.x, current.y);
                for (var i = 0; i < 8; i++) {
                    var nx = current.x + dx[i];
                    var ny = current.y + dy[i];
                    if (nx < 0 || ny < 0 || nx >= this.size_x || ny >= this.size_y)
                        continue;
                    this.reveal(nx, ny);
                    if (this._blankMap[nx][ny] != 0)
                        continue;
                    var valid = true;
                    for (var _i = 0, searched_1 = searched; _i < searched_1.length; _i++) {
                        var spos = searched_1[_i];
                        if (spos.x == nx && spos.y == ny)
                            valid = false;
                    }
                    if (valid) {
                        bfs.push({ x: nx, y: ny });
                    }
                }
            }
            return;
        }
        if (is_first) {
            while (true) {
                var near_sweeps = this.get_near_sweeps(trigger_x, trigger_y);
                if (near_sweeps.length == 0)
                    break;
                for (var _a = 0, near_sweeps_1 = near_sweeps; _a < near_sweeps_1.length; _a++) {
                    var sweep = near_sweeps_1[_a];
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
    };
    Minesweeper.prototype.remove_sweep = function (x, y) {
        var nx = 0;
        var ny = 0;
        do {
            nx = Math.floor(Math.random() * this.size_x);
            ny = Math.floor(Math.random() * this.size_y);
        } while (this._sweeperMap[nx][ny]);
        this._sweeperMap[x][y] = false;
        this._sweeperMap[nx][ny] = true;
    };
    Minesweeper.prototype.get_near_sweeps = function (x, y) {
        var represent = [];
        for (var i = 0; i < 8; i++) {
            var nx = x + this.dx[i];
            var ny = y + this.dy[i];
            if (nx < 0 || ny < 0 || nx >= this.size_x || ny >= this.size_y)
                continue;
            if (this._sweeperMap[nx][ny])
                represent.push({ x: nx, y: ny });
        }
        if (this._sweeperMap[x][y])
            represent.push({ x: x, y: y });
        return represent;
    };
    Minesweeper.prototype.reveal = function (x, y) {
        if (this._revealed[x][y])
            return;
        this.reveal_Amount++;
        if (this._noticed[x][y])
            this.notice(x, y);
        this._revealed[x][y] = true;
    };
    Minesweeper.prototype.autoDetect = function (x, y) {
        if (!this._revealed[x][y])
            return;
        var surroundings = 0;
        var clicks = [];
        for (var i = 0; i < 8; i++) {
            var nx = x + this.dx[i];
            var ny = y + this.dy[i];
            if (nx < 0 || ny < 0 || nx >= this.size_x || ny >= this.size_y)
                continue;
            if (this.noticed[nx][ny])
                surroundings++;
            else if (!this._revealed[nx][ny]) {
                clicks.push({ x: nx, y: ny });
            }
        }
        if (this._blankMap[x][y] == surroundings) {
            for (var _i = 0, clicks_1 = clicks; _i < clicks_1.length; _i++) {
                var click = clicks_1[_i];
                this.trigger(click.x, click.y);
            }
        }
    };
    Minesweeper.prototype.generate_blankMap = function () {
        var dx = this.dx;
        var dy = this.dy;
        for (var x = 0; x < this.size_x; x++) {
            for (var y = 0; y < this.size_y; y++) {
                if (this._sweeperMap[x][y])
                    continue;
                this._blankMap[x][y] = this.get_near_sweeps(x, y).length;
            }
        }
    };
    Minesweeper.prototype.checkStatus = function () {
        if (this.status != 1 /* GameStatus.ONGOING */)
            return;
        if (this.size_x * this.size_y - this.reveal_Amount != this.noticeAmount)
            return;
        for (var x = 0; x < this.size_x; x++) {
            for (var y = 0; y < this.size_y; y++) {
                if (this._sweeperMap[x][y] != this.noticed[x][y])
                    return;
            }
        }
        this.status = 2 /* GameStatus.WIN */;
        this.finish_time = (Date.now() - this.start_time.getTime()) / 1000;
    };
    Minesweeper.prototype.notice = function (x, y) {
        if (this.status != 1 /* GameStatus.ONGOING */)
            return;
        if (this._revealed[x][y])
            return;
        this._noticed[x][y] = !this._noticed[x][y];
        if (this._noticed[x][y])
            this.noticeAmount++;
        else
            this.noticeAmount--;
    };
    Minesweeper.prototype.info_box_message = function () {
        switch (this.status) {
            case 3 /* GameStatus.LOSE */:
                return "\u60A8\u5931\u6557\u4E86\uFF01\u8ACB\u518D\u63A5\u518D\u53B2\uFF01";
            case 1 /* GameStatus.ONGOING */:
                return "\u904A\u6232\u6642\u9593: ".concat(Math.round((Date.now() - this.start_time.getTime()) / 1000), "\u79D2,") +
                    "\u7A7A\u683C\u7E3D\u6578: ".concat(this.size_x * this.size_y - this.reveal_Amount, ", \u60A8\u5DF2\u6A19\u793A\u51FA: ").concat(this.noticeAmount, " \u500B\u5730\u96F7");
            case 2 /* GameStatus.WIN */:
                return "\u60A8\u5728".concat(this.finish_time, "\u79D2\u5167\u5168\u7834\u4E86\u8E29\u5730\u96F7\uFF01");
            case 0 /* GameStatus.NOT_START */:
                return "\u9EDE\u64CA\u4EFB\u4E00\u7A7A\u683C\u958B\u59CB\u904A\u6232\uFF01";
        }
    };
    Minesweeper.prototype.lose = function () {
        this.status = 3 /* GameStatus.LOSE */;
        for (var x = 0; x < this.size_x; x++) {
            for (var y = 0; y < this.size_y; y++) {
                this._revealed[x][y] = this._revealed[x][y] || this._sweeperMap[x][y];
            }
        }
    };
    Object.defineProperty(Minesweeper.prototype, "sweeperMap", {
        get: function () {
            return this._sweeperMap;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Minesweeper.prototype, "blankMap", {
        get: function () {
            return this._blankMap;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Minesweeper.prototype, "revealed", {
        get: function () {
            return this._revealed;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Minesweeper.prototype, "noticed", {
        get: function () {
            return this._noticed;
        },
        enumerable: false,
        configurable: true
    });
    return Minesweeper;
}());
