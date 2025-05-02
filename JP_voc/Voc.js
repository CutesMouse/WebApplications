function convert_json(level, source, favorite_only = false) {
    let ary = source.split("\n");
    let result = [];
    for (let index = 0; index < ary.length; index++) {
        if (favorite_only && !isFavorite(level, index)) continue;
        let content = ary[index].split("/");
        let voc = content[0];
        let accent = ACCENT_ENABLE ? parseInt(content[1]) : -1;
        let voc_chinese = content[ACCENT_ENABLE ? 2 : 1];
        let sentences = [];
        let kanji = undefined;
        let reading = undefined;
        if (voc.indexOf('(') !== -1) {
            kanji = voc.substring(0, voc.indexOf('('));
            reading = voc.substring(voc.indexOf('(') + 1, voc.indexOf(')'));
        }
        for (let i = (2 + ACCENT_ENABLE); (i + 1) < content.length; i += 2) {
            sentences.push({
                "sentence": content[i],
                "translation": content[i + 1],
                "blank": content[i].split('{')[1].split('}')[0]
            });
        }
        result.push({
            "level": level,
            "index": index,
            "sentences": sentences,
            "voc": voc,
            "chinese": voc_chinese,
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
