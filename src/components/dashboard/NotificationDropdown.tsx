'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Check, X, Settings } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
}

interface NotificationDropdownProps {
  agencyId?: string;
}

export function NotificationDropdown({ agencyId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?unreadOnly=true&limit=5');
      const data = await res.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
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
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'success': return 'bg-green-50 border-green-200 text-green-900';
      case 'error': return 'bg-red-50 border-red-200 text-red-900';
      default: return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-on-surface/60 hover:bg-black/5 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-surface rounded-[32px] shadow-2xl border border-black/5 z-50 overflow-hidden font-body animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-black/5 bg-slate-50/50">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Agency Intelligence</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-secondary uppercase tracking-widest hover:underline"
                  >
                    Clear All
                  </button>
                )}
                <Link href="/dashboard/settings/notifications" className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface/40 hover:text-on-surface hover:bg-black/5 transition-all">
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-on-surface/10" />
                  </div>
                  <p className="text-sm font-black text-on-surface/40 uppercase tracking-widest">No Intelligence Alerts</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-5 border-b border-black/5 hover:bg-slate-50/50 transition-all cursor-pointer group ${
                      !notification.read ? 'bg-secondary/5' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-2 h-2 rounded-full mt-2 transition-all group-hover:scale-125 ${
                        notification.type === 'warning' ? 'bg-amber-500' :
                        notification.type === 'success' ? 'bg-secondary' :
                        notification.type === 'error' ? 'bg-red-500' : 'bg-primary'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-on-surface text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg text-on-surface/20 hover:text-secondary hover:bg-secondary/5 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-on-surface/60 mt-1 font-medium leading-relaxed italic">
                          {notification.message}
                        </p>
                        <p className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest mt-2">
                          Dispatched {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-black/5 bg-slate-50/50">
              <Link href="/dashboard/notifications" className="block w-full text-center text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-secondary transition-colors py-2">
                View Intelligence Log
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
