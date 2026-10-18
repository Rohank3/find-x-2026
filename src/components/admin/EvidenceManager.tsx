"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  Volume2,
  ImageIcon,
  Film,
  ExternalLink,
  Compass,
  AlertCircle,
} from "@/components/icons";
import { isValidSafeUrl } from "@/lib/utils";

export interface StagedEvidence {
  id: string;
  title: string;
  url: string;
  type: "image" | "audio" | "pdf" | "video";
}

interface EvidenceManagerProps {
  evidenceList: StagedEvidence[];
  onChange: (newList: StagedEvidence[]) => void;
  disabled?: boolean;
}

export default function EvidenceManager({
  evidenceList,
  onChange,
  disabled = false,
}: EvidenceManagerProps) {
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual URL entry state
  const [manualUrl, setManualUrl] = useState("");
  const [manualType, setManualType] = useState<"image" | "audio" | "pdf" | "video">("image");
  const [manualTitle, setManualTitle] = useState("");

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      const defaultTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .slice(0, 50);

      const newEvidence: StagedEvidence = {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: defaultTitle,
        url: data.url,
        type: data.type as "image" | "audio" | "pdf" | "video",
      };

      onChange([...evidenceList, newEvidence]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleAddManualUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = manualUrl.trim();
    if (!cleanUrl) return;

    if (!isValidSafeUrl(cleanUrl)) {
      setUploadError("Invalid or unsafe URL. Only http://, https://, or root-relative paths are allowed.");
      return;
    }

    const newEvidence: StagedEvidence = {
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: manualTitle.trim() || `Evidence #${evidenceList.length + 1}`,
      url: cleanUrl,
      type: manualType,
    };

    onChange([...evidenceList, newEvidence]);
    setManualUrl("");
    setManualTitle("");
    setUploadError(null);
  };

  const handleRemove = (index: number) => {
    const updated = evidenceList.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMove = (index: number, direction: "UP" | "DOWN") => {
    const targetIdx = direction === "UP" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= evidenceList.length) return;

    const updated = [...evidenceList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onChange(updated);
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = evidenceList.map((item, i) =>
      i === index ? { ...item, title: newTitle } : item
    );
    onChange(updated);
  };

  const handleTypeChange = (
    index: number,
    newType: "image" | "audio" | "pdf" | "video"
  ) => {
    const updated = evidenceList.map((item, i) =>
      i === index ? { ...item, type: newType } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3.5 bg-[#140d07] border border-amber-500/30 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
        <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center space-x-1.5">
          <FileText className="h-3.5 w-3.5 text-amber-400" />
          <span>Attached Evidence Dossier</span>
        </span>
        <span className="text-[10px] text-amber-200/60 font-mono">
          {evidenceList.length} evidence file{evidenceList.length === 1 ? "" : "s"} attached
        </span>
      </div>

      {/* List of Attached Evidence */}
      {evidenceList.length > 0 ? (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {evidenceList.map((item, idx) => {
            const isAudio = item.type === "audio";
            const isPdf = item.type === "pdf";
            const isVideo = item.type === "video";

            return (
              <div
                key={item.id}
                className="p-2.5 rounded-lg border border-amber-500/25 bg-[#100a05] text-xs flex flex-col gap-2 transition-colors hover:border-amber-500/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                      {idx + 1}
                    </span>

                    {/* Type icon & selector */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isAudio ? (
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      ) : isPdf ? (
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                      ) : isVideo ? (
                        <Film className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <select
                        value={item.type}
                        onChange={(e) =>
                          handleTypeChange(
                            idx,
                            e.target.value as "image" | "audio" | "pdf" | "video"
                          )
                        }
                        disabled={disabled}
                        className="bg-[#180e07] border border-amber-500/30 rounded px-1.5 py-0.5 text-[10px] text-amber-200 font-mono focus:outline-none"
                      >
                        <option value="image">Image</option>
                        <option value="audio">Audio</option>
                        <option value="pdf">PDF</option>
                        <option value="video">Video</option>
                      </select>
                    </div>

                    {/* Title input */}
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleTitleChange(idx, e.target.value)}
                      placeholder="Evidence Title / Caption"
                      disabled={disabled}
                      className="bg-[#180e07] border border-amber-500/30 rounded px-2 py-1 text-xs text-amber-100 font-sans focus:outline-none focus:ring-1 focus:ring-amber-400 flex-1 min-w-0 placeholder:text-amber-200/30"
                    />
                  </div>

                  {/* Actions: Reorder & Remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "UP")}
                      disabled={disabled || idx === 0}
                      className="p-1 rounded text-amber-300/70 hover:text-amber-100 hover:bg-[#201209] disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "DOWN")}
                      disabled={disabled || idx === evidenceList.length - 1}
                      className="p-1 rounded text-amber-300/70 hover:text-amber-100 hover:bg-[#201209] disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      disabled={disabled}
                      className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 cursor-pointer"
                      title="Delete Evidence"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* URL preview badge & Storage Provider Tag */}
                <div className="flex items-center justify-between text-[10px] font-mono text-amber-200/50 pl-7 gap-2">
                  <div className="flex items-center gap-1.5 truncate flex-1">
                    {item.url.includes("supabase.co") ? (
                      <span className="px-1.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded text-[9px] font-bold shrink-0">
                        Supabase S3
                      </span>
                    ) : item.url.startsWith("/api/media/") ? (
                      <span className="px-1.5 py-0.5 bg-amber-950/80 text-amber-400 border border-amber-500/40 rounded text-[9px] font-bold shrink-0">
                        Postgres DB
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-sky-950/80 text-sky-400 border border-sky-500/40 rounded text-[9px] font-bold shrink-0">
                        External CDN
                      </span>
                    )}
                    <span className="truncate" title={item.url}>
                      {item.url}
                    </span>
                  </div>
                  {isValidSafeUrl(item.url) && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-amber-400/80 hover:text-amber-200 cursor-pointer hover:underline shrink-0"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>Inspect</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 text-center text-xs font-mono text-amber-200/40 border border-amber-500/15 rounded-lg bg-[#100a05]">
          No evidence items attached. You can upload media files or attach external URLs below.
        </div>
      )}

      {/* Upload or Link Toggle */}
      <div className="pt-2 border-t border-amber-500/20">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-[10px] uppercase font-mono font-bold text-amber-300/80">
            Add New Evidence:
          </span>
          <div className="flex rounded-lg bg-[#100a05] p-0.5 border border-amber-500/30 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                uploadMode === "file"
                  ? "bg-amber-500 text-black font-bold"
                  : "text-amber-300/60 hover:text-amber-200"
              }`}
            >
              Direct Upload
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                uploadMode === "url"
                  ? "bg-amber-500 text-black font-bold"
                  : "text-amber-300/60 hover:text-amber-200"
              }`}
            >
              External Link
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mb-2.5 p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Direct Upload Dropzone */}
        {uploadMode === "file" ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-amber-400 bg-amber-500/10 scale-[1.01]"
                : "border-amber-500/30 hover:border-amber-500/60 bg-[#100a05]/70"
            } ${disabled || isUploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.mp3,.wav,.ogg,.m4a,.mp4,.webm"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                <Compass className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-xs font-mono text-amber-300">
                  Uploading &amp; sanitizing evidence file...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-1 py-1">
                <Upload className="w-5 h-5 text-amber-400/80 mb-0.5" />
                <span className="text-xs font-mono text-amber-200 font-bold">
                  Click to browse or drag &amp; drop evidence file
                </span>
                <span className="text-[10px] font-mono text-amber-200/50">
                  PDF documents, audio recordings (MP3/WAV/OGG), photos (JPG/PNG/WebP), or video
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Manual External Link Form */
          <div className="space-y-2.5 p-3 rounded-xl bg-[#100a05] border border-amber-500/25">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-mono text-amber-300/80 block mb-0.5">
                  Artifact URL
                </label>
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#180e07] border border-amber-500/30 rounded-lg p-2 text-xs text-amber-100 font-code focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-amber-200/30"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-amber-300/80 block mb-0.5">
                  Type
                </label>
                <select
                  value={manualType}
                  onChange={(e) =>
                    setManualType(e.target.value as "image" | "audio" | "pdf" | "video")
                  }
                  className="w-full bg-[#180e07] border border-amber-500/30 rounded-lg p-2 text-xs text-amber-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Optional Label (e.g. Wiretap Audio #1)"
                className="flex-1 bg-[#180e07] border border-amber-500/30 rounded-lg p-2 text-xs text-amber-100 font-sans focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-amber-200/30"
              />
              <button
                type="button"
                onClick={handleAddManualUrl}
                disabled={!manualUrl.trim() || disabled}
                className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
