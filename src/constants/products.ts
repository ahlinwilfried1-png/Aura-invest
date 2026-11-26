import { InvestmentProduct } from '../types';

/**
 * Plans d'investissement officiels Gold Speed (Cycle 150 jours)
 * - Gold 1 : Prix 3 000 FCFA     -> 900 FCFA/j     -> Total 150j : 135 000 FCFA
 * - Gold 2 : Prix 7 000 FCFA     -> 2 135 FCFA/j   -> Total 150j : 320 250 FCFA
 * - Gold 3 : Prix 15 000 FCFA    -> 4 650 FCFA/j   -> Total 150j : 697 500 FCFA
 * - Gold 4 : Prix 40 000 FCFA    -> 12 600 FCFA/j  -> Total 150j : 1 890 000 FCFA
 * - Gold 5 : Prix 100 000 FCFA   -> 32 000 FCFA/j  -> Total 150j : 4 800 000 FCFA
 * - Gold 6 : Prix 250 000 FCFA   -> 82 500 FCFA/j  -> Total 150j : 12 375 000 FCFA
 * - Gold 7 : Prix 500 000 FCFA   -> 170 000 FCFA/j -> Total 150j : 25 500 000 FCFA
 * - Gold 8 : Prix 1 000 000 FCFA -> 400 000 FCFA/j -> Total 150j : 60 000 000 FCFA
 */
export const OFFICIAL_INVESTMENT_PRODUCTS: InvestmentProduct[] = [
  {
    id: 'iphone-vip1',
    name: 'Gold 1',
    price: 3000,
    dailyGain: 900,
    duration: 150,
    totalGain: 135000,
    dailyRatePercent: 30,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 1 — Revenu quotidien de 900 FCFA (30%/j) pendant 150 jours. Revenu total : 135 000 FCFA.',
    order: 1,
    badge: 'GOLD 1',
    color: 'from-blue-950/70 via-cyan-900/40 to-sky-950/50 border-cyan-500/40'
  },
  {
    id: 'iphone-vip2',
    name: 'Gold 2',
    price: 7000,
    dailyGain: 2135,
    duration: 150,
    totalGain: 320250,
    dailyRatePercent: 30.5,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 2 — Revenu quotidien de 2 135 FCFA (30.5%/j) pendant 150 jours. Revenu total : 320 250 FCFA.',
    order: 2,
    badge: 'GOLD 2',
    color: 'from-emerald-950/70 via-teal-900/40 to-green-950/50 border-emerald-500/40'
  },
  {
    id: 'iphone-vip3',
    name: 'Gold 3',
    price: 15000,
    dailyGain: 4650,
    duration: 150,
    totalGain: 697500,
    dailyRatePercent: 31,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 3 — Revenu quotidien de 4 650 FCFA (31%/j) pendant 150 jours. Revenu total : 697 500 FCFA.',
    order: 3,
    badge: 'GOLD 3',
    color: 'from-purple-950/70 via-indigo-900/40 to-violet-950/50 border-purple-500/40'
  },
  {
    id: 'iphone-vip4',
    name: 'Gold 4',
    price: 40000,
    dailyGain: 12600,
    duration: 150,
    totalGain: 1890000,
    dailyRatePercent: 31.5,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 4 — Revenu quotidien de 12 600 FCFA (31.5%/j) pendant 150 jours. Revenu total : 1 890 000 FCFA.',
    order: 4,
    badge: 'GOLD 4',
    color: 'from-amber-950/70 via-orange-900/40 to-yellow-950/50 border-amber-500/40'
  },
  {
    id: 'iphone-vip5',
    name: 'Gold 5',
    price: 100000,
    dailyGain: 32000,
    duration: 150,
    totalGain: 4800000,
    dailyRatePercent: 32,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 5 — Revenu quotidien de 32 000 FCFA (32%/j) pendant 150 jours. Revenu total : 4 800 000 FCFA.',
    order: 5,
    badge: 'GOLD 5',
    color: 'from-rose-950/70 via-pink-900/40 to-red-950/50 border-rose-500/40'
  },
  {
    id: 'iphone-vip6',
    name: 'Gold 6',
    price: 250000,
    dailyGain: 82500,
    duration: 150,
    totalGain: 12375000,
    dailyRatePercent: 33,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 6 — Revenu quotidien de 82 500 FCFA (33%/j) pendant 150 jours. Revenu total : 12 375 000 FCFA.',
    order: 6,
    badge: 'GOLD 6',
    color: 'from-cyan-950/70 via-teal-900/40 to-blue-950/50 border-cyan-400/40'
  },
  {
    id: 'iphone-vip7',
    name: 'Gold 7',
    price: 500000,
    dailyGain: 170000,
    duration: 150,
    totalGain: 25500000,
    dailyRatePercent: 34,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 7 — Revenu quotidien de 170 000 FCFA (34%/j) pendant 150 jours. Revenu total : 25 500 000 FCFA.',
    order: 7,
    badge: 'GOLD 7',
    color: 'from-purple-950/70 via-fuchsia-900/40 to-indigo-950/50 border-purple-400/40'
  },
  {
    id: 'iphone-vip8',
    name: 'Gold 8',
    price: 1000000,
    dailyGain: 400000,
    duration: 150,
    totalGain: 60000000,
    dailyRatePercent: 40,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Gold 8 — Revenu quotidien de 400 000 FCFA (40%/j) pendant 150 jours. Revenu total : 60 000 000 FCFA.',
    order: 8,
    badge: 'GOLD 8',
    color: 'from-blue-950/70 via-indigo-900/40 to-sky-950/50 border-blue-400/40'
  }
];
