// 全域變數，用於存放 Google Maps API 的服務實例
let googleAutocompleteService;
let placesService;

/**
 * 啟動 Google Maps API。
 * 檢查是否有 API Key，若有則動態載入 Google Maps Script。
 * Script 載入完成後，初始化 AutocompleteService 和 PlacesService。
 */
function activate() {
    const apiKey = localStorage.getItem('google_api_key');
    if (!apiKey) {
        showNotification("請先在\"匯入\"中設定你的 Google Maps API Key！");
    } else {
        // 檢查 Script 是否已經存在，避免重複載入
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            // 如果已經載入，可能 services 也已經初始化，若無則進行初始化
            if (!googleAutocompleteService || !placesService) {
                googleAutocompleteService = new google.maps.places.AutocompleteService();
                placesService = new google.maps.places.PlacesService(document.createElement('div'));
                console.log("Google Services re-initialized.");
            }
            return;
        }

        const script = document.createElement("script");
        // 移除 callback=initAutocomplete，改用 onload 事件處理
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
        script.async = true;
        script.defer = true;
        // Script 載入成功後的回呼
        script.onload = () => {
            googleAutocompleteService = new google.maps.places.AutocompleteService();
            // PlacesService 需要一個 HTML 元素來顯示 attribution，即使我們不顯示地圖
            placesService = new google.maps.places.PlacesService(document.createElement('div'));
            console.log("Google Services Initialized.");
        };
        // Script 載入失敗的回呼
        script.onerror = () => {
            console.error("無法載入 Google Maps Script。請檢查 API Key 或網路連線。");
            showNotification("無法載入 Google Maps 服務，請檢查 API Key。");
        };
        document.head.appendChild(script);
    }
}

/**
 * 設定 Google API Key 並存入 localStorage，然後啟動服務。
 * @param {string} key - Google Maps API Key。
 */
function setAPIKey(key) {
    localStorage.setItem('google_api_key', key);
    activate();
}

/**
 * 使用 AutocompleteService 取得 Google Maps 的地點建議。
 * @param {string} query - 使用者輸入的查詢字串。
 * @returns {Promise<Array>} - 一個包含地點建議的 Promise。
 */
function getGooglePredictions(query) {
    return new Promise((resolve) => {
        if (!googleAutocompleteService) {
            console.warn("Google Autocomplete Service 尚未準備好。");
            return resolve([]);
        }
        if (!query || query.trim() === '') {
            return resolve([]);
        }
        googleAutocompleteService.getPlacePredictions({
            input: query,
            language: 'zh-TW',
            region: 'tw' // 偏好台灣的結果
        }, (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(predictions || []);
            } else {
                // 不要 reject，以免中斷 Promise.all，回傳空陣列即可
                console.warn("Google Autocomplete 查詢失敗，狀態:", status);
                resolve([]);
            }
        });
    });
}

/**
 * 根據 placeId 取得地點的詳細資訊。
 * @param {string} placeId - Google Maps 的地點 ID。
 * @returns {Promise<object>} - 一個包含地點詳細資訊的 Promise。
 */
function getGooglePlaceDetails(placeId) {
    return new Promise((resolve, reject) => {
        if (!placesService) {
            return reject("Google Places Service 尚未準備好。");
        }
        placesService.getDetails({
            placeId: placeId,
            fields: ['name', 'url', 'geometry', 'place_id'] // 指定需要的欄位
        }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                resolve(place);
            } else {
                reject("無法取得地點詳細資訊: " + status);
            }
        });
    });
}


/**
 * 處理從 Google Maps API 取得的地點物件，並填入表單。
 * @param {object} place - Google Place 物件。
 */
function processGooglePlace(place) {
    if (!place) return;
    setNameValue(place.name); // 主要設定景點名稱
    document.getElementById('edit-mapUrl').value = place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
}

/**
 * 處理貼上的 Google Maps 連結。
 * @param {string} input - 使用者貼上的字串。
 */
async function processPastedUrl(input) {
    const urlInput = document.getElementById('edit-mapUrl');
    const mapPlaceUrlRegex = /\/place\/([^\/]+)\/@([\d\.\-]+),([\d\.\-]+)/;

    // Case 1: 是複雜的 Google Maps /place 連結
    if (input.includes("https://www.google.com/maps/place/") && mapPlaceUrlRegex.test(input)) {
        const match = input.match(mapPlaceUrlRegex);
        const nameEncoded = match[1];
        let name = decodeURIComponent(nameEncoded.replace(/\+/g, ' '));
        setNameValue(name);

        try {
            const result = await fetchPlaceFromName(name);
            urlInput.value = `https://www.google.com/maps/place/?q=place_id:${result.place_id}`;
        } catch (error) {
            console.warn(error);
            urlInput.value = input; // fallback to original input
        }
    }
    // Case 2: 是乾淨的 Google Maps 連結（包含 q=...）
    else if (input.includes("https://www.google.com/maps") && input.includes("q=")) {
        urlInput.value = input;
        try {
            const urlParams = new URL(input);
            const q = urlParams.searchParams.get('q');
            if (q) setNameValue(decodeURIComponent(q));
        } catch (e) {
            console.error("無效的 URL:", e);
        }
    }
}


/**
 * 從名稱查詢地點，主要用於從 URL 解析出名稱後反查 place_id。
 * @param {string} name - 地點名稱。
 * @returns {Promise<object>}
 */
function fetchPlaceFromName(name) {
    return new Promise((resolve, reject) => {
        if (!placesService) return reject("Google Places Service not ready.");
        const request = {
            query: name,
            fields: ['name', 'geometry', 'place_id'],
        };
        placesService.findPlaceFromQuery(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                resolve(results[0]);
            } else {
                reject("無法從名稱找到該地點: " + name);
            }
        });
    });
}

/**
 * 設定表單中的各個欄位值。
 * @param {string} value - 景點名稱。
 * @param {boolean} urlFill - 是否要根據歷史紀錄填寫 URL。
 */
function setNameValue(value, urlFill = false) {
    const name = document.getElementById('edit-name');
    const displayname = document.getElementById('edit-displayname');
    const icon = document.getElementById('edit-icon');
    const startTime = document.getElementById('edit-startTime');
    const endTime = document.getElementById('edit-endTime');
    const mapUrl = document.getElementById('edit-mapUrl');

    name.value = value;
    // 檢查是否有相似的歷史紀錄
    let sim = findSimilar(value);
    if (sim) {
        icon.value = sim.icon || '';
        startTime.value = sim.time.split('-')[0].trim();
        const end = sim.time.split('-')[1];
        if (end) endTime.value = end.trim();
        if (sim.display_name) displayname.value = sim.display_name;
        if (urlFill && sim.mapUrl) mapUrl.value = sim.mapUrl;
    }
}

/**
 * 使用 DistanceMatrixService 計算兩點間的距離與時間。
 * @param {string} origin - 起點名稱/地址。
 * @param {string} dest - 終點名稱/地址。
 * @param {string} travelMode - 'DRIVING' 或 'TRANSIT'。
 * @param {Date} departureTime - 出發時間。
 * @param {function} handler - 處理結果的回呼函式。
 */
function arrange(origin, dest, travelMode, departureTime, handler) {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
        {
            origins: [origin],
            destinations: [dest],
            travelMode: travelMode,
            transitOptions: {
                departureTime: departureTime
            },
            unitSystem: google.maps.UnitSystem.METRIC,
            language: 'zh-TW',
        },
        (response, status) => {
            if (status !== 'OK') {
                handler({status: "error", message: `Distance Matrix failed with status: ${status}`});
                return;
            }
            const result = response.rows[0].elements[0];
            if (result.status !== 'OK') {
                handler({status: "error", message: `Element status was: ${result.status}`});
                return;
            }
            const distance = result.distance.text;
            const duration = result.duration.text;
            handler({status: "success", distance: distance, duration: duration});
        }
    );
}

/**
 * 使用 DistanceMatrixService 計算最佳路徑。
 * @param {string[]} locs - 包含起、終點的景點名稱
 * @param {function(Object)} success - 回傳的最佳順序
 * @param {function(string)} failure - 處理失敗結果
 */
function findRoute(locs, success, failure) {
    const directionsService = new google.maps.DirectionsService();

    if (locs.length < 4) {
        failure("至少需要包含四個地點");
        return;
    }

    const origin = locs[0];
    const destination = locs[locs.length - 1];
    const waypoints = locs.slice(1, -1).map(loc => ({
        location: loc,
        stopover: true
    }));

    directionsService.route(
        {
            origin: origin,
            destination: destination,
            waypoints: waypoints,
            optimizeWaypoints: true,
            travelMode: 'DRIVING',
        },
        (response, status) => {
            if (status === "OK") {
                const route = response.routes[0];
                success({
                    order: [0, ...route.waypoint_order.map(i => i + 1), locs.length - 1],
                    legs: route.legs
                });
            } else {
                failure("路線規劃失敗：" + status);
            }
        }
    );
}

function openRouteWindow(date) {
    const modal = document.getElementById('route-input-modal');
    const summaryContainer = document.getElementById('route-modal-summary-container');

    const dayData = createDayData(date);
    modal.dataset.date = date;

    setOptions('route-start-location-selector', dayData.stops);
    setOptions('route-end-location-selector', dayData.stops);

    selectOption('route-start-location-selector', -1, '', '無');
    selectOption('route-end-location-selector', -1, '', '無');

    if (dayData && dayData.stops.length > 0) {
        let start = dayData.stops[0];
        let end = dayData.stops[dayData.stops.length - 1];
        selectOption('route-start-location-selector', 0, start.name, start.display_text);
        selectOption('route-end-location-selector', dayData.stops.length - 1, end.name, end.display_text);
    }

    renderSummaryVisualization(summaryContainer, dayData ? dayData.stops : []);

    modal.classList.remove('hidden');
}

function closeRouteWindow() {
    document.getElementById('route-input-modal').classList.add('hidden');
}

function handleRouteSubmit() {
    let start_selected = getSelectedOption('route-start-location-selector');
    let end_selected = getSelectedOption('route-end-location-selector');

    if (start_selected.index === -1 || end_selected.index === -1) {
        showNotification("起點或終點未設定完成！");
        return;
    }

    const modal = document.getElementById('route-input-modal');
    let date = modal.dataset.date;
    let start_index = start_selected.index;
    let end_index = end_selected.index;
    let schedule = createDayData(date);

    if (start_index > end_index) {
        showNotification("開始時間不得晚於結束時間！");
        return;
    }

    closeRouteWindow();

    findRoute(schedule.stops.map(stop => stop.name).splice(start_index, end_index - start_index + 1), res => {
        let source = schedule.stops.splice(start_index, end_index - start_index + 1);
        let times = source.map(stop => stop.time);

        for (let i = 0; i <= (end_index - start_index); i++) {
            console.log(source, res.order[i], res);
            source[res.order[i]].time = times[i];
            if (i) {
                source[res.order[i]].distance = res.legs[i - 1].distance.text;
                source[res.order[i]].duration = "開車 " + res.legs[i - 1].duration.text;
            }
            schedule.stops.splice(start_index + i, 0, source[res.order[i]]);
        }
        saveData();
        updateDayBlock(schedule);
        showNotification("成功調整行程順序！");
    }, reason => showNotification(reason));
}

// 頁面載入時自動啟動
activate();
