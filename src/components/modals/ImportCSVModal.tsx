"use client";

import { useState, useRef } from "react";
import Papa from 'papaparse';
import { Modal } from "@/components/ui/Modal";
import { Upload, FileText, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  onImportComplete?: () => void;
}

const FIELDS_TO_MAP = [
  { key: 'clientName', label: 'Client Name', required: true, icons: ['insured', 'name', 'client', 'customer'] },
  { key: 'policyNumber', label: 'Policy Number', required: true, icons: ['polnum', 'policy', 'number'] },
  { key: 'carrier', label: 'Carrier', required: true, icons: ['carrier', 'company', 'insurance'] },
  { key: 'policyType', label: 'Policy Type', required: true, icons: ['type', 'lob', 'coverage'] },
  { key: 'premium', label: 'Premium', required: true, icons: ['premium', 'premium', 'amount', 'cost'] },
  { key: 'expirationDate', label: 'Expiration Date', required: true, icons: ['exp', 'expiration', 'renewal'] },
  { key: 'effectiveDate', label: 'Effective Date', required: false },
  { key: 'clientEmail', label: 'Client Email', required: false },
  { key: 'clientPhone', label: 'Client Phone', required: false },
  { key: 'clientIndustry', label: 'Client Industry', required: false },
  { key: 'status', label: 'Status', required: false },
];

const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const DEFAULT_MAPPINGS: Record<string, string[]> = {
  clientName: ['clientname', 'name', 'insured', 'insuredname', 'customer', 'customername'],
  policyNumber: ['policynumber', 'policyno', 'polnum', 'policyid', 'policy'],
  carrier: ['carrier', 'insurancecompany', 'company', 'insurer'],
  policyType: ['policytype', 'coveragetype', 'lob', 'lineofbusiness'],
  premium: ['premium', 'writtenpremium', 'annualpremium', 'amount'],
  expirationDate: ['expirationdate', 'renewaldate', 'expdate', 'enddate'],
  effectiveDate: ['effectivedate', 'startdate'],
  clientEmail: ['clientemail', 'email'],
  clientPhone: ['clientphone', 'phone'],
  clientIndustry: ['industry', 'clientindustry'],
  status: ['status', 'policystatus'],
};

export function ImportCSVModal({ isOpen, onClose, agencyId, onImportComplete }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isSmartMapped, setIsSmartMapped] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    processing?: boolean;
    status?: string;
    processedRows?: number;
    totalRows?: number;
    imported?: number;
    failed?: number;
    newClients?: number;
    details?: string;
    error?: any;
    importedRows?: { clientName: string; policyNumber: string }[];
    errors?: { clientName: string; error: string }[];
    invalidRows?: { clientName: string; errors: string[] }[];
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setIsSmartMapped(false);

    Papa.parse(selectedFile, {
      header: true,
      preview: 2,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        
        // Smart Mapping Logic
        const initialMapping: Record<string, string> = {};
        const normalizedHeadersMap: Record<string, string> = {};
        headers.forEach(h => {
          normalizedHeadersMap[normalizeHeader(h)] = h;
        });

        let matchesFound = 0;
        Object.entries(DEFAULT_MAPPINGS).forEach(([fieldKey, synonyms]) => {
          for (const syn of synonyms) {
            if (normalizedHeadersMap[syn]) {
              initialMapping[fieldKey] = normalizedHeadersMap[syn];
              matchesFound++;
              break;
            }
          }
        });

        // Add additional heuristics for headers that might not be in the default synonyms
        if (!initialMapping.clientName) {
          const nameHeader = headers.find(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('insured'));
          if (nameHeader) initialMapping.clientName = nameHeader;
        }
        if (!initialMapping.policyNumber) {
          const numHeader = headers.find(h => h.toLowerCase().includes('number') || h.toLowerCase().includes('pol'));
          if (numHeader) initialMapping.policyNumber = numHeader;
        }

        const finalMapping: Record<string, string> = {};
        // Convert to backend expected format: normalizedHeader -> fieldKey
        Object.entries(initialMapping).forEach(([fieldKey, originalHeader]) => {
          if (originalHeader) {
            finalMapping[normalizeHeader(originalHeader)] = fieldKey;
          }
        });

        console.log('Detected CSV Headers:', headers);
        console.log('Calculated Mapping:', finalMapping);

        setMapping(finalMapping);
        if (matchesFound >= 2) {
          setIsSmartMapped(true);
        }
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("agencyId", agencyId);
      formData.append("mapping", JSON.stringify(mapping));

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      
      if (data.success && data.jobId) {
        // ENTERPRISE: Poll for background job status
        pollJobStatus(data.jobId);
      } else {
        setResult(data);
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Import error:", error);
      setResult({ success: false, error: "Import failed to start. Check your connection." });
      setIsUploading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/import/status/${jobId}`);
        if (!response.ok) throw new Error("Status check failed");
        
        const job = await response.json();

        if (job.status === 'completed') {
          setResult({
            success: true,
            imported: job.successCount,
            newClients: 0, // Simplified for now
            invalidRows: job.errorDetails,
          });
          setIsUploading(false);
          onImportComplete?.();
        } else if (job.status === 'failed') {
          setResult({
            success: false,
            error: "Background processing failed.",
            details: typeof job.errorDetails === 'string' ? job.errorDetails : "Check server logs for details.",
          });
          setIsUploading(false);
        } else {
          // Update processing state
          setResult({
            processing: true,
            status: job.status,
            processedRows: job.processedRows || 0,
            totalRows: job.totalRows || 0,
          });
          // Poll again in 2 seconds
          setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error("Polling error:", err);
        // Retry in 5 seconds
        setTimeout(poll, 5000);
      }
    };
    poll();
  };

  const handleClose = () => {
    const wasSuccessful = result?.success && (result?.imported || 0) > 0;
    setFile(null);
    setResult(null);
    setCsvHeaders([]);
    setMapping({});
    setIsSmartMapped(false);
    onClose();
    if (wasSuccessful) {
      onImportComplete?.();
    }
  };

  const downloadTemplate = () => {
    const template = `client_name,client_email,client_phone,client_industry,policy_number,carrier,policy_type,premium,effective_date,expiration_date,status
"Acme Corp","contact@acme.com","555-123-4567","Manufacturing","GLA-123456","Travelers","General Liability","15000","2024-01-01","2025-01-01","active"
"Tech Solutions","info@techsolutions.com","555-987-6543","Technology","BOP-789012","The Hartford","Business Owners Policy","8500","2024-03-15","2025-03-15","active"`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "import_template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Policies" maxWidth="3xl">
      <div className="space-y-8 font-body">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Context & Protocol */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-slate-50/80 p-6 rounded-[24px] border border-black/5 shadow-inner">
              <p className="text-xs font-medium text-on-surface/70 leading-relaxed italic">
                {file 
                  ? "Match your CSV columns to RetainVault fields. Required fields are marked with an asterisk (*)."
                  : "Import your external Book of Business from a CSV file. Ensure all client names and policy expiration dates are correct."
                }
              </p>
            </div>

            {!file && (
              <div className="p-6 bg-surface rounded-[24px] border border-black/5 shadow-sm group hover:shadow-md transition-all">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 transition-transform group-hover:scale-110">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-on-surface uppercase tracking-widest">Policy Import Template</p>
                      <p className="text-[9px] font-bold text-on-surface/40 mt-0.5 uppercase tracking-widest italic">Includes all required policy fields</p>
                    </div>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white border border-black/10 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black/5 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Template
                  </button>
                </div>
              </div>
            )}

            {file && !result && (
              <div className="space-y-4">
                <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10 flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-on-surface uppercase tracking-widest truncate">{file.name}</p>
                    <p className="text-[9px] font-bold text-secondary uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • {csvHeaders.length} Columns</p>
                  </div>
                </div>

                {isSmartMapped && (
                  <div className="space-y-3">
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3 animate-in zoom-in-95">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Smart Mapping Active</p>
                        <p className="text-[9px] font-bold text-on-surface/40 uppercase tracking-widest mt-0.5">Heuristics applied based on headers</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10 flex items-center gap-3 animate-in slide-in-from-bottom-2">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Auto-Recovery Enabled</p>
                        <p className="text-[9px] font-bold text-on-surface/40 uppercase tracking-widest mt-0.5">Fuzzy matching & date normalization active</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-white border border-black/5 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all text-on-surface/40 hover:text-on-surface"
                >
                  Replace File
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Upload Zone or Mapping UI */}
          <div className="lg:col-span-2">
            {!file ? (
              <div
                className={`h-full border-2 border-dashed rounded-[32px] p-10 text-center transition-all duration-300 group flex flex-col items-center justify-center min-h-[340px] ${
                  dragActive 
                    ? "border-secondary bg-secondary/5 shadow-inner scale-[1.01]" 
                    : "border-black/10 bg-slate-50/50 hover:bg-white hover:border-primary hover:shadow-md"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-[24px] bg-white flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-on-surface/20 group-hover:text-primary transition-colors" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-lg font-black text-on-surface italic font-headline tracking-tight">
                      Select CSV File
                    </p>
                    <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
                      Drop CSV from your management system or click to browse
                    </p>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-8 py-3 bg-white border border-black/10 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-black/5 transition-all shadow-sm"
                  >
                    Select File
                  </button>
                </div>
              </div>
            ) : !result ? (
              <div className="bg-white rounded-[32px] border border-black/5 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-on-surface uppercase tracking-widest italic">Field Mapping</p>
                  <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest italic">* Required</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FIELDS_TO_MAP.map((field) => {
                    const currentMappingNormalized = Object.entries(mapping).find(([_, target]) => target === field.key)?.[0] || "";
                    const currentHeader = csvHeaders.find(h => normalizeHeader(h) === currentMappingNormalized) || "";

                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-on-surface/60 uppercase tracking-widest ml-1">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                          value={currentHeader}
                          onChange={(e) => {
                            const header = e.target.value;
                            const newMapping = { ...mapping };
                            // Remove existing mapping for this field
                            Object.keys(newMapping).forEach(k => {
                              if (newMapping[k] === field.key) delete newMapping[k];
                            });
                            // Add new mapping
                            if (header) {
                              newMapping[normalizeHeader(header)] = field.key;
                            }
                            setMapping(newMapping);
                          }}
                          className="w-full bg-slate-50 border border-black/5 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-secondary/20 transition-all appearance-none"
                        >
                          <option value="">Ignore this field</option>
                          {csvHeaders.map((header) => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Results (Appears below the two columns) */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {result.processing ? (
              <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/20 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg animate-pulse mb-6">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <p className="font-black text-primary uppercase tracking-[0.2em] text-sm">Background Processing</p>
                <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mt-2 italic">
                  {result.status === 'processing' 
                    ? `Importing ${result.processedRows} of ${result.totalRows} rows...` 
                    : "Initializing worker..."}
                </p>
                <div className="w-full max-w-sm h-1.5 bg-primary/10 rounded-full mt-6 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${Math.round(((result.processedRows || 0) / (result.totalRows || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ) : result.success ? (
              <div className="p-8 bg-secondary/5 rounded-[32px] border border-secondary/10 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-black text-secondary uppercase tracking-[0.2em] text-sm">Import Complete</p>
                    <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mt-1 italic">Policies have been successfully imported.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest">Imported Policies</p>
                    <p className="text-4xl font-black text-on-surface font-headline italic tracking-tighter">{result.imported}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest">New Clients</p>
                    <p className="text-4xl font-black text-on-surface font-headline italic tracking-tighter">{result.newClients || 0}</p>
                  </div>
                  {result.failed && result.failed > 0 && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-[9px] font-black text-red-600/30 uppercase tracking-widest">Failed Rows</p>
                      <p className="text-4xl font-black text-red-600 font-headline italic tracking-tighter">{result.failed}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 bg-red-500/5 rounded-[32px] border border-red-500/20 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-black text-red-600 uppercase tracking-[0.2em] text-sm">Import Failed</p>
                    <div className="mt-1 space-y-1">
                      <p className="text-[10px] font-bold text-red-600/80 uppercase tracking-widest italic">
                        {result.error || "The file could not be processed."}
                      </p>
                      {result.details && (
                        <p className="text-[9px] font-medium text-red-600/60 leading-relaxed bg-red-50 p-2 rounded-lg border border-red-100">
                          {result.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {result.invalidRows && result.invalidRows.length > 0 && (
                  <div className="mt-6 bg-white rounded-2xl border border-red-500/10 p-4 max-h-32 overflow-y-auto">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-2">Errors Found:</p>
                    <ul className="space-y-2">
                      {result.invalidRows.slice(0, 5).map((r: any, i: number) => (
                        <li key={i} className="text-xs text-red-800/70">
                          <span className="font-bold">{r.clientName || 'Unknown Entity'}</span>: {r.errors.join(', ')}
                        </li>
                      ))}
                      {result.invalidRows.length > 5 && (
                        <li className="text-[10px] font-bold text-red-600/50 uppercase italic">+ {result.invalidRows.length - 5} more rows</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-8 border-t border-black/5">
          {!result?.success ? (
            <>
              <button
                onClick={handleClose}
                className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest hover:text-on-surface transition-all pb-1 border-b border-transparent hover:border-on-surface/20"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="px-16 py-5 bg-primary text-white font-black rounded-full hover:shadow-[0_20px_50px_rgba(30,64,175,0.3)] transition-all text-sm uppercase tracking-[0.2em] active:scale-[0.98] disabled:opacity-50 flex items-center gap-4"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing Policies...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Import Policies
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={handleClose}
                className="px-16 py-5 bg-secondary text-white font-black rounded-full hover:shadow-[0_20px_50px_rgba(34,197,94,0.3)] transition-all text-sm uppercase tracking-[0.2em] active:scale-[0.98] flex items-center gap-4"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
