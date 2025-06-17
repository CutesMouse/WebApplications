const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // 切換區塊
        const targetId = item.dataset.target;
        closeCalendar();
        closeImportModal();
        closeImportTextWindow();
        switch (targetId) {
            case "overview":
                if (isEditMode) toggleEdit();
                screens.forEach(screen => {
                    screen.classList.toggle('active', screen.id === "overview");
                });
                break;
            case "calendar":
                if (isEditMode) toggleEdit();
                openCalendar();
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

addScrollEvent(() => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY) {
        navbar.classList.add('nav-hidden'); // 往下滑，隱藏
    } else {
        navbar.classList.remove('nav-hidden'); // 往上滑，顯示
    }
    lastScrollY = currentScrollY;
})