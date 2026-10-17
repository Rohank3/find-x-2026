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

  const pdfUrl = typeof src === "string" && src.includes("#") ? src : `${src}#toolbar=0`;

  return (
    <div className="flex flex-col w-full overflow-hidden border-2 border-[#382014] rounded-xl bg-[#140a04] shadow-2xl">
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
            className="flex items-center px-3 py-2 space-x-1.5 text-xs font-semibold text-amber-200 bg-[#2e190e] border border-[#b45309]/40 hover:bg-amber-500 hover:text-amber-950 rounded-lg transition-colors cursor-pointer min-h-[36px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="font-sans">Open in Tab</span>
          </a>
          <a
            href={src}
            download
            className="flex items-center px-3 py-2 space-x-1.5 text-xs font-semibold text-amber-200 bg-[#2e190e] border border-[#b45309]/40 hover:bg-amber-500 hover:text-amber-950 rounded-lg transition-colors cursor-pointer min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-sans">Save PDF</span>
          </a>
        </div>
      </div>
      <div className="w-full h-[340px] sm:h-[480px] md:h-[520px] bg-[#1a120c] relative">
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full h-full rounded-b-xl"
        >
          <iframe
            src={pdfUrl}
            className="w-full h-full border-none rounded-b-xl"
            title="Admiralty Manuscript"
          >
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-amber-200/80 bg-[#140a04]">
              <FileText className="w-12 h-12 mb-3 text-amber-400" />
              <p className="font-bold text-base text-amber-300 mb-1">Admiralty Manuscript Dispatch</p>
              <p className="text-xs text-amber-400/60 max-w-sm mb-4">
                Inline PDF rendering is unavailable in your browser window. You can view or download the manuscript directly:
              </p>
              <div className="flex items-center space-x-3">
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow transition-transform active:scale-95 flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Manuscript</span>
                </a>
                <a
                  href={src}
                  download
                  className="px-4 py-2 bg-[#2a1810] hover:bg-[#381e10] border border-[#b45309]/50 text-amber-200 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Copy</span>
                </a>
              </div>
            </div>
          </iframe>
        </object>
      </div>
    </div>
  );
}
