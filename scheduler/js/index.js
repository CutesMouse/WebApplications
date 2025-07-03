let scrollEvents = [];

function addScrollEvent(func) {
    scrollEvents.push(func);
}

window.addEventListener('scroll', function (event) {
    for (let e of scrollEvents) {
        e(event);
    }
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

// 點空白處關閉選單
window.addEventListener('click', function(e) {
    // 找到所有處於 active 狀態的 container 並移除 class
    document.querySelectorAll('.day-container.menu-active').forEach(container => {
        container.classList.remove('menu-active');
    });
    // 隱藏所有選單
    document.querySelectorAll('.day-menu:not(.hidden)').forEach(menu => {
        menu.classList.add('hidden');
    });
    // 關閉Autocomplete選單
    const autocompleteContainer = document.querySelector('.autocomplete-container');
    if (autocompleteContainer && !autocompleteContainer.contains(e.target)) {
        const resultsContainer = document.getElementById('autocomplete-results');
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
    }
});

// Initialize the two draggable selector components
createDraggableSelector('start-location-selector', '選擇起始位置');
createDraggableSelector('end-location-selector', '選擇終點位置');
createDraggableSelector('route-start-location-selector', '選擇起始行程');
createDraggableSelector('route-end-location-selector', '選擇終點行程');