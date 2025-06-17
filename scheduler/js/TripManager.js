let trips = undefined;

function initializeData() {
    let data = localStorage.getItem("trip-data");
    if (data === null) trips = [];
    else {
        trips = JSON.parse(data);
        for (let i = 0; i < trips.length; i++) {
            for (let j = 0; j < trips[i].stops.length; j++) {
                trips[i].stops[j] = TripData.fromJSON(trips[i].stops[j]);
            }
        }
    }
}

// 新增函數：根據日期獲取行程
function getSchedule(dateString) {
    return trips.find(trip => trip.date === dateString);
}

function createDayData(date) {
    let sc = getSchedule(date);
    if (sc !== undefined) {
        return sc;
    }
    let day = {
        date: date,
        stops: []
    }
    trips.push(day);
    saveData();
    return day;
}

function deleteData(date, index) {
    let schedule = getSchedule(date);
    if (schedule === undefined) return;
    schedule.stops.splice(index, 1);
    saveData();
    updateDayBlock(schedule);
}

function createData(date, name, time, distance, duration, mapUrl, icon) {
    let schedule = createDayData(date);
    let newdata = new TripData(name, date, time, distance, duration, mapUrl, icon);
    let i = 0;
    for (i = 0; i < schedule.stops.length; i++) {
        if (schedule.stops[i].greater(newdata)) break;
    }
    schedule.stops.splice(i, 0, newdata);
    saveData();
    updateDayBlock(schedule);
}

function findSimilar(name) {
    for (let i = trips.length - 1; i >= 0; i--) {
        for (let j = trips[i].stops.length - 1; j >= 0; j--) {
            if (trips[i].stops[j].name === name) return trips[i].stops[j];
        }
    }
    return null;
}

function autoArrange(date, travelMode) {
    let schedule = getSchedule(date);
    if (schedule === undefined) return;
    let stops = schedule.stops;
    for (let i = 1; i < stops.length; i++) {
        let origin = stops[i - 1].name;
        let dest = stops[i].name;
        let departure_time = new Date(date + "T" + stops[i - 1].time + "Z");
        arrange(origin, dest, travelMode, departure_time, result => {
            if (result.status === "error") return;
            stops[i].duration = (travelMode === "TRANSIT" ? "大眾運輸 " : "開車 ") + result.duration;
            stops[i].distance = result.distance;
            updateDayBlock(schedule);
        });
    }
}

function updateDayBlock(dayData) {
    saveData();
    renderDayBlock(dayData, false, true);
}

function saveData() {
    localStorage.setItem("trip-data", JSON.stringify(trips));
}

initializeData();

// let test = createDayData("2025-06-16");
// test.stops.push(new TripData("舊書店", "2025-06-16","09:00-10:00", "", "", "https://maps.google.com"));
// test.stops.push(new TripData("偉祥家露營", "2025-06-16", "19:30-20:05", "1.5km", "7mins", "https://maps.google.com"));
// test.stops.push(new TripData("復古咖啡廳", "2025-06-16", "20:30-21:30", "1.5km", "7mins", "https://maps.google.com"));
// saveData();


// 所有行程數據，包含多天的行程
// 如果某天的 stops 陣列為空，則表示當天沒有安排行程
// const allTrips = [
//     {date: "2025-06-10", stops: []},
//     {date: "2025-06-11", stops: []},
//     {date: "2025-06-12", stops: []},
//     {
//         date: "2025-06-14", stops: [
//             {
//                 name: "城市公園",
//                 time: "08:00 - 09:00",
//                 distance: "",
//                 duration: "",
//                 mapUrl: "https://maps.google.com",
//                 icon: "🌳",
//                 past: true
//             },
//             {
//                 name: "科學博物館",
//                 time: "09:30 - 12:00",
//                 distance: "4km",
//                 duration: "20mins",
//                 mapUrl: "https://maps.google.com",
//                 icon: "🔬",
//                 past: true
//             }
//         ]
//     },
//     {
//         date: "2025-06-15", stops: [
//             {
//                 name: "早餐咖啡廳",
//                 time: "08:30 - 09:00",
//                 distance: "",
//                 duration: "",
//                 mapUrl: "https://maps.google.com",
//                 icon: "🍳",
//                 past: true
//             },
//             {
//                 name: "藝術博物館",
//                 time: "09:30 - 11:00",
//                 distance: "2.5km",
//                 duration: "10mins",
//                 mapUrl: "https://maps.google.com",
//                 icon: "🖼️",
//                 past: true
//             },
//             {
//                 name: "午餐地點",
//                 time: "12:00 - 13:00",
//                 distance: "3km",
//                 duration: "15mins",
//                 mapUrl: "https://maps.google.com",
//                 icon: "🍜",
//                 past: false
//             },
//             {
//                 name: "購物中心",
//                 time: "14:00 - 16:00",
//                 distance: "1.2km",
//                 duration: "5mins",
//                 mapUrl: "https://maps.google.com",
//                 icon: "🛍️",
//                 past: false
//             }
//         ]
//     },
//     {
//         date: "2025-06-16", stops: [
//             {
//                 name: "登山步道",
//                 time: "07:00 - 11:00",
//                 distance: "",
//                 duration: "",
//                 mapUrl: "https://maps.google.com",
//                 icon: "⛰️",
//                 past: false
//             },
//             {
//                 name: "山景餐廳",
//                 time: "12:30 - 13:30",
//                 distance: "5km",
//                 duration: "25mins",
//                 mapUrl: "https://maps.google.com",
//                 icon: "🍲",
//                 past: false
//             }
//         ]
//     },
//     {date: "2025-06-17", stops: []},
//     {
//         date: "2025-06-18", stops: [
//             {
//                 name: "動物園",
//                 time: "09:00 - 12:00",
//                 distance: "",
//                 duration: "",
//                 mapUrl: "https://maps.google.com",
//                 icon: "🐒",
//                 past: false
//             },
//             {
//                 name: "植物園",
//                 time: "13:30 - 16:00",
//                 distance: "2km",
//                 duration: "10mins",
//                 mapUrl: "https://maps.google.com",
//                 icon: "🌺",
//                 past: false
//             }
//         ]
//     },
//     {date: "2025-06-19", stops: []},
//     {
//         date: "2025-06-20", stops: [
//             {
//                 name: "夜市",
//                 time: "18:00 - 22:00",
//                 distance: "",
//                 duration: "",
//                 mapUrl: "https://maps.google.com",
//                 icon: "🌃",
//                 past: false
//             }
//         ]
//     },
//     {date: "2025-06-21", stops: []},
//     {date: "2025-06-22", stops: []}
// ];