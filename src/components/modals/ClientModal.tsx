"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Client } from "@/context/MockDataContext";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  client?: Client | null;
}

export function ClientModal({ isOpen, onClose, onSave, client }: ClientModalProps) {
  const isEditing = !!client;
  const [formData, setFormData] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    address: client?.address || "",
    industry: client?.industry || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Update Insured Forensics" : "Authorize New Insured"} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-8 font-body p-2">
        <div className="bg-slate-50/50 p-8 rounded-[32px] border border-black/5 shadow-inner">
          <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-3">Legal Entity Identity</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-5 py-4 bg-white border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-black text-on-surface italic font-headline text-xl tracking-tight"
            placeholder="e.g. Sterling Logistics Corp"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Primary Intelligence Contact</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold text-on-surface"
              placeholder="principal@company.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Direct Command Line</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold text-on-surface"
              placeholder="(555) 000-0000"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Headquarters Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold text-on-surface"
            placeholder="Street, City, State, Zip"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Industry Classification</label>
          <div className="relative">
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all font-bold text-on-surface cursor-pointer"
            >
              <option value="">Select industry sector</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Technology">Technology</option>
              <option value="Transportation">Transportation</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Construction">Construction</option>
              <option value="Finance">Finance</option>
              <option value="Energy">Energy</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Real Estate">Real Estate</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
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
            {isEditing ? "Commit Updates" : "Authorize Insured"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
