"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { ImportCSVModal } from "@/components/modals/ImportCSVModal";

interface OnboardingPanelProps {
  agencyId: string;
}

export function OnboardingPanel({ agencyId }: OnboardingPanelProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-8 font-body">
        {/* Icon */}
        <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mb-8 border border-secondary/10">
          <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            command_center
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-on-surface mb-4 tracking-tight">
          Initialize Agency Command Center
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-on-surface/60 max-w-xl mb-12 leading-relaxed">
          Provision your Book of Business to identify active retention risks and authorize automated forensic analysis.
        </p>

        {/* Action Button */}
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="px-10 py-4 bg-secondary text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-3 text-sm uppercase tracking-widest active:scale-[0.98]"
        >
          <Upload className="w-5 h-5" />
          Provision Book CSV
        </button>

        {/* Helper Text */}
        <p className="text-[10px] font-bold text-on-surface/20 mt-10 max-w-md uppercase tracking-widest leading-loose">
          Import your policy data from carrier portals to activate the Agency Command infrastructure.
        </p>
      </div>

      {/* Import Modal */}
      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        agencyId={agencyId}
        onImportComplete={() => window.location.reload()}
      />
    </>
  );
}
