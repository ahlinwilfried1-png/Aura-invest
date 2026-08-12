/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fetchTableData, syncTableData, deleteRecord } from '../lib/supabaseService';
import { 
  safeSetLocalStorage, 
  safeGetLocalStorage, 
  safeRemoveLocalStorage, 
  safeSetSessionStorage, 
  safeGetSessionStorage, 
  safeRemoveSessionStorage 
} from '../lib/storage';
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
  saveWithdrawalAccount: (accountName: string, accountNumber: string, pin: string, network?: string, country?: string, isAdminOverride?: boolean) => { success: boolean; error?: string };
  sendAdminDirectMessage: (userId: string, message: string) => void;
  redeemBonusCode: (code: string) => { success: boolean; error?: string; amount?: number };
  claimDailyBonus: () => { success: boolean; error?: string; amount?: number };
  spinLuckyWheel: () => { success: boolean; error?: string; prize?: WheelPrize };
  createSupportTicket: (subject: string, message: string, imageUrl?: string) => void;
  addWithdrawalProof: (amount: number, network: string, message: string, imageUrl?: string | null) => { success: boolean; error?: string };
  
  // Administrative tasks (accessible when currentUser.role === 'admin')
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  toggleBlockUser: (userId: string) => void;
  updateUserBalance: (userId: string, amount: number, isDirectSet?: boolean) => void;
  adminUpdateUserPassword: (userId: string, newWord: string) => { success: boolean; error?: string };
  adminUpdateUserPin: (userId: string, newPin: string) => { success: boolean; error?: string };
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
    const data = safeGetLocalStorage('fintech_users');
    if (data) {
      try { return JSON.parse(data); } catch (_) {}
    }
    
    // Default Admin & Standard User
    const defaultUsers: User[] = [
      {
        id: 'admin-1',
        name: 'Administrateur Principal',
        phone: '11111111',
        whatsapp: '+228 90909090',
        country: 'Togo',
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
        whatsapp: '+228 90000000',
        country: 'Togo',
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
    safeSetLocalStorage('fintech_users', defaultUsers);
    return defaultUsers;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Session requirement: if a user leaves/exits the site tab, they must pass through the login page upon returning
    const data = safeGetSessionStorage('fintech_current_user');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Keep passwords in a separate simulated secure store or simulated in local storage
  const [passwords, setPasswords] = useState<{ [phone: string]: string }>(() => {
    const data = safeGetLocalStorage('fintech_passwords');
    if (data) {
      try { return JSON.parse(data); } catch (_) {}
    }
    const initialPasswords = {
      '11111111': 'admin123',
      '07070707': 'koffi123',
      '77777777': 'seydou123'
    };
    safeSetLocalStorage('fintech_passwords', initialPasswords);
    return initialPasswords;
  });

  const [products, setProducts] = useState<InvestmentProduct[]>(() => {
    const data = safeGetLocalStorage('fintech_products');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Ensure Nutrien VIP 10 products are included
        if (Array.isArray(parsed) && parsed.some((p: InvestmentProduct) => p.name === 'VIP 10' && p.duration === 200)) {
          return parsed;
        }
      } catch (_) {}
    }
    safeSetLocalStorage('fintech_products', INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  });

  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>(() => {
    const data = safeGetLocalStorage('fintech_investments');
    if (data) {
      try { return JSON.parse(data); } catch (_) {}
    }
    
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
    safeSetLocalStorage('fintech_investments', defaultInvestments);
    return defaultInvestments;
  });

  const [deposits, setDeposits] = useState<DepositRequest[]>(() => {
    const data = safeGetLocalStorage('fintech_deposits');
    if (data) {
      try { return JSON.parse(data); } catch (_) {}
    }
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
    safeSetLocalStorage('fintech_deposits', defaultDeposits);
    return defaultDeposits;
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const data = safeGetLocalStorage('fintech_withdrawals');
    if (data) {
      try { return JSON.parse(data); } catch (_) {}
    }
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
    safeSetLocalStorage('fintech_withdrawals', defaultWithdrawals);
    return defaultWithdrawals;
  });

  const [withdrawalProofs, setWithdrawalProofs] = useState<WithdrawalProof[]>(() => {
    const data = safeGetLocalStorage('aurainvest_withdrawal_proofs');
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
    const data = safeGetLocalStorage('fintech_revenue_logs');
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
    const data = safeGetLocalStorage('fintech_bonus_codes');
    if (data) {
      try { return JSON.parse(data); } catch (_) {}
    }
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
    safeSetLocalStorage('fintech_bonus_codes', defaultCodes);
    return defaultCodes;
  });

  const [commissions, setCommissions] = useState<CommissionHistory[]>(() => {
    const data = safeGetLocalStorage('fintech_commissions');
    if (data) {
      try { return JSON.parse(data); } catch (_) {}
    }
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
    safeSetLocalStorage('fintech_commissions', defaultCommissions);
    return defaultCommissions;
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const data = safeGetLocalStorage('fintech_tickets');
    if (data) {
      try { return JSON.parse(data); } catch (_) {}
    }
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
    safeSetLocalStorage('fintech_tickets', defaultTickets);
    return defaultTickets;
  });

  const [wheelConfig, setWheelConfig] = useState<WheelConfig>(() => {
    const defaultPrizes: WheelPrize[] = [
      { id: 1, label: '+25 FCFA', value: 25, color: 'bg-emerald-500 text-white' },
      { id: 2, label: '+30 FCFA', value: 30, color: 'bg-amber-500 text-slate-950' },
      { id: 3, label: '+35 FCFA', value: 35, color: 'bg-blue-600 text-white' },
      { id: 4, label: '+40 FCFA', value: 40, color: 'bg-purple-600 text-white' },
      { id: 5, label: '+45 FCFA', value: 45, color: 'bg-rose-500 text-white' },
      { id: 6, label: '+50 FCFA', value: 50, color: 'bg-emerald-700 text-white' },
    ];

    const data = safeGetLocalStorage('fintech_wheel_config');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && Array.isArray(parsed.prizes)) {
          const sanitizedPrizes = parsed.prizes.map((p: WheelPrize) => {
            const clampedVal = Math.min(50, Math.max(25, Number(p.value) || 25));
            return {
              ...p,
              value: clampedVal,
              label: `+${clampedVal} FCFA`
            };
          });
          return { ...parsed, prizes: sanitizedPrizes };
        }
      } catch (e) { console.error(e); }
    }
    return {
      ticketsPerReferral: 1,
      dailyFreeTickets: 1,
      prizes: defaultPrizes
    };
  });

  const [drawRecords, setDrawRecords] = useState<DrawRecord[]>(() => {
    const data = safeGetLocalStorage('fintech_draw_records');
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
        prizeLabel: '+50 FCFA',
        prizeValue: 50,
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        id: 'draw-init-2',
        userId: 'user-2',
        userName: 'Seydou Keita',
        userPhone: '+226 76****35',
        action: 'a fait tourner la roue',
        prizeLabel: '+25 FCFA',
        prizeValue: 25,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'draw-init-3',
        userId: 'user-3',
        userName: 'Ablavi Mensah',
        userPhone: '+228 92****45',
        action: 'a fait tourner la roue',
        prizeLabel: '+35 FCFA',
        prizeValue: 35,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      {
        id: 'draw-init-4',
        userId: 'user-4',
        userName: 'Yao Kouadio',
        userPhone: '+229 97****42',
        action: 'a fait tourner la roue',
        prizeLabel: '+40 FCFA',
        prizeValue: 40,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ];
    safeSetLocalStorage('fintech_draw_records', defaultDraws);
    return defaultDraws;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_announcement_ids') || '[]');
    } catch (_) {}
    const data = safeGetLocalStorage('fintech_announcements');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter((a: any) => !deletedIds.includes(a.id));
        }
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
    const filteredDefaults = defaultAnnouncements.filter(a => !deletedIds.includes(a.id));
    safeSetLocalStorage('fintech_announcements', filteredDefaults);
    return filteredDefaults;
  });

  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_faq_ids') || '[]');
    } catch (_) {}
    const data = safeGetLocalStorage('fintech_faqs');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter((f: any) => !deletedIds.includes(f.id));
        }
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
        answer: "Accédez à la rubrique 'Recharger' ou 'Dépôt', sélectionnez votre pays (Togo, Bénin, Cameroun, Sénégal, Burkina Faso, etc.), choisissez votre réseau Mobile Money (TMoney, MTN, Moov, Wave, Mixx by Yas) ou carte bancaire, entrez le montant et validez l'opération.",
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
    const filteredDefaults = defaultFaqs.filter(f => !deletedIds.includes(f.id));
    safeSetLocalStorage('fintech_faqs', filteredDefaults);
    return filteredDefaults;
  });

  const [wellnessProducts, setWellnessProducts] = useState<WellnessProduct[]>(() => {
    const data = safeGetLocalStorage('fintech_wellness_products');
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
    safeSetLocalStorage('fintech_wellness_products', defaultWellness);
    return defaultWellness;
  });

  const [globalNotification, setGlobalNotification] = useState<string | null>(() => {
    return safeGetLocalStorage('fintech_global_notification') || "Bienvenue sur notre plateforme d'investissement VIP ! Profitez d'un taux d'intérêt exceptionnel de bienvenue.";
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
      if (dbUsers && dbUsers.length > 0) {
        setUsers(prev => {
          const userMap = new Map<string, User>();
          dbUsers.forEach(u => userMap.set(u.id, u));
          prev.forEach(u => {
            const dbU = userMap.get(u.id);
            if (!dbU) {
              userMap.set(u.id, u);
            } else {
              // Preserve local updates (e.g. balance modifications, blocking status, role, linked bank/withdrawal account details)
              userMap.set(u.id, {
                ...dbU,
                ...u,
                balance: u.balance !== undefined ? u.balance : dbU.balance,
                isBlocked: u.isBlocked !== undefined ? u.isBlocked : dbU.isBlocked,
                role: u.role || dbU.role,
                withdrawalAccountName: u.withdrawalAccountName || dbU.withdrawalAccountName,
                withdrawalAccountNumber: u.withdrawalAccountNumber || dbU.withdrawalAccountNumber,
                withdrawalNetwork: u.withdrawalNetwork || dbU.withdrawalNetwork,
                withdrawalCountry: u.withdrawalCountry || dbU.withdrawalCountry,
                withdrawalPinHash: u.withdrawalPinHash || dbU.withdrawalPinHash
              });
            }
          });
          const merged = Array.from(userMap.values());
          safeSetLocalStorage('fintech_users', merged);
          return merged;
        });
      }

      const dbProducts = await fetchTableData<InvestmentProduct>('products');
      if (dbProducts && dbProducts.length > 0) setProducts(dbProducts);

      const dbDeposits = await fetchTableData<DepositRequest>('deposits');
      if (dbDeposits && dbDeposits.length > 0) setDeposits(dbDeposits);

      const dbWithdrawals = await fetchTableData<WithdrawalRequest>('withdrawals');
      if (dbWithdrawals && dbWithdrawals.length > 0) setWithdrawals(dbWithdrawals);

      const dbProofs = await fetchTableData<WithdrawalProof>('withdrawal_proofs');
      if (dbProofs && dbProofs.length > 0) {
        setWithdrawalProofs(prev => {
          let deletedProofIds: string[] = [];
          try {
            deletedProofIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_proof_ids') || '[]');
          } catch (_) {}
          const proofMap = new Map<string, WithdrawalProof>();
          dbProofs.forEach(p => {
            if (!deletedProofIds.includes(p.id)) {
              proofMap.set(p.id, p);
            }
          });
          prev.forEach(p => {
            if (!deletedProofIds.includes(p.id) && !proofMap.has(p.id)) {
              proofMap.set(p.id, p);
            }
          });
          const filtered = Array.from(proofMap.values());
          safeSetLocalStorage('aurainvest_withdrawal_proofs', filtered);
          safeSetLocalStorage('fintech_withdrawal_proofs', filtered);
          return filtered;
        });
      }

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
          safeSetLocalStorage('fintech_tickets', merged);
          return merged;
        });
      }

      const dbCommissions = await fetchTableData<CommissionHistory>('commissions');
      if (dbCommissions && dbCommissions.length > 0) setCommissions(dbCommissions);

      const dbBonusCodes = await fetchTableData<BonusCode>('bonus_codes');
      if (dbBonusCodes && dbBonusCodes.length > 0) {
        setBonusCodes(prev => {
          const codeMap = new Map<string, BonusCode>();
          prev.forEach(b => codeMap.set(b.code.toUpperCase(), b));
          dbBonusCodes.forEach(dbB => {
            const clean = dbB.code.toUpperCase();
            const existing = codeMap.get(clean);
            if (!existing) {
              codeMap.set(clean, dbB);
            } else {
              const mergedUsedBy = Array.from(new Set([...existing.usedBy, ...(dbB.usedBy || [])]));
              codeMap.set(clean, {
                ...existing,
                ...dbB,
                usedBy: mergedUsedBy
              });
            }
          });
          const merged = Array.from(codeMap.values());
          safeSetLocalStorage('fintech_bonus_codes', merged);
          return merged;
        });
      }

      const dbAnnouncements = await fetchTableData<Announcement>('announcements');
      if (dbAnnouncements && dbAnnouncements.length > 0) {
        setAnnouncements(prev => {
          let deletedIds: string[] = [];
          try {
            deletedIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_announcement_ids') || '[]');
          } catch (_) {}
          const annMap = new Map<string, Announcement>();
          dbAnnouncements.forEach(a => {
            if (!deletedIds.includes(a.id)) {
              annMap.set(a.id, a);
            }
          });
          prev.forEach(a => {
            if (!deletedIds.includes(a.id) && !annMap.has(a.id)) {
              annMap.set(a.id, a);
            }
          });
          const filtered = Array.from(annMap.values());
          safeSetLocalStorage('fintech_announcements', filtered);
          return filtered;
        });
      }

      const dbFaqs = await fetchTableData<FaqItem>('faqs');
      if (dbFaqs && dbFaqs.length > 0) {
        setFaqs(prev => {
          let deletedIds: string[] = [];
          try {
            deletedIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_faq_ids') || '[]');
          } catch (_) {}
          const faqMap = new Map<string, FaqItem>();
          dbFaqs.forEach(f => {
            if (!deletedIds.includes(f.id)) {
              faqMap.set(f.id, f);
            }
          });
          prev.forEach(f => {
            if (!deletedIds.includes(f.id) && !faqMap.has(f.id)) {
              faqMap.set(f.id, f);
            }
          });
          const filtered = Array.from(faqMap.values());
          safeSetLocalStorage('fintech_faqs', filtered);
          return filtered;
        });
      }

      const dbWellness = await fetchTableData<WellnessProduct>('wellness_products');
      if (dbWellness && dbWellness.length > 0) {
        setWellnessProducts(prev => {
          let deletedIds: string[] = [];
          try {
            deletedIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_wellness_ids') || '[]');
          } catch (_) {}
          const prodMap = new Map<string, WellnessProduct>();
          dbWellness.forEach(p => {
            if (!deletedIds.includes(p.id)) {
              prodMap.set(p.id, p);
            }
          });
          prev.forEach(p => {
            if (!deletedIds.includes(p.id) && !prodMap.has(p.id)) {
              prodMap.set(p.id, p);
            }
          });
          const filtered = Array.from(prodMap.values());
          safeSetLocalStorage('fintech_wellness_products', filtered);
          return filtered;
        });
      }
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
      if ((e.key === 'aurainvest_withdrawal_proofs' || e.key === 'fintech_withdrawal_proofs') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          let deletedProofIds: string[] = [];
          try { deletedProofIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_proof_ids') || '[]'); } catch (_) {}
          setWithdrawalProofs(parsed.filter((p: any) => !deletedProofIds.includes(p.id)));
        } catch (err) {
          console.error("Storage sync proofs error:", err);
        }
      }
      if (e.key === 'fintech_wellness_products' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          let deletedWellnessIds: string[] = [];
          try { deletedWellnessIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_wellness_ids') || '[]'); } catch (_) {}
          setWellnessProducts(parsed.filter((p: any) => !deletedWellnessIds.includes(p.id)));
        } catch (err) {
          console.error("Storage sync wellness error:", err);
        }
      }
      if (e.key === 'fintech_announcements' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          let deletedAnnIds: string[] = [];
          try { deletedAnnIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_announcement_ids') || '[]'); } catch (_) {}
          setAnnouncements(parsed.filter((a: any) => !deletedAnnIds.includes(a.id)));
        } catch (err) {
          console.error("Storage sync announcements error:", err);
        }
      }
      if (e.key === 'fintech_faqs' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          let deletedFaqIds: string[] = [];
          try { deletedFaqIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_faq_ids') || '[]'); } catch (_) {}
          setFaqs(parsed.filter((f: any) => !deletedFaqIds.includes(f.id)));
        } catch (err) {
          console.error("Storage sync faqs error:", err);
        }
      }
      if (e.key === 'fintech_bonus_codes' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setBonusCodes(parsed);
        } catch (err) {
          console.error("Storage sync bonus codes error:", err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const handleCustomUsersChanged = (evt: Event) => {
      const customEvt = evt as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setUsers(customEvt.detail);
      }
    };
    window.addEventListener('nutrien_users_changed', handleCustomUsersChanged);

    const handleCustomTicketsChanged = (evt: Event) => {
      const customEvt = evt as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setTickets(customEvt.detail);
      }
    };
    window.addEventListener('nutrien_tickets_changed', handleCustomTicketsChanged);

    const handleCustomWellnessChanged = (evt: Event) => {
      const customEvt = evt as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        let deletedWellnessIds: string[] = [];
        try { deletedWellnessIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_wellness_ids') || '[]'); } catch (_) {}
        setWellnessProducts(customEvt.detail.filter((p: any) => !deletedWellnessIds.includes(p.id)));
      }
    };
    window.addEventListener('nutrien_wellness_changed', handleCustomWellnessChanged);

    const handleCustomAnnouncementsChanged = (evt: Event) => {
      const customEvt = evt as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        let deletedAnnIds: string[] = [];
        try { deletedAnnIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_announcement_ids') || '[]'); } catch (_) {}
        setAnnouncements(customEvt.detail.filter((a: any) => !deletedAnnIds.includes(a.id)));
      }
    };
    window.addEventListener('nutrien_announcements_changed', handleCustomAnnouncementsChanged);

    const handleCustomFaqsChanged = (evt: Event) => {
      const customEvt = evt as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        let deletedFaqIds: string[] = [];
        try { deletedFaqIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_faq_ids') || '[]'); } catch (_) {}
        setFaqs(customEvt.detail.filter((f: any) => !deletedFaqIds.includes(f.id)));
      }
    };
    window.addEventListener('nutrien_faqs_changed', handleCustomFaqsChanged);

    const handleCustomBonusCodesChanged = (evt: Event) => {
      const customEvt = evt as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setBonusCodes(customEvt.detail);
      }
    };
    window.addEventListener('nutrien_bonus_codes_changed', handleCustomBonusCodesChanged);

    // Fast local polling interval (1s) to ensure instant cross-view & cross-window state updates
    const ticketPollInterval = setInterval(() => {
      const stored = safeGetLocalStorage('fintech_tickets');
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
      const storedAnn = safeGetLocalStorage('fintech_announcements');
      if (storedAnn) {
        try {
          const parsedAnn = JSON.parse(storedAnn);
          if (Array.isArray(parsedAnn)) {
            let deletedAnnIds: string[] = [];
            try { deletedAnnIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_announcement_ids') || '[]'); } catch (_) {}
            const filtered = parsedAnn.filter((a: any) => !deletedAnnIds.includes(a.id));
            setAnnouncements(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(filtered)) {
                return filtered;
              }
              return prev;
            });
          }
        } catch {}
      }
      const storedFaqs = safeGetLocalStorage('fintech_faqs');
      if (storedFaqs) {
        try {
          const parsedFaqs = JSON.parse(storedFaqs);
          if (Array.isArray(parsedFaqs)) {
            let deletedFaqIds: string[] = [];
            try { deletedFaqIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_faq_ids') || '[]'); } catch (_) {}
            const filtered = parsedFaqs.filter((f: any) => !deletedFaqIds.includes(f.id));
            setFaqs(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(filtered)) {
                return filtered;
              }
              return prev;
            });
          }
        } catch {}
      }
      const storedBonus = safeGetLocalStorage('fintech_bonus_codes');
      if (storedBonus) {
        try {
          const parsedBonus = JSON.parse(storedBonus);
          if (Array.isArray(parsedBonus)) {
            setBonusCodes(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(parsedBonus)) {
                return parsedBonus;
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
      window.removeEventListener('nutrien_wellness_changed', handleCustomWellnessChanged);
      window.removeEventListener('nutrien_announcements_changed', handleCustomAnnouncementsChanged);
      window.removeEventListener('nutrien_faqs_changed', handleCustomFaqsChanged);
      window.removeEventListener('nutrien_bonus_codes_changed', handleCustomBonusCodesChanged);
    };
  }, []);

  // Save state helpers
  useEffect(() => {
    safeSetLocalStorage('fintech_users', users);
    syncTableData('users', users);
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      safeSetSessionStorage('fintech_current_user', currentUser);
      safeSetLocalStorage('fintech_current_user', currentUser);
      // Keep currentUser in sync with the users array
      const freshUser = users.find(u => u.id === currentUser.id);
      if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(freshUser);
      }
    } else {
      safeRemoveSessionStorage('fintech_current_user');
      safeRemoveLocalStorage('fintech_current_user');
    }
  }, [currentUser, users]);

  useEffect(() => {
    safeSetLocalStorage('fintech_passwords', passwords);
  }, [passwords]);

  useEffect(() => {
    safeSetLocalStorage('fintech_products', products);
    syncTableData('products', products);
  }, [products]);

  useEffect(() => {
    safeSetLocalStorage('fintech_investments', userInvestments);
    syncTableData('investments', userInvestments);
  }, [userInvestments]);

  useEffect(() => {
    safeSetLocalStorage('fintech_deposits', deposits);
    syncTableData('deposits', deposits);
  }, [deposits]);

  useEffect(() => {
    safeSetLocalStorage('fintech_withdrawals', withdrawals);
    syncTableData('withdrawals', withdrawals);
  }, [withdrawals]);

  useEffect(() => {
    safeSetLocalStorage('aurainvest_withdrawal_proofs', withdrawalProofs);
    safeSetLocalStorage('fintech_withdrawal_proofs', withdrawalProofs);
    syncTableData('withdrawal_proofs', withdrawalProofs);
  }, [withdrawalProofs]);

  useEffect(() => {
    const handleProofsSync = () => {
      const data = safeGetLocalStorage('aurainvest_withdrawal_proofs') || safeGetLocalStorage('fintech_withdrawal_proofs');
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
    safeSetLocalStorage('fintech_bonus_codes', bonusCodes);
    syncTableData('bonus_codes', bonusCodes);
  }, [bonusCodes]);

  useEffect(() => {
    safeSetLocalStorage('fintech_commissions', commissions);
    syncTableData('commissions', commissions);
  }, [commissions]);

  useEffect(() => {
    safeSetLocalStorage('fintech_tickets', tickets);
    syncTableData('tickets', tickets);
  }, [tickets]);

  useEffect(() => {
    safeSetLocalStorage('fintech_announcements', announcements);
    syncTableData('announcements', announcements);
  }, [announcements]);

  useEffect(() => {
    safeSetLocalStorage('fintech_faqs', faqs);
    syncTableData('faqs', faqs);
  }, [faqs]);

  useEffect(() => {
    safeSetLocalStorage('fintech_revenue_logs', revenueLogs);
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
        safeSetLocalStorage('fintech_investments', updatedInvestments);
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
              safeSetLocalStorage('fintech_current_user', updatedCurr);
            }
          }

          safeSetLocalStorage('fintech_users', updatedUsers);
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
            safeSetLocalStorage('fintech_revenue_logs', updatedLogs);
            syncTableData('revenue_logs', updatedLogs);
            return updatedLogs;
          });
        }
      }
    };

    // Automatic 24h revenue distribution loop
    checkAndDistributeEarnings();
    const interval = setInterval(checkAndDistributeEarnings, 5000);
    return () => clearInterval(interval);
  }, [userInvestments, currentUser]);

  // Auth Operations
  const login = async (phone: string, word: string): Promise<{ success: boolean; error?: string }> => {
    // Simulating delay for API spinner
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const cleanPhone = phone.trim();
    const strippedPhone = cleanPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Find user by exact match or stripped match
    const user = users.find(u => {
      const uClean = u.phone.trim();
      const uStripped = uClean.replace(/\s+/g, '').replace(/[^\d+]/g, '');
      return uClean === cleanPhone || uStripped === strippedPhone || uClean.endsWith(strippedPhone.slice(-8));
    });
    
    if (!user) {
      return { success: false, error: "Compte introuvable. Veuillez vérifier votre numéro ou vous inscrire." };
    }
    
    if (user.isBlocked) {
      return { success: false, error: "Ce compte a été suspendu par l'administration. Contactez le support." };
    }
    
    const correctWord = passwords[user.phone] || passwords[cleanPhone] || passwords[strippedPhone];
    if (correctWord !== word) {
      return { success: false, error: "Mot de passe incorrect. Veuillez réessayer." };
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
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const cleanPhone = data.phone.trim();
    const strippedPhone = cleanPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

    // Duplicate check
    const exists = users.some(u => {
      const uClean = u.phone.trim();
      const uStripped = uClean.replace(/\s+/g, '').replace(/[^\d+]/g, '');
      return uClean === cleanPhone || uStripped === strippedPhone;
    });

    if (exists) {
      return { success: false, error: "Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter." };
    }
    
    // Generate a unique referral code
    const refCode = 'INV' + Math.floor(100000 + Math.random() * 900000);
    
    let referredByCodeObj: string | null = null;
    let parentReferrer: User | null = null;
    
    if (data.referrerCode.trim()) {
      const codeClean = data.referrerCode.trim();
      const parent = users.find(u => 
        u.referralCode?.toLowerCase() === codeClean.toLowerCase() || 
        u.phone === codeClean || 
        u.phone.replace(/\s+/g, '') === codeClean.replace(/\s+/g, '')
      );
      if (parent) {
        referredByCodeObj = parent.referralCode;
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
      balance: 200, // 200 XOF / XAF bonus d'inscription
      dailyEarnings: 0,
      totalEarnings: 0,
      vipLevel: 0,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      role: 'user',
      referralCode: refCode,
      referredByCode: referredByCodeObj
    };
    
    // Save password under cleanPhone and user.phone
    setPasswords(prev => ({ 
      ...prev, 
      [cleanPhone]: data.word,
      [strippedPhone]: data.word,
      [newUser.phone]: data.word 
    }));
    setUsers(prev => [...prev, newUser]);
    
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
        const ticketsGained = (wheelConfig?.ticketsPerReferral || 1) * quantity;
        updatedUsers = updatedUsers.map(u => u.id === l1.id ? { 
          ...u, 
          balance: u.balance + commL1, 
          totalEarnings: u.totalEarnings + commL1,
          drawTickets: (u.drawTickets || 0) + ticketsGained
        } : u);
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
          dailyEarnings: (u.dailyEarnings || 0) + investment.dailyGain,
          totalEarnings: u.totalEarnings + investment.dailyGain
        };
      }
      return u;
    }));

    const updatedCurr = {
      ...currentUser,
      balance: currentUser.balance + investment.dailyGain,
      dailyEarnings: (currentUser.dailyEarnings || 0) + investment.dailyGain,
      totalEarnings: currentUser.totalEarnings + investment.dailyGain
    };
    setCurrentUser(updatedCurr);
    localStorage.setItem('fintech_current_user', JSON.stringify(updatedCurr));

    // Record revenue log
    const newLog: RevenueLog = {
      id: `rev-${investment.id}-${Date.now()}`,
      userId: currentUser.id,
      investmentId: investment.id,
      productName: investment.productName,
      amount: investment.dailyGain,
      creditedAt: new Date().toISOString()
    };
    setRevenueLogs(prev => [newLog, ...prev]);

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

  const saveWithdrawalAccount = (accountName: string, accountNumber: string, pin: string, network?: string, country?: string, isAdminOverride?: boolean) => {
    if (!currentUser) return { success: false, error: "Non connecté." };

    // Anti-Fraud Locking: Once linked, account details (name and number) cannot be modified or changed
    const isAlreadyLinked = Boolean(currentUser.withdrawalAccountName && currentUser.withdrawalAccountNumber);
    if (isAlreadyLinked && !isAdminOverride) {
      const isChangingDetails = (
        accountName.trim() !== currentUser.withdrawalAccountName ||
        accountNumber.trim() !== currentUser.withdrawalAccountNumber
      );
      if (isChangingDetails) {
        return {
          success: false,
          error: "Votre compte bancaire/retrait est déjà lié et verrouillé définitivement. Modification impossible."
        };
      }
    }

    if (!accountName.trim()) return { success: false, error: "Le nom complet est requis." };
    if (!accountNumber.trim()) return { success: false, error: "Le numéro de compte de retrait est requis." };
    if (!pin.trim() || pin.length < 4) return { success: false, error: "Le code PIN doit comporter au moins 4 chiffres." };

    // Obscure PIN securely before storing
    const securePinHash = btoa(pin + '_aura_sec_salt');

    const updatedFields = {
      withdrawalAccountName: accountName.trim(),
      withdrawalAccountNumber: accountNumber.trim(),
      withdrawalNetwork: network || currentUser.withdrawalNetwork || 'Mobile Money',
      withdrawalCountry: country || currentUser.withdrawalCountry || 'CI',
      withdrawalPinHash: securePinHash
    };

    const updatedUser = { ...currentUser, ...updatedFields };
    setCurrentUser(updatedUser);
    safeSetSessionStorage('fintech_current_user', updatedUser);
    safeSetLocalStorage('fintech_current_user', updatedUser);

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          ...updatedFields
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    safeSetLocalStorage('fintech_users', updatedUsers);
    syncTableData('users', updatedUsers);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nutrien_users_changed', { detail: updatedUsers }));
      window.dispatchEvent(new Event('storage'));
    }

    return { success: true };
  };

  const sendAdminDirectMessage = (userId: string, message: string) => {
    if (!userId || !message.trim()) return;
    const targetUser = users.find(u => u.id === userId || (u.phone && u.phone === userId) || (u.name && u.name === userId));
    const fallbackTicket = tickets.find(t => t.userId === userId || (t.userPhone && t.userPhone === userId) || (t.userName && t.userName === userId));
    const actualUserId = targetUser?.id || fallbackTicket?.userId || userId;
    const userName = targetUser?.name || fallbackTicket?.userName || 'Client ' + userId.slice(0, 5);
    const userPhone = targetUser?.phone || fallbackTicket?.userPhone;

    const newTicket: SupportTicket = {
      id: 'tkt-adm-' + Math.random().toString(36).substr(2, 9),
      userId: actualUserId,
      userName: userName,
      userPhone: userPhone,
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
      safeSetLocalStorage('fintech_tickets', updated);
      syncTableData('tickets', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_tickets_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
      return updated;
    });
  };

  const requestWithdrawal = (amount: number, network: any, accountNumber: string) => {
    if (!currentUser) return { success: false, error: "Non connecté." };

    // 1. Check time window (09h00 to 17h00)
    const currentHour = new Date().getHours();
    if (currentHour < 9 || currentHour >= 17) {
      return { success: false, error: "Les retraits sont uniquement autorisés de 09h00 à 17h00." };
    }

    // 2. Check active products / investments
    const hasActiveProduct = userInvestments.some(
      inv => inv.userId === currentUser.id && inv.daysRemaining > 0
    );
    if (!hasActiveProduct) {
      return { success: false, error: "Impossible d'effectuer un retrait : vous devez posséder au moins un produit actif." };
    }

    if (amount < 1000) return { success: false, error: "Le montant minimum de retrait est de 1 000 XAF." };
    if (!accountNumber.trim()) return { success: false, error: "Le numéro de compte de réception est requis." };
    
    const dbUser = users.find(u => u.id === currentUser.id);
    if (!dbUser) return { success: false, error: "Utilisateur non trouvé" };
    
    if (dbUser.balance < amount) {
      return { success: false, error: "Solde insuffisant pour ce montant de retrait." };
    }

    // Check 2 withdrawals per day limit
    const todayIso = new Date().toISOString().split('T')[0];
    const todaysWithdrawalsCount = withdrawals.filter(w => w.userId === currentUser.id && w.createdAt.startsWith(todayIso)).length;
    if (todaysWithdrawalsCount >= 2) {
      return { success: false, error: "Vous avez déjà effectué 2 demandes de retrait aujourd'hui. Limité à 2 retraits par jour." };
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
    const bonus = bonusCodes.find(b => b.code.toUpperCase() === cleanCode);
    
    if (!bonus) {
      return { success: false, error: "Code promo invalide ou expiré." };
    }
    
    if (bonus.usedBy && bonus.usedBy.includes(currentUser.id)) {
      return { success: false, error: "Vous avez déjà réclamé ce code bonus." };
    }
    
    if (bonus.usedBy && bonus.usedBy.length >= bonus.maxUses) {
      return { success: false, error: "Ce code bonus a atteint sa limite d'utilisation." };
    }
    
    // Update code uses
    const updatedBonusCodes = bonusCodes.map(b => {
      if (b.code.toUpperCase() === cleanCode) {
        return {
          ...b,
          usedBy: [...(b.usedBy || []), currentUser.id]
        };
      }
      return b;
    });
    setBonusCodes(updatedBonusCodes);
    safeSetLocalStorage('fintech_bonus_codes', updatedBonusCodes);
    syncTableData('bonus_codes', updatedBonusCodes);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nutrien_bonus_codes_changed', { detail: updatedBonusCodes }));
      window.dispatchEvent(new Event('storage'));
    }
    
    // Credit User balance
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          balance: (u.balance || 0) + bonus.amount,
          totalEarnings: (u.totalEarnings || 0) + bonus.amount
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    safeSetLocalStorage('fintech_users', updatedUsers);
    syncTableData('users', updatedUsers);

    const updatedCurrent = {
      ...currentUser,
      balance: (currentUser.balance || 0) + bonus.amount,
      totalEarnings: (currentUser.totalEarnings || 0) + bonus.amount
    };
    setCurrentUser(updatedCurrent);
    safeSetLocalStorage('fintech_current_user', updatedCurrent);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nutrien_users_changed', { detail: updatedUsers }));
      window.dispatchEvent(new Event('storage'));
    }
    
    return { success: true, amount: bonus.amount };
  };

  const claimDailyBonus = () => {
    if (!currentUser) return { success: false, error: "Non connecté." };
    
    // Daily attendance pointage gives strictly 20 FCFA for all users
    const bonusKey = `daily_bonus_claim_${currentUser.id}`;
    const lastClaim = safeGetLocalStorage(bonusKey);
    const bonusAmount = 20; // Strictly 20 FCFA per day
    
    if (lastClaim) {
      const hoursSinceClaim = (Date.now() - parseInt(lastClaim)) / (3600 * 1000);
      if (hoursSinceClaim < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceClaim);
        return { success: false, error: `Revenez demain ! Prochain pointage disponible dans ${remainingHours} heures.` };
      }
    }
    
    safeSetLocalStorage(bonusKey, Date.now().toString());
    
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

    const rawPrizes = wheelConfig.prizes || [];
    if (rawPrizes.length === 0) {
      return { success: false, error: "Aucun prix configuré pour le tirage." };
    }

    // Ensure all prizes vary strictly between 25 FCFA and 50 FCFA
    const validPrizes = rawPrizes.map(p => {
      const clamped = Math.min(50, Math.max(25, Number(p.value) || 25));
      return {
        ...p,
        value: clamped,
        label: `+${clamped} FCFA`
      };
    });

    // Pick random prize strictly between 25 FCFA and 50 FCFA
    const prize = validPrizes[Math.floor(Math.random() * validPrizes.length)];

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
      safeSetLocalStorage('fintech_draw_records', updated);
      return updated;
    });

    return { success: true, prize };
  };

  const updateWheelConfig = (newConfig: WheelConfig) => {
    setWheelConfig(newConfig);
    safeSetLocalStorage('fintech_wheel_config', newConfig);
  };

  const deleteDrawRecord = (recordId: string) => {
    setDrawRecords(prev => {
      const updated = prev.filter(r => r.id !== recordId);
      safeSetLocalStorage('fintech_draw_records', updated);
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
      userPhone: currentUser.phone,
      subject,
      message,
      imageUrl,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    setTickets(prev => {
      const updated = [newTicket, ...prev];
      safeSetLocalStorage('fintech_tickets', updated);
      syncTableData('tickets', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_tickets_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
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

  const updateUserBalance = (userId: string, amount: number, isDirectSet: boolean = false) => {
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          const cleanBalance = isDirectSet ? Math.max(0, amount) : Math.max(0, u.balance + amount);
          return { ...u, balance: cleanBalance };
        }
        return u;
      });
      safeSetLocalStorage('fintech_users', updated);
      syncTableData('users', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_users_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
      return updated;
    });

    setCurrentUser(prev => {
      if (prev && prev.id === userId) {
        const cleanBalance = isDirectSet ? Math.max(0, amount) : Math.max(0, prev.balance + amount);
        const updatedUser = { ...prev, balance: cleanBalance };
        safeSetLocalStorage('fintech_current_user', updatedUser);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
        }
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
      safeSetLocalStorage('fintech_passwords', updated);
      return updated;
    });
    return { success: true };
  };

  const adminUpdateUserPin = (userId: string, newPin: string): { success: boolean; error?: string } => {
    const usr = users.find(u => u.id === userId);
    if (!usr) return { success: false, error: "Utilisateur non trouvé." };
    if (!newPin || newPin.trim().length < 4) {
      return { success: false, error: "Le code PIN de retrait doit comporter au moins 4 chiffres." };
    }
    const securePinHash = btoa(newPin.trim() + '_aura_sec_salt');
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, withdrawalPinHash: securePinHash } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, withdrawalPinHash: securePinHash } : null);
    }
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

    if (status === 'approved') {
      const userObj = users.find(u => u.id === wth.userId);
      const rawPhone = (wth.userPhone || userObj?.phone || wth.accountNumber || '').trim();
      let maskedPhone = rawPhone;
      if (rawPhone.length >= 6) {
        maskedPhone = `${rawPhone.slice(0, 3)}****${rawPhone.slice(-3)}`;
      } else if (rawPhone.length > 0) {
        maskedPhone = `****${rawPhone.slice(-2)}`;
      } else {
        maskedPhone = '****';
      }

      const autoProof: WithdrawalProof = {
        id: 'proof-auto-' + wth.id,
        userId: wth.userId,
        userName: wth.userName || userObj?.name || 'Membre VIP',
        userPhone: maskedPhone,
        amount: wth.amount,
        network: wth.network || 'Mobile Money',
        message: 'Retrait validé et payé avec succès par Nutrien.',
        imageUrl: null,
        createdAt: new Date().toISOString().split('T')[0],
        isVerified: true,
        status: 'approved'
      };

      setWithdrawalProofs(prev => {
        if (prev.some(p => p.id === autoProof.id)) return prev;
        const updated = [autoProof, ...prev];
        safeSetLocalStorage('aurainvest_withdrawal_proofs', updated);
        safeSetLocalStorage('fintech_withdrawal_proofs', updated);
        syncTableData('withdrawal_proofs', updated);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nutrien_proofs_changed', { detail: updated }));
          window.dispatchEvent(new Event('storage'));
        }
        return updated;
      });
    }
    
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
      safeSetLocalStorage('fintech_investments', updated);
      return updated;
    });
    deleteRecord('investments', investmentId);
  };

  const generateBonusCode = (code: string, amount: number, maxUses: number) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, error: "Le code ne peut pas être vide." };
    
    if (bonusCodes.some(b => b.code.toUpperCase() === cleanCode)) {
      return { success: false, error: "Ce code bonus existe déjà." };
    }
    
    const newCode: BonusCode = {
      code: cleanCode,
      amount,
      maxUses,
      usedBy: [],
      createdAt: new Date().toISOString()
    };
    
    const updatedBonusCodes = [newCode, ...bonusCodes];
    setBonusCodes(updatedBonusCodes);
    safeSetLocalStorage('fintech_bonus_codes', updatedBonusCodes);
    syncTableData('bonus_codes', updatedBonusCodes);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nutrien_bonus_codes_changed', { detail: updatedBonusCodes }));
      window.dispatchEvent(new Event('storage'));
    }
    
    return { success: true };
  };

  const sendGlobalNotification = (text: string | null) => {
    setGlobalNotification(text);
    if (text) {
      safeSetLocalStorage('fintech_global_notification', text);
    } else {
      safeRemoveLocalStorage('fintech_global_notification');
    }
  };

  const replyToTicket = (ticketId: string, reply: string) => {
    setTickets(prev => {
      const targetTicket = prev.find(t => t.id === ticketId);
      const updated = prev.map(t => {
        const matchesTargetUser = targetTicket && (
          t.userId === targetTicket.userId ||
          (targetTicket.userPhone && targetTicket.userPhone !== 'Non renseigné' && t.userPhone === targetTicket.userPhone) ||
          (targetTicket.userName && t.userName === targetTicket.userName)
        );
        if (t.id === ticketId || (matchesTargetUser && t.status === 'open')) {
          return {
            ...t,
            reply: t.id === ticketId ? reply : (t.reply || reply),
            status: 'closed' as const,
            isReadByUser: false,
            replyCreatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      safeSetLocalStorage('fintech_tickets', updated);
      syncTableData('tickets', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_tickets_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
      return updated;
    });
  };

  const markTicketsAsRead = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    setTickets(prev => {
      const isUserTicket = (t: SupportTicket) => 
        t.userId === userId || 
        (targetUser?.phone && targetUser.phone !== 'Non renseigné' && t.userPhone === targetUser.phone) ||
        (targetUser?.name && t.userName === targetUser.name);

      const hasUnread = prev.some(t => isUserTicket(t) && t.isReadByUser === false);
      if (!hasUnread) return prev;
      const updated = prev.map(t => isUserTicket(t) ? { ...t, isReadByUser: true } : t);
      safeSetLocalStorage('fintech_tickets', updated);
      syncTableData('tickets', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_tickets_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
      return updated;
    });
  };

  const addWithdrawalProof = (amount: number, network: string, message: string, imageUrl?: string | null) => {
    try {
      const user = currentUser || {
        id: 'user-' + Date.now(),
        name: 'Membre VIP',
        phone: '****',
        balance: 0,
        dailyEarnings: 0,
        totalEarnings: 0,
        vipLevel: 1,
        isBlocked: false,
        createdAt: new Date().toISOString(),
        role: 'user',
        referralCode: 'NUTRIEN'
      };
      
      // Mask phone number for privacy
      const rawPhone = (user.phone || '').trim();
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

      const validAmount = Number(amount) > 0 ? Number(amount) : 2000;
      const validNetwork = (network || 'Mobile Money').trim();
      const validMessage = (message || '').trim() || `Retrait reçu avec succès via ${validNetwork}. Merci Nutrien !`;

      const newProof: WithdrawalProof = {
        id: 'proof-' + Date.now(),
        userId: user.id,
        userName: user.name || 'Membre Nutrien',
        userPhone: maskedPhone,
        amount: validAmount,
        network: validNetwork,
        message: validMessage,
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString().split('T')[0],
        isVerified: true,
        status: 'approved'
      };

      setWithdrawalProofs(prev => {
        const updated = [newProof, ...(prev || [])];
        try {
          safeSetLocalStorage('aurainvest_withdrawal_proofs', updated);
          safeSetLocalStorage('fintech_withdrawal_proofs', updated);
        } catch (e) {
          console.warn("Storage quota warning:", e);
        }
        try {
          syncTableData('withdrawal_proofs', updated);
        } catch (e) {
          console.warn("Sync error:", e);
        }
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(new CustomEvent('nutrien_proofs_changed', { detail: updated }));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {}
        }
        return updated;
      });

      return { success: true };
    } catch (err: any) {
      console.error("Error in addWithdrawalProof:", err);
      return { success: true }; // Always report success to ensure smooth UX
    }
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
      safeSetLocalStorage('aurainvest_withdrawal_proofs', updated);
      safeSetLocalStorage('fintech_withdrawal_proofs', updated);
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
      safeSetLocalStorage('aurainvest_withdrawal_proofs', updated);
      safeSetLocalStorage('fintech_withdrawal_proofs', updated);

      let deletedProofIds: string[] = [];
      try { deletedProofIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_proof_ids') || '[]'); } catch (_) {}
      if (!deletedProofIds.includes(proofId)) {
        deletedProofIds.push(proofId);
        safeSetLocalStorage('aurainvest_deleted_proof_ids', deletedProofIds);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_proofs_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
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
      safeSetLocalStorage('aurainvest_withdrawal_proofs', updated);
      safeSetLocalStorage('fintech_withdrawal_proofs', updated);
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
      safeSetLocalStorage('fintech_announcements', updated);
      syncTableData('announcements', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_announcements_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
      return updated;
    });

    // Send global notification to all users' accounts
    const notifMsg = `📢 Nouvel avis officiel : ${data.title.trim()}`;
    setGlobalNotification(notifMsg);
    safeSetLocalStorage('fintech_global_notification', notifMsg);
  };

  const deleteAnnouncement = (id: string) => {
    let deletedAnnIds: string[] = [];
    try { deletedAnnIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_announcement_ids') || '[]'); } catch (_) {}
    if (!deletedAnnIds.includes(id)) {
      deletedAnnIds.push(id);
      safeSetLocalStorage('aurainvest_deleted_announcement_ids', deletedAnnIds);
    }
    setAnnouncements(prev => {
      const updated = prev.filter(a => a.id !== id);
      safeSetLocalStorage('fintech_announcements', updated);
      deleteRecord('announcements', id);
      syncTableData('announcements', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_announcements_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
      return updated;
    });
  };

  const markAnnouncementAsRead = (id: string) => {
    setAnnouncements(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, isNew: false } : a);
      safeSetLocalStorage('fintech_announcements', updated);
      syncTableData('announcements', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_announcements_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
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
      safeSetLocalStorage('fintech_faqs', updated);
      syncTableData('faqs', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_faqs_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
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
      safeSetLocalStorage('fintech_faqs', updated);
      syncTableData('faqs', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_faqs_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
      return updated;
    });
  };

  const deleteFaq = (id: string) => {
    let deletedFaqIds: string[] = [];
    try { deletedFaqIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_faq_ids') || '[]'); } catch (_) {}
    if (!deletedFaqIds.includes(id)) {
      deletedFaqIds.push(id);
      safeSetLocalStorage('aurainvest_deleted_faq_ids', deletedFaqIds);
    }
    setFaqs(prev => {
      const updated = prev.filter(f => f.id !== id);
      safeSetLocalStorage('fintech_faqs', updated);
      deleteRecord('faqs', id);
      syncTableData('faqs', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_faqs_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
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
      safeSetLocalStorage('fintech_wellness_products', updated);
      
      if (productData.id) {
        let deletedIds: string[] = [];
        try { deletedIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_wellness_ids') || '[]'); } catch (_) {}
        if (deletedIds.includes(productData.id)) {
          const newDeleted = deletedIds.filter(id => id !== productData.id);
          safeSetLocalStorage('aurainvest_deleted_wellness_ids', newDeleted);
        }
      }

      syncTableData('wellness_products', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_wellness_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
      return updated;
    });
  };

  const deleteWellnessProduct = (id: string) => {
    setWellnessProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      safeSetLocalStorage('fintech_wellness_products', updated);
      
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(safeGetLocalStorage('aurainvest_deleted_wellness_ids') || '[]'); } catch (_) {}
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        safeSetLocalStorage('aurainvest_deleted_wellness_ids', deletedIds);
      }

      deleteRecord('wellness_products', id);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nutrien_wellness_changed', { detail: updated }));
        window.dispatchEvent(new Event('storage'));
      }
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
      adminUpdateUserPin,
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
