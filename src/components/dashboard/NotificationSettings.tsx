'use client';

import { useState } from 'react';

interface NotificationSettingsProps {
  agencyId: string;
  initialSettings: {
    renewalNotifications: boolean;
    email90Day: boolean;
    email60Day: boolean;
    email30Day: boolean;
    notifyOnExpiry: boolean;
    dailyDigest: boolean;
    commissionAlerts: boolean;
  };
}

export function NotificationSettings({ agencyId, initialSettings }: NotificationSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveSettings = async (updatedSettings: typeof settings) => {
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, settings: updatedSettings }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to auto-save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  return (
    <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden font-body">
      <div className="p-6 md:p-8 border-b border-black/5 bg-background">
        <h3 className="text-xl font-black text-on-surface italic font-headline tracking-tight uppercase">Renewal Dispatch Protocols</h3>
        <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mt-2">Authorize automated intelligence delivery to insured entities</p>
      </div>

      <div className="divide-y divide-black/5">
        {/* Master Toggle */}
        <div className="p-6 md:p-8 flex items-center justify-between group hover:bg-background/50 transition-colors">
          <div>
            <h4 className="font-bold text-on-surface text-base">Enable Dispatch Engine</h4>
            <p className="text-xs text-on-surface/40 font-medium italic mt-1">Global authorization for automated policy reminders</p>
          </div>
          <button
            onClick={() => handleToggle('renewalNotifications')}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              settings.renewalNotifications ? 'bg-secondary' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                settings.renewalNotifications ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* 90-Day Notification */}
        <div className="p-6 md:p-8 flex items-center justify-between group hover:bg-background/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center border border-secondary/10 shadow-sm transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface">Initial 90-Day Protocol</h4>
              <p className="text-xs text-on-surface/40 font-medium italic mt-1">Strategic pipeline entry notification</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('email90Day')}
            disabled={!settings.renewalNotifications}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              settings.email90Day && settings.renewalNotifications ? 'bg-secondary' : 'bg-slate-200'
            } disabled:opacity-20`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                settings.email90Day && settings.renewalNotifications ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* 60-Day Notification */}
        <div className="p-6 md:p-8 flex items-center justify-between group hover:bg-background/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center border border-secondary/10 shadow-sm transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface">Secondary 60-Day Follow-up</h4>
              <p className="text-xs text-on-surface/40 font-medium italic mt-1">Intelligence maintenance notice</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('email60Day')}
            disabled={!settings.renewalNotifications}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              settings.email60Day && settings.renewalNotifications ? 'bg-secondary' : 'bg-slate-200'
            } disabled:opacity-20`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                settings.email60Day && settings.renewalNotifications ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* 30-Day Notification */}
        <div className="p-6 md:p-8 flex items-center justify-between group hover:bg-background/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center border border-secondary/10 shadow-sm transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface">Urgent 30-Day Warning</h4>
              <p className="text-xs text-on-surface/40 font-medium italic mt-1">Leakage risk mitigation alert</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('email30Day')}
            disabled={!settings.renewalNotifications}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              settings.email30Day && settings.renewalNotifications ? 'bg-secondary' : 'bg-slate-200'
            } disabled:opacity-20`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                settings.email30Day && settings.renewalNotifications ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Expiry Notification */}
        <div className="p-6 md:p-8 flex items-center justify-between group hover:bg-background/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center border border-secondary/10 shadow-sm transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface">Critical Expiration Protocol</h4>
              <p className="text-xs text-on-surface/40 font-medium italic mt-1">Final decommissioned asset alert</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('notifyOnExpiry')}
            disabled={!settings.renewalNotifications}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              settings.notifyOnExpiry && settings.renewalNotifications ? 'bg-secondary' : 'bg-slate-200'
            } disabled:opacity-20`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                settings.notifyOnExpiry && settings.renewalNotifications ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Daily Digest */}
        <div className="p-6 md:p-8 flex items-center justify-between group hover:bg-background/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center border border-secondary/10 shadow-sm transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface">Daily Intelligence Digest</h4>
              <p className="text-xs text-on-surface/40 font-medium italic mt-1">Command summary of portfolio movements</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('dailyDigest')}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              settings.dailyDigest ? 'bg-secondary' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                settings.dailyDigest ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Commission Alerts */}
        <div className="p-6 md:p-8 flex items-center justify-between group hover:bg-background/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center border border-secondary/10 shadow-sm transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface">Commission Alerts</h4>
              <p className="text-xs text-on-surface/40 font-medium italic mt-1">Get notified about commission payments and delays</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('commissionAlerts')}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              settings.commissionAlerts ? 'bg-secondary' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                settings.commissionAlerts ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Footer / Status Indicator */}
      <div className="p-6 md:p-8 bg-background border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {saving ? (
            <div className="flex items-center gap-2 text-secondary animate-pulse">
              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              <span className="text-[10px] font-black uppercase tracking-widest italic">Synchronizing Protocols...</span>
            </div>
          ) : saved ? (
            <div className="flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span className="text-[10px] font-black uppercase tracking-widest italic">Protocols Synchronized</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-on-surface/20">
              <span className="material-symbols-outlined text-sm">cloud_done</span>
              <span className="text-[10px] font-black uppercase tracking-widest italic">All changes captured in real-time</span>
            </div>
          )}
        </div>
        
        <p className="text-[10px] font-bold text-on-surface/30 italic uppercase tracking-wider text-center sm:text-right">
          Auto-deployed to active renewal cycles
        </p>
      </div>
    </div>
  );
}
