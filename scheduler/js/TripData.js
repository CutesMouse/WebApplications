class TripData {
    constructor(name, date, time, distance, duration, mapUrl, icon) {
        this.name = name; // 台北101
        this.date = date;
        this.time = time; // 11:00-12:30
        this.distance = distance; // 離前面景點的距離 (第一個單位不顯示)
        this.duration = duration; // 離前面景點的時間
        this.mapUrl = mapUrl; // 地圖url
        this.icon = icon; // Emoji
    }

    toJSON() {
        return {
            // __type: 'TripData',
            version: '1.0',
            name: this.name,
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
        return new TripData(json.name, json.date, json.time, json.distance, json.duration, json.mapUrl, json.icon);
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

    greater(tripdata) {
        const former = new Date(this.date + "T" + this.time.split("-")[0]); // 將 "2025-06-12 13:00" 轉為 ISO 格式
        const latter = new Date(tripdata.date + "T" + tripdata.time.split("-")[0]);
        return former > latter;
    }
}