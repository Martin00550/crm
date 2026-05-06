export const mockClients = [
  { id: "1", name: "Meridian Real Estate Holdings", email: "insurance@meridianre.com", phone: "(212) 555-0100", industry: "Real Estate", totalPolicies: 3, totalPremium: 990000, healthStatus: "healthy" },
  { id: "2", name: "Apex Manufacturing Group", email: "risk@apex-mfg.com", phone: "(312) 555-0200", industry: "Manufacturing", totalPolicies: 4, totalPremium: 1920000, healthStatus: "at-risk" },
  { id: "3", name: "Summit Healthcare Systems", email: "coverage@summit-health.com", phone: "(713) 555-0300", industry: "Healthcare", totalPolicies: 3, totalPremium: 1455000, healthStatus: "warning" },
  { id: "4", name: "Coastal Logistics & Transport", email: "operations@coastallogistics.com", phone: "(305) 555-0400", industry: "Transportation", totalPolicies: 3, totalPremium: 1145000, healthStatus: "healthy" },
  { id: "5", name: "Velocity Tech Ventures", email: "legal@velocitytech.io", phone: "(415) 555-0500", industry: "Technology", totalPolicies: 3, totalPremium: 1315000, healthStatus: "at-risk" },
  { id: "6", name: "Heritage Construction Corp", email: "safety@heritagebuilds.com", phone: "(602) 555-0600", industry: "Construction", totalPolicies: 4, totalPremium: 1605000, healthStatus: "healthy" },
  { id: "7", name: "Atlas Energy Solutions", email: "risk@atlasenergy.com", phone: "(713) 555-0700", industry: "Energy", totalPolicies: 3, totalPremium: 1935000, healthStatus: "warning" },
  { id: "8", name: "Sterling Financial Advisors", email: "compliance@sterlingfa.com", phone: "(212) 555-0800", industry: "Finance", totalPolicies: 4, totalPremium: 1345000, healthStatus: "healthy" },
];

const now = new Date();

export const mockPolicies = [
  { id: "p1", clientId: "1", clientName: "Meridian Real Estate Holdings", policyNumber: "MER-2024-001", carrier: "AIG", policyType: "Commercial Property", premium: 485000, expirationDate: new Date(now.getTime() + 22 * 86400000), status: "active", healthScore: 45, healthStatus: "at-risk" },
  { id: "p2", clientId: "1", clientName: "Meridian Real Estate Holdings", policyNumber: "MER-2024-002", carrier: "Chubb", policyType: "General Liability", premium: 320000, expirationDate: new Date(now.getTime() + 95 * 86400000), status: "active", healthScore: 88, healthStatus: "healthy" },
  { id: "p3", clientId: "1", clientName: "Meridian Real Estate Holdings", policyNumber: "MER-2024-003", carrier: "Travelers", policyType: "Umbrella", premium: 185000, expirationDate: new Date(now.getTime() + 150 * 86400000), status: "active", healthScore: 92, healthStatus: "healthy" },
  { id: "p4", clientId: "2", clientName: "Apex Manufacturing Group", policyNumber: "APEX-2024-101", carrier: "Liberty Mutual", policyType: "Commercial Auto", premium: 425000, expirationDate: new Date(now.getTime() + 18 * 86400000), status: "active", healthScore: 35, healthStatus: "at-risk" },
  { id: "p5", clientId: "2", clientName: "Apex Manufacturing Group", policyNumber: "APEX-2024-102", carrier: "Zurich", policyType: "Workers Compensation", premium: 680000, expirationDate: new Date(now.getTime() + 75 * 86400000), status: "active", healthScore: 72, healthStatus: "warning" },
  { id: "p8", clientId: "3", clientName: "Summit Healthcare Systems", policyNumber: "SUM-2024-201", carrier: "The Hartford", policyType: "Medical Malpractice", premium: 750000, expirationDate: new Date(now.getTime() + 12 * 86400000), status: "active", healthScore: 28, healthStatus: "at-risk" },
  { id: "p14", clientId: "5", clientName: "Velocity Tech Ventures", policyNumber: "VEL-2024-401", carrier: "Chubb", policyType: "Technology E&O", premium: 650000, expirationDate: new Date(now.getTime() + 8 * 86400000), status: "active", healthScore: 25, healthStatus: "at-risk" },
  { id: "p21", clientId: "7", clientName: "Atlas Energy Solutions", policyNumber: "AES-2024-601", carrier: "AIG", policyType: "Environmental Liability", premium: 850000, expirationDate: new Date(now.getTime() + 15 * 86400000), status: "active", healthScore: 32, healthStatus: "at-risk" },
];
