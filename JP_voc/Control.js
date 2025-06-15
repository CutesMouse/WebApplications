// AUTO LOAD
document.addEventListener('DOMContentLoaded', () => loadOptions(false));

// prevent zoom
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});
document.addEventListener('gesturechange', function (e) {
    e.preventDefault();
});
document.addEventListener('gestureend', function (e) {
    e.preventDefault();
});

let vh = window.innerHeight * 0.01;

// css fix
function setRealViewportHeight() {
    vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setRealViewportHeight);
setRealViewportHeight();

// 禁止快速雙擊觸發放大
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault(); // 防止雙擊放大
    }
    lastTouchEnd = now;
}, false);

let problems = [];

function loadOptions(favorite_only = false) {
    let selection_box = document.getElementById('level');
    let options = selection_box.children;

    updateFavoriteOptions();
    if (favorite_only) return;
    let finished = 0;

    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        let value = option.value;
        if (value[0] === 'F') continue; // Favorite另外載
        let level = 0;
        if (value[0] === 'M') { // 綜合
            level = parseInt(value.substring(1).split('-')[0]);
        } else level = parseInt(option.value);
        option.disabled = get_questions(level) === "";
        if (value[0] !== 'M' && !option.disabled) finished++;
    }

    let finish_ratio = Math.round(100 * finished / TOTAL_LEVEL);
    document.getElementById('progress').innerHTML = "完成進度: " + finish_ratio + "%";
}

function updateFavoriteOptions() {
    let selection_box = document.getElementById('level');
    let options = selection_box.children;
    let favorite = get_favorite_list();
    let chunk = getChunk();
    let entries = Math.ceil(favorite.length / chunk);
    let last_option = undefined;
    // 先把所有超過Favorite範圍的刪除
    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        let value = option.value;
        if (value[0] === 'F') {
            let ident = parseInt(value.substring(1));
            if (ident > entries) selection_box.removeChild(option);
            else last_option = option;
            option.disabled = entries === 0;
            if (ident !== 0) {
                option.innerHTML = "Star." + ident + " (" + Math.min(favorite.length - chunk * (ident - 1), chunk) + "題)";
            } else {
                option.innerHTML = "星號標示單字" + " (" + Math.min(favorite.length, 20) + "題)";
            }
        }
    }
    // 再把新的節點加上去
    for (let i = parseInt(last_option.value.substring(1)) + 1; i <= entries; i++) {
        let option = document.createElement('option');
        option.setAttribute("value", 'F' + i);
        option.innerHTML = "Star." + i + " (" + Math.min(favorite.length - chunk * (i - 1), chunk) + "題)"
        selection_box.insertBefore(option, last_option.nextSibling);
        last_option = option;
    }

}

function get_problem_list() {
    let val = document.getElementById('level').value;
    let mixed = val[0] === 'M';
    let favorite = val[0] === 'F';
    let problem_list = [];
    let CHUNK = getChunk();
    if (!favorite) { // 非喜好項目
        let from_level = parseInt(mixed ? val.substring(1).split('-')[0] : val);
        let to_level = parseInt(mixed ? val.substring(1).split('-')[1] : val);
        problems = [];
        for (let i = from_level; i <= to_level; i++) {
            let source = get_questions(i);
            if (source === "") continue;
            problem_list = problem_list.concat(convert_json(i, source));
        }
    } else { // 喜好項目
        let chunk = parseInt(val.substring(1))
        problem_list = get_favorite_list();
        if (problem_list.length === 0) return problem_list;
        if (chunk !== 0) {
            problem_list.splice(0, CHUNK * (chunk - 1));
            if (problem_list.length > CHUNK) {
                problem_list.splice(CHUNK, problem_list.length - CHUNK); // 強制長度為CHUNK
            }
        }
    }
    return problem_list;
}

function get_favorite_list() {
    let problem_list = [];
    for (let i = 1; i <= TOTAL_LEVEL; i++) {
        let source = convert_json(i, get_questions(i), true);
        problem_list = problem_list.concat(source);
    }
    return problem_list;
}

function start_generate() {
    let div = document.getElementById('questions');
    let selected = document.getElementById('level');
    let mixed = selected.value[0] === 'M' || selected.value === 'F0';
    generate_questions(get_problem_list(), (mixed ? 20 : 0), div);
}

function show_all_answers() {
    if (problems.length === 0) start_generate();
    problems.forEach(p => show_answer(p.body, p.question_line, p.part1, p.answer, p.part2, p.problem, p.sentence));
}

function show_voc_card() {
    let div = document.getElementById('questions');
    generateVocCards(get_problem_list(), div);
}

function fast_voc_test() {
    let div = document.getElementById('questions');
    generateFastCheck(get_problem_list(), div);
}

function setting() {
    document.getElementById('questions').innerHTML = "<div class=\"setting_div\"><input type=\"checkbox\" id=\"shuffle\" checked=\"\">隨機排序</div>\n" +
        "    <div class=\"setting_div\"><input type=\"checkbox\" id=\"accent_display\" checked=\"\">在單字卡中顯示重音</div>\n" +
        "    <div class=\"setting_div\"><input type=\"checkbox\" id=\"star_display\" checked=\"\">顯示星號控制項目</div>\n" +
        "    <div class=\"setting_div\"><input type=\"checkbox\" id=\"star_removing\" checked=\"\">「快速檢驗」點選「學會了」之後，自動移除星號項目</div>\n" +
        "    <div class=\"setting_div\"><input type=\"checkbox\" id=\"star_adding\" checked=\"\">「快速檢驗」點選「還不會」之後，自動加入星號項目</div>\n" +
        "    <div class=\"setting_div\"><input type=\"checkbox\" id=\"highlight_link\" checked=\"\">在單字卡中顯示同音漢字超連結</div>\n" +
        "    <div class=\"export-row setting_div\">\n" +
        "        <span class=\"label\">導出/導出星號標示</span>\n" +
        "        <input type=\"button\" value=\"導入\" onclick=\"importDatabase()\" class=\"button\">\n" +
        "        <span class=\"hint\">可以藉由將別的裝置的文本複製、貼到下方輸入框後按導入按鈕，即可實現跨裝置同步</span>\n" +
        "        <textarea id=\"database\"></textarea>\n" +
        "    </div>\n" +
        "    <div class=\"export-row setting_div\">\n" +
        "        <span class=\"label\">重置星號標示</span>\n" +
        "        <input type=\"button\" value=\"重置\" onclick=\"resetDatabase()\" class=\"button\">\n" +
        "        <span class=\"hint\">如發生設定問題，可點擊此按鈕重置</span>\n" +
        "    </div>\n" +
        "    <div class=\"setting_div\">喜好項目顯示單位<span class=\"hint\">分割單元時、要以多少個單字為單位(設定完請重新整理)</span><input type=\"number\"\n" +
        "                                                                                                           id=\"chunk\">\n" +
        "    </div>\n" +
        "    <div class=\"export-row setting_div\">\n" +
        "        <span class=\"label\">導出/導出權重表</span>\n" +
        "        <input type=\"button\" value=\"導入\" onclick=\"importWeight()\" class=\"button\">\n" +
        "        <span class=\"hint\">權重表是用以在單字檢驗項目中，為使用者篩選出較不擅長的單字</span>\n" +
        "        <textarea id=\"weights\"></textarea>\n" +
        "    </div>\n" +
        "    <div class=\"export-row setting_div\">\n" +
        "        <span class=\"label\">重置權重表</span>\n" +
        "        <input type=\"button\" value=\"重置\" onclick=\"resetWeight()\" class=\"button\">\n" +
        "        <span class=\"hint\">如發生設定問題，可點擊此按鈕重置</span>\n" +
        "    </div>";
    document.getElementById('database').value = exportDatabase();
    document.getElementById('weights').value = exportWeight();
    document.getElementById('star_removing').checked = isStarRemoving();
    document.getElementById('star_removing').addEventListener('click', () => setStarRemoving(!isStarRemoving()));
    document.getElementById('star_adding').checked = isStarAdding();
    document.getElementById('star_adding').addEventListener('click', () => setStarAdding(!isStarAdding()));
    document.getElementById('highlight_link').checked = isHighlight();
    document.getElementById('highlight_link').addEventListener('click', () => setHighlight(!isHighlight()));
    document.getElementById('shuffle').checked = isShuffle();
    document.getElementById('shuffle').addEventListener('click', () => setShuffle(!isShuffle()));
    document.getElementById('accent_display').checked = isAccentDisplay();
    document.getElementById('accent_display').addEventListener('click', () => setAccentDisplay(!isAccentDisplay()));
    document.getElementById('star_display').checked = isStarDisplay();
    document.getElementById('star_display').addEventListener('click', () => setStarDisplay(!isStarDisplay()));
    document.getElementById('chunk').value = getChunk();
    document.getElementById('chunk').addEventListener('input', e => setChunk(parseInt(e.target.value)));
}

function isShuffle() {
    let shuffle = localStorage.getItem("shuffle");
    if (!shuffle) return true;
    return shuffle === "true";
}

function setShuffle(value) {
    localStorage.setItem("shuffle", value === true ? "true" : "false");
}

function isStarDisplay() {
    let star = localStorage.getItem("star_display");
    if (!star) return true;
    return star === "true";
}

function setStarDisplay(value) {
    localStorage.setItem("star_display", value === true ? "true" : "false");
}

function isStarRemoving() {
    let sr = localStorage.getItem("star_removing");
    if (!sr) return false;
    return sr === "true";
}

function setStarRemoving(value) {
    localStorage.setItem("star_removing", value === true ? "true" : "false");
}

function isStarAdding() {
    let sr = localStorage.getItem("star_adding");
    if (!sr) return false;
    return sr === "true";
}

function setStarAdding(value) {
    localStorage.setItem("star_adding", value === true ? "true" : "false");
}

function isHighlight() {
    let sr = localStorage.getItem("highlight_link");
    if (!sr) return true;
    return sr === "true";
}

function setHighlight(value) {
    localStorage.setItem("highlight_link", value === true ? "true" : "false");
}

function isAccentDisplay() {
    let accent = localStorage.getItem("accent_display");
    if (!accent) return true;
    return accent === "true";
}

function setAccentDisplay(value) {
    localStorage.setItem("accent_display", value === true ? "true" : "false");
}

function getChunk() {
    let chunk = localStorage.getItem("chunk");
    if (!chunk) return 40;
    return parseInt(chunk);
}

function setChunk(value) {
    if (value <= 0) {
        alert('不合理的數字');
        return;
    }
    localStorage.setItem("chunk", value);
}
