import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchNotifications, markNotificationRead, markAllRead as apiMarkAllRead } from '../../services/notificationsApi';
import { getSocket } from '../../services/socket';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  async function loadNotifications() {
    try {
      setLoading(true);
      const items = await fetchNotifications();
      setNotifications(items);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n._id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiMarkAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  const getNotificationIcon = (type) => {
    switch (String(type).toUpperCase()) {
      case 'LOW_STOCK':
      case 'LOW-STOCK':
      case 'LOW_STOCK_ALERT':
      case 'LOWSTOCK':
        return '⚠️';
      case 'MANUAL': return '📋';
      case 'AUTO': return '🔔';
      default: return '📝';
    }
  };

  const getNotificationColor = (type) => {
    const t = String(type).toUpperCase();
    if (t.includes('LOW')) return 'text-yellow-400';
    if (t === 'MANUAL') return 'text-blue-400';
    if (t === 'AUTO') return 'text-green-400';
    return 'text-slate-400';
  };

  const updateDropdownPosition = () => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    const preferredWidth = Math.min(360, Math.max(320, Math.floor(window.innerWidth * 0.9)));
    const margin = 8;
    const top = rect.bottom + margin;
    let left = rect.left + rect.width - preferredWidth;
    left = Math.max(margin, Math.min(left, window.innerWidth - preferredWidth - margin));
    setDropdownStyle({ position: 'fixed', top: `${top}px`, left: `${left}px`, width: `${preferredWidth}px`, maxWidth: '90vw', zIndex: 2000 });
  };

  useEffect(() => {
    loadNotifications();

    // Socket listeners for real-time updates
    const s = getSocket && getSocket();
    if (s) {
      const onNew = (notif) => {
        setNotifications(prev => [{ ...notif, read: false }, ...prev].slice(0, 50));
      };
      const onLow = () => {
        // Reload list when stock:low event emitted
        loadNotifications();
      };
      s.on && s.on('notification:new', onNew);
      s.on && s.on('stock:low', onLow);
      return () => {
        s.off && s.off('notification:new', onNew);
        s.off && s.off('stock:low', onLow);
      };
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    const onResize = () => updateDropdownPosition();
    const onScroll = () => updateDropdownPosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [isOpen]);

  const Dropdown = (
    <>
      <div className="fixed inset-0 z-[1999]" onClick={() => setIsOpen(false)} />
      <div className="notification-dropdown" style={dropdownStyle}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Mark all read</button>
          )}
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="text-center py-6 text-slate-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔔</div>
              <p className="text-slate-400">No notifications</p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div key={notification._id || `notification-${index}`} className={`notification-item ${!notification.read ? 'notification-unread' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className={`text-lg ${getNotificationColor(notification.type)}`}>{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-200 text-sm">{notification.title}</h4>
                    <p className="text-slate-400 text-xs mt-1">{notification.message}</p>
                    <p className="text-slate-500 text-xs mt-2">{new Date(notification.createdAt || notification.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {notification.link && (
                    <button onClick={() => { setIsOpen(false); }} className="text-xs text-blue-400 hover:text-blue-300">View</button>
                  )}
                  {!notification.read && (
                    <button onClick={() => handleMarkRead(notification._id)} className="text-xs text-slate-400 hover:text-slate-300">Mark read</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-xl bg-glass border border-white/10 hover:bg-white/10 transition-colors"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 2a10 10 0 00-10 10v5a2 2 0 002 2h6m4-17a10 10 0 0110 10v5a2 2 0 01-2 2h-6m-4-17v17" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(Dropdown, document.body)}
    </div>
  );
}