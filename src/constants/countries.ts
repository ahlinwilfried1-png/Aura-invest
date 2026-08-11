export interface AllowedCountry {
  code: string;
  prefix: string;
  name: string;
  flag: string;
  networks: string[];
}

export const ALLOWED_COUNTRIES: AllowedCountry[] = [
  {
    code: 'CI',
    prefix: '+225',
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    networks: ['Orange Money', 'MTN Mobile Money', 'Moov Money', 'Wave']
  },
  {
    code: 'TG',
    prefix: '+228',
    name: 'Togo',
    flag: '🇹🇬',
    networks: ['TMoney', 'Moov Money']
  },
  {
    code: 'BJ',
    prefix: '+229',
    name: 'Bénin',
    flag: '🇧🇯',
    networks: ['MTN Mobile Money', 'Moov Money', 'Wave']
  },
  {
    code: 'BF',
    prefix: '+226',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    networks: ['Orange Money', 'Moov Money', 'Wave']
  },
  {
    code: 'CM',
    prefix: '+237',
    name: 'Cameroun',
    flag: '🇨🇲',
    networks: ['MTN Mobile Money', 'Orange Money']
  }
];
