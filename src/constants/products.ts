import { InvestmentProduct } from '../types';

/**
 * Plans d'investissement officiels AirProds
 * "Investissez aujourd'hui, profitez de demain ! Une expérience immersive, des revenus durables."
 * Formules VIP sur 180 jours :
 * - VIP1 : Prix 3 000 XOF -> 750 XOF/j -> Total 180j : 135 000 XOF
 * - VIP2 : Prix 10 000 XOF -> 2 550 XOF/j -> Total 180j : 459 000 XOF
 * - VIP3 : Prix 20 000 XOF -> 5 200 XOF/j -> Total 180j : 936 000 XOF
 * - VIP4 : Prix 45 000 XOF -> 11 925 XOF/j -> Total 180j : 2 146 500 XOF
 * - VIP5 : Prix 100 000 XOF -> 27 000 XOF/j -> Total 180j : 4 860 000 XOF
 * - VIP6 : Prix 250 000 XOF -> 70 000 XOF/j -> Total 180j : 12 600 000 XOF
 * - VIP7 : Prix 500 000 XOF -> 145 000 XOF/j -> Total 180j : 26 100 000 XOF
 * - VIP8 : Prix 1 000 000 XOF -> 310 000 XOF/j -> Total 180j : 55 800 000 XOF
 * - VIP9 : Prix 2 000 000 XOF -> 800 000 XOF/j -> Total 180j : 144 000 000 XOF
 */
export const OFFICIAL_INVESTMENT_PRODUCTS: InvestmentProduct[] = [
  {
    id: 'airprods-vip1',
    name: 'VIP1 AirProds',
    price: 3000,
    dailyGain: 750,
    duration: 180,
    gain180Days: 135000,
    totalGain: 135000,
    dailyRatePercent: 25,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP1 AirProds — Revenu quotidien de 750 XOF (25%/j) pendant 180 jours. Revenu total : 135 000 XOF.',
    order: 1,
    badge: 'VIP1',
    color: 'from-blue-950/70 via-cyan-900/40 to-sky-950/50 border-cyan-500/40'
  },
  {
    id: 'airprods-vip2',
    name: 'VIP2 AirProds',
    price: 10000,
    dailyGain: 2550,
    duration: 180,
    gain180Days: 459000,
    totalGain: 459000,
    dailyRatePercent: 25.5,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP2 AirProds — Revenu quotidien de 2 550 XOF (25.5%/j) pendant 180 jours. Revenu total : 459 000 XOF.',
    order: 2,
    badge: 'VIP2',
    color: 'from-emerald-950/70 via-teal-900/40 to-green-950/50 border-emerald-500/40'
  },
  {
    id: 'airprods-vip3',
    name: 'VIP3 AirProds',
    price: 20000,
    dailyGain: 5200,
    duration: 180,
    gain180Days: 936000,
    totalGain: 936000,
    dailyRatePercent: 26,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP3 AirProds — Revenu quotidien de 5 200 XOF (26%/j) pendant 180 jours. Revenu total : 936 000 XOF.',
    order: 3,
    badge: 'VIP3',
    color: 'from-purple-950/70 via-indigo-900/40 to-violet-950/50 border-purple-500/40'
  },
  {
    id: 'airprods-vip4',
    name: 'VIP4 AirProds',
    price: 45000,
    dailyGain: 11925,
    duration: 180,
    gain180Days: 2146500,
    totalGain: 2146500,
    dailyRatePercent: 26.5,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP4 AirProds — Revenu quotidien de 11 925 XOF (26.5%/j) pendant 180 jours. Revenu total : 2 146 500 XOF.',
    order: 4,
    badge: 'VIP4',
    color: 'from-amber-950/70 via-orange-900/40 to-yellow-950/50 border-amber-500/40'
  },
  {
    id: 'airprods-vip5',
    name: 'VIP5 AirProds',
    price: 100000,
    dailyGain: 27000,
    duration: 180,
    gain180Days: 4860000,
    totalGain: 4860000,
    dailyRatePercent: 27,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1576633587382-13ddf37b1fc1?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP5 AirProds — Revenu quotidien de 27 000 XOF (27%/j) pendant 180 jours. Revenu total : 4 860 000 XOF.',
    order: 5,
    badge: 'VIP5',
    color: 'from-rose-950/70 via-pink-900/40 to-red-950/50 border-rose-500/40'
  },
  {
    id: 'airprods-vip6',
    name: 'VIP6 AirProds',
    price: 250000,
    dailyGain: 70000,
    duration: 180,
    gain180Days: 12600000,
    totalGain: 12600000,
    dailyRatePercent: 28,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP6 AirProds — Revenu quotidien de 70 000 XOF (28%/j) pendant 180 jours. Revenu total : 12 600 000 XOF.',
    order: 6,
    badge: 'VIP6',
    color: 'from-cyan-950/70 via-teal-900/40 to-blue-950/50 border-cyan-400/40'
  },
  {
    id: 'airprods-vip7',
    name: 'VIP7 AirProds',
    price: 500000,
    dailyGain: 145000,
    duration: 180,
    gain180Days: 26100000,
    totalGain: 26100000,
    dailyRatePercent: 29,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP7 AirProds — Revenu quotidien de 145 000 XOF (29%/j) pendant 180 jours. Revenu total : 26 100 000 XOF.',
    order: 7,
    badge: 'VIP7',
    color: 'from-purple-950/70 via-fuchsia-900/40 to-indigo-950/50 border-purple-400/40'
  },
  {
    id: 'airprods-vip8',
    name: 'VIP8 AirProds',
    price: 1000000,
    dailyGain: 310000,
    duration: 180,
    gain180Days: 55800000,
    totalGain: 55800000,
    dailyRatePercent: 31,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP8 AirProds — Revenu quotidien de 310 000 XOF (31%/j) pendant 180 jours. Revenu total : 55 800 000 XOF.',
    order: 8,
    badge: 'VIP8',
    color: 'from-blue-950/70 via-indigo-900/40 to-sky-950/50 border-blue-400/40'
  },
  {
    id: 'airprods-vip9',
    name: 'VIP9 AirProds',
    price: 2000000,
    dailyGain: 800000,
    duration: 180,
    gain180Days: 144000000,
    totalGain: 144000000,
    dailyRatePercent: 40,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=800&auto=format&fit=crop&q=80',
    description: 'Formule VIP9 AirProds — Revenu quotidien de 800 000 XOF (40%/j) pendant 180 jours. Revenu total : 144 000 000 XOF.',
    order: 9,
    badge: 'VIP9',
    color: 'from-violet-950/70 via-purple-900/40 to-indigo-950/50 border-violet-400/40'
  }
];
