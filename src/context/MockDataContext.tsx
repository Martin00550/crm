"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// Types matching database schema
export interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

export interface Policy {
  id: string;
  clientId: string;
  clientName: string;
  policyNumber: string;
  carrier: string;
  policyType: string;
  premium: number;
  currentTermPremium: number;
  previousTermPremium?: number;
  effectiveDate: Date;
  expirationDate: Date;
  status: "active" | "expired" | "cancelled";
  healthScore: number;
  healthStatus: "healthy" | "warning" | "at-risk";
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  industry?: string;
  totalPolicies: number;
  totalPremium: number;
  healthStatus: "healthy" | "warning" | "at-risk";
  createdAt: Date;
  updatedAt: Date;
}

interface MockDataContextType {
  clients: Client[];
  policies: Policy[];
  addClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addPolicy: (policy: Omit<Policy, "id" | "createdAt" | "updatedAt">) => void;
  updatePolicy: (id: string, updates: Partial<Policy>) => void;
  deletePolicy: (id: string) => void;
  addNote: (policyId: string, content: string) => void;
  getClientPolicies: (clientId: string) => Policy[];
  getRenewalsByDays: (days: 30 | 60 | 90) => Policy[];
  getTotalPremium: () => number;
  getAtRiskCount: () => number;
  resetData: () => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

// Sample data generators
const generateId = () => Math.random().toString(36).substring(2, 15);

const now = new Date();

// High-value enterprise clients - impressive portfolio
const initialClients: Client[] = [
  { id: "1", name: "Meridian Real Estate Holdings", email: "insurance@meridianre.com", phone: "(212) 555-0100", industry: "Real Estate", totalPolicies: 8, totalPremium: 2850000, healthStatus: "healthy", createdAt: now, updatedAt: now },
  { id: "2", name: "Apex Manufacturing Group", email: "risk@apex-mfg.com", phone: "(312) 555-0200", industry: "Manufacturing", totalPolicies: 12, totalPremium: 4200000, healthStatus: "at-risk", createdAt: now, updatedAt: now },
  { id: "3", name: "Summit Healthcare Systems", email: "coverage@summit-health.com", phone: "(713) 555-0300", industry: "Healthcare", totalPolicies: 6, totalPremium: 1950000, healthStatus: "warning", createdAt: now, updatedAt: now },
  { id: "4", name: "Coastal Logistics & Transport", email: "operations@coastallogistics.com", phone: "(305) 555-0400", industry: "Transportation", totalPolicies: 15, totalPremium: 3100000, healthStatus: "healthy", createdAt: now, updatedAt: now },
  { id: "5", name: "Velocity Tech Ventures", email: "legal@velocitytech.io", phone: "(415) 555-0500", industry: "Technology", totalPolicies: 4, totalPremium: 1650000, healthStatus: "at-risk", createdAt: now, updatedAt: now },
  { id: "6", name: "Heritage Construction Corp", email: "safety@heritagebuilds.com", phone: "(602) 555-0600", industry: "Construction", totalPolicies: 9, totalPremium: 2400000, healthStatus: "healthy", createdAt: now, updatedAt: now },
  { id: "7", name: "Atlas Energy Solutions", email: "risk@atlasenergy.com", phone: "(713) 555-0700", industry: "Energy", totalPolicies: 7, totalPremium: 3800000, healthStatus: "warning", createdAt: now, updatedAt: now },
  { id: "8", name: "Sterling Financial Advisors", email: "compliance@sterlingfa.com", phone: "(212) 555-0800", industry: "Finance", totalPolicies: 5, totalPremium: 1450000, healthStatus: "healthy", createdAt: now, updatedAt: now },
];

// High-value policies with premiums ranging from $200K to $850K
const initialPolicies: Policy[] = [
  // Meridian Real Estate - High value property portfolio
  { id: "p1", clientId: "1", clientName: "Meridian Real Estate Holdings", policyNumber: "MER-2024-001", carrier: "AIG", policyType: "Commercial Property", premium: 485000, currentTermPremium: 485000, previousTermPremium: 450000, effectiveDate: new Date(now.getTime() - 120 * 86400000), expirationDate: new Date(now.getTime() + 22 * 86400000), status: "active", healthScore: 45, healthStatus: "at-risk", notes: [], createdAt: now, updatedAt: now },
  { id: "p2", clientId: "1", clientName: "Meridian Real Estate Holdings", policyNumber: "MER-2024-002", carrier: "Chubb", policyType: "General Liability", premium: 320000, currentTermPremium: 320000, previousTermPremium: 295000, effectiveDate: new Date(now.getTime() - 90 * 86400000), expirationDate: new Date(now.getTime() + 95 * 86400000), status: "active", healthScore: 88, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  { id: "p3", clientId: "1", clientName: "Meridian Real Estate Holdings", policyNumber: "MER-2024-003", carrier: "Travelers", policyType: "Umbrella", premium: 185000, currentTermPremium: 185000, previousTermPremium: 175000, effectiveDate: new Date(now.getTime() - 180 * 86400000), expirationDate: new Date(now.getTime() + 150 * 86400000), status: "active", healthScore: 92, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  
  // Apex Manufacturing - Multiple high-value policies
  { id: "p4", clientId: "2", clientName: "Apex Manufacturing Group", policyNumber: "APEX-2024-101", carrier: "Liberty Mutual", policyType: "Commercial Auto", premium: 425000, currentTermPremium: 425000, previousTermPremium: 380000, effectiveDate: new Date(now.getTime() - 200 * 86400000), expirationDate: new Date(now.getTime() + 18 * 86400000), status: "active", healthScore: 35, healthStatus: "at-risk", notes: [], createdAt: now, updatedAt: now },
  { id: "p5", clientId: "2", clientName: "Apex Manufacturing Group", policyNumber: "APEX-2024-102", carrier: "Zurich", policyType: "Workers Compensation", premium: 680000, currentTermPremium: 680000, previousTermPremium: 620000, effectiveDate: new Date(now.getTime() - 60 * 86400000), expirationDate: new Date(now.getTime() + 75 * 86400000), status: "active", healthScore: 72, healthStatus: "warning", notes: [], createdAt: now, updatedAt: now },
  { id: "p6", clientId: "2", clientName: "Apex Manufacturing Group", policyNumber: "APEX-2024-103", carrier: "Chubb", policyType: "Product Liability", premium: 520000, currentTermPremium: 520000, previousTermPremium: 485000, effectiveDate: new Date(now.getTime() - 150 * 86400000), expirationDate: new Date(now.getTime() + 40 * 86400000), status: "active", healthScore: 55, healthStatus: "warning", notes: [], createdAt: now, updatedAt: now },
  { id: "p7", clientId: "2", clientName: "Apex Manufacturing Group", policyNumber: "APEX-2024-104", carrier: "CNA", policyType: "Equipment Breakdown", premium: 295000, currentTermPremium: 295000, previousTermPremium: 275000, effectiveDate: new Date(now.getTime() - 100 * 86400000), expirationDate: new Date(now.getTime() + 110 * 86400000), status: "active", healthScore: 85, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  
  // Summit Healthcare - Critical coverage
  { id: "p8", clientId: "3", clientName: "Summit Healthcare Systems", policyNumber: "SUM-2024-201", carrier: "The Hartford", policyType: "Medical Malpractice", premium: 750000, currentTermPremium: 750000, previousTermPremium: 680000, effectiveDate: new Date(now.getTime() - 240 * 86400000), expirationDate: new Date(now.getTime() + 12 * 86400000), status: "active", healthScore: 28, healthStatus: "at-risk", notes: [], createdAt: now, updatedAt: now },
  { id: "p9", clientId: "3", clientName: "Summit Healthcare Systems", policyNumber: "SUM-2024-202", carrier: "Beazley", policyType: "Cyber Liability", premium: 285000, currentTermPremium: 285000, previousTermPremium: 220000, effectiveDate: new Date(now.getTime() - 180 * 86400000), expirationDate: new Date(now.getTime() + 130 * 86400000), status: "active", healthScore: 78, healthStatus: "warning", notes: [], createdAt: now, updatedAt: now },
  { id: "p10", clientId: "3", clientName: "Summit Healthcare Systems", policyNumber: "SUM-2024-203", carrier: "Hiscox", policyType: "Directors & Officers", premium: 420000, currentTermPremium: 420000, previousTermPremium: 395000, effectiveDate: new Date(now.getTime() - 300 * 86400000), expirationDate: new Date(now.getTime() + 55 * 86400000), status: "active", healthScore: 65, healthStatus: "warning", notes: [], createdAt: now, updatedAt: now },
  
  // Coastal Logistics - Fleet coverage
  { id: "p11", clientId: "4", clientName: "Coastal Logistics & Transport", policyNumber: "CLT-2024-301", carrier: "Progressive Commercial", policyType: "Fleet Auto", premium: 520000, currentTermPremium: 520000, previousTermPremium: 485000, effectiveDate: new Date(now.getTime() - 90 * 86400000), expirationDate: new Date(now.getTime() + 85 * 86400000), status: "active", healthScore: 82, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  { id: "p12", clientId: "4", clientName: "Coastal Logistics & Transport", policyNumber: "CLT-2024-302", carrier: "Berkshire Hathaway", policyType: "Cargo Insurance", premium: 380000, currentTermPremium: 380000, previousTermPremium: 350000, effectiveDate: new Date(now.getTime() - 60 * 86400000), expirationDate: new Date(now.getTime() + 100 * 86400000), status: "active", healthScore: 90, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  { id: "p13", clientId: "4", clientName: "Coastal Logistics & Transport", policyNumber: "CLT-2024-303", carrier: "Travelers", policyType: "Warehouse Liability", premium: 245000, currentTermPremium: 245000, previousTermPremium: 230000, effectiveDate: new Date(now.getTime() - 200 * 86400000), expirationDate: new Date(now.getTime() + 25 * 86400000), status: "active", healthScore: 42, healthStatus: "at-risk", notes: [], createdAt: now, updatedAt: now },
  
  // Velocity Tech - Tech coverage
  { id: "p14", clientId: "5", clientName: "Velocity Tech Ventures", policyNumber: "VEL-2024-401", carrier: "Chubb", policyType: "Technology E&O", premium: 650000, currentTermPremium: 650000, previousTermPremium: 520000, effectiveDate: new Date(now.getTime() - 120 * 86400000), expirationDate: new Date(now.getTime() + 8 * 86400000), status: "active", healthScore: 25, healthStatus: "at-risk", notes: [], createdAt: now, updatedAt: now },
  { id: "p15", clientId: "5", clientName: "Velocity Tech Ventures", policyNumber: "VEL-2024-402", carrier: "Coalition", policyType: "Cyber Insurance", premium: 385000, currentTermPremium: 385000, previousTermPremium: 295000, effectiveDate: new Date(now.getTime() - 180 * 86400000), expirationDate: new Date(now.getTime() + 35 * 86400000), status: "active", healthScore: 48, healthStatus: "at-risk", notes: [], createdAt: now, updatedAt: now },
  { id: "p16", clientId: "5", clientName: "Velocity Tech Ventures", policyNumber: "VEL-2024-403", carrier: "AXA XL", policyType: "Intellectual Property", premium: 280000, currentTermPremium: 280000, previousTermPremium: 265000, effectiveDate: new Date(now.getTime() - 300 * 86400000), expirationDate: new Date(now.getTime() + 165 * 86400000), status: "active", healthScore: 88, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  
  // Heritage Construction - Builder coverage
  { id: "p17", clientId: "6", clientName: "Heritage Construction Corp", policyNumber: "HCC-2024-501", carrier: "Liberty Mutual", policyType: "General Liability", premium: 495000, currentTermPremium: 495000, previousTermPremium: 450000, effectiveDate: new Date(now.getTime() - 90 * 86400000), expirationDate: new Date(now.getTime() + 90 * 86400000), status: "active", healthScore: 86, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  { id: "p18", clientId: "6", clientName: "Heritage Construction Corp", policyNumber: "HCC-2024-502", carrier: "The Hartford", policyType: "Builders Risk", premium: 380000, currentTermPremium: 380000, previousTermPremium: 365000, effectiveDate: new Date(now.getTime() - 60 * 86400000), expirationDate: new Date(now.getTime() + 120 * 86400000), status: "active", healthScore: 92, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  { id: "p19", clientId: "6", clientName: "Heritage Construction Corp", policyNumber: "HCC-2024-503", carrier: "Zurich", policyType: "Commercial Auto", premium: 310000, currentTermPremium: 310000, previousTermPremium: 295000, effectiveDate: new Date(now.getTime() - 180 * 86400000), expirationDate: new Date(now.getTime() + 45 * 86400000), status: "active", healthScore: 58, healthStatus: "warning", notes: [], createdAt: now, updatedAt: now },
  { id: "p20", clientId: "6", clientName: "Heritage Construction Corp", policyNumber: "HCC-2024-504", carrier: "CNA", policyType: "Workers Compensation", premium: 420000, currentTermPremium: 420000, previousTermPremium: 395000, effectiveDate: new Date(now.getTime() - 200 * 86400000), expirationDate: new Date(now.getTime() + 55 * 86400000), status: "active", healthScore: 75, healthStatus: "warning", notes: [], createdAt: now, updatedAt: now },
  
  // Atlas Energy - High risk, high premium
  { id: "p21", clientId: "7", clientName: "Atlas Energy Solutions", policyNumber: "AES-2024-601", carrier: "AIG", policyType: "Environmental Liability", premium: 850000, currentTermPremium: 850000, previousTermPremium: 780000, effectiveDate: new Date(now.getTime() - 240 * 86400000), expirationDate: new Date(now.getTime() + 15 * 86400000), status: "active", healthScore: 32, healthStatus: "at-risk", notes: [], createdAt: now, updatedAt: now },
  { id: "p22", clientId: "7", clientName: "Atlas Energy Solutions", policyNumber: "AES-2024-602", carrier: "Beazley", policyType: "Pollution Liability", premium: 620000, currentTermPremium: 620000, previousTermPremium: 580000, effectiveDate: new Date(now.getTime() - 180 * 86400000), expirationDate: new Date(now.getTime() + 70 * 86400000), status: "active", healthScore: 68, healthStatus: "warning", notes: [], createdAt: now, updatedAt: now },
  { id: "p23", clientId: "7", clientName: "Atlas Energy Solutions", policyNumber: "AES-2024-603", carrier: "Chubb", policyType: "Property & Equipment", premium: 465000, currentTermPremium: 465000, previousTermPremium: 435000, effectiveDate: new Date(now.getTime() - 120 * 86400000), expirationDate: new Date(now.getTime() + 105 * 86400000), status: "active", healthScore: 85, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  
  // Sterling Financial - Professional coverage
  { id: "p24", clientId: "8", clientName: "Sterling Financial Advisors", policyNumber: "SFA-2024-701", carrier: "Chubb", policyType: "Professional E&O", premium: 385000, currentTermPremium: 385000, previousTermPremium: 350000, effectiveDate: new Date(now.getTime() - 90 * 86400000), expirationDate: new Date(now.getTime() + 80 * 86400000), status: "active", healthScore: 90, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  { id: "p25", clientId: "8", clientName: "Sterling Financial Advisors", policyNumber: "SFA-2024-702", carrier: "Hiscox", policyType: "Cyber & Privacy", premium: 220000, currentTermPremium: 220000, previousTermPremium: 195000, effectiveDate: new Date(now.getTime() - 180 * 86400000), expirationDate: new Date(now.getTime() + 50 * 86400000), status: "active", healthScore: 72, healthStatus: "warning", notes: [], createdAt: now, updatedAt: now },
  { id: "p26", clientId: "8", clientName: "Sterling Financial Advisors", policyNumber: "SFA-2024-703", carrier: "Beazley", policyType: "Fiduciary Liability", premium: 315000, currentTermPremium: 315000, previousTermPremium: 295000, effectiveDate: new Date(now.getTime() - 300 * 86400000), expirationDate: new Date(now.getTime() + 140 * 86400000), status: "active", healthScore: 88, healthStatus: "healthy", notes: [], createdAt: now, updatedAt: now },
  { id: "p27", clientId: "8", clientName: "Sterling Financial Advisors", policyNumber: "SFA-2024-704", carrier: "AIG", policyType: "Directors & Officers", premium: 425000, currentTermPremium: 425000, previousTermPremium: 395000, effectiveDate: new Date(now.getTime() - 150 * 86400000), expirationDate: new Date(now.getTime() + 30 * 86400000), status: "active", healthScore: 45, healthStatus: "at-risk", notes: [], createdAt: now, updatedAt: now },
];

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies);

  const addClient = useCallback((client: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
    const newClient: Client = {
      ...client,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setClients((prev) => [...prev, newClient]);
  }, []);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id ? { ...client, ...updates, updatedAt: new Date() } : client
      )
    );
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
    // Also delete associated policies
    setPolicies((prev) => prev.filter((policy) => policy.clientId !== id));
  }, []);

  const addPolicy = useCallback((policy: Omit<Policy, "id" | "createdAt" | "updatedAt">) => {
    const newPolicy: Policy = {
      ...policy,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPolicies((prev) => {
      const updated = [...prev, newPolicy];
      // Update client totals using the updated policies list
      const clientPolicies = updated.filter((p) => p.clientId === policy.clientId);
      const totalPremium = clientPolicies.reduce((sum, p) => sum + p.premium, 0);
      updateClient(policy.clientId, {
        totalPolicies: clientPolicies.length,
        totalPremium,
      });
      return updated;
    });
  }, [updateClient]);

  const updatePolicy = useCallback((id: string, updates: Partial<Policy>) => {
    setPolicies((prev) =>
      prev.map((policy) =>
        policy.id === id ? { ...policy, ...updates, updatedAt: new Date() } : policy
      )
    );
  }, []);

  const deletePolicy = useCallback((id: string) => {
    setPolicies((prev) => prev.filter((policy) => policy.id !== id));
  }, []);

  const addNote = useCallback((policyId: string, content: string) => {
    const newNote: Note = {
      id: generateId(),
      content,
      createdAt: new Date(),
    };
    setPolicies((prev) =>
      prev.map((policy) =>
        policy.id === policyId
          ? { ...policy, notes: [...policy.notes, newNote], updatedAt: new Date() }
          : policy
      )
    );
  }, []);

  const getClientPolicies = useCallback((clientId: string) => {
    return policies.filter((policy) => policy.clientId === clientId);
  }, [policies]);

  const getRenewalsByDays = useCallback((days: 30 | 60 | 90) => {
    const currentDate = new Date();
    const cutoff = new Date(currentDate.getTime() + days * 86400000);
    return policies.filter((policy) => {
      const expDate = new Date(policy.expirationDate);
      const daysUntilExpiration = Math.ceil((expDate.getTime() - currentDate.getTime()) / 86400000);
      return daysUntilExpiration <= days && daysUntilExpiration > 0 && policy.status === "active";
    }).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
  }, [policies]);

  const getTotalPremium = useCallback(() => {
    return policies.reduce((sum, policy) => sum + policy.premium, 0);
  }, [policies]);

  const getAtRiskCount = useCallback(() => {
    const currentDate = new Date();
    const thirtyDays = new Date(currentDate.getTime() + 30 * 86400000);
    return policies.filter((policy) => {
      const expDate = new Date(policy.expirationDate);
      return expDate <= thirtyDays && policy.status === "active";
    }).length;
  }, [policies]);

  const resetData = useCallback(() => {
    setClients(initialClients);
    setPolicies(initialPolicies);
  }, []);

  return (
    <MockDataContext.Provider
      value={{
        clients,
        policies,
        addClient,
        updateClient,
        deleteClient,
        addPolicy,
        updatePolicy,
        deletePolicy,
        addNote,
        getClientPolicies,
        getRenewalsByDays,
        getTotalPremium,
        getAtRiskCount,
        resetData,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error("useMockData must be used within MockDataProvider");
  }
  return context;
}
