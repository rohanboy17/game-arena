'use client';

import { useNotification } from '@/lib/notification-context';
import { X } from 'lucide-react';

export default function Notifications() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-green-900/90 border border-green-700'
              : notification.type === 'error'
              ? 'bg-red-900/90 border border-red-700'
              : notification.type === 'warning'
              ? 'bg-yellow-900/90 border border-yellow-700'
              : 'bg-blue-900/90 border border-blue-700'
          }`}
        >
          <p className="text-sm text-white">{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}