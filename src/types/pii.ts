export type PiiType =
  | 'aadhaar'
  | 'pan'
  | 'driving_licence'
  | 'phone'
  | 'email'
  | 'name'
  | 'dob'
  | 'address';

export type RedactionAction = 'unredacted' | 'redacted' | 'masked' | 'ignored';

export interface BoundingBox {
  x: number; // percentage from left (0 - 100)
  y: number; // percentage from top (0 - 100)
  width: number; // percentage width
  height: number; // percentage height
  page: number; // 1-indexed
}

export interface PiiEntity {
  id: string;
  type: PiiType;
  label: string;
  originalValue: string; // will be kept in memory only for preview/diffing
  maskedValue: string; // e.g. "XXXX-XXXX-9021"
  redactedDisplay: string; // e.g. "[REDACTED AADHAAR]"
  validationMethod: 'verhoeff_checksum' | 'pan_regex' | 'dl_format' | 'ner_context' | 'pattern';
  isValidated: boolean;
  confidence: number; // 0.0 to 1.0
  boundingBox: BoundingBox;
  action: RedactionAction;
  category: 'critical_gov_id' | 'contact_info' | 'personal_detail';
}

export interface DocumentPageContent {
  pageNumber: number;
  title: string;
  lines: Array<{
    text: string;
    isHeader?: boolean;
    isMeta?: boolean;
    entityId?: string;
  }>;
}

export interface DocumentModel {
  id: string;
  name: string;
  fileType: 'pdf' | 'png' | 'jpg' | 'docx';
  sizeBytes: number;
  uploadedAt: string;
  pageCount: number;
  entities: PiiEntity[];
  pagesContent: DocumentPageContent[];
  processingTimeMs: number;
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  documentId: string;
  documentName: string;
  piiTypesFound: string[];
  totalDetected: number;
  redactedCount: number;
  maskedCount: number;
  processingTimeMs: number;
  retentionExpiresAt: string;
  complianceStatus: 'COMPLIANT' | 'FLAGGED' | 'RESOLVED';
}
