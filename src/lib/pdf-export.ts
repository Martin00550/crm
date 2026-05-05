import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';

export interface PDFExportData {
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  fileName?: string;
}

export function exportToPDF({ title, subtitle, headers, data, fileName = 'report' }: PDFExportData) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 30);
  }
  
  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, subtitle ? 40 : 35);
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: subtitle ? 50 : 45,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });
  
  // Save the PDF
  doc.save(`${fileName}-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportAnalyticsToPDF(stats: any, data: any[], fileName: string = 'analytics-report') {
  const headers = ['Metric', 'Value', 'Change', 'Status'];
  const tableData = [
    ['Total Book of Business', `$${stats.totalBookOfBusiness?.toLocaleString() || '0'}`, '+12.5%', 'Positive'],
    ['Total Policies', stats.totalPolicies?.toString() || '0', '+8.1%', 'Positive'],
    ['Renewals at Risk', stats.renewalsAtRisk?.count?.toString() || '0', '-3.2%', 'Attention'],
    ['Active Clients', stats.activeClients?.toString() || '0', '+5.3%', 'Positive'],
  ];
  
  exportToPDF({
    title: 'Portfolio Analytics Report',
    subtitle: 'RetainVault Agency Command Center',
    headers,
    data: tableData,
    fileName,
  });
}

export function exportPolicyLedgerToPDF(ledger: any[], fileName: string = 'policy-ledger') {
  if (ledger.length === 0) {
    toast.error('No data to export');
    return;
  }
  
  const headers = ['Insured Entity', 'Carrier', 'Policy Type', 'Premium', 'Expiration', 'Days Until Renewal'];
  const data = ledger.map((policy: any) => [
    policy.clientName || 'Unknown',
    policy.carrier || 'Unknown',
    policy.policyType || 'Unknown',
    typeof policy.premium === 'number' ? `$${policy.premium.toLocaleString()}` : policy.premium,
    policy.expirationDate || 'N/A',
    policy.daysUntilRenewal?.toString() || 'N/A',
  ]);
  
  exportToPDF({
    title: 'Policy Ledger Report',
    subtitle: `Total Policies: ${ledger.length}`,
    headers,
    data,
    fileName,
  });
}
