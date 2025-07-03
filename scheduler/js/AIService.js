function isAIEnabled() {
    return localStorage.getItem('gemini_api_key');
}

function setGeminiApiKey(key) {
    localStorage.setItem('gemini_api_key', key);
}

function setOpenAIApiKey(key) {
    localStorage.setItem('openai_api_key', key);
}

function openAIWindow(date, keepPrompt = false) {
    if (!isAIEnabled()) {
        showNotification("請先在匯入處設定Gemini API Key");
        return;
    }
    if (!keepPrompt) {
        document.getElementById('ai-prompt').value = '';
    }
    const modal = document.getElementById('ai-input-modal');
    if (date === 'regenerate') {
        date = modal.dataset.date;
    }
    const summaryContainer = document.getElementById('ai-modal-summary-container');

    const dayData = createDayData(date);
    modal.dataset.date = date;

    setOptions('start-location-selector', dayData.stops);
    setOptions('end-location-selector', dayData.stops);

    if (!keepPrompt) {
        selectOption('start-location-selector', -1, '', '無');
        selectOption('end-location-selector', -1, '', '無');

        if (dayData && dayData.stops.length > 0) {
            let start = dayData.stops[0];
            let end = dayData.stops[dayData.stops.length - 1];
            selectOption('start-location-selector', 0, start.name, start.display_text);
            selectOption('end-location-selector', dayData.stops.length - 1, end.name, end.display_text);
        }
    }

    renderSummaryVisualization(summaryContainer, dayData ? dayData.stops : []);

    modal.classList.remove('hidden');
}

function closeAIWindow() {
    document.getElementById('ai-input-modal').classList.add('hidden');
}

let ai_generated_trips = undefined;

function handleAISubmit() {
    let start_selected = getSelectedOption('start-location-selector');
    let end_selected = getSelectedOption('end-location-selector');

    if (start_selected.index === -1 || end_selected.index === -1) {
        showNotification("起點或終點未設定完成！");
        return;
    }

    const modal = document.getElementById('ai-input-modal');
    let start_loc = start_selected.value;
    let start_time = document.getElementById('ai-start-time').value;
    let end_loc = end_selected.value;
    let end_time = document.getElementById('ai-end-time').value;
    let user_prompt = document.getElementById('ai-prompt').value || '無';
    let date = modal.dataset.date;

    if (start_time > end_time) {
        showNotification("開始時間不得晚於結束時間！");
        return;
    }

    // send the prompt to gemini
    let prompt = `使用者輸入：
- 起點：${start_loc}
- 終點：${end_loc}
- 時間：${date}, ${start_time}-${end_time}
- 偏好：${user_prompt}

1) 解析偏好與限制 → 檢索適合的景點類型
2) 請列出所有景點的name(名稱、需要能在Google上直接搜尋到)、time(包含起點、終點時間，格式如13:00-14:00), icon(給我一個表示這個景點的Emoji), description(推薦原因)
3) 請排出旅行上最順暢的順序，請不要在行程中包含起點、終點
4) 回傳一個陣列[{行程1}, {行程2}, ...]，每個行程包含以上資訊，以JSON 格式表示
5) 不用列出交通方式，全部給景點資訊即可
6) 請幫我把資料包在 \`\`\`json中
`
    closeAIWindow();
    document.getElementById('ai-loading-modal').classList.remove('hidden');

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

/**
 * 使用 ChatGPT 4o-mini 生成文字。
 * @param {string} prompt 要傳遞給模型的提示。
 * @param {function(string)} success 成功handler
 * @param {function(string)} failure 失敗handler
 */
function generateTextWithChatGPT(prompt, success, failure) {
    try {
        if (!localStorage.getItem('openai_api_key')) {
            failure('需要先加入OpenAI API Key');
            return;
        }

        // 存取 GoogleGenerativeAI
        const url = `https://api.chatanywhere.org/v1/chat/completions`;
        const requestBody = {
            model: "gpt-4.1-mini",
            messages: [
                {role: "user", content: prompt}
            ]
        };
        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('openai_api_key')}` // 👈 加入你的 API Key
            },
            body: JSON.stringify(requestBody)
        }).then(res => res.json()).then(json => {
            if (json.choices && json.choices.length > 0) {
                success(json.choices[0].message.content)
            }
            else failure("調用AI時發生錯誤");
            console.log(json)
        });
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

// --- Draggable Selector Logic ---

/**
 * Creates and initializes a draggable selector component.
 * @param {string} wrapperId - The ID of the wrapper element for the selector.
 * @param {string} placeholder - The placeholder text.
 */
function createDraggableSelector(wrapperId, placeholder) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    wrapper.innerHTML = `
            <div class="draggable-selector-container">
                <div class="selected-value placeholder">${placeholder}</div>
            </div>
            <div class="selector-options-list hidden"></div>
            <div class="draggable-dot"></div>
        `;

    const container = wrapper.querySelector('.draggable-selector-container');
    const dot = wrapper.querySelector('.draggable-dot');
    const optionsList = wrapper.querySelector('.selector-options-list');

    let isDragging = false;
    let startY = 0;

    const handleDragStart = (e) => {
        e.preventDefault();
        isDragging = true;
        container.classList.add('dragging');
        dot.classList.add('dot-active'); // MODIFIED: Activate dot's z-index
        optionsList.classList.remove('hidden');
        startY = e.touches ? e.touches[0].clientY : e.clientY;

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, {passive: false});
        document.addEventListener('touchend', handleDragEnd);
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const currentY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = currentY - startY;
        dot.style.transform = `translate(-50%, calc(-50% + ${deltaY}px))`;
        highlightClosestOption(currentY);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        container.classList.remove('dragging');
        dot.classList.remove('dot-active'); // MODIFIED: Deactivate dot's z-index

        const highlightedOption = optionsList.querySelector('.highlight');
        if (highlightedOption) {
            selectOption(wrapperId, highlightedOption.dataset.index, highlightedOption.dataset.value, highlightedOption.dataset.display);
        }

        optionsList.classList.add('hidden');
        dot.style.transform = 'translate(-50%, -50%)';
        removeHighlight();

        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    };

    const highlightClosestOption = (cursorY) => {
        const options = Array.from(optionsList.querySelectorAll('.selector-option'));
        if (options.length === 0) return;

        let closestOption = null;
        let minDistance = Infinity;

        options.forEach(option => {
            const rect = option.getBoundingClientRect();
            const optionCenterY = rect.top + rect.height / 2;
            const distance = Math.abs(cursorY - optionCenterY);

            if (distance < minDistance) {
                minDistance = distance;
                closestOption = option;
            }
        });

        removeHighlight();
        if (closestOption) {
            closestOption.classList.add('highlight');
            const listRect = optionsList.getBoundingClientRect();
            const optionRect = closestOption.getBoundingClientRect();
            const desiredScrollTop = closestOption.offsetTop - (listRect.height / 2) + (optionRect.height / 2);
            optionsList.scrollTop = desiredScrollTop;
        }
    };

    const removeHighlight = () => {
        optionsList.querySelectorAll('.selector-option.highlight').forEach(el => el.classList.remove('highlight'));
    };

    const selectOptionOnClick = (e) => {
        const clickedOption = e.target.closest('.selector-option');
        if (clickedOption) {
            selectOption(wrapperId, clickedOption.dataset.index, clickedOption.dataset.value, clickedOption.dataset.display);
            optionsList.classList.add('hidden');
            // Ensure dot is not active after click selection
            dot.classList.remove('dot-active');
        }
    };

    dot.addEventListener('mousedown', handleDragStart);
    dot.addEventListener('touchstart', handleDragStart, {passive: false});
    // MODIFIED: Removed click listener on container to disable click-to-open
    optionsList.addEventListener('click', selectOptionOnClick);
}

let options = [];

/**
 * Sets the options for the draggable selectors.
 * @param {string} selectorId - The ID of the specific selector wrapper.
 * @param {Array<object>} stops - An array of location objects.
 */
function setOptions(selectorId, stops) {
    const optionsList = document.querySelector(`#${selectorId} .selector-options-list`);
    if (!optionsList) return;

    optionsList.innerHTML = '';
    options = stops;

    if (!stops || stops.length === 0) {
        optionsList.innerHTML = `<div class="selector-option text-gray-400" data-value="" data-index="-1" data-display="無">無可用選項</div>`;
        return;
    }

    for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const optionElement = document.createElement('div');
        optionElement.className = 'selector-option';
        optionElement.dataset.value = stop.name;
        optionElement.dataset.index = i.toString();
        optionElement.dataset.display = stop.display_text;

        optionElement.innerHTML = `
                <div class="option-icon">${stop.image}</div>
                <div class="option-text-content">
                    <div class="option-title">${stop.display_text}</div>
                    <div class="option-subtitle">${stop.time}</div>
                </div>
            `;
        optionsList.appendChild(optionElement);
    }
}

function selectOption(wrapperId, index, value, displayValue) {
    const wrapper = document.getElementById(wrapperId);
    const valueDisplay = wrapper.querySelector('.selected-value');

    valueDisplay.textContent = displayValue;
    valueDisplay.classList.remove('placeholder');

    wrapper.dataset.selectedValue = value;
    wrapper.dataset.selectedIndex = index;

    index = parseInt(index);
    if (index !== -1) {
        let stop = options[index];
        switch (wrapperId) {
            case "start-location-selector":
                document.getElementById('ai-start-time').value = stop.time.split('-')[1];
                break;
            case "end-location-selector":
                document.getElementById('ai-end-time').value = stop.time.split('-')[0];
                break;
            case "route-start-location-selector":
                document.getElementById('route-start-time').value = stop.time.split('-')[1];
                break;
            case "route-end-location-selector":
                document.getElementById('route-end-time').value = stop.time.split('-')[0];
                break;
        }
    }
}

function getSelectedOption(wrapperId) {
    return {
        value: document.getElementById(wrapperId).dataset.selectedValue,
        index: parseInt(document.getElementById(wrapperId).dataset.selectedIndex)
    }
}