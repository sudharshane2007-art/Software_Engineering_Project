import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { DocumentViewer } from './components/DocumentViewer';
import { DetectionSidebar } from './components/DetectionSidebar';
import { AuditDashboard } from './components/AuditDashboard';
import { SAMPLE_DOCUMENTS, INITIAL_AUDIT_LOGS } from './data/sampleDocuments';
import type { DocumentModel, RedactionAction, AuditLogEntry } from './types/pii';
import { X, Download, ShieldCheck } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'audit'>('studio');
  const [currentDocument, setCurrentDocument] = useState<DocumentModel>(SAMPLE_DOCUMENTS[0]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Handle entity action update (e.g. Redact, Mask, Keep)
  const handleUpdateEntityAction = (id: string, action: RedactionAction) => {
    setCurrentDocument((prev) => ({
      ...prev,
      entities: prev.entities.map((e) => (e.id === id ? { ...e, action } : e)),
    }));
  };

  // Handle batch action (e.g. Redact all Critical IDs)
  const handleBatchAction = (action: RedactionAction, category?: 'critical_gov_id' | 'all') => {
    setCurrentDocument((prev) => ({
      ...prev,
      entities: prev.entities.map((e) => {
        if (!category || category === 'all' || e.category === category) {
          return { ...e, action };
        }
        return e;
      }),
    }));
  };

  // Handle document upload / sample selection
  const handleDocumentLoaded = (doc: DocumentModel) => {
    setCurrentDocument(doc);
    setSelectedEntityId(null);
  };

  // Download cleaned document trigger
  const handleDownloadCleaned = () => {
    setShowExportModal(true);
  };

  // Confirm download simulated file
  const confirmDownload = () => {
    const textData = `=== PII SENTINEL SANITIZED EXPORT ===\n` +
      `Original File: ${currentDocument.name}\n` +
      `Processed At: ${new Date().toISOString()}\n` +
      `Compliance: DPDP Act 2023 Compliant\n` +
      `Status: IRREVERSIBLY REDACTED\n\n` +
      currentDocument.pagesContent[0].lines
        .map((l) => {
          const ent = currentDocument.entities.find((e) => e.id === l.entityId);
          if (ent && ent.action === 'redacted') {
            return l.text.replace(ent.originalValue, '[REDACTED]');
          }
          if (ent && ent.action === 'masked') {
            return l.text.replace(ent.originalValue, ent.maskedValue);
          }
          return l.text;
        })
        .join('\n');

    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanitized_${currentDocument.name.replace(/\.[^/.]+$/, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Log this redaction event to the compliance ledger
    const redactedCount = currentDocument.entities.filter((e) => e.action === 'redacted').length;
    const maskedCount = currentDocument.entities.filter((e) => e.action === 'masked').length;
    const piiTypesFound = Array.from(new Set(currentDocument.entities.map((e) => e.label.split(' ')[0])));

    const newLog: AuditLogEntry = {
      id: `AUD-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      documentId: currentDocument.id,
      documentName: currentDocument.name,
      piiTypesFound: piiTypesFound.length > 0 ? piiTypesFound : ['Aadhaar', 'PAN'],
      totalDetected: currentDocument.entities.length,
      redactedCount,
      maskedCount,
      processingTimeMs: currentDocument.processingTimeMs || 1200,
      retentionExpiresAt: '24h 00m remaining',
      complianceStatus: 'RESOLVED',
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setShowExportModal(false);
  };

  const detectedCriticalCount = currentDocument.entities.filter(
    (e) => e.category === 'critical_gov_id' && e.action === 'unredacted'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        detectedCount={detectedCriticalCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* Document Ingestion & Sample Selector */}
            <UploadZone
              onDocumentLoaded={handleDocumentLoaded}
              activeDocId={currentDocument.id}
            />

            {/* Split Screen Studio (Viewer + Sidebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Canvas Document Viewer (7 cols on large screens) */}
              <div className="lg:col-span-8 h-[740px]">
                <DocumentViewer
                  document={currentDocument}
                  selectedEntityId={selectedEntityId}
                  onSelectEntity={setSelectedEntityId}
                  onUpdateEntityAction={handleUpdateEntityAction}
                  onDownloadCleaned={handleDownloadCleaned}
                />
              </div>

              {/* Right Findings & Control Sidebar (5 cols on large screens) */}
              <div className="lg:col-span-4 h-[740px]">
                <DetectionSidebar
                  document={currentDocument}
                  selectedEntityId={selectedEntityId}
                  onSelectEntity={setSelectedEntityId}
                  onUpdateEntityAction={handleUpdateEntityAction}
                  onBatchAction={handleBatchAction}
                  onDownloadCleaned={handleDownloadCleaned}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && <AuditDashboard customLogs={auditLogs} />}
      </main>

      {/* Export Confirmation Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Export Cleaned Document</h3>
                  <p className="text-xs text-slate-500">Ready for safe sharing & storage</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Document:</span>
                <span className="font-semibold text-slate-800">{currentDocument.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Aadhaar Redacted:</span>
                <span className="font-semibold text-emerald-600">
                  {currentDocument.entities.filter((e) => e.type === 'aadhaar' && e.action !== 'unredacted').length} items
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PAN / DL Protected:</span>
                <span className="font-semibold text-emerald-600">
                  {currentDocument.entities.filter((e) => (e.type === 'pan' || e.type === 'driving_licence') && e.action !== 'unredacted').length} items
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DPDP Compliance:</span>
                <span className="font-bold text-emerald-600">PASS (Zero Raw PII Exposure)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDownload}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Confirm & Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>
            PII Sentinel • Autonomous  PII Detection & Redaction Engine
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
