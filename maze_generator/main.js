function get_input_value(id) {
    return parseInt(document.getElementById(id).value);
}
function get_build_info() {
    return {
        size_x: get_input_value("maze_size_x"),
        size_y: get_input_value("maze_size_y"),
        blank_x: get_input_value("blank_x"),
        blank_y: get_input_value("blank_y"),
        width: get_input_value("width")
    }
}
function generateMaze() {
    let info = get_build_info();
    this.mazeObj = new Maze(info.size_x, info.size_y);
    this.mazeObj.generate();
    this.screen = new Screen(this.mazeObj, info.blank_x, info.blank_y, 25, 25, info.width);
    const canva_obj = document.getElementById("maze");
    canva_obj.width = 50 + (info.blank_x + info.width) * info.size_x + info.width;
    canva_obj.height = 50 + (info.blank_y + info.width) * info.size_y + info.width;
    const canvas = document.getElementById("maze").getContext("2d");
    canvas.reset();
    this.screen.paint(canvas);
    document.getElementById("answer").innerHTML = "顯示解答";
}

function toggleAnswer() {
    if (!this.mazeObj) return;
    let text = {
        true: "隱藏解答",
        false: "顯示解答"
    }
    this.screen.setAnswerDisplay(!this.screen.isAnswerDisplay());
    const canvas = document.getElementById("maze").getContext("2d");
    canvas.reset();
    this.screen.paint(canvas);
    document.getElementById("answer").innerHTML = text[this.screen.isAnswerDisplay()];
}