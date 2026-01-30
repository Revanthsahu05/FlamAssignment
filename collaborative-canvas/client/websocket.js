export class SocketClient {
    constructor(callbacks) {
        this.socket = io();
        this.callbacks = callbacks;

        this.setupListeners();
    }

    setupListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            if (this.callbacks.onConnect) this.callbacks.onConnect();
        });

        this.socket.on('init', (data) => {
            if (this.callbacks.onInit) this.callbacks.onInit(data);
        });

        this.socket.on('user-joined', (user) => {
            if (this.callbacks.onUserJoined) this.callbacks.onUserJoined(user);
        });

        this.socket.on('user-left', (userId) => {
            if (this.callbacks.onUserLeft) this.callbacks.onUserLeft(userId);
        });

        this.socket.on('draw-start', (data) => {
            if (this.callbacks.onRemoteDrawStart) this.callbacks.onRemoteDrawStart(data);
        });

        this.socket.on('draw-point', (data) => {
            if (this.callbacks.onRemoteDrawPoint) this.callbacks.onRemoteDrawPoint(data);
        });

        this.socket.on('draw-end', (data) => {
            if (this.callbacks.onRemoteDrawEnd) this.callbacks.onRemoteDrawEnd(data);
        });

        this.socket.on('history-update', (history) => {
            if (this.callbacks.onHistoryUpdate) this.callbacks.onHistoryUpdate(history);
        });

        this.socket.on('cursor-update', (data) => {
            if (this.callbacks.onCursorUpdate) this.callbacks.onCursorUpdate(data);
        });
    }

    emitDrawStart(data) {
        this.socket.emit('draw-start', data);
    }

    emitDrawPoint(data) {
        this.socket.emit('draw-point', data);
    }

    emitDrawEnd() {
        this.socket.emit('draw-end');
    }

    emitSaveStroke(stroke) {
        this.socket.emit('save-stroke', stroke);
    }

    emitCursorMove(pos) {
        this.socket.emit('cursor-move', pos);
    }

    emitUndo() {
        this.socket.emit('undo');
    }
}
