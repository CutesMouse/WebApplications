function get_questions(level, type = undefined) {
    if (type === undefined) type = getCurrentLevel();
    switch (type) {
        case "N1":
            return get_questions_n1(level);
        case "N2":
            return get_questions_n2(level);
        case "N3":
            return get_questions_n3(level);
    }
}

function getCurrentLevel() {
    return LEVEL;
}

function isAccentEnable(level = undefined) {
    if (level === undefined) level = getCurrentLevel();
    switch (level) {
        case 'N3':
            return false;
        case 'N2':
            return true;
        case 'N1':
            return true;
        default:
            return false;
    }
}

function getTotalLevel(level = undefined) {
    if (level === undefined) level = getCurrentLevel();
    switch (level) {
        case 'N3':
            return 40;
        case 'N2':
            return 70;
        case 'N1':
            return 81;
        default:
            return false;
    }
}

function getAllLevels() {
    return ['N3', 'N2', 'N1'];
}

function getAllVocs(levels = getAllLevels()) {
    result = [];
    for (let L of levels) {
        for (let i = 1; i <= getTotalLevel(L); i++) {
            let source = get_questions(i, L);
            if (source === "") continue;
            let problems = convert_json(i, source, false, L);
            result.push(...problems);
        }
    }
    return result;
}