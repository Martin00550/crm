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
  AlertTriangle
} from "lucide-react";
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
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
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
  };

  const handleDeleteClient = () => {
    deleteClient(clientId);
    router.push("/demo/clients");
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
  };

  const handleDeletePolicyFromList = (policyId: string) => {
    deletePolicy(policyId);
    setDeletePolicyId(null);
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
  };

  if (loading) return <div className="p-12 animate-pulse bg-slate-50 rounded-[32px] h-96"></div>;
  if (!client) return <div className="p-12 text-center text-on-surface/40 italic">Client Registry entry not found.</div>;

  const totalPremium = clientPolicies.reduce((sum, p) => sum + p.premium, 0);
  const activePoliciesCount = clientPolicies.filter(p => p.status === "active").length;

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
              <span className="text-sm font-bold text-on-surface italic leading-relaxed">{client.address || "No address on file"}</span>
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
              <span className="font-headline italic font-black text-xl text-on-surface tracking-tighter">{activePoliciesCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Total Book Volume</span>
              <span className="font-headline italic font-black text-xl text-secondary tracking-tighter">${totalPremium.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-black/5">
              <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Insured Since</span>
              <span className="text-sm font-bold text-on-surface/60">
                {new Date(client.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
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
                true 
                  ? "bg-secondary/5 text-secondary border-secondary/10 shadow-sm" 
                  : "bg-slate-100 text-on-surface/40 border-black/5"
              }`}>
                {"Active Deployment"}
              </span>
            </div>
            <button className="w-full py-4 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:shadow-xl transition-all active:scale-[0.98]">
              Authorize Provision Link
            </button>
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
              {clientPolicies.map((policy) => {
                const daysUntil = calculateDaysUntilExpiration(policy.expirationDate);
                return (
                  <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <button
                        onClick={() => router.push(`/demo/policy/${policy.id}`)}
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
                      <span className="font-headline italic font-black text-lg text-on-surface tracking-tighter">${policy.premium.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskColor(daysUntil)}`}>
                        {daysUntil > 0 ? `${daysUntil} Days Out` : "Terminated"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shadow-sm ${getHealthColor(policy.healthScore).split(" ").slice(1).join(" ")}`} />
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
          {clientPolicies.length === 0 && (
            <div className="p-12 text-center bg-white">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <FileText className="w-8 h-8 text-on-surface/10" />
              </div>
              <p className="text-sm font-black text-on-surface/40 uppercase tracking-widest">No Active Placements Provisioned</p>
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

            <div className="flex items-center justify-end gap-6 pt-6 border-t border-black/5">
              <button onClick={() => setIsEditing(false)} className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Abort</button>
              <button onClick={handleEditClient} className="px-10 py-4 bg-primary text-white font-black rounded-full text-xs uppercase tracking-[0.2em]">Commit Identity Updates</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <Modal isOpen={isDeleting} onClose={() => setIsDeleting(false)} title="Authorize Asset Decommission" maxWidth="sm">
          <div className="space-y-8 p-2 text-center">
            <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
            <p className="text-sm font-medium italic">Confirm total decommission of <span className="font-bold">{client.name}</span>.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteClient} className="w-full py-4 bg-red-600 text-white font-black rounded-full uppercase tracking-widest text-xs">Confirm Total Purge</button>
              <button onClick={() => setIsDeleting(false)} className="w-full py-4 bg-slate-50 border border-black/10 text-on-surface/60 font-black rounded-full uppercase tracking-widest text-xs">Abort</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Policy Modal */}
      {isAddingPolicy && (
        <Modal isOpen={isAddingPolicy} onClose={() => setIsAddingPolicy(false)} title="Authorize New Placement" maxWidth="lg">
          <div className="space-y-8 p-2">
             <div className="bg-slate-50/50 p-8 rounded-[32px] border border-black/5 shadow-inner">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-3">Placement Identifier</label>
              <input
                type="text"
                value={newPolicyForm.policyNumber}
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, policyNumber: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-black/10 rounded-2xl font-black text-lg uppercase tracking-widest"
                placeholder="e.g. POL-001"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Carrier" 
                value={newPolicyForm.carrier} 
                onChange={e => setNewPolicyForm({...newPolicyForm, carrier: e.target.value})}
                className="px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl"
              />
              <input 
                placeholder="Type" 
                value={newPolicyForm.policyType} 
                onChange={e => setNewPolicyForm({...newPolicyForm, policyType: e.target.value})}
                className="px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl"
              />
            </div>
            <div className="flex items-center justify-end gap-6">
              <button onClick={() => setIsAddingPolicy(false)} className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Abort</button>
              <button onClick={handleAddPolicy} className="px-10 py-4 bg-primary text-white font-black rounded-full text-xs uppercase tracking-[0.2em]">Authorize Placement</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Policy Confirmation Modal */}
      {deletePolicyId && (
        <Modal isOpen={!!deletePolicyId} onClose={() => setDeletePolicyId(null)} title="Authorize Placement Termination" maxWidth="sm">
          <div className="space-y-8 p-2 text-center">
            <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
            <p className="text-sm font-medium italic">Confirm termination of policy identifier.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleDeletePolicyFromList(deletePolicyId)} className="w-full py-4 bg-red-600 text-white font-black rounded-full uppercase tracking-widest text-xs">Confirm Termination</button>
              <button onClick={() => setDeletePolicyId(null)} className="w-full py-4 bg-slate-50 text-on-surface/60 font-black rounded-full uppercase tracking-widest text-xs">Abort</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Policy Modal */}
      {editPolicyId && (
        <Modal isOpen={!!editPolicyId} onClose={() => setEditPolicyId(null)} title="Update Placement Forensics" maxWidth="lg">
          <div className="space-y-8 p-2">
            <div className="bg-slate-50/50 p-8 rounded-[32px] border border-black/5 shadow-inner">
              <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-3">Placement Identifier</label>
              <input 
                value={editPolicyForm.policyNumber} 
                onChange={e => setEditPolicyForm({...editPolicyForm, policyNumber: e.target.value})}
                className="w-full px-5 py-4 bg-white border border-black/10 rounded-2xl font-black text-lg uppercase tracking-widest"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Carrier" 
                value={editPolicyForm.carrier} 
                onChange={e => setEditPolicyForm({...editPolicyForm, carrier: e.target.value})}
                className="px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl"
              />
              <input 
                placeholder="Type" 
                value={editPolicyForm.policyType} 
                onChange={e => setEditPolicyForm({...editPolicyForm, policyType: e.target.value})}
                className="px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Premium" 
                type="number"
                value={editPolicyForm.premium} 
                onChange={e => setEditPolicyForm({...editPolicyForm, premium: e.target.value})}
                className="px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl"
              />
              <input 
                placeholder="Health Score" 
                type="number"
                value={editPolicyForm.healthScore} 
                onChange={e => setEditPolicyForm({...editPolicyForm, healthScore: parseInt(e.target.value) || 0})}
                className="px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="date"
                value={editPolicyForm.effectiveDate} 
                onChange={e => setEditPolicyForm({...editPolicyForm, effectiveDate: e.target.value})}
                className="px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl"
              />
              <input 
                type="date"
                value={editPolicyForm.expirationDate} 
                onChange={e => setEditPolicyForm({...editPolicyForm, expirationDate: e.target.value})}
                className="px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl"
              />
            </div>
            <div className="relative">
              <select
                value={editPolicyForm.status}
                onChange={e => setEditPolicyForm({...editPolicyForm, status: e.target.value as any})}
                className="w-full px-4 py-3 bg-slate-50/50 border border-black/10 rounded-xl text-sm font-bold text-on-surface appearance-none cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface/20">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-6">
              <button onClick={() => setEditPolicyId(null)} className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Abort</button>
              <button onClick={handleEditPolicySubmit} className="px-10 py-4 bg-secondary text-white font-black rounded-full text-xs uppercase tracking-[0.2em]">Commit Updates</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
