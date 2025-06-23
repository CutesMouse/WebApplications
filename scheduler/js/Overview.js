const timeline = document.getElementById("timeline");
const loadingSpinner = document.getElementById("loading-spinner");

let isEditMode = false;
let minLoadedDate = null;
let maxLoadedDate = null;
const daysToLoadPerScroll = 14;

// 編輯模式切換
function toggleEdit() {
    isEditMode = !isEditMode;

    // Re-render all currently visible day blocks to show/hide edit controls
    timeline.innerHTML = ''; // Clear existing
    if (!minLoadedDate || !maxLoadedDate) {
        loadInitialTrips();
        return;
    }
    let currentDate = new Date(minLoadedDate);
    let endDate = new Date(maxLoadedDate);
    while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().slice(0, 10);
        const dayData = getSchedule(dateString) || {date: dateString, stops: []};
        renderDayBlock(dayData, false); // Append in order
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

// 匯入確認視窗
function openImportWindow(trips) {
    const modal = document.getElementById('import-modal');
    const body = document.getElementById('import-modal-body');
    body.innerHTML = ''; // Clear previous content

    if (!trips || trips.length === 0) {
        body.textContent = '沒有可匯入的行程資料。';
        modal.classList.remove('hidden');
        return;
    }

    trips.forEach(dayData => {
        if (!dayData.date || !dayData.stops) return;

        // Create container for this day
        const dayContainer = document.createElement('div');

        // Add date title
        const dateTitle = document.createElement('h4');
        dateTitle.className = 'text-md font-bold text-gray-700';
        dateTitle.textContent = formatDate(dayData.date);
        dayContainer.appendChild(dateTitle);

        // Add summary timeline visual
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'summary-timeline-container mt-2 p-3 bg-gray-100 rounded-lg overflow-x-auto whitespace-nowrap';
        renderSummaryVisualization(summaryContainer, dayData.stops);
        dayContainer.appendChild(summaryContainer);

        body.appendChild(dayContainer);
    });

    modal.classList.remove('hidden');
}

// 關閉匯入確認視窗
function closeImportModal() {
    document.getElementById('import-modal').classList.add('hidden');
    backToOverview();
}

// 開啟匯入視窗
function openImportTextWindow() {
    document.getElementById('import-text-modal').classList.remove('hidden');
    document.getElementById('import-json-textarea').value = '';
}

// 關閉匯入視窗
function closeImportTextWindow() {
    document.getElementById('import-text-modal').classList.add('hidden');
    backToOverview();
}

// 渲染行程概要
function renderSummaryVisualization(container, stops) {
    container.innerHTML = ''; // Clear previous content

    if (!stops || stops.length === 0) {
        container.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-500">沒有行程</div>`;
        return;
    }

    const vizContainer = document.createElement('div');
    vizContainer.className = 'flex items-center h-full min-w-full';

    // Sort stops by time to ensure correct order
    const sortedStops = [...stops].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    // Add an initial "unscheduled" block
    const initialGap = document.createElement('div');
    initialGap.className = 'flex-grow h-1 bg-gray-300 rounded-l-full';
    vizContainer.appendChild(initialGap);

    sortedStops.forEach((stop, i) => {
        // Add the scheduled item
        const itemContainer = document.createElement('div');
        itemContainer.className = 'flex flex-col items-center justify-center text-center px-2';

        const [startTime] = (stop.time || " ").split(' - ');
        const timeDisplay = startTime.trim() ? `${startTime.trim()}` : '';

        itemContainer.innerHTML = `
                <div class="w-12 h-12 rounded-full bg-white border-4 border-red-400 flex items-center justify-center text-2xl mb-1">${stop.icon || '📍'}</div>
                <div class="text-xs font-semibold leading-tight">${stop.display_text}</div>
                <div class="text-xs text-gray-500 leading-tight">${timeDisplay}</div>
            `;
        vizContainer.appendChild(itemContainer);

        // Add the "unscheduled" gap after the item
        const gap = document.createElement('div');
        gap.className = `flex-grow h-1 bg-gray-300 ${i === sortedStops.length - 1 ? 'rounded-r-full' : ''}`;
        vizContainer.appendChild(gap);
    });

    container.appendChild(vizContainer);
}

function openEditModal(dateString, stopIndex = null) {
    const modal = document.getElementById('edit-modal');
    const summaryContainer = document.getElementById('edit-modal-summary-container');
    modal.classList.remove('hidden');

    // --- Generate Timeline Visualization (Readability-focused) ---
    const dayData = getSchedule(dateString);
    renderSummaryVisualization(summaryContainer, dayData ? dayData.stops : []);

    // Store data for saving later
    modal.dataset.date = dateString;
    modal.dataset.stopIndex = stopIndex !== null ? stopIndex : '';

    // Clear or populate input fields
    const fields = ['name', 'displayname', 'destination', 'mapUrl', 'startTime', 'endTime', 'distance', 'duration', 'icon'];
    fields.forEach(f => document.getElementById(`edit-${f}`).value = '');
    setTimeDefault(dateString);

    if (stopIndex !== null && dayData) {
        const stop = dayData.stops[stopIndex];
        const [startTime, endTime] = (stop.time || '-').split('-');
        document.getElementById('edit-destination').value = '';
        document.getElementById('edit-name').value = stop.name || '';
        document.getElementById('edit-displayname').value = stop.display_name || '';
        document.getElementById('edit-mapUrl').value = stop.mapUrl || '';
        document.getElementById('edit-startTime').value = startTime.trim();
        document.getElementById('edit-endTime').value = endTime ? endTime.trim() : '';
        document.getElementById('edit-distance').value = stop.distance || '';
        document.getElementById('edit-duration').value = stop.duration || '';
        document.getElementById('edit-icon').value = stop.icon || '';
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

function rearrangeTime(date, travelMode) {
    autoDayArrange(date, travelMode);
}

function showDeleteConfirmation(dateString, stopIndex) {
    const modal = document.getElementById('delete-confirm-modal');
    modal.classList.remove('hidden');
    // Store data for deletion
    modal.dataset.date = dateString;
    modal.dataset.stopIndex = stopIndex;
}

function hideDeleteConfirmation() {
    document.getElementById('delete-confirm-modal').classList.add('hidden');
}

function confirmDelete() {
    const date = document.getElementById('delete-confirm-modal').dataset.date;
    const index = document.getElementById('delete-confirm-modal').dataset.stopIndex;
    if (index === "-1") deleteDayData(date);
    else deleteData(date, index);
    hideDeleteConfirmation();
    showNotification("行程已刪除");
}

function showNotification(message) {
    const existingNotification = document.querySelector('.trip-notification');
    if (existingNotification) existingNotification.remove();
    const notification = document.createElement('div');
    notification.className = 'trip-notification fixed bottom-5 left-1/2 -translate-x-1/2 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg transform transition-all duration-300 opacity-0 translate-y-10 z-50';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.remove('opacity-0', 'translate-y-10'), 10);
    setTimeout(() => {
        notification.classList.add('opacity-0', 'translate-y-10');
        setTimeout(() => {
            if (notification.parentNode) document.body.removeChild(notification);
        }, 300);
    }, 2500);
}

const renderDayBlock = (dayData, prepend = false, replace = false) => {
    const dayBlock = document.createElement("div");
    dayBlock.className = "day-block mb-10";
    dayBlock.setAttribute('data-date', dayData.date);

    const dateHeaderContainer = document.createElement("div");
    dateHeaderContainer.className = "flex justify-between items-center mb-4 sticky top-0 z-10 p-2 -mx-2";
    if (new Date().toISOString().slice(0, 10) === dayData.date) dateHeaderContainer.className += " bg-blue-50 text-blue-600";
    else dateHeaderContainer.className += " bg-gray-50";

    const dateTitle = document.createElement("h2");
    dateTitle.className = "text-xl font-bold";
    if (new Date().toISOString().slice(0, 10) === dayData.date) dateHeaderContainer.className += " text-red-800";
    else dateHeaderContainer.className += " text-gray-800";

    dateTitle.textContent = formatDate(dayData.date);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "flex items-center gap-2";

    // NEW: Add "Add" button in edit mode
    if (isEditMode) {
        const menuContainer = document.createElement("div");
        // menuContainer 的 className 維持不變
        menuContainer.className = "relative inline-block text-left";

        const addButton = document.createElement("button");
        addButton.className = "bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded-lg text-sm transition";
        addButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/></svg>`;
        addButton.setAttribute('onclick', `openEditModal('${dayData.date}')`);
        buttonsContainer.appendChild(addButton);

        menuContainer.innerHTML = `
        <div>
            <button type="button" class="inline-flex justify-center w-full rounded-lg border border-gray-300 shadow-sm px-3 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none" 
                    onclick="event.stopPropagation(); 
                             const menu = this.closest('div').nextElementSibling; 
                             const container = this.closest('.day-block');
                             const isOpening = menu.classList.contains('hidden');
                             
                             /* 先關閉所有已開啟的選單 */
                             document.querySelectorAll('.day-block.menu-active').forEach(c => c.classList.remove('menu-active'));
                             document.querySelectorAll('.day-menu:not(.hidden)').forEach(m => m.classList.add('hidden'));

                             if (isOpening) {
                                menu.classList.remove('hidden');
                                container.classList.add('menu-active');
                             }">
                操作
                <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
        <div class="day-menu origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden z-40" role="menu" aria-orientation="vertical">
            <div class="py-1">
                <a href="#" class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"
                   onclick="event.preventDefault(); openAIWindow('${dayData.date}'); this.closest('.day-menu').classList.add('hidden'); this.closest('.day-block').classList.remove('menu-active');">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-robot" viewBox="0 0 16 16"><path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a25 25 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25 25 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135"/><path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5"/></svg>
                    <span>AI 自動安排行程</span>
                </a>
                <div class="border-t border-gray-100 my-1"></div>
                <a href="#" class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"
                   onclick="event.preventDefault(); rearrangeTime('${dayData.date}', 'DRIVING'); this.closest('.day-menu').classList.add('hidden'); this.closest('.day-block').classList.remove('menu-active');">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-car-front-fill" viewBox="0 0 16 16"><path d="M2.52 3.515A2.5 2.5 0 0 1 4.82 2h6.362c1 0 1.904.596 2.298 1.515l.792 1.848c.075.175.21.319.38.404.5.25.855.715.965 1.262l.335 1.679q.05.242.049.49v.413c0 .814-.39 1.543-1 1.997V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.338c-1.292.048-2.745.088-4 .088s-2.708-.04-4-.088V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.892c-.61-.454-1-1.183-1-1.997v-.413a2.5 2.5 0 0 1 .049-.49l.335-1.68c.11-.546.465-1.012.964-1.261a.8.8 0 0 0 .381-.404l.792-1.848ZM3 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2m10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2M6 8a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2zM2.906 5.189a.51.51 0 0 0 .497.731c.91-.073 3.35-.17 4.597-.17s3.688.097 4.597.17a.51.51 0 0 0 .497-.731l-.956-1.913A.5.5 0 0 0 11.691 3H4.309a.5.5 0 0 0-.447.276L2.906 5.19Z"/></svg>
                    <span>計算通勤時間 (開車)</span>
                </a>
                <a href="#" class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"
                   onclick="event.preventDefault(); rearrangeTime('${dayData.date}', 'TRANSIT'); this.closest('.day-menu').classList.add('hidden'); this.closest('.day-block').classList.remove('menu-active');">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-truck-front-fill" viewBox="0 0 16 16"><path d="M3.5 0A2.5 2.5 0 0 0 1 2.5v9c0 .818.393 1.544 1 2v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V14h6v1.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2c.607-.456 1-1.182 1-2v-9A2.5 2.5 0 0 0 12.5 0zM3 3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3.9c0 .625-.562 1.092-1.17.994C10.925 7.747 9.208 7.5 8 7.5s-2.925.247-3.83.394A1.008 1.008 0 0 1 3 6.9zm1 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2m8 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2m-5-2h2a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2"/></svg>
                    <span>計算通勤時間 (大眾運輸)</span>
                </a>
                <div class="border-t border-gray-100 my-1"></div>
                <a href="#" class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem"
                   onclick="event.preventDefault(); showDeleteConfirmation('${dayData.date}', -1); this.closest('.day-menu').classList.add('hidden'); this.closest('.day-block').classList.remove('menu-active');">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg>
                    <span>刪除今日行程</span>
                </a>
            </div>
        </div>
    `;
        buttonsContainer.appendChild(menuContainer);

        // 這個 window 事件監聽器需要移出 renderDayBlock 函式，放到您的主要 script 區塊的最外層，確保它只被註冊一次。
        // 如果尚未移動，請將其移出。
    } else {
        const shareButton = document.createElement("button");
        shareButton.className = "bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-2 rounded-lg text-sm transition duration-150 ease-in-out";
        shareButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-share-fill" viewBox="0 0 16 16"><path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/></svg>`;
        shareButton.setAttribute('onclick', `shareTrip('${dayData.date}')`);
        buttonsContainer.appendChild(shareButton);
    }

    dateHeaderContainer.appendChild(dateTitle);
    dateHeaderContainer.appendChild(buttonsContainer);
    dayBlock.appendChild(dateHeaderContainer);

    if (!dayData.stops || dayData.stops.length === 0) {
        const noScheduleDiv = document.createElement("div");
        noScheduleDiv.className = "bg-white p-4 rounded-lg shadow-md text-center text-gray-500 slide-in";
        noScheduleDiv.textContent = "今天沒有安排行程";
        dayBlock.appendChild(noScheduleDiv);
    } else {
        dayData.stops.forEach((stop, index) => {
            const isLast = index === dayData.stops.length - 1;
            const next = dayData.stops[index + 1];

            const div = document.createElement("div");
            div.className = `slide-in relative flex items-start gap-4 ${stop.past ? 'fade-out' : ''}`;

            // Use padding on non-last items to create space that the line can fill.
            if (!isLast) {
                div.classList.add('pb-6');
            } else {
                div.classList.add('mb-6');
            }

            updateDiv(isLast, next, index, stop, div);
            if (!stop.past) {
                let id = setInterval(() => {
                    if (stop.past) {
                        updateDiv(isLast, next, index, stop, div);
                        clearInterval(id);
                    }
                }, 1000);
            }

            dayBlock.appendChild(div);
        });
    }

    if (replace) {
        for (let i = 0; i < timeline.children.length; i++) {
            if (timeline.children.item(i).getAttribute('data-date') === dayData.date) {
                timeline.removeChild(timeline.children.item(i));
                timeline.insertBefore(dayBlock, timeline.children.item(i));
            }
        }
    } else if (prepend) {
        timeline.prepend(dayBlock);
    } else {
        timeline.appendChild(dayBlock);
    }

    setTimeout(() => {
        dayBlock.querySelectorAll('.slide-in').forEach(el => {
            observer.observe(el);
        });
    }, 100);
};

// --- 自動完成 ---
/**
 * Handles user input in the name field, fetches and renders autocomplete suggestions.
 * @param {string} value - The current value of the input field.
 */
function handleAutocompleteInput(value) {
    const resultsContainer = document.getElementById('autocomplete-results');
    if (!value.trim()) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
        return;
    }

    const results = SearchAutoComplete(value);
    renderAutocompleteResults(results);
}

/**
 * Renders the autocomplete suggestions in the dropdown.
 * @param {Array} results - The array of stop objects to display.
 */
function renderAutocompleteResults(results) {
    const resultsContainer = document.getElementById('autocomplete-results');
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.classList.add('hidden');
        return;
    }

    results.forEach(stop => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';

        // This ensures the entire stop object is available on click
        item.onclick = () => fillFormWithStop(stop);

        item.innerHTML = `
                <div class="autocomplete-item-icon">${stop.icon || '📍'}</div>
                <div>
                    <div class="autocomplete-item-text-primary">${stop.name}</div>
                    <div class="autocomplete-item-text-secondary">${stop.past ? "於 " + stop.date + " 造訪過" : "預計於 " + stop.date + " 造訪"}</div>
                </div>
            `;
        resultsContainer.appendChild(item);
    });

    resultsContainer.classList.remove('hidden');
}

/**
 * Fills the edit modal form with the data from a selected stop.
 * @param {object} stop - The stop object to fill the form with.
 */
function fillFormWithStop(stop) {
    const [startTime, endTime] = (stop.time || ' - ').split(' - ');
    setNameValue(stop.name, true);

    // Hide the autocomplete results
    const resultsContainer = document.getElementById('autocomplete-results');
    resultsContainer.classList.add('hidden');
    resultsContainer.innerHTML = '';
}

// --- Initial Load and Scroll Handling ---

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, {threshold: 0.1});

const loadDays = (startDate, numDays, prepend) => {
    loadingSpinner.classList.remove('hidden');
    const prevScrollHeight = document.documentElement.scrollHeight;
    let datesToLoad = [];
    let currentDate = startDate;

    for (let i = 0; i < numDays; i++) {
        datesToLoad.push(currentDate);
        currentDate = addDays(currentDate, prepend ? -1 : 1);
    }

    datesToLoad.forEach(dateString => {
        const dayData = getSchedule(dateString) || {date: dateString, stops: []};
        renderDayBlock(dayData, prepend);
    });

    if (prepend) {
        minLoadedDate = datesToLoad[numDays - 1];
        const newScrollHeight = document.documentElement.scrollHeight;
        window.scrollTo(0, newScrollHeight - prevScrollHeight);
    } else {
        maxLoadedDate = datesToLoad[datesToLoad.length - 1];
    }
    loadingSpinner.classList.add('hidden');
}

const updateDiv = (isLast, next, index, stop, div) => {
    const lineHTML = !isLast ? `
                    <div class="absolute top-5 left-5 transform -translate-x-1/2 w-0.5 h-full ${stop.past ? '' : 'bg-blue-300'}"
                         style="${stop.past ? 'border-left: 2px dashed #d1d5db;' : ''}">
                    </div>` : '';

    const iconHTML = `
                    <div class="relative z-10">
                        <div class="w-10 h-10 rounded-full bg-gray-50 border-4 ${stop.past ? 'border-gray-300' : 'border-blue-300'} flex items-center justify-center text-xl p-1">
                            <a href="${stop.mapUrl}" target="_blank">${stop.image}</a>
                        </div>
                    </div>`;

    const contentHTML = `
                    <div class="flex-1 pt-1">
                        <div class="flex justify-between items-start gap-2">
                            <div class="bg-white p-4 rounded-lg shadow-md flex-grow">
                                <h3 class="font-semibold text-lg break-words">${stop.display_text}</h3>
                                <p class="text-sm text-gray-600">${stop.time}</p>
                            </div>
                            ${isEditMode ? `
                            <div class="flex flex-col gap-2 pt-2">
                                <button class="bg-yellow-400 hover:bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow" onclick="openEditModal('${stop.date}', ${index})" title="編輯">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/></svg>
                                </button>
                                <button class="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow" onclick="showDeleteConfirmation('${stop.date}', ${index})" title="刪除">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                                </button>
                            </div>
                            ` : ''}
                        </div>

                        ${(!isLast && next && next.distance && next.duration) ? `
                            <div class="text-center text-sm text-gray-500 pt-4">
                                ${next.distance} ‧ ${next.duration}
                            </div>
                        ` : ''}
                    </div>`;

    div.innerHTML = lineHTML + iconHTML + contentHTML;
}

const loadInitialTrips = () => {
    const centralDate = new Date().toISOString().slice(0, 10);

    minLoadedDate = addDays(centralDate, -7);
    maxLoadedDate = addDays(centralDate, 7);

    loadDays(minLoadedDate, 15, false);

    setTimeout(() => {
        scrollToNow();
    }, 100);
};

const scrollToNow = (centralDate = new Date().toISOString().slice(0, 10)) => {
    const currentDayElement = document.querySelector(`[data-date="${centralDate}"]`);
    if (currentDayElement) {
        window.scrollTo({
            top: currentDayElement.offsetTop,
            behavior: 'auto'
        });
    }
}

let isProcessingScroll = false;
const handleScroll = debounce(() => {
    if (isProcessingScroll) return;

    const {scrollTop, scrollHeight, clientHeight} = document.documentElement;

    const nearTop = scrollTop < 100;
    const nearBottom = scrollTop + clientHeight > scrollHeight - 100;

    if (nearTop) {
        isProcessingScroll = true;
        loadDays(addDays(minLoadedDate, -1), daysToLoadPerScroll, true);
        setTimeout(() => {
            isProcessingScroll = false;
        }, 300);
    } else if (nearBottom) {
        isProcessingScroll = true;
        loadDays(addDays(maxLoadedDate, 1), daysToLoadPerScroll, false);
        setTimeout(() => {
            isProcessingScroll = false;
        }, 300);
    }
}, 100);

loadInitialTrips();
addScrollEvent(handleScroll);