"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: "csv" | "excel") => void;
  dataType: "clients" | "policies" | "renewals";
}

export function ExportModal({ isOpen, onClose, onExport, dataType }: ExportModalProps) {
  const [format, setFormat] = useState<"csv" | "excel">("csv");

  const handleExport = () => {
    onExport(format);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Export ${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Ledger Registry`} maxWidth="sm">
      <div className="space-y-8 font-body p-2">
        <div className="bg-slate-50/50 p-6 rounded-[24px] border border-black/5 shadow-inner">
          <p className="text-sm font-medium text-on-surface/70 leading-relaxed italic">
            Select the policy protocol for your executive portfolio records. Authorized exports utilize 256-bit encryption.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => setFormat("csv")}
            className={`flex flex-col items-center gap-4 p-8 border rounded-[32px] transition-all duration-300 group ${
              format === "csv"
                ? "border-secondary bg-secondary/5 shadow-inner"
                : "border-black/5 hover:border-primary/20 bg-surface hover:shadow-md"
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${format === "csv" ? "bg-secondary text-white shadow-lg rotate-3" : "bg-slate-50 text-on-surface/20 group-hover:bg-primary/5 group-hover:text-primary"}`}>
              <FileText className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] block ${format === "csv" ? "text-secondary" : "text-on-surface/40"}`}>CSV Protocol</span>
              <span className="text-[8px] font-bold text-on-surface/20 uppercase tracking-widest mt-1 block">Standard Registry</span>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => setFormat("excel")}
            className={`flex flex-col items-center gap-4 p-8 border rounded-[32px] transition-all duration-300 group ${
              format === "excel"
                ? "border-secondary bg-secondary/5 shadow-inner"
                : "border-black/5 hover:border-primary/20 bg-surface hover:shadow-md"
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${format === "excel" ? "bg-secondary text-white shadow-lg -rotate-3" : "bg-slate-50 text-on-surface/20 group-hover:bg-primary/5 group-hover:text-primary"}`}>
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] block ${format === "excel" ? "text-secondary" : "text-on-surface/40"}`}>Excel Analysis</span>
              <span className="text-[8px] font-bold text-on-surface/20 uppercase tracking-widest mt-1 block">Advanced Matrix</span>
            </div>
          </button>
        </div>
        
        <div className="flex items-center justify-end gap-6 pt-6 border-t border-black/5">
          <button
            onClick={onClose}
            className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest hover:text-on-surface transition-all pb-1 border-b border-transparent hover:border-on-surface/20"
          >
            Abort Export
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-3 px-10 py-4 bg-primary text-white font-black rounded-full hover:shadow-2xl hover:shadow-primary/30 transition-all text-xs uppercase tracking-[0.2em] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Authorize {format.toUpperCase()} Dispatch
          </button>
        </div>
      </div>
    </Modal>
  );
}
