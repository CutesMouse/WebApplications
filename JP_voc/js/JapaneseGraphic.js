const scale = 0.5;
const font_size_main = 60 / scale;
const font_size_sub = 30 / scale;
const font_color = "#000000";
const searchable_color = "#316fea";
const highlight_color = "#ff0000"
const accent_width_main = 4 / scale;
const accent_width_sub = 3 / scale;
const accent_color = "#b8b8b8";

const line_space = 5 / scale;

const margin_x = 20 / scale;
const margin_y = 5 / scale;
const space_per_voc = font_size_main + font_size_sub + margin_y + accent_width_sub;

const font_path = "url(./../font/UDDigiKyokashoN-R.ttc)";
const font_name = "UD Digi Kyokasho NP-R";
loadFont();


function generateVocCards(problem_list, div, highlight = undefined) {
    div.innerHTML = "";

    for (let i = 0; i < problem_list.length; i++) {
        let voc = getVocCanvas(problem_list[i], div, isHighlight(), highlight);
        let voc_box = createElement('span', 'voc_box');
        let text_info = createElement('div', 'text_info');
        let chi = createElement('span', 'voc_chinese', problem_list[i].chinese);
        let tag = createElement("div", "part-of-speech", problem_list[i].speech);
        let box = createElement("div", "vocabulary_div");
        text_info.appendChild(tag);
        text_info.appendChild(chi);
        voc_box.appendChild(voc);
        if (isStarDisplay()) box.appendChild(getFavoriteDisplay(problem_list[i].level, problem_list[i].index));
        box.appendChild(voc_box);
        box.appendChild(text_info);
        div.appendChild(box);
    }
}

function getVocCanvas(voc_obj, div = undefined, link_enable = false, highlight = undefined) {
    let canvas = createElement("canvas");
    canvas.click_tasks = [];
    canvas.height = space_per_voc;
    canvas.width = drawVocabulary(voc_obj, canvas.getContext('2d'), canvas, link_enable, highlight) + 2 * margin_x;
    canvas.style.height = canvas.height * scale + "px";
    canvas.style.width = canvas.width * scale + "px";
    canvas.click_tasks = [];
    drawVocabulary(voc_obj, canvas.getContext('2d'), canvas, link_enable, highlight);

    // 點擊反應
    if (link_enable) canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.offsetX;
        const my = e.offsetY;

        for (let task of canvas.click_tasks) {
            if (isInside(mx, my, task, canvas)) {
                generateVocCards(vocSearch(task.content), div, task.content);
            }
        }

    });
    return canvas;
}

// voc is composed of sentence, voc, voc_chinese, translate, blank
function drawVocabulary(voc_obj, ctx, canvas, link_enable = false, highlight = undefined) {
    let source = convertToSource(voc_obj);
    let accent = getAccentArray(voc_obj.reading !== undefined ? voc_obj.reading.length : voc_obj.voc.length,
        voc_obj.accent, voc_obj.reading !== undefined ? voc_obj.reading : voc_obj.voc);
    return drawTextDetailed(source, accent, ctx, margin_x, margin_y / 2 + accent_width_sub, canvas, link_enable, highlight);
}

// return total width
function drawTextDetailed(source, accent, ctx, base_x, base_y, canvas, link_enable, highlight = undefined) {
    let dx = 0;
    let index = 0;
    for (let object of source) {
        let main_text = "";
        let sub_text = "";
        let kanas = 0;
        if (object instanceof Array) { // This composed of Kanji and Katagana
            main_text = object[0];
            sub_text = object[1];
            kanas = sub_text.length;
        } else { // This is simply katagana
            main_text = object;
            kanas = main_text.length;
        }
        let main_width = measureTextWidth(main_text, ctx, font_size_main);
        let sub_width = measureTextWidth(sub_text, ctx, font_size_sub);
        let width = Math.max(main_width, sub_width);

        fillTextCenterWithAccent(main_text, (accent === undefined || object instanceof Array) ? undefined : accent.slice(index),
            ctx, base_x + dx + width / 2, base_y + font_size_sub + line_space,
            font_size_main, accent_width_main, canvas, link_enable, highlight);
        fillTextCenterWithAccent(sub_text, (accent !== undefined ? accent.slice(index) : undefined),
            ctx, base_x + dx + width / 2, base_y,
            font_size_sub, accent_width_sub, canvas, link_enable, highlight);
        dx += width + line_space;
        index += kanas;
    }
    return dx - line_space;
}

// 在指定位置填入置中文字
function fillTextCenterWithAccent(text, accent, ctx, base_x, base_y, size, line_width, canvas, link_enable, highlight) {
    if (text === undefined || text.length === 0) return;
    ctx.font = size + "px " + font_name
    ctx.fillStyle = font_color;
    let width = ctx.measureText(text).width;
    let start_x = base_x - width / 2;
    let start_y = base_y + size * 0.9;
    let dx = width / text.length;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === highlight) {
            ctx.fillStyle = highlight_color;
        } else if (link_enable && vocSearch(text[i]).length > 1) {
            ctx.fillStyle = searchable_color;
            canvas.click_tasks.push({
                from_x: start_x + i * dx, to_x: start_x + (i + 1) * dx,
                from_y: base_y, to_y: base_y + size * 0.75, content: text[i]
            });
        } else ctx.fillStyle = font_color;
        ctx.fillText(text[i], start_x + i * dx, base_y + size * 0.75);
    }
    // ctx.fillText(text, start_x, base_y + size * 0.75);
    if (accent === undefined || !isAccentDisplay()) return;
    for (let i = 0; i < text.length; i++) {
        fillHorizontalLine(ctx, start_x + i * dx, start_y - accent[i] * dx, dx, line_width);
        if (accent[i] !== accent[i + 1]) {
            fillVerticalLine(ctx, start_x + (i + 1) * dx, start_y - dx - line_width / 2, dx + line_width, line_width);
        }
    }
}

// 在指定位置畫上水平線
function fillHorizontalLine(ctx, base_x, base_y, length, width) {
    ctx.beginPath();
    ctx.strokeStyle = accent_color;
    ctx.moveTo(base_x, base_y);
    ctx.lineTo(base_x + length, base_y);
    ctx.lineWidth = width;
    ctx.stroke();
}

// 在指定位置畫上垂直線
function fillVerticalLine(ctx, base_x, base_y, length, width) {
    ctx.beginPath();
    ctx.fillStyle = accent_color;
    ctx.moveTo(base_x, base_y);
    ctx.lineTo(base_x, base_y + length);
    ctx.lineWidth = width;
    ctx.stroke();
}

function isInside(offsetX, offsetY, task, canvas) {
    let mx = (offsetX / canvas.clientWidth) * canvas.width;
    let my = (offsetY / canvas.clientHeight) * canvas.height;
    return (mx > task.from_x && mx < task.to_x && my > task.from_y && my < task.to_y);
}

function measureTextWidth(text, ctx, size) {
    ctx.font = size + "px " + font_name;
    return ctx.measureText(text).width;
}

// convert plain text to array with reading split
function convertToSource(voc_object) {
    if (voc_object.kanji === undefined) return [voc_object.voc]; // 不包含"("，表示沒有漢字
    let result = [];
    let reading = voc_object.reading;
    let kanji = voc_object.kanji;
    let reading_ptr = reading.length - 1;
    for (let kanji_ptr = kanji.length - 1; kanji_ptr >= 0; kanji_ptr--) {
        // 前後兩個字都是假名 就並列前面的假名
        if (kanji_ptr !== kanji.length - 1 && isKana(kanji[kanji_ptr + 1]) && isKana(kanji[kanji_ptr])) {
            result[result.length - 1] = kanji[kanji_ptr] + result[result.length - 1];
            reading_ptr--;
            continue;
        }
        // 如果這個字是假名 直接列入結果
        if (reading[reading_ptr] === kanji[kanji_ptr]) {
            result.push(kanji[kanji_ptr]);
            reading_ptr--;
            continue;
        }
        // 如果是漢字 一路往前推到前面的字等於讀音的字
        let reading_base = reading_ptr;
        let kanji_base = kanji_ptr - 1;
        while (kanji_base >= 0 && !isKana(kanji[kanji_base])) kanji_base--;
        if (kanji_base === -1) {
            result.push([kanji.substring(0, kanji_ptr + 1), reading.substring(0, reading_ptr + 1)]);
            break;
        }
        while (reading_ptr >= 0 && (kanji[kanji_base] !== reading[reading_ptr]) || reading_ptr === reading_base) reading_ptr--;
        result.push([kanji.substring(kanji_base + 1, kanji_ptr + 1), reading.substring(reading_ptr + 1, reading_base + 1)]);
        kanji_ptr = kanji_base + 1;
    }
    return result.reverse();
}

// 生成重音序列 ex. 0011
// 結果長度應為單字長+1
function getAccentArray(voc_length, accent, voc) {
    let result = [];
    let isYoon = voc.length > 1 && yoon.includes(voc[1]);
    if (isYoon) { // 開頭為拗音
        voc_length = voc_length - 1; // 去掉開頭
    }
    if (accent === undefined || (accent.length === 1 && accent[0] === -1)) { // 未登記重音
        return undefined;
    } else if (accent[0] === 0) { // 平板音
        result.push(0);
        for (let i = 0; i < voc_length; i++) result.push(1);
    } else if (accent[0] === 1) { // 頭高音
        result.push(1);
        for (let i = 0; i < voc_length; i++) result.push(0);
    } else if (accent[0] === voc_length) { // 尾高音
        result.push(0);
        for (let i = 1; i < voc_length; i++) result.push(1);
        result.push(0);
    } else { // 中高音
        result.push(0);
        for (let i = 1; i < accent[0]; i++) result.push(1);
        for (let i = 0; i <= (voc_length - accent[0]); i++) result.push(0);
    }
    if (accent.length > 1) {
        let inverse = false;
        let j = 1;
        for (let i = 0; i < result.length; i++) {
            if (accent[j] === i) {
                j++;
                inverse = !inverse;
            }
            if (inverse) result[i] = (result[i] === 0 ? 1 : 0);
        }
    }
    if (isYoon) result.unshift(result[0]);
    return result;
}

function loadFont() {
    let font = new FontFace(font_name, font_path);
    font.load().then(function (loadedFont) {
        document.fonts.add(loadedFont);
    }).catch(function (error) {
        console.error('字體載入失敗：', error);
    });
}
