function isAIEnabled() {
    return localStorage.getItem('gemini_api_key');
}

function setGeminiApiKey(key) {
    localStorage.setItem('gemini_api_key', key);
}

function openAIWindow(date) {
    if (!isAIEnabled()) {
        showNotification("請先在匯入處設定Gemini API Key");
        return;
    }
    document.getElementById('ai-prompt').value = '';
    const modal = document.getElementById('ai-input-modal');
    if (date === 'regenerate') {
        date = modal.dataset.date;
    }
    const summaryContainer = document.getElementById('ai-modal-summary-container');

    const dayData = getSchedule(date);
    modal.dataset.date = date;

    if (dayData && dayData.stops.length > 0) {
        let start = dayData.stops[0];
        document.getElementById('ai-start-location').value = start.name;
        document.getElementById('ai-start-time').value = start.time.split('-')[1];
    }

    if (dayData && dayData.stops.length > 1) {
        let end = dayData.stops[dayData.stops.length - 1];
        document.getElementById('ai-end-location').value = end.name;
        document.getElementById('ai-end-time').value = end.time.split('-')[0];
    }

    renderSummaryVisualization(summaryContainer, dayData ? dayData.stops : []);

    modal.classList.remove('hidden');
}

function closeAIWindow() {
    document.getElementById('ai-input-modal').classList.add('hidden');
}

let ai_generated_trips = undefined;

function handleAISubmit() {
    closeAIWindow();
    document.getElementById('ai-loading-modal').classList.remove('hidden');

    const modal = document.getElementById('ai-input-modal');
    let start_loc = document.getElementById('ai-start-location').value;
    let start_time = document.getElementById('ai-start-time').value;
    let end_loc = document.getElementById('ai-end-location').value;
    let end_time = document.getElementById('ai-end-time').value;
    let user_prompt = document.getElementById('ai-prompt').value || '無';
    let date = modal.dataset.date;

    // send the prompt to gemini
    let prompt = `使用者輸入：
- 起點：${start_loc}
- 終點：${end_loc}
- 時間：${date}, ${start_time}-${end_time}
- 偏好：${user_prompt}

1) 解析偏好與限制 → 檢索適合的景點類型
2) 請列出所有景點的name(名稱、需要能在Google上直接搜尋到)、time(包含起點、終點時間，格式如13:00-14:00), icon(給我一個表示這個景點的Emoji), description(推薦原因)
3) 請排出旅行上最順暢的順序，不用包含起、終點
4) 回傳一個陣列[{行程1}, {行程2}, ...]，每個行程包含以上資訊，以JSON 格式表示
5) 不用列出交通方式，全部給景點資訊即可
`
    generateTextWithGeminiFlash(prompt, text => {
        document.getElementById('ai-loading-modal').classList.add('hidden');

        // Demo data for AI generated trip
        let json = extractJsonFromString(text);
        if (!json) {
            showNotification("解析資料時發生錯誤！");
            return;
        }
        ai_generated_trips = parseAIOutputJSON(json, date);

        const confirmBody = document.getElementById('ai-confirm-body');
        renderAIConfirmDetails(confirmBody, ai_generated_trips.stops);

        document.getElementById('ai-confirm-modal').classList.remove('hidden');
    }, reason => {
        document.getElementById('ai-loading-modal').classList.add('hidden');
        showNotification(reason);
    });
}

function closeAIConfirmModal() {
    document.getElementById('ai-confirm-modal').classList.add('hidden');
}

function importAITrip() {
    if (ai_generated_trips === undefined) {
        showNotification("發生錯誤，無可用的AI資料！");
        return;
    }
    for (const trip of ai_generated_trips.stops) {
        createDataWithData(trip.date, trip);
    }
    showNotification("匯入行程成功！");
}

/**
 * 使用 Google Gemini 2.5 Flash API 生成文字。
 * @param {string} prompt 要傳遞給模型的提示。
 * @param {function(string)} success 成功handler
 * @param {function(string)} failure 失敗handler
 */
function generateTextWithGeminiFlash(prompt, success, failure) {
    try {
        if (!localStorage.getItem('gemini_api_key')) {
            failure('需要先加入Gemini API Key');
            return;
        }

        // 存取 GoogleGenerativeAI
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${localStorage.getItem('gemini_api_key')}`;
        const requestBody = {
            contents: [{
                parts: [{text: prompt}]
            }]
        };
        fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(requestBody)
        }).then(res => res.text()).then(text => success(text));
    } catch (error) {
        failure("調用AI時發生錯誤:" + error);
    }
}

function extractJsonFromString(text) {
    try {
        // 尋找 JSON 區塊的起始和結束標記
        const startIndex = text.indexOf('```json');
        const endIndex = text.indexOf('```', startIndex + 1);

        // 如果找不到 JSON 區塊，則回傳 undefined
        if (startIndex === -1 || endIndex === -1) {
            return undefined;
        }

        // 提取 JSON 字串（去除 '```json' 和 '```' 標記）
        const jsonString = text.substring(startIndex + '```json'.length, endIndex).trim()
            .replaceAll('\\n', '')
            .replaceAll('\\\"', '\"');

        // 嘗試解析 JSON 字串
        return JSON.parse(jsonString);
    } catch (error) {
        // 如果解析失敗（例如 JSON 格式不正確），則回傳 undefined
        console.error("解析 JSON 時發生錯誤:", error);
        return undefined;
    }
}

/**
 * Renders AI trip details with descriptions into a container.
 * @param {HTMLElement} container - The element to render into.
 * @param {Array} stops - The array of stop objects with descriptions.
 */
function renderAIConfirmDetails(container, stops) {
    container.innerHTML = ''; // Clear previous content

    if (!stops || stops.length === 0) {
        container.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-500 italic">AI 無法生成行程，請調整條件後再試一次。</div>`;
        return;
    }

    stops.forEach(stop => {
        const stopElement = document.createElement('div');
        stopElement.className = 'bg-white p-4 rounded-lg shadow-sm';

        stopElement.innerHTML = `
                <div class="flex items-start gap-4">
                    <div class="text-3xl">${stop.icon || '📍'}</div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-center">
                            <h4 class="font-bold text-lg text-gray-800">${stop.name}</h4>
                            <span class="text-sm font-semibold text-pink-600">${stop.time || ''}</span>
                        </div>
                        <p class="text-gray-600 mt-1">${stop.description || 'AI 沒有提供推薦理由。'}</p>
                    </div>
                </div>
            `;
        container.appendChild(stopElement);
    });
}