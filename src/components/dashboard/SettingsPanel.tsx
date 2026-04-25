'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, Check } from 'lucide-react';
import { signOut } from '@/lib/auth-client';

export function SettingsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    autoRenewalAlerts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/notification-settings');
      const data = await response.json();

      if (response.ok && data.success && data.settings) {
        setSettings({
          emailNotifications: data.settings.emailNotifications ?? true,
          pushNotifications: data.settings.pushNotifications ?? false,
          weeklyReports: data.settings.weeklyReports ?? true,
          autoRenewalAlerts: data.settings.autoRenewalAlerts ?? true,
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Sign out and redirect to home
        await signOut();
        window.location.href = '/';
      } else {
        setDeleteError(data.error || 'Failed to decommission account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      setDeleteError('An error occurred while decommissioning your account');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl border border-black/5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-on-surface tracking-tight">Command Center Settings</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface/40 hover:text-on-surface hover:bg-black/5 transition-all"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-on-surface/40" />
            </div>
          ) : (
            <>
              {/* Notifications Section */}
              <div>
            <h4 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-4">Notification Protocols</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-on-surface">Email Notifications</label>
                  <p className="text-xs text-on-surface/40 font-medium">Receive protocols via email</p>
                </div>
                <button
                  onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                    settings.emailNotifications ? 'bg-secondary' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-on-surface">Push Notifications</label>
                  <p className="text-xs text-on-surface/40 font-medium">Real-time desktop alerts</p>
                </div>
                <button
                  onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                    settings.pushNotifications ? 'bg-secondary' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-on-surface">Weekly Intelligence Reports</label>
                  <p className="text-xs text-on-surface/40 font-medium">Comprehensive business summaries</p>
                </div>
                <button
                  onClick={() => handleSettingChange('weeklyReports', !settings.weeklyReports)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                    settings.weeklyReports ? 'bg-secondary' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      settings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-on-surface">Auto-Renewal Intelligence</label>
                  <p className="text-xs text-on-surface/40 font-medium">Alerts before policy leakage</p>
                </div>
                <button
                  onClick={() => handleSettingChange('autoRenewalAlerts', !settings.autoRenewalAlerts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                    settings.autoRenewalAlerts ? 'bg-secondary' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      settings.autoRenewalAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* Account Section */}
          <div>
            <h4 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-4">Security & Data</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-slate-50 border border-black/5 rounded-xl hover:bg-black/5 transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface">Update Security Credentials</span>
                  <span className="material-symbols-outlined text-on-surface/20 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-slate-50 border border-black/5 rounded-xl hover:bg-black/5 transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface">Export Book of Business Data</span>
                  <span className="material-symbols-outlined text-on-surface/20">download</span>
                </div>
              </button>
              
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-left px-4 py-2 border border-red-100/50 hover:bg-red-50 transition-all rounded-xl"
              >
                <div className="flex items-center justify-between p-1">
                  <span className="text-sm font-bold text-red-600">Decommission Account</span>
                  <span className="material-symbols-outlined text-red-400">delete</span>
                </div>
              </button>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/5 bg-slate-50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-black/10 text-on-surface/60 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-black/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex-1 px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Commit Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md bg-surface rounded-xl shadow-2xl border border-red-100 p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  Final Decommission Alert
                </h3>
                <p className="text-sm text-on-surface/60 font-medium leading-relaxed">
                  This will permanently erase your account and all associated agency data. 
                  This protocol is <span className="font-bold text-red-600">irreversible</span>.
                </p>
              </div>

              {deleteError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
                  {deleteError}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full py-3 bg-red-500 text-white font-bold rounded-lg uppercase tracking-widest text-xs hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Decommissioning...
                    </>
                  ) : (
                    'Confirm Total Purge'
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full py-3 bg-slate-50 border border-black/10 text-on-surface/60 font-bold rounded-lg uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                >
                  Abort - Keep Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
