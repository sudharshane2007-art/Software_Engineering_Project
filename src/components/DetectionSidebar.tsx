import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  EyeOff,
  Eye,
  SlidersHorizontal,
  Sparkles,
  Download,
  Hash,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import type { DocumentModel, RedactionAction } from '../types/pii';

interface DetectionSidebarProps {
  document: DocumentModel;
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onUpdateEntityAction: (id: string, action: RedactionAction) => void;
  onBatchAction: (action: RedactionAction, category?: 'critical_gov_id' | 'all') => void;
  onDownloadCleaned: () => void;
}

export const DetectionSidebar: React.FC<DetectionSidebarProps> = ({
  document,
  selectedEntityId,
  onSelectEntity,
  onUpdateEntityAction,
  onBatchAction,
  onDownloadCleaned,
}) => {
  const criticalCount = document.entities.filter((e) => e.category === 'critical_gov_id').length;
  const unredactedCritical = document.entities.filter(
    (e) => e.category === 'critical_gov_id' && e.action === 'unredacted'
  ).length;

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'aadhaar':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'pan':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'driving_licence':
        return <Hash className="w-4 h-4 text-purple-600" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-blue-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-cyan-600" />;
      case 'dob':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col h-full overflow-hidden">
      {/* Risk Banner Header */}
      <div
        className={`p-4 rounded-xl border mb-4 ${
          unredactedCritical > 0
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-1">
            {unredactedCritical > 0 ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 animate-bounce" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <h3 className="font-bold text-sm">
              {unredactedCritical > 0 ? 'High-Risk PII Detected' : 'Document Safe to Share'}
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
              unredactedCritical > 0 ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
            }`}
          >
            {unredactedCritical > 0 ? 'Action Needed' : 'Protected'}
          </span>
        </div>

        <p className="text-xs mt-1 leading-relaxed opacity-90">
          {unredactedCritical > 0
            ? `Found ${criticalCount} government identity records (Aadhaar / PAN / DL). Leaving these exposed violates DPDP Act 2023.`
            : `All sensitive identity records have been safely redacted or masked. No raw PII will be stored.`}
        </p>

        {/* Quick Batch Actions */}
        <div className="mt-3 pt-3 border-t border-rose-200/60 flex flex-wrap gap-2">
          <button
            onClick={() => onBatchAction('redacted', 'critical_gov_id')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Redact All Gov IDs
          </button>
          <button
            onClick={() => onBatchAction('masked', 'all')}
            className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-all"
          >
            Mask All
          </button>
          <button
            onClick={() => onBatchAction('unredacted', 'all')}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg"
            title="Reset"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Findings Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Detected Entities ({document.entities.length})
          </h4>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">Confidence Score</span>
      </div>

      {/* Itemized Findings List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {document.entities.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-xs">No sensitive PII patterns found.</p>
          </div>
        ) : (
          document.entities.map((entity) => {
            const isSelected = selectedEntityId === entity.id;

            return (
              <div
                key={entity.id}
                onClick={() => onSelectEntity(entity.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-1 ring-indigo-500'
                    : entity.action === 'redacted'
                    ? 'border-slate-300 bg-slate-50 opacity-90'
                    : entity.action === 'masked'
                    ? 'border-blue-200 bg-blue-50/40'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Entity Title & Icon */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100">{getEntityIcon(entity.type)}</div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 leading-tight">{entity.label}</h5>
                      <span className="text-[10px] text-slate-500 font-mono">Page {entity.boundingBox.page}</span>
                    </div>
                  </div>

                  {/* Confidence pill */}
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700 font-mono">
                      {Math.round(entity.confidence * 100)}%
                    </span>
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          entity.confidence > 0.95
                            ? 'bg-emerald-500'
                            : entity.confidence > 0.8
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${entity.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Validation Tag */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    {entity.maskedValue}
                  </span>
                  {entity.isValidated && (
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                      {entity.validationMethod === 'verhoeff_checksum'
                        ? 'Verhoeff Checksum Valid'
                        : entity.validationMethod === 'pan_regex'
                        ? 'Income Tax Format'
                        : 'Format Matched'}
                    </span>
                  )}
                </div>

                {/* Per-Item Redaction Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onUpdateEntityAction(entity.id, 'redacted')}
                    className={`py-1 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                      entity.action === 'redacted'
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <EyeOff className="w-3 h-3" />
                    Redact
                  </button>

                  <button
                    onClick={() => onUpdateEntityAction(entity.id, 'masked')}
                    className={`py-1 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                      entity.action === 'masked'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Mask
                  </button>

                  <button
                    onClick={() => onUpdateEntityAction(entity.id, 'ignored')}
                    className={`py-1 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                      entity.action === 'ignored'
                        ? 'bg-slate-400 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Keep
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Export CTA Footer */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <button
          onClick={onDownloadCleaned}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download Cleaned Document</span>
        </button>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          Includes DPDP Act audit certificate metadata. Original file purged in 24 hrs.
        </p>
      </div>
    </div>
  );
};
