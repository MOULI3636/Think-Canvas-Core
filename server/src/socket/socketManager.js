module.exports = (io) => {
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', ({ roomId, userId, name }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;
      socket.data.userName = name;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          participants: new Map(),
          isLocked: false,
          hostId: userId,
          canvasSnapshot: '',
          canvasPages: [''],
          activePageIndex: 0,
          sharedFiles: [],
          screenShares: new Map()
        });
      }

      const roomData = rooms.get(roomId);
      roomData.participants.set(userId, {
        name,
        socketId: socket.id,
        isHost: userId === roomData.hostId
      });

      const participants = [];
      roomData.participants.forEach((value, key) => {
        participants.push({
          id: key,
          name: value.name,
          isHost: key === roomData.hostId
        });
      });

      io.to(roomId).emit('participants-update', participants);
      socket.to(roomId).emit('user-joined', { userId, name });

      const currentPageImage = roomData.canvasPages[roomData.activePageIndex] || roomData.canvasSnapshot || '';
      socket.emit('sync-canvas-state', {
        imageData: currentPageImage,
        pageIndex: roomData.activePageIndex
      });

      socket.emit('whiteboard-pages-state', {
        pagesCount: roomData.canvasPages.length,
        activePageIndex: roomData.activePageIndex
      });

      socket.emit('whiteboard-files', roomData.sharedFiles || []);

      const currentShares = [];
      roomData.screenShares.forEach((share, shareUserId) => {
        currentShares.push({
          userId: shareUserId,
          name: share.name,
          frame: share.frame || ''
        });
      });
      socket.emit('screen-share-state', currentShares);
    });

    socket.on('draw', (data) => {
      socket.to(data.roomId).emit('draw', data);
    });

    socket.on('begin-path', (data) => {
      socket.to(data.roomId).emit('begin-path', data);
    });

    socket.on('add-whiteboard-page', ({ roomId }) => {
      const roomData = rooms.get(roomId);
      if (!roomData || roomData.hostId !== socket.data.userId) return;

      roomData.canvasPages.push('');
      roomData.activePageIndex = roomData.canvasPages.length - 1;
      roomData.canvasSnapshot = '';

      io.to(roomId).emit('whiteboard-pages-state', {
        pagesCount: roomData.canvasPages.length,
        activePageIndex: roomData.activePageIndex
      });
      io.to(roomId).emit('sync-canvas-state', {
        imageData: '',
        pageIndex: roomData.activePageIndex
      });
    });

    socket.on('switch-whiteboard-page', ({ roomId, pageIndex }) => {
      const roomData = rooms.get(roomId);
      if (!roomData) return;

      const nextPageIndex = Number(pageIndex);
      if (Number.isNaN(nextPageIndex) || nextPageIndex < 0 || nextPageIndex >= roomData.canvasPages.length) {
        return;
      }

      roomData.activePageIndex = nextPageIndex;
      roomData.canvasSnapshot = roomData.canvasPages[nextPageIndex] || '';

      io.to(roomId).emit('whiteboard-pages-state', {
        pagesCount: roomData.canvasPages.length,
        activePageIndex: roomData.activePageIndex
      });
      io.to(roomId).emit('sync-canvas-state', {
        imageData: roomData.canvasPages[nextPageIndex] || '',
        pageIndex: roomData.activePageIndex
      });
    });

    socket.on('sync-canvas-state', ({ roomId, imageData, pageIndex }) => {
      const roomData = rooms.get(roomId);
      if (!roomData) return;

      const targetPage = Number.isInteger(pageIndex) ? pageIndex : roomData.activePageIndex;
      if (targetPage < 0 || targetPage >= roomData.canvasPages.length) return;

      roomData.canvasPages[targetPage] = imageData || '';
      roomData.canvasSnapshot = roomData.canvasPages[roomData.activePageIndex] || '';
      socket.to(roomId).emit('sync-canvas-state', {
        imageData: roomData.canvasPages[targetPage] || '',
        pageIndex: targetPage
      });
    });

    socket.on('request-canvas-state', ({ roomId, pageIndex }) => {
      const roomData = rooms.get(roomId);
      if (!roomData) return;

      const targetPage = Number.isInteger(pageIndex) ? pageIndex : roomData.activePageIndex;
      if (targetPage < 0 || targetPage >= roomData.canvasPages.length) return;

      socket.emit('sync-canvas-state', {
        imageData: roomData.canvasPages[targetPage] || '',
        pageIndex: targetPage
      });

      socket.emit('whiteboard-pages-state', {
        pagesCount: roomData.canvasPages.length,
        activePageIndex: roomData.activePageIndex
      });
    });

    socket.on('whiteboard-file-uploaded', ({ roomId, fileMeta }) => {
      const roomData = rooms.get(roomId);
      if (!roomData || roomData.hostId !== socket.data.userId) return;
      if (!fileMeta?.id || !fileMeta?.name || !fileMeta?.dataUrl) return;

      roomData.sharedFiles = [fileMeta, ...(roomData.sharedFiles || [])].slice(0, 25);
      io.to(roomId).emit('whiteboard-file-uploaded', fileMeta);
    });

    socket.on('start-screen-share', ({ roomId }) => {
      const roomData = rooms.get(roomId);
      if (!roomData || !socket.data.userId) return;

      roomData.screenShares.set(socket.data.userId, {
        name: socket.data.userName || 'Participant',
        frame: ''
      });

      io.to(roomId).emit('screen-share-started', {
        userId: socket.data.userId,
        name: socket.data.userName || 'Participant'
      });
    });

    socket.on('screen-share-frame', ({ roomId, frame }) => {
      const roomData = rooms.get(roomId);
      if (!roomData || !socket.data.userId || !frame) return;

      const shareState = roomData.screenShares.get(socket.data.userId);
      if (!shareState) return;

      shareState.frame = frame;
      roomData.screenShares.set(socket.data.userId, shareState);

      socket.to(roomId).emit('screen-share-frame', {
        userId: socket.data.userId,
        name: shareState.name,
        frame
      });
    });

    socket.on('stop-screen-share', ({ roomId }) => {
      const roomData = rooms.get(roomId);
      if (!roomData || !socket.data.userId) return;

      roomData.screenShares.delete(socket.data.userId);
      io.to(roomId).emit('screen-share-stopped', { userId: socket.data.userId });
    });

    socket.on('send-reaction', ({ roomId, emoji }) => {
      if (!emoji || !roomId) return;
      io.to(roomId).emit('whiteboard-reaction', {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        emoji,
        userId: socket.data.userId,
        name: socket.data.userName || 'Participant',
        createdAt: new Date().toISOString()
      });
    });

    socket.on('clear-board', ({ roomId }) => {
      const roomData = rooms.get(roomId);
      if (roomData) {
        const active = roomData.activePageIndex;
        roomData.canvasPages[active] = '';
        roomData.canvasSnapshot = roomData.canvasPages[active] || '';
      }
      io.to(roomId).emit('clear-board');
    });

    socket.on('send-message', (data) => {
      io.to(data.roomId).emit('new-message', {
        ...data,
        id: Date.now() + Math.random()
      });
    });

    socket.on('typing', ({ roomId, userId, name, isTyping }) => {
      socket.to(roomId).emit('user-typing', { userId, name, isTyping });
    });

    socket.on('toggle-room-lock', ({ roomId, lock }) => {
      const roomData = rooms.get(roomId);
      if (roomData && roomData.hostId === socket.data.userId) {
        roomData.isLocked = lock;
        io.to(roomId).emit('room-lock-toggled', { isLocked: lock });
      }
    });

    socket.on('remove-participant', ({ roomId, userId }) => {
      const roomData = rooms.get(roomId);
      if (!roomData || roomData.hostId !== socket.data.userId) return;

      roomData.participants.delete(userId);

      const participants = [];
      roomData.participants.forEach((value, key) => {
        participants.push({
          id: key,
          name: value.name,
          isHost: key === roomData.hostId
        });
      });

      io.to(roomId).emit('participants-update', participants);

      const sockets = io.sockets.sockets;
      sockets.forEach((s) => {
        if (s.data.userId === userId && s.data.roomId === roomId) {
          s.emit('removed-from-room');
          s.leave(roomId);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      const roomId = socket.data.roomId;
      const userId = socket.data.userId;

      if (roomId && rooms.has(roomId)) {
        const roomData = rooms.get(roomId);
        roomData.participants.delete(userId);

        if (roomData.screenShares.has(userId)) {
          roomData.screenShares.delete(userId);
          io.to(roomId).emit('screen-share-stopped', { userId });
        }

        if (roomData.participants.size === 0) {
          rooms.delete(roomId);
        } else {
          const participants = [];
          roomData.participants.forEach((value, key) => {
            participants.push({
              id: key,
              name: value.name,
              isHost: key === roomData.hostId
            });
          });

          io.to(roomId).emit('participants-update', participants);
          io.to(roomId).emit('user-left', { userId });
        }
      }

    });
  });
};
