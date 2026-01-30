export class CanvasManager {
    constructor(canvas, socketClient) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.socketClient = socketClient;

        this.isDrawing = false;
        this.currentStroke = [];
        this.myColor = '#000000';

        this.remotePaths = new Map();
        this.remoteCursors = new Map();

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupInputListeners();
    }

    setMyColor(color) {
        this.myColor = color;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.fullHistory = [];
        this.redraw();
    }

    setHistory(history) {
        this.fullHistory = history;
        this.redraw();
    }

    setupInputListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => this.moveDrawing(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', () => this.endDrawing());
        this.canvas.addEventListener('mouseout', () => this.endDrawing());

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDrawing(touch.clientX, touch.clientY);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.moveDrawing(touch.clientX, touch.clientY);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endDrawing();
        });
    }

    startDrawing(x, y) {
        this.isDrawing = true;
        this.currentStroke = [{ x, y }];

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.strokeStyle = this.myColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.socketClient.emitDrawStart({ x, y });
    }

    moveDrawing(x, y) {
        this.socketClient.emitCursorMove({ x, y });

        if (!this.isDrawing) return;

        this.currentStroke.push({ x, y });

        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.socketClient.emitDrawPoint({ x, y });
    }

    endDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.ctx.closePath();

        this.socketClient.emitDrawEnd();

        if (this.currentStroke.length > 1) {
            this.socketClient.emitSaveStroke({
                points: this.currentStroke,
                color: this.myColor,
                size: 3
            });
        }
        this.currentStroke = [];
    }

    onRemoteDrawStart(data) {
        console.log('Remote Draw Start:', data);
        const { userId, x, y, color } = data;
        this.remotePaths.set(userId, {
            points: [{ x, y }],
            color: color
        });
    }

    onRemoteDrawPoint(data) {
        const { userId, x, y } = data;
        let pathData = this.remotePaths.get(userId);

        if (!pathData) {
            console.warn('Received draw-point without active path for user:', userId);
            pathData = {
                points: [{ x, y }],
                color: '#000000'
            };
            this.remotePaths.set(userId, pathData);
            return;
        }

        pathData.points.push({ x, y });

        const prev = pathData.points[pathData.points.length - 2];

        this.ctx.beginPath();
        this.ctx.strokeStyle = pathData.color || '#000';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.moveTo(prev.x, prev.y);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    onRemoteDrawEnd(data) {
        console.log('Remote Draw End:', data);
        const { userId } = data;
        this.remotePaths.delete(userId);
        this.redraw();
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.fullHistory) {
            this.fullHistory.forEach(stroke => {
                this.drawStroke(stroke);
            });
        }

        this.remotePaths.forEach((pathData) => {
            this.drawStroke({
                points: pathData.points,
                color: pathData.color,
                size: 3
            });
        });
    }

    drawStroke(stroke) {
        if (!stroke.points || stroke.points.length < 2) return;

        this.ctx.beginPath();
        this.ctx.strokeStyle = stroke.color;
        this.ctx.lineWidth = stroke.size || 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        this.ctx.stroke();
        this.ctx.closePath();
    }

    updateRemoteCursor(data) {
        this.remoteCursors.set(data.userId, data);
    }

    removeRemoteCursor(userId) {
        this.remoteCursors.delete(userId);
    }

    renderCursors() {
    }
}
