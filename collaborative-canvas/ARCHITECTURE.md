# Architecture - Collaborative Canvas

## Overview
This application is a real-time multi-user drawing platform utilizing HTML5 Canvas and WebSockets. The architecture is split into a "Thin Client" responsible for rendering and capturing input, and an "Authoritative Server" responsible for state management and broadcasting events.

## Components

### 1. Server (Node.js + Socket.io)
- **Role**: The central source of truth.
- **Responsibilities**:
    - **Connection Management**: Handles client connections/disconnections.
    - **State Management**: Maintains the global drawing history (list of strokes).
    - **Event Broadcasting**: Relays drawing events to other clients.
    - **Undo Mechanism**: Manages the undo stack per user/globally to ensure consistency.
- **Modules**:
    - `server.js`: Entry point, WebSocket setup.
    - `state-manager.js`: Stores strokes and handles undo logic.
    - `rooms.js`: Manages connected users (optional for single room).

### 2. Client (Vanilla JS)
- **Role**: Renders the UI and captures user intent.
- **Responsibilities**:
    - **Input Capture**: Mouse/Touch events mapped to canvas coordinates.
    - **Rendering**: Draws paths on the HTML5 Canvas 2D context.
    - **Network Sync**: Emits 'draw' events and listens for 'draw', 'history', 'undo' events.
    - **Ghost Cursors**: Renders remote users' cursor positions.
- **Modules**:
    - `canvas.js`: Core drawing logic.
    - `websocket.js`: Socket.io client wrapper.
    - `main.js`: Initialization.

## State Synchronization

### Data Model
A **Stroke** is defined as:
```json
{
  "id": "uuid-v4",
  "userId": "socket-id",
  "color": "#000000",
  "size": 5,
  "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }, ...]
}
```

### Events
- **`connection`**: Server sends full `history` to the new client.
- **`draw-start`, `draw-point`, `draw-end`**: Client sends these. Server aggregates them into a stroke or broadcasts them live.
    - *Decision*: To ensure smooth potential curves, we will broadcast points live for real-time feedback, and store the completed stroke for history.
- **`undo`**: Client requests undo. Server removes the last stroke by that `userId`, then broadcasts the updated `history` (or a specific `undo` event) to all clients to trigger a redraw.
- **`cursor-move`**: Client sends x,y. Server broadcasts to others.

## Conflict Resolution
- **Optimistic Updates**: Clients draw immediately locally.
- **Server Authority**: The server's history is the absolute truth. If an inconsistency is detected (rare in this simple append-only model), the server can force a full history reload.
- **Race Conditions**: Handled by the single-threaded nature of Node.js event loop for processing incoming messages.

## Undo Logic
1. Server maintains a list of `completedStrokes`.
2. When User A clicks undo:
    - Server searches `completedStrokes` backwards for the last stroke where `userId === UserA`.
    - Removes it.
    - Broadcasts `history-update` (full or delta) to all clients.
3. Clients clear canvas and redraw based on new history.
