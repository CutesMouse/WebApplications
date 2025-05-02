let database = undefined;
const TRANSITION_TIME = 0.1; //s

function isFavorite(level, index) {
    if (database === undefined) loadDatabase();
    if (database[level] === undefined || database[level] === null) return false;
    return database[level].includes(index);
}

function loadDatabase() {
    let item = localStorage.getItem("favorite." + LEVEL);

    if (item === undefined || item === null) {
        database = [];
    } else {
        database = JSON.parse(item.replaceAll('*', 'null'));
    }
}

function exportDatabase() {
    if (database === undefined || database === null) loadDatabase();
    return JSON.stringify(database).replaceAll('null', '*');
}

function save() {
    if (database !== undefined) localStorage.setItem("favorite." + LEVEL, exportDatabase());
}

// value is a boolean number
function setFavorite(level, index, value) {
    if (database === undefined) loadDatabase();
    if (database[level] === undefined || database[level] === null) database[level] = [];
    if (value === true && !database[level].includes(index)) {
        database[level].push(index);
    } else {
        let i = database[level].indexOf(index);
        if (i !== -1) database[level].splice(i, 1);
    }
    save();
}

function getFavoriteDisplay(level, index) {
    let star = document.createElement("span");
    star.classList.add("star");
    if (isFavorite(level, index)) {
        star.innerHTML = "⭐";
    } else {
        star.innerHTML = "🔷";
        star.classList.add("not_toggled");
    }
    star.addEventListener("click", () => toggleFavorite(star, level, index));
    return star;
}

function updateFavoriteDisplay(star, level, index) {
    star.classList.add('shrink');
    setTimeout(() => {
        star.classList.remove('shrink');
        if (isFavorite(level, index)) {
            star.innerHTML = "⭐";
            star.classList.remove("not_toggled");
        } else {
            star.innerHTML = "🔷";
            star.classList.add("not_toggled");
        }
        updateFavoriteOptions();
    }, TRANSITION_TIME * 1000);

}

function toggleFavorite(star, level, index) {
    setFavorite(level, index, !isFavorite(level, index));
    updateFavoriteDisplay(star, level, index);
}

function importDatabase() {
    let data_source = document.getElementById('database');
    if (data_source === undefined || !data_source.value) {
        alert("導入失敗! 資料為空")
        return;
    }
    localStorage.setItem('favorite.' + LEVEL, data_source.value);
    loadDatabase();
    updateFavoriteOptions();
    alert("載入資料成功!");
}

function resetDatabase() {
    database = [];
    save();
    loadDatabase();
    updateFavoriteOptions();
    alert("重置資料成功!")
}