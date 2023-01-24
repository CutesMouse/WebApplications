function Screen(m, blank_x, blank_y, boarder_x, boarder_y, line_width) {
    this.maze = m;
    let answer = false;
    let room_size_x = blank_x + line_width;
    let room_size_y = blank_y + line_width;

    this.isAnswerDisplay = function () {
        return answer;
    }

    this.setAnswerDisplay = function (b) {
        answer = b;
    }

    this.paint = function (canvas) {
        for (let wallid in this.maze.walls) {
            let wall = this.maze.walls[wallid];
            if (!wall) continue;
            let a = wall.connected_A;
            let b = wall.connected_B;
            // horizontal line
            if (a.x === b.x) {
                let from = (room_size_x * b.x) + boarder_x;
                let y = (room_size_y * b.y) + boarder_y;
                canvas.fillRect(from - line_width / 2, y - line_width / 2, room_size_x + line_width, line_width);
            }
            // vertical line
            if (a.y === b.y) {
                let from = (room_size_y * b.y) + boarder_y;
                let x = (room_size_x * b.x) + boarder_x;
                canvas.fillRect(x - line_width / 2, from - line_width / 2, line_width, room_size_y + line_width);
            }
        }

        //boarder
        canvas.fillRect(boarder_x - line_width / 2, boarder_y - line_width / 2, line_width, room_size_y * this.maze.size_y + line_width);
        canvas.fillRect(boarder_x + room_size_x * this.maze.size_x - line_width / 2, boarder_y - line_width / 2, line_width, room_size_y * this.maze.size_y + line_width);
        canvas.fillRect(boarder_x - line_width / 2, boarder_y - line_width / 2, room_size_x * this.maze.size_x, line_width);
        canvas.fillRect(boarder_x - line_width / 2, boarder_y + room_size_y * this.maze.size_y - line_width / 2, +room_size_x * this.maze.size_x, line_width);

        //BFS Trace
        if (answer) {
            canvas.fillStyle = "rgb(255, 0, 0)";

            let answer = this.maze.getAnswer();
            for (let i = 0; i < answer.length - 1; i++) {
                let from = answer[i];
                let to = answer[i + 1];

                let from_x = (room_size_x * from.x) + boarder_x + (room_size_x - line_width) / 2 + line_width;
                let from_y = (room_size_y * from.y) + boarder_y + (room_size_y - line_width) / 2 + line_width;

                if (from.x === to.x) {
                    let to_y = (room_size_y * to.y) + boarder_y + (room_size_y - line_width) / 2 + line_width;
                    canvas.fillRect(from_x - line_width / 2, Math.min(from_y, to_y), line_width, Math.abs(to_y - from_y));
                }
                if (from.y === to.y) {
                    let to_x = (room_size_x * to.x) + boarder_x + (room_size_x - line_width) / 2 + line_width;
                    canvas.fillRect(Math.min(to_x, from_x), from_y - line_width / 2, Math.abs(to_x - from_x), line_width);
                }
            }
        }

        //scratch & finish
        let begin_x = 0, begin_y = 0;
        let end_x = this.maze.size_x - 1, end_y = this.maze.size_y - 1;
        let round_x = room_size_x * 0.3, round_y = room_size_y * 0.3;
        canvas.fillStyle = "rgb(255,0,0)";
        canvas.beginPath();
        canvas.ellipse((room_size_x * (begin_x))+ line_width/2 + boarder_x + room_size_x / 2, (room_size_y * begin_y) + line_width/2 + boarder_y + room_size_y / 2, round_x, round_y, 0, 0, 2 * Math.PI);
        canvas.fill();
        canvas.fillStyle = "rgb(0,255,0)";
        canvas.beginPath();
        canvas.ellipse((room_size_x * (end_x))+ line_width/2 + boarder_x + room_size_x / 2, (room_size_y * end_y) + line_width/2 + boarder_y + room_size_y / 2, round_x, round_y, 0, 0, 2 * Math.PI);
        canvas.fill();
        canvas.fillStyle = "rgb(255,255,255)";
    }
}