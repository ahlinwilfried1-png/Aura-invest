import { InvestmentProduct } from '../types';

/**
 * Plans d'investissement officiels Duke Energy (Grille tarifaire officielle)
 * Formules 15% / jour sur 120 jours :
 * - Photovoltaïque : 3 000 F -> 450 F / jour -> Gain 120j : 54 000 F -> Total 120j : 57 000 F
 * - Solar Panel : 7 000 F -> 1 050 F / jour -> Gain 120j : 126 000 F -> Total 120j : 133 000 F
 * - Inverter : 15 000 F -> 2 250 F / jour -> Gain 120j : 270 000 F -> Total 120j : 285 000 F
 * - Batterie Solaire : 30 000 F -> 4 500 F / jour -> Gain 120j : 540 000 F -> Total 120j : 570 000 F
 * - Kilowatt Solaire : 70 000 F -> 10 500 F / jour -> Gain 120j : 1 260 000 F -> Total 120j : 1 330 000 F
 * - Megawatt Solaire : 130 000 F -> 19 500 F / jour -> Gain 120j : 2 340 000 F -> Total 120j : 2 470 000 F
 */
export const OFFICIAL_INVESTMENT_PRODUCTS: InvestmentProduct[] = [
  {
    id: 'photovoltaique',
    name: 'Photovoltaïque',
    price: 3000,
    dailyGain: 450,
    duration: 120,
    gain120Days: 54000,
    gain40Days: 54000,
    totalGain: 57000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Photovoltaïque Duke Energy — Rendement quotidien de 450 FCFA (15%/j) pendant 120 jours. Gain net sur 120 jours : 54 000 FCFA | Total à 120 jours : 57 000 FCFA.',
    order: 1,
    badge: '15% / jour',
    color: 'from-amber-950/60 via-yellow-900/30 to-orange-950/40 border-amber-500/30'
  },
  {
    id: 'solar-panel',
    name: 'Solar Panel',
    price: 7000,
    dailyGain: 1050,
    duration: 120,
    gain120Days: 126000,
    gain40Days: 126000,
    totalGain: 133000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Solar Panel Duke Energy — Rendement quotidien de 1 050 FCFA (15%/j) pendant 120 jours. Gain net sur 120 jours : 126 000 FCFA | Total à 120 jours : 133 000 FCFA.',
    order: 2,
    badge: '15% / jour',
    color: 'from-blue-950/60 via-sky-900/30 to-cyan-950/40 border-blue-500/30'
  },
  {
    id: 'inverter',
    name: 'Inverter',
    price: 15000,
    dailyGain: 2250,
    duration: 120,
    gain120Days: 270000,
    gain40Days: 270000,
    totalGain: 285000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Inverter Duke Energy — Onduleur solaire avec rendement quotidien de 2 250 FCFA (15%/j) pendant 120 jours. Gain net sur 120 jours : 270 000 FCFA | Total à 120 jours : 285 000 FCFA.',
    order: 3,
    badge: '15% / jour',
    color: 'from-emerald-950/60 via-teal-900/30 to-green-950/40 border-emerald-500/30'
  },
  {
    id: 'batterie-solaire',
    name: 'Batterie Solaire',
    price: 30000,
    dailyGain: 4500,
    duration: 120,
    gain120Days: 540000,
    gain40Days: 540000,
    totalGain: 570000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1558441719-8b489c652790?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Batterie Solaire Duke Energy — Stockage photovoltaïque avec rendement quotidien de 4 500 FCFA (15%/j) pendant 120 jours. Gain net sur 120 jours : 540 000 FCFA | Total à 120 jours : 570 000 FCFA.',
    order: 4,
    badge: '15% / jour',
    color: 'from-purple-950/60 via-indigo-900/30 to-violet-950/40 border-purple-500/30'
  },
  {
    id: 'kilowatt-solaire',
    name: 'Kilowatt Solaire',
    price: 70000,
    dailyGain: 10500,
    duration: 120,
    gain120Days: 1260000,
    gain40Days: 1260000,
    totalGain: 1330000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Kilowatt Solaire Duke Energy — Production kW industrielle avec rendement quotidien de 10 500 FCFA (15%/j) pendant 120 jours. Gain net sur 120 jours : 1 260 000 FCFA | Total à 120 jours : 1 330 000 FCFA.',
    order: 5,
    badge: '15% / jour',
    color: 'from-yellow-950/60 via-amber-900/30 to-orange-950/40 border-yellow-500/30'
  },
  {
    id: 'megawatt-solaire',
    name: 'Megawatt Solaire',
    price: 130000,
    dailyGain: 19500,
    duration: 120,
    gain120Days: 2340000,
    gain40Days: 2340000,
    totalGain: 2470000,
    dailyRatePercent: 15,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop&q=80',
    description: 'Formule Megawatt Solaire Duke Energy — Puissance maximale de centrale MW avec rendement quotidien de 19 500 FCFA (15%/j) pendant 120 jours. Gain net sur 120 jours : 2 340 000 FCFA | Total à 120 jours : 2 470 000 FCFA.',
    order: 6,
    badge: '15% / jour',
    color: 'from-rose-950/60 via-pink-900/30 to-red-950/40 border-rose-500/30'
  }
];
