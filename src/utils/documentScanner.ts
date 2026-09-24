import type { DocumentModel, PiiEntity } from '../types/pii';
import {
  validateVerhoeff,
  validatePanFormat,
  validateDrivingLicence,
  maskAadhaar,
  maskPan,
  maskPhone,
} from './verhoeff';

export function scanRawText(text: string, fileName: string): DocumentModel {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const entities: PiiEntity[] = [];

  // Patterns
  const aadhaarRegex = /\b([2-9]\d{3}\s?\d{4}\s?\d{4})\b/g;
  const panRegex = /\b([A-Z]{5}\d{4}[A-Z])\b/g;
  const dlRegex = /\b([A-Z]{2}[-\s]?\d{2}[-\s]?[12]\d{3}[-\s]?\d{7})\b/g;
  const phoneRegex = /\b((?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5})\b/g;
  const emailRegex = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;

  // Track occurrences
  let entityCounter = 1;

  // Parse lines
  const parsedLines = lines.map((line, lineIdx) => {
    let matchedEntityId: string | undefined = undefined;

    // Check Aadhaar
    const aadhaarMatches = [...line.matchAll(aadhaarRegex)];
    for (const match of aadhaarMatches) {
      const rawVal = match[1];
      const isVerhoeffValid = validateVerhoeff(rawVal);
      const entityId = `custom-ent-${entityCounter++}`;
      matchedEntityId = entityId;

      entities.push({
        id: entityId,
        type: 'aadhaar',
        label: 'Aadhaar (UIDAI Number)',
        originalValue: rawVal,
        maskedValue: maskAadhaar(rawVal),
        redactedDisplay: '[REDACTED AADHAAR]',
        validationMethod: 'verhoeff_checksum',
        isValidated: isVerhoeffValid,
        confidence: isVerhoeffValid ? 0.99 : 0.72,
        boundingBox: {
          x: 35,
          y: Math.min(85, Math.max(15, (lineIdx / Math.max(1, lines.length)) * 80)),
          width: 28,
          height: 3.5,
          page: 1,
        },
        action: 'unredacted',
        category: 'critical_gov_id',
      });
    }

    // Check PAN
    const panMatches = [...line.matchAll(panRegex)];
    for (const match of panMatches) {
      const rawVal = match[1];
      const panCheck = validatePanFormat(rawVal);
      const entityId = `custom-ent-${entityCounter++}`;
      matchedEntityId = entityId;

      entities.push({
        id: entityId,
        type: 'pan',
        label: `Income Tax PAN (${panCheck.entityType || 'Individual'})`,
        originalValue: rawVal,
        maskedValue: maskPan(rawVal),
        redactedDisplay: '[REDACTED PAN]',
        validationMethod: 'pan_regex',
        isValidated: panCheck.isValid,
        confidence: panCheck.isValid ? 0.98 : 0.65,
        boundingBox: {
          x: 35,
          y: Math.min(85, Math.max(15, (lineIdx / Math.max(1, lines.length)) * 80)),
          width: 22,
          height: 3.5,
          page: 1,
        },
        action: 'unredacted',
        category: 'critical_gov_id',
      });
    }

    // Check Driving Licence
    const dlMatches = [...line.matchAll(dlRegex)];
    for (const match of dlMatches) {
      const rawVal = match[1];
      const isValidDl = validateDrivingLicence(rawVal);
      const entityId = `custom-ent-${entityCounter++}`;
      matchedEntityId = entityId;

      entities.push({
        id: entityId,
        type: 'driving_licence',
        label: 'Driving Licence Number',
        originalValue: rawVal,
        maskedValue: rawVal.slice(0, 4) + 'XXXXXXX' + rawVal.slice(-4),
        redactedDisplay: '[REDACTED DL]',
        validationMethod: 'dl_format',
        isValidated: isValidDl,
        confidence: 0.96,
        boundingBox: {
          x: 35,
          y: Math.min(85, Math.max(15, (lineIdx / Math.max(1, lines.length)) * 80)),
          width: 26,
          height: 3.5,
          page: 1,
        },
        action: 'unredacted',
        category: 'critical_gov_id',
      });
    }

    // Check Phone
    const phoneMatches = [...line.matchAll(phoneRegex)];
    for (const match of phoneMatches) {
      const rawVal = match[1];
      const entityId = `custom-ent-${entityCounter++}`;
      if (!matchedEntityId) matchedEntityId = entityId;

      entities.push({
        id: entityId,
        type: 'phone',
        label: 'Mobile Contact',
        originalValue: rawVal,
        maskedValue: maskPhone(rawVal),
        redactedDisplay: '[REDACTED PHONE]',
        validationMethod: 'pattern',
        isValidated: true,
        confidence: 0.95,
        boundingBox: {
          x: 35,
          y: Math.min(85, Math.max(15, (lineIdx / Math.max(1, lines.length)) * 80)),
          width: 24,
          height: 3.2,
          page: 1,
        },
        action: 'unredacted',
        category: 'contact_info',
      });
    }

    // Check Email
    const emailMatches = [...line.matchAll(emailRegex)];
    for (const match of emailMatches) {
      const rawVal = match[1];
      const entityId = `custom-ent-${entityCounter++}`;
      if (!matchedEntityId) matchedEntityId = entityId;

      entities.push({
        id: entityId,
        type: 'email',
        label: 'Email Address',
        originalValue: rawVal,
        maskedValue: rawVal[0] + '*****' + rawVal.slice(rawVal.indexOf('@') - 2),
        redactedDisplay: '[REDACTED EMAIL]',
        validationMethod: 'pattern',
        isValidated: true,
        confidence: 0.97,
        boundingBox: {
          x: 35,
          y: Math.min(85, Math.max(15, (lineIdx / Math.max(1, lines.length)) * 80)),
          width: 32,
          height: 3.2,
          page: 1,
        },
        action: 'unredacted',
        category: 'contact_info',
      });
    }

    return {
      text: line,
      isHeader: lineIdx === 0 || line.toUpperCase() === line,
      isMeta: line.includes('---') || line.includes('==='),
      entityId: matchedEntityId,
    };
  });

  const hasGovIds = entities.some((e) => e.category === 'critical_gov_id');

  return {
    id: `custom-doc-${Date.now()}`,
    name: fileName,
    fileType: fileName.endsWith('.pdf') ? 'pdf' : fileName.endsWith('.docx') ? 'docx' : 'png',
    sizeBytes: Math.max(50000, text.length * 12),
    uploadedAt: 'Just now',
    pageCount: 1,
    processingTimeMs: 840,
    overallRisk: hasGovIds ? 'critical' : entities.length > 0 ? 'medium' : 'low',
    entities,
    pagesContent: [
      {
        pageNumber: 1,
        title: fileName.toUpperCase().replace(/\.[^/.]+$/, ''),
        lines: parsedLines.length > 0 ? parsedLines : [{ text: text }],
      },
    ],
  };
}
