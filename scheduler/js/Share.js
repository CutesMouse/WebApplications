let sharedTrip = [];
let last_date = "";

function openShareNotification(token) {
    const modal = document.getElementById('share-notification-modal');
    const tokenDisplay = document.getElementById('share-token-display');

    tokenDisplay.textContent = token || 'NO-TOKEN';
    modal.classList.remove('hidden');

    // Use a short timeout to allow the display property to apply before transitioning
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeShareNotification() {
    const modal = document.getElementById('share-notification-modal');
    modal.classList.remove('show');

    // 等待動畫結束後再隱藏元素
    // 此處時間應與 CSS transition duration 一致 (0.3s = 300ms)
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function shareToken() {
    const tokenDisplay = document.getElementById('share-token-display');
    const token = tokenDisplay.textContent;

    shareText(token);
}

function copyShareToken() {
    const tokenDisplay = document.getElementById('share-token-display');
    const token = tokenDisplay.textContent;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(token).then(() => {
            showNotification(`已複製！`);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            showNotification('複製失敗！');
        });
    } else {
        // Fallback for older browsers
        try {
            const textArea = document.createElement("textarea");
            textArea.value = token;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification(`已複製！`);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            showNotification('複製失敗！');
        }
    }
}

function shareTrip(dateString) {
    closeShareNotification();
    let schedule = createDayData(dateString);

    for (const trip of sharedTrip) {
        if (trip.date === dateString) {
            showNotification(`重複的行程！`);
            last_date = dateString;
            return;
        }
    }
    // console.log(last_date && isDayOffsetByOne(dateString, last_date));
    if (last_date && isDayOffsetByOne(dateString, last_date)) {
        sharedTrip.push(schedule);
        showNotification("正在產生分享碼");
        getToken(JSON.stringify(sharedTrip), token => {
            openShareNotification(token);
            showNotification(`已串接分享碼！`);
        });
    } else {
        sharedTrip = [schedule];
        showNotification("正在產生分享碼");
        getToken(JSON.stringify(sharedTrip), token => {
            openShareNotification(token);
            showNotification(`已產生分享碼！`);
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
            showNotification("成功設定API Key！");
        } else {
            total++;
            showNotification("讀取資料中...");
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
                    showNotification("資料讀取完畢！");
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

function shareText(text) {
    if (navigator.share) {
        navigator.share({
            text: text
        }).catch(err => {
            console.warn("使用者取消或分享失敗：", err);
        });
    } else {
        showNotification("此瀏覽器不支援分享功能");
    }
}
