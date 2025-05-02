const scale = 0.5;
const font_size_main = 60 / scale;
const font_size_sub = 30 / scale;
const font_color = "#000000";
const accent_width_main = 4 / scale;
const accent_width_sub = 3 / scale;
const accent_color = "#b8b8b8";

const line_space = 5 / scale;

const margin_x = 20 / scale;
const margin_y = 5 / scale;
const space_per_voc = font_size_main + font_size_sub + margin_y + accent_width_sub;

function generateVocCards(problem_list, div) {
    div.innerHTML = "";

    for (let i = 0; i < problem_list.length; i++) {
        let voc = getVocCanvas(problem_list[i]);
        let voc_box = document.createElement('span');
        let chi = document.createElement('span');
        let box = document.createElement("div");
        chi.innerHTML = problem_list[i].chinese;
        chi.classList.add('voc_chinese');
        voc_box.classList.add('voc_box');
        voc_box.appendChild(voc);
        if (isStarDisplay()) box.appendChild(getFavoriteDisplay(problem_list[i].level, problem_list[i].index));
        box.appendChild(voc_box);
        box.appendChild(chi);
        div.appendChild(box);
    }
}

function getVocCanvas(voc_obj) {
    let canvas = document.createElement("canvas");
    canvas.height = space_per_voc;
    canvas.width = drawVocabulary(voc_obj, canvas.getContext('2d')) + 2 * margin_x;
    canvas.style.height = canvas.height * scale + "px";
    canvas.style.width = canvas.width * scale + "px";
    drawVocabulary(voc_obj, canvas.getContext('2d'));
    return canvas;
}

// voc is composed of sentence, voc, voc_chinese, translate, blank
function drawVocabulary(voc_obj, ctx) {
    let source = convertToSource(voc_obj);
    let accent = getAccentArray(voc_obj.reading !== undefined ? voc_obj.reading.length : voc_obj.voc.length,
        voc_obj.accent, voc_obj.reading !== undefined ? voc_obj.reading : voc_obj.voc);
    return drawTextDetailed(source, accent, ctx, margin_x, margin_y / 2 + accent_width_sub);
}

// return total width
function drawTextDetailed(source, accent, ctx, base_x, base_y) {
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
            ctx, base_x + dx + width / 2, base_y + font_size_sub + line_space, font_size_main, accent_width_main);
        fillTextCenterWithAccent(sub_text, (accent !== undefined ? accent.slice(index) : undefined),
            ctx, base_x + dx + width / 2, base_y, font_size_sub, accent_width_sub);
        dx += width + line_space;
        index += kanas;
    }
    return dx - line_space;
}

function measureTextWidth(text, ctx, size) {
    ctx.font = size + "px serif";
    return ctx.measureText(text).width;
}

// 在指定位置填入置中文字
function fillTextCenterWithAccent(text, accent, ctx, base_x, base_y, size, line_width) {
    if (text === undefined || text.length === 0) return;
    ctx.font = size + "px serif"
    ctx.fillStyle = font_color;
    let width = ctx.measureText(text).width;
    let start_x = base_x - width / 2;
    let start_y = base_y + size * 0.9;
    let dx = width / text.length;

    ctx.fillText(text, start_x, base_y + size * 0.75);
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
    if (accent === -1) { // 未登記重音
        return undefined;
    } else if (accent === 0) { // 平板音
        result.push(0);
        for (let i = 0; i < voc_length; i++) result.push(1);
    } else if (accent === 1) { // 頭高音
        result.push(1);
        for (let i = 0; i < voc_length; i++) result.push(0);
    } else if (accent === voc_length) { // 尾高音
        result.push(0);
        for (let i = 1; i < voc_length; i++) result.push(1);
        result.push(0);
    } else { // 中高音
        result.push(0);
        for (let i = 1; i < accent; i++) result.push(1);
        for (let i = 0; i <= (voc_length - accent); i++) result.push(0);
    }
    if (isYoon) result.unshift(result[0]);
    return result;
}

const hira = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん" +
    "っゃゅょがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ";
const kata = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
    "ッャュョガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ";
const yoon = "ゃゅょャュョ";

function isKana(char) {
    return hira.includes(char) || kata.includes(char);
}
