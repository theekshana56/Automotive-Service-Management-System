import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchNotifications } from '../services/notificationsApi';
import { getSocket } from '../services/socket';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications().then((data) => {
      setNotifications(data);
    });
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });
    return () => {
      socket.off('notification');
    };
  }, []);

  // Add manual scan results
  const addManualNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addManualNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
