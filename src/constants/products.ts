import { InvestmentProduct } from '../types';

/**
 * Plans d'investissement officiels Duke Energy (Grille tarifaire officielle)
 * Formules 15% / jour sur 40 jours :
 * - Photovoltaïque : 3 000 F -> 450 F / jour -> Gain 40j : 18 000 F -> Total 40j : 21 000 F
 * - Solar Panel : 7 000 F -> 1 050 F / jour -> Gain 40j : 42 000 F -> Total 40j : 49 000 F
 * - Inverter : 15 000 F -> 2 250 F / jour -> Gain 40j : 90 000 F -> Total 40j : 105 000 F
 * - Batterie Solaire : 30 000 F -> 4 500 F / jour -> Gain 40j : 180 000 F -> Total 40j : 210 000 F
 * - Kilowatt Solaire : 70 000 F -> 10 500 F / jour -> Gain 40j : 420 000 F -> Total 40j : 490 000 F
 * - Megawatt Solaire : 130 000 F -> 19 500 F / jour -> Gain 40j : 780 000 F -> Total 40j : 910 000 F
 */
export const OFFICIAL_INVESTMENT_PRODUCTS: InvestmentProduct[] = [
  {
    id: 'photovoltaique',
    name: 'Photovoltaïque',
    price: 3000,
    dailyGain: 450,
    duration: 40,
    gain40Days: 18000,
    totalGain: 21000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Photovoltaïque Duke Energy — Rendement quotidien de 450 FCFA (15%/j) pendant 40 jours. Gain net sur 40 jours : 18 000 FCFA | Total à 40 jours : 21 000 FCFA.',
    order: 1,
    badge: '15% / jour',
    color: 'from-amber-950/60 via-yellow-900/30 to-orange-950/40 border-amber-500/30'
  },
  {
    id: 'solar-panel',
    name: 'Solar Panel',
    price: 7000,
    dailyGain: 1050,
    duration: 40,
    gain40Days: 42000,
    totalGain: 49000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Solar Panel Duke Energy — Rendement quotidien de 1 050 FCFA (15%/j) pendant 40 jours. Gain net sur 40 jours : 42 000 FCFA | Total à 40 jours : 49 000 FCFA.',
    order: 2,
    badge: '15% / jour',
    color: 'from-blue-950/60 via-sky-900/30 to-cyan-950/40 border-blue-500/30'
  },
  {
    id: 'inverter',
    name: 'Inverter',
    price: 15000,
    dailyGain: 2250,
    duration: 40,
    gain40Days: 90000,
    totalGain: 105000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Inverter Duke Energy — Onduleur solaire avec rendement quotidien de 2 250 FCFA (15%/j) pendant 40 jours. Gain net sur 40 jours : 90 000 FCFA | Total à 40 jours : 105 000 FCFA.',
    order: 3,
    badge: '15% / jour',
    color: 'from-emerald-950/60 via-teal-900/30 to-green-950/40 border-emerald-500/30'
  },
  {
    id: 'batterie-solaire',
    name: 'Batterie Solaire',
    price: 30000,
    dailyGain: 4500,
    duration: 40,
    gain40Days: 180000,
    totalGain: 210000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1558441719-8b489c652790?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Batterie Solaire Duke Energy — Stockage photovoltaïque avec rendement quotidien de 4 500 FCFA (15%/j) pendant 40 jours. Gain net sur 40 jours : 180 000 FCFA | Total à 40 jours : 210 000 FCFA.',
    order: 4,
    badge: '15% / jour',
    color: 'from-purple-950/60 via-indigo-900/30 to-violet-950/40 border-purple-500/30'
  },
  {
    id: 'kilowatt-solaire',
    name: 'Kilowatt Solaire',
    price: 70000,
    dailyGain: 10500,
    duration: 40,
    gain40Days: 420000,
    totalGain: 490000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Kilowatt Solaire Duke Energy — Production kW industrielle avec rendement quotidien de 10 500 FCFA (15%/j) pendant 40 jours. Gain net sur 40 jours : 420 000 FCFA | Total à 40 jours : 490 000 FCFA.',
    order: 5,
    badge: '15% / jour',
    color: 'from-yellow-950/60 via-amber-900/30 to-orange-950/40 border-yellow-500/30'
  },
  {
    id: 'megawatt-solaire',
    name: 'Megawatt Solaire',
    price: 130000,
    dailyGain: 19500,
    duration: 40,
    gain40Days: 780000,
    totalGain: 910000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Megawatt Solaire Duke Energy — Puissance maximale de centrale MW avec rendement quotidien de 19 500 FCFA (15%/j) pendant 40 jours. Gain net sur 40 jours : 780 000 FCFA | Total à 40 jours : 910 000 FCFA.',
    order: 6,
    badge: '15% / jour',
    color: 'from-rose-950/60 via-pink-900/30 to-red-950/40 border-rose-500/30'
  }
];
