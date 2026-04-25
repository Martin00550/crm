"use client";

import { useState } from "react";
import { Send, Edit3, Eye, Loader2, XCircle } from "lucide-react";

interface Policy {
  id: string;
  policyNumber: string;
  carrier: string;
  policyType: string;
  premium: string;
  expirationDate: Date;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
}

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  policy: Policy;
  daysUntilRenewal: number;
  onSend: () => Promise<void>;
}

export function EmailPreviewModal({
  isOpen,
  onClose,
  client,
  policy,
  daysUntilRenewal,
  onSend,
}: EmailPreviewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [customSubject, setCustomSubject] = useState(
    daysUntilRenewal <= 30
      ? `Action Required: Your ${policy.policyType} Policy Renews in ${daysUntilRenewal} Days`
      : `Your ${policy.policyType} Policy Renewal Preview - ${daysUntilRenewal} Days Out`
  );
  const [customMessage, setCustomMessage] = useState(
    `This is a friendly reminder that your ${policy.policyType} policy (${policy.policyNumber}) with ${policy.carrier} is scheduled to renew in ${daysUntilRenewal} days.`
  );

  if (!isOpen) return null;

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend();
      onClose();
    } catch (error) {
      console.error("Send error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatPremium = (premium: string) => {
    return `$${parseFloat(premium).toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center font-body">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-surface rounded-[32px] shadow-2xl border border-black/5 max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-8 border-b border-black/5 bg-slate-50/50">
          <div>
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-2">Correspondence Intelligence</p>
            <h3 className="text-2xl font-black text-on-surface italic font-headline tracking-tight">Renewal Notification Protocol</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface/40 hover:text-on-surface hover:bg-black/5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-white">
          {/* Recipient Info */}
          <div className="p-6 bg-slate-50/50 rounded-2xl border border-black/5 shadow-inner">
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <p className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest mb-2">Target Insured</p>
                <p className="font-bold text-on-surface italic font-headline text-lg tracking-tight">{client.name}</p>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">{client.email || "No intelligence contact"}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest mb-2">Placement Identifier</p>
                <p className="font-bold text-on-surface italic font-headline text-lg tracking-tight">{policy.policyNumber}</p>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-1">{policy.policyType} • {policy.carrier}</p>
              </div>
            </div>
          </div>

          {/* Edit Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Eye className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Protocol Preview</span>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                isEditing
                  ? "bg-secondary text-white shadow-lg"
                  : "bg-slate-100 text-on-surface/60 hover:bg-slate-200"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? "Finalizing" : "Authorize Edit"}
            </button>
          </div>

          {/* Email Preview */}
          <div className="border border-black/10 rounded-2xl overflow-hidden shadow-xl">
            {/* Email Header */}
            <div className="bg-slate-50/80 p-6 border-b border-black/5">
              {isEditing ? (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-on-surface/40 uppercase tracking-widest block">
                    Protocol Subject Line
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-[9px] font-black text-on-surface/40 uppercase tracking-widest mb-1">Subject</p>
                  <p className="font-bold text-on-surface italic font-headline text-lg">{customSubject}</p>
                </div>
              )}
            </div>

            {/* Email Body */}
            <div className="p-8 bg-white">
              <div className="mb-6">
                <p className="text-on-surface font-bold">Attention {client.name},</p>
              </div>

              {isEditing ? (
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-4 bg-slate-50 border border-black/10 rounded-xl text-sm text-on-surface font-medium italic focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none leading-relaxed"
                />
              ) : (
                <p className="text-on-surface/80 text-sm font-medium italic leading-relaxed">{customMessage}</p>
              )}

              {/* Policy Details Card */}
              <div className="my-8 p-6 bg-slate-50 rounded-2xl border border-black/5">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-black/5">
                    <tr>
                      <td className="py-3 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Authorized Premium</td>
                      <td className="py-3 text-right font-black text-on-surface italic font-headline text-xl">{formatPremium(policy.premium)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Placement Type</td>
                      <td className="py-3 text-right font-bold text-on-surface">{policy.policyType}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Assigned Carrier</td>
                      <td className="py-3 text-right font-bold text-on-surface">{policy.carrier}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Maturity Date</td>
                      <td className="py-3 text-right font-bold text-on-surface">
                        {new Date(policy.expirationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {daysUntilRenewal <= 30 && (
                <div className="p-5 bg-red-50 rounded-2xl border border-red-100 mb-6 flex gap-4 items-center animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-red-600">priority_high</span>
                  </div>
                  <p className="text-red-700 text-xs font-black uppercase tracking-widest leading-relaxed">
                    Urgent: Asset Protection Required. Please finalize placement instructions immediately to avoid lapse in coverage.
                  </p>
                </div>
              )}

              <p className="text-on-surface/70 text-sm font-medium italic leading-relaxed">
                Our team is conducting a final rate analysis of your coverage options. We are analyzing current carrier rates to ensure your assets remain protected with optimal premium efficiency.
              </p>

              {/* CTA Button Preview */}
              <div className="text-center my-8">
                <div className="inline-block bg-primary text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all cursor-default">
                  Review Renewal
                </div>
              </div>

              <p className="text-on-surface/40 text-xs font-bold italic">
                Authorized dispatch from your Agency Command Team. Secure communications utilized.
              </p>
            </div>

            {/* Email Footer */}
            <div className="p-6 bg-slate-50 border-t border-black/5 text-center">
              <p className="text-[10px] font-black text-on-surface/20 uppercase tracking-[0.2em]">
                © 2024 BookGuard Intelligence Systems. High-premium asset protection.
              </p>
            </div>
          </div>

          {/* Warning */}
          {!client.email && (
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-amber-600">warning</span>
              </div>
              <div>
                <p className="text-amber-900 text-[10px] font-black uppercase tracking-widest">Protocol Obstruction</p>
                <p className="text-amber-700 text-xs font-medium mt-1 italic">Intelligence contact missing. Authorize email credentials before dispatch.</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-6 p-8 border-t border-black/5 bg-slate-50/50">
          <button
            onClick={onClose}
            className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest hover:text-on-surface transition-all pb-1 border-b border-transparent hover:border-on-surface/20"
          >
            Abort Dispatch
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !client.email}
            className="px-12 py-4 bg-secondary text-white font-black rounded-full hover:shadow-2xl hover:shadow-secondary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 active:scale-[0.98]"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs uppercase tracking-widest">Dispatching Intelligence...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">Authorize Dispatch</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
