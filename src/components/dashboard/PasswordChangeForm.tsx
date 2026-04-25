"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters");
      setIsLoading(false);
      return;
    }

    try {
      await authClient.changePassword({
        newPassword,
        currentPassword,
      });
      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-[32px] p-8 border border-black/5 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
          <span className="material-symbols-outlined text-primary text-2xl">lock</span>
        </div>
        <div>
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Security Protocol</h3>
          <p className="text-sm font-bold text-on-surface italic font-headline">Change Password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-2">
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-2">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Enter new password (min 12 characters)"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Confirm new password"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-sm font-medium text-emerald-600">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Updating..." : "Update Password"}
        </button>
      </form>

      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-black/5">
        <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-2">Password Requirements</p>
        <ul className="text-xs text-on-surface/60 space-y-1">
          <li>• Minimum 12 characters</li>
          <li>• At least one uppercase letter</li>
          <li>• At least one lowercase letter</li>
          <li>• At least one number</li>
          <li>• At least one special character</li>
        </ul>
      </div>
    </div>
  );
}
