from typing import Literal, Optional, List
from pydantic import BaseModel, Field

PiiType = Literal[
    'aadhaar',
    'pan',
    'driving_licence',
    'phone',
    'email',
    'name',
    'dob',
    'address',
]

RedactionAction = Literal['unredacted', 'redacted', 'masked', 'ignored']

class BoundingBox(BaseModel):
    x: float = Field(..., description="Percentage offset from left edge (0 to 100)")
    y: float = Field(..., description="Percentage offset from top edge (0 to 100)")
    width: float = Field(..., description="Percentage width (0 to 100)")
    height: float = Field(..., description="Percentage height (0 to 100)")
    page: int = Field(1, description="Page index (1-based)")

class PiiEntity(BaseModel):
    id: str
    type: PiiType
    label: str
    originalValue: str
    maskedValue: str
    redactedDisplay: str
    validationMethod: Literal['verhoeff_checksum', 'pan_regex', 'dl_format', 'ner_context', 'pattern']
    isValidated: bool
    confidence: float
    boundingBox: BoundingBox
    action: RedactionAction = 'unredacted'
    category: Literal['critical_gov_id', 'contact_info', 'personal_detail']

class DocumentLine(BaseModel):
    text: str
    isHeader: bool = False
    isMeta: bool = False
    entityId: Optional[str] = None

class DocumentPage(BaseModel):
    pageNumber: int
    title: str = ""
    lines: List[DocumentLine] = []

class ScanResponse(BaseModel):
    id: str
    name: str
    fileType: str
    sizeBytes: int
    uploadedAt: str
    pageCount: int
    entities: List[PiiEntity]
    pagesContent: List[DocumentPage]
    processingTimeMs: int
    overallRisk: Literal['critical', 'high', 'medium', 'low']

class EntityActionOverride(BaseModel):
    entityId: str
    action: RedactionAction

class RedactRequest(BaseModel):
    documentId: str
    name: str
    lines: List[DocumentLine]
    entities: List[PiiEntity]
    overrides: Optional[List[EntityActionOverride]] = None

class RedactResponse(BaseModel):
    documentId: str
    name: str
    status: str
    sanitizedText: str
    redactedCount: int
    maskedCount: int
    complianceStatus: str

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    documentId: str
    documentName: str
    piiTypesFound: List[str]
    totalDetected: int
    redactedCount: int
    maskedCount: int
    processingTimeMs: int
    retentionExpiresAt: str
    complianceStatus: Literal['COMPLIANT', 'FLAGGED', 'RESOLVED']
