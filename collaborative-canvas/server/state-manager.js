const MAX_HISTORY = 10000;

class StateManager {
    constructor() {
        this.history = [];
    }

    addStroke(stroke) {
        this.history.push(stroke);
        if (this.history.length > MAX_HISTORY) {
            this.history.shift();
        }
        return this.history;
    }

    getHistory() {
        return this.history;
    }

    undoLastUserStroke(userId) {
        for (let i = this.history.length - 1; i >= 0; i--) {
            if (this.history[i].userId === userId) {
                this.history.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    clear() {
        this.history = [];
    }
}

module.exports = new StateManager();
