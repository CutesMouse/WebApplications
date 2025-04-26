// AUTO LOAD
document.addEventListener('DOMContentLoaded', () => loadOptions(false));
const TOTAL_LEVEL = 70;
const CHUNK = 40;

let problems = [];

function loadOptions(favorite_only = false) {
    let selection_box = document.getElementById('level');
    let options = selection_box.children;

    updateFavoriteOptions();
    if (favorite_only) return;

    for (let i = 0; i < options.length; i++) {
        let option = options[i];
        let value = option.value;
        if (value[0] === 'F') continue; // Favorite另外載
        let level = 0;
        if (value[0] === 'M') { // 綜合
            level = parseInt(value.substring(1).split('-')[0]);
        } else level = parseInt(option.value);
        option.disabled = get_questions(level) === "";
    }
}

function updateFavoriteOptions() {
    let selection_box = document.getElementById('level');
    let options = selection_box.children;
    let favorite = get_favorite_list();
    let entries = Math.ceil(favorite.length / CHUNK);
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
                option.innerHTML = "Favorite." + ident + " (" + Math.min(favorite.length - CHUNK * (ident - 1), CHUNK) + "題)"
            }
        }
    }
    //console.log(last_option, entries);
    // 再把新的節點加上去
    for (let i = parseInt(last_option.value.substring(1)) + 1; i <= entries; i++) {
        let option = document.createElement('option');
        option.setAttribute("value", 'F' + i);
        option.innerHTML = "Favorite." + i + " (" + Math.min(favorite.length - CHUNK * (i - 1), CHUNK) + "題)"
        selection_box.insertBefore(option, last_option.nextSibling);
        last_option = option;
    }

}

function get_problem_list() {
    let val = document.getElementById('level').value;
    let mixed = val[0] === 'M';
    let favorite = val[0] === 'F';
    let problem_list = [];
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
    let mixed = document.getElementById('level').value[0] === 'M';
    document.body.classList.remove('voc_card');
    generate_questions(get_problem_list(), (mixed ? 20 : 0), div);
}

function show_all_answers() {
    if (problems.length === 0) start_generate();
    problems.forEach(p => show_answer(p.box, p.part1, p.answer, p.part2, p.problem, p.sentence));
}

function show_voc_card() {
    let div = document.getElementById('questions');
    document.body.classList.add('voc_card');
    generateVocCards(get_problem_list(), div);
}

function setting() {
    document.getElementById('questions').innerHTML = "<div><input type=\"checkbox\" id=\"shuffle\" checked>隨機排序</div>\n" +
        "    <div>導出/導出星號標示<span class=\"hint\">可以藉由將別的裝置的文本複製、貼到右邊輸入框後按導入按鈕，即可實現跨裝置同步</span>\n" +
        "        <input type=\"button\" value=\"導入\" onclick=\"importDatabase()\" class=\"button\">\n" +
        "        <textarea id=\"database\"></textarea></div>\n" +
        "    <div>重置星號標示<span class=\"hint\">如發生設定問題，可點擊此按鈕重置</span>\n" +
        "        <input type=\"button\" value=\"重置\" onclick=\"resetDatabase()\" class=\"button\"></div>";
    document.getElementById('database').value = JSON.stringify(database);
    document.getElementById('shuffle').checked = isShuffle();
    document.getElementById('shuffle').addEventListener('click', () => setShuffle(!isShuffle()))
}

function isShuffle() {
    let shuffle = localStorage.getItem("shuffle");
    if (!shuffle) return true;
    return shuffle === "true";
}

function setShuffle(value) {
    localStorage.setItem("shuffle", value === true ? "true" : "false");
}