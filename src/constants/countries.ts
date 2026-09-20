export interface AllowedCountry {
  code: string;
  prefix: string;
  name: string;
  flag: string;
  currency: string;
  networks: string[];
}

export const ALLOWED_COUNTRIES: AllowedCountry[] = [
  {
    code: 'BF',
    prefix: '+226',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    currency: 'FCFA',
    networks: ['Orange Money', 'Moov Money', 'Wave']
  },
  {
    code: 'BJ',
    prefix: '+229',
    name: 'Bénin',
    flag: '🇧🇯',
    currency: 'FCFA',
    networks: ['MTN Mobile Money', 'Moov Money', 'Celtiis Cash']
  },
  {
    code: 'TG',
    prefix: '+228',
    name: 'Togo',
    flag: '🇹🇬',
    currency: 'FCFA',
    networks: ['TMoney', 'Moov Money']
  },
  {
    code: 'CI',
    prefix: '+225',
    name: 'Côte d’Ivoire',
    flag: '🇨🇮',
    currency: 'FCFA',
    networks: ['Wave', 'Orange Money', 'MTN Mobile Money', 'Moov Money']
  },
  {
    code: 'CM',
    prefix: '+237',
    name: 'Cameroun',
    flag: '🇨🇲',
    currency: 'FCFA',
    networks: ['MTN Mobile Money', 'Orange Money']
  }
];

export const DEFAULT_COUNTRY: AllowedCountry = ALLOWED_COUNTRIES.find(c => c.code === 'TG') || ALLOWED_COUNTRIES[2] || ALLOWED_COUNTRIES[0];

export function getCountryByCode(code?: string | null): AllowedCountry {
  if (!code) return DEFAULT_COUNTRY;
  const upper = code.trim().toUpperCase();
  return ALLOWED_COUNTRIES.find(c => c.code === upper) || DEFAULT_COUNTRY;
}

export function getCountryByPhone(phone?: string | null): AllowedCountry {
  if (!phone) return DEFAULT_COUNTRY;
  const clean = String(phone).replace(/\s+/g, '');
  for (const country of ALLOWED_COUNTRIES) {
    if (clean.startsWith(country.prefix) || clean.startsWith(country.prefix.replace('+', ''))) {
      return country;
    }
  }
  return DEFAULT_COUNTRY;
}

export function getCountryByNameOrCode(nameOrCode?: string | null): AllowedCountry {
  if (!nameOrCode) return DEFAULT_COUNTRY;
  const str = String(nameOrCode).trim().toLowerCase();
  const found = ALLOWED_COUNTRIES.find(c => 
    c.code.toLowerCase() === str || 
    c.name.toLowerCase() === str || 
    str.includes(c.name.toLowerCase()) ||
    c.prefix === str ||
    (str.startsWith('+') && str.startsWith(c.prefix))
  );
  return found || DEFAULT_COUNTRY;
}

