"use client";

import { AlertCircle, Download, ExternalLink, FileText } from "@/components/icons";
import { isValidSafeUrl } from "@/lib/utils";

interface SecurePdfViewerProps {
  src: string;
}

export default function SecurePdfViewer({ src }: SecurePdfViewerProps) {
  const isSafe = typeof src === "string" && isValidSafeUrl(src);

  if (!isSafe) {
    return (
      <div className="flex flex-col items-center justify-center w-full p-8 border-2 border-red-300 rounded-xl bg-red-100 text-red-800">
        <AlertCircle className="w-12 h-12 mb-3 text-red-700" />
        <p className="font-bold text-sm font-sans">Invalid or unsafe manuscript source.</p>
      </div>
    );
  }

  const pdfUrl = `${src}#toolbar=0`;

  return (
    <div className="flex flex-col w-full overflow-hidden border-2 border-[#2a1810] rounded-xl bg-[#140a04] shadow-inner">
      <div className="flex items-center justify-between p-2.5 sm:p-3 border-b-2 border-[#2a1810] bg-[#201209]">
        <div className="flex items-center space-x-2 text-amber-300">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider font-sans">Admiralty Manuscript</span>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-1.5 space-x-1 text-xs text-amber-300 hover:text-amber-100 hover:bg-[#381e10] rounded-lg transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-sans">Open</span>
          </a>
          <a
            href={src}
            download
            className="flex items-center p-1.5 space-x-1 text-xs text-amber-300 hover:text-amber-100 hover:bg-[#381e10] rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-sans">Save</span>
          </a>
        </div>
      </div>
      <div className="w-full h-[480px] bg-white relative">
        <iframe
          src={pdfUrl}
          className="w-full h-full border-none"
          sandbox="allow-downloads allow-popups"
          title="Secure PDF Viewer"
        />
      </div>
    </div>
  );
}
