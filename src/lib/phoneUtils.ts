/**
 * Phone Number Normalization & Country Utilities
 * Handles Togo (+228) and Cameroun (+237) phone formats flawlessly
 */

export function normalizePhoneNumber(input: string | undefined | null, defaultPrefix: string = '+228'): string {
  if (!input) return '';
  
  // Strip all non-digit and non-plus characters (remove spaces, parentheses, hyphens, dots)
  let cleaned = String(input).trim().replace(/[\s\-\(\)\.]/g, '');
  
  // If starts with +, ensure digits follow
  if (cleaned.startsWith('+')) {
    const digits = cleaned.substring(1).replace(/\D/g, '');
    return '+' + digits;
  }
  
  // If starts with 00 (international format)
  if (cleaned.startsWith('00')) {
    const digits = cleaned.substring(2).replace(/\D/g, '');
    return '+' + digits;
  }
  
  // If starts with 237 (Cameroun international code without +)
  if (cleaned.startsWith('237') && cleaned.length >= 11) {
    return '+' + cleaned;
  }
  
  // If starts with 228 (Togo international code without +)
  if (cleaned.startsWith('228') && cleaned.length >= 10) {
    return '+' + cleaned;
  }
  
  // If starts with leading 0 (local mobile prefix e.g. 06..., 09...)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  const prefix = defaultPrefix.startsWith('+') ? defaultPrefix : `+${defaultPrefix}`;
  return `${prefix}${cleaned}`;
}

export function detectCountryFromPhone(phone: string | undefined | null): 'Cameroun' | 'Togo' {
  if (!phone) return 'Togo';
  const clean = String(phone).replace(/\s+/g, '');
  if (clean.startsWith('+237') || clean.startsWith('237')) {
    return 'Cameroun';
  }
  return 'Togo';
}

export function getCountryCode(countryNameOrCode: string | undefined | null): 'CM' | 'TG' {
  if (!countryNameOrCode) return 'TG';
  const str = String(countryNameOrCode).toLowerCase();
  if (str.includes('cam') || str === 'cm') {
    return 'CM';
  }
  return 'TG';
}
