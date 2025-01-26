const scale = 0.5;
const font_size_main = 40 / scale;
const font_size_sub = 20 / scale;
const font_size_sub_long = 15 / scale;
const long_ratio = 4;
const line_space = 5 / scale;

const margin_x = 20 / scale;
const margin_y = 5 / scale;
const space_per_voc = font_size_main + font_size_sub + margin_y;

function generateVocCards(problem_list, div) {
    div.innerHTML = "";
    let voc_object = to_vocs(problem_list);
    let vocs = voc_object.voc;
    let chinese = voc_object.chinese;

    for (let i = 0; i < vocs.length; i++) {
        let voc = getVocCanvas(vocs[i]);
        let chi = document.createElement('span');
        let box = document.createElement("div");
        chi.innerHTML = chinese[i];
        chi.classList.add('voc_chinese');
        box.appendChild(voc);
        box.appendChild(chi);
        div.appendChild(box);
    }
}

function getVocCanvas(voc) {
    let canvas = document.createElement("canvas");
    canvas.height = space_per_voc;
    canvas.width = drawVocabulary(voc, canvas.getContext('2d')) + 2 * margin_x;
    canvas.style.height = canvas.height * scale + "px";
    canvas.style.width = canvas.width * scale + "px";
    drawVocabulary(voc, canvas.getContext('2d'));
    return canvas;
}

// voc is composed of sentence, voc, voc_chinese, translate, blank
function drawVocabulary(voc, ctx) {
    let source = convertToSource(voc);
    return drawTextDetailed(source, ctx, margin_x, margin_y / 2);
}

// return total width
function drawTextDetailed(source, ctx, base_x, base_y) {
    let dx = 0;
    for (let object of source) {
        let main_text = "";
        let sub_text = "";
        if (object instanceof Array) { // This composed of Kanji and Katagana
            main_text = object[0];
            sub_text = object[1];
        } else { // This is simply katagana
            main_text = object;
        }
        let ratio = sub_text.length / main_text.length;
        let main_width = fillText(main_text, ctx, base_x + dx, base_y + font_size_sub + line_space, font_size_main);
        let sub_width = fillTextCenter(sub_text, ctx, base_x + dx + main_width / 2, base_y, ratio >= long_ratio ? font_size_sub_long : font_size_sub);
        let width = Math.max(main_width, main_width / 2 + sub_width / 2);
        dx += width + line_space;
    }
    return dx;
}

// return text width
function fillText(text, ctx, base_x, base_y, size) {
    ctx.font = size + "px serif"
    ctx.fillText(text, base_x, base_y + size * 0.75);
    return ctx.measureText(text).width;
}

// return text width
function fillTextCenter(text, ctx, base_x, base_y, size) {
    ctx.font = size + "px serif"
    ctx.fillText(text, base_x - ctx.measureText(text).width / 2, base_y + size * 0.75);
    return ctx.measureText(text).width;
}

// convert plain text to array with reading split
function convertToSource(text) {
    if (text.indexOf('(') === -1) return [text]; // 不包含"("，表示沒有漢字
    let result = [];
    let kanji = text.substring(0, text.indexOf('('));
    let reading = text.substring(text.indexOf('(') + 1, text.indexOf(')'));
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
        /*if (kanji_ptr === 0) {
            result.push([kanji[kanji_ptr], reading.substring(0, reading_base + 1)]);
            continue;
        }*/
        let kanji_base = kanji_ptr - 1;
        while (kanji_base >= 0 && !isKana(kanji[kanji_base])) kanji_base--;
        if (kanji_base === -1) {
            result.push([kanji.substring(0, kanji_ptr + 1), reading.substring(0, reading_ptr + 1)]);
            break;
        }
        while (reading_ptr >= 0 && (kanji[kanji_base] !== reading[reading_ptr])) reading_ptr--;
        result.push([kanji.substring(kanji_base + 1, kanji_ptr + 1), reading.substring(reading_ptr + 1, reading_base + 1)]);
        kanji_ptr = kanji_base + 1;
    }

    return result.reverse();
}

const hira = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん" +
    "っゃゅょがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ";
const kata = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
    "ッャュョガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ";

function isKana(char) {
    return hira.includes(char) || kata.includes(char);
}
