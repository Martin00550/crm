'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  FileText, 
  Calendar,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Shield,
  Download,
  Edit,
  ArrowLeft,
  Trash2,
  X
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { Modal } from '@/components/ui/Modal';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  createdAt: string;
  portalAccessEnabled: boolean;
}

interface Policy {
  id: string;
  policyNumber: string;
  carrier: string;
  policyType: string;
  premium: string;
  effectiveDate: string;
  expirationDate: string;
  status: string;
  healthScore: number;
  healthStatus: string;
}

interface Document {
  id: string;
  filename: string;
  category: string;
  createdAt: string;
  fileSize: number;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [editPolicyId, setEditPolicyId] = useState<string | null>(null);
  const [deletePolicyId, setDeletePolicyId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
  });
  const [newPolicyForm, setNewPolicyForm] = useState({
    policyNumber: '',
    carrier: '',
    policyType: '',
    premium: '',
    effectiveDate: '',
    expirationDate: '',
    status: 'active',
  });
  const [editPolicyForm, setEditPolicyForm] = useState({
    policyNumber: '',
    carrier: '',
    policyType: '',
    premium: '',
    effectiveDate: '',
    expirationDate: '',
    status: 'active',
    healthScore: 80,
  });

  useEffect(() => {
    if (clientId && userId) {
      loadClientData();
    }
  }, [clientId, userId]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      // Load client details
      const clientRes = await fetch(`/api/clients/${clientId}`);
      if (!clientRes.ok) {
        throw new Error('Client not found');
      }
      const clientData = await clientRes.json();
      setClient(clientData.client);
      setEditForm({
        name: clientData.client.name || '',
        email: clientData.client.email || '',
        phone: clientData.client.phone || '',
        address: clientData.client.address || '',
        industry: clientData.client.industry || '',
      });

      // Load client policies
      const policiesRes = await fetch(`/api/clients/${clientId}/policies`);
      if (policiesRes.ok) {
        const policiesData = await policiesRes.json();
        setPolicies(policiesData.policies || []);
      }

      // Load client documents
      const docsRes = await fetch(`/api/clients/${clientId}/documents`);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const daysUntil = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil;
  };

  const getRiskColor = (daysUntil: number) => {
    if (daysUntil <= 30) return 'text-red-600 bg-red-50';
    if (daysUntil <= 60) return 'text-amber-600 bg-amber-50';
    if (daysUntil <= 90) return 'text-blue-600 bg-blue-50';
    return 'text-secondary bg-secondary/5';
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-secondary bg-secondary/5';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const generatePortalInvite = async () => {
    try {
      const res = await fetch('/api/portal/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to generate invitation');
      }

      // Copy invite URL to clipboard
      navigator.clipboard.writeText(result.invite.portalUrl);
      setSuccess('Client portal invitation link copied to clipboard!');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEditClient = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update client');
      }

      setClient(result.client);
      setIsEditing(false);
      setSuccess('Client updated successfully');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteClient = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete client');
      }

      router.push('/dashboard/clients');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleAddPolicy = async () => {
    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPolicyForm,
          clientId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to add policy');
      }

      setPolicies([...policies, result.policy]);
      setIsAddingPolicy(false);
      setNewPolicyForm({
        policyNumber: '',
        carrier: '',
        policyType: '',
        premium: '',
        effectiveDate: '',
        expirationDate: '',
        status: 'active',
      });
      setSuccess('Policy added successfully');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      const res = await fetch(`/api/policies/${policyId}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete policy');
      }

      setPolicies(policies.filter(p => p.id !== policyId));
      setDeletePolicyId(null);
      setSuccess('Policy deleted successfully');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const openEditPolicy = (policy: Policy) => {
    setEditPolicyId(policy.id);
    setEditPolicyForm({
      policyNumber: policy.policyNumber,
      carrier: policy.carrier,
      policyType: policy.policyType,
      premium: policy.premium,
      effectiveDate: policy.effectiveDate ? policy.effectiveDate.split('T')[0] : 'N/A',
      expirationDate: policy.expirationDate ? policy.expirationDate.split('T')[0] : 'N/A',
      status: policy.status,
      healthScore: policy.healthScore,
    });
  };

  const handleEditPolicy = async () => {
    if (!editPolicyId) return;
    
    try {
      const res = await fetch(`/api/policies/${editPolicyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editPolicyForm),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update policy');
      }

      setPolicies(policies.map(p => p.id === editPolicyId ? result.policy : p));
      setEditPolicyId(null);
      setSuccess('Policy updated successfully');
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error || 'Client not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPremium = policies.reduce((sum, policy) => sum + parseFloat(policy.premium || '0'), 0);
  const activePolicies = policies.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-8 font-body text-on-surface">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-surface border border-black/5 text-on-surface/40 hover:text-primary hover:bg-slate-50 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-on-surface italic font-headline tracking-tight leading-none">{client.name}</h1>
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mt-2">{client.industry || "General Industry Sector"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditing(true)}
            className="px-6 py-2.5 bg-surface border border-black/10 text-on-surface/60 font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-black/5 transition-all shadow-sm flex items-center gap-2"
          >
            <Edit className="w-3.5 h-3.5" />
            Update Profile
          </button>
          <button 
            onClick={() => setIsDeleting(true)}
            className="px-6 py-2.5 bg-red-50 border border-red-100 text-red-600 font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-red-100 transition-all shadow-sm flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Decommission
          </button>
          {client.portalAccessEnabled && (
            <button 
              onClick={generatePortalInvite}
              className="px-8 py-2.5 bg-secondary text-white font-black text-[10px] uppercase tracking-widest rounded-full hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Provision Portal Link
            </button>
          )}
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface p-8 rounded-[32px] border border-black/5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Contact Intelligence</h3>
          </div>
          <div className="space-y-5">
            <div className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-black/5 text-on-surface/20 group-hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-on-surface italic">{client.email}</span>
            </div>
            <div className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-black/5 text-on-surface/20 group-hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-on-surface italic">{client.phone}</span>
            </div>
            <div className="flex items-start gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-black/5 text-on-surface/20 group-hover:text-primary transition-colors mt-0.5">
                <Building className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-on-surface italic leading-relaxed">{client.address}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface p-8 rounded-[32px] border border-black/5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/10">
              <FileText className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Placement Summary</h3>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Active Placements</span>
              <span className="font-headline italic font-black text-xl text-on-surface tracking-tighter">{activePolicies}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Total Book Volume</span>
              <span className="font-headline italic font-black text-xl text-secondary tracking-tighter">${totalPremium.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-black/5">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Insured Since</span>
              <span className="text-sm font-bold text-on-surface/60">
                {new Date(client.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface p-8 rounded-[32px] border border-black/5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Gateway Authority</h3>
          </div>
          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Portal Status</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                client.portalAccessEnabled 
                  ? 'bg-secondary/5 text-secondary border-secondary/10 shadow-sm' 
                  : 'bg-slate-100 text-on-surface/40 border-black/5'
              }`}>
                {client.portalAccessEnabled ? 'Active Deployment' : 'Locked'}
              </span>
            </div>
            {client.portalAccessEnabled ? (
              <button className="w-full py-4 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:shadow-xl transition-all active:scale-[0.98]">
                Authorize Provision Link
              </button>
            ) : (
              <p className="text-[10px] text-on-surface/40 font-medium italic text-center">Update profile to authorize insured gateway access</p>
            )}
          </div>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Authorized Placement Registry</h3>
          <button 
            onClick={() => setIsAddingPolicy(true)}
            className="px-6 py-2.5 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-full hover:shadow-lg transition-all active:scale-[0.98]"
          >
            Authorize New Placement
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/5 bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Identifier</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Carrier</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Coverage Line</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Premium Volume</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Maturity Timeline</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Forensic Health</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {policies.map((policy) => {
                const daysUntil = calculateDaysUntilExpiration(policy.expirationDate);
                return (
                  <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <button
                        onClick={() => router.push(`/dashboard/policy/${policy.id}`)}
                        className="font-headline italic font-bold text-on-surface hover:text-primary transition-colors text-base tracking-tight"
                      >
                        {policy.policyNumber}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-on-surface font-medium text-sm">
                        <span className="material-symbols-outlined text-xs text-on-surface/20">shield</span>
                        {policy.carrier}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-on-surface/60 italic">{policy.policyType}</td>
                    <td className="px-6 py-5">
                      <span className="font-headline italic font-black text-lg text-on-surface tracking-tighter">${parseFloat(policy.premium).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskColor(daysUntil)}`}>
                        {daysUntil > 0 ? `${daysUntil} Days Out` : 'Terminated'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shadow-sm ${getHealthColor(policy.healthScore).split(' ').slice(1).join(' ')}`} />
                        <span className="text-[10px] font-bold text-on-surface/60 uppercase tracking-widest">{policy.healthScore} Forensic Index</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditPolicy(policy)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-black/5 text-on-surface/40 hover:text-primary hover:bg-white hover:shadow-sm transition-all"
                          title="Authorize Update"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletePolicyId(policy.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50/30 border border-red-100/50 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Decommission Placement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {policies.length === 0 && (
            <div className="p-12 text-center bg-white">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <FileText className="w-8 h-8 text-on-surface/10" />
              </div>
              <p className="text-sm font-black text-on-surface/40 uppercase tracking-widest">No Active Placements Provisioned</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Forensic Document & Seal Vault</h3>
          <button className="px-6 py-2.5 bg-secondary text-white font-black text-[10px] uppercase tracking-widest rounded-full hover:shadow-lg transition-all active:scale-[0.98]">
            Authorize Asset Sync
          </button>
        </div>
        <div className="p-8">
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-5 bg-slate-50/50 border border-black/5 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/5 text-2xl">
                      📄
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors truncate max-w-[200px]">{doc.filename}</p>
                      <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mt-1">
                        {doc.category} Protocol <span className="mx-1">•</span> {(doc.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-black/5 text-on-surface/40 hover:text-secondary hover:shadow-sm transition-all shadow-sm">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50/30 rounded-2xl border border-black/5">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FileText className="w-8 h-8 text-on-surface/10" />
              </div>
              <p className="text-sm font-black text-on-surface/40 uppercase tracking-widest">No Intelligence Assets provisioned</p>
              <p className="text-[10px] font-bold text-on-surface/20 mt-2 uppercase tracking-widest italic">Sync certificates of insurance, endorsements, and policy forensics here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Client Modal */}
      {isEditing && (
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Update Insured Identity Protocol" maxWidth="md">
          <div className="space-y-8 font-body p-2">
            <div className="bg-slate-50/50 p-8 rounded-[32px] border border-black/5 shadow-inner">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-3">Legal Entity Identity</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-black text-on-surface italic font-headline text-xl tracking-tight"
                placeholder="e.g. Sterling Logistics Corp"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Intelligence Contact</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold text-on-surface"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Command Line</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold text-on-surface"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Industry Sector</label>
              <input
                type="text"
                value={editForm.industry}
                onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-bold text-on-surface"
              />
            </div>

            <div className="flex items-center justify-end gap-6 pt-6 border-t border-black/5">
              <button
                onClick={() => setIsEditing(false)}
                className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest hover:text-on-surface transition-all pb-1 border-b border-transparent hover:border-on-surface/20"
              >
                Abort
              </button>
              <button
                onClick={handleEditClient}
                className="px-10 py-4 bg-primary text-white font-black rounded-full hover:shadow-2xl hover:shadow-primary/30 transition-all text-xs uppercase tracking-[0.2em] active:scale-[0.98]"
              >
                Commit Identity Updates
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <Modal isOpen={isDeleting} onClose={() => setIsDeleting(false)} title="Authorize Asset Decommission" maxWidth="sm">
          <div className="space-y-8 font-body p-2 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center mx-auto mb-2 border border-red-100 shadow-sm animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-black text-on-surface italic font-headline mb-2">Final Decommission Alert</h3>
              <p className="text-sm text-on-surface/60 font-medium italic leading-relaxed">
                Confirm total decommission of <span className="font-bold text-on-surface not-italic">{client?.name}</span>. This protocol is irreversible and will purge all associated placement intelligence.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleDeleteClient}
                className="w-full py-4 bg-red-600 text-white font-black rounded-full hover:bg-red-700 transition-all text-xs uppercase tracking-[0.2em] shadow-lg active:scale-[0.98]"
              >
                Confirm Total Purge
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                className="w-full py-4 bg-slate-50 border border-black/10 text-on-surface/60 font-black text-xs uppercase tracking-widest rounded-full hover:bg-white transition-all"
              >
                Abort Decommission
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Policy Modal */}
      {isAddingPolicy && (
        <Modal isOpen={isAddingPolicy} onClose={() => setIsAddingPolicy(false)} title="Authorize New Placement" maxWidth="lg">
          <div className="space-y-8 font-body p-2">
            <div className="bg-slate-50/50 p-8 rounded-[32px] border border-black/5 shadow-inner">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-3">Placement Identifier</label>
              <input
                type="text"
                value={newPolicyForm.policyNumber}
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, policyNumber: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-black text-on-surface uppercase tracking-widest text-lg"
                placeholder="e.g. POL-001"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Carrier Forensic Partner</label>
                <input
                  type="text"
                  value={newPolicyForm.carrier}
                  onChange={(e) => setNewPolicyForm({ ...newPolicyForm, carrier: e.target.value })}
                  placeholder="State Farm, Progressive, etc."
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Coverage Line Protocol</label>
                <div className="relative">
                  <select
                    value={newPolicyForm.policyType}
                    onChange={(e) => setNewPolicyForm({ ...newPolicyForm, policyType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer"
                  >
                    <option value="">Select type...</option>
                    <option value="Commercial Auto">Commercial Auto</option>
                    <option value="General Liability">General Liability</option>
                    <option value="Workers Comp">Workers Comp</option>
                    <option value="Property">Property</option>
                    <option value="Professional Liability">Professional Liability</option>
                    <option value="Umbrella">Umbrella</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Target Premium Volume ($)</label>
              <input
                type="number"
                value={newPolicyForm.premium}
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, premium: e.target.value })}
                placeholder="2500.00"
                className="w-full px-5 py-4 bg-white border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-black text-on-surface text-2xl font-headline italic tracking-tighter shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Inception Date</label>
                <input
                  type="date"
                  value={newPolicyForm.effectiveDate}
                  onChange={(e) => setNewPolicyForm({ ...newPolicyForm, effectiveDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Maturity Date (Expiration)</label>
                <input
                  type="date"
                  value={newPolicyForm.expirationDate}
                  onChange={(e) => setNewPolicyForm({ ...newPolicyForm, expirationDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-6 pt-6 border-t border-black/5">
              <button
                onClick={() => setIsAddingPolicy(false)}
                className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest hover:text-on-surface transition-all pb-1 border-b border-transparent hover:border-on-surface/20"
              >
                Abort
              </button>
              <button
                onClick={handleAddPolicy}
                className="px-10 py-4 bg-primary text-white font-black rounded-full hover:shadow-2xl hover:shadow-primary/30 transition-all text-xs uppercase tracking-[0.2em] active:scale-[0.98]"
              >
                Authorize Placement
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Policy Confirmation Modal */}
      {deletePolicyId && (
        <Modal isOpen={!!deletePolicyId} onClose={() => setDeletePolicyId(null)} title="Authorize Placement Termination" maxWidth="sm">
          <div className="space-y-8 font-body p-2 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center mx-auto mb-2 border border-red-100 shadow-sm animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-black text-on-surface italic font-headline mb-2">Final Termination Alert</h3>
              <p className="text-sm text-on-surface/60 font-medium italic leading-relaxed">
                Confirm total termination of this placement identifier. This protocol is irreversible and will purge all associated forensic records.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => handleDeletePolicy(deletePolicyId)}
                className="w-full py-4 bg-red-600 text-white font-black rounded-full hover:bg-red-700 transition-all text-xs uppercase tracking-[0.2em] shadow-lg active:scale-[0.98]"
              >
                Confirm Total Purge
              </button>
              <button
                onClick={() => setDeletePolicyId(null)}
                className="w-full py-4 bg-slate-50 border border-black/10 text-on-surface/60 font-black text-xs uppercase tracking-widest rounded-full hover:bg-white transition-all"
              >
                Abort Termination
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Policy Modal */}
      {editPolicyId && (
        <Modal isOpen={!!editPolicyId} onClose={() => setEditPolicyId(null)} title="Update Placement Forensics" maxWidth="lg">
          <div className="space-y-8 font-body p-2">
            <div className="bg-slate-50/50 p-8 rounded-[32px] border border-black/5 shadow-inner">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-3">Placement Identifier</label>
              <input
                type="text"
                value={editPolicyForm.policyNumber}
                onChange={(e) => setEditPolicyForm({ ...editPolicyForm, policyNumber: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-black text-on-surface uppercase tracking-widest text-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Carrier Partner</label>
                <input
                  type="text"
                  value={editPolicyForm.carrier}
                  onChange={(e) => setEditPolicyForm({ ...editPolicyForm, carrier: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Coverage Protocol</label>
                <div className="relative">
                  <select
                    value={editPolicyForm.policyType}
                    onChange={(e) => setEditPolicyForm({ ...editPolicyForm, policyType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer"
                  >
                    <option value="">Select type...</option>
                    <option value="Commercial Auto">Commercial Auto</option>
                    <option value="General Liability">General Liability</option>
                    <option value="Workers Comp">Workers Comp</option>
                    <option value="Property">Property</option>
                    <option value="Professional Liability">Professional Liability</option>
                    <option value="Umbrella">Umbrella</option>
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
                  value={editPolicyForm.premium}
                  onChange={(e) => setEditPolicyForm({ ...editPolicyForm, premium: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-headline italic tracking-tighter"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Forensic Health Index</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editPolicyForm.healthScore}
                  onChange={(e) => setEditPolicyForm({ ...editPolicyForm, healthScore: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Inception Date</label>
                <input
                  type="date"
                  value={editPolicyForm.effectiveDate}
                  onChange={(e) => setEditPolicyForm({ ...editPolicyForm, effectiveDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Maturity Date (Expiration)</label>
                <input
                  type="date"
                  value={editPolicyForm.expirationDate}
                  onChange={(e) => setEditPolicyForm({ ...editPolicyForm, expirationDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-1">Placement Lifecycle Stage</label>
              <div className="relative">
                <select
                  value={editPolicyForm.status}
                  onChange={(e) => setEditPolicyForm({ ...editPolicyForm, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none transition-all cursor-pointer"
                >
                  <option value="active">Active Deployment</option>
                  <option value="pending">Awaiting Sync</option>
                  <option value="cancelled">Decommissioned</option>
                  <option value="expired">Terminated/Expired</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-6 pt-6 border-t border-black/5">
              <button
                onClick={() => setEditPolicyId(null)}
                className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest hover:text-on-surface transition-all pb-1 border-b border-transparent hover:border-on-surface/20"
              >
                Abort
              </button>
              <button
                onClick={handleEditPolicy}
                className="px-10 py-4 bg-primary text-white font-black rounded-full hover:shadow-2xl hover:shadow-primary/30 transition-all text-xs uppercase tracking-[0.2em] active:scale-[0.98]"
              >
                Commit Forensic Updates
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
