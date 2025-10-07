import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.jsx';
import api from '../api/client';

const NotificationBanner = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'finance_manager' || user?.role === 'admin') {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/purchase-orders?status=submitted&limit=5');
      const pendingPOs = response.data.purchaseOrders || [];
      
      if (pendingPOs.length > 0) {
        setNotifications([{
          id: 'pending-pos',
          type: 'warning',
          title: 'Pending Purchase Order Approvals',
          message: `You have ${pendingPOs.length} purchase order${pendingPOs.length > 1 ? 's' : ''} awaiting your approval.`,
          action: () => navigate('/finance/inventory-payments'),
          actionText: 'Review Now'
        }]);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 max-w-sm ${
            notification.type === 'warning'
              ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
              : 'bg-blue-50 border-blue-400 text-blue-800'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <p className="text-sm mt-1">{notification.message}</p>
              {notification.action && (
                <button
                  onClick={notification.action}
                  className="mt-2 px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/80 transition-colors"
                >
                  {notification.actionText}
                </button>
              )}
            </div>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationBanner;
