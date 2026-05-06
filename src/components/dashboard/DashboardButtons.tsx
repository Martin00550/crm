'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NotificationPanel } from './NotificationPanel';
import { SettingsPanel } from './SettingsPanel';
import { FilterPanel } from './FilterPanel';

// Lazy load heavy components
const ChatInterface = lazy(() => import('./ChatInterface').then(m => ({ default: m.ChatInterface })));

import { Button } from '@/components/ui/button';
import { Sparkles, Download, Filter, Send, Users as UsersIcon, Calculator, Plus as PlusIcon, Bell, Settings as SettingsIcon } from 'lucide-react';

export function GenerateAIReportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (message === 'AI report generated successfully!') {
      t = setTimeout(() => setMessage(''), 3000);
    }
    return () => clearTimeout(t);
  }, [message]);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setMessage('Generating AI report...');
    
    // Simulate AI report generation
    setTimeout(() => {
      setMessage('AI report generated successfully!');
      setIsLoading(false);
    }, 2000);
  };

  return (
    <>
      <Button 
        onClick={handleGenerateReport}
        isLoading={isLoading}
        variant="secondary"
        className="w-full mb-4"
        leftIcon={<Sparkles className="w-4 h-4" />}
      >
        Generate Executive Summary
      </Button>
      {message && (
        <div className="mb-4 p-3 bg-secondary/5 text-secondary text-[10px] font-bold uppercase tracking-widest rounded-xl text-center border border-secondary/10">
          {message}
        </div>
      )}
    </>
  );
}

export function ExportCSVButton({ data = [], filename = 'export.csv' }: { data?: any[], filename?: string }) {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (showMessage) {
      t = setTimeout(() => setShowMessage(false), 3000);
    }
    return () => clearTimeout(t);
  }, [showMessage]);

  const handleExport = () => {
    if (data.length === 0) {
      setShowMessage(true);
      return;
    }

    // Create CSV content safely
    if (!data[0]) return; // Guard against [null]
    const escapeCsv = (val: any) => {
      if (val == null) return '""';
      let str = String(val);
      // Prevent CSV injection
      if (/^[=+\-@]/.test(str)) str = "'" + str;
      return `"${str.replace(/"/g, '""')}"`;
    };
    const headers = Object.keys(data[0]).map(escapeCsv).join(',');
    const rows = data.map(item => item ? Object.values(item).map(escapeCsv).join(',') : '').filter(Boolean).join('\n');
    const csvContent = `${headers}\n${rows}`;

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <Button 
        onClick={handleExport}
        variant="outline"
        size="sm"
        leftIcon={<Download className="w-3.5 h-3.5" />}
        className="text-on-surface/40 hover:text-on-surface"
      >
        Export Book
      </Button>
      {showMessage && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg text-[10px] font-bold text-amber-700 text-center whitespace-nowrap z-10 uppercase tracking-widest">
          No records available for export
        </div>
      )}
    </div>
  );
}

export function FilterViewButton({ onFilter }: { onFilter?: (filters: any) => void }) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleApplyFilters = (filters: any) => {
    if (onFilter) onFilter(filters);
  };

  return (
    <>
      <Button 
        onClick={() => setIsFilterOpen(true)}
        variant="default"
        size="sm"
        leftIcon={<Filter className="w-3.5 h-3.5" />}
      >
        Filter Pipeline
      </Button>
      <FilterPanel 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        onApplyFilters={handleApplyFilters}
      />
    </>
  );
}

export function SendAllButton() {
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (showSuccess) {
      t = setTimeout(() => setShowSuccess(false), 3000);
    }
    return () => clearTimeout(t);
  }, [showSuccess]);

  const handleSendAll = async () => {
    setIsSending(true);
    
    // Simulate sending to all clients
    setTimeout(() => {
      setIsSending(false);
      setShowSuccess(true);
    }, 1500);
  };

  return (
    <div className="relative">
      <Button 
        onClick={handleSendAll}
        isLoading={isSending}
        variant="secondary"
        className="w-full"
        leftIcon={<Send className="w-4 h-4" />}
      >
        Dispatch All Notices
      </Button>
      {showSuccess && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-secondary/5 border border-secondary/10 rounded-xl text-[10px] font-bold text-secondary text-center uppercase tracking-widest">
          Analysis reports successfully dispatched to 5 insureds
        </div>
      )}
    </div>
  );
}

export function ReviewClientsButton() {
  const [showDetails, setShowDetails] = useState(false);

  const handleReview = () => {
    setShowDetails(true);
  };

  return (
    <div className="relative">
      <Button 
        onClick={handleReview}
        variant="outline"
        className="w-full bg-white/10 border-white/10 text-white hover:bg-white/20"
      >
        Analyze Retention Risks
      </Button>
      {showDetails && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-surface border border-black/5 rounded-xl shadow-xl z-50">
          <h4 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-3">Rate Increase Analysis</h4>
          <ul className="text-xs text-on-surface/70 space-y-2 font-medium">
            <li className="flex justify-between"><span>Tech Corp</span> <span className="text-red-600 font-bold">+15%</span></li>
            <li className="flex justify-between"><span>Global Industries</span> <span className="text-red-600 font-bold">+12%</span></li>
            <li className="flex justify-between"><span>Innovation Labs</span> <span className="text-red-600 font-bold">+18%</span></li>
            <li className="flex justify-between"><span>Summit Holdings</span> <span className="text-red-600 font-bold">+14%</span></li>
            <li className="flex justify-between"><span>Phoenix Enterprises</span> <span className="text-red-600 font-bold">+16%</span></li>
          </ul>
          <Button 
            onClick={() => setShowDetails(false)}
            variant="ghost"
            size="sm"
            className="w-full mt-4 text-secondary hover:bg-secondary/5"
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

export function QuoteToolButton() {
  const [showModal, setShowModal] = useState(false);

  const handleQuoteTool = () => {
    setShowModal(true);
  };

  return (
    <>
      <button 
        onClick={handleQuoteTool}
        className="group flex flex-col items-center justify-center p-6 bg-surface border border-black/5 rounded-xl hover:bg-white hover:shadow-md transition-all gap-3 text-center"
      >
        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
          <Calculator className="w-5 h-5 text-secondary group-hover:text-white" />
        </div>
        <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest group-hover:text-on-surface transition-colors">Premium Engine</span>
      </button>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl border border-black/5 p-8">
            <h3 className="text-xl font-bold text-on-surface mb-6 tracking-tight">Premium Intelligence Calculator</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Placement Type</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all">
                  <option>Commercial Auto</option>
                  <option>Commercial Property</option>
                  <option>General Liability</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Coverage Authority Limit</label>
                <input type="text" placeholder="$1,000,000" className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all" />
              </div>
              <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/10">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-1">Estimated Annual Premium</label>
                <div className="text-3xl font-bold text-on-surface tracking-tight">$2,450.00</div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button 
                onClick={() => setShowModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button variant="default" className="flex-1">
                Generate Quote
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function NewLeadButton() {
  const [showModal, setShowModal] = useState(false);

  const handleNewLead = () => {
    setShowModal(true);
  };

  return (
    <>
      <button 
        onClick={handleNewLead}
        className="group flex flex-col items-center justify-center p-6 bg-surface border border-black/5 rounded-xl hover:bg-white hover:shadow-md transition-all gap-3 text-center"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
          <PlusIcon className="w-5 h-5 text-primary group-hover:text-white" />
        </div>
        <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest group-hover:text-on-surface transition-colors">New Submission</span>
      </button>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl border border-black/5 p-8">
            <h3 className="text-xl font-bold text-on-surface mb-6 tracking-tight">Add New Submission</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Insured Prospect Name</label>
                <input type="text" placeholder="Enter full legal name" className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Primary Intelligence Contact</label>
                <input type="email" placeholder="official@insured.com" className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Requested Coverage Type</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer">
                  <option>Commercial Package</option>
                  <option>Automotive Fleet</option>
                  <option>Professional Liability</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button 
                onClick={() => setShowModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button variant="default" className="flex-1">
                Dispatch Submission
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AddClientButton() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientIndustry: '',
    clientPhone: '',
    clientAddress: '',
  });

  const handleAddClient = () => {
    setShowModal(true);
  };

  const handleSaveClient = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Validate required fields
      if (!formData.clientName) {
        setSaveMessage('Client name is required');
        setIsSaving(false);
        return;
      }

      // Call API to save client
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.clientName,
          email: formData.clientEmail,
          industry: formData.clientIndustry,
          phone: formData.clientPhone,
          address: formData.clientAddress,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add client');
      }

      setSaveMessage('Insured entity logged successfully!');

      // Close modal and refresh page after success
      setTimeout(() => {
        setShowModal(false);
        setSaveMessage('');
        setFormData({ clientName: '', clientEmail: '', clientIndustry: '', clientPhone: '', clientAddress: '' });
        router.refresh(); // Refresh to show the new client
      }, 1500);
    } catch (error: any) {
      setSaveMessage(error.message || 'Failed to add client');
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setFormData({ clientName: '', clientEmail: '', clientIndustry: '', clientPhone: '', clientAddress: '' });
    setSaveMessage('');
  };

  return (
    <>
      <Button 
        onClick={handleAddClient}
        variant="default"
        size="sm"
        leftIcon={<PlusIcon className="w-3.5 h-3.5" />}
      >
        Add Insured
      </Button>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl border border-black/5 p-8">
            <h3 className="text-xl font-bold text-on-surface mb-6 tracking-tight">Onboard New Insured Entity</h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Legal Entity Name</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Enter full legal name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Primary Command Contact</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="official@insured.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Industry Sector</label>
                <input
                  type="text"
                  value={formData.clientIndustry}
                  onChange={(e) => setFormData({ ...formData, clientIndustry: e.target.value })}
                  placeholder="e.g., Commercial Real Estate, Logistics"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Direct Command Line</label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Headquarters Address</label>
                <input
                  type="text"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  placeholder="Legal headquarters address"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
            </div>
            {saveMessage && (
              <div className="mt-6 p-3 bg-secondary/5 border border-secondary/10 rounded-xl text-[10px] font-bold text-secondary text-center uppercase tracking-widest">
                {saveMessage}
              </div>
            )}
            <div className="flex gap-3 mt-8">
              <Button
                onClick={resetForm}
                disabled={isSaving}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveClient}
                isLoading={isSaving}
                variant="default"
                className="flex-1"
              >
                Complete Onboarding
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AddRenewalButton() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    placementType: '',
    expirationDate: '',
    targetPremium: '',
  });

  const handleAddRenewal = () => {
    setShowModal(true);
  };

  const handleSubmitRenewal = async () => {
    if (!formData.clientId || !formData.expirationDate) {
      setSubmitMessage('Insured entity and expiration date are required');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/renewals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.clientId,
          placementType: formData.placementType,
          expirationDate: formData.expirationDate,
          targetPremium: formData.targetPremium,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create renewal');
      }

      setSubmitMessage('Renewal added successfully!');
      setTimeout(() => {
        setShowModal(false);
        setSubmitMessage('');
        setFormData({ clientId: '', placementType: '', expirationDate: '', targetPremium: '' });
        router.refresh();
      }, 1500);
    } catch (error: any) {
      setSubmitMessage(error.message || 'Failed to create renewal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setSubmitMessage('');
    setFormData({ clientId: '', placementType: '', expirationDate: '', targetPremium: '' });
  };

  return (
    <>
      <Button 
        onClick={handleAddRenewal}
        variant="default"
        size="sm"
        leftIcon={<PlusIcon className="w-3.5 h-3.5" />}
      >
        Add Renewal
      </Button>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl border border-black/5 p-8">
            <h3 className="text-xl font-bold text-on-surface mb-6 tracking-tight">Add Renewal Workflow</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Target Insured Entity</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer"
                >
                  <option value="">Select an entity...</option>
                  <option value="tech-corp">Tech Corp</option>
                  <option value="global-industries">Global Industries</option>
                  <option value="innovation-labs">Innovation Labs</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Placement Type</label>
                <select
                  value={formData.placementType}
                  onChange={(e) => setFormData({ ...formData, placementType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer"
                >
                  <option value="">Select placement...</option>
                  <option value="commercial-auto">Commercial Auto</option>
                  <option value="commercial-property">Commercial Property</option>
                  <option value="general-liability">General Liability</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Target Premium Volume</label>
                <input
                  type="text"
                  value={formData.targetPremium}
                  onChange={(e) => setFormData({ ...formData, targetPremium: e.target.value })}
                  placeholder="$0.00"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-black/10 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
            </div>
            {submitMessage && (
              <div className="mt-6 p-3 bg-secondary/5 border border-secondary/10 rounded-xl text-[10px] font-bold text-secondary text-center uppercase tracking-widest">
                {submitMessage}
              </div>
            )}
            <div className="flex gap-3 mt-8">
              <Button
                onClick={resetForm}
                disabled={isSubmitting}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRenewal}
                isLoading={isSubmitting}
                variant="default"
                className="flex-1"
              >
                Commit Renewal
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ChatBubbleButton({ initialPrompt, isDemo = false }: { initialPrompt?: string; isDemo?: boolean } = {}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(initialPrompt || null);

  useEffect(() => {
    const handleOpenChat = (e: CustomEvent) => {
      setPrompt(e.detail?.prompt || null);
      setIsChatOpen(true);
    };
    window.addEventListener('open-chat', handleOpenChat as EventListener);
    return () => window.removeEventListener('open-chat', handleOpenChat as EventListener);
  }, []);

  const handleChatClick = () => {
    setIsChatOpen(true);
  };

  return (
    <>
      <Button 
        onClick={handleChatClick}
        variant="secondary"
        className="w-16 h-16 rounded-[22px] shadow-[0_20px_40px_-10px_rgba(34,197,94,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(34,197,94,0.6)] hover:scale-110 active:scale-95 transition-all duration-500 bg-gradient-to-br from-secondary via-secondary to-emerald-600 border-none group"
      >
        <div className="relative">
          <Sparkles className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-500" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)] border-2 border-emerald-600"></div>
        </div>
      </Button>
      {isChatOpen && (
        <Suspense fallback={null}>
          <ChatInterface 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            initialPrompt={prompt} 
            isDemo={isDemo}
          />
        </Suspense>
      )}
    </>
  );
}

export function NotificationButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleNotificationClick = () => {
    setIsPanelOpen(true);
  };

  return (
    <>
      <Button 
        onClick={handleNotificationClick}
        variant="outline"
        size="icon"
        className="w-10 h-10 rounded-xl bg-surface border-black/5 text-on-surface/40 hover:text-primary hover:bg-slate-50 transition-all relative group"
        leftIcon={<Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />}
      >
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-surface animate-pulse" />
      </Button>
      <NotificationPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}

export function SettingsButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleSettingsClick = () => {
    console.log('Settings button clicked!');
    setIsPanelOpen(true);
  };

  return (
    <>
      <Button 
        onClick={handleSettingsClick}
        variant="outline"
        size="icon"
        className="w-10 h-10 rounded-xl bg-surface border-black/5 text-on-surface/40 hover:text-primary hover:bg-slate-50 transition-all group"
        leftIcon={<SettingsIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />}
      >
      </Button>
      <SettingsPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
