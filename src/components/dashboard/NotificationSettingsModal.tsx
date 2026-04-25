'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { NotificationSettings } from './NotificationSettings';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  initialSettings?: {
    renewalNotifications?: boolean;
    email90Day?: boolean;
    email60Day?: boolean;
    email30Day?: boolean;
    notifyOnExpiry?: boolean;
    dailyDigest?: boolean;
    commissionAlerts?: boolean;
  };
}

export function NotificationSettingsModal({ 
  isOpen, 
  onClose, 
  agencyId, 
  initialSettings 
}: NotificationSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-surface rounded-[40px] shadow-2xl p-8 border border-black/5 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface/40 hover:text-on-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-black text-on-surface font-headline italic mb-2">
            Quick Notification Settings
          </h1>
          <p className="text-on-surface/60 font-medium text-sm">
            Configure your renewal reminders and intelligence alerts
          </p>
        </div>

        <NotificationSettings
          agencyId={agencyId}
          initialSettings={{
            renewalNotifications: initialSettings?.renewalNotifications ?? true,
            email90Day: initialSettings?.email90Day ?? true,
            email60Day: initialSettings?.email60Day ?? true,
            email30Day: initialSettings?.email30Day ?? true,
            notifyOnExpiry: initialSettings?.notifyOnExpiry ?? true,
            dailyDigest: initialSettings?.dailyDigest ?? false,
            commissionAlerts: initialSettings?.commissionAlerts ?? true,
          }}
        />
      </div>
    </div>
  );
}
