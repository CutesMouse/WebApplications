const CARRY = 10000;

function getHashcode(x, y) {
    return x * CARRY + y;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function Room(x, y) {
    let attachment = {
        bottom: false,
        top: false,
        left: false,
        right: false
    };
    this.x = x;
    this.y = y;

    this.isAttach = function (room) {
        if (room.x === x) {
            if (room.y - y === 1) return attachment.top;
            else return attachment.bottom;
        }
        if (room.y === y) {
            if (room.x - x === 1) return attachment.right;
            else return attachment.left;
        }
        return false;
    }

    this.setAttach = function (room) {
        if (room.x === x) {
            if (room.y - y === 1) attachment.top = true;
            else attachment.bottom = true;
        }
        if (room.y === y) {
            if (room.x - x === 1) attachment.right = true;
            else attachment.left = true;
        }
    }

    this.hashCode = function () {
        return CARRY * x + y;
    }

    this.equals = function (room) {
        if (typeof room !== typeof this) return false;
        return this.hashCode() === room.hashCode();
    }

}

function Wall(a, b) {
    this.connected_A = a;
    this.connected_B = b;
}

function Maze(size_x, size_y) {
    let disjoint_set = new Map();
    let rooms = new Map();
    let walls = [];
    let answer = [];
    Object.defineProperty(this, 'walls', {
        get: function () {
            return walls;
        }
    });
    for (let x = 0; x < size_x; x++) {
        for (let y = 0; y < size_y; y++) {
            let r = new Room(x, y);
            rooms.set(r.hashCode(), r);
        }
    }

    for (let x = 0; x < size_x; x++) {
        for (let y = 0; y < size_y - 1; y++) {
            let a = rooms.get(getHashcode(x, y));
            let b = rooms.get(getHashcode(x, y + 1));
            walls.push(new Wall(a, b));
        }
    }

    for (let x = 0; x < size_x - 1; x++) {
        for (let y = 0; y < size_y; y++) {
            let a = rooms.get(getHashcode(x, y));
            let b = rooms.get(getHashcode(x + 1, y));
            walls.push(new Wall(a, b));
        }
    }

    this.generate = function () {
        shuffle(walls);
        let ptr = 0;
        while (!this.connected()) {
            let remove = walls[ptr];
            ptr++;
            let a = remove.connected_A;
            let b = remove.connected_B;
            if (this.isGrouped(a, b)) continue;
            this.link(a, b);
            a.setAttach(b);
            b.setAttach(a);
            walls[ptr - 1] = 0;
        }
    }

    this.getAnswer = function () {
        if (answer.length) return answer;
        let steps = new Map();
        steps.set(rooms.get(0), 0);
        let bfs = [];
        let walked = [];
        bfs.push(rooms.get(0));
        let dx = [1, 0, -1, 0];
        let dy = [0, 1, 0, -1];
        while (bfs.length) {
            let current = bfs.shift();
            let step = steps.get(current);
            for (let i = 0; i < 4; i++) {
                let nx = current.x + dx[i];
                let ny = current.y + dy[i];
                if (nx < 0 || ny < 0 || nx >= size_x || ny >= size_y) continue;
                if (walked.includes(getHashcode(nx, ny))) continue;
                let new_room = rooms.get(getHashcode(nx, ny));
                if (!current.isAttach(new_room)) continue;
                walked.push(getHashcode(nx, ny));
                steps.set(new_room, step + 1);
                bfs.push(new_room);
                if (nx === size_x - 1 && ny === size_y - 1) break;
            }
        }
        answer = [];
        let current = rooms.get(getHashcode(size_x - 1, size_y - 1));
        answer.push(current);
        while (current !== rooms.get(0)) {
            let step = steps.get(current);
            if (step === 1) break;
            for (let i = 0; i < 4; i++) {
                let nx = current.x + dx[i];
                let ny = current.y + dy[i];
                if (nx < 0 || ny < 0 || nx >= size_x || ny >= size_y) continue;
                let new_room = rooms.get(getHashcode(nx, ny));
                if (!(steps.has(new_room))) continue;
                if (steps.get(new_room) === step - 1 && new_room.isAttach(current)) {
                    answer.push(new_room);
                    current = new_room;
                    break;
                }
            }
        }
        answer.push(rooms.get(0));
        return answer;
    }

    this.connected = function () {
        let first = rooms.get(0);
        for (let x = 0; x < size_x; x++) {
            for (let y = 0; y < size_y; y++) {
                if (!this.isGrouped(first, rooms.get(getHashcode(x, y)))) return false;
            }
        }
        return true;
    }

    Object.defineProperty(this, 'size_x', {
        get: function () {
            return size_x;
        }
    })
    Object.defineProperty(this, 'size_y', {
        get: function () {
            return size_y;
        }
    })

    this.link = function (a, b) {
        if (this.isGrouped(a, b)) return;
        disjoint_set.set(rooms.get(this.find_group_name(b)), a.hashCode());
    }

    this.isGrouped = function (a, b) {
        if (a.equals(b)) return true;
        return this.find_group_name(a) === this.find_group_name(b);
    }

    this.find_group_name = function (room) {
        if (!disjoint_set.has(room)) {
            disjoint_set[room] = room.hashCode();
            return room.hashCode();
        }
        if (disjoint_set[room] === room.hashCode()) return room.hashCode();
        disjoint_set.set(room, this.find_group_name(rooms.get(disjoint_set.get(room))));
        return disjoint_set[room];
    }
}