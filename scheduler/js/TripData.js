class TripData {
    constructor(name, display_name, date, time, distance, duration, mapUrl, icon, description = undefined) {
        this.name = name; // 台北101
        this.display_name = display_name;
        this.date = date;
        this.time = time; // 11:00-12:30
        this.distance = distance; // 離前面景點的距離 (第一個單位不顯示)
        this.duration = duration; // 離前面景點的時間
        this.mapUrl = mapUrl; // 地圖url
        this.icon = icon; // Emoji
        this.description = description; // 描述，只有AI產生時會有，不會被存入資料庫中
    }

    toJSON() {
        return {
            __type: 'TripData',
            version: '1.1',
            name: this.name,
            display_name: this.display_name,
            date: this.date,
            time: this.time,
            distance: this.distance,
            duration: this.duration,
            mapUrl: this.mapUrl,
            icon: this.icon,
        };
    }

    // 從 JSON 轉回 class instance
    static fromJSON(json) {
        return new TripData(json.name, json.display_name, json.date, json.time, json.distance, json.duration, json.mapUrl, json.icon, json.description);
    }

    get past() {
        const inputTime = new Date(this.date + "T" + this.time.split("-")[1]); // 將 "2025-06-12 13:00" 轉為 ISO 格式
        const now = new Date();
        return inputTime < now;
    }

    get image() {
        if (!this.icon) return "📍";
        else return this.icon;
    }

    get display_text() {
        if (this.display_name) return this.display_name;
        return this.name;
    }

    greater(tripdata) {
        return this.greaterByTime(tripdata.date, tripdata.time.split("-")[0]);
    }

    greaterByTime(date, time) {
        const former = new Date(this.date + "T" + this.time.split("-")[0]); // 將 "2025-06-12 13:00" 轉為 ISO 格式
        const latter = new Date(date + "T" + time);
        return former > latter;
    }
}