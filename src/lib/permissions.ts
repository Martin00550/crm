export type UserRole = 'owner' | 'admin' | 'csr' | 'producer';

export type Permission =
  // Dashboard
  | 'view_dashboard'
  | 'view_analytics'
  // Clients
  | 'view_clients'
  | 'create_clients'
  | 'edit_clients'
  | 'delete_clients'
  | 'export_clients'
  // Policies
  | 'view_policies'
  | 'create_policies'
  | 'edit_policies'
  | 'delete_policies'
  | 'view_policy_details'
  // Renewals
  | 'view_renewals'
  | 'manage_renewals'
  | 'send_renewal_notifications'
  // Documents
  | 'view_documents'
  | 'upload_documents'
  | 'delete_documents'
  // Team
  | 'view_team'
  | 'invite_team_members'
  | 'edit_team_members'
  | 'remove_team_members'
  | 'manage_permissions'
  // Billing
  | 'view_billing'
  | 'manage_subscription'
  | 'view_invoices'
  // Settings
  | 'view_settings'
  | 'edit_agency_profile'
  | 'manage_white_label'
  | 'manage_integrations'
  // Risk
  | 'view_risk_analysis'
  | 'run_risk_reports'
  // Portal
  | 'manage_client_portal'
  // Email Campaigns
  | 'view_email_campaigns'
  | 'create_email_campaigns'
  | 'send_email_campaigns';

// Comprehensive permission matrix
const PERMISSION_MATRIX: Record<UserRole, Permission[]> = {
  owner: [
    // Dashboard
    'view_dashboard', 'view_analytics',
    // Clients
    'view_clients', 'create_clients', 'edit_clients', 'delete_clients', 'export_clients',
    // Policies
    'view_policies', 'create_policies', 'edit_policies', 'delete_policies', 'view_policy_details',
    // Renewals
    'view_renewals', 'manage_renewals', 'send_renewal_notifications',
    // Documents
    'view_documents', 'upload_documents', 'delete_documents',
    // Team
    'view_team', 'invite_team_members', 'edit_team_members', 'remove_team_members', 'manage_permissions',
    // Billing
    'view_billing', 'manage_subscription', 'view_invoices',
    // Settings
    'view_settings', 'edit_agency_profile', 'manage_white_label', 'manage_integrations',
    // Risk
    'view_risk_analysis', 'run_risk_reports',
    // Portal
    'manage_client_portal',
    // Email Campaigns
    'view_email_campaigns', 'create_email_campaigns', 'send_email_campaigns',
  ],
  admin: [
    // Dashboard
    'view_dashboard', 'view_analytics',
    // Clients
    'view_clients', 'create_clients', 'edit_clients', 'delete_clients', 'export_clients',
    // Policies
    'view_policies', 'create_policies', 'edit_policies', 'view_policy_details',
    // Renewals
    'view_renewals', 'manage_renewals', 'send_renewal_notifications',
    // Documents
    'view_documents', 'upload_documents', 'delete_documents',
    // Team
    'view_team', 'invite_team_members', 'edit_team_members',
    // Billing
    'view_billing',
    // Settings
    'view_settings', 'edit_agency_profile',
    // Risk
    'view_risk_analysis', 'run_risk_reports',
    // Email Campaigns
    'view_email_campaigns', 'create_email_campaigns', 'send_email_campaigns',
  ],
  csr: [
    // Dashboard
    'view_dashboard',
    // Clients
    'view_clients', 'edit_clients',
    // Policies
    'view_policies', 'view_policy_details',
    // Renewals
    'view_renewals',
    // Documents
    'view_documents', 'upload_documents',
    // Settings
    'view_settings',
  ],
  producer: [
    // Dashboard
    'view_dashboard',
    // Clients
    'view_clients', 'create_clients', 'edit_clients',
    // Policies
    'view_policies', 'create_policies', 'edit_policies', 'view_policy_details',
    // Renewals
    'view_renewals', 'manage_renewals', 'send_renewal_notifications',
    // Documents
    'view_documents', 'upload_documents',
    // Email Campaigns
    'view_email_campaigns',
  ],
};

// Check if user has permission for an action
export function hasPermission(role: UserRole, action: Permission): boolean {
  if (role === 'owner') return true;
  
  const userPermissions = PERMISSION_MATRIX[role] || [];
  return userPermissions.includes(action);
}

// Check if user has any of the specified permissions
export function hasAnyPermission(role: UserRole, actions: Permission[]): boolean {
  if (role === 'owner') return true;
  
  const userPermissions = PERMISSION_MATRIX[role] || [];
  return actions.some(action => userPermissions.includes(action));
}

// Check if user has all of the specified permissions
export function hasAllPermissions(role: UserRole, actions: Permission[]): boolean {
  if (role === 'owner') return true;
  
  const userPermissions = PERMISSION_MATRIX[role] || [];
  return actions.every(action => userPermissions.includes(action));
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return PERMISSION_MATRIX[role] || [];
}

// Permission groups for UI organization
export const PERMISSION_GROUPS = {
  dashboard: {
    name: 'Dashboard',
    permissions: ['view_dashboard', 'view_analytics'] as Permission[],
  },
  clients: {
    name: 'Clients',
    permissions: ['view_clients', 'create_clients', 'edit_clients', 'delete_clients', 'export_clients'] as Permission[],
  },
  policies: {
    name: 'Policies',
    permissions: ['view_policies', 'create_policies', 'edit_policies', 'delete_policies', 'view_policy_details'] as Permission[],
  },
  renewals: {
    name: 'Renewals',
    permissions: ['view_renewals', 'manage_renewals', 'send_renewal_notifications'] as Permission[],
  },
  documents: {
    name: 'Documents',
    permissions: ['view_documents', 'upload_documents', 'delete_documents'] as Permission[],
  },
  team: {
    name: 'Team',
    permissions: ['view_team', 'invite_team_members', 'edit_team_members', 'remove_team_members', 'manage_permissions'] as Permission[],
  },
  billing: {
    name: 'Billing',
    permissions: ['view_billing', 'manage_subscription', 'view_invoices'] as Permission[],
  },
  settings: {
    name: 'Settings',
    permissions: ['view_settings', 'edit_agency_profile', 'manage_white_label', 'manage_integrations'] as Permission[],
  },
  risk: {
    name: 'Risk Analysis',
    permissions: ['view_risk_analysis', 'run_risk_reports'] as Permission[],
  },
  portal: {
    name: 'Client Portal',
    permissions: ['manage_client_portal'] as Permission[],
  },
  email_campaigns: {
    name: 'Email Campaigns',
    permissions: ['view_email_campaigns', 'create_email_campaigns', 'send_email_campaigns'] as Permission[],
  },
};
