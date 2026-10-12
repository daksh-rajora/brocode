import { useEffect } from 'react';
import { subscribeToEvent, joinAdminRoom, joinOrderRoom } from '../services/socket';

export const useSocketEvent = (eventName, handler) => {
  useEffect(() => {
    if (!eventName || !handler) return;
    const unsubscribe = subscribeToEvent(eventName, handler);
    return () => {
      unsubscribe();
    };
  }, [eventName, handler]);
};

export const useAdminSocket = () => {
  useEffect(() => {
    joinAdminRoom();
  }, []);
};

export const useOrderSocket = (orderNumber) => {
  useEffect(() => {
    if (orderNumber) {
      joinOrderRoom(orderNumber);
    }
  }, [orderNumber]);
};
