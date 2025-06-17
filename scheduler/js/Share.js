let sharedTrip = [];
let last_date = "";

function shareTrip(dateString) {
    let schedule = createDayData(dateString);

    for (const trip of sharedTrip) {
        if (trip.date === dateString) {
            showNotification(`該行程已在複製清單內！`);
            last_date = dateString;
            return;
        }
    }
    // console.log(last_date && isDayOffsetByOne(dateString, last_date));
    if (last_date && isDayOffsetByOne(dateString, last_date)) {
        sharedTrip.push(schedule);
        navigator.clipboard.writeText(JSON.stringify(sharedTrip));
        showNotification(`接續分享連結！`);
    } else {
        sharedTrip = [schedule];
        navigator.clipboard.writeText(JSON.stringify(sharedTrip));
        showNotification(`已複製分享連結！`);
    }
    last_date = dateString;
}

function isDayOffsetByOne(dateA, dateB) {
    const toDate = (str) => {
        const [year, month, day] = str.split('-').map(Number);
        return new Date(year, month - 1, day); // month 0-based
    };

    const dA = toDate(dateA);
    const dB = toDate(dateB);

    const diffInMs = Math.abs(dA - dB);
    const oneDayInMs = 24 * 60 * 60 * 1000;

    return diffInMs === oneDayInMs;
}

let import_cache = undefined;

function parseData(input) {
    let API, json;

    // 正規表達式抓 API
    const apiMatch = input.match(/^API\s*=\s*([^;]+);?/);
    if (apiMatch) {
        API = apiMatch[1].trim();

        // 檢查是否後面還接著 JSON 物件
        const remaining = input.slice(apiMatch[0].length).trim();
        if (remaining.startsWith('[')) {
            try {
                json = JSON.parse(remaining);
            } catch (e) {
                console.warn("JSON parse error:", e);
            }
        }
    } else {
        // 若沒有 API= 開頭，視為純 JSON
        try {
            json = JSON.parse(input);
        } catch (e) {
            console.warn("JSON parse error:", e);
        }
    }

    return {API, json};
}

function readImportingTrips(linkJson) {
    let data = parseData(linkJson);
    if (data.API) {
        setAPIKey(data.API);
        alert("成功設定API Key!");
    }
    if (data.json) {
        import_cache = data.json;
        for (let i = 0; i < import_cache.length; i++) {
            for (let j = 0; j < import_cache[i].stops.length; j++) {
                import_cache[i].stops[j] = TripData.fromJSON(import_cache[i].stops[j]);
            }
        }
        openImportWindow(import_cache);
    }
}

function importTrips() {
    if (import_cache === undefined) return;
    for (const imp of import_cache) {
        let sim = createDayData(imp.date);
        sim.stops = imp.stops;
        updateDayBlock(sim);
    }
    import_cache = undefined;
}