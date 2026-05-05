/**
 * Server Actions Barrel File
 * Re-exports actions from modularized files for backward compatibility
 * @deprecated Move imports to specific files (e.g., @/actions/policies)
 */

export * from './agency';
export * from './policies';
export * from './clients';
export * from './financials';

// Single actions that haven't been moved yet (if any)
export async function toggleMockData(agencyId: string, enabled: boolean) {
  return { success: false, error: 'Mock data mode is only available in demo' };
}
