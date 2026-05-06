"use client";

import { useState } from 'react';
import { Globe, Check, AlertCircle } from 'lucide-react';

interface CurrencySettingsFormProps {
  agency: {
    id: string;
    currency: string | null;
  } | null;
  isDemo?: boolean;
}

export function CurrencySettingsForm({ agency, isDemo = false }: CurrencySettingsFormProps) {
  const [currency, setCurrency] = useState(agency?.currency || 'USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (isDemo) {
        setMessage({ type: 'success', text: 'Currency updated successfully! (Demo Mode)' });
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/agency/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency }),
      });

      if (!res.ok) throw new Error('Failed to update currency');

      setMessage({ type: 'success', text: 'Regional settings updated successfully!' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden font-body">
      <div className="px-6 py-5 border-b border-black/5 bg-background">
        <h2 className="text-lg font-black text-on-surface italic font-headline flex items-center gap-2 tracking-tight">
          <Globe className="w-5 h-5 text-secondary" />
          Regional Settings
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' 
              ? 'bg-secondary/5 border border-secondary/10 text-secondary'
              : 'bg-red-50 border border-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] block mb-2">
              Primary Agency Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all appearance-none cursor-pointer"
            >
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
              <option value="CAD">CAD - Canadian Dollar ($)</option>
              <option value="AUD">AUD - Australian Dollar ($)</option>
            </select>
            <p className="text-[10px] font-bold text-on-surface/30 uppercase tracking-widest mt-2 italic">
              This updates all premium volumes and renewal values across your command center.
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-8 border-t border-black/5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-4 bg-secondary text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:shadow-2xl transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Syncing...' : 'Update Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
