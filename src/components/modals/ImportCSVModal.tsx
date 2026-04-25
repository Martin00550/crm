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
      });

      const data = await response.json();
      setResult(data);

      if (data.success && data.imported > 0) {
        onImportComplete?.();
      }
    } catch (error) {
      console.error("Import error:", error);
      setResult({ success: false, errors: [{ clientName: "Unknown", error: "Import failed" }] });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Authorize Bulk Intelligence Import" maxWidth="lg">
      <div className="space-y-6 font-body">
        {/* Header Description */}
        <div className="bg-slate-50/50 p-5 rounded-[20px] border border-black/5 shadow-inner">
          <p className="text-xs font-medium text-on-surface/70 leading-relaxed italic">
            Synchronize your external Book of Business assets via CSV dispatch. Ensure all legal entity identities and placement maturity dates are verified.
          </p>
        </div>

        {/* Template Download */}
        <div className="p-5 bg-surface rounded-[20px] border border-black/5 shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 transition-transform group-hover:scale-110">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-black text-on-surface uppercase tracking-widest">Protocol CSV Template</p>
                <p className="text-[9px] font-bold text-on-surface/40 mt-0.5 uppercase tracking-widest italic">Includes required intelligence vectors</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-black/10 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-black/5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Protocol
            </button>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all duration-300 group ${
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
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center transition-all duration-300 shadow-sm border border-black/5 ${
              file ? "bg-secondary text-white shadow-secondary/20" : "bg-white group-hover:scale-110"
            }`}>
              {file ? <CheckCircle className="w-8 h-8" /> : <Upload className="w-8 h-8 text-on-surface/20 group-hover:text-primary transition-colors" />}
            </div>
            
            <div className="space-y-1">
              <p className="text-base font-black text-on-surface italic font-headline tracking-tight">
                {file ? file.name : "Authorize Intelligence Payload"}
              </p>
              <p className="text-[9px] font-black text-on-surface/40 uppercase tracking-[0.2em]">
                {file ? `${(file.size / 1024).toFixed(1)} KB Authenticated` : "Drop CSV from carrier portal or click to browse"}
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-6 py-2.5 bg-white border border-black/10 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-black/5 transition-all shadow-sm"
              disabled={isUploading}
            >
              {file ? "Replace Dispatch" : "Select Payload"}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
            {result.success && (
              <div className="p-6 bg-secondary/5 rounded-[24px] border border-secondary/10 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-md">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <p className="font-black text-secondary uppercase tracking-[0.2em]">Intelligence Sync Complete</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest">Authorized Assets</p>
                    <p className="text-3xl font-black text-on-surface font-headline italic tracking-tighter">{result.imported}</p>
                  </div>
                  {result.failed && result.failed > 0 && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-red-600/30 uppercase tracking-widest">Failed Protocols</p>
                      <p className="text-3xl font-black text-red-600 font-headline italic tracking-tighter">{result.failed}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error/Warning containers would follow same rounded-2xl pattern with italic text */}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-6 pt-6 border-t border-black/5">
          <button
            onClick={handleClose}
            className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest hover:text-on-surface transition-all pb-1 border-b border-transparent hover:border-on-surface/20"
          >
            {result?.success ? "Decommission Interface" : "Abort Deployment"}
          </button>
          {!result?.success && (
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-12 py-4 bg-primary text-white font-black rounded-full hover:shadow-2xl hover:shadow-primary/30 transition-all text-xs uppercase tracking-[0.2em] active:scale-[0.98] disabled:opacity-50 flex items-center gap-3"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing Intelligence...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Authorize Dispatch
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
