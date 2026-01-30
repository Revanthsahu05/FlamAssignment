const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const stateManager = require('./state-manager');
const roomManager = require('./rooms');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname, '../client')));

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const user = roomManager.addUser(socket.id);

    socket.emit('init', {
        history: stateManager.getHistory(),
        users: roomManager.getAllUsers(),
        yourId: socket.id,
        yourColor: user.color
    });

    socket.broadcast.emit('user-joined', user);

    socket.on('draw-start', (data) => {
        console.log('draw-start from', socket.id);
        socket.broadcast.emit('draw-start', { ...data, userId: socket.id, color: user.color });
    });

    socket.on('draw-point', (data) => {
        console.log('draw-point from', socket.id);
        socket.broadcast.emit('draw-point', { ...data, userId: socket.id });
    });

    socket.on('draw-end', () => {
        console.log('draw-end from', socket.id);
        socket.broadcast.emit('draw-end', { userId: socket.id });
    });

    socket.on('save-stroke', (strokeData) => {
        const stroke = {
            ...strokeData,
            userId: socket.id,
            color: user.color,
            id: require('uuid').v4()
        };
        stateManager.addStroke(stroke);

        io.emit('history-update', stateManager.getHistory());

        socket.broadcast.emit('draw-end', { userId: socket.id });
    });

    socket.on('cursor-move', (pos) => {
        roomManager.updateCursor(socket.id, pos.x, pos.y);
        socket.broadcast.emit('cursor-update', {
            userId: socket.id,
            x: pos.x,
            y: pos.y,
            color: user.color
        });
    });

    socket.on('undo', () => {
        console.log('Undo requested by', socket.id);
        const success = stateManager.undoLastUserStroke(socket.id);
        if (success) {
            console.log('Undo successful for', socket.id);
            io.emit('history-update', stateManager.getHistory());
        } else {
            console.log('Undo failed (no strokes) for', socket.id);
        }
    });

    socket.on('clear-board', () => {
        console.log('Clear board requested by', socket.id);
        stateManager.clear();
        io.emit('history-update', []);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        roomManager.removeUser(socket.id);
        io.emit('user-left', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
