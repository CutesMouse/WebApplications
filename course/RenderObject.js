class RenderObject {
    // 左上角空格的大小
    header_width = 295;
    header_height = 88;

    // 課表格中的大小
    course_width = 375;
    course_height = 236;

    // 格線
    stroke_size = 3;
    stroke_color = '#e3e3e3';

    // 頁緣空白
    margin_size = 15;

    // 星期參數 (row)
    weekdays = ['一', '二', '三', '四', '五'];

    // 時間參數 (col)
    sessions = ['1 (8:00)', '2 (9:00)', '3 (10:10)', '4 (11:10)', 'n (12:10)',
        '5 (13:20)', '6 (14:20)', '7 (15:30)', '8 (16:30)', '9 (17:30)',
        'a (18:30)', 'b (19:30)', 'c (20:30)'];

    // 字體參數
    font_source = new FontFace("heiti", "url(ADOBEFANHEITISTD-BOLD.ttf)"); // 自定義tff字體 若要使用電腦內建字體請輸入 null
    font = 'heiti';
    render_offset_y = 5; // 平衡參數
    /* 範例
    若使用微軟正黑體(任一電腦有安裝的字體)，此處請更改為
    font_source = null;
    font = '微軟正黑體';
     */
    font_size = '50px';
    line_space = 75;

    constructor() {

    }
}

class CourseObject {
    // 課程名稱
    name = '機器學習導論';
    // 老師
    teacher = '楊雅棠';
    // 上課地點
    classroom = '資電館-207';
    // 上課時間
    // 用一個二維陣列表示
    // 第一層表示課程格子
    // 第二層則為 [星期, 開始時間, 課堂數]
    // 以T4R3R4為例
    time = [[1, 3, 1], [3, 2, 2]];
    // 顏色
    font_color = '#000000';
    background_color = '#FFE49A';
}