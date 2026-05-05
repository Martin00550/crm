"use client";

import { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Upload, FileText, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  onImportComplete?: () => void;
}

export function ImportCSVModal({ isOpen, onClose, agencyId, onImportComplete }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    imported?: number;
    failed?: number;
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
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

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      setResult(data);
      // Removed immediate onImportComplete call to let user see the success metrics
    } catch (error) {
      console.error("Import error:", error);
      setResult({ success: false, errors: [{ clientName: "Unknown", error: "Import failed" }] });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    const wasSuccessful = result?.success && (result?.imported || 0) > 0;
    setFile(null);
    setResult(null);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Context & Protocol */}
          <div className="space-y-6">
            <div className="bg-slate-50/80 p-6 rounded-[24px] border border-black/5 shadow-inner">
              <p className="text-xs font-medium text-on-surface/70 leading-relaxed italic">
                Import your external Book of Business from a CSV file. Ensure all client names and policy expiration dates are correct.
              </p>
            </div>

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

            {/* Upload Status / Mini Preview */}
            {file && !result && (
              <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10 flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-on-surface uppercase tracking-widest truncate">{file.name}</p>
                  <p className="text-[9px] font-bold text-secondary uppercase tracking-widest">File Selected</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Upload Zone */}
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
              <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center transition-all duration-300 shadow-sm border border-black/5 ${
                file ? "bg-secondary text-white shadow-secondary/20 scale-110" : "bg-white group-hover:scale-110"
              }`}>
                {file ? <CheckCircle className="w-10 h-10" /> : <Upload className="w-10 h-10 text-on-surface/20 group-hover:text-primary transition-colors" />}
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-black text-on-surface italic font-headline tracking-tight">
                  {file ? "File Ready" : "Select CSV File"}
                </p>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
                  {file ? `${(file.size / 1024).toFixed(1)} KB ready to import` : "Drop CSV from your management system or click to browse"}
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-8 py-3 bg-white border border-black/10 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-black/5 transition-all shadow-sm"
                disabled={isUploading}
              >
                {file ? "Replace File" : "Select File"}
              </button>
            </div>
          </div>
        </div>

        {/* Results (Appears below the two columns) */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {result.success ? (
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
                    <p className="text-[10px] font-bold text-red-600/60 uppercase tracking-widest mt-1 italic">
                      {result.details || (typeof result.error === 'string' 
                        ? result.error 
                        : (result.error?.message || "The file could not be processed."))}
                    </p>
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
