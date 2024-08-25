// assert args instanceOf RenderObject
function render(canvas, args) {
    let ctx = canvas.getContext('2d');
    canvas.width = getCanvasWidth(args);
    canvas.height = getCanvasHeight(args);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    render_stroke(ctx, args);
    render_header(ctx, args);
    for (let i = 0; i < course_list.length; i++) render_course(ctx, args, course_list[i]);
}

function render_stroke(ctx, args) {
    ctx.fillStyle = args.stroke_color;
    for (let i = 0; i <= args.weekdays.length; i++) {
        for (let j = 0; j <= args.sessions.length; j++) {
            let pos = getPosition(args, j, i);
            let width = (i === 0 ? args.header_width : args.course_width);
            let height = (j === 0 ? args.header_height : args.course_height);
            let stroke = args.stroke_size;
            ctx.fillRect(pos[0] - stroke, pos[1] - stroke, stroke, height + 2 * stroke); // Left
            ctx.fillRect(pos[0] + width, pos[1] - stroke, stroke, height + 2 * stroke); // Right
            ctx.fillRect(pos[0] - stroke, pos[1] - stroke, width + 2 * stroke, stroke); // Top
            ctx.fillRect(pos[0] - stroke, pos[1] + height, width + 2 * stroke, stroke); // Bot
        }
    }
}

function render_header(ctx, args) {
    ctx.fillStyle = "#000000";
    ctx.font = args.font_size + ' ' + args.font;
    for (let i = 0; i < args.weekdays.length; i++) {
        let pos = getPosition(args, 0, i+1);
        render_centered_text(ctx, pos[0] + args.course_width / 2, pos[1] + args.header_height / 2, args.weekdays[i], args);
    }
    for (let j = 0; j < args.sessions.length; j++) {
        let pos = getPosition(args, j+1, 0);
        render_centered_text(ctx, pos[0] + args.header_width / 2, pos[1] + args.course_height / 2, args.sessions[j], args);
    }
}

function render_course(ctx, args, course) {
    let width = args.course_width;
    let height = args.course_height;
    let stroke = args.stroke_size;
    for (let i = 0; i < course.time.length; i++) {
        let time = course.time[i];
        let week = time[0];
        let start = time[1];
        let duration = time[2];
        let pos = getPosition(args, start + 1, week + 1);
        // render background
        ctx.fillStyle = course.background_color;
        ctx.fillRect(pos[0], pos[1], width, height * duration + stroke * (duration - 1));
        // render text
        ctx.fillStyle = course.font_color;
        render_multiline_text(ctx, pos[0] + width / 2, pos[1] + (height * duration + stroke * (duration - 1)) / 2,
            [course.name, course.teacher, course.classroom], args.line_space, args);
    }
}