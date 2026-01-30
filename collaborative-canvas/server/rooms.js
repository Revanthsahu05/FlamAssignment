class RoomManager {
    constructor() {
        this.users = new Map();
    }

    addUser(socketId) {
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const user = {
            id: socketId,
            color: color,
            x: 0,
            y: 0
        };
        this.users.set(socketId, user);
        return user;
    }

    removeUser(socketId) {
        this.users.delete(socketId);
    }

    getUser(socketId) {
        return this.users.get(socketId);
    }

    getAllUsers() {
        return Array.from(this.users.values());
    }

    updateCursor(socketId, x, y) {
        const user = this.users.get(socketId);
        if (user) {
            user.x = x;
            user.y = y;
        }
    }
}

module.exports = new RoomManager();
