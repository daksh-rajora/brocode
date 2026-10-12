import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : '/');

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      // Real-time synchronization active
    });

    socket.on('disconnect', () => {
      // Reconnecting automatically...
    });
  }

  return socket;
};

export const subscribeToEvent = (eventName, callback) => {
  const s = getSocket();
  s.on(eventName, callback);
  return () => {
    s.off(eventName, callback);
  };
};

export const joinAdminRoom = () => {
  const s = getSocket();
  s.emit('join:admin');
};

export const joinOrderRoom = (orderNumber) => {
  const s = getSocket();
  if (orderNumber) {
    s.emit('join:order', orderNumber);
  }
};
