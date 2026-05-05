"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, FileText, Download, Trash2, Loader2 } from "lucide-react";

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

interface DocumentsSectionProps {
  policyId: string;
  agencyId: string;
}

export function DocumentsSection({ policyId, agencyId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents?policyId=${policyId}&agencyId=${agencyId}`);
      const data = await response.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [policyId, agencyId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "application/pdf") return "📄";
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊";
    return "📎";
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("policyId", policyId);
      formData.append("agencyId", agencyId);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.document) {
        setDocuments((prev) => [...prev, data.document]);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/documents?documentId=${documentId}&agencyId=${agencyId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface p-10 rounded-[32px] border border-black/5 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface p-10 rounded-[32px] border border-black/5 shadow-sm font-body">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-2">Policy Analysis Vault</p>
          <h3 className="text-2xl font-black text-on-surface italic font-headline tracking-tight">Policy Documentation</h3>
        </div>
        <div className="h-14 w-14 bg-primary/5 flex items-center justify-center rounded-2xl shadow-sm border border-black/5">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-[24px] p-10 text-center transition-all duration-300 group ${
          dragActive 
            ? "border-secondary bg-secondary/5 shadow-inner" 
            : "border-black/10 bg-slate-50/50 hover:bg-white hover:border-primary hover:shadow-md"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer ${isUploading ? "pointer-events-none" : ""}`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-black/5 group-hover:scale-110 transition-transform">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-secondary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-on-surface/20 group-hover:text-primary transition-colors" />
              )}
            </div>
            <div>
              <p className="text-sm font-black text-on-surface uppercase tracking-widest">
                {isUploading ? "Syncing Intelligence..." : "Authorize Document Upload"}
              </p>
              <p className="text-[10px] font-bold text-on-surface/40 mt-2 uppercase tracking-widest italic">PDF, Word, Excel, or Policy Documents</p>
            </div>
          </div>
        </label>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="mt-10 space-y-3">
          <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] mb-4">Secured Assets</p>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-5 bg-white rounded-2xl border border-black/5 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 border border-black/5 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover:bg-white transition-colors">
                  {getFileIcon(doc.fileType)}
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">{doc.fileName}</p>
                  <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mt-1">
                    {formatFileSize(doc.fileSize)} <span className="mx-1">•</span> Authorized {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-black/5 text-on-surface/40 hover:text-secondary hover:bg-white hover:shadow-sm transition-all"
                  title="Secure Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50/30 border border-red-100/50 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Decommission Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {documents.length === 0 && !isLoading && (
        <div className="mt-10 text-center py-12 bg-slate-50/50 rounded-2xl border border-black/5">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-black/5">
            <FileText className="w-8 h-8 text-on-surface/10" />
          </div>
          <p className="text-sm font-black text-on-surface/40 uppercase tracking-widest">No Intelligence Assets provisioned</p>
          <p className="text-[10px] font-bold text-on-surface/20 mt-2 uppercase tracking-widest italic">Upload policy PDFs, loss runs, or insured credentials</p>
        </div>
      )}
    </div>
  );
}
