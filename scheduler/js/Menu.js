const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // 切換區塊
        const targetId = item.dataset.target;
        closeCalendar();
        closeImportModal();
        closeImportTextWindow();
        closeAIWindow();
        closeAIConfirmModal();
        switch (targetId) {
            case "overview":
                if (isEditMode) toggleEdit();
                screens.forEach(screen => {
                    screen.classList.toggle('active', screen.id === "overview");
                });
                break;
            case "calendar":
                if (isEditMode) toggleEdit();
                openCalendar(dateString => jumpToDate(dateString));
                screens.forEach(screen => {
                    screen.classList.toggle('active', screen.id === "overview");
                });
                break;
            case "itinerary":
                if (!isEditMode) toggleEdit();
                screens.forEach(screen => {
                    screen.classList.toggle('active', screen.id === "overview");
                });
                break;
            case "import":
                if (isEditMode) toggleEdit();
                openImportTextWindow();
                screens.forEach(screen => {
                    screen.classList.toggle('active', screen.id === "overview");
                });
                break;
            default:
                screens.forEach(screen => {
                    screen.classList.toggle('active', screen.id === targetId);
                    scrollToNow();
                });
        }
        // 更新導覽列樣式
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });
});

function backToOverview() {
    navItems.forEach(item => {
        if (item.dataset.target === "overview") item.classList.add('active');
        else item.classList.remove('active');
    })
}

// 控制導覽列顯示 / 隱藏
let lastScrollY = window.scrollY;
const navbar = document.getElementById('navbar');
let forceHidden = false;

addScrollEvent(() => {
    const currentScrollY = window.scrollY;
    if (forceHidden || currentScrollY > lastScrollY) {
        navbar.classList.add('nav-hidden'); // 往下滑，隱藏
    } else {
        navbar.classList.remove('nav-hidden'); // 往上滑，顯示
    }
    lastScrollY = currentScrollY;
});

new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
            const el = mutation.target;
            const oldClassList = mutation.oldValue?.split(" ") || [];
            const currentClassList = Array.from(el.classList);

            const isModal = currentClassList.includes("modal-backdrop");
            const hasHidden = currentClassList.includes("hidden");
            const hadHidden = oldClassList.includes("hidden");

            if (isModal) {
                if (hadHidden && !hasHidden) { // modal is open
                    forceHidden = true;
                    navbar.classList.add('nav-hidden');
                } else if (!hadHidden && hasHidden) forceHidden = false; // modal is closed
            }
        }
    }
}).observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ["class"],
    attributeOldValue: true
});