function generate_questions(problem_list, number, div) {

    if (isShuffle()) problem_list = shuffle(problem_list);

    if (number === 0) number = problem_list.length;
    div.innerHTML = "";

    let last_answer = null;
    for (let i = 0; i < number; i++) {
        let problem = problem_list[i];
        let box = document.createElement("div");
        let part1 = document.createElement('span');
        let part2 = document.createElement('span');
        let answer = document.createElement('input');
        let sentence = random_sentence(problem);
        answer.type = "text";
        answer.attempt = 0;
        answer.classList.add('answer');
        answer.onkeyup = function (event) {
            if (event.key !== "Enter") return;
            submit(box, part1, answer, part2, problem, sentence);
        }
        problems.push({"box": box, "part1": part1, "answer": answer, "part2": part2, "problem": problem, "sentence": sentence});
        part1.innerHTML = sentence.sentence.split("{")[0];
        part2.innerHTML = sentence.sentence.split("}")[1];
        box.appendChild(part1);
        box.appendChild(answer);
        box.appendChild(part2);
        div.appendChild(box);
        if (last_answer != null) {
            last_answer.to_next = function () {
                answer.focus();
            }
        }
        last_answer = answer;
    }
}

function add_hint(box, answer, problem, sentence) {
    let hint = document.createElement('span');
    if (answer.attempt === 0) {
        hint.classList.add("translate");
        hint.innerHTML = sentence.translation;
        box.appendChild(hint);
        answer.attempt = 1;
    } else if (answer.attempt === 1) {
        hint.classList.add("voc_chinese");
        hint.innerHTML = problem.chinese;
        box.appendChild(hint);
        answer.attempt = 2;
    } else if (answer.attempt === 2) {
        hint.classList.add("voc");
        hint.innerHTML = problem.voc;
        box.appendChild(hint);
        answer.attempt = 3;
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

function show_answer(box, part1, answer, part2, problem, sentence) {
    let correct = document.createElement('span');
    let r1 = document.createElement('span');
    let ra = document.createElement('span');
    let r2 = document.createElement('span');
    r1.classList.add('response');
    r2.classList.add('response');
    ra.classList.add('response_answer');
    correct.appendChild(r1);
    correct.appendChild(ra);
    correct.appendChild(r2);
    r1.innerHTML = part1.innerHTML;
    ra.innerHTML = sentence.blank;
    r2.innerHTML = part2.innerHTML;
    answer.attempt = 0;
    box.innerHTML = "";
    box.appendChild(correct);
    for (let i = 0; i < 3; i++) add_hint(box, answer, problem, sentence);
}

function submit(box, part1, answer, part2, problem, sentence) {
    if (isCorrect(answer.value, problem, sentence)) {
        show_answer(box, part1, answer, part2, problem, sentence);
        if (answer.to_next != null) answer.to_next();
    } else {
        add_hint(box, answer, problem, sentence);
    }
}