let scrollEvents = [];

function addScrollEvent(func) {
    scrollEvents.push(func);
}

window.addEventListener('scroll', function (event) {
    for (let e of scrollEvents) {
        e(event);
    }
})

function pad(num) {
    return num.toString().padStart(2, '0');
}

// 設定最近整點時間
function setTimeDefault(date) {
    const startInput = document.getElementById('edit-startTime');
    const endInput = document.getElementById('edit-endTime');

    let now = new Date();

    let schedule = getSchedule(date);
    if (schedule !== undefined && schedule.stops.length)
        now = new Date(date + "T" + schedule.stops[schedule.stops.length - 1].time.split('-')[1]);

    // 設定到下一個整點
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);

    const startHour = now.getHours();
    const startMinute = now.getMinutes();
    startInput.value = `${pad(startHour)}:${pad(startMinute)}`;

    // endTime = startTime + 1 小時
    now.setHours(startHour + 1);
    const endHour = now.getHours();
    endInput.value = `${pad(endHour)}:${pad(startMinute)}`;
}

// 當 startTime 改變，自動設 endTime = startTime + 1 小時
document.getElementById('edit-startTime').addEventListener('change', function () {
    const startInput = document.getElementById('edit-startTime');
    const endInput = document.getElementById('edit-endTime');

    const [h, m] = startInput.value.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;

    const newEnd = new Date();
    newEnd.setHours(h + 1);
    newEnd.setMinutes(m);
    endInput.value = `${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}`;
});

// 禁止快速雙擊觸發放大
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault(); // 防止雙擊放大
    }
    lastTouchEnd = now;
}, false);
// 阻止縮放手勢
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});
document.addEventListener('gesturechange', function (e) {
    e.preventDefault();
});
document.addEventListener('gestureend', function (e) {
    e.preventDefault();
});
window.addEventListener('touchmove', function (event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });
