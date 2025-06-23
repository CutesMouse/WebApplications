function addDays(dateString, days) {
    const date = new Date(dateString + 'T00:00:00Z');
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('zh-TW', {year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'});
};

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

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Helper to convert HH:MM string to minutes from midnight for sorting
function timeToMinutes(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return 9999; // Put stops without time at the end
    const [hours, minutes] = timeStr.split(':')[0].split(':').map(Number);
    return hours * 60 + minutes;
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