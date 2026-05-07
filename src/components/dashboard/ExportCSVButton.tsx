"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface ExportDataButtonProps {
  agencyId: string;
  dataType: "clients" | "policies" | "all";
  disabled?: boolean;
}

export function ExportDataButton({ agencyId, dataType, disabled }: ExportDataButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export?agencyId=${agencyId}&dataType=${dataType}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `export-${dataType}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || disabled}
      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface/40 bg-surface border border-black/10 rounded-xl hover:text-on-surface hover:bg-black/5 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-secondary" />
          Syncing Assets...
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5" />
          Export Registry
        </>
      )}
    </button>
  );
}
