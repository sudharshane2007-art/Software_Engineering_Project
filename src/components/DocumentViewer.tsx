import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Eye,
  Layers,
  AlertTriangle,
  Download,
  ShieldCheck,
  Split,
} from 'lucide-react';
import type { DocumentModel } from '../types/pii';

interface DocumentViewerProps {
  document: DocumentModel;
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onUpdateEntityAction: (id: string, action: 'unredacted' | 'redacted' | 'masked' | 'ignored') => void;
  onDownloadCleaned: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  selectedEntityId,
  onSelectEntity,
  onUpdateEntityAction,
  onDownloadCleaned,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'interactive' | 'diff' | 'clean_preview'>('interactive');
  const activePage = 1;

  const currentPageData = document.pagesContent.find((p) => p.pageNumber === activePage) || document.pagesContent[0];

  // Calculate unredacted count
  const unredactedCriticalCount = document.entities.filter(
    (e) => e.category === 'critical_gov_id' && e.action === 'unredacted'
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Top Controls Toolbar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {document.fileType.toUpperCase()}
            </span>
            <span className="text-sm font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
              {document.name}
            </span>
          </div>

          <div className="hidden sm:flex items-center text-xs text-slate-400 gap-1.5 border-l border-slate-700 pl-3">
            <span>OCR Latency:</span>
            <span className="text-emerald-400 font-mono font-medium">{document.processingTimeMs}ms</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setViewMode('interactive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'interactive'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Detection</span> Overlay
          </button>

          <button
            onClick={() => setViewMode('diff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'diff'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            Before / After Diff
          </button>

          <button
            onClick={() => setViewMode('clean_preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'clean_preview'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Clean Preview
          </button>
        </div>

        {/* Zoom & Export Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-slate-300">
            <button
              onClick={() => setZoom(Math.max(75, zoom - 15))}
              className="p-1.5 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono px-2">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(140, zoom + 15))}
              className="p-1.5 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onDownloadCleaned}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Clean</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 bg-slate-100 p-6 overflow-auto min-h-[560px] flex justify-center items-start">
        {viewMode === 'diff' ? (
          /* Before / After Side-by-Side Comparison */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl">
            {/* Original Document with Exposed PII */}
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between text-xs px-1">
                <span className="font-semibold text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> ORIGINAL (PII Exposed)
                </span>
                <span className="text-slate-500">{document.entities.length} sensitive items raw</span>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-rose-200 p-6 font-mono text-xs text-slate-800 leading-relaxed min-h-[500px]">
                <div className="border-b border-slate-200 pb-3 mb-4 text-center font-bold text-slate-700">
                  {currentPageData.title}
                </div>
                <div className="space-y-2">
                  {currentPageData.lines.map((line, idx) => {
                    const entity = document.entities.find((e) => e.id === line.entityId);
                    return (
                      <div
                        key={idx}
                        className={`p-1 rounded ${
                          entity
                            ? 'bg-rose-50 border border-rose-300 font-bold text-rose-900'
                            : line.isHeader
                            ? 'font-bold text-slate-900'
                            : 'text-slate-700'
                        }`}
                      >
                        {line.text}
                        {entity && (
                          <span className="ml-2 text-[10px] bg-rose-200 text-rose-800 px-1 py-0.5 rounded font-normal uppercase">
                            Exposed {entity.type}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cleaned Document with Redaction/Masking Applied */}
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between text-xs px-1">
                <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> CLEANED COPY (DPDP Compliant)
                </span>
                <span className="text-slate-500">Ready for Safe Storage</span>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-emerald-300 p-6 font-mono text-xs text-slate-800 leading-relaxed min-h-[500px]">
                <div className="border-b border-slate-200 pb-3 mb-4 text-center font-bold text-slate-700">
                  {currentPageData.title}
                </div>
                <div className="space-y-2">
                  {currentPageData.lines.map((line, idx) => {
                    const entity = document.entities.find((e) => e.id === line.entityId);
                    if (!entity) {
                      return (
                        <div key={idx} className={line.isHeader ? 'font-bold text-slate-900' : 'text-slate-700'}>
                          {line.text}
                        </div>
                      );
                    }

                    // Render modified line
                    let renderedText = line.text;
                    let badge = '';

                    if (entity.action === 'redacted') {
                      renderedText = line.text.replace(entity.originalValue, '████████████████');
                      badge = 'Blacked Out';
                    } else if (entity.action === 'masked') {
                      renderedText = line.text.replace(entity.originalValue, entity.maskedValue);
                      badge = 'Masked';
                    } else if (entity.action === 'ignored') {
                      badge = 'Unmodified';
                    } else {
                      // default unredacted warning
                      badge = 'Pending Action';
                    }

                    return (
                      <div
                        key={idx}
                        className={`p-1 rounded transition-colors ${
                          entity.action === 'redacted'
                            ? 'bg-slate-900 text-white font-mono'
                            : entity.action === 'masked'
                            ? 'bg-blue-50 text-blue-900 border border-blue-200 font-semibold'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {renderedText}
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded uppercase font-sans font-bold bg-white/40 text-current">
                          {badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Interactive A4 Document Canvas with Live Overlays */
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-300/80 p-8 sm:p-10 relative transition-transform duration-200 select-none min-h-[700px]"
          >
            {/* Document Header Watermark & Metadata */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center font-serif font-black text-slate-800">
                  IND
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-wide text-slate-900 uppercase">
                    {currentPageData.title}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    REF-ID: {document.id.toUpperCase()} • SECURITY CLASSIFICATION: CONFIDENTIAL
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Page</span>
                <div className="text-xs font-mono font-bold text-slate-700">1 of 1</div>
              </div>
            </div>

            {/* Document Body Lines */}
            <div className="space-y-4 font-mono text-xs sm:text-[13px] text-slate-800 leading-relaxed">
              {currentPageData.lines.map((line, idx) => {
                const entity = document.entities.find((e) => e.id === line.entityId);
                const isSelected = selectedEntityId === entity?.id;

                if (!entity) {
                  return (
                    <div
                      key={idx}
                      className={`${
                        line.isHeader
                          ? 'font-bold text-slate-900 tracking-tight text-center py-1'
                          : line.isMeta
                          ? 'text-slate-400 text-center font-mono text-[10px]'
                          : 'text-slate-700 py-0.5'
                      }`}
                    >
                      {line.text}
                    </div>
                  );
                }

                // If entity is attached to this line, render interactive bounding element
                const isRedacted = entity.action === 'redacted';
                const isMasked = entity.action === 'masked';
                const isUnredacted = entity.action === 'unredacted';

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectEntity(entity.id)}
                    className={`relative p-2 rounded-lg transition-all cursor-pointer border ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 border-indigo-500 bg-indigo-50/40 shadow-md'
                        : isRedacted
                        ? 'border-slate-800 bg-slate-900 text-white'
                        : isMasked
                        ? 'border-blue-400 bg-blue-50/50'
                        : isUnredacted
                        ? 'border-rose-400 bg-rose-50/60 animate-pulse-subtle'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Floating pill badge showing detection status */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            entity.type === 'aadhaar'
                              ? 'bg-rose-600 text-white'
                              : entity.type === 'pan'
                              ? 'bg-amber-600 text-white'
                              : entity.type === 'driving_licence'
                              ? 'bg-purple-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {entity.type.replace('_', ' ')}
                        </span>

                        <span className="text-[10px] text-slate-500 font-mono">
                          Confidence: {Math.round(entity.confidence * 100)}%
                        </span>

                        {entity.isValidated && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                            {entity.validationMethod === 'verhoeff_checksum'
                              ? '✓ Verhoeff Valid'
                              : entity.validationMethod === 'pan_regex'
                              ? '✓ Income Tax Valid'
                              : '✓ Format Valid'}
                          </span>
                        )}
                      </div>

                      {/* Quick inline action toggle */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onUpdateEntityAction(entity.id, 'redacted')}
                          title="Blackout Redact"
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${
                            isRedacted
                              ? 'bg-white text-slate-900 shadow'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          Redact
                        </button>
                        <button
                          onClick={() => onUpdateEntityAction(entity.id, 'masked')}
                          title="Mask (Last 4 digits)"
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${
                            isMasked
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          Mask
                        </button>
                        <button
                          onClick={() => onUpdateEntityAction(entity.id, 'ignored')}
                          title="Leave Unchanged"
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                        >
                          Keep
                        </button>
                      </div>
                    </div>

                    {/* Content Display */}
                    <div className="font-mono text-xs sm:text-sm">
                      {isRedacted ? (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">
                            {line.text.slice(0, line.text.indexOf(entity.originalValue))}
                          </span>
                          <span className="bg-black text-amber-300 px-3 py-1 rounded font-bold tracking-widest border border-slate-700 shadow-inner">
                            ████ {entity.redactedDisplay} ████
                          </span>
                          <span className="text-slate-400">
                            {line.text.slice(line.text.indexOf(entity.originalValue) + entity.originalValue.length)}
                          </span>
                        </div>
                      ) : isMasked ? (
                        <div>
                          <span>{line.text.slice(0, line.text.indexOf(entity.originalValue))}</span>
                          <span className="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded border border-blue-300">
                            {entity.maskedValue}
                          </span>
                          <span>
                            {line.text.slice(line.text.indexOf(entity.originalValue) + entity.originalValue.length)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-rose-950 font-semibold">
                          <span>{line.text.slice(0, line.text.indexOf(entity.originalValue))}</span>
                          <span className="bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded border border-rose-400 underline decoration-rose-600 decoration-wavy">
                            {entity.originalValue}
                          </span>
                          <span>
                            {line.text.slice(line.text.indexOf(entity.originalValue) + entity.originalValue.length)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Document Seal */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified by PII Sentinel AI Detection Core</span>
              </div>
              <div className="font-mono">
                {unredactedCriticalCount > 0 ? (
                  <span className="text-rose-600 font-bold">⚠️ {unredactedCriticalCount} Critical IDs Exposed</span>
                ) : (
                  <span className="text-emerald-600 font-bold">✓ All Sensitive IDs Secured</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
