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
    code: 'TG',
    prefix: '+228',
    name: 'Togo',
    flag: '🇹🇬',
    currency: 'FCFA',
    networks: ['TMoney', 'Moov Money']
  }
];

export const DEFAULT_COUNTRY: AllowedCountry = ALLOWED_COUNTRIES[0];

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

