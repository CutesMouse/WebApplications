function convert_json(level, source, favorite_only = false) {
    let ary = source.split("\n");
    let result = [];
    for (let index = 0; index < ary.length; index++) {
        if (favorite_only && !isFavorite(level, index)) continue;
        let content = ary[index].split("/");
        let voc = content[0];
        let accent = ACCENT_ENABLE ? parseInt(content[1]) : -1;
        let voc_chinese = content[ACCENT_ENABLE ? 3 : 2];
        let sentences = [];
        let speech = content[ACCENT_ENABLE ? 2 : 1];
        let kanji = undefined;
        let reading = undefined;
        if (voc.indexOf('(') !== -1) {
            kanji = voc.substring(0, voc.indexOf('('));
            reading = voc.substring(voc.indexOf('(') + 1, voc.indexOf(')'));
        }
        for (let i = (3 + ACCENT_ENABLE); (i + 1) < content.length; i += 2) {
            sentences.push({
                "sentence": content[i], "translation": content[i + 1], "blank": content[i].split('{')[1].split('}')[0]
            });
        }
        result.push({
            "level": level,
            "index": index,
            "sentences": sentences,
            "voc": voc,
            "chinese": voc_chinese,
            "speech": speech_transform(speech),
            "kanji": kanji,
            "reading": reading,
            "accent": accent
        });
    }
    return result;
}

function shuffle(items) {
    if (items.length === 0) return items;
    let cached = items.slice(0), temp, i = cached.length, rand;
    while (--i) {
        rand = Math.floor(i * Math.random());
        temp = cached[rand];
        cached[rand] = cached[i];
        cached[i] = temp;
    }
    return cached;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function random_sentence(problem) {
    let sentences = problem.sentences;
    return sentences[getRandomInt(sentences.length)];
}

function speech_transform(original) {
    const space = "・";
    let result = "";
    for (let i = 0; i < original.length; i++) {
        let char = original[i];
        let next_char = original[i + 1];
        switch (char) {
            case "自":
                if (next_char !== "他") result = result + space + "自動詞"; else {
                    result = result + space + "自他動詞";
                    i++;
                }
                break;
            case "他":
                result = result + space + "他動詞";
                break;
            case "な":
                result = result + space + "な形容詞";
                i++;
                break;
            case "い":
                result = result + space + "い形容詞";
                i++;
                break;
            case "連":
                result = result + space + "連體詞";
                i++;
                break;
            case "接":
                switch (next_char) {
                    case "頭":
                        result = result + space + "接頭語";
                        i++;
                        break;
                    case "尾":
                        result = result + space + "接尾語";
                        i++;
                        break;
                    default:
                        result = result + space + "連接詞";
                        break;
                }
                break;
            case "寒":
                result = result + space + "寒暄語";
                i++;
                break;
            case "漢":
                result = result + space + "純漢字";
                break;
            case "感":
                result = result + space + "感嘆詞";
                break;
            case "代":
                result = result + space + "代名詞";
                break;
            case "副":
                result = result + space + "副詞";
                break;
            case "慣":
                result = result + space + "慣用語";
                break;
            case "名":
                result = result + space + "名詞";
                break;
            case "疑":
                result = result + space + "疑問詞";
                break;
            case "數":
                result = result + space + "數量詞";
                break;
            case "動":
                result = result + space + "動詞";
                break;
            case "外":
                result = result + space + "外來語";
                break;
            default:
                console.log(original, "未知詞性 " + char);
                break;
        }
    }
    return (result ? result.substring(1) : "");
}

// 尋找所有含有"source"漢字的單字
function vocSearch(source) {
    if (isKana(source)) return [];
    if (voc_bank === undefined) initVocSearch();
    if (!voc_bank.has(source)) return [];
    return voc_bank.get(source);
}

// 初始化單字資料庫
let voc_bank = undefined;
function initVocSearch() {
    voc_bank = new Map();
    for (let i = 1; i <= TOTAL_LEVEL; i++) {
        let source = get_questions(i);
        if (source === "") continue;
        let problems = convert_json(i, source);
        for (let j = 0; j < problems.length; j++) {
            let problem = problems[j];
            let kanji = problem.kanji;
            if (kanji === undefined) continue;
            for (let k = 0; k < kanji.length; k++) {
                if (isKana(kanji[k])) continue;
                if (voc_bank.has(kanji[k])) {
                    voc_bank.get(kanji[k]).push(problem);
                }
                else voc_bank.set(kanji[k], [problem]);
            }
        }
    }
}

const hira = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん" +
    "っゃゅょがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ";
const kata = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
    "ッャュョガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ";
const yoon = "ゃゅょャュョ";

function isKana(char) {
    return hira.includes(char) || kata.includes(char);
}
