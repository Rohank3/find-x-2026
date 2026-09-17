"use client";

import React from "react";
import { FileText, ExternalLink, Download, AlertTriangle } from "lucide-react";
import { isValidSafeUrl } from "@/lib/utils";

interface PdfViewerProps {
  pdfUrl: string;
  title?: string;
}

export default function PdfViewer({ pdfUrl, title = "Document" }: PdfViewerProps) {
  const isSafe = isValidSafeUrl(pdfUrl);

  if (!isSafe) {
    return (
      <div className="relative border border-rose-500/30 bg-black/90 p-4 my-4 font-mono text-xs text-rose-400 flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
        <span>Document preview unavailable: asset URL failed security verification.</span>
      </div>
    );
  }
  return (
    <div className="relative border border-white/20 bg-black my-4 font-mono">
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white/60" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white/60" />

      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/90">
        <div className="flex items-center space-x-2 min-w-0 pr-2">
          <FileText className="h-4 w-4 shrink-0 text-white/70" />
          <span className="text-xs tracking-wide text-white/80 font-bold truncate">{title}</span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[36px] flex items-center justify-center space-x-1 text-xs text-white/60 hover:text-white transition px-2.5 py-1.5 border border-white/10 hover:border-white/30"
          >
            <span>Open</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={pdfUrl}
            download
            className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 text-white/60 hover:text-white transition border border-white/10 hover:border-white/30"
            title="Download Document"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="bg-black p-2 min-h-[320px] sm:min-h-[440px]">
        <iframe
          src={`${pdfUrl}#toolbar=0`}
          title={title}
          sandbox="allow-scripts"
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-[320px] sm:h-[440px] border border-white/10 bg-black"
        />
      </div>
    </div>
  );
}
