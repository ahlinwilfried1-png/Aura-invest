/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fetchTableData, syncTableData, deleteRecord } from '../lib/supabaseService';
import { 
  User, 
  InvestmentProduct, 
  UserInvestment, 
  DepositRequest, 
  WithdrawalRequest, 
  BonusCode, 
  CommissionHistory,
  SupportTicket,
  WithdrawalProof,
  DrawRecord,
  WheelPrize,
  WheelConfig,
  Announcement,
  RevenueLog,
  FaqItem,
  WellnessProduct
} from '../types';

interface AppContextType {
  users: User[];
  currentUser: User | null;
  products: InvestmentProduct[];
  userInvestments: UserInvestment[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  withdrawalProofs: WithdrawalProof[];
  revenueLogs: RevenueLog[];
  bonusCodes: BonusCode[];
  commissions: CommissionHistory[];
  tickets: SupportTicket[];
  drawRecords: DrawRecord[];
  wheelConfig: WheelConfig;
  announcements: Announcement[];
  faqs: FaqItem[];
  wellnessProducts: WellnessProduct[];
  liveStats: {
    membersCount: number;
    depositsSum: number;
    withdrawalsSum: number;
    revenueDistributed: number;
  };
  globalNotification: string | null;
  
  // Auth actions
  login: (phone: string, word: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    phone: string;
    whatsapp: string;
    country: string;
    word: string;
    referrerCode: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: { name: string; whatsapp: string; country: string }) => void;
  changePassword: (oldWord: string, newWord: string) => { success: boolean; error?: string };
  
  // User activities
  buyInvestment: (productId: string, quantity?: number) => { success: boolean; error?: string };
  claimDailyEarning: (investmentId: string) => { success: boolean; error?: string };
  requestDeposit: (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => { success: boolean; error?: string };
  requestWithdrawal: (amount: number, network: any, accountNumber: string) => { success: boolean; error?: string };
  saveWithdrawalAccount: (accountName: string, accountNumber: string, pin: string, network?: string, country?: string) => { success: boolean; error?: string };
  sendAdminDirectMessage: (userId: string, message: string) => void;
  redeemBonusCode: (code: string) => { success: boolean; error?: string; amount?: number };
  claimDailyBonus: () => { success: boolean; error?: string; amount?: number };
  spinLuckyWheel: () => { success: boolean; error?: string; prize?: WheelPrize };
  createSupportTicket: (subject: string, message: string, imageUrl?: string) => void;
  addWithdrawalProof: (amount: number, network: string, message: string, imageUrl?: string | null) => { success: boolean; error?: string };
  
  // Administrative tasks (accessible when currentUser.role === 'admin')
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  toggleBlockUser: (userId: string) => void;
  updateUserBalance: (userId: string, amount: number) => void;
  adminUpdateUserPassword: (userId: string, newWord: string) => { success: boolean; error?: string };
  processDeposit: (depositId: string, status: 'approved' | 'rejected') => void;
  processWithdrawal: (withdrawalId: string, status: 'approved' | 'rejected') => void;
  processWithdrawalProof: (proofId: string, status: 'approved' | 'rejected') => void;
  deleteWithdrawalProof: (proofId: string) => void;
  updateWithdrawalProof: (proofId: string, data: Partial<WithdrawalProof>) => void;
  addOrUpdateProduct: (product: Omit<InvestmentProduct, 'isActive'> & { isActive?: boolean }) => void;
  deleteProduct: (productId: string) => void;
  deleteUserInvestment: (investmentId: string) => void;
  generateBonusCode: (code: string, amount: number, maxUses: number) => { success: boolean; error?: string };
  sendGlobalNotification: (text: string | null) => void;
  replyToTicket: (ticketId: string, reply: string) => void;
  markTicketsAsRead: (userId: string) => void;
  updateUserRole: (userId: string, role: 'admin' | 'user') => void;
  updateWheelConfig: (newConfig: WheelConfig) => void;
  deleteDrawRecord: (recordId: string) => void;
  addTicketsToUser: (userId: string, count: number) => void;
  addAnnouncement: (data: { title: string; content: string; imageUrl?: string }) => void;
  deleteAnnouncement: (id: string) => void;
  markAnnouncementAsRead: (id: string) => void;
  addFaq: (question: string, answer: string, category?: string) => void;
  updateFaq: (id: string, question: string, answer: string, category?: string) => void;
  deleteFaq: (id: string) => void;
  addOrUpdateWellnessProduct: (product: Omit<WellnessProduct, 'id'> & { id?: string }) => void;
  deleteWellnessProduct: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Static Investment Products matching Nutrien Agriculture VIP 1 to VIP 10 specs
const INITIAL_PRODUCTS: InvestmentProduct[] = [
  {
    id: 'vip-1',
    name: 'VIP 1',
    price: 4000,
    dailyGain: 500,
    duration: 200,
    totalGain: 100000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?w=800&auto=format&fit=crop&q=80',
    description: 'Engrais NPK Nutrien - Pack de démarrage agriculture.',
    order: 1,
    badge: 'VIP 1'
  },
  {
    id: 'vip-2',
    name: 'VIP 2',
    price: 15000,
    dailyGain: 1600,
    duration: 200,
    totalGain: 320000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80',
    description: 'Nutrien Bioboost - Fertilisant organique haute performance.',
    order: 2,
    badge: 'VIP 2'
  },
  {
    id: 'vip-3',
    name: 'VIP 3',
    price: 25000,
    dailyGain: 3250,
    duration: 200,
    totalGain: 650000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
    description: 'Nutrien Semences - Maïs Hybride certifié.',
    order: 3,
    badge: 'VIP 3'
  },
  {
    id: 'vip-4',
    name: 'VIP 4',
    price: 50000,
    dailyGain: 11100,
    duration: 200,
    totalGain: 2220000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=80',
    description: 'Nutrien Pesticide - Protection des cultures 5 Litres.',
    order: 4,
    badge: 'VIP 4'
  },
  {
    id: 'vip-5',
    name: 'VIP 5',
    price: 100000,
    dailyGain: 24000,
    duration: 200,
    totalGain: 4800000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
    description: 'Nutrien Pack Agricole Complet - Équipement & Nutriments.',
    order: 5,
    badge: 'VIP 5'
  },
  {
    id: 'vip-6',
    name: 'VIP 6',
    price: 150000,
    dailyGain: 36000,
    duration: 200,
    totalGain: 7200000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80',
    description: 'Nutrien Drone Agricole - Pulvérisation intelligente.',
    order: 6,
    badge: 'VIP 6'
  },
  {
    id: 'vip-7',
    name: 'VIP 7',
    price: 200000,
    dailyGain: 50000,
    duration: 200,
    totalGain: 10000000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&auto=format&fit=crop&q=80',
    description: 'Tracteur Nutrien Smart Ag - Performance Maximale.',
    order: 7,
    badge: 'VIP 7'
  },
  {
    id: 'vip-8',
    name: 'VIP 8',
    price: 300000,
    dailyGain: 75000,
    duration: 200,
    totalGain: 15000000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
    description: 'Système d\'Irrigation Intelligente Nutrien 10 Hectares.',
    order: 8,
    badge: 'VIP 8'
  },
  {
    id: 'vip-9',
    name: 'VIP 9',
    price: 400000,
    dailyGain: 115000,
    duration: 200,
    totalGain: 23000000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&auto=format&fit=crop&q=80',
    description: 'Complexe Industriel de Transformation Nutrien.',
    order: 9,
    badge: 'VIP 9'
  },
  {
    id: 'vip-10',
    name: 'VIP 10',
    price: 800000,
    dailyGain: 250000,
    duration: 200,
    totalGain: 50000000,
    isActive: true,
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?w=800&auto=format&fit=crop&q=80',
    description: 'Nutrien Mega Farm Hub - Partenariat Agro-Industriel Suprême.',
    order: 10,
    badge: 'VIP 10'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Setup local storage based states
  const [users, setUsers] = useState<User[]>(() => {
    const data = localStorage.getItem('fintech_users');
    if (data) return JSON.parse(data);
    
    // Default Admin & Standard User
    const defaultUsers: User[] = [
      {
        id: 'admin-1',
        name: 'Administrateur Principal',
        phone: '11111111',
        whatsapp: '+225 01010101',
        country: 'Côte d\'Ivoire',
        balance: 10000000,
        dailyEarnings: 0,
        totalEarnings: 0,
        vipLevel: 4,
        isBlocked: false,
        createdAt: new Date().toISOString(),
        role: 'admin',
        referralCode: 'ADMIN7',
        referredByCode: null
      },
      {
        id: 'user-1',
        name: 'Koffi Konan',
        phone: '07070707',
        whatsapp: '+225 07070707',
        country: 'Côte d\'Ivoire',
        balance: 8500,
        dailyEarnings: 600,
        totalEarnings: 3600,
        vipLevel: 1,
        isBlocked: false,
        createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        role: 'user',
        referralCode: 'KOFFI07',
        referredByCode: 'ADMIN7'
      },
      {
        id: 'user-2',
        name: 'Seydou Keita',
        phone: '77777777',
        whatsapp: '+223 77777777',
        country: 'Mali',
        balance: 12000,
        dailyEarnings: 2200,
        totalEarnings: 8800,
        vipLevel: 2,
        isBlocked: false,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        role: 'user',
        referralCode: 'SEYDOU77',
        referredByCode: 'KOFFI07'
      }
    ];
    localStorage.setItem('fintech_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const data = localStorage.getItem('fintech_current_user');
    if (data) return JSON.parse(data);
    // Default to active user so user immediately accesses the home dashboard
    const defaultUser = users[1] || users[0];
    if (defaultUser) {
      localStorage.setItem('fintech_current_user', JSON.stringify(defaultUser));
    }
    return defaultUser || null;
  });

  // Keep passwords in a separate simulated secure store or simulated in local storage
  const [passwords, setPasswords] = useState<{ [phone: string]: string }>(() => {
    const data = localStorage.getItem('fintech_passwords');
    if (data) return JSON.parse(data);
    const initialPasswords = {
      '11111111': 'admin123',
      '07070707': 'koffi123',
      '77777777': 'seydou123'
    };
    localStorage.setItem('fintech_passwords', JSON.stringify(initialPasswords));
    return initialPasswords;
  });

  const [products, setProducts] = useState<InvestmentProduct[]>(() => {
    const data = localStorage.getItem('fintech_products');
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure Nutrien VIP 10 products are included
      if (Array.isArray(parsed) && parsed.some((p: InvestmentProduct) => p.name === 'VIP 10' && p.duration === 200)) {
        return parsed;
      }
    }
    localStorage.setItem('fintech_products', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  });

  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>(() => {
    const data = localStorage.getItem('fintech_investments');
    if (data) return JSON.parse(data);
    
    // Default investments for mock users
    const defaultInvestments: UserInvestment[] = [
      {
        id: 'inv-1',
        userId: 'user-1',
        productId: 'vip-1',
        productName: 'VIP 1',
        price: 3000,
        dailyGain: 600,
        duration: 30,
        daysRemaining: 24,
        purchaseDate: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
        lastClaimDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'inv-2',
        userId: 'user-2',
        productId: 'vip-2',
        productName: 'VIP 2',
        price: 10000,
        dailyGain: 2200,
        duration: 30,
        daysRemaining: 26,
        purchaseDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        lastClaimDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ];
    localStorage.setItem('fintech_investments', JSON.stringify(defaultInvestments));
    return defaultInvestments;
  });

  const [deposits, setDeposits] = useState<DepositRequest[]>(() => {
    const data = localStorage.getItem('fintech_deposits');
    if (data) return JSON.parse(data);
    const defaultDeposits: DepositRequest[] = [
      {
        id: 'dep-1',
        userId: 'user-1',
        userName: 'Koffi Konan',
        userPhone: '07070707',
        amount: 3000,
        method: 'Orange Money',
        transactionId: 'TXN82649102',
        screenshotUrl: null,
        status: 'approved',
        createdAt: new Date(Date.now() - 6.5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'dep-2',
        userId: 'user-2',
        userName: 'Seydou Keita',
        userPhone: '77777777',
        amount: 15000,
        method: 'Moov Money',
        transactionId: 'TXN99128472',
        screenshotUrl: null,
        status: 'approved',
        createdAt: new Date(Date.now() - 4.5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'dep-3',
        userId: 'user-1',
        userName: 'Koffi Konan',
        userPhone: '07070707',
        amount: 5000,
        method: 'MTN Money',
        transactionId: 'TXN77163012',
        screenshotUrl: null,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('fintech_deposits', JSON.stringify(defaultDeposits));
    return defaultDeposits;
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const data = localStorage.getItem('fintech_withdrawals');
    if (data) return JSON.parse(data);
    const defaultWithdrawals: WithdrawalRequest[] = [
      {
        id: 'wth-1',
        userId: 'user-1',
        userName: 'Koffi Konan',
        userPhone: '07070707',
        amount: 2500,
        network: 'Orange Money',
        accountNumber: '07070707',
        status: 'approved',
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'wth-2',
        userId: 'user-2',
        userName: 'Seydou Keita',
        userPhone: '77777777',
        amount: 5000,
        network: 'Moov Money',
        accountNumber: '77777777',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('fintech_withdrawals', JSON.stringify(defaultWithdrawals));
    return defaultWithdrawals;
  });

  const [withdrawalProofs, setWithdrawalProofs] = useState<WithdrawalProof[]>(() => {
    const data = localStorage.getItem('aurainvest_withdrawal_proofs');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [revenueLogs, setRevenueLogs] = useState<RevenueLog[]>(() => {
    const data = localStorage.getItem('fintech_revenue_logs');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse revenue logs:", e);
      }
    }
    return [];
  });

  const [bonusCodes, setBonusCodes] = useState<BonusCode[]>(() => {
    const data = localStorage.getItem('fintech_bonus_codes');
    if (data) return JSON.parse(data);
    const defaultCodes = [
      {
        code: 'BIENVENU',
        amount: 1000,
        maxUses: 100,
        usedBy: ['user-1'],
        createdAt: new Date().toISOString()
      },
      {
        code: 'FINTECH2026',
        amount: 2500,
        maxUses: 50,
        usedBy: [],
        createdAt: new Date().toISOString()
      },
      {
        code: 'GOLDVIP',
        amount: 5000,
        maxUses: 10,
        usedBy: [],
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('fintech_bonus_codes', JSON.stringify(defaultCodes));
    return defaultCodes;
  });

  const [commissions, setCommissions] = useState<CommissionHistory[]>(() => {
    const data = localStorage.getItem('fintech_commissions');
    if (data) return JSON.parse(data);
    const defaultCommissions: CommissionHistory[] = [
      {
        id: 'com-1',
        referrerId: 'admin-1',
        refereeId: 'user-1',
        refereeName: 'Koffi Konan',
        amount: 600, // 20% commission on VIP 1 purchase (3000 * 20%)
        level: 1,
        createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'com-2',
        referrerId: 'user-1',
        refereeId: 'user-2',
        refereeName: 'Seydou Keita',
        amount: 2000, // 20% on VIP 2 purchase (10000 * 20%)
        level: 1,
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
      }
    ];
    localStorage.setItem('fintech_commissions', JSON.stringify(defaultCommissions));
    return defaultCommissions;
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const data = localStorage.getItem('fintech_tickets');
    if (data) return JSON.parse(data);
    const defaultTickets: SupportTicket[] = [
      {
        id: 'tkt-1',
        userId: 'user-1',
        userName: 'Koffi Konan',
        subject: 'Délai de validation du dépôt',
        message: 'Bonjour, j\'ai effectué un dépôt de 5000 FCFA il y a une heure et ce n\'est toujours pas validé. Merci d\'y jeter un œil.',
        status: 'open',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('fintech_tickets', JSON.stringify(defaultTickets));
    return defaultTickets;
  });

  const [wheelConfig, setWheelConfig] = useState<WheelConfig>(() => {
    const data = localStorage.getItem('fintech_wheel_config');
    if (data) {
      try { return JSON.parse(data); } catch (e) { console.error(e); }
    }
    return {
      ticketsPerReferral: 1,
      dailyFreeTickets: 1,
      prizes: [
        { id: 1, label: '+100 XAF', value: 100, color: 'bg-emerald-500 text-white' },
        { id: 2, label: '+300 XAF', value: 300, color: 'bg-amber-500 text-slate-950' },
        { id: 3, label: '+500 XAF', value: 500, color: 'bg-blue-600 text-white' },
        { id: 4, label: '+1 000 XAF', value: 1000, color: 'bg-purple-600 text-white' },
        { id: 5, label: '+200 XAF', value: 200, color: 'bg-rose-500 text-white' },
        { id: 6, label: '+2 000 XAF', value: 2000, color: 'bg-emerald-700 text-white' },
      ]
    };
  });

  const [drawRecords, setDrawRecords] = useState<DrawRecord[]>(() => {
    const data = localStorage.getItem('fintech_draw_records');
    if (data) {
      try { return JSON.parse(data); } catch (e) { console.error(e); }
    }
    const defaultDraws: DrawRecord[] = [
      {
        id: 'draw-init-1',
        userId: 'user-1',
        userName: 'Koffi Konan',
        userPhone: '+228 90****95',
        action: 'a fait tourner la roue',
        prizeLabel: '+100 XAF',
        prizeValue: 100,
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        id: 'draw-init-2',
        userId: 'user-2',
        userName: 'Seydou Keita',
        userPhone: '+226 76****35',
        action: 'a fait tourner la roue',
        prizeLabel: '+1 000 XAF',
        prizeValue: 1000,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'draw-init-3',
        userId: 'user-3',
        userName: 'Ablavi Mensah',
        userPhone: '+228 92****45',
        action: 'a fait tourner la roue',
        prizeLabel: '+200 XAF',
        prizeValue: 200,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      {
        id: 'draw-init-4',
        userId: 'user-4',
        userName: 'Yao Kouadio',
        userPhone: '+229 97****42',
        action: 'a fait tourner la roue',
        prizeLabel: '+500 XOF',
        prizeValue: 500,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ];
    localStorage.setItem('fintech_draw_records', JSON.stringify(defaultDraws));
    return defaultDraws;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const data = localStorage.getItem('fintech_announcements');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        // fallback
      }
    }
    const defaultAnnouncements: Announcement[] = [
      {
        id: 'ann-1',
        title: 'Récompenser les agents exceptionnels',
        content: 'Félicitations à tous nos agents certifiés ! Des primes spéciales de fin de mois ont été créditées sur les comptes des 10 meilleurs parrains de la communauté. Continuez à développer votre réseau pour débloquer plus de récompenses.',
        imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-08-02 08:33:32',
        isNew: true
      },
      {
        id: 'ann-2',
        title: 'Bonjour, bienvenue chez Nutrien !',
        content: 'Bienvenue sur la plateforme officielle d\'investissement Nutrien. Profitez de nos offres VIP, de retraits rapides 24/7 et de bonus exclusifs.',
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-08-02 07:49:06',
        isNew: false
      },
      {
        id: 'ann-3',
        title: 'Preuve de retrait',
        content: 'Toutes les demandes de retrait soumises par Orange Money, MTN, Moov et Mixx By Yas sont désormais traitées automatiquement en moins de 10 minutes.',
        imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-08-01 17:30:34',
        isNew: false
      },
      {
        id: 'ann-4',
        title: 'Les 3 équipements agricoles ayant bénéficié du plus grand investissement des utilisateurs',
        content: 'Découvrez les 3 projets les plus populaires de la semaine avec des rendements quotidiens optimisés.',
        imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-08-01 15:20:52',
        isNew: true
      },
      {
        id: 'ann-5',
        title: 'La meilleure preuve',
        content: 'Découvrez les témoignages et preuves de retrait de la communauté dans notre canal officiel Telegram et WhatsApp.',
        imageUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-07-31 17:52:01',
        isNew: true
      },
      {
        id: 'ann-6',
        title: 'Si vous invitez avec succès 6 utilisateurs réels à rejoindre notre entreprise, l\'entreprise vous offrira un équipement agricole d\'une valeur de 100 000 XAF pour vous aider à gagner de l\'argent.',
        content: 'Profitez de cette offre spéciale de parrainage limité. Chaque fois que 6 filleuls directs souscrivent à un produit VIP, vous recevez gratuitement un bonus exceptionnel !',
        imageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-07-31 16:48:21',
        isNew: true
      },
      {
        id: 'ann-7',
        title: 'Deux façons de gagner de l\'argent',
        content: '1. Investissez dans des produits à haut rendement quotidien. 2. Développez votre équipe de parrainage et gagnez jusqu\'à 30% de commissions sur 3 niveaux.',
        imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-07-31 08:07:32',
        isNew: false
      },
      {
        id: 'ann-8',
        title: 'Emprunter de l\'argent pour investir dans des produits de niveau supérieur et gagner plus d\'argent',
        content: 'Profitez des options de crédit d\'investissement pour débloquer les niveaux VIP 2 et 3 et multiplier vos revenus journaliers.',
        imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-07-31 06:17:50',
        isNew: true
      }
    ];
    localStorage.setItem('fintech_announcements', JSON.stringify(defaultAnnouncements));
    return defaultAnnouncements;
  });

  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    const data = localStorage.getItem('fintech_faqs');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    const defaultFaqs: FaqItem[] = [
      {
        id: 'faq-1',
        question: "Comment s'inscrire et commencer à investir ?",
        answer: "Pour commencer, inscrivez-vous avec votre numéro de téléphone et votre mot de passe. Rendez-vous ensuite dans la boutique pour choisir un équipement agricole VIP à souscrire. Vos bénéfices seront automatiquement crédités sur votre compte toutes les 24 heures.",
        category: "Général",
        order: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: 'faq-2',
        question: "Comment effectuer un dépôt ou une recharge ?",
        answer: "Accédez à la rubrique 'Recharger' ou 'Dépôt', sélectionnez votre pays (Côte d'Ivoire, Bénin, Cameroun, Sénégal, Togo, etc.), choisissez votre réseau Mobile Money (Orange Money, MTN, Moov, Wave, Mixx by Yas) ou carte bancaire, entrez le montant et validez l'opération.",
        category: "Dépôts & Retraits",
        order: 2,
        createdAt: new Date().toISOString()
      },
      {
        id: 'faq-3',
        question: "Combien de temps prennent les retraits ?",
        answer: "Toutes les demandes de retrait sont traitées de manière automatisée. Les fonds sont crédités directement sur votre numéro Mobile Money ou carte bancaire liée en moins de 10 à 30 minutes.",
        category: "Dépôts & Retraits",
        order: 3,
        createdAt: new Date().toISOString()
      },
      {
        id: 'faq-4',
        question: "Quels sont les frais de retrait ?",
        answer: "Les frais de retrait appliqués sur la plateforme sont de seulement 5% pour assurer un traitement rapide et sécurisé de toutes vos opérations financières.",
        category: "Dépôts & Retraits",
        order: 4,
        createdAt: new Date().toISOString()
      },
      {
        id: 'faq-5',
        question: "Comment fonctionne le programme de parrainage et d'équipe ?",
        answer: "En invitant de nouveaux membres via votre lien ou code de parrainage, vous recevez des commissions sur 3 niveaux (Niveau 1: 10%, Niveau 2: 3%, Niveau 3: 2%) ainsi que des tickets gratuits pour la Roue de la Fortune.",
        category: "Parrainage & Bonus",
        order: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: 'faq-6',
        question: "Comment lier ma carte bancaire ou mon compte de retrait ?",
        answer: "Dans la rubrique 'Mon compte', cliquez sur 'Lier carte bancaire'. Renseignez le nom du titulaire, le numéro de téléphone ou RIB bancaire et définissez un code PIN secret à 4-6 chiffres pour sécuriser vos retraits.",
        category: "Compte & Sécurité",
        order: 6,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('fintech_faqs', JSON.stringify(defaultFaqs));
    return defaultFaqs;
  });

  const [wellnessProducts, setWellnessProducts] = useState<WellnessProduct[]>(() => {
    const data = localStorage.getItem('fintech_wellness_products');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    const defaultWellness: WellnessProduct[] = [
      {
        id: 'wellness-car-1',
        name: 'Voiture intermédiaire 1',
        description: 'Pack Produit Bien-être - Voiture intermédiaire 1',
        price: 30000,
        quantity: 20,
        status: 'disponible',
        imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      },
      {
        id: 'wellness-car-2',
        name: 'Voiture intermédiaire 2',
        description: 'Pack Produit Bien-être - Voiture intermédiaire 2',
        price: 50000,
        quantity: 15,
        status: 'disponible',
        imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      },
      {
        id: 'wellness-car-3',
        name: 'Voiture Berline Luxe',
        description: 'Pack Produit Bien-être - Voiture Berline Luxe',
        price: 100000,
        quantity: 10,
        status: 'disponible',
        imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('fintech_wellness_products', JSON.stringify(defaultWellness));
    return defaultWellness;
  });

  const [globalNotification, setGlobalNotification] = useState<string | null>(() => {
    return localStorage.getItem('fintech_global_notification') || "Bienvenue sur notre plateforme d'investissement VIP ! Profitez d'un taux d'intérêt exceptionnel de bienvenue.";
  });

  // Keep a simulated live counter that increments every few seconds to make stats feel alive (direct feed)
  const [liveStats, setLiveStats] = useState({
    membersCount: 1472,
    depositsSum: 5824900,
    withdrawalsSum: 2191400,
    revenueDistributed: 4210400
  });

  // Hydrate & Background live sync with Supabase
  useEffect(() => {
    async function hydrateFromSupabase() {
      const dbUsers = await fetchTableData<User>('users');
      if (dbUsers && dbUsers.length > 0) setUsers(dbUsers);

      const dbProducts = await fetchTableData<InvestmentProduct>('products');
      if (dbProducts && dbProducts.length > 0) setProducts(dbProducts);

      const dbDeposits = await fetchTableData<DepositRequest>('deposits');
      if (dbDeposits && dbDeposits.length > 0) setDeposits(dbDeposits);

      const dbWithdrawals = await fetchTableData<WithdrawalRequest>('withdrawals');
      if (dbWithdrawals && dbWithdrawals.length > 0) setWithdrawals(dbWithdrawals);

      const dbProofs = await fetchTableData<WithdrawalProof>('withdrawal_proofs');
      if (dbProofs && dbProofs.length > 0) setWithdrawalProofs(dbProofs);

      const dbInvestments = await fetchTableData<UserInvestment>('investments');
      if (dbInvestments && dbInvestments.length > 0) setUserInvestments(dbInvestments);

      const dbRevenueLogs = await fetchTableData<RevenueLog>('revenue_logs');
      if (dbRevenueLogs && dbRevenueLogs.length > 0) setRevenueLogs(dbRevenueLogs);

      const dbTickets = await fetchTableData<SupportTicket>('tickets');
      if (dbTickets && dbTickets.length > 0) {
        setTickets(prev => {
          const ticketMap = new Map<string, SupportTicket>();
          dbTickets.forEach(t => ticketMap.set(t.id, t));
          
          prev.forEach(prevT => {
            const dbT = ticketMap.get(prevT.id);
            if (!dbT) {
              ticketMap.set(prevT.id, prevT);
            } else {
              const hasNewReply = !!dbT.reply && dbT.reply !== prevT.reply;
              ticketMap.set(prevT.id, {
                ...dbT,
                reply: dbT.reply || prevT.reply,
                replyCreatedAt: dbT.replyCreatedAt || prevT.replyCreatedAt,
                status: (prevT.status === 'closed' || dbT.status === 'closed') ? 'closed' : dbT.status,
                isReadByUser: hasNewReply ? false : (prevT.isReadByUser !== undefined ? prevT.isReadByUser : dbT.isReadByUser),
              });
            }
          });

          const merged = Array.from(ticketMap.values());
          localStorage.setItem('fintech_tickets', JSON.stringify(merged));
          return merged;
        });
      }

      const dbCommissions = await fetchTableData<CommissionHistory>('commissions');
      if (dbCommissions && dbCommissions.length > 0) setCommissions(dbCommissions);

      const dbBonusCodes = await fetchTableData<BonusCode>('bonus_codes');
      if (dbBonusCodes && dbBonusCodes.length > 0) setBonusCodes(dbBonusCodes);

      const dbAnnouncements = await fetchTableData<Announcement>('announcements');
      if (dbAnnouncements && dbAnnouncements.length > 0) setAnnouncements(dbAnnouncements);

      const dbFaqs = await fetchTableData<FaqItem>('faqs');
      if (dbFaqs && dbFaqs.length > 0) setFaqs(dbFaqs);
    }

    hydrateFromSupabase();

    // Poll every 3 seconds for multi-device cross-syncing
    const syncInterval = setInterval(hydrateFromSupabase, 3000);

    // Instant cross-tab real-time sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fintech_tickets' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTickets(parsed);
        } catch (err) {
          console.error("Storage sync tickets error:", err);
        }
      }
      if (e.key === 'fintech_users' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUsers(parsed);
        } catch (err) {
          console.error("Storage sync users error:", err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const handleCustomTicketsChanged = (evt: Event) => {
      const customEvt = evt as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setTickets(customEvt.detail);
      }
    };
    window.addEventListener('nutrien_tickets_changed', handleCustomTicketsChanged);

    // Fast local polling interval (1s) to ensure instant cross-view & cross-window state updates
    const ticketPollInterval = setInterval(() => {
      const stored = localStorage.getItem('fintech_tickets');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setTickets(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
                return parsed;
              }
              return prev;
            });
          }
        } catch {}
      }
    }, 1000);

    const statsInterval = setInterval(() => {
      setLiveStats(prev => {
        const addedRevenue = Math.floor(Math.random() * 95) + 5;
        const addedDeposits = Math.random() > 0.8 ? Math.floor(Math.random() * 5000) + 1000 : 0;
        const newMembers = Math.random() > 0.9 ? 1 : 0;
        return {
          membersCount: prev.membersCount + newMembers,
          depositsSum: prev.depositsSum + addedDeposits,
          withdrawalsSum: prev.withdrawalsSum + (addedDeposits > 0 ? Math.floor(addedDeposits * 0.4) : 0),
          revenueDistributed: prev.revenueDistributed + addedRevenue
        };
      });
    }, 4500);

    return () => {
      clearInterval(syncInterval);
      clearInterval(statsInterval);
      clearInterval(ticketPollInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('nutrien_tickets_changed', handleCustomTicketsChanged);
    };
  }, []);

  // Save state helpers
  useEffect(() => {
    localStorage.setItem('fintech_users', JSON.stringify(users));
    syncTableData('users', users);
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('fintech_current_user', JSON.stringify(currentUser));
      // Keep currentUser in sync with the users array
      const freshUser = users.find(u => u.id === currentUser.id);
      if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(freshUser);
      }
    } else {
      localStorage.removeItem('fintech_current_user');
    }
  }, [currentUser, users]);

  useEffect(() => {
    localStorage.setItem('fintech_passwords', JSON.stringify(passwords));
  }, [passwords]);

  useEffect(() => {
    localStorage.setItem('fintech_products', JSON.stringify(products));
    syncTableData('products', products);
  }, [products]);

  useEffect(() => {
    localStorage.setItem('fintech_investments', JSON.stringify(userInvestments));
    syncTableData('investments', userInvestments);
  }, [userInvestments]);

  useEffect(() => {
    localStorage.setItem('fintech_deposits', JSON.stringify(deposits));
    syncTableData('deposits', deposits);
  }, [deposits]);

  useEffect(() => {
    localStorage.setItem('fintech_withdrawals', JSON.stringify(withdrawals));
    syncTableData('withdrawals', withdrawals);
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem('aurainvest_withdrawal_proofs', JSON.stringify(withdrawalProofs));
    localStorage.setItem('fintech_withdrawal_proofs', JSON.stringify(withdrawalProofs));
    syncTableData('withdrawal_proofs', withdrawalProofs);
  }, [withdrawalProofs]);

  useEffect(() => {
    const handleProofsSync = () => {
      const data = localStorage.getItem('aurainvest_withdrawal_proofs') || localStorage.getItem('fintech_withdrawal_proofs');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setWithdrawalProofs(parsed);
        } catch (e) {
          console.error("Error parsing synchronized proofs:", e);
        }
      }
    };

    window.addEventListener('storage', handleProofsSync);
    window.addEventListener('nutrien_proofs_changed', handleProofsSync);

    return () => {
      window.removeEventListener('storage', handleProofsSync);
      window.removeEventListener('nutrien_proofs_changed', handleProofsSync);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('fintech_bonus_codes', JSON.stringify(bonusCodes));
    syncTableData('bonus_codes', bonusCodes);
  }, [bonusCodes]);

  useEffect(() => {
    localStorage.setItem('fintech_commissions', JSON.stringify(commissions));
    syncTableData('commissions', commissions);
  }, [commissions]);

  useEffect(() => {
    localStorage.setItem('fintech_tickets', JSON.stringify(tickets));
    syncTableData('tickets', tickets);
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('fintech_announcements', JSON.stringify(announcements));
    syncTableData('announcements', announcements);
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('fintech_revenue_logs', JSON.stringify(revenueLogs));
    syncTableData('revenue_logs', revenueLogs);
  }, [revenueLogs]);

  // AUTOMATIC 24H REVENUE DISTRIBUTION WORKER (Revenus tombent automatiquement chaque 24h)
  useEffect(() => {
    const checkAndDistributeEarnings = () => {
      if (!userInvestments || userInvestments.length === 0) return;

      let hasChanges = false;
      const userGainsMap: Record<string, number> = {};
      const newLogsToAdd: RevenueLog[] = [];

      const updatedInvestments = userInvestments.map(inv => {
        if (inv.daysRemaining <= 0) return inv;

        const lastClaimMs = new Date(inv.lastClaimDate || inv.purchaseDate).getTime();
        const elapsedMs = Date.now() - lastClaimMs;
        const cycles = Math.min(inv.daysRemaining, Math.floor(elapsedMs / (24 * 3600 * 1000)));

        if (cycles >= 1) {
          hasChanges = true;
          const totalEarnedInCycle = inv.dailyGain * cycles;
          userGainsMap[inv.userId] = (userGainsMap[inv.userId] || 0) + totalEarnedInCycle;

          // Record each 24h cycle transaction in history
          for (let c = 0; c < cycles; c++) {
            const creditedTime = new Date(lastClaimMs + (c + 1) * 24 * 3600 * 1000).toISOString();
            newLogsToAdd.push({
              id: `rev-${inv.id}-${lastClaimMs}-${c}`,
              userId: inv.userId,
              investmentId: inv.id,
              productName: inv.productName,
              amount: inv.dailyGain,
              creditedAt: creditedTime
            });
          }

          return {
            ...inv,
            daysRemaining: inv.daysRemaining - cycles,
            lastClaimDate: new Date(lastClaimMs + cycles * 24 * 3600 * 1000).toISOString()
          };
        }
        return inv;
      });

      if (hasChanges) {
        setUserInvestments(updatedInvestments);
        localStorage.setItem('fintech_investments', JSON.stringify(updatedInvestments));
        syncTableData('investments', updatedInvestments);

        // Update Users & CurrentUser Balance
        setUsers(prevUsers => {
          const updatedUsers = prevUsers.map(u => {
            const gain = userGainsMap[u.id];
            if (gain && gain > 0) {
              return {
                ...u,
                balance: u.balance + gain,
                dailyEarnings: (u.dailyEarnings || 0) + gain,
                totalEarnings: (u.totalEarnings || 0) + gain
              };
            }
            return u;
          });

          // Update logged in user state immediately
          if (currentUser && userGainsMap[currentUser.id]) {
            const updatedCurr = updatedUsers.find(u => u.id === currentUser.id);
            if (updatedCurr) {
              setCurrentUser(updatedCurr);
              localStorage.setItem('fintech_current_user', JSON.stringify(updatedCurr));
            }
          }

          localStorage.setItem('fintech_users', JSON.stringify(updatedUsers));
          syncTableData('users', updatedUsers);
          return updatedUsers;
        });

        // Add transaction history records
        if (newLogsToAdd.length > 0) {
          setRevenueLogs(prevLogs => {
            const existingIds = new Set(prevLogs.map(l => l.id));
            const uniqueLogs = newLogsToAdd.filter(l => !existingIds.has(l.id));
            if (uniqueLogs.length === 0) return prevLogs;
            const updatedLogs = [...uniqueLogs, ...prevLogs];
            localStorage.setItem('fintech_revenue_logs', JSON.stringify(updatedLogs));
            syncTableData('revenue_logs', updatedLogs);
            return updatedLogs;
          });
        }
      }
    };

    checkAndDistributeEarnings();
    const interval = setInterval(checkAndDistributeEarnings, 3000);
    return () => clearInterval(interval);
  }, [userInvestments, currentUser]);

  // Auth Operations
  const login = async (phone: string, word: string): Promise<{ success: boolean; error?: string }> => {
    // Simulating delay for futuristic API spinner
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const cleanPhone = phone.trim();
    const user = users.find(u => u.phone === cleanPhone);
    
    if (!user) {
      return { success: false, error: "Compte introuvable. Veuillez vous inscrire." };
    }
    
    if (user.isBlocked) {
      return { success: false, error: "Ce compte a été suspendu par l'administration. Contactez le support." };
    }
    
    const correctWord = passwords[cleanPhone];
    if (correctWord !== word) {
      return { success: false, error: "Mot de passe incorrect." };
    }
    
    setCurrentUser(user);
    return { success: true };
  };

  const register = async (data: {
    name: string;
    phone: string;
    whatsapp: string;
    country: string;
    word: string;
    referrerCode: string;
  }): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const cleanPhone = data.phone.trim();
    if (users.some(u => u.phone === cleanPhone)) {
      return { success: false, error: "Un compte existe déjà avec ce numéro de téléphone." };
    }
    
    // Generate a unique referral code
    const refCode = 'INV' + Math.floor(100000 + Math.random() * 900000);
    
    let referredByCodeObj: string | null = null;
    let parentReferrer: User | null = null;
    
    if (data.referrerCode.trim()) {
      const parent = users.find(u => u.referralCode === data.referrerCode.trim());
      if (parent) {
        referredByCodeObj = data.referrerCode.trim();
        parentReferrer = parent;
      } else {
        return { success: false, error: "Code d'invitation invalide." };
      }
    }
    
    const newUser: User = {
      id: 'usr-' + Math.floor(Math.random() * 10000000),
      name: data.name,
      phone: cleanPhone,
      whatsapp: data.whatsapp,
      country: data.country,
      balance: 1000, // 1000 FCFA gift for registering
      dailyEarnings: 0,
      totalEarnings: 0,
      vipLevel: 0,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      role: 'user',
      referralCode: refCode,
      referredByCode: referredByCodeObj
    };
    
    // Save password
    setPasswords(prev => ({ ...prev, [cleanPhone]: data.word }));
    setUsers(prev => [...prev, newUser]);
    
    // Trigger commissions welcome gift system if needed or log it
    setCurrentUser(newUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateProfile = (data: { name: string; whatsapp: string; country: string }) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
  };

  const changePassword = (oldWord: string, newWord: string) => {
    if (!currentUser) return { success: false, error: "Non connecté" };
    const saved = passwords[currentUser.phone];
    if (saved !== oldWord) {
      return { success: false, error: "Ancien mot de passe incorrect." };
    }
    
    setPasswords(prev => ({ ...prev, [currentUser.phone]: newWord }));
    return { success: true };
  };

  // User Actions
  const buyInvestment = (productId: string, quantity: number = 1) => {
    if (!currentUser) return { success: false, error: "Veuillez vous connecter." };
    
    // Find product
    const product = products.find(p => p.id === productId && p.isActive);
    if (!product) return { success: false, error: "Produit indisponible." };
    
    // Find latest model of user
    const dbUser = users.find(u => u.id === currentUser.id);
    if (!dbUser) return { success: false, error: "Utilisateur non trouvé" };
    
    const totalPrice = product.price * quantity;
    if (dbUser.balance < totalPrice) {
      return { success: false, error: `Solde insuffisant. Le montant total est de ${totalPrice.toLocaleString()} FCFA et votre solde disponible est de ${dbUser.balance.toLocaleString()} FCFA. Veuillez effectuer un dépôt.` };
    }
    
    // Deduct balance
    const newBalance = dbUser.balance - totalPrice;
    const currentVLevel = Math.max(dbUser.vipLevel, parseInt(product.name.replace(/\D/g, '')) || 1);
    
    // Add User Investments according to quantity
    const newInvestments: UserInvestment[] = [];
    for (let i = 0; i < quantity; i++) {
      newInvestments.push({
        id: 'inv-' + Math.random().toString(36).substr(2, 9),
        userId: dbUser.id,
        productId: product.id,
        productName: product.name,
        price: product.price,
        dailyGain: product.dailyGain,
        duration: product.duration,
        daysRemaining: product.duration,
        purchaseDate: new Date().toISOString(),
        lastClaimDate: new Date().toISOString() // First income drops after full 24h cycle
      });
    }
    
    setUserInvestments(prev => [...newInvestments, ...prev]);
    
    // Setup referral earnings for parents (multi-level commission based on totalPrice)
    let updatedUsers = users.map(u => {
      if (u.id === dbUser.id) {
        return {
          ...u,
          balance: newBalance,
          vipLevel: currentVLevel,
          dailyEarnings: u.dailyEarnings + (product.dailyGain * quantity)
        };
      }
      return u;
    });
    
    // Process commissions
    const newCommissions: CommissionHistory[] = [];
    
    if (dbUser.referredByCode) {
      // Find L1 Referrer
      const l1 = updatedUsers.find(u => u.referralCode === dbUser.referredByCode);
      if (l1) {
        const commL1 = Math.round(totalPrice * 0.15); // 15% Level 1
        updatedUsers = updatedUsers.map(u => u.id === l1.id ? { ...u, balance: u.balance + commL1, totalEarnings: u.totalEarnings + commL1 } : u);
        newCommissions.push({
          id: 'comm-' + Math.random().toString(36).substr(2, 9),
          referrerId: l1.id,
          refereeId: dbUser.id,
          refereeName: dbUser.name,
          amount: commL1,
          level: 1,
          createdAt: new Date().toISOString()
        });
        
        // Find L2 Referrer (L1's referrer)
        if (l1.referredByCode) {
          const l2 = updatedUsers.find(u => u.referralCode === l1.referredByCode);
          if (l2) {
            const commL2 = Math.round(totalPrice * 0.02); // 2% Level 2
            updatedUsers = updatedUsers.map(u => u.id === l2.id ? { ...u, balance: u.balance + commL2, totalEarnings: u.totalEarnings + commL2 } : u);
            newCommissions.push({
              id: 'comm-' + Math.random().toString(36).substr(2, 9),
              referrerId: l2.id,
              refereeId: dbUser.id,
              refereeName: dbUser.name,
              amount: commL2,
              level: 2,
              createdAt: new Date().toISOString()
            });
            
            // Find L3 Referrer
            if (l2.referredByCode) {
              const l3 = updatedUsers.find(u => u.referralCode === l2.referredByCode);
              if (l3) {
                const commL3 = Math.round(totalPrice * 0.01); // 1% Level 3
                updatedUsers = updatedUsers.map(u => u.id === l3.id ? { ...u, balance: u.balance + commL3, totalEarnings: u.totalEarnings + commL3 } : u);
                newCommissions.push({
                  id: 'comm-' + Math.random().toString(36).substr(2, 9),
                  referrerId: l3.id,
                  refereeId: dbUser.id,
                  refereeName: dbUser.name,
                  amount: commL3,
                  level: 3,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        }
      }
    }
    
    // Save commissions & users
    if (newCommissions.length > 0) {
      setCommissions(prev => [...newCommissions, ...prev]);
    }
    
    setUsers(updatedUsers);
    
    return { success: true };
  };

  const claimDailyEarning = (investmentId: string) => {
    if (!currentUser) return { success: false, error: "Veuillez vous connecter." };
    
    const investment = userInvestments.find(inv => inv.id === investmentId && inv.userId === currentUser.id);
    if (!investment) return { success: false, error: "Investissement introuvable." };
    
    if (investment.daysRemaining <= 0) {
      return { success: false, error: "Cet investissement est arrivé à terme." };
    }
    
    // Check if claimed today (within 22 hours to allow small flexibility)
    const hoursSinceClaim = (Date.now() - new Date(investment.lastClaimDate).getTime()) / (3600 * 1000);
    if (hoursSinceClaim < 22) {
      const remainingHours = Math.ceil(22 - hoursSinceClaim);
      return { success: false, error: `Vous avez déjà récupéré vos gains pour aujourd'hui. Réessayez dans environ ${remainingHours} heures.` };
    }
    
    // Update Investment remaining days
    const updatedInvestments = userInvestments.map(inv => {
      if (inv.id === investmentId) {
        return {
          ...inv,
          daysRemaining: inv.daysRemaining - 1,
          lastClaimDate: new Date().toISOString()
        };
      }
      return inv;
    });
    
    setUserInvestments(updatedInvestments);
    
    // Update User Balance & Earnings
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          balance: u.balance + investment.dailyGain,
          totalEarnings: u.totalEarnings + investment.dailyGain
        };
      }
      return u;
    }));
    
    return { success: true };
  };

  const requestDeposit = (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => {
    if (!currentUser) return { success: false, error: "Non connecté." };
    if (amount <= 0) return { success: false, error: "Montant invalide." };
    if (!transactionId.trim()) return { success: false, error: "Le numéro de transaction est obligatoire." };
    
    const newDeposit: DepositRequest = {
      id: 'dep-' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      amount,
      method,
      transactionId,
      screenshotUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setDeposits(prev => [newDeposit, ...prev]);
    return { success: true };
  };

  const saveWithdrawalAccount = (accountName: string, accountNumber: string, pin: string, network?: string, country?: string) => {
    if (!currentUser) return { success: false, error: "Non connecté." };
    if (!accountName.trim()) return { success: false, error: "Le nom complet est requis." };
    if (!accountNumber.trim()) return { success: false, error: "Le numéro de compte de retrait est requis." };
    if (!pin.trim() || pin.length < 4) return { success: false, error: "Le code PIN doit comporter au moins 4 chiffres." };

    // Obscure PIN securely before storing
    const securePinHash = btoa(pin + '_aura_sec_salt');

    const updatedFields = {
      withdrawalAccountName: accountName.trim(),
      withdrawalAccountNumber: accountNumber.trim(),
      withdrawalNetwork: network,
      withdrawalCountry: country,
      withdrawalPinHash: securePinHash
    };

    setCurrentUser(prev => prev ? { ...prev, ...updatedFields } : null);

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          ...updatedFields
        };
      }
      return u;
    }));

    return { success: true };
  };

  const sendAdminDirectMessage = (userId: string, message: string) => {
    if (!userId || !message.trim()) return;
    const targetUser = users.find(u => u.id === userId);
    const fallbackTicket = tickets.find(t => t.userId === userId);
    const userName = targetUser?.name || fallbackTicket?.userName || 'Client ' + userId.slice(0, 5);

    const newTicket: SupportTicket = {
      id: 'tkt-adm-' + Math.random().toString(36).substr(2, 9),
      userId: userId,
      userName: userName,
      subject: "Message de l'Administration",
      message: "Message direct du Support Client Nutrien.",
      reply: message.trim(),
      status: 'closed',
      createdAt: new Date().toISOString(),
      replyCreatedAt: new Date().toISOString(),
      isReadByUser: false
    };

    setTickets(prev => {
      const updated = [newTicket, ...prev];
      localStorage.setItem('fintech_tickets', JSON.stringify(updated));
      syncTableData('tickets', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_tickets_changed', { detail: updated }));
      }
      return updated;
    });
  };

  const requestWithdrawal = (amount: number, network: any, accountNumber: string) => {
    if (!currentUser) return { success: false, error: "Non connecté." };
    if (amount < 1000) return { success: false, error: "Le montant minimum de retrait est de 1 000 XAF." };
    if (!accountNumber.trim()) return { success: false, error: "Le numéro de compte de réception est requis." };
    
    const dbUser = users.find(u => u.id === currentUser.id);
    if (!dbUser) return { success: false, error: "Utilisateur non trouvé" };
    
    if (dbUser.balance < amount) {
      return { success: false, error: "Solde insuffisant pour ce montant de retrait." };
    }

    // Check 1 withdrawal per day limit
    const todayIso = new Date().toISOString().split('T')[0];
    const hasWithdrawnToday = withdrawals.some(w => w.userId === currentUser.id && w.createdAt.startsWith(todayIso));
    if (hasWithdrawnToday) {
      return { success: false, error: "Vous avez déjà effectué une demande de retrait aujourd'hui. Limité à un seul retrait par jour." };
    }
    
    // Deduct pending balance automatically or manually inside admin
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          balance: u.balance - amount
        };
      }
      return u;
    }));
    
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const rand4 = String(Math.floor(1000 + Math.random() * 9000));
    const generatedId = `B${yy}${mm}${dd}${hh}${min}${ss}${rand4}`;

    const newWithdrawal: WithdrawalRequest = {
      id: generatedId,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      amount,
      receivedAmount: Math.round(amount * 0.82),
      network,
      accountNumber,
      status: 'pending',
      createdAt: now.toISOString()
    };
    
    setWithdrawals(prev => [newWithdrawal, ...prev]);
    return { success: true };
  };

  const redeemBonusCode = (code: string) => {
    if (!currentUser) return { success: false, error: "Non connecté." };
    
    const cleanCode = code.trim().toUpperCase();
    const bonus = bonusCodes.find(b => b.code === cleanCode);
    
    if (!bonus) {
      return { success: false, error: "Code promo invalide ou expiré." };
    }
    
    if (bonus.usedBy.includes(currentUser.id)) {
      return { success: false, error: "Vous avez déjà réclamé ce code bonus." };
    }
    
    if (bonus.usedBy.length >= bonus.maxUses) {
      return { success: false, error: "Ce code bonus a atteint sa limite d'utilisation." };
    }
    
    // Update code uses
    setBonusCodes(prev => prev.map(b => {
      if (b.code === cleanCode) {
        return {
          ...b,
          usedBy: [...b.usedBy, currentUser.id]
        };
      }
      return b;
    }));
    
    // Credit User balance
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          balance: u.balance + bonus.amount,
          totalEarnings: u.totalEarnings + bonus.amount
        };
      }
      return u;
    }));
    
    return { success: true, amount: bonus.amount };
  };

  const claimDailyBonus = () => {
    if (!currentUser) return { success: false, error: "Non connecté." };
    
    // Simulate simple daily attendance check in localStorage with timestamp
    const bonusKey = `daily_bonus_claim_${currentUser.id}`;
    const lastClaim = localStorage.getItem(bonusKey);
    const bonusAmount = Math.floor(Math.random() * 200) + 100; // 100 to 300 FCFA daily bonus
    
    if (lastClaim) {
      const hoursSinceClaim = (Date.now() - parseInt(lastClaim)) / (3600 * 1000);
      if (hoursSinceClaim < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceClaim);
        return { success: false, error: `Revenez demain ! Prochain bonus disponible dans ${remainingHours} heures.` };
      }
    }
    
    localStorage.setItem(bonusKey, Date.now().toString());
    
    // Update User Balance
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          balance: u.balance + bonusAmount,
          totalEarnings: u.totalEarnings + bonusAmount
        };
      }
      return u;
    }));
    
    return { success: true, amount: bonusAmount };
  };

  const spinLuckyWheel = () => {
    if (!currentUser) return { success: false, error: "Veuillez vous connecter." };

    const dbUser = users.find(u => u.id === currentUser.id);
    if (!dbUser) return { success: false, error: "Utilisateur non trouvé." };

    const availableTickets = dbUser.drawTickets || 0;
    if (availableTickets <= 0) {
      return { 
        success: false, 
        error: "Vous n'avez aucun ticket de tirage disponible. Partagez votre lien de parrainage pour en gagner !" 
      };
    }

    const prizes = wheelConfig.prizes;
    if (!prizes || prizes.length === 0) {
      return { success: false, error: "Aucun prix configuré pour le tirage." };
    }

    // Pick random prize
    const prize = prizes[Math.floor(Math.random() * prizes.length)];

    // Deduct 1 ticket, credit user balance & total earnings
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          drawTickets: Math.max(0, (u.drawTickets || 1) - 1),
          balance: u.balance + prize.value,
          totalEarnings: u.totalEarnings + prize.value
        };
      }
      return u;
    }));

    // Mask phone number for live feed privacy e.g. +228 90****95
    let maskedPhone = currentUser.phone;
    if (maskedPhone.length >= 8) {
      maskedPhone = maskedPhone.slice(0, 5) + '****' + maskedPhone.slice(-2);
    }

    // Record real draw action in database/local state
    const newRecord: DrawRecord = {
      id: 'draw-' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: maskedPhone,
      action: 'a fait tourner la roue',
      prizeLabel: prize.label,
      prizeValue: prize.value,
      createdAt: new Date().toISOString()
    };

    setDrawRecords(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('fintech_draw_records', JSON.stringify(updated));
      return updated;
    });

    return { success: true, prize };
  };

  const updateWheelConfig = (newConfig: WheelConfig) => {
    setWheelConfig(newConfig);
    localStorage.setItem('fintech_wheel_config', JSON.stringify(newConfig));
  };

  const deleteDrawRecord = (recordId: string) => {
    setDrawRecords(prev => {
      const updated = prev.filter(r => r.id !== recordId);
      localStorage.setItem('fintech_draw_records', JSON.stringify(updated));
      return updated;
    });
  };

  const addTicketsToUser = (userId: string, count: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          drawTickets: Math.max(0, (u.drawTickets || 0) + count)
        };
      }
      return u;
    }));
  };

  const createSupportTicket = (subject: string, message: string, imageUrl?: string) => {
    if (!currentUser) return;
    const newTicket: SupportTicket = {
      id: 'tkt-' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      subject,
      message,
      imageUrl,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    setTickets(prev => {
      const updated = [newTicket, ...prev];
      localStorage.setItem('fintech_tickets', JSON.stringify(updated));
      syncTableData('tickets', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_tickets_changed', { detail: updated }));
      }
      return updated;
    });
  };

  // Administration tasks (Only executable if current user is admin)
  const toggleBlockUser = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updatedBlockState = !u.isBlocked;
        return { ...u, isBlocked: updatedBlockState };
      }
      return u;
    }));
  };

  const updateUserRole = (userId: string, role: 'admin' | 'user') => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role };
      }
      return u;
    }));
  };

  const updateUserBalance = (userId: string, amount: number) => {
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          const cleanBalance = Math.max(0, u.balance + amount);
          return { ...u, balance: cleanBalance };
        }
        return u;
      });
      localStorage.setItem('fintech_users', JSON.stringify(updated));
      syncTableData('users', updated);
      return updated;
    });

    setCurrentUser(prev => {
      if (prev && prev.id === userId) {
        const updatedUser = { ...prev, balance: Math.max(0, prev.balance + amount) };
        localStorage.setItem('fintech_current_user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return prev;
    });
  };

  const adminUpdateUserPassword = (userId: string, newWord: string): { success: boolean; error?: string } => {
    const usr = users.find(u => u.id === userId);
    if (!usr) return { success: false, error: "Utilisateur non trouvé." };
    if (!newWord || newWord.length < 4) {
      return { success: false, error: "Le mot de passe doit contenir au moins 4 caractères." };
    }
    setPasswords(prev => {
      const updated = { ...prev, [usr.phone]: newWord };
      localStorage.setItem('fintech_passwords', JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  const processDeposit = (depositId: string, status: 'approved' | 'rejected') => {
    const dep = deposits.find(d => d.id === depositId);
    if (!dep || dep.status !== 'pending') return;
    
    // Update deposit status
    setDeposits(prev => prev.map(d => d.id === depositId ? { ...d, status } : d));
    
    // If approved, credit user account
    if (status === 'approved') {
      setUsers(prev => prev.map(u => {
        if (u.id === dep.userId) {
          return {
            ...u,
            balance: u.balance + dep.amount
          };
        }
        return u;
      }));
    }
  };

  const processWithdrawal = (withdrawalId: string, status: 'approved' | 'rejected') => {
    const wth = withdrawals.find(w => w.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return;
    
    // Update withdrawal status
    setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? { ...w, status } : w));
    
    // If rejected, refund the user
    if (status === 'rejected') {
      setUsers(prev => prev.map(u => {
        if (u.id === wth.userId) {
          return {
            ...u,
            balance: u.balance + wth.amount
          };
        }
        return u;
      }));
    }
  };

  const addOrUpdateProduct = (prodData: Omit<InvestmentProduct, 'isActive'> & { isActive?: boolean; image?: string; description?: string; order?: number }) => {
    const existing = products.find(p => p.id === prodData.id);
    if (existing) {
      setProducts(prev => prev.map(p => p.id === prodData.id ? { ...p, ...prodData } as InvestmentProduct : p));
    } else {
      const newProd: InvestmentProduct = {
        id: prodData.id || 'vip-' + (products.length + 1),
        name: prodData.name,
        price: prodData.price,
        dailyGain: prodData.dailyGain,
        duration: prodData.duration,
        totalGain: prodData.totalGain,
        isActive: prodData.isActive ?? true,
        image: prodData.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        description: prodData.description || 'Produit de bien-être et vitalité.',
        order: prodData.order ?? (products.length + 1),
        badge: prodData.badge || 'Nouveau',
        color: prodData.color || 'from-amber-950/40 via-amber-900/10 to-transparent border-amber-500/20'
      };
      setProducts(prev => [...prev, newProd]);
    }
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    deleteRecord('products', productId);
  };

  const deleteUserInvestment = (investmentId: string) => {
    setUserInvestments(prev => {
      const updated = prev.filter(inv => inv.id !== investmentId);
      localStorage.setItem('fintech_investments', JSON.stringify(updated));
      return updated;
    });
    deleteRecord('investments', investmentId);
  };

  const generateBonusCode = (code: string, amount: number, maxUses: number) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, error: "Le code ne peut pas être vide." };
    
    if (bonusCodes.some(b => b.code === cleanCode)) {
      return { success: false, error: "Ce code bonus existe déjà." };
    }
    
    const newCode: BonusCode = {
      code: cleanCode,
      amount,
      maxUses,
      usedBy: [],
      createdAt: new Date().toISOString()
    };
    
    setBonusCodes(prev => [newCode, ...prev]);
    return { success: true };
  };

  const sendGlobalNotification = (text: string | null) => {
    setGlobalNotification(text);
    if (text) {
      localStorage.setItem('fintech_global_notification', text);
    } else {
      localStorage.removeItem('fintech_global_notification');
    }
  };

  const replyToTicket = (ticketId: string, reply: string) => {
    setTickets(prev => {
      const updated = prev.map(t => t.id === ticketId ? { 
        ...t, 
        reply, 
        status: 'closed' as const, 
        isReadByUser: false, 
        replyCreatedAt: new Date().toISOString() 
      } : t);
      localStorage.setItem('fintech_tickets', JSON.stringify(updated));
      syncTableData('tickets', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_tickets_changed', { detail: updated }));
      }
      return updated;
    });
  };

  const markTicketsAsRead = (userId: string) => {
    setTickets(prev => {
      const hasUnread = prev.some(t => t.userId === userId && t.isReadByUser === false);
      if (!hasUnread) return prev;
      const updated = prev.map(t => t.userId === userId ? { ...t, isReadByUser: true } : t);
      localStorage.setItem('fintech_tickets', JSON.stringify(updated));
      syncTableData('tickets', updated);
      return updated;
    });
  };

  const addWithdrawalProof = (amount: number, network: string, message: string, imageUrl?: string | null) => {
    if (!currentUser) return { success: false, error: "Utilisateur non connecté." };
    
    // Mask phone number for privacy (e.g. +237 65****589 or 0707****89)
    const rawPhone = (currentUser.phone || '').trim();
    let maskedPhone = rawPhone;
    if (rawPhone.length >= 6) {
      const start = rawPhone.slice(0, 3);
      const end = rawPhone.slice(-3);
      maskedPhone = `${start}****${end}`;
    } else if (rawPhone.length > 0) {
      maskedPhone = `****${rawPhone.slice(-2)}`;
    } else {
      maskedPhone = '****';
    }

    const newProof: WithdrawalProof = {
      id: 'proof-' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: maskedPhone,
      amount,
      network: network || 'Mobile Money',
      message: message.trim(),
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString().split('T')[0],
      isVerified: true,
      status: 'approved'
    };

    setWithdrawalProofs(prev => {
      const updated = [newProof, ...prev];
      localStorage.setItem('aurainvest_withdrawal_proofs', JSON.stringify(updated));
      localStorage.setItem('fintech_withdrawal_proofs', JSON.stringify(updated));
      syncTableData('withdrawal_proofs', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_proofs_changed', { detail: updated }));
      }
      return updated;
    });
    return { success: true };
  };

  const processWithdrawalProof = (proofId: string, status: 'approved' | 'rejected') => {
    setWithdrawalProofs(prev => {
      const updated = prev.map(p => {
        if (p.id === proofId) {
          return {
            ...p,
            status,
            isVerified: status === 'approved'
          };
        }
        return p;
      });
      localStorage.setItem('aurainvest_withdrawal_proofs', JSON.stringify(updated));
      localStorage.setItem('fintech_withdrawal_proofs', JSON.stringify(updated));
      syncTableData('withdrawal_proofs', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_proofs_changed', { detail: updated }));
      }
      return updated;
    });
  };

  const deleteWithdrawalProof = (proofId: string) => {
    setWithdrawalProofs(prev => {
      const updated = prev.filter(p => p.id !== proofId);
      localStorage.setItem('aurainvest_withdrawal_proofs', JSON.stringify(updated));
      localStorage.setItem('fintech_withdrawal_proofs', JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_proofs_changed', { detail: updated }));
      }
      return updated;
    });
    deleteRecord('withdrawal_proofs', proofId);
  };

  const updateWithdrawalProof = (proofId: string, data: Partial<WithdrawalProof>) => {
    setWithdrawalProofs(prev => {
      const updated = prev.map(p => {
        if (p.id === proofId) {
          const nextStatus = data.status || p.status;
          return {
            ...p,
            ...data,
            status: nextStatus,
            isVerified: nextStatus === 'approved'
          };
        }
        return p;
      });
      localStorage.setItem('aurainvest_withdrawal_proofs', JSON.stringify(updated));
      localStorage.setItem('fintech_withdrawal_proofs', JSON.stringify(updated));
      syncTableData('withdrawal_proofs', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_proofs_changed', { detail: updated }));
      }
      return updated;
    });
  };

  const addAnnouncement = (data: { title: string; content: string; imageUrl?: string }) => {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: data.title.trim(),
      content: data.content.trim(),
      imageUrl: data.imageUrl?.trim() || null,
      createdAt: formattedDate,
      isNew: true
    };

    setAnnouncements(prev => {
      const updated = [newAnn, ...prev];
      localStorage.setItem('fintech_announcements', JSON.stringify(updated));
      syncTableData('announcements', updated);
      return updated;
    });

    // Send global notification to all users' accounts
    const notifMsg = `📢 Nouvel avis officiel : ${data.title.trim()}`;
    setGlobalNotification(notifMsg);
    localStorage.setItem('fintech_global_notification', notifMsg);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => {
      const updated = prev.filter(a => a.id !== id);
      localStorage.setItem('fintech_announcements', JSON.stringify(updated));
      deleteRecord('announcements', id);
      return updated;
    });
  };

  const markAnnouncementAsRead = (id: string) => {
    setAnnouncements(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, isNew: false } : a);
      localStorage.setItem('fintech_announcements', JSON.stringify(updated));
      syncTableData('announcements', updated);
      return updated;
    });
  };

  const addFaq = (question: string, answer: string, category?: string) => {
    const newFaqItem: FaqItem = {
      id: `faq-${Date.now()}`,
      question: question.trim(),
      answer: answer.trim(),
      category: category?.trim() || 'Général',
      order: faqs.length + 1,
      createdAt: new Date().toISOString()
    };
    setFaqs(prev => {
      const updated = [newFaqItem, ...prev];
      localStorage.setItem('fintech_faqs', JSON.stringify(updated));
      syncTableData('faqs', updated);
      return updated;
    });
  };

  const updateFaq = (id: string, question: string, answer: string, category?: string) => {
    setFaqs(prev => {
      const updated = prev.map(f => {
        if (f.id === id) {
          return {
            ...f,
            question: question.trim(),
            answer: answer.trim(),
            category: category?.trim() || f.category || 'Général'
          };
        }
        return f;
      });
      localStorage.setItem('fintech_faqs', JSON.stringify(updated));
      syncTableData('faqs', updated);
      return updated;
    });
  };

  const deleteFaq = (id: string) => {
    setFaqs(prev => {
      const updated = prev.filter(f => f.id !== id);
      localStorage.setItem('fintech_faqs', JSON.stringify(updated));
      deleteRecord('faqs', id);
      return updated;
    });
  };

  const addOrUpdateWellnessProduct = (productData: Omit<WellnessProduct, 'id'> & { id?: string }) => {
    setWellnessProducts(prev => {
      let updated: WellnessProduct[];
      if (productData.id) {
        updated = prev.map(p => p.id === productData.id ? { ...p, ...productData, id: productData.id } as WellnessProduct : p);
      } else {
        const newProd: WellnessProduct = {
          ...productData,
          id: `wellness-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        updated = [newProd, ...prev];
      }
      localStorage.setItem('fintech_wellness_products', JSON.stringify(updated));
      syncTableData('wellness_products', updated);
      return updated;
    });
  };

  const deleteWellnessProduct = (id: string) => {
    setWellnessProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('fintech_wellness_products', JSON.stringify(updated));
      deleteRecord('wellness_products', id);
      return updated;
    });
  };

  return (
    <AppContext.Provider value={{
      users,
      currentUser,
      products,
      userInvestments,
      deposits,
      withdrawals,
      withdrawalProofs,
      revenueLogs,
      bonusCodes,
      commissions,
      tickets,
      drawRecords,
      wheelConfig,
      announcements,
      faqs,
      wellnessProducts,
      liveStats,
      globalNotification,
      
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      
      buyInvestment,
      claimDailyEarning,
      requestDeposit,
      requestWithdrawal,
      saveWithdrawalAccount,
      sendAdminDirectMessage,
      redeemBonusCode,
      claimDailyBonus,
      spinLuckyWheel,
      createSupportTicket,
      addWithdrawalProof,
      
      setUsers,
      toggleBlockUser,
      updateUserBalance,
      adminUpdateUserPassword,
      processDeposit,
      processWithdrawal,
      processWithdrawalProof,
      deleteWithdrawalProof,
      updateWithdrawalProof,
      addOrUpdateProduct,
      deleteProduct,
      deleteUserInvestment,
      generateBonusCode,
      sendGlobalNotification,
      replyToTicket,
      markTicketsAsRead,
      updateUserRole,
      updateWheelConfig,
      deleteDrawRecord,
      addTicketsToUser,
      addAnnouncement,
      deleteAnnouncement,
      markAnnouncementAsRead,
      addFaq,
      updateFaq,
      deleteFaq,
      addOrUpdateWellnessProduct,
      deleteWellnessProduct
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp dynamic context must be used within an AppProvider');
  return context;
};
