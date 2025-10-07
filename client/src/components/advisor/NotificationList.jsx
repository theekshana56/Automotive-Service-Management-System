import React from 'react';
import { deleteNotification, markNotificationRead } from '../../services/notificationsApi';

const colors = {
  info: 'bg-blue-500/20 text-blue-300',
  success: 'bg-green-500/20 text-green-300',
  warning: 'bg-yellow-500/20 text-yellow-300',
};

export default function NotificationList({ items = [], onChange }) {
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4">
      <h3 className="text-slate-200 font-semibold mb-3">Notifications</h3>
      {/* Scrollable list to avoid pushing the page down */}
      <div className="space-y-3 max-h-96 overflow-auto pr-1">
        {items.map((n, idx) => (
          <div key={n.id || n._id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700">
            <div className={`w-2 h-2 rounded-full mt-2 ${n.type === 'success' ? 'bg-green-400' : n.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
            <div className="flex-1">
              <div className="text-slate-200 text-sm">{n.title}</div>
              <div className="text-slate-400 text-xs">{n.subtitle || n.message}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded ${colors[n.type || 'info']}`}>{n.badge || 'New'}</span>
              <button
                onClick={async () => {
                  try {
                    const id = n.id || n._id;
                    if (id) await deleteNotification(id);
                    if (onChange) onChange();
                  } catch {}
                }}
                className="text-xs px-2 py-1 rounded bg-red-500/80 hover:bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-slate-400 text-sm">No notifications</div>
        )}
      </div>
    </div>
  );
}


