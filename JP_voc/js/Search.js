function search() {
    document.getElementById('questions').innerHTML =
        "    <div class=\"export-row setting_div\">\n" +
        "        <span class=\"label\">關鍵字搜尋</span>\n" +
        "        <input type=\"button\" value=\"搜尋\" onclick=\"submitSearch()\" class=\"button\">\n" +
        "        <span class=\"hint\">輸入關鍵字以搜尋，支援regex搜尋</span>\n" +
        "        <textarea id=\"search_keyword\"></textarea>\n" +
        "    </div>\n" +
        "<div class=\"setting_div\"><input type=\"checkbox\" id=\"search_defined_level\" checked=\"\">只搜尋當前等級的內容</div>" +
        "<div class=\"setting_div\"><input type=\"checkbox\" id=\"search_kanaonly\" checked=\"\">搜尋純假名的內容</div>";
    document.getElementById('search_keyword').value = "";
    document.getElementById('search_keyword').onkeydown = function (e) {
        if (e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault();
            return false;
        }
    };
    document.getElementById('search_defined_level').checked = false;
    document.getElementById('search_kanaonly').checked = false;
}

function submitSearch() {
    let keyword = document.getElementById('search_keyword').value;
    let only_kana = document.getElementById('search_kanaonly').checked;
    let defined_level = document.getElementById('search_defined_level').checked;

    let matches = searchAllVocs(keyword, only_kana, getMaxSearchResult(), defined_level);
    let div = document.getElementById('questions');
    generateVocCards(matches, div, true);
}

function searchAllVocs(keyword, only_kana, max_result = 100, defined_level = false) {
    let result = [];
    if (keyword === "") return result;
    let vocs = getAllVocs(defined_level ? [getCurrentLevel()] : getAllLevels());
    let re = new RegExp(keyword, "g");

    for (let i = 0; i < vocs.length; i++) {
        if (result.length === max_result) break;
        let voc = vocs[i];

        if (only_kana && voc.kanji !== undefined) continue;
        if (voc.kanji !== undefined && re.exec(voc.kanji)) result.push(voc);
        else if (re.exec(voc.voc)) result.push(voc);
        else if (re.exec(voc.chinese)) result.push(voc);
    }
    return result;
}

function getMaxSearchResult() {
    let max_search_result = localStorage.getItem("max_search_result");
    if (!max_search_result) return 100;
    return parseInt(max_search_result);
}

function setMaxSearchResult(value) {
    if (value <= 0) {
        alert('不合理的數字');
        return;
    }
    localStorage.setItem("max_search_result", value);
}