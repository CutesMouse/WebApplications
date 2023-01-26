type pos = {
    x: number,
    y: number
}
class Display {
    private readonly canvas: any;
    // @ts-ignore
    private readonly game: Minesweeper;
    private readonly info: ScreenInfo;
    private first: boolean;
    private selected: pos;

    // @ts-ignore
    constructor(canvas: any, game: Minesweeper, info: ScreenInfo) {
        this.canvas = canvas;
        this.game = game;
        this.info = info;
        this.first = true;
        this.selected = null;
    }

    public paint(): void {
        let size_x = this.game.size_x;
        let size_y = this.game.size_y;
        let info = this.info;
        let ctx = this.canvas;

        ctx.reset();

        for (let x = 0; x < size_x; x++) {
            for (let y = 0; y < size_y; y++) {
                let paint_x = info.boarder_x + (info.blank_x + info.width) * x + info.width + info.blank_x / 2;
                let paint_y = info.boarder_y + (info.blank_y + info.width) * y + info.width + info.blank_y / 2;
                let hovered = this.selected != null && this.selected.x == x && this.selected.y == y;
                if (this.game.revealed[x][y]) {

                    ctx.fillStyle = "rgba(255,255,255, 1)";
                    if (hovered) ctx.fillStyle = "rgba(217,217,217,0.3)";

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
                if (hovered) ctx.fillStyle = "rgba(57,57,57, 0.7)";
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
        for (let x = 0; x <= this.game.size_x; x++) {
            ctx.beginPath();
            let from_x = info.boarder_x + (info.width + info.blank_x) * x + info.width / 2;
            let from_y = info.boarder_y - info.width / 2;
            let to_y = info.boarder_y + (info.width + info.blank_y) * this.game.size_y + info.width / 2;
            ctx.moveTo(from_x, from_y);
            ctx.lineTo(from_x, to_y);
            ctx.stroke();
        }
        // 水平線
        for (let y = 0; y <= this.game.size_y; y++) {
            ctx.beginPath();
            let from_x = info.boarder_x;
            let from_y = info.boarder_y + (info.width + info.blank_y) * y;
            let to_x = info.boarder_x + (info.width + info.blank_x) * this.game.size_x + info.width;

            ctx.moveTo(from_x, from_y);
            ctx.lineTo(to_x, from_y);
            ctx.stroke();
        }
    }

    public onMouseClicked(x: number, y: number, clickType: 'left' | 'right' | 'both') : void {
        let info = this.info;
        let bx = Math.floor((x - info.boarder_x) / (info.width + info.blank_x));
        let by = Math.floor((y - info.boarder_y) / (info.width + info.blank_y));
        if (clickType === 'left') {
            if (bx < 0 || by < 0 || bx >= this.game.size_x || by >= this.game.size_y) return;
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
    }

    public onMouseMove(x: number, y: number) {
        let info = this.info;
        let bx = Math.floor((x - info.boarder_x) / (info.width + info.blank_x));
        let by = Math.floor((y - info.boarder_y) / (info.width + info.blank_y));
        this.selected = {x: bx, y: by};
        this.paint();
    }
}

type ScreenInfo = {
    boarder_x: number,
    boarder_y: number,
    blank_x: number,
    blank_y: number,
    width: number
}