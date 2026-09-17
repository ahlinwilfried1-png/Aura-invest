/**
 * Phone Number Normalization & Country Utilities
 * Site exclusive to Togo (+228)
 */
import { ALLOWED_COUNTRIES, DEFAULT_COUNTRY, AllowedCountry, getCountryByCode, getCountryByNameOrCode } from '../constants/countries';

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

  // Check known country prefixes without +
  for (const c of ALLOWED_COUNTRIES) {
    const rawPrefix = c.prefix.replace('+', '');
    if (cleaned.startsWith(rawPrefix) && cleaned.length >= rawPrefix.length + 8) {
      return '+' + cleaned;
    }
  }
  
  // If starts with leading 0 (local mobile prefix e.g. 06..., 09...)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If defaultPrefix matches any allowed country
  const matchedCountry = ALLOWED_COUNTRIES.find(c => 
    defaultPrefix === c.prefix || 
    defaultPrefix.replace('+', '') === c.prefix.replace('+', '') ||
    defaultPrefix.toLowerCase().includes(c.name.toLowerCase()) ||
    defaultPrefix.toUpperCase() === c.code
  );

  if (matchedCountry) {
    return `${matchedCountry.prefix}${cleaned}`;
  }

  // Automatic country heuristics for raw national digits if no prefix
  // Côte d'Ivoire: 10 digits or starts with 01, 05, 07
  if (cleaned.length === 10 && (cleaned.startsWith('07') || cleaned.startsWith('05') || cleaned.startsWith('01'))) {
    return `+225${cleaned}`;
  }
  // Cameroon: 9 digits starting with 6, 2, 3
  if (cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('2') || cleaned.startsWith('3'))) {
    return `+237${cleaned}`;
  }
  // Togo: 8 digits starting with 9, 7, 2
  if (cleaned.length === 8 && (cleaned.startsWith('9') || cleaned.startsWith('7') || cleaned.startsWith('2'))) {
    return `+228${cleaned}`;
  }
  // Burkina Faso: 8 digits starting with 7, 6, 5
  if (cleaned.length === 8 && (cleaned.startsWith('7') || cleaned.startsWith('6') || cleaned.startsWith('5'))) {
    return `+226${cleaned}`;
  }
  // Benin: 8 digits
  if (cleaned.length === 8) {
    return `+229${cleaned}`;
  }
  
  const prefix = defaultPrefix.startsWith('+') ? defaultPrefix : `+${defaultPrefix}`;
  return `${prefix}${cleaned}`;
}

export function extractPhoneDetails(input: string | undefined | null, countryHint?: string): {
  countryCode: string;
  isCameroon: boolean;
  cleanPhone: string;
  nationalDigits: string;
  allDigits: string;
  candidates: string[];
} {
  if (!input) {
    return {
      countryCode: 'TG',
      isCameroon: false,
      cleanPhone: '',
      nationalDigits: '',
      allDigits: '',
      candidates: []
    };
  }

  const raw = String(input).trim();
  const allDigits = raw.replace(/\D/g, '');

  let detectedCountry: AllowedCountry = DEFAULT_COUNTRY;

  if (countryHint) {
    detectedCountry = getCountryByNameOrCode(countryHint);
  } else {
    // Detect by prefix
    for (const c of ALLOWED_COUNTRIES) {
      const pDigits = c.prefix.replace('+', '');
      if (raw.startsWith(c.prefix) || allDigits.startsWith(pDigits)) {
        detectedCountry = c;
        break;
      }
    }
  }

  let nationalDigits = '';
  const prefixDigits = detectedCountry.prefix.replace('+', '');
  if (allDigits.startsWith(prefixDigits) && allDigits.length > prefixDigits.length) {
    nationalDigits = allDigits.substring(prefixDigits.length);
  } else {
    nationalDigits = allDigits;
  }

  const cleanPhone = `${detectedCountry.prefix}${nationalDigits}`;

  // Generate lookup candidates for fast database indexing
  const candidatesSet = new Set<string>();
  candidatesSet.add(cleanPhone);
  candidatesSet.add(cleanPhone.replace('+', ''));
  if (nationalDigits) {
    candidatesSet.add(nationalDigits);
    candidatesSet.add(`0${nationalDigits}`);
    candidatesSet.add(`${detectedCountry.prefix} ${nationalDigits}`);
    candidatesSet.add(`${prefixDigits}${nationalDigits}`);
  }

  return {
    countryCode: detectedCountry.code,
    isCameroon: detectedCountry.code === 'CM',
    cleanPhone,
    nationalDigits,
    allDigits,
    candidates: Array.from(candidatesSet)
  };
}

export function detectCountryFromPhone(phone: string | undefined | null): string {
  if (!phone) return 'Cameroun';
  const clean = String(phone).replace(/\s+/g, '');
  for (const c of ALLOWED_COUNTRIES) {
    const rawPrefix = c.prefix.replace('+', '');
    if (clean.startsWith(c.prefix) || clean.startsWith(rawPrefix)) {
      return c.name;
    }
  }
  return 'Cameroun';
}

export function getCountryCode(countryNameOrCode: string | undefined | null): string {
  if (!countryNameOrCode) return 'CM';
  const found = getCountryByNameOrCode(countryNameOrCode);
  return found.code;
}


