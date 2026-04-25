"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { ImportCSVModal } from "@/components/modals/ImportCSVModal";

interface ImportCSVButtonProps {
  agencyId: string;
  onImportComplete?: () => void;
}

export function ImportCSVButton({ agencyId, onImportComplete }: ImportCSVButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-secondary rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
      >
        <Upload className="w-3.5 h-3.5" />
        Provision Registry
      </button>
      <ImportCSVModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agencyId={agencyId}
        onImportComplete={onImportComplete}
      />
    </>
  );
}
