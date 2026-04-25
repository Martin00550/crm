'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { SettingsPanel } from './SettingsPanel';
import { ChatInterface } from './ChatInterface';
import { FilterPanel } from './FilterPanel';

export function GenerateAIReportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setMessage('Generating AI report...');
    
    // Simulate AI report generation
    setTimeout(() => {
      setMessage('AI report generated successfully!');
      setTimeout(() => setMessage(''), 3000);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <>
      <button 
        onClick={handleGenerateReport}
        disabled={isLoading}
        className="w-full bg-secondary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest mb-4 flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isLoading ? 'refresh' : 'auto_awesome'}
        </span>
        {isLoading ? 'Generating Analysis...' : 'Generate AI Report'}
      </button>
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

  const handleExport = () => {
    if (data.length === 0) {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    // Create CSV content
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
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
      <button 
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface/40 bg-surface border border-black/10 rounded-xl hover:text-on-surface hover:bg-black/5 transition-all"
      >
        <span className="material-symbols-outlined text-sm">download</span>
        Export Registry
      </button>
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
      <button 
        onClick={() => setIsFilterOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-sm"
      >
        <span className="material-symbols-outlined text-sm">filter_list</span>
        Filter Pipeline
      </button>
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

  const handleSendAll = async () => {
    setIsSending(true);
    
    // Simulate sending to all clients
    setTimeout(() => {
      setIsSending(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="relative">
      <button 
        onClick={handleSendAll}
        disabled={isSending}
        className="w-full bg-secondary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isSending ? 'refresh' : 'send'}
        </span>
        {isSending ? 'Dispatching...' : 'Dispatch All Notices'}
      </button>
      {showSuccess && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-secondary/5 border border-secondary/10 rounded-xl text-[10px] font-bold text-secondary text-center uppercase tracking-widest">
          Forensic reports successfully dispatched to 5 insureds
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
      <button 
        onClick={handleReview}
        className="w-full bg-white/10 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest py-2.5 rounded-xl hover:bg-white/20 transition-all"
      >
        Review Portfolio
      </button>
      {showDetails && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-surface border border-black/5 rounded-xl shadow-xl z-50">
          <h4 className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-3">Rate Increase Forensics</h4>
          <ul className="text-xs text-on-surface/70 space-y-2 font-medium">
            <li className="flex justify-between"><span>Tech Corp</span> <span className="text-red-600 font-bold">+15%</span></li>
            <li className="flex justify-between"><span>Global Industries</span> <span className="text-red-600 font-bold">+12%</span></li>
            <li className="flex justify-between"><span>Innovation Labs</span> <span className="text-red-600 font-bold">+18%</span></li>
            <li className="flex justify-between"><span>Summit Holdings</span> <span className="text-red-600 font-bold">+14%</span></li>
            <li className="flex justify-between"><span>Phoenix Enterprises</span> <span className="text-red-600 font-bold">+16%</span></li>
          </ul>
          <button 
            onClick={() => setShowDetails(false)}
            className="w-full mt-4 py-2 text-[10px] font-bold text-secondary uppercase tracking-widest hover:bg-secondary/5 rounded-lg transition-all"
          >
            Dismiss
          </button>
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
          <span className="material-symbols-outlined text-secondary group-hover:text-white">calculate</span>
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
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-2.5 border border-black/10 text-on-surface/60 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button className="flex-1 px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:shadow-lg transition-all">
                Initialize Quote
              </button>
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
          <span className="material-symbols-outlined text-primary group-hover:text-white">assignment_add</span>
        </div>
        <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest group-hover:text-on-surface transition-colors">New Submission</span>
      </button>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl border border-black/5 p-8">
            <h3 className="text-xl font-bold text-on-surface mb-6 tracking-tight">Initialize New Submission</h3>
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
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-2.5 border border-black/10 text-on-surface/60 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button className="flex-1 px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all">
                Dispatch Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AddClientButton() {
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
    console.log('Add Client button clicked!');
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

      setSaveMessage('Client added successfully!');

      // Close modal and refresh page after success
      setTimeout(() => {
        setShowModal(false);
        setSaveMessage('');
        setFormData({ clientName: '', clientEmail: '', clientIndustry: '', clientPhone: '', clientAddress: '' });
        window.location.reload(); // Refresh to show the new client
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
      <button 
        onClick={handleAddClient}
        className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-sm"
      >
        <Plus className="w-3.5 h-3.5" />
        Initialize Insured
      </button>
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
              <button
                onClick={resetForm}
                disabled={isSaving}
                className="flex-1 px-6 py-2.5 border border-black/10 text-on-surface/60 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-black/5 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveClient}
                disabled={isSaving}
                className="flex-1 px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Syncing...' : 'Complete Onboarding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AddRenewalButton() {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    placementType: '',
    maturityDate: '',
    targetPremium: '',
  });

  const handleAddRenewal = () => {
    setShowModal(true);
  };

  const handleSubmitRenewal = async () => {
    if (!formData.clientId || !formData.maturityDate) {
      setSubmitMessage('Insured entity and maturity date are required');
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
          maturityDate: formData.maturityDate,
          targetPremium: formData.targetPremium,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create renewal');
      }

      setSubmitMessage('Renewal initialized successfully!');
      setTimeout(() => {
        setShowModal(false);
        setSubmitMessage('');
        setFormData({ clientId: '', placementType: '', maturityDate: '', targetPremium: '' });
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setSubmitMessage(error.message || 'Failed to initialize renewal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setSubmitMessage('');
    setFormData({ clientId: '', placementType: '', maturityDate: '', targetPremium: '' });
  };

  return (
    <>
      <button 
        onClick={handleAddRenewal}
        className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-sm"
      >
        <Plus className="w-3.5 h-3.5" />
        Initialize Renewal
      </button>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl border border-black/5 p-8">
            <h3 className="text-xl font-bold text-on-surface mb-6 tracking-tight">Initialize Renewal Workflow</h3>
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
                <label className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-2">Maturity Date (Expiration)</label>
                <input
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
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
              <button
                onClick={resetForm}
                disabled={isSubmitting}
                className="flex-1 px-6 py-2.5 border border-black/10 text-on-surface/60 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-black/5 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRenewal}
                disabled={isSubmitting}
                className="flex-1 px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Syncing...' : 'Commit Renewal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ChatBubbleButton({ initialPrompt }: { initialPrompt?: string } = {}) {
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
      <button 
        onClick={handleChatClick}
        data-chat-button
        className="w-14 h-14 bg-secondary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
      </button>
      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} initialPrompt={prompt} />
    </>
  );
}

export function NotificationButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleNotificationClick = () => {
    console.log('Notification button clicked!');
    setIsPanelOpen(true);
  };

  return (
    <>
      <button 
        onClick={handleNotificationClick}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-black/5 text-on-surface/40 hover:text-primary hover:bg-slate-50 transition-all relative group"
      >
        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">notifications</span>
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-surface animate-pulse" />
      </button>
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
      <button 
        onClick={handleSettingsClick}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-black/5 text-on-surface/40 hover:text-primary hover:bg-slate-50 transition-all group"
      >
        <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-500">settings</span>
      </button>
      <SettingsPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
