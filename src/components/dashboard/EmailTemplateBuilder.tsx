'use client';

import { useState } from 'react';
import { Mail, Plus, Edit, Trash2, Eye, Save, X, Variable, Type, Layout } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'renewal_reminder' | 'rate_hike' | 'cross_sell' | 'certificate_request' | 'custom';
  variables: string[];
}

const TEMPLATE_TYPES = [
  { value: 'renewal_reminder', label: 'Renewal Reminder' },
  { value: 'rate_hike', label: 'Rate Hike' },
  { value: 'cross_sell', label: 'Cross-Sell' },
  { value: 'certificate_request', label: 'Certificate Request' },
  { value: 'custom', label: 'Custom' },
];

const AVAILABLE_VARIABLES = [
  { name: 'insuredName', label: 'Insured Name', description: 'Client name' },
  { name: 'policyType', label: 'Policy Type', description: 'Type of insurance policy' },
  { name: 'carrier', label: 'Carrier', description: 'Insurance carrier name' },
  { name: 'expirationDate', label: 'Expiration Date', description: 'Policy expiration date' },
  { name: 'premium', label: 'Premium', description: 'Policy premium amount' },
  { name: 'policyNumber', label: 'Policy Number', description: 'Policy identification number' },
  { name: 'agentName', label: 'Agent Name', description: 'Assigned agent name' },
  { name: 'newPremium', label: 'New Premium', description: 'Updated premium amount' },
  { name: 'oldPremium', label: 'Old Premium', description: 'Previous premium amount' },
  { name: 'aiInsights', label: 'AI Insights', description: 'AI-generated analysis' },
];

export function EmailTemplateBuilder() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: 'renewal_reminder_30_days',
      name: 'Renewal Reminder - 30 Days',
      subject: 'Your {{policyType}} policy renewal is approaching',
      body: `Dear {{insuredName}},

Your {{policyType}} policy with {{carrier}} is set to expire on {{expirationDate}}.

We want to ensure you have continuous coverage without any gaps. Our team is already reviewing your policy to make sure you're getting the best possible rate.

If you have any questions or would like to discuss coverage options, please don't hesitate to reach out.

Best regards,
{{agentName}}`,
      type: 'renewal_reminder',
      variables: ['insuredName', 'policyType', 'carrier', 'expirationDate', 'agentName'],
    },
    {
      id: 'rate_hike_explanation',
      name: 'Rate Hike Explanation',
      subject: 'Important update regarding your {{policyType}} policy',
      body: `Dear {{insuredName}},

We're writing to inform you about an upcoming change to your {{policyType}} policy premium.

After conducting a thorough market analysis, we've identified that your premium will be adjusted to {{newPremium}} (previously {{oldPremium}}). This change reflects current market conditions and ensures your coverage remains adequate.

Our AI-powered analysis shows that:
{{aiInsights}}

We understand rate changes can be concerning. We've prepared a detailed explanation and are available to discuss options that might help mitigate this increase.

Sincerely,
{{agentName}}`,
      type: 'rate_hike',
      variables: ['insuredName', 'policyType', 'newPremium', 'oldPremium', 'aiInsights', 'agentName'],
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showVariablePicker, setShowVariablePicker] = useState(false);

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;

    if (isEditing) {
      setTemplates(templates.map(t => t.id === selectedTemplate.id ? selectedTemplate : t));
    } else {
      setTemplates([...templates, { ...selectedTemplate, id: `template_${Date.now()}` }]);
    }

    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const handleInsertVariable = (variableName: string) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({
      ...selectedTemplate,
      body: selectedTemplate.body + `{{${variableName}}}`,
    });
    setShowVariablePicker(false);
  };

  const getPreviewContent = () => {
    if (!selectedTemplate) return '';
    
    let content = selectedTemplate.body;
    const sampleVars = {
      insuredName: 'John Smith',
      policyType: 'Commercial Liability',
      carrier: 'ABC Insurance',
      expirationDate: 'December 31, 2024',
      premium: '$5,000',
      policyNumber: 'POL-12345',
      agentName: 'Jane Agent',
      newPremium: '$5,500',
      oldPremium: '$5,000',
      aiInsights: 'Market rates have increased by 10% in your industry sector.',
    };

    for (const [key, value] of Object.entries(sampleVars)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return content;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-on-surface font-headline italic tracking-tight">Email Template Builder</h2>
          <p className="text-sm text-on-surface/60 font-medium italic mt-1">Create and manage email campaign templates</p>
        </div>
        <button
          onClick={() => {
            setSelectedTemplate({
              id: '',
              name: 'New Template',
              subject: '',
              body: '',
              type: 'custom',
              variables: [],
            });
            setIsEditing(false);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Template List */}
      {!selectedTemplate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-surface rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all p-6 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Mail className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsEditing(true);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-on-surface/40" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-on-surface font-headline italic mb-2">{template.name}</h3>
              <p className="text-sm text-on-surface/60 line-clamp-2">{template.subject}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="px-3 py-1 bg-secondary/5 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full">
                  {TEMPLATE_TYPES.find(t => t.value === template.type)?.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Editor */}
      {selectedTemplate && (
        <div className="bg-surface rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          {/* Editor Header */}
          <div className="px-6 py-4 border-b border-black/5 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-on-surface font-headline italic">{isEditing ? 'Edit Template' : 'New Template'}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPreviewing(!isPreviewing)}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-black/5 rounded-lg hover:bg-slate-50 transition-all text-sm font-bold"
              >
                <Eye className="w-4 h-4" />
                {isPreviewing ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-black text-xs uppercase tracking-widest hover:shadow-lg transition-all"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>

          <div className="p-6">
            {isPreviewing ? (
              /* Preview Mode */
              <div className="bg-white rounded-xl border border-black/5 p-8">
                <div className="bg-primary text-white p-6 rounded-t-xl -mx-8 -mt-8 mb-6">
                  <h1 className="text-2xl font-black text-center">BookGuard</h1>
                </div>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                    {getPreviewContent()}
                  </pre>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                  This email was sent by BookGuard CRM
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-2">Template Name</label>
                    <input
                      type="text"
                      value={selectedTemplate.name}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Template name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-2">Template Type</label>
                    <select
                      value={selectedTemplate.type}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, type: e.target.value as any })}
                      className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {TEMPLATE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Email subject line"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Email Body</label>
                    <button
                      onClick={() => setShowVariablePicker(!showVariablePicker)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-secondary/5 text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-secondary/10 transition-all"
                    >
                      <Variable className="w-3 h-3" />
                      Insert Variable
                    </button>
                  </div>
                  
                  {showVariablePicker && (
                    <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-black/5">
                      <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-3">Available Variables</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {AVAILABLE_VARIABLES.map((variable) => (
                          <button
                            key={variable.name}
                            onClick={() => handleInsertVariable(variable.name)}
                            className="px-3 py-2 bg-white border border-black/5 rounded-lg text-xs text-left hover:border-secondary hover:text-secondary transition-all"
                            title={variable.description}
                          >
                            <div className="font-bold">{`{{${variable.name}}}`}</div>
                            <div className="text-[9px] text-on-surface/40">{variable.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    value={selectedTemplate.body}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, body: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[300px] font-mono text-sm"
                    placeholder="Email body content..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mb-2">Detected Variables</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.body.match(/{{(\w+)}}/g)?.map((match) => (
                      <span
                        key={match}
                        className="px-3 py-1.5 bg-primary/5 text-primary text-xs font-bold rounded-lg border border-primary/10"
                      >
                        {match}
                      </span>
                    )) || <span className="text-sm text-on-surface/40">No variables detected</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
