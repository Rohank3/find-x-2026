"use client";

import React from "react";
import { FileText, ExternalLink, Download } from "lucide-react";

interface PdfViewerProps {
  pdfUrl: string;
  title?: string;
}

export default function PdfViewer({ pdfUrl, title = "Document" }: PdfViewerProps) {
  return (
    <div className="relative border border-white/20 bg-black my-4 font-mono">
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white/60" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white/60" />

      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/90">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-white/70" />
          <span className="text-xs tracking-wide text-white/80 font-bold">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs text-white/60 hover:text-white transition px-2 py-1 border border-white/10 hover:border-white/30"
          >
            <span>Open</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={pdfUrl}
            download
            className="p-1 text-white/60 hover:text-white transition border border-white/10 hover:border-white/30"
            title="Download Document"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="bg-black p-2 min-h-[440px]">
        <iframe
          src={`${pdfUrl}#toolbar=0`}
          title={title}
          className="w-full h-[440px] border border-white/10 bg-black"
        />
      </div>
    </div>
  );
}
