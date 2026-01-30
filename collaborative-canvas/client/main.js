import { CanvasManager } from './canvas.js';
import { SocketClient } from './websocket.js';

const log = (msg, type = 'info') => {
    console.log(msg);
};

const canvas = document.getElementById('drawing-board');
const cursorCanvas = document.createElement('canvas');
cursorCanvas.id = 'cursor-layer';
cursorCanvas.style.position = 'absolute';
cursorCanvas.style.top = '0';
cursorCanvas.style.left = '0';
cursorCanvas.style.width = '100%';
cursorCanvas.style.height = '100%';
cursorCanvas.style.pointerEvents = 'none';
document.body.appendChild(cursorCanvas);

const statusEl = document.getElementById('status');
const usersEl = document.getElementById('active-users');
const undoBtn = document.getElementById('undo-btn');

log('Starting application...');

let canvasManager;
let socketClient;
let cursorCtx = cursorCanvas.getContext('2d');
let remoteCursors = new Map();

function resizeCursorCanvas() {
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCursorCanvas);
resizeCursorCanvas();

function animateCursors() {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

    remoteCursors.forEach((data, userId) => {
        const { x, y, color } = data;

        cursorCtx.beginPath();
        cursorCtx.arc(x, y, 5, 0, Math.PI * 2);
        cursorCtx.fillStyle = color;
        cursorCtx.fill();

        cursorCtx.fillStyle = '#000';
        cursorCtx.font = '10px sans-serif';
        cursorCtx.fillText(`User ${userId.substr(0, 4)}`, x + 8, y + 8);
    });

    requestAnimationFrame(animateCursors);
}
requestAnimationFrame(animateCursors);

socketClient = new SocketClient({
    onConnect: () => {
        statusEl.textContent = 'Connected';
        log('Socket Connected!');
    },
    onInit: (data) => {
        log(`Init received. History: ${data.history.length}, Users: ${data.users.length}`);
        canvasManager.setHistory(data.history);
        canvasManager.setMyColor(data.yourColor);
        data.users.forEach(u => {
            if (u.id !== data.yourId) {
                remoteCursors.set(u.id, u);
            }
        });
        usersEl.textContent = `Users: ${data.users.length}`;
    },
    onUserJoined: (user) => {
        log(`User joined: ${user.id}`);
        remoteCursors.set(user.id, user);
        usersEl.textContent = `Users: ${remoteCursors.size + 1}`;
    },
    onUserLeft: (userId) => {
        log(`User left: ${userId}`);
        remoteCursors.delete(userId);
        canvasManager.removeRemoteCursor(userId);
        usersEl.textContent = `Users: ${remoteCursors.size + 1}`;
    },
    onRemoteDrawStart: (data) => {
        canvasManager.onRemoteDrawStart(data);
    },
    onRemoteDrawPoint: (data) => {
        canvasManager.onRemoteDrawPoint(data);
    },
    onRemoteDrawEnd: (data) => {
        canvasManager.onRemoteDrawEnd(data);
    },
    onHistoryUpdate: (history) => {
        log(`History update: ${history.length} strokes`);
        canvasManager.setHistory(history);
    },
    onCursorUpdate: (data) => {
        remoteCursors.set(data.userId, data);
    }
});

canvasManager = new CanvasManager(canvas, socketClient);

undoBtn.addEventListener('click', () => {
    socketClient.emitUndo();
});

document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire board for everyone?')) {
        socketClient.socket.emit('clear-board');
    }
});
