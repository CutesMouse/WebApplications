let weights = undefined;

function getWeight(level, index) {
    if (weights === undefined) loadWeight();
    if (weights[level] === undefined || weights[level] === null) return 0;
    if (weights[level][index] === undefined) return 0;
    return weights[level][index];
}

function loadWeight() {
    let item = localStorage.getItem("weights." + LEVEL);

    if (item === undefined || item === null) {
        weights = [];
    } else {
        weights = JSON.parse(item.replaceAll('*', 'null'));
    }
}

function exportWeight() {
    if (weights === undefined || weights === null) loadWeight();
    return JSON.stringify(weights).replaceAll('null', '*');
}

function saveWeight() {
    if (weights !== undefined) localStorage.setItem("weights." + LEVEL, exportWeight());
}

// value is a boolean number
function setWeight(level, index, value) {
    if (weights === undefined) loadWeight();
    if (weights[level] === undefined || weights[level] === null) weights[level] = [];
    weights[level][index] = value;
    saveWeight();
}

function importWeight() {
    let data_source = document.getElementById('weights');
    if (data_source === undefined || !data_source.value) {
        alert("導入失敗! 資料為空");
        return;
    }
    localStorage.setItem('weights.' + LEVEL, data_source.value);
    loadWeight();
    alert("載入權重成功!");
}

function resetWeight() {
    weights = [];
    saveWeight();
    loadWeight();
    alert("重置權重成功!");
    setting();
}

function generateFastCheck(problem_list, div) {
    div.innerHTML = "";
    this.problem_list = problem_list;
    startUpScreen(div);
}

function isMobile() {
    const ua = navigator.userAgent;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return /Mobi|Android|iPhone|iPad|Tablet/i.test(ua) ||
        (ua.includes("Macintosh") && isTouch);
}

function startUpScreen(div) {
    div.innerHTML = "<div class=\"card-container\"><div id=\"cardContainer\"></div></div>";
    if (isMobile()) {
        document.getElementById('questions').className = 'mobile';
        let btn = createElement('button', 'close-btn', '×');
        btn.addEventListener('click', () => {
            div.innerHTML = "";
            div.className = "";
        });
        div.appendChild(btn);
    } else {
        document.getElementById('questions').className = 'desktop';
    }
    this.current_problem = undefined;
    renderCard(getWeightedRandomCard());
}

function getWeightedRandomCard() {
    const candidates = [];
    let totalWeight = 0;

    for (const value of this.problem_list) {
        const weight = getWeight(value.level, value.index) + 1;
        console.log(weight)
        if (weight > 0) {
            candidates.push({value, weight});
            totalWeight += weight;
        }
    }

    if (totalWeight === 0) return undefined;

    let rand = Math.random() * totalWeight;

    for (const {value, weight} of candidates) {
        if (rand < weight) return value;
        rand -= weight;
    }
    return undefined;
}

function renderCard(problem) {
    this.current_problem = problem;
    if (problem === undefined) {
        renderEndScreen();
        return;
    }
    const container = document.getElementById('cardContainer');
    container.innerHTML = ''; // 清除舊卡片

    const card = document.createElement('div');
    card.className = 'card-card card-enter';
    card.innerHTML = `
        <div class="card-meaning">${problem.chinese}</div>
        <div class="card-word-wrapper">
          <div class="card-word" id="card_word">
            <div class="card-overlay" id="card_overlay" onclick="this.classList.toggle('card-hidden')">點擊顯示</div>
          </div>
        </div>
        <div class="card-buttons">
          <button onclick="cardAction('no')">再看看</button>
          <button onclick="cardAction('yes')">學會了</button>
        </div>
      `;
    container.appendChild(card);
    if (isStarDisplay()) card.insertBefore(getFavoriteDisplay(problem.level, problem.index), card.firstElementChild);
    document.getElementById("card_word").insertBefore(getVocCanvas(problem), document.getElementById("card_overlay"));
}

function renderEndScreen() {
    const container = document.getElementById('cardContainer');
    this.current_problem = undefined;
    container.innerHTML = `
        <div class="card-card card-enter" style="text-align: center; justify-content: center;">
            <div style="font-size: 1.8em; margin-bottom: 20px;">🎉 單字複習完畢！</div>
            <button onclick="restart()" style="
                padding: 14px 24px;
                font-size: 1em;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            ">重新開始</button>
        </div>
        `;
}

function cardAction(type) {
    if (this.current_problem === undefined) return;
    if (type === "yes") {
        setWeight(this.current_problem.level, this.current_problem.index, -1);
        flipCard('right');
    } else {
        setWeight(this.current_problem.level, this.current_problem.index, getWeight(this.current_problem.level, this.current_problem.index) + 1);
        flipCard('left');
    }
}

function flipCard(direction) {
    const container = document.getElementById('cardContainer');
    const oldCard = container.querySelector('.card-card');
    oldCard.classList.add(direction === 'left' ? 'card-exit-left' : 'card-exit-right');

    setTimeout(() => {
        renderCard(getWeightedRandomCard());
    }, 100);
}

function restart() {
    for (let problem of this.problem_list) {
        setWeight(problem.level, problem.index, 0);
    }
    renderCard(getWeightedRandomCard());
}