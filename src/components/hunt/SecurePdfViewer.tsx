"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import {
  AlertCircle,
  FileText,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "@/components/icons";
import { ChevronLeft, ChevronRight, Loader2, RotateCw } from "lucide-react";
import { isValidSafeUrl } from "@/lib/utils";

interface SecurePdfViewerProps {
  src: string;
}

export default function SecurePdfViewer({ src }: SecurePdfViewerProps) {
  const isSafe = typeof src === "string" && isValidSafeUrl(src);

  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  // Clean the URL by stripping fragments (#toolbar=0, etc.)
  const cleanUrl = typeof src === "string" ? src.split("#")[0] : "";

  // 1. Initialize and Load PDF Document
  useEffect(() => {
    if (!isSafe || !cleanUrl) return;

    let isMounted = true;
    let activeDoc: PDFDocumentProxy | null = null;

    async function loadDocument() {
      setLoading(true);
      setError(null);

      try {
        // Polyfill URL.parse for browser engines that lack it
        if (
          typeof window !== "undefined" &&
          typeof URL !== "undefined" &&
          !(URL as unknown as { parse?: unknown }).parse
        ) {
          (URL as unknown as { parse: (url: string, base?: string) => URL | null }).parse = function (
            url: string,
            base?: string
          ) {
            try {
              return base ? new URL(url, base) : new URL(url);
            } catch {
              return null;
            }
          };
        }

        const pdfjsLib = await import("pdfjs-dist");

        // Prefer local worker with absolute same-origin URL
        if (typeof window !== "undefined") {
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "/assets/pdf.worker.min.mjs",
            window.location.origin
          ).href;
        }

        // Fetch PDF binary directly in main thread to bypass worker CORS and credential issues
        const targetUrl = new URL(cleanUrl, typeof window !== "undefined" ? window.location.href : undefined).href;
        const res = await fetch(targetUrl);
        if (!res.ok) {
          throw new Error(`Failed to load manuscript (HTTP ${res.status})`);
        }
        const buffer = await res.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
        });

        const doc = await loadingTask.promise;
        if (!isMounted) {
          try {
            await doc.cleanup();
            await doc.loadingTask.destroy();
          } catch {
            // Ignore teardown errors
          }
          return;
        }

        activeDoc = doc;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setZoom(1.0);
        setRotation(0);
        setLoading(false);
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("[SecurePdfViewer] Error loading document:", err);
        const errMsg =
          err instanceof Error
            ? err.message
            : "The manuscript could not be deciphered by vessel instruments.";
        setError(errMsg);
        setLoading(false);
      }
    }

    loadDocument();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Ignore cancellation on unmount
        }
      }
      if (activeDoc) {
        try {
          activeDoc.cleanup();
          activeDoc.loadingTask.destroy();
        } catch {
          // Ignore doc destruction
        }
      }
      pdfDocRef.current = null;
    };
  }, [cleanUrl, isSafe, retryKey]);

  // 2. Render Page to Canvas
  const renderCurrentPage = useCallback(async () => {
    const doc = pdfDocRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!doc || !canvas || !container) return;

    setRendering(true);

    // Cancel existing render task to avoid canvas contention
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Ignore in-flight cancel
      }
      renderTaskRef.current = null;
    }

    try {
      const page = await doc.getPage(currentPage);

      // Determine container width for responsive scaling (mobile 360px up to desktop)
      const availableWidth = Math.max(260, container.clientWidth - 40);
      const unscaledViewport = page.getViewport({ scale: 1.0, rotation });

      // Calculate base fit scale
      const fitScale = Math.min(1.4, Math.max(0.5, availableWidth / unscaledViewport.width));
      const effectiveScale = fitScale * zoom;

      const viewport = page.getViewport({ scale: effectiveScale, rotation });
      const pixelRatio = typeof window !== "undefined" ? Math.max(1, window.devicePixelRatio || 1) : 1;

      // Set canvas dimensions with Retina display scaling
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) {
        setRendering(false);
        return;
      }

      ctx.save();
      ctx.fillStyle = "#1e130c";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(pixelRatio, pixelRatio);

      const renderContext = {
        canvas: canvas,
        canvasContext: ctx,
        viewport: viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;

      await task.promise;
      ctx.restore();
      setRendering(false);
    } catch (err: unknown) {
      // Ignore normal task cancellation when user navigates pages or scales quickly
      if (
        err &&
        typeof err === "object" &&
        "name" in err &&
        (err as { name: string }).name === "RenderingCancelledException"
      ) {
        return;
      }
      console.error("[SecurePdfViewer] Page render error:", err);
      setRendering(false);
    }
  }, [currentPage, zoom, rotation]);

  useEffect(() => {
    if (!loading && !error && pdfDocRef.current) {
      renderCurrentPage();
    }
  }, [loading, error, renderCurrentPage]);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(2.5, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.6, Math.round((prev - 0.25) * 100) / 100));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
  };

  // Rotation handler
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Page handlers
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages, prev + 1));
  };

  if (!isSafe) {
    return (
      <div className="flex flex-col items-center justify-center w-full p-8 border-2 border-red-300 rounded-xl bg-red-100 text-red-800">
        <AlertCircle className="w-12 h-12 mb-3 text-red-700" />
        <p className="font-bold text-sm font-sans">Invalid or unsafe manuscript source.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full overflow-hidden border-2 border-[#382014] rounded-xl bg-[#140a04] shadow-2xl select-none">
      {/* Top Admiralty Header & Cryptic Inspection Controls (Strictly in-site, no download or new tab) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 border-b-2 border-[#2a1810] bg-[#201209]">
        {/* Left: Manuscript Title */}
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider font-sans text-amber-300">
            Admiralty Manuscript
          </span>
        </div>

        {/* Right: Inspection & Navigation Controls */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* Multi-Page Navigation Controls (if multi-page document) */}
          {numPages > 1 && (
            <div className="flex items-center space-x-1 bg-[#160c07] border border-[#b45309]/30 rounded-lg p-0.5">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || rendering}
                className="p-1 text-amber-300 hover:text-amber-100 hover:bg-[#2e190e] disabled:opacity-30 disabled:pointer-events-none rounded transition-colors cursor-pointer"
                title="Previous Manuscript Leaf"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1.5 text-[11px] font-mono font-bold text-amber-200">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages || rendering}
                className="p-1 text-amber-300 hover:text-amber-100 hover:bg-[#2e190e] disabled:opacity-30 disabled:pointer-events-none rounded transition-colors cursor-pointer"
                title="Next Manuscript Leaf"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-[#160c07] border border-[#b45309]/30 rounded-lg p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.6 || rendering || loading}
              className="p-1 text-amber-300 hover:text-amber-100 hover:bg-[#2e190e] disabled:opacity-30 disabled:pointer-events-none rounded transition-colors cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              disabled={rendering || loading}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 hover:text-amber-100 hover:bg-[#2e190e] rounded transition-colors cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 2.5 || rendering || loading}
              className="p-1 text-amber-300 hover:text-amber-100 hover:bg-[#2e190e] disabled:opacity-30 disabled:pointer-events-none rounded transition-colors cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate 90° Clockwise */}
          <button
            type="button"
            onClick={handleRotate}
            disabled={rendering || loading}
            className="p-1.5 text-amber-300 hover:text-amber-100 hover:bg-[#2e190e] bg-[#160c07] border border-[#b45309]/30 disabled:opacity-30 disabled:pointer-events-none rounded-lg transition-colors cursor-pointer"
            title="Rotate Manuscript 90°"
            aria-label="Rotate Manuscript"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Document Viewport */}
      <div
        ref={containerRef}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full min-h-[360px] sm:min-h-[480px] md:min-h-[540px] max-h-[640px] bg-[#140b06] relative overflow-auto flex items-center justify-center p-3 sm:p-6"
      >
        {/* Loading Skeleton */}
        {loading && (
          <div className="flex flex-col items-center justify-center space-y-3 p-8 text-amber-300/80">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="font-mono text-xs uppercase tracking-wider text-amber-400/90 animate-pulse">
              Deciphering Admiralty Manuscript...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-md bg-[#1d1008] border border-amber-600/40 rounded-xl space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <h4 className="font-[family-name:var(--font-pirata-one)] text-xl text-amber-200">
              Manuscript Seals Broken
            </h4>
            <p className="text-xs text-amber-300/70 font-mono leading-relaxed">
              The parchment cipher could not be deciphered. It may have decayed or been encrypted beyond recognition.
            </p>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer transition-transform active:scale-95 flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Deciphering</span>
            </button>
          </div>
        )}

        {/* PDF Canvas */}
        <canvas
          ref={canvasRef}
          className={`shadow-2xl rounded border border-[#3e2415] transition-opacity duration-200 ${
            loading || error ? "hidden" : "block"
          } ${rendering ? "opacity-60" : "opacity-100"}`}
        />

        {/* Rendering Indicator pill */}
        {rendering && !loading && !error && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/75 border border-amber-500/40 rounded-full flex items-center space-x-1.5 text-[10px] font-mono font-bold text-amber-300 pointer-events-none backdrop-blur-xs">
            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            <span>Rendering...</span>
          </div>
        )}
      </div>
    </div>
  );
}
