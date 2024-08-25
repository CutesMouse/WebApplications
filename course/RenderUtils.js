function getCanvasWidth(args) {
    return args.margin_size * 2
        + args.stroke_size * (args.weekdays.length + 2)
        + args.header_width
        + args.course_width * args.weekdays.length
}

function getCanvasHeight(args) {
    return args.margin_size * 2
        + args.stroke_size * (args.sessions.length + 2)
        + args.header_height
        + args.course_height * args.sessions.length
}

// return top-left pixel of the blank
// row & col are 1-based
// headers are represented by 0
// [width, height]
function getPosition(args, row, col) {
    return [args.margin_size + args.stroke_size * (1 + col) + (col === 0 ? 0 : (args.header_width + args.course_width * (col - 1))),
        args.margin_size + args.stroke_size * (1 + row) + (row === 0 ? 0 : (args.header_height + args.course_height * (row - 1)))];
}

function render_centered_text(ctx, x, y, text, args) {
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + args.render_offset_y);
}

function render_multiline_text(ctx, x, y, lines, line_space, args) {
    let base_y = y - (lines.length - 1) * line_space / 2;
    for (let i = 0; i < lines.length; i++) {
        render_centered_text(ctx, x, base_y + line_space * i, lines[i], args);
    }
}

let weeks = ['M', 'T', 'W', 'R', 'F'];
let sessions = ['1', '2', '3', '4', 'n', '5', '6', '7', '8', '9', 'a', 'b', 'c'];

// time = M1F1F2
function resolve_time(time) {
    let result = [];
    let prev_week = -1;
    let start = 0;
    let duration = 0;
    for (let i = 0; i < time.length; i += 2) {
        let week = weeks.indexOf(time.charAt(i));
        let session = sessions.indexOf(time.charAt(i + 1));
        if (prev_week === week && (start + duration) === session) {
            duration++;
        } else {
            if (prev_week !== -1) result.push([prev_week, start, duration]);
            prev_week = week;
            start = session;
            duration = 1;
        }
    }
    if (prev_week !== -1) result.push([prev_week, start, duration]);
    return result;
}

let course_list = [];

function create_course(name, teacher, classroom, time, background_color, font_color = 'black') {
    let result = new CourseObject();
    result.name = name;
    result.teacher = teacher;
    result.classroom = classroom;
    result.time = resolve_time(time);
    result.background_color = background_color;
    result.font_color = font_color;
    course_list.push(result);
}