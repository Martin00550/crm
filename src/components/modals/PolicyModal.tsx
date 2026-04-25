"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Policy } from "@/context/MockDataContext";

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: Partial<Policy>) => void;
  policy?: Policy | null;
  clients: { id: string; name: string }[];
}

export function PolicyModal({ isOpen, onClose, onSave, policy, clients }: PolicyModalProps) {
  const isEditing = !!policy;
  const [formData, setFormData] = useState({
    clientId: policy?.clientId || clients[0]?.id || "",
    policyNumber: policy?.policyNumber || "",
    carrier: policy?.carrier || "",
    policyType: policy?.policyType || "",
    premium: policy?.premium?.toString() || "",
    effectiveDate: policy?.effectiveDate ? new Date(policy.effectiveDate).toISOString().split('T')[0] : "",
    expirationDate: policy?.expirationDate ? new Date(policy.expirationDate).toISOString().split('T')[0] : "",
    status: policy?.status || "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClient = clients.find(c => c.id === formData.clientId);
    onSave({
      ...formData,
      clientName: selectedClient?.name || "",
      premium: parseFloat(formData.premium),
      effectiveDate: new Date(formData.effectiveDate),
      expirationDate: new Date(formData.expirationDate),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Update Placement Forensics" : "Authorize New Placement"} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-8 font-body p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Insured Entity</label>
            <div className="relative">
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all font-bold text-on-surface cursor-pointer italic font-headline"
                required
              >
                <option value="">Select target insured</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Placement Identifier</label>
            <input
              type="text"
              value={formData.policyNumber}
              onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold text-on-surface uppercase tracking-widest"
              placeholder="e.g. GLA-882901"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Assigned Carrier</label>
            <div className="relative">
              <select
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all font-bold text-on-surface cursor-pointer"
                required
              >
                <option value="">Select forensic carrier</option>
                <option value="Travelers">Travelers</option>
                <option value="Chubb">Chubb</option>
                <option value="The Hartford">The Hartford</option>
                <option value="Liberty Mutual">Liberty Mutual</option>
                <option value="State Farm">State Farm</option>
                <option value="Progressive">Progressive</option>
                <option value="Allstate">Allstate</option>
                <option value="AIG">AIG</option>
                <option value="Nationwide">Nationwide</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Coverage Line Protocol</label>
            <div className="relative">
              <select
                value={formData.policyType}
                onChange={(e) => setFormData({ ...formData, policyType: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all font-bold text-on-surface cursor-pointer"
                required
              >
                <option value="">Select placement type</option>
                <option value="Commercial Auto">Commercial Auto</option>
                <option value="General Liability">General Liability</option>
                <option value="Property & Fire">Property & Fire</option>
                <option value="Workers Compensation">Workers Compensation</option>
                <option value="D&O Liability">D&O Liability</option>
                <option value="Cyber Liability">Cyber Liability</option>
                <option value="Umbrella">Umbrella</option>
                <option value="Inland Marine">Inland Marine</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Premium Volume ($)</label>
            <input
              type="number"
              value={formData.premium}
              onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
              className="w-full px-5 py-4 bg-white border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-black text-on-surface text-2xl font-headline italic tracking-tighter shadow-inner"
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Placement Lifecycle Stage</label>
            <div className="relative">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "expired" | "cancelled" })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all font-bold text-on-surface cursor-pointer"
              >
                <option value="active">Active Deployment</option>
                <option value="expired">Terminated/Expired</option>
                <option value="cancelled">Decommissioned</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Inception Date</label>
            <input
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold text-on-surface"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Maturity Date (Expiration)</label>
            <input
              type="date"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold text-on-surface"
              required
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-6 pt-6 border-t border-black/5">
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest hover:text-on-surface transition-all pb-1 border-b border-transparent hover:border-on-surface/20"
          >
            Abort
          </button>
          <button
            type="submit"
            className="px-10 py-4 bg-primary text-white font-black rounded-full hover:shadow-2xl hover:shadow-primary/30 transition-all text-xs uppercase tracking-[0.2em] active:scale-[0.98]"
          >
            {isEditing ? "Commit Forensic Updates" : "Authorize Placement"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
