let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    socket.on('join:admin', () => {
      socket.join('admin-room');
    });

    socket.on('join:order', (orderNumber) => {
      if (orderNumber) {
        socket.join(`order:${orderNumber}`);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return ioInstance;
};

export const getIO = () => ioInstance;

export const emitEvent = (eventName, payload) => {
  if (ioInstance) {
    try {
      ioInstance.emit(eventName, payload);
    } catch (err) {
      console.warn(`[Socket.IO] Failed to emit event "${eventName}":`, err.message);
    }
  }
};

