'use client';

import { useState, useEffect } from 'react';
import { X, BellOff, AlertTriangle, CheckCircle, XCircle, Info, Mail, Bell, BellRing, Trash2, Clock } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  metadata?: any;
}

export function NotificationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const archiveAll = async () => {
    try {
      await fetch('/api/notifications/archive-all', {
        method: 'POST',
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to archive notifications:', error);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-end pt-16 pr-8 font-body">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-96 bg-surface rounded-xl shadow-xl border border-black/5 max-h-[80vh] overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-on-surface tracking-tight">Intelligence Log</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface/40 hover:text-on-surface hover:bg-black/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">
              {unreadCount} Active Alerts
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline"
              >
                Clear All Protocols
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Syncing Intelligence...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellOff className="w-8 h-8 text-on-surface/10" />
              </div>
              <p className="text-sm font-bold text-on-surface/40 uppercase tracking-widest">Registry Empty</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 border-b border-black/5 hover:bg-slate-50 transition-all cursor-pointer group ${
                  !notification.read ? 'bg-secondary/5' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-4">
                  <div className={`p-2.5 rounded-lg border transition-all ${getTypeStyles(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-bold text-on-surface truncate">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0 ml-2 mt-1 shadow-sm" />
                       )}
                    </div>
                    <p className="text-xs text-on-surface/60 mb-2 line-clamp-2 font-medium leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[9px] font-bold text-on-surface/20 uppercase tracking-widest">Deployed {notification.time}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 bg-slate-50">
          <button
            onClick={archiveAll}
            className="w-full text-center text-[10px] font-bold text-primary uppercase tracking-widest hover:text-secondary transition-colors py-2"
          >
            Archive Intelligence Log
          </button>
        </div>
      </div>
    </div>
  );
}
