// UIDAI Verhoeff Checksum Algorithm Implementation
// Reference: UIDAI Aadhaar specification & IEEE standards

// Multiplication table (d)
const dTable: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

// Permutation table (p)
const pTable: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Validates a 12-digit Aadhaar number using the Verhoeff checksum algorithm.
 * Returns true if valid, false otherwise.
 */
export function validateVerhoeff(aadhaar: string): boolean {
  const cleanStr = aadhaar.replace(/\s|-/g, '');
  if (!/^\d{12}$/.test(cleanStr)) {
    return false;
  }

  // Aadhaar cannot start with 0 or 1 per UIDAI rules
  if (cleanStr.startsWith('0') || cleanStr.startsWith('1')) {
    return false;
  }

  let c = 0;
  const digits = cleanStr.split('').map(Number).reverse();

  for (let i = 0; i < digits.length; i++) {
    c = dTable[c][pTable[i % 8][digits[i]]];
  }

  return c === 0;
}

/**
 * Validates standard Indian PAN format:
 * Exactly 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
 * 4th character denotes entity status (e.g., P for Individual, C for Company, F for Firm, etc.)
 */
export function validatePanFormat(pan: string): { isValid: boolean; entityType?: string } {
  const cleanPan = pan.trim().toUpperCase();
  const panRegex = /^[A-Z]{3}[ABCFGHLJPT][A-Z]\d{4}[A-Z]$/;

  if (!panRegex.test(cleanPan)) {
    return { isValid: false };
  }

  const fourthChar = cleanPan[3];
  const entityMap: Record<string, string> = {
    P: 'Individual (Personal)',
    C: 'Company',
    H: 'HUF (Hindu Undivided Family)',
    A: 'Association of Persons',
    B: 'Body of Individuals',
    G: 'Government Agency',
    J: 'Artificial Juridical Person',
    L: 'Local Authority',
    F: 'Firm / LLP',
    T: 'Trust',
  };

  return {
    isValid: true,
    entityType: entityMap[fourthChar] || 'Individual',
  };
}

/**
 * Validates Indian Driving Licence format:
 * Pattern: 2-letter state code + 2-digit RTO code + 4-digit year + 7-digit unique number
 * E.g., DL-0420110012345 or KA01 20180012345
 */
export function validateDrivingLicence(dl: string): boolean {
  const cleanDl = dl.replace(/[\s-]/g, '').toUpperCase();
  const dlRegex = /^[A-Z]{2}\d{2}[12]\d{3}\d{7}$/;
  return dlRegex.test(cleanDl);
}

/**
 * Masks an Aadhaar number to display only the last 4 digits: XXXX-XXXX-1234
 */
export function maskAadhaar(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 4) {
    const last4 = digits.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }
  return 'XXXX-XXXX-XXXX';
}

/**
 * Masks a PAN number to display only first 2 and last 2 characters: ABXXXXXX4F
 */
export function maskPan(raw: string): string {
  const clean = raw.trim().toUpperCase();
  if (clean.length === 10) {
    return `${clean.slice(0, 2)}XXXXXX${clean.slice(-2)}`;
  }
  return 'XXXXXX' + clean.slice(-2);
}

/**
 * Masks a phone number: +91 XXXXX 12345
 */
export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last4 = digits.slice(-4);
    return `+91 XXXXX-XX${last4}`;
  }
  return 'XXXXX-XXXXX';
}
