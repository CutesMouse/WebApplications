function generate_questions(problem_list, number, div) {
    if (isShuffle()) problem_list = shuffle(problem_list);
    if (number === 0) number = problem_list.length;
    if (problem_list.length === 0) return;

    div.innerHTML = "";

    let last_answer = null;
    for (let i = 0; i < number; i++) {
        /* 生成單字/例句資訊 */
        let problem = problem_list[i];
        let sentence = random_sentence(problem);

        /* 生成對應HTML元素 */
        let card = createElement('div', 'question-card');
        let header = generate_header("Day." + problem.level + "・第 " + (problem.index + 1) + " 題", problem);
        let body = createElement("div", 'question-body');
        let question_line = createElement("div", "question-line");
        let part1 = createElement('span', 'question-text', sentence.sentence.split("{")[0]);
        let part2 = createElement('span', 'question-text', sentence.sentence.split("}")[1]);
        let answer = createElement('input', "answer");
        div.appendChild(card);
        card.appendChild(header);
        card.appendChild(body);
        body.appendChild(question_line);
        question_line.appendChild(part1);
        question_line.appendChild(answer);
        question_line.appendChild(part2);
        answer.type = "text";
        answer.attempt = 0;
        answer.onkeyup = function (event) {
            if (event.key !== "Enter") return;
            submit(body, question_line, part1, answer, part2, problem, sentence);
        }

        /* 儲存資料 */
        problems.push({
            "question_line": question_line,
            "body": body,
            "part1": part1,
            "answer": answer,
            "part2": part2,
            "problem": problem,
            "sentence": sentence
        });

        /* Enter快速切換輸入位置 */
        if (last_answer != null) {
            last_answer.to_next = function () {
                answer.focus();
            }
        }
        last_answer = answer;
    }
}

function add_hint(body, answer, problem, sentence) {
    let hint = createElement('span');
    if (answer.attempt === 0) {
        hint.classList.add("translate");
        hint.innerHTML = sentence.translation;
        body.appendChild(hint);
        answer.attempt = 1;
    } else if (answer.attempt === 1) {
        hint.classList.add("voc_chinese");
        hint.innerHTML = problem.chinese;
        body.appendChild(hint);
        answer.attempt = 2;
    } else if (answer.attempt === 2) {
        hint.classList.add("voc");
        hint.innerHTML = problem.voc;
        body.appendChild(hint);
        answer.attempt = 3;
    }
}

function show_answer(body, question_line, part1, answer, part2, problem, sentence) {
    let correct = document.createElement('span');
    let r1 = createElement('span', 'response', part1.innerHTML);
    let ra = createElement('span', 'response_answer', sentence.blank);
    let r2 = createElement('span', 'response', part2.innerHTML);
    body.innerHTML = "";
    question_line.innerHTML = "";
    body.appendChild(question_line);
    question_line.appendChild(correct);
    correct.appendChild(r1);
    correct.appendChild(ra);
    correct.appendChild(r2);
    answer.attempt = 0;
    for (let i = 0; i < 3; i++) add_hint(body, answer, problem, sentence);
}

function submit(body, question_line, part1, answer, part2, problem, sentence) {
    if (isCorrect(answer.value, problem, sentence)) {
        show_answer(body, question_line, part1, answer, part2, problem, sentence);
        if (answer.to_next != null) answer.to_next();
    } else {
        add_hint(body, answer, problem, sentence);
    }
}

function isCorrect(answer_value, problem, sentence) {
    if (answer_value === sentence.blank) return true;
    if (problem.voc.indexOf('(') !== -1) {
        let kata = problem.voc.split('(')[1].split(')')[0];
        let kanji = problem.voc.split('(')[0];
        if (answer_value === kata || answer_value === kanji) return true;
    } else if (answer_value === problem.voc) return true;
    return false;
}

function generate_header(info, problem) {
    let header = createElement('div', "question-header");
    let meta = createElement('div', "question-meta");
    header.appendChild(meta);
    meta.innerHTML = info;
    if (isStarDisplay()) header.appendChild(getFavoriteDisplay(problem.level, problem.index));
    return header;
}

function createElement(type, classname = "", innerHTML = "") {
    let item = document.createElement(type);
    if (classname) item.classList.add(classname);
    if (innerHTML) item.innerHTML = innerHTML;
    return item;
}