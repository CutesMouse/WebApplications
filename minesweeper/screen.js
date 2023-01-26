var Display = /** @class */ (function () {
    // @ts-ignore
    function Display(canvas, game, info) {
        this.canvas = canvas;
        this.game = game;
        this.info = info;
        this.first = true;
        this.selected = null;
    }
    Display.prototype.paint = function () {
        var size_x = this.game.size_x;
        var size_y = this.game.size_y;
        var info = this.info;
        var ctx = this.canvas;
        ctx.reset();
        for (var x = 0; x < size_x; x++) {
            for (var y = 0; y < size_y; y++) {
                var paint_x = info.boarder_x + (info.blank_x + info.width) * x + info.width + info.blank_x / 2;
                var paint_y = info.boarder_y + (info.blank_y + info.width) * y + info.width + info.blank_y / 2;
                var hovered = this.selected != null && this.selected.x == x && this.selected.y == y;
                if (this.game.revealed[x][y]) {
                    ctx.fillStyle = "rgba(255,255,255, 1)";
                    if (hovered)
                        ctx.fillStyle = "rgba(217,217,217,0.3)";
                    ctx.fillRect(paint_x - info.blank_x / 2, paint_y - info.blank_y / 2 - info.width / 2, info.blank_x, info.blank_y);
                    if (this.game.sweeperMap[x][y]) {
                        ctx.beginPath();
                        ctx.fillStyle = "rgb(255, 0, 0)";
                        ctx.ellipse(paint_x, paint_y - info.width / 2, info.blank_x * 0.3, info.blank_y * 0.3, 0, 0, 2 * Math.PI);
                        ctx.fill();
                        continue;
                    }
                    if (this.game.blankMap[x][y] != 0) {
                        ctx.font = Math.min(info.blank_x, info.blank_y) + "px Arial";
                        ctx.fillStyle = "rgb(0, 0, 0)";
                        ctx.textAlign = "center";
                        ctx.textBaseline = 'middle';
                        ctx.fillText(this.game.blankMap[x][y], paint_x, paint_y);
                    }
                    continue;
                }
                ctx.fillStyle = "rgba(57,57,57, 1)";
                if (hovered)
                    ctx.fillStyle = "rgba(57,57,57, 0.7)";
                ctx.fillRect(paint_x - info.blank_x / 2, paint_y - info.blank_y / 2 - info.width / 2, info.blank_x, info.blank_y);
                if (this.game.noticed[x][y]) {
                    ctx.beginPath();
                    ctx.fillStyle = "rgb(255,255,0)";
                    ctx.ellipse(paint_x, paint_y - info.width / 2, info.blank_x * 0.3, info.blank_y * 0.3, 0, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
        ctx.lineWidth = info.width;
        //垂直線
        for (var x = 0; x <= this.game.size_x; x++) {
            ctx.beginPath();
            var from_x = info.boarder_x + (info.width + info.blank_x) * x + info.width / 2;
            var from_y = info.boarder_y - info.width / 2;
            var to_y = info.boarder_y + (info.width + info.blank_y) * this.game.size_y + info.width / 2;
            ctx.moveTo(from_x, from_y);
            ctx.lineTo(from_x, to_y);
            ctx.stroke();
        }
        // 水平線
        for (var y = 0; y <= this.game.size_y; y++) {
            ctx.beginPath();
            var from_x = info.boarder_x;
            var from_y = info.boarder_y + (info.width + info.blank_y) * y;
            var to_x = info.boarder_x + (info.width + info.blank_x) * this.game.size_x + info.width;
            ctx.moveTo(from_x, from_y);
            ctx.lineTo(to_x, from_y);
            ctx.stroke();
        }
    };
    Display.prototype.onMouseClicked = function (x, y, clickType) {
        var info = this.info;
        var bx = Math.floor((x - info.boarder_x) / (info.width + info.blank_x));
        var by = Math.floor((y - info.boarder_y) / (info.width + info.blank_y));
        if (clickType === 'left') {
            if (bx < 0 || by < 0 || bx >= this.game.size_x || by >= this.game.size_y)
                return;
            this.game.trigger(bx, by, this.first);
            this.first = false;
        }
        if (clickType === 'right') {
            this.game.notice(bx, by);
        }
        if (clickType === 'both') {
            this.game.autoDetect(bx, by);
        }
        this.paint();
    };
    Display.prototype.onMouseMove = function (x, y) {
        var info = this.info;
        var bx = Math.floor((x - info.boarder_x) / (info.width + info.blank_x));
        var by = Math.floor((y - info.boarder_y) / (info.width + info.blank_y));
        this.selected = { x: bx, y: by };
        this.paint();
    };
    return Display;
}());
