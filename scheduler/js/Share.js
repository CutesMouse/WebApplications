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
        showNotification("正在產生分享代碼");
        getToken(JSON.stringify(sharedTrip), token => {
            navigator.clipboard.writeText(token);
            showNotification(`接續分享代碼！`);
        });
    } else {
        sharedTrip = [schedule];
        getToken(JSON.stringify(sharedTrip), token => {
            navigator.clipboard.writeText(token);
            showNotification(`已複製分享代碼！`);
        });
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

function readImportingTrips(link) {
    let data = link.split("\n");
    let progress = 0;
    let total = 0;
    import_cache = [];
    for (const line of data) {
        if (line.startsWith("API=")) {
            setAPIKey(line.substring(4));
            alert("成功設定API Key!");
        } else {
            total++;
            showNotification("讀取資料中，請稍後");
            getText(line, d => {
                let segment = JSON.parse(d);
                for (let i = 0; i < segment.length; i++) {
                    for (let j = 0; j < segment[i].stops.length; j++) {
                        segment[i].stops[j] = TripData.fromJSON(segment[i].stops[j]);
                    }
                }
                import_cache.push(...segment);
                progress++;
                if (progress === total) {
                    showNotification("資料讀取完畢");
                    openImportWindow(import_cache);
                }
            });
        }
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
    showNotification("已成功匯入資料");
}

function getToken(text, handle) {
    fetch("https://hastebin.com/documents", {
        method: "POST",
        body: text,
        headers: {
            "Content-Type": "text/plain",
            "Authorization": 'Bearer 26e0b1fa9cddf81e1b875eb53656bf8078e6b7b0e51e05ebf888c7a2d57c9e884da18aad1ac01cea3540ce34f2a85d0052503baca61fdbd8aab162e34aacdd34'
        }
    }).then(res => res.json()).then(data => {
        handle(data.key);
    });
}

function getText(token, handle) {
    fetch("https://hastebin.com/raw/" + token, {
        method: "GET",
        headers: {
            "Content-Type": "text/plain",
            "Authorization": 'Bearer 26e0b1fa9cddf81e1b875eb53656bf8078e6b7b0e51e05ebf888c7a2d57c9e884da18aad1ac01cea3540ce34f2a85d0052503baca61fdbd8aab162e34aacdd34'
        }
    }).then(res => res.text()).then(data => {
        handle(data);
    });
}