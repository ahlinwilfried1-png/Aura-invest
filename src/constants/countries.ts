export interface AllowedCountry {
  code: string;
  prefix: string;
  name: string;
  flag: string;
  networks: string[];
}

export const ALLOWED_COUNTRIES: AllowedCountry[] = [
  {
    code: 'TG',
    prefix: '+228',
    name: 'Togo',
    flag: '🇹🇬',
    networks: ['TMoney', 'Moov Money']
  },
  {
    code: 'CM',
    prefix: '+237',
    name: 'Cameroun',
    flag: '🇨🇲',
    networks: ['MTN Mobile Money', 'Orange Money']
  }
];

export const DEFAULT_COUNTRY: AllowedCountry = ALLOWED_COUNTRIES[0];

