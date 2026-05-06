'use client';

import { useState, useEffect } from 'react';
import { UserPlus, MoreVertical, Trash2, Edit, Shield, Users, Clock, Mail, X, Check, Settings } from 'lucide-react';
import { UserRole, Permission, PERMISSION_GROUPS, hasPermission, getRolePermissions } from '@/lib/permissions';
import { Invitation } from '@/lib/team-access';

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
}

interface TeamManagementProps {
  agencyId: string;
  tier: string;
  isDemo?: boolean;
}

export function TeamManagement({ agencyId, tier, isDemo = false }: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [canAdd, setCanAdd] = useState<{ allowed: boolean; reason?: string; currentCount?: number; limit?: number }>({ allowed: false });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadTeamMembers();
    loadInvitations();
  }, [agencyId]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  async function loadTeamMembers() {
    try {
      if (isDemo) {
        setMembers([
          { id: '1', name: 'John Smith', email: 'john@agency.com', role: 'owner' as any, createdAt: new Date() },
          { id: '2', name: 'Sarah Jones', email: 'sarah@agency.com', role: 'producer' as any, createdAt: new Date() },
        ]);
        setCanAdd({ allowed: true, currentCount: 2, limit: 3 });
        return;
      }
      const res = await fetch(`/api/team?agencyId=${agencyId}`);
      const data = await res.json();
      setMembers(data.members || []);
      setCanAdd(data.canAdd || { allowed: false });
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  }

  async function loadInvitations() {
    try {
      if (isDemo) {
        setInvitations([
          { id: '3', email: 'michael@agency.com', name: 'Michael Chen', role: 'csr' as any, sentAt: new Date(), expiresAt: new Date(Date.now() + 86400000 * 7), agencyId: 'demo' }
        ]);
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/invitations?status=pending`);
      const data = await res.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      owner: 'bg-black text-white border-black',
      admin: 'bg-slate-100 text-slate-700 border-black/5',
      csr: 'bg-secondary/10 text-secondary border-secondary/20',
      producer: 'bg-secondary/10 text-secondary border-secondary/20',
    };
    return (
      <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${styles[role]}`}>
        {role === 'csr' ? 'CSR' : role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDeleteMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      if (isDemo) {
        showToast('Demo member removed (Ephemeral)');
        setShowDeleteModal(false);
        return;
      }
      const res = await fetch(`/api/team/${selectedMember.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      setShowDeleteModal(false);
      setSelectedMember(null);
      loadTeamMembers();
      showToast('Team member removed successfully');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleCancelInvitation = async (invitation: Invitation) => {
    try {
      const res = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel invitation');
      }

      loadInvitations();
      showToast('Invitation cancelled');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      const res = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend invitation');
      }

      showToast('Invitation resent successfully!');
      loadInvitations();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getDaysUntilExpiration = (expiresAt: Date | string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded w-1/4" />
          <div className="h-16 bg-slate-100 rounded" />
          <div className="h-16 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden font-body">
      {/* Header */}
      <div className="px-6 py-5 border-b border-black/5 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-on-surface italic font-headline flex items-center gap-2 tracking-tight">
              <Users className="w-5 h-5 text-secondary" />
              Agency Command Team
            </h3>
            <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mt-1">
              {canAdd.currentCount !== undefined && canAdd.limit !== undefined
                ? `${canAdd.currentCount} of ${canAdd.limit === Infinity ? '∞' : canAdd.limit} active seats`
                : 'Manage your agency personnel'}
            </p>
          </div>
          
          {tier !== 'solo' && (
            <button
              onClick={() => canAdd.allowed ? setShowInviteModal(true) : null}
              disabled={!canAdd.allowed}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 transition-all ${
                canAdd.allowed
                  ? 'bg-black text-white hover:bg-secondary transition-colors shadow-sm'
                  : 'bg-slate-100 text-on-surface/20 cursor-not-allowed'
              }`}
              title={!canAdd.allowed ? canAdd.reason : undefined}
            >
              <UserPlus className="w-4 h-4" />
              Invite Personnel
            </button>
          )}
        </div>
      </div>

      {/* Solo Tier Notice */}
      {tier === 'solo' && (
        <div className="px-6 py-16 text-center bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="w-20 h-20 bg-background rounded-3xl flex items-center justify-center mx-auto mb-6 border border-black/5">
            <Shield className="w-10 h-10 text-secondary" />
          </div>
          <h3 className="text-2xl font-black text-on-surface italic font-headline mb-2 tracking-tight">Standard Solo Protocol</h3>
          <p className="text-sm text-on-surface/50 font-medium max-w-md mx-auto mb-8 italic">
            Your current deployment is optimized for elite solo operations. Mobilize a collaborative team by upgrading your command level.
          </p>
          <button className="px-10 py-4 bg-secondary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-full hover:shadow-2xl transition-all">
            Upgrade to Agency Command
          </button>
        </div>
      )}

      {/* Team List */}
      {tier !== 'solo' && (
        <div className="divide-y divide-slate-100">
          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="px-6 py-6 bg-amber-50/30 border-b border-amber-100">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-amber-600" />
                <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em]">Pending Deployment</h4>
                <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-700 rounded-full">
                  {invitations.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">
                          {invitation.name || invitation.email}
                        </p>
                        <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest mt-0.5">
                          {invitation.role === 'owner' ? 'Owner' : invitation.role === 'admin' ? 'Admin' : 'Agent'} Protocol
                        </p>
                        <p className="text-[10px] font-bold text-amber-600 mt-1 italic">
                          Dispatched {formatDate(invitation.sentAt)} • {getDaysUntilExpiration(invitation.expiresAt)} until expiry
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleResendInvitation(invitation)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title="Resend invitation"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCancelInvitation(invitation)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Cancel invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Team Members */}
          {members.map((member) => (
            <div key={member.id} className="px-6 py-6 flex items-center justify-between hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-slate-800 flex items-center justify-center text-white font-headline italic font-black text-lg shadow-md transition-transform group-hover:scale-105">
                  {member.name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-on-surface font-headline italic text-lg tracking-tight leading-none">{member.name || 'Unnamed Personnel'}</p>
                    {getRoleBadge(member.role)}
                  </div>
                  <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] mt-2">{member.email}</p>
                </div>
              </div>

              {member.role !== 'owner' && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEditMember(member)}
                    className="p-2.5 text-on-surface/20 hover:text-secondary hover:bg-secondary/5 rounded-xl transition-all"
                    title="Edit Role"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setShowPermissionsModal(true);
                      setSelectedMember(member);
                    }}
                    className="p-2.5 text-on-surface/20 hover:text-secondary hover:bg-secondary/5 rounded-xl transition-all"
                    title="Manage Permissions"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteMember(member)}
                    className="p-2.5 text-on-surface/20 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove Personnel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {members.length === 0 && invitations.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No team members yet</p>
            </div>
          )}
        </div>
      )}

      {/* Usage Warning */}
      {tier !== 'solo' && !canAdd.allowed && canAdd.reason && (
        <div className="px-6 py-4 bg-amber-50 border-t border-amber-200">
          <p className="text-sm text-amber-700 font-medium">{canAdd.reason}</p>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          agencyId={agencyId}
          onClose={() => {
            setShowInviteModal(false);
            loadTeamMembers();
          }}
        />
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedMember && (
        <EditRoleModal
          member={selectedMember}
          agencyId={agencyId}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMember(null);
            loadTeamMembers();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <DeleteMemberModal
          member={selectedMember}
          onConfirm={handleRemoveMember}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedMember && (
        <PermissionsModal
          member={selectedMember}
          agencyId={agencyId}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom">
          <div className={`px-4 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InviteMemberModal({ agencyId, onClose }: { agencyId: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('producer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tier, setTier] = useState<string>('');

  // Fetch agency tier on mount
  useEffect(() => {
    const fetchTier = async () => {
      try {
        const res = await fetch('/api/agency/user-agency');
        const data = await res.json();
        if (data.success) {
          setTier(data.agencyTier || 'solo');
        }
      } catch (err) {
        console.error('Failed to fetch agency tier:', err);
      }
    };
    fetchTier();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create invitation via our new invitation system
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, email, name, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Invite Team Member</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="colleague@agency.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="producer">Producer (Sales Agent)</option>
              <option value="csr">CSR (Customer Service)</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Enterprise: All seats free notice */}
          {tier === 'enterprise' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-green-600 text-xl flex-shrink-0">check_circle</span>
                <div>
                  <p className="text-sm font-bold text-green-900">All Seats Included Free</p>
                  <p className="text-xs text-green-700 mt-1">
                    Enterprise includes unlimited team members at no additional cost.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRoleModal({ 
  member, 
  agencyId, 
  onClose 
}: { 
  member: TeamMember; 
  agencyId: string; 
  onClose: () => void; 
}) {
  const [role, setRole] = useState<UserRole>(member.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Team Member Role</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Member</label>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-900">{member.name || 'Unnamed'}</p>
              <p className="text-sm text-slate-500">{member.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="producer">Producer (Sales Agent)</option>
              <option value="csr">CSR (Customer Service)</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermissionsModal({ 
  member, 
  agencyId, 
  onClose 
}: { 
  member: TeamMember; 
  agencyId: string; 
  onClose: () => void; 
}) {
  const [customPermissions, setCustomPermissions] = useState<Permission[]>(getRolePermissions(member.role));
  const [loading, setLoading] = useState(false);

  const handleTogglePermission = (permission: Permission) => {
    if (customPermissions.includes(permission)) {
      setCustomPermissions(customPermissions.filter(p => p !== permission));
    } else {
      setCustomPermissions([...customPermissions, permission]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save custom permissions to database
      const res = await fetch(`/api/team/${member.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: customPermissions }),
      });

      if (!res.ok) throw new Error('Failed to update permissions');
      onClose();
    } catch (error) {
      console.error('Failed to save permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Manage Permissions</h3>
            <p className="text-sm text-slate-500">{member.name || member.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
            <div key={groupKey} className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-secondary" />
                {group.name}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {group.permissions.map((permission) => (
                  <label
                    key={permission}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      customPermissions.includes(permission)
                        ? 'bg-secondary/5 border border-secondary/20'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      customPermissions.includes(permission)
                        ? 'bg-secondary border-secondary'
                        : 'border-slate-300'
                    }`}>
                      {customPermissions.includes(permission) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-xs text-slate-700 font-medium">
                      {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-6 border-t border-slate-200 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteMemberModal({ 
  member, 
  onConfirm, 
  onClose 
}: { 
  member: TeamMember; 
  onConfirm: () => void; 
  onClose: () => void; 
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Team Member</h3>
          
          <div className="mb-4">
            <p className="font-medium text-slate-900">{member.name || 'Unnamed'}</p>
            <p className="text-sm text-slate-500">{member.email}</p>
          </div>
          
          <p className="text-sm text-slate-600 mb-6">
            Are you sure you want to remove this team member? They will lose access to the agency dashboard.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Remove Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
