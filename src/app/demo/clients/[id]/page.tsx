"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  FileText, 
  Shield,
  Download,
  Edit,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Plus,
  Loader2,
  Check
} from "lucide-react";
import { MetricComparison } from "@/components/dashboard/MetricComparison";
import { useMockData } from "@/context/MockDataContext";
import { Modal } from "@/components/ui/Modal";

export default function DemoClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { clients, policies, updateClient, deleteClient, addPolicy, updatePolicy, deletePolicy } = useMockData();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [clientPolicies, setClientPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editPolicyId, setEditPolicyId] = useState<string | null>(null);
  const [deletePolicyId, setDeletePolicyId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    industry: "",
  });

  const [newPolicyForm, setNewPolicyForm] = useState({
    policyNumber: "",
    carrier: "",
    policyType: "",
    premium: "",
    effectiveDate: "",
    expirationDate: "",
    status: "active" as const,
  });

  const [editPolicyForm, setEditPolicyForm] = useState({
    policyNumber: "",
    carrier: "",
    policyType: "",
    premium: "",
    effectiveDate: "",
    expirationDate: "",
    status: "active" as const,
    healthScore: 80,
  });

  useEffect(() => {
    const foundClient = clients.find(c => c.id === clientId);
    if (foundClient) {
      setClient(foundClient);
      setEditForm({
        name: foundClient.name,
        email: foundClient.email,
        phone: foundClient.phone,
        address: foundClient.address || "",
        industry: foundClient.industry || "",
      });
      
      const foundPolicies = policies.filter(p => p.clientId === clientId);
      setClientPolicies(foundPolicies);
    }
    setLoading(false);
  }, [clientId, clients, policies]);

  const calculateDaysUntilExpiration = (expirationDate: Date | string) => {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const daysUntil = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil;
  };

  const getRiskColor = (daysUntil: number) => {
    if (daysUntil <= 30) return "text-red-600 bg-red-50";
    if (daysUntil <= 60) return "text-amber-600 bg-amber-50";
    if (daysUntil <= 90) return "text-blue-600 bg-blue-50";
    return "text-secondary bg-secondary/5";
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-secondary bg-secondary/5";
    if (score >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const handleEditClient = () => {
    updateClient(clientId, editForm);
    setIsEditing(false);
    setSuccess('Client updated successfully');
  };

  const handleDeleteClient = () => {
    deleteClient(clientId);
    router.push("/demo");
  };

  const handleAddPolicy = () => {
    addPolicy({
      ...newPolicyForm,
      clientId,
      clientName: client.name,
      premium: parseFloat(newPolicyForm.premium),
      currentTermPremium: parseFloat(newPolicyForm.premium),
      effectiveDate: new Date(newPolicyForm.effectiveDate),
      expirationDate: new Date(newPolicyForm.expirationDate),
      healthScore: 85,
      healthStatus: "healthy",
      notes: [],
    });
    setIsAddingPolicy(false);
    setNewPolicyForm({
      policyNumber: "",
      carrier: "",
      policyType: "",
      premium: "",
      effectiveDate: "",
      expirationDate: "",
      status: "active",
    });
    setSuccess('Policy added successfully');
  };

  const handleGenerateAIReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      setShowReport(true);
    }, 2000);
  };

  const openEditPolicy = (policy: any) => {
    setEditPolicyId(policy.id);
    setEditPolicyForm({
      policyNumber: policy.policyNumber,
      carrier: policy.carrier,
      policyType: policy.policyType,
      premium: policy.premium.toString(),
      effectiveDate: new Date(policy.effectiveDate).toISOString().split("T")[0],
      expirationDate: new Date(policy.expirationDate).toISOString().split("T")[0],
      status: policy.status,
      healthScore: policy.healthScore,
    });
  };

  const handleEditPolicySubmit = () => {
    if (!editPolicyId) return;
    updatePolicy(editPolicyId, {
      ...editPolicyForm,
      premium: parseFloat(editPolicyForm.premium),
      effectiveDate: new Date(editPolicyForm.effectiveDate),
      expirationDate: new Date(editPolicyForm.expirationDate),
    });
    setEditPolicyId(null);
    setSuccess('Policy updated successfully');
  };

  if (loading) return <div className="p-12 animate-pulse bg-white rounded-[32px] h-96 border border-black/5 shadow-sm"></div>;
  if (!client) return <div className="p-12 text-center text-on-surface/40 italic font-body">Client Registry entry not found.</div>;

  const totalPremium = clientPolicies.reduce((sum, p) => sum + p.premium, 0);
  const activePoliciesCount = clientPolicies.filter(p => p.status === "active").length;

  return (
    <div className="space-y-8 font-body text-on-surface animate-in fade-in duration-700">
      {/* Header & Primary Actions - Identical to Live */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-black/5 text-on-surface/40 hover:text-primary transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-4xl font-black text-on-surface tracking-tight leading-none">{client.name}</h1>
          </div>
          <div className="flex items-center gap-4 text-on-surface/50 font-medium ml-14">
            <span className="text-sm">{client.email}</span>
            <span className="text-on-surface/10">•</span>
            <span className="text-sm">{client.phone}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerateAIReport}
            className="flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-2xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 group"
          >
            {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            <span className="text-[11px] font-bold uppercase tracking-widest">AI Analysis Report</span>
          </button>
          
          <div className="relative group">
            <button className="flex items-center gap-2 px-5 py-3 bg-white border border-black/5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <span className="text-[11px] font-bold text-on-surface/40 uppercase tracking-widest">Actions</span>
              <Plus className="w-4 h-4 text-on-surface/20" />
            </button>
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-black/5 rounded-2xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
              <button onClick={() => setIsAddingPolicy(true)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group/item">
                <Shield className="w-4 h-4 text-on-surface/40 group-hover/item:text-primary transition-colors" />
                <span className="text-[10px] font-bold text-on-surface/60 uppercase tracking-widest">Add Policy</span>
              </button>
              <div className="h-px bg-black/5 my-1" />
              <button onClick={() => setIsEditing(true)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group/item">
                <Edit className="w-4 h-4 text-on-surface/40 group-hover/item:text-on-surface transition-colors" />
                <span className="text-[10px] font-bold text-on-surface/60 uppercase tracking-widest">Edit Profile</span>
              </button>
              <button onClick={() => setIsDeleting(true)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left group/item">
                <Trash2 className="w-4 h-4 text-red-400" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Remove Client</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Grid - Identical to Live */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col justify-between group hover:border-secondary/20 transition-all">
          <div className="mb-8">
            <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Total Premium Volume</span>
            <h3 className="text-4xl font-bold tracking-tight text-on-surface">${totalPremium.toLocaleString()}</h3>
          </div>
          <MetricComparison 
            current={totalPremium} 
            previous={totalPremium * 0.96} 
            trend="up" 
            type="currency"
            label="Volume Growth"
          />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col justify-between group hover:border-secondary/20 transition-all">
          <div className="mb-8">
            <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Active Policies</span>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-bold tracking-tight text-on-surface">{activePoliciesCount}</h3>
              <span className="text-[10px] font-bold text-on-surface/30 mb-1 uppercase tracking-wider">Policies</span>
            </div>
          </div>
          <MetricComparison 
            current={activePoliciesCount} 
            previous={activePoliciesCount} 
            trend="neutral" 
            label="Coverage Health"
          />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 flex flex-col justify-between group hover:border-secondary/20 transition-all">
          <div className="mb-8">
            <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] block mb-2">Portfolio Health</span>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-bold tracking-tight text-secondary">84.2%</h3>
              <span className="text-[10px] font-black text-secondary mb-1 uppercase tracking-wider">Optimized</span>
            </div>
          </div>
          <MetricComparison 
            current="84.2%" 
            previous="81.5%" 
            trend="up" 
            label="Health Index"
          />
        </div>
      </section>

      {/* Policies Table - Identical to Live */}
      <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Insured Policy Portfolio</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead>
              <tr className="border-b border-black/5 bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Policy ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Carrier</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Coverage Line</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Premium Volume</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Expiration Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Health Score</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {clientPolicies.map((policy) => {
                const daysUntil = calculateDaysUntilExpiration(policy.expirationDate);
                return (
                  <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <button
                        onClick={() => router.push(`/demo/policy/${policy.id}`)}
                        className="font-bold text-on-surface hover:text-primary transition-colors text-base tracking-tight"
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
                    <td className="px-6 py-5 text-sm font-medium text-on-surface/60">{policy.policyType}</td>
                    <td className="px-6 py-5">
                      <span className="font-black text-lg text-on-surface tracking-tighter">${policy.premium.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskColor(daysUntil)}`}>
                        {daysUntil > 0 ? `${daysUntil} Days Out` : 'Terminated'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shadow-sm ${getHealthColor(policy.healthScore).split(' ').slice(1).join(' ')}`} />
                        <span className="text-[10px] font-bold text-on-surface/60 uppercase tracking-widest">{policy.healthScore} Health Score</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditPolicy(policy)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-black/5 text-on-surface/40 hover:text-primary hover:bg-white hover:shadow-sm transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletePolicyId(policy.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50/30 border border-red-100/50 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
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
        </div>
      </div>

      {/* Demo Badge */}
      <div className="fixed bottom-8 left-8 z-50">
        <div className="px-4 py-2 bg-white/80 backdrop-blur-md border border-black/5 rounded-full shadow-xl">
          <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em]">Live Demo Environment</span>
        </div>
      </div>

      {/* Modals - Simplified for Demo */}
      {isEditing && (
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Update Insured Identity" maxWidth="md">
          <div className="space-y-6 p-4">
            <input 
              value={editForm.name} 
              onChange={e => setEditForm({...editForm, name: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-black/10 rounded-xl font-bold"
              placeholder="Name"
            />
            <button onClick={handleEditClient} className="w-full py-4 bg-primary text-white font-black rounded-xl uppercase tracking-widest">Save Changes</button>
          </div>
        </Modal>
      )}

      {isDeleting && (
        <Modal isOpen={isDeleting} onClose={() => setIsDeleting(false)} title="Confirm Removal" maxWidth="sm">
          <div className="p-4 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="font-bold">Are you sure you want to delete this client?</p>
            <button onClick={handleDeleteClient} className="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest">Delete Forever</button>
          </div>
        </Modal>
      )}

      {/* Success Toast Mock */}
      {success && (
        <div className="fixed bottom-24 right-8 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl animate-in slide-in-from-right duration-300 flex items-center gap-3">
          <Check className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">{success}</span>
        </div>
      )}
    </div>
  );
}
