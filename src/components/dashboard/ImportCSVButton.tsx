"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { ImportCSVModal } from "@/components/modals/ImportCSVModal";
import { Button } from "@/components/ui/button";

interface ImportCSVButtonProps {
  agencyId: string;
  onImportComplete?: () => void;
  disabled?: boolean;
}

export function ImportCSVButton({ agencyId, onImportComplete, disabled }: ImportCSVButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="secondary"
        size="sm"
        leftIcon={<Upload className="w-3.5 h-3.5" />}
        disabled={disabled}
      >
        Add Entry
      </Button>
      <ImportCSVModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agencyId={agencyId}
        onImportComplete={onImportComplete}
      />
    </>
  );
}
