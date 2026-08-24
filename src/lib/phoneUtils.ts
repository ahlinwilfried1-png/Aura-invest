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

  // If defaultPrefix explicitly indicates Cameroon
  if (defaultPrefix.includes('237') || defaultPrefix.toLowerCase().includes('cam')) {
    return `+237${cleaned}`;
  }

  // Automatic country detection for raw local phone numbers
  // Cameroon numbers are 9 digits and start with 6 or 2 or 3 (e.g. 6xxxxxxxx, 2xxxxxxxx)
  if (cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('2') || cleaned.startsWith('3'))) {
    return `+237${cleaned}`;
  }
  // Togo numbers are 8 digits and start with 9, 7 or 2 (e.g. 9xxxxxxx, 7xxxxxxx)
  if (cleaned.length === 8 && (cleaned.startsWith('9') || cleaned.startsWith('7') || cleaned.startsWith('2'))) {
    return `+228${cleaned}`;
  }
  
  const prefix = defaultPrefix.startsWith('+') ? defaultPrefix : `+${defaultPrefix}`;
  return `${prefix}${cleaned}`;
}

export function extractPhoneDetails(input: string | undefined | null, countryHint?: string): {
  isCameroon: boolean;
  cleanPhone: string;
  nationalDigits: string;
  allDigits: string;
  candidates: string[];
} {
  if (!input) {
    return {
      isCameroon: false,
      cleanPhone: '',
      nationalDigits: '',
      allDigits: '',
      candidates: []
    };
  }

  const raw = String(input).trim();
  const allDigits = raw.replace(/\D/g, '');
  
  const isCameroon = Boolean(
    (countryHint && (countryHint.toLowerCase().includes('cam') || countryHint.toUpperCase() === 'CM' || countryHint.includes('237'))) ||
    raw.startsWith('+237') ||
    allDigits.startsWith('237') ||
    (allDigits.length === 9 && (allDigits.startsWith('6') || allDigits.startsWith('2') || allDigits.startsWith('3')))
  );

  let nationalDigits = '';
  let cleanPhone = '';

  if (isCameroon) {
    if (allDigits.startsWith('237') && allDigits.length >= 11) {
      nationalDigits = allDigits.substring(3);
    } else if (allDigits.length >= 9) {
      nationalDigits = allDigits.slice(-9);
    } else {
      nationalDigits = allDigits;
    }
    cleanPhone = `+237${nationalDigits}`;
  } else {
    // Togo
    if (allDigits.startsWith('228') && allDigits.length >= 10) {
      nationalDigits = allDigits.substring(3);
    } else if (allDigits.length >= 8) {
      nationalDigits = allDigits.slice(-8);
    } else {
      nationalDigits = allDigits;
    }
    cleanPhone = `+228${nationalDigits}`;
  }

  // Generate lookup candidates for fast database indexing
  const candidatesSet = new Set<string>();
  candidatesSet.add(cleanPhone);
  candidatesSet.add(cleanPhone.replace('+', ''));
  if (nationalDigits) {
    candidatesSet.add(nationalDigits);
    candidatesSet.add(`0${nationalDigits}`);
    if (isCameroon) {
      candidatesSet.add(`+237 ${nationalDigits}`);
      candidatesSet.add(`+237 ${nationalDigits.slice(0, 1)} ${nationalDigits.slice(1, 3)} ${nationalDigits.slice(3, 5)} ${nationalDigits.slice(5, 7)} ${nationalDigits.slice(7)}`);
      candidatesSet.add(`237${nationalDigits}`);
    } else {
      candidatesSet.add(`+228 ${nationalDigits}`);
      candidatesSet.add(`+228 ${nationalDigits.slice(0, 2)} ${nationalDigits.slice(2, 4)} ${nationalDigits.slice(4, 6)} ${nationalDigits.slice(6)}`);
      candidatesSet.add(`228${nationalDigits}`);
    }
  }

  return {
    isCameroon,
    cleanPhone,
    nationalDigits,
    allDigits,
    candidates: Array.from(candidatesSet)
  };
}

export function detectCountryFromPhone(phone: string | undefined | null): 'Cameroun' | 'Togo' {
  if (!phone) return 'Togo';
  const clean = String(phone).replace(/\s+/g, '');
  if (clean.startsWith('+237') || clean.startsWith('237')) {
    return 'Cameroun';
  }
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('2') || digits.startsWith('3'))) {
    return 'Cameroun';
  }
  return 'Togo';
}

export function getCountryCode(countryNameOrCode: string | undefined | null): 'CM' | 'TG' {
  if (!countryNameOrCode) return 'TG';
  const str = String(countryNameOrCode).toLowerCase();
  if (str.includes('cam') || str === 'cm' || str.includes('237')) {
    return 'CM';
  }
  return 'TG';
}

