# Collaborative Canvas

A real-time multi-user drawing application built with Node.js, Socket.io, and HTML5 Canvas.

## Features
- **Real-time Drawing**: See other users draw in real-time.
- **Shared Canvas**: persistent state for all joined users.
- **Ghost Cursors**: Track other users' mouse movements.
- **Undo**: Remove your last stroke without affecting others' work.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Server**
   ```bash
   npm start
   ```

3. **Open Client**
   Open `http://localhost:3000` in multiple browser tabs/windows.

## technical Details
See [ARCHITECTURE.md](./ARCHITECTURE.md) for design details.
