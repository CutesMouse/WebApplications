// --- Calendar Functions ---
function openCalendar() {
    calendarDate = new Date(); // Reset to current month on open
    renderCalendar(calendarDate.getFullYear(), calendarDate.getMonth());
    document.getElementById('calendar-modal').classList.remove('hidden');
}

function closeCalendar() {
    document.getElementById('calendar-modal').classList.add('hidden');
    backToOverview();
}

function renderCalendar(year, month) {
    const grid = document.getElementById('cal-grid');
    const monthYearEl = document.getElementById('cal-month-year');
    grid.innerHTML = '';

    monthYearEl.textContent = `${year}年 ${month + 1}月`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Day names header
    ['日', '一', '二', '三', '四', '五', '六'].forEach(day => {
        const dayNameEl = document.createElement('div');
        dayNameEl.className = 'calendar-day-name';
        dayNameEl.textContent = day;
        grid.appendChild(dayNameEl);
    });

    // Blank days for the first week
    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement('div'));
    }

    // Date cells
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    for (let day = 1; day <= daysInMonth; day++) {
        const dateEl = document.createElement('div');
        dateEl.textContent = day;
        dateEl.className = 'calendar-date';

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dateEl.dataset.date = dateString;

        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dateEl.classList.add('today');
        }

        const dayData = getSchedule(dateString);
        if (dayData && dayData.stops.length > 0) {
            const dot = document.createElement('div');
            dot.className = 'event-dot';
            dateEl.appendChild(dot);
        }

        dateEl.addEventListener('click', () => {
            // Handle double click: jump to date
            if (dateEl.classList.contains('selected')) {
                jumpToDate(dateString);
                return;
            }
            // Handle single click: show summary
            document.querySelectorAll('#cal-grid .calendar-date').forEach(d => d.classList.remove('selected'));
            dateEl.classList.add('selected');
            showCalendarDaySummary(dateString);
        });

        grid.appendChild(dateEl);
    }
}

function showCalendarDaySummary(dateString) {
    const container = document.getElementById('cal-summary-container');
    const dayData = getSchedule(dateString);
    renderSummaryVisualization(container, dayData ? dayData.stops : []);
}

function jumpToDate(dateString) {
    closeCalendar();
    timeline.innerHTML = ''; // Clear the timeline
    loadingSpinner.classList.add('hidden');

    const centralDate = dateString;
    minLoadedDate = addDays(centralDate, -1);
    maxLoadedDate = addDays(centralDate, 1);

    loadDays(minLoadedDate, 3, false);

    setTimeout(() => {
        const currentDayElement = document.querySelector(`[data-date="${centralDate}"]`);
        if (currentDayElement) {
            window.scrollTo({
                top: currentDayElement.offsetTop - (window.innerHeight / 3),
                behavior: 'smooth'
            });
        }
    }, 100);
}

document.getElementById('cal-prev-month').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar(calendarDate.getFullYear(), calendarDate.getMonth());
});

document.getElementById('cal-next-month').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar(calendarDate.getFullYear(), calendarDate.getMonth());
});