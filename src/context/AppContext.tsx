/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  fetchTableData, 
  fetchAllTablesMaster,
  registerUserInDatabase,
  loginUserInDatabase,
  upsertItem, 
  insertItem, 
  updateItem, 
  deleteRecord, 
  saveSystemConfig, 
  fetchSystemConfig,
  deleteSystemConfig,
  buyProductInvestment,
  submitDepositRequest,
  checkoutDeposit,
  submitWithdrawalRequest,
  submitSupportTicket,
  replySupportTicket,
  sendAdminDirectSupportTicket,
  adminProcessDeposit,
  adminProcessWithdrawal,
  adminUpdateUserBalance,
  adminUpdateUserRole,
  adminUpdateUserBlock
} from '../lib/supabaseService';
import { 
  safeSetLocalStorage, 
  safeGetLocalStorage, 
  safeRemoveLocalStorage, 
  safeSetSessionStorage, 
  safeGetSessionStorage, 
  safeRemoveSessionStorage 
} from '../lib/storage';
import { normalizePhoneNumber, extractPhoneDetails } from '../lib/phoneUtils';
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
  RechargeChannel,
  TaskItem,
  UserTaskClaim
} from '../types';
import { OFFICIAL_INVESTMENT_PRODUCTS } from '../constants/products';
import { OFFICIAL_TASKS } from '../constants/tasks';

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
  tasks: TaskItem[];
  userTaskClaims: UserTaskClaim[];
  faqs: FaqItem[];
  rechargeChannels: RechargeChannel[];
  liveStats: {
    membersCount: number;
    depositsSum: number;
    withdrawalsSum: number;
    revenueDistributed: number;
  };
  globalNotification: string | null;
  
  // Auth actions
  login: (phone: string, word: string, country?: string) => Promise<{ success: boolean; error?: string }>;
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
  buyInvestment: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  claimDailyEarning: (investmentId: string) => { success: boolean; error?: string };
  claimTaskReward: (taskId: string) => Promise<{ success: boolean; reward?: number; newBalance?: number; error?: string }>;
  updateTask: (idOrTask: string | (Partial<TaskItem> & { id: string }), updates?: Partial<TaskItem>) => Promise<{ success: boolean; error?: string }>;
  resetDefaultTasks: () => Promise<{ success: boolean; tasks?: TaskItem[]; error?: string }>;
  requestDeposit: (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => { success: boolean; error?: string };
  initiateDepositCheckout: (params: {
    amount: number;
    country: string;
    countryCode: string;
    method: string;
    phoneNumber: string;
  }) => Promise<{ success: boolean; error?: string; redirectUrl?: string; deposit?: DepositRequest }>;
  requestWithdrawal: (amount: number, network: any, accountNumber: string) => { success: boolean; error?: string };
  saveWithdrawalAccount: (accountName: string, accountNumber: string, pin: string, network?: string, country?: string, isAdminOverride?: boolean) => Promise<{ success: boolean; error?: string }>;
  sendAdminDirectMessage: (userId: string, message: string) => Promise<{ success: boolean; error?: string }>;
  redeemBonusCode: (code: string) => { success: boolean; error?: string; amount?: number };
  claimDailyBonus: () => { success: boolean; error?: string; amount?: number };
  spinLuckyWheel: () => { success: boolean; error?: string; prize?: WheelPrize };
  createSupportTicket: (subject: string, message: string, imageUrl?: string) => Promise<{ success: boolean; error?: string }>;
  addWithdrawalProof: (amount: number, network: string, message: string, imageUrl?: string | null) => { success: boolean; error?: string };
  
  // Administrative tasks (accessible when currentUser.role === 'admin')
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  toggleBlockUser: (userId: string) => void;
  updateUserBalance: (userId: string, amount: number, isDirectSet?: boolean) => void;
  adminUpdateUserPassword: (userId: string, newWord: string) => { success: boolean; error?: string };
  adminUpdateUserPin: (userId: string, newPin: string) => { success: boolean; error?: string };
  adminSetUserSponsor: (userId: string, sponsorCodeOrPhone: string) => Promise<{ success: boolean; error?: string; sponsor?: any }>;
  processDeposit: (depositId: string, status: 'approved' | 'rejected') => Promise<{ success: boolean; error?: string; alreadyApproved?: boolean; newBalance?: number }>;
  processWithdrawal: (withdrawalId: string, status: 'approved' | 'rejected') => void;
  processWithdrawalProof: (proofId: string, status: 'approved' | 'rejected') => void;
  deleteWithdrawalProof: (proofId: string) => void;
  updateWithdrawalProof: (proofId: string, data: Partial<WithdrawalProof>) => void;
  addOrUpdateProduct: (product: Omit<InvestmentProduct, 'isActive'> & { isActive?: boolean; image?: string; description?: string; order?: number; badge?: string; color?: string }) => void;
  resetToOfficialProducts: () => Promise<void>;
  deleteProduct: (productId: string) => void;
  deleteUserInvestment: (investmentId: string) => void;
  generateBonusCode: (code: string, amount: number, maxUses: number) => { success: boolean; error?: string };
  sendGlobalNotification: (text: string | null) => void;
  replyToTicket: (ticketId: string, reply: string) => Promise<{ success: boolean; error?: string }>;
  markTicketsAsRead: (userId: string) => void;
  updateUserRole: (userId: string, role: 'admin' | 'user') => void;
  updateWheelConfig: (newConfig: WheelConfig) => void;
  deleteDrawRecord: (recordId: string) => void;
  addTicketsToUser: (userId: string, count: number) => void;
  addAnnouncement: (data: { title: string; content: string; imageUrl?: string }) => void;
  updateAnnouncement: (id: string, data: { title: string; content: string; imageUrl?: string }) => void;
  deleteAnnouncement: (id: string) => void;
  markAnnouncementAsRead: (id: string) => void;
  purgeAllUsersDepositsWithdrawals: () => Promise<{ success: boolean; message?: string; error?: string }>;
  addFaq: (question: string, answer: string, category?: string) => void;
  updateFaq: (id: string, question: string, answer: string, category?: string) => void;
  deleteFaq: (id: string) => void;
  
  // Refresh / Sync
  refreshData: (force?: boolean) => Promise<void>;
  supabaseStatus: 'connected' | 'quota_exceeded' | 'checking' | 'error';
  isQuotaExceeded: boolean;
  probeSupabase: () => Promise<any>;

  // Recharge channels management
  addRechargeChannel: (data: { name: string; countryCode?: string; accountNumber: string; accountHolder?: string; instructions?: string; isActive?: boolean }) => Promise<{ success: boolean; error?: string }>;
  updateRechargeChannel: (id: string, data: Partial<RechargeChannel>) => Promise<{ success: boolean; error?: string }>;
  deleteRechargeChannel: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleRechargeChannel: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper for extracting password, pin, network and country from withdrawalPinHash
function parseAuthFromPinHash(hash: string | null | undefined): { pwd?: string; pin?: string; network?: string; country?: string } {
  if (!hash) return {};
  try {
    if (hash.startsWith('{') && hash.endsWith('}')) {
      const parsed = JSON.parse(hash);
      return { pwd: parsed.pwd, pin: parsed.pin, network: parsed.network, country: parsed.country };
    }
    // Base64 check
    try {
      const decoded = atob(hash);
      if (decoded.startsWith('{') && decoded.endsWith('}')) {
        const parsed = JSON.parse(decoded);
        return { pwd: parsed.pwd, pin: parsed.pin, network: parsed.network, country: parsed.country };
      }
      if (decoded.includes('_aura_sec_salt')) {
        const pin = decoded.replace('_aura_sec_salt', '');
        return { pin };
      }
    } catch (_) {}
  } catch (_) {}
  return {};
}

function buildPinHash(pwd?: string, pin?: string, network?: string, country?: string, existingHash?: string | null): string {
  const existing = parseAuthFromPinHash(existingHash);
  const finalPwd = pwd !== undefined ? pwd : (existing.pwd || '');
  const finalPin = pin !== undefined ? pin : (existing.pin || '');
  const finalNetwork = network !== undefined ? network : (existing.network || 'MTN Mobile Money');
  const finalCountry = country !== undefined ? country : (existing.country || 'CM');
  return JSON.stringify({ pwd: finalPwd, pin: finalPin, network: finalNetwork, country: finalCountry });
}

// Helper to deduplicate arrays of items by id
function deduplicateById<T extends { id?: string | number }>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string | number>();
  const result: T[] = [];
  for (const item of list) {
    if (!item) continue;
    const id = item.id !== undefined && item.id !== null ? item.id : JSON.stringify(item);
    if (!seen.has(id)) {
      seen.add(id);
      result.push(item);
    }
  }
  return result;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Local state with safe initial fallback
  const defaultAdminUsers: User[] = [
    {
      id: 'usr-admin-togo-123456',
      name: 'Directeur Général Togo (Admin)',
      phone: '+22890123456',
      whatsapp: '+22890123456',
      country: 'Togo',
      balance: 5000000,
      dailyEarnings: 250000,
      totalEarnings: 15000000,
      vipLevel: 8,
      isBlocked: false,
      createdAt: '2026-09-01T00:00:00.000Z',
      role: 'admin',
      referralCode: 'TOGO2026',
      referredByCode: null,
      withdrawalAccountName: 'ADMINISTRATION TOGO',
      withdrawalAccountNumber: '90123456',
      withdrawalPinHash: JSON.stringify({ pwd: '123456', pin: '0000', net: 'TMoney', cty: 'TG' })
    },
    {
      id: 'usr-admin-master',
      name: 'Directeur Général (Admin)',
      phone: '+22897194059',
      whatsapp: '+22897194059',
      country: 'Togo',
      balance: 5000000,
      dailyEarnings: 250000,
      totalEarnings: 15000000,
      vipLevel: 8,
      isBlocked: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      role: 'admin',
      referralCode: 'ADMIN01',
      referredByCode: null,
      withdrawalAccountName: 'ADMINISTRATION NUTRIEN',
      withdrawalAccountNumber: '97194059',
      withdrawalPinHash: JSON.stringify({ pwd: '123456', pin: '0000', net: 'TMoney', cty: 'TG' })
    },
    {
      id: 'usr-admin-principal-2026',
      name: 'Administrateur Principal (AirPods)',
      phone: '+22891902026',
      whatsapp: '+22891902026',
      country: 'Togo',
      balance: 5000000,
      dailyEarnings: 250000,
      totalEarnings: 15000000,
      vipLevel: 8,
      isBlocked: false,
      createdAt: '2026-08-26T00:00:00.000Z',
      role: 'admin',
      referralCode: 'ADMIN2026',
      referredByCode: null,
      withdrawalAccountName: 'ADMINISTRATION OFFICIELLE AIRPODS',
      withdrawalAccountNumber: '91902026',
      withdrawalPinHash: JSON.stringify({
        pwd: '123456',
        pwd_hash: 'd8e3b1c4a7f05926',
        salt: 'd8e3b1c4a7f05926',
        pin_hash: 'd8e3b1c4a7f05926',
        net: 'TMoney',
        cty: 'TG'
      })
    },
    {
      id: 'usr-admin-sec-9920',
      name: 'Administrateur Sécurisé (Superviseur)',
      phone: '+22890554433',
      whatsapp: '+22890554433',
      country: 'Togo',
      balance: 2500000,
      dailyEarnings: 100000,
      totalEarnings: 5000000,
      vipLevel: 8,
      isBlocked: false,
      createdAt: '2026-08-25T00:00:00.000Z',
      role: 'admin',
      referralCode: 'ADMIN02',
      referredByCode: null,
      withdrawalAccountName: 'ADMINISTRATION SECURISEE',
      withdrawalAccountNumber: '90554433',
      withdrawalPinHash: JSON.stringify({ pwd: '123456', pin: '8822', net: 'TMoney', cty: 'TG' })
    }
  ];

  const [users, setUsers] = useState<User[]>(() => {
    const data = safeGetLocalStorage('fintech_users');
    if (data) {
      try { 
        const parsed = deduplicateById<User>(JSON.parse(data)); 
        // Ensure both admin accounts are present
        const merged = [...parsed];
        for (const adm of defaultAdminUsers) {
          if (!merged.some(u => u.id === adm.id || u.phone === adm.phone)) {
            merged.push(adm);
          }
        }
        return merged;
      } catch (_) {}
    }
    return defaultAdminUsers;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const data = safeGetSessionStorage('fintech_current_user') || safeGetLocalStorage('fintech_current_user');
    if (data) {
      try { return JSON.parse(data); } catch (_) {}
    }
    return null;
  });

  const [passwords, setPasswords] = useState<{ [phone: string]: string }>(() => {
    const data = safeGetLocalStorage('fintech_passwords');
    if (data) {
      try { return JSON.parse(data); } catch (_) {}
    }
    return {
      '+237691902026': 'Nutrien@Admin2026#',
      '691902026': 'Nutrien@Admin2026#',
      '91902026': 'Nutrien@Admin2026#',
      '+237697194059': 'admin123',
      '697194059': 'admin123',
      '97194059': 'admin123',
      '+237690554433': 'NutrienAdmin#2026!SecX',
      '690554433': 'NutrienAdmin#2026!SecX',
      '90554433': 'NutrienAdmin#2026!SecX',
      '11111111': 'admin123',
      '07070707': 'koffi123',
      '77777777': 'seydou123'
    };
  });

  const syncOfficialProductData = (list: InvestmentProduct[]): InvestmentProduct[] => {
    const officialMap = new Map(OFFICIAL_INVESTMENT_PRODUCTS.map(p => [p.id, p]));
    const obsoleteIds = new Set([
      'vip-1-pro', 'vip-2-elite', 'vip-3-premium', 'vip-4-platinum', 'vip-5-or',
      'vip-6-saphir', 'vip-7-silver', 'vip-8-gray', 'vip-9-gold',
      'vip-partenaire-bronze', 'vip-partenaire-argent'
    ]);
    
    // Filter out obsolete removed products
    const cleanList = list.filter(item => !obsoleteIds.has(item.id));

    const updatedList = cleanList.map(item => {
      const official = officialMap.get(item.id);
      if (official) {
        return {
          ...official,
          ...item,
          name: official.name,
          image: item.image || official.image,
          description: official.description,
          badge: official.badge,
          color: official.color,
          price: official.price,
          dailyGain: official.dailyGain,
          duration: official.duration,
          gain120Days: official.gain120Days,
          gain40Days: official.gain40Days,
          totalGain: official.totalGain,
          dailyRatePercent: official.dailyRatePercent,
          order: official.order,
          isActive: item.isActive !== false
        };
      }
      const parsedPrice = Number(item.price) || 0;
      const parsedDaily = Number(item.dailyGain) || 0;
      const parsedDur = Number(item.duration) || 120;
      return {
        ...item,
        price: parsedPrice,
        dailyGain: parsedDaily,
        duration: parsedDur,
        totalGain: Number(item.totalGain) || (parsedPrice + (parsedDaily * parsedDur)),
        isActive: item.isActive !== false
      };
    });

    // Ensure all official products are present
    const presentIds = new Set(updatedList.map(p => p.id));
    for (const official of OFFICIAL_INVESTMENT_PRODUCTS) {
      if (!presentIds.has(official.id)) {
        updatedList.push(official);
      }
    }

    return updatedList.sort((a, b) => (a.order || 99) - (b.order || 99));
  };

  const [products, setProducts] = useState<InvestmentProduct[]>(() => {
    const data = safeGetLocalStorage('fintech_products');
    if (data) {
      try {
        const parsed = deduplicateById<InvestmentProduct>(JSON.parse(data));
        if (parsed.length > 0) return syncOfficialProductData(parsed);
      } catch (_) {}
    }
    return OFFICIAL_INVESTMENT_PRODUCTS;
  });

  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>(() => {
    const data = safeGetLocalStorage('fintech_investments');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
  });

  const [deposits, setDeposits] = useState<DepositRequest[]>(() => {
    const data = safeGetLocalStorage('fintech_deposits');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const data = safeGetLocalStorage('fintech_withdrawals');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
  });

  const [withdrawalProofs, setWithdrawalProofs] = useState<WithdrawalProof[]>(() => {
    const data = safeGetLocalStorage('aurainvest_withdrawal_proofs') || safeGetLocalStorage('fintech_withdrawal_proofs');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
  });

  const [revenueLogs, setRevenueLogs] = useState<RevenueLog[]>(() => {
    const data = safeGetLocalStorage('fintech_revenue_logs');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
  });

  const [bonusCodes, setBonusCodes] = useState<BonusCode[]>(() => {
    const data = safeGetLocalStorage('fintech_bonus_codes');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const seen = new Set();
          return parsed.filter(b => {
            if (!b || !b.code || seen.has(b.code)) return false;
            seen.add(b.code);
            return true;
          });
        }
      } catch (_) {}
    }
    return [];
  });

  const [commissions, setCommissions] = useState<CommissionHistory[]>(() => {
    const data = safeGetLocalStorage('fintech_commissions');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const data = safeGetLocalStorage('fintech_tickets');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
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
          return {
            ...parsed,
            prizes: deduplicateById(parsed.prizes)
          };
        }
      } catch (_) {}
    }
    return {
      ticketsPerReferral: 1,
      dailyFreeSpins: 0,
      prizes: defaultPrizes
    };
  });

  const [drawRecords, setDrawRecords] = useState<DrawRecord[]>(() => {
    const data = safeGetLocalStorage('fintech_draw_records');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const data = safeGetLocalStorage('fintech_announcements');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const data = safeGetLocalStorage('fintech_tasks');
    if (data) {
      try {
        const parsed = deduplicateById<TaskItem>(JSON.parse(data));
        if (parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return OFFICIAL_TASKS;
  });

  const [userTaskClaims, setUserTaskClaims] = useState<UserTaskClaim[]>(() => {
    const data = safeGetLocalStorage('fintech_task_claims');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
  });

  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    const data = safeGetLocalStorage('fintech_faqs');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
  });

  // Ensure any legacy wellness storage is purged immediately
  useEffect(() => {
    safeRemoveLocalStorage('fintech_wellness_products');
  }, []);

  // Ensure recharge channels are from supported countries (BF, BJ, TG, CI, CM)
  const normalizeRechargeChannels = (list: RechargeChannel[]): RechargeChannel[] => {
    const ALLOWED_CODES = ['BF', 'BJ', 'TG', 'CI', 'CM'];
    const validList = list.filter(c => {
      if (!c.countryCode) return true;
      return ALLOWED_CODES.includes(c.countryCode.toUpperCase());
    });

    if (validList.length === 0) {
      return [
        {
          id: 'rc-bf-orange',
          name: 'Orange Money (Burkina Faso)',
          countryCode: 'BF',
          accountNumber: '+226 70 00 00 00',
          accountHolder: 'Service Recharge AirPods Burkina',
          instructions: 'Effectuez le transfert vers ce numéro Orange Money (*144#) puis saisissez la référence de transaction SMS reçue.',
          isActive: true,
          order: 1,
          createdAt: new Date().toISOString()
        },
        {
          id: 'rc-bj-mtn',
          name: 'MTN Mobile Money (Bénin)',
          countryCode: 'BJ',
          accountNumber: '+229 97 00 00 00',
          accountHolder: 'Service Recharge AirPods Bénin',
          instructions: 'Effectuez le transfert vers ce numéro MTN Mobile Money (*880#) puis saisissez la référence de transaction SMS reçue.',
          isActive: true,
          order: 2,
          createdAt: new Date().toISOString()
        },
        {
          id: 'rc-tg-tmoney',
          name: 'TMoney (Togo)',
          countryCode: 'TG',
          accountNumber: '+228 90 00 00 00',
          accountHolder: 'Service Recharge AirPods Togo',
          instructions: 'Effectuez le transfert vers ce numéro TMoney (*145#) puis saisissez la référence de transaction SMS reçue.',
          isActive: true,
          order: 3,
          createdAt: new Date().toISOString()
        },
        {
          id: 'rc-ci-wave',
          name: 'Wave / Orange Money (Côte d’Ivoire)',
          countryCode: 'CI',
          accountNumber: '+225 07 00 00 00 00',
          accountHolder: 'Service Recharge AirPods CI',
          instructions: 'Effectuez le transfert vers ce numéro via Wave ou Orange Money puis saisissez la référence de transaction SMS reçue.',
          isActive: true,
          order: 4,
          createdAt: new Date().toISOString()
        },
        {
          id: 'rc-cm-mtn',
          name: 'MTN Mobile Money (Cameroun)',
          countryCode: 'CM',
          accountNumber: '+237 670 00 00 00',
          accountHolder: 'Service Recharge AirPods Cameroun',
          instructions: 'Effectuez le transfert vers ce numéro MTN Mobile Money (*126#) puis saisissez la référence de transaction SMS reçue.',
          isActive: true,
          order: 5,
          createdAt: new Date().toISOString()
        }
      ];
    }

    return deduplicateById(validList);
  };

  const [rechargeChannels, setRechargeChannels] = useState<RechargeChannel[]>(() => {
    const data = safeGetLocalStorage('fintech_recharge_channels');
    if (data !== null && data !== undefined) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeRechargeChannels(deduplicateById(parsed));
        }
      } catch (_) {}
    }
    return [
      {
        id: 'rc-bf-orange',
        name: 'Orange Money (Burkina Faso)',
        countryCode: 'BF',
        accountNumber: '+226 70 00 00 00',
        accountHolder: 'Service Recharge AirPods Burkina',
        instructions: 'Effectuez le transfert vers ce numéro Orange Money (*144#) puis saisissez la référence de transaction SMS reçue.',
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rc-bj-mtn',
        name: 'MTN Mobile Money (Bénin)',
        countryCode: 'BJ',
        accountNumber: '+229 97 00 00 00',
        accountHolder: 'Service Recharge AirPods Bénin',
        instructions: 'Effectuez le transfert vers ce numéro MTN Mobile Money (*880#) puis saisissez la référence de transaction SMS reçue.',
        isActive: true,
        order: 2,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rc-tg-tmoney',
        name: 'TMoney (Togo)',
        countryCode: 'TG',
        accountNumber: '+228 90 00 00 00',
        accountHolder: 'Service Recharge AirPods Togo',
        instructions: 'Effectuez le transfert vers ce numéro TMoney (*145#) puis saisissez la référence de transaction SMS reçue.',
        isActive: true,
        order: 3,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rc-ci-wave',
        name: 'Wave / Orange Money (Côte d’Ivoire)',
        countryCode: 'CI',
        accountNumber: '+225 07 00 00 00 00',
        accountHolder: 'Service Recharge AirPods CI',
        instructions: 'Effectuez le transfert vers ce numéro via Wave ou Orange Money puis saisissez la référence de transaction SMS reçue.',
        isActive: true,
        order: 4,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rc-cm-mtn',
        name: 'MTN Mobile Money (Cameroun)',
        countryCode: 'CM',
        accountNumber: '+237 670 00 00 00',
        accountHolder: 'Service Recharge AirPods Cameroun',
        instructions: 'Effectuez le transfert vers ce numéro MTN Mobile Money (*126#) puis saisissez la référence de transaction SMS reçue.',
        isActive: true,
        order: 5,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [liveStats, setLiveStats] = useState({
    membersCount: 14,
    depositsSum: 5850000,
    withdrawalsSum: 2340000,
    revenueDistributed: 1890000
  });

  const [globalNotification, setGlobalNotification] = useState<string | null>(() => {
    return safeGetLocalStorage('fintech_global_notification');
  });

  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'quota_exceeded' | 'checking' | 'error'>('checking');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const probeSupabase = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/check-supabase');
      const data = await res.json();
      if (data.isQuotaExceeded) {
        setIsQuotaExceeded(true);
        setSupabaseStatus('quota_exceeded');
      } else if (data.status === 'connected') {
        setIsQuotaExceeded(false);
        setSupabaseStatus('connected');
      } else {
        setSupabaseStatus('error');
      }
      return data;
    } catch (_) {
      return { success: false, status: 'error' };
    }
  }, []);

  // Track if initial sync has occurred
  const isHydratedRef = useRef(false);
  const isSyncingRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(currentUser?.id || null);
  currentUserIdRef.current = currentUser?.id || null;
  const currentUserRef = useRef<User | null>(currentUser);
  currentUserRef.current = currentUser;

  // Master Central Sync Function
  const fetchAndSyncAllFromSupabase = useCallback(async (force: boolean = false) => {
    // Prevent overlapping concurrent sync calls
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      // 1. Fetch main native tables - Try unified master endpoint first (100% authoritative via Service Role)
      let dbUsers: User[] | null = null;
      let dbProducts: InvestmentProduct[] | null = null;
      let dbInvestments: UserInvestment[] | null = null;
      let dbDeposits: DepositRequest[] | null = null;
      let dbWithdrawals: WithdrawalRequest[] | null = null;
      let dbProofs: WithdrawalProof[] | null = null;
      let dbTickets: SupportTicket[] | null = null;
      let dbCommissions: CommissionHistory[] | null = null;
      let dbBonusRows: any[] | null = null;
      let sysAnnouncements: Announcement[] | null = null;

      const master = await fetchAllTablesMaster(force);
      if (master) {
        if (master._isQuotaExceeded) {
          setIsQuotaExceeded(true);
          setSupabaseStatus('quota_exceeded');
        } else if (master._supabaseStatus === 'connected') {
          setIsQuotaExceeded(false);
          setSupabaseStatus('connected');
        }

        dbUsers = master.users || [];
        dbProducts = master.products || [];
        dbInvestments = master.investments || [];
        dbDeposits = master.deposits || [];
        dbWithdrawals = master.withdrawals || [];
        dbProofs = master.withdrawal_proofs || [];
        dbTickets = master.tickets || [];
        dbCommissions = master.commissions || [];
        dbBonusRows = master.bonus_codes || [];
        if (master.announcements && Array.isArray(master.announcements)) {
          sysAnnouncements = master.announcements;
        }
        if (master.tasks && Array.isArray(master.tasks) && master.tasks.length > 0) {
          setTasks(master.tasks);
          safeSetLocalStorage('fintech_tasks', master.tasks);
        } else {
          setTasks(prev => (prev && prev.length > 0 ? prev : OFFICIAL_TASKS));
        }
        if (master.task_claims && Array.isArray(master.task_claims)) {
          setUserTaskClaims(master.task_claims);
          safeSetLocalStorage('fintech_task_claims', master.task_claims);
        }
      } else {
        const [
          u, p, i, d, w, pr, t, c, b
        ] = await Promise.all([
          fetchTableData<User>('users'),
          fetchTableData<InvestmentProduct>('products'),
          fetchTableData<UserInvestment>('investments'),
          fetchTableData<DepositRequest>('deposits'),
          fetchTableData<WithdrawalRequest>('withdrawals'),
          fetchTableData<WithdrawalProof>('withdrawal_proofs'),
          fetchTableData<SupportTicket>('tickets'),
          fetchTableData<CommissionHistory>('commissions'),
          fetchTableData<any>('bonus_codes')
        ]);
        dbUsers = u;
        dbProducts = p;
        dbInvestments = i;
        dbDeposits = d;
        dbWithdrawals = w;
        dbProofs = pr;
        dbTickets = t;
        dbCommissions = c;
        dbBonusRows = b;
      }

      // Process Users
      if (dbUsers && dbUsers.length > 0) {
        const enrichedUsers = dbUsers.map(u => {
          const auth = parseAuthFromPinHash(u.withdrawalPinHash);
          return {
            ...u,
            country: 'Cameroun',
            withdrawalNetwork: auth.network || u.withdrawalNetwork || 'MTN Mobile Money',
            withdrawalCountry: 'CM'
          };
        });
        const dedupedUsers = deduplicateById(enrichedUsers);
        setUsers(dedupedUsers);
        safeSetLocalStorage('fintech_users', dedupedUsers);

        // Extract and update passwords dictionary from withdrawalPinHash
        setPasswords(prev => {
          const next = { ...prev };
          dedupedUsers.forEach(u => {
            const auth = parseAuthFromPinHash(u.withdrawalPinHash);
            if (auth.pwd) {
              const clean = u.phone.trim();
              const stripped = clean.replace(/\s+/g, '').replace(/[^\d+]/g, '');
              next[clean] = auth.pwd;
              next[stripped] = auth.pwd;
              next[u.phone] = auth.pwd;
            }
          });
          safeSetLocalStorage('fintech_passwords', next);
          return next;
        });

        // Dynamic sync of currentUser balance/info if currently logged in
        if (currentUserRef.current) {
          const currentId = currentUserRef.current.id;
          const currentPhoneClean = (currentUserRef.current.phone || '').replace(/\s+/g, '').replace(/[^\d+]/g, '');
          const freshUser = dedupedUsers.find(u => 
            u.id === currentId || 
            (currentPhoneClean && u.phone && u.phone.replace(/\s+/g, '').replace(/[^\d+]/g, '') === currentPhoneClean)
          );
          if (freshUser) {
            setCurrentUser(prev => {
              if (!prev || JSON.stringify(prev) !== JSON.stringify(freshUser)) {
                safeSetSessionStorage('fintech_current_user', freshUser);
                safeSetLocalStorage('fintech_current_user', freshUser);
                return freshUser;
              }
              return prev;
            });
          }
        }
      }

      // Process Products: DB is the authoritative single source of truth
      if (dbProducts && dbProducts.length > 0) {
        const dedupedProducts = syncOfficialProductData(deduplicateById(dbProducts));
        setProducts(dedupedProducts);
        safeSetLocalStorage('fintech_products', dedupedProducts);
      } else {
        // Seed official investment products to DB and state
        setProducts(OFFICIAL_INVESTMENT_PRODUCTS);
        safeSetLocalStorage('fintech_products', OFFICIAL_INVESTMENT_PRODUCTS);
        OFFICIAL_INVESTMENT_PRODUCTS.forEach(p => {
          upsertItem('products', p);
        });
      }

      // Process Investments
      if (dbInvestments) {
        const dedupedInvestments = deduplicateById(dbInvestments);
        setUserInvestments(dedupedInvestments);
        safeSetLocalStorage('fintech_investments', dedupedInvestments);
      }

      // Process Deposits (sort newest first)
      if (dbDeposits) {
        const sortedDep = deduplicateById([...dbDeposits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setDeposits(sortedDep);
        safeSetLocalStorage('fintech_deposits', sortedDep);
      }

      // Process Withdrawals (sort newest first)
      if (dbWithdrawals) {
        const sortedWth = deduplicateById([...dbWithdrawals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setWithdrawals(sortedWth);
        safeSetLocalStorage('fintech_withdrawals', sortedWth);
      }

      // Process Withdrawal Proofs (sort newest first)
      if (dbProofs) {
        const sortedProofs = deduplicateById([...dbProofs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setWithdrawalProofs(sortedProofs);
        safeSetLocalStorage('aurainvest_withdrawal_proofs', sortedProofs);
        safeSetLocalStorage('fintech_withdrawal_proofs', sortedProofs);
      }

      // Process Support Tickets / Chat (merge and sort newest first to ensure messages never disappear)
      if (dbTickets) {
        setTickets(prev => {
          const merged = [...dbTickets, ...prev];
          const sortedTickets = deduplicateById(merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          safeSetLocalStorage('fintech_tickets', sortedTickets);
          return sortedTickets;
        });
      }

      // Process Commissions (sort newest first)
      if (dbCommissions) {
        const sortedComms = deduplicateById([...dbCommissions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setCommissions(sortedComms);
        safeSetLocalStorage('fintech_commissions', sortedComms);
      }

      // Process Bonus Codes & System Configs
      if (dbBonusRows && Array.isArray(dbBonusRows)) {
        const realBonus: BonusCode[] = [];
        let sysFaqs: FaqItem[] | null = null;
        let sysWheel: WheelConfig | null = null;
        let sysDraws: DrawRecord[] | null = null;
        let sysRevLogs: RevenueLog[] | null = null;
        let sysRechargeChannels: RechargeChannel[] | null = null;
        let sysNotif: string | null = null;

        dbBonusRows.forEach(row => {
          if (row.code === '__SYS_ANNOUNCEMENTS__') {
            sysAnnouncements = deduplicateById(row.usedBy || []);
          } else if (row.code === '__SYS_FAQS__') {
            sysFaqs = deduplicateById(row.usedBy || []);
          } else if (row.code === '__SYS_WELLNESS__') {
            // Actively eradicate legacy wellness key from database
            deleteSystemConfig('__SYS_WELLNESS__');
          } else if (row.code === '__SYS_RECHARGE_CHANNELS__') {
            if (Array.isArray(row.usedBy)) {
              sysRechargeChannels = deduplicateById(row.usedBy);
            } else if (typeof row.usedBy === 'string') {
              try {
                const parsed = JSON.parse(row.usedBy);
                sysRechargeChannels = Array.isArray(parsed) ? deduplicateById(parsed) : [];
              } catch (_) {
                sysRechargeChannels = [];
              }
            } else {
              sysRechargeChannels = [];
            }
          } else if (row.code === '__SYS_WHEEL_CONFIG__') {
            if (row.usedBy && Array.isArray(row.usedBy) && row.usedBy[0]) {
              const cfg = row.usedBy[0];
              sysWheel = {
                ...cfg,
                prizes: deduplicateById(cfg.prizes || [])
              };
            }
          } else if (row.code === '__SYS_DRAW_RECORDS__') {
            sysDraws = deduplicateById(row.usedBy || []);
          } else if (row.code === '__SYS_REVENUE_LOGS__') {
            sysRevLogs = deduplicateById(row.usedBy || []);
          } else if (row.code === '__SYS_GLOBAL_NOTIF__') {
            if (row.usedBy && Array.isArray(row.usedBy) && row.usedBy[0]?.notif) {
              sysNotif = row.usedBy[0].notif;
            }
          } else {
            realBonus.push({
              code: row.code,
              amount: row.amount,
              maxUses: row.maxUses,
              usedBy: Array.isArray(row.usedBy) ? row.usedBy : [],
              createdAt: row.createdAt
            });
          }
        });

        // Deduplicate real bonus codes by code
        const seenBonus = new Set<string>();
        const dedupedRealBonus = realBonus.filter(b => {
          if (!b || !b.code || seenBonus.has(b.code)) return false;
          seenBonus.add(b.code);
          return true;
        });

        setBonusCodes(dedupedRealBonus);
        safeSetLocalStorage('fintech_bonus_codes', dedupedRealBonus);

        if (sysAnnouncements) {
          setAnnouncements(sysAnnouncements);
          safeSetLocalStorage('fintech_announcements', sysAnnouncements);
        }
        if (sysFaqs) {
          setFaqs(sysFaqs);
          safeSetLocalStorage('fintech_faqs', sysFaqs);
        }
        if (sysRechargeChannels !== null) {
          const normalizedSysChannels = normalizeRechargeChannels(sysRechargeChannels);
          setRechargeChannels(normalizedSysChannels);
          safeSetLocalStorage('fintech_recharge_channels', normalizedSysChannels);
          if (JSON.stringify(normalizedSysChannels) !== JSON.stringify(sysRechargeChannels)) {
            saveSystemConfig('__SYS_RECHARGE_CHANNELS__', normalizedSysChannels).catch(() => {});
          }
        } else {
          // Initialize defaults in Supabase if not yet present
          saveSystemConfig('__SYS_RECHARGE_CHANNELS__', rechargeChannels).catch(() => {});
        }
        if (sysWheel) {
          setWheelConfig(sysWheel);
          safeSetLocalStorage('fintech_wheel_config', sysWheel);
        }
        if (sysDraws) {
          setDrawRecords(sysDraws);
          safeSetLocalStorage('fintech_draw_records', sysDraws);
        }
        if (sysRevLogs) {
          setRevenueLogs(sysRevLogs);
          safeSetLocalStorage('fintech_revenue_logs', sysRevLogs);
        }
        if (sysNotif !== null) {
          setGlobalNotification(sysNotif);
          safeSetLocalStorage('fintech_global_notification', sysNotif);
        }
      }

      // Dedicated robust endpoint sync: Announcements, Tasks and Claims (Independent of Supabase bonus rows)
      try {
        fetch('/api/announcements')
          .then(res => res.json())
          .then(data => {
            if (data && data.success && Array.isArray(data.announcements)) {
              setAnnouncements(data.announcements);
              safeSetLocalStorage('fintech_announcements', data.announcements);
            }
          })
          .catch(() => {});

        fetch('/api/tasks')
          .then(res => res.json())
          .then(data => {
            if (data && data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
              setTasks(data.tasks);
              safeSetLocalStorage('fintech_tasks', data.tasks);
            } else {
              setTasks(prev => (prev && prev.length > 0 ? prev : OFFICIAL_TASKS));
            }
          })
          .catch(() => {
            setTasks(prev => (prev && prev.length > 0 ? prev : OFFICIAL_TASKS));
          });

        fetch('/api/tasks/claims')
          .then(res => res.json())
          .then(data => {
            if (data && data.success && Array.isArray(data.claims)) {
              setUserTaskClaims(data.claims);
              safeSetLocalStorage('fintech_task_claims', data.claims);
            }
          })
          .catch(() => {});
      } catch (_) {}

      isHydratedRef.current = true;
    } catch (err) {
      console.warn('[Sync] Supabase fetch error:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Initial mount: load immediately, start continuous fast background polling (4s)
  useEffect(() => {
    fetchAndSyncAllFromSupabase();
    
    // Fast periodic background sync (4 seconds for real-time balance updates)
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        fetchAndSyncAllFromSupabase();
      }
    }, 4000);

    const onVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchAndSyncAllFromSupabase();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    const onChannelsUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setRechargeChannels(normalizeRechargeChannels(e.detail));
      }
    };
    window.addEventListener('recharge_channels_updated', onChannelsUpdated);

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === 'fintech_recharge_channels' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setRechargeChannels(normalizeRechargeChannels(parsed));
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', onStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
      window.removeEventListener('recharge_channels_updated', onChannelsUpdated);
      window.removeEventListener('storage', onStorageChange);
    };
  }, [fetchAndSyncAllFromSupabase]);

  // Automatic 24h revenue distribution cycle
  useEffect(() => {
    const checkAndDistributeEarnings = () => {
      if (!currentUser || userInvestments.length === 0) return;

      let hasEarned = false;
      let totalDailyGain = 0;
      const newLogs: RevenueLog[] = [];

      const updatedInvestments = userInvestments.map(inv => {
        if (inv.userId === currentUser.id && inv.daysRemaining > 0) {
          const lastClaim = new Date(inv.lastClaimDate).getTime();
          const now = Date.now();
          const hoursElapsed = (now - lastClaim) / (3600 * 1000);

          if (hoursElapsed >= 24) {
            const cycles = Math.min(Math.floor(hoursElapsed / 24), inv.daysRemaining);
            if (cycles > 0) {
              hasEarned = true;
              const gainForInv = (inv.dailyGain || 0) * cycles;
              totalDailyGain += gainForInv;
              const newClaimTime = lastClaim + (cycles * 24 * 3600 * 1000);

              newLogs.push({
                id: `rev-${Date.now()}-${inv.id}-${Math.random().toString(36).slice(2, 6)}`,
                userId: currentUser.id,
                investmentId: inv.id,
                productName: `${inv.productName || 'Rendement Quotidien'} (${cycles}x 24h)`,
                amount: gainForInv,
                creditedAt: new Date().toISOString()
              });

              return {
                ...inv,
                daysRemaining: inv.daysRemaining - cycles,
                lastClaimDate: new Date(newClaimTime).toISOString()
              };
            }
          }
        }
        return inv;
      });

      if (hasEarned && totalDailyGain > 0) {
        setUserInvestments(updatedInvestments);
        safeSetLocalStorage('fintech_investments', updatedInvestments);
        
        // Sync updated investments to Supabase
        updatedInvestments.forEach(inv => {
          if (inv.userId === currentUser.id) {
            updateItem('investments', { daysRemaining: inv.daysRemaining, lastClaimDate: inv.lastClaimDate }, inv.id);
          }
        });

        // Credit User Balance in DB & locally
        const newBalance = (currentUser.balance || 0) + totalDailyGain;
        const newTotalEarnings = (currentUser.totalEarnings || 0) + totalDailyGain;
        const updatedUser = {
          ...currentUser,
          balance: newBalance,
          dailyEarnings: totalDailyGain,
          totalEarnings: newTotalEarnings
        };

        setCurrentUser(updatedUser);
        safeSetSessionStorage('fintech_current_user', updatedUser);
        safeSetLocalStorage('fintech_current_user', updatedUser);

        setUsers(prev => {
          const ulist = prev.map(u => u.id === currentUser.id ? updatedUser : u);
          safeSetLocalStorage('fintech_users', ulist);
          return ulist;
        });

        updateItem('users', {
          balance: newBalance,
          dailyEarnings: totalDailyGain,
          totalEarnings: newTotalEarnings
        }, currentUser.id);

        if (newLogs.length > 0) {
          setRevenueLogs(prev => {
            const updatedLogs = [...newLogs, ...prev];
            safeSetLocalStorage('fintech_revenue_logs', updatedLogs);
            saveSystemConfig('__SYS_REVENUE_LOGS__', updatedLogs);
            return updatedLogs;
          });
        }
      }
    };

    checkAndDistributeEarnings();
    const interval = setInterval(checkAndDistributeEarnings, 4000);
    return () => clearInterval(interval);
  }, [userInvestments, currentUser]);

  // ==========================================
  // AUTHENTICATION OPERATIONS
  // ==========================================
  const login = async (phone: string, word: string, country?: string): Promise<{ success: boolean; error?: string }> => {
    const phoneInfo = extractPhoneDetails(phone, country);
    const cleanPhone = phoneInfo.cleanPhone;
    const rawDigits = phoneInfo.allDigits;
    const nationalDigits = phoneInfo.nationalDigits;
    const strippedPhone = cleanPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

    // 1. First attempt authoritative fast server login endpoint
    try {
      const serverAuth = await loginUserInDatabase(cleanPhone, word, country || phoneInfo.countryCode);
      if (serverAuth && serverAuth.success && serverAuth.user) {
        const user = serverAuth.user;
        const auth = parseAuthFromPinHash(user.withdrawalPinHash);
        const resolvedCountry = user.country || country || (phoneInfo.countryCode === 'TG' ? 'Togo' : (phoneInfo.countryCode === 'BF' ? 'Burkina Faso' : (phoneInfo.countryCode === 'BJ' ? 'Bénin' : (phoneInfo.countryCode === 'CI' ? 'Côte d’Ivoire' : 'Cameroun'))));
        const isTogo = resolvedCountry.toLowerCase().includes('togo');
        const isAdmin = user.role === 'admin' || user.id?.includes('admin') || user.phone?.includes('90123456') || user.phone?.includes('97194059') || user.phone?.includes('91902026') || user.phone?.includes('90554433');
        const enrichedUser: User = {
          ...user,
          role: isAdmin ? 'admin' : user.role,
          country: resolvedCountry,
          withdrawalNetwork: auth.network || user.withdrawalNetwork || (isTogo ? 'TMoney' : 'Orange Money'),
          withdrawalCountry: user.withdrawalCountry || phoneInfo.countryCode || (isTogo ? 'TG' : 'TG')
        };

        setCurrentUser(enrichedUser);
        safeSetSessionStorage('fintech_current_user', enrichedUser);
        safeSetLocalStorage('fintech_current_user', enrichedUser);

        // Update local memory and cache
        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== enrichedUser.id);
          const next = [enrichedUser, ...filtered];
          safeSetLocalStorage('fintech_users', next);
          return next;
        });

        setPasswords(prev => {
          const next = {
            ...prev,
            [cleanPhone]: word,
            [strippedPhone]: word,
            [enrichedUser.phone]: word
          };
          if (rawDigits) next[rawDigits] = word;
          if (nationalDigits) next[nationalDigits] = word;
          safeSetLocalStorage('fintech_passwords', next);
          return next;
        });

        // Trigger lightweight non-blocking background sync
        setTimeout(() => {
          fetchAndSyncAllFromSupabase();
        }, 100);

        return { success: true };
      } else if (serverAuth && serverAuth.error && !serverAuth.error.includes("Impossible de joindre")) {
        // Explicit rejection from server (wrong password, user not found, blocked)
        return { success: false, error: serverAuth.error };
      }
    } catch (_) {}

    // 2. Offline / Local fallback with accurate candidate matching
    const user = users.find(u => {
      const uInfo = extractPhoneDetails(u.phone, u.country);
      if (phoneInfo.candidates.includes(u.phone) || phoneInfo.candidates.includes(uInfo.cleanPhone)) {
        return true;
      }
      if (phoneInfo.nationalDigits && uInfo.nationalDigits === phoneInfo.nationalDigits) {
        return true;
      }
      if (u.withdrawalAccountNumber && u.withdrawalAccountNumber === phoneInfo.nationalDigits) {
        return true;
      }
      return uInfo.cleanPhone === cleanPhone || u.phone === cleanPhone || u.phone.replace(/\s+/g, '') === cleanPhone;
    });
    
    if (!user) {
      return { success: false, error: "Compte introuvable. Veuillez vérifier votre numéro ou vous inscrire." };
    }
    
    if (user.isBlocked) {
      return { success: false, error: "Ce compte a été suspendu par l'administration. Contactez le support." };
    }

    // Check credentials
    const authObj = parseAuthFromPinHash(user.withdrawalPinHash);
    const correctWord = authObj.pwd || passwords[user.phone] || passwords[cleanPhone] || passwords[strippedPhone] || (rawDigits ? passwords[rawDigits] : undefined);
    
    // Special admin emergency fallback
    const isSpecialAdmin = (user.role === 'admin' || user.id.includes('admin') || user.phone?.includes('90123456') || user.phone?.includes('97194059') || user.phone?.includes('91902026') || user.phone?.includes('90554433')) && (
      word === '123456' ||
      word === 'Nutrien@Admin2026#' ||
      word === 'admin123' ||
      word === 'NutrienAdmin#2026!SecX' ||
      word === 'ADMIN7'
    );

    if (correctWord !== word && !isSpecialAdmin) {
      return { success: false, error: "Mot de passe incorrect. Veuillez réessayer." };
    }
    
    setCurrentUser(user);
    safeSetSessionStorage('fintech_current_user', user);
    safeSetLocalStorage('fintech_current_user', user);
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
    const phoneInfo = extractPhoneDetails(data.phone, data.country);
    const finalCountry = data.country || (phoneInfo.countryCode === 'TG' ? 'Togo' : (phoneInfo.countryCode === 'BF' ? 'Burkina Faso' : (phoneInfo.countryCode === 'BJ' ? 'Bénin' : (phoneInfo.countryCode === 'CI' ? 'Côte d’Ivoire' : 'Cameroun'))));
    const cleanPhone = phoneInfo.cleanPhone;
    const rawDigits = phoneInfo.allDigits;
    const nationalDigits = phoneInfo.nationalDigits;
    const strippedPhone = cleanPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

    // Referral code validation
    const refCode = 'INV' + Math.floor(100000 + Math.random() * 900000);
    let referredByCodeObj: string | null = null;
    if (data.referrerCode && data.referrerCode.trim()) {
      const codeClean = data.referrerCode.trim();
      const codeDigits = codeClean.replace(/\D/g, '');
      const parent = users.find(u => 
        u.referralCode?.toLowerCase() === codeClean.toLowerCase() || 
        u.phone === codeClean || 
        u.phone.replace(/\s+/g, '') === codeClean.replace(/\s+/g, '') ||
        (codeDigits.length >= 8 && u.phone.replace(/\D/g, '').endsWith(codeDigits))
      );
      if (parent) {
        referredByCodeObj = parent.referralCode;
      } else if (codeClean.toUpperCase() === 'ADMIN' || codeClean.toUpperCase() === 'ADMIN01' || codeClean.toUpperCase() === 'TOGO2026' || codeClean === '97194059' || codeClean === '90123456') {
        referredByCodeObj = 'TOGO2026';
      } else {
        referredByCodeObj = codeClean.toUpperCase();
      }
    }

    const defaultNetwork = phoneInfo.countryCode === 'TG' ? 'TMoney' : (phoneInfo.countryCode === 'BF' ? 'Orange Money' : (phoneInfo.countryCode === 'BJ' ? 'MTN Mobile Money' : (phoneInfo.countryCode === 'CI' ? 'Wave' : 'MTN Mobile Money')));
    const defaultCountryCode = phoneInfo.countryCode || 'TG';
    const pinHash = buildPinHash(data.word, '', defaultNetwork, defaultCountryCode);
    
    const newUser: User = {
      id: 'usr-' + Math.floor(100000 + Math.random() * 9000000),
      name: (data.name && data.name.trim()) ? data.name.trim() : `Membre ${nationalDigits.slice(-4)}`,
      phone: cleanPhone,
      whatsapp: data.whatsapp ? extractPhoneDetails(data.whatsapp, data.country).cleanPhone : cleanPhone,
      country: finalCountry,
      balance: 1500, // 1500 XOF bonus d'inscription
      dailyEarnings: 0,
      totalEarnings: 0,
      vipLevel: 0,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      role: 'user',
      referralCode: refCode,
      referredByCode: referredByCodeObj,
      withdrawalPinHash: pinHash,
      withdrawalNetwork: defaultNetwork,
      withdrawalCountry: defaultCountryCode
    };

    // Save directly to central Supabase (Server-side Service Role endpoint for 100% cross-device reliability)
    const regResult = await registerUserInDatabase(newUser);
    if (!regResult.success) {
      return { success: false, error: regResult.error || "Erreur lors de l'enregistrement du compte." };
    }

    const savedUser: User = regResult.user ? {
      ...newUser,
      ...regResult.user,
      withdrawalNetwork: defaultNetwork,
      withdrawalCountry: defaultCountryCode
    } : newUser;
    
    // Update local state and credentials
    setPasswords(prev => ({ 
      ...prev, 
      [cleanPhone]: data.word,
      [strippedPhone]: data.word,
      [savedUser.phone]: data.word,
      ...(rawDigits ? { [rawDigits]: data.word } : {}),
      ...(nationalDigits ? { [nationalDigits]: data.word } : {})
    }));
    setUsers(prev => [savedUser, ...prev.filter(u => u.id !== savedUser.id)]);
    safeSetLocalStorage('fintech_users', [savedUser, ...users.filter(u => u.id !== savedUser.id)]);
    
    setCurrentUser(savedUser);
    safeSetSessionStorage('fintech_current_user', savedUser);
    safeSetLocalStorage('fintech_current_user', savedUser);

    // Non-blocking background sync
    setTimeout(() => {
      fetchAndSyncAllFromSupabase();
    }, 150);
    
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    safeRemoveSessionStorage('fintech_current_user');
    safeRemoveLocalStorage('fintech_current_user');
  };

  const updateProfile = (data: { name: string; whatsapp: string; country: string }) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    safeSetSessionStorage('fintech_current_user', updated);
    safeSetLocalStorage('fintech_current_user', updated);

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    updateItem('users', data, currentUser.id);
  };

  const changePassword = (oldWord: string, newWord: string) => {
    if (!currentUser) return { success: false, error: "Non connecté" };
    const authObj = parseAuthFromPinHash(currentUser.withdrawalPinHash);
    const saved = authObj.pwd || passwords[currentUser.phone];
    if (saved && saved !== oldWord) {
      return { success: false, error: "Ancien mot de passe incorrect." };
    }
    
    const newHash = buildPinHash(newWord, authObj.pin, currentUser.withdrawalPinHash);
    const updatedUser = { ...currentUser, withdrawalPinHash: newHash };
    
    setCurrentUser(updatedUser);
    safeSetSessionStorage('fintech_current_user', updatedUser);
    safeSetLocalStorage('fintech_current_user', updatedUser);

    setPasswords(prev => ({ ...prev, [currentUser.phone]: newWord }));
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    updateItem('users', { withdrawalPinHash: newHash }, currentUser.id);
    return { success: true };
  };

  // ==========================================
  // USER ACTIONS
  // ==========================================
  const buyInvestment = async (productId: string, quantity: number = 1): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Veuillez vous connecter." };
    
    const product = products.find(p => p.id === productId && p.isActive);
    if (!product) return { success: false, error: "Produit indisponible." };
    
    const dbUser = users.find(u => u.id === currentUser.id) || currentUser;
    const totalPrice = product.price * quantity;
    if (dbUser.balance < totalPrice) {
      return { success: false, error: `Solde insuffisant. Le montant total est de ${totalPrice.toLocaleString()} FCFA et votre solde disponible est de ${dbUser.balance.toLocaleString()} FCFA. Veuillez effectuer un dépôt.` };
    }

    // 1. Authoritative Backend Transaction (Persists in Supabase)
    try {
      const serverRes = await buyProductInvestment(dbUser.id, product.id, quantity);
      if (serverRes && serverRes.success && serverRes.investments) {
        const newInvestments = serverRes.investments as UserInvestment[];
        setUserInvestments(prev => [...newInvestments, ...prev.filter(inv => !newInvestments.some(ni => ni.id === inv.id))]);
        safeSetLocalStorage('fintech_investments', [...newInvestments, ...userInvestments]);

        const updatedUser = serverRes.user ? { ...currentUser, ...serverRes.user } : {
          ...currentUser,
          balance: serverRes.newBalance ?? (dbUser.balance - totalPrice),
          vipLevel: Math.max(currentUser.vipLevel, parseInt(product.name.replace(/\D/g, '')) || 1),
          dailyEarnings: (currentUser.dailyEarnings || 0) + (product.dailyGain * quantity)
        };

        setCurrentUser(updatedUser);
        safeSetSessionStorage('fintech_current_user', updatedUser);
        safeSetLocalStorage('fintech_current_user', updatedUser);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

        // Resync
        setTimeout(() => fetchAndSyncAllFromSupabase(), 300);
        return { success: true };
      }
    } catch (err) {
      console.warn('[buyInvestment] Server transaction notice, fallback to direct DB sync:', err);
    }
    
    // 2. Client fallback
    const newBalance = dbUser.balance - totalPrice;
    const currentVLevel = Math.max(dbUser.vipLevel, parseInt(product.name.replace(/\D/g, '')) || 1);
    
    // Add User Investments
    const newInvestments: UserInvestment[] = [];
    for (let i = 0; i < quantity; i++) {
      const inv: UserInvestment = {
        id: 'inv-' + Math.random().toString(36).substr(2, 9),
        userId: dbUser.id,
        productId: product.id,
        productName: product.name,
        price: product.price,
        dailyGain: product.dailyGain,
        duration: product.duration,
        daysRemaining: product.duration,
        purchaseDate: new Date().toISOString(),
        lastClaimDate: new Date().toISOString()
      };
      newInvestments.push(inv);
      upsertItem('investments', inv);
    }
    
    setUserInvestments(prev => [...newInvestments, ...prev]);
    safeSetLocalStorage('fintech_investments', [...newInvestments, ...userInvestments]);
    
    // Calculate Multi-level Referral commissions
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

    updateItem('users', {
      balance: newBalance,
      vipLevel: currentVLevel,
      dailyEarnings: dbUser.dailyEarnings + (product.dailyGain * quantity)
    }, dbUser.id);
    
    const newCommissions: CommissionHistory[] = [];
    if (dbUser.referredByCode) {
      const l1 = updatedUsers.find(u => u.referralCode === dbUser.referredByCode);
      if (l1) {
        const commL1 = Math.round(totalPrice * 0.20); // 20% Level 1
        const ticketsGained = (wheelConfig?.ticketsPerReferral || 1) * quantity;
        const newL1Balance = l1.balance + commL1;
        const newL1Total = l1.totalEarnings + commL1;
        const newL1Tickets = (l1.drawTickets || 0) + ticketsGained;

        updatedUsers = updatedUsers.map(u => u.id === l1.id ? { 
          ...u, 
          balance: newL1Balance, 
          totalEarnings: newL1Total,
          drawTickets: newL1Tickets
        } : u);

        updateItem('users', {
          balance: newL1Balance,
          totalEarnings: newL1Total,
          drawTickets: newL1Tickets
        }, l1.id);

        const commObj1: CommissionHistory = {
          id: 'comm-' + Math.random().toString(36).substr(2, 9),
          referrerId: l1.id,
          refereeId: dbUser.id,
          refereeName: dbUser.name,
          amount: commL1,
          level: 1,
          createdAt: new Date().toISOString()
        };
        newCommissions.push(commObj1);
        upsertItem('commissions', commObj1);
        
        // Level 2 (2%)
        if (l1.referredByCode) {
          const l2 = updatedUsers.find(u => u.referralCode === l1.referredByCode);
          if (l2) {
            const commL2 = Math.round(totalPrice * 0.02); // 2% Level 2
            const newL2Balance = l2.balance + commL2;
            const newL2Total = l2.totalEarnings + commL2;

            updatedUsers = updatedUsers.map(u => u.id === l2.id ? { ...u, balance: newL2Balance, totalEarnings: newL2Total } : u);
            updateItem('users', { balance: newL2Balance, totalEarnings: newL2Total }, l2.id);

            const commObj2: CommissionHistory = {
              id: 'comm-' + Math.random().toString(36).substr(2, 9),
              referrerId: l2.id,
              refereeId: dbUser.id,
              refereeName: dbUser.name,
              amount: commL2,
              level: 2,
              createdAt: new Date().toISOString()
            };
            newCommissions.push(commObj2);
            upsertItem('commissions', commObj2);

            // Level 3 (1%)
            if (l2.referredByCode) {
              const l3 = updatedUsers.find(u => u.referralCode === l2.referredByCode);
              if (l3) {
                const commL3 = Math.round(totalPrice * 0.01); // 1% Level 3
                const newL3Balance = l3.balance + commL3;
                const newL3Total = l3.totalEarnings + commL3;

                updatedUsers = updatedUsers.map(u => u.id === l3.id ? { ...u, balance: newL3Balance, totalEarnings: newL3Total } : u);
                updateItem('users', { balance: newL3Balance, totalEarnings: newL3Total }, l3.id);

                const commObj3: CommissionHistory = {
                  id: 'comm-' + Math.random().toString(36).substr(2, 9),
                  referrerId: l3.id,
                  refereeId: dbUser.id,
                  refereeName: dbUser.name,
                  amount: commL3,
                  level: 3,
                  createdAt: new Date().toISOString()
                };
                newCommissions.push(commObj3);
                upsertItem('commissions', commObj3);
              }
            }
          }
        }
      }
    }
    
    if (newCommissions.length > 0) {
      setCommissions(prev => [...newCommissions, ...prev]);
    }
    
    setUsers(updatedUsers);
    safeSetLocalStorage('fintech_users', updatedUsers);
    
    const currFresh = updatedUsers.find(u => u.id === currentUser.id);
    if (currFresh) {
      setCurrentUser(currFresh);
      safeSetSessionStorage('fintech_current_user', currFresh);
      safeSetLocalStorage('fintech_current_user', currFresh);
    }
    
    return { success: true };
  };

  const claimDailyEarning = (investmentId: string) => {
    if (!currentUser) return { success: false, error: "Veuillez vous connecter." };
    
    const investment = userInvestments.find(inv => inv.id === investmentId && inv.userId === currentUser.id);
    if (!investment) return { success: false, error: "Investissement introuvable." };
    
    if (investment.daysRemaining <= 0) {
      return { success: false, error: "Cet investissement est arrivé à terme." };
    }
    
    const hoursSinceClaim = (Date.now() - new Date(investment.lastClaimDate).getTime()) / (3600 * 1000);
    if (hoursSinceClaim < 22) {
      const remainingHours = Math.ceil(22 - hoursSinceClaim);
      return { success: false, error: `Vous avez déjà récupéré vos gains pour aujourd'hui. Réessayez dans environ ${remainingHours} heures.` };
    }
    
    const nextDaysRemaining = investment.daysRemaining - 1;
    const nextLastClaimDate = new Date().toISOString();

    const updatedInvestments = userInvestments.map(inv => {
      if (inv.id === investmentId) {
        return {
          ...inv,
          daysRemaining: nextDaysRemaining,
          lastClaimDate: nextLastClaimDate
        };
      }
      return inv;
    });
    
    setUserInvestments(updatedInvestments);
    updateItem('investments', { daysRemaining: nextDaysRemaining, lastClaimDate: nextLastClaimDate }, investmentId);
    
    const newBalance = currentUser.balance + investment.dailyGain;
    const newTotal = currentUser.totalEarnings + investment.dailyGain;
    const newDaily = (currentUser.dailyEarnings || 0) + investment.dailyGain;

    const updatedCurr = {
      ...currentUser,
      balance: newBalance,
      dailyEarnings: newDaily,
      totalEarnings: newTotal
    };

    setCurrentUser(updatedCurr);
    safeSetSessionStorage('fintech_current_user', updatedCurr);
    safeSetLocalStorage('fintech_current_user', updatedCurr);

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedCurr : u));
    updateItem('users', { balance: newBalance, dailyEarnings: newDaily, totalEarnings: newTotal }, currentUser.id);

    const newLog: RevenueLog = {
      id: `rev-${investment.id}-${Date.now()}`,
      userId: currentUser.id,
      investmentId: investment.id,
      productName: investment.productName,
      amount: investment.dailyGain,
      creditedAt: new Date().toISOString()
    };
    setRevenueLogs(prev => {
      const logs = [newLog, ...prev];
      saveSystemConfig('__SYS_REVENUE_LOGS__', logs);
      return logs;
    });

    return { success: true };
  };

  const requestDeposit = (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => {
    if (!currentUser) return { success: false, error: "Non connecté. Veuillez vous connecter." };
    if (!amount || isNaN(amount) || amount < 3000) {
      return { success: false, error: "Le montant minimum de recharge est de 3 000 FCFA." };
    }
    if (!method || (typeof method === 'string' && !method.trim())) {
      return { success: false, error: "Veuillez sélectionner un moyen / canal de paiement." };
    }
    if (!transactionId || !transactionId.trim() || transactionId.trim().length < 3) {
      return { success: false, error: "Le numéro / ID de transaction SMS est obligatoire." };
    }
    const cleanUserPhone = (currentUser.phone || '').trim();
    if (!cleanUserPhone || cleanUserPhone.length < 6) {
      return { success: false, error: "Numéro de téléphone utilisateur manquant ou invalide." };
    }
    
    const newDeposit: DepositRequest = {
      id: 'dep-' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      amount,
      method: typeof method === 'string' ? method.trim() : (method?.name || 'Mobile Money'),
      transactionId: transactionId.trim(),
      screenshotUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setDeposits(prev => {
      const updated = [newDeposit, ...prev];
      safeSetLocalStorage('fintech_deposits', updated);
      return updated;
    });
    submitDepositRequest(newDeposit);
    return { success: true };
  };

  const initiateDepositCheckout = async (params: {
    amount: number;
    country: string;
    countryCode: string;
    method: string;
    phoneNumber: string;
  }): Promise<{ success: boolean; error?: string; redirectUrl?: string; deposit?: DepositRequest }> => {
    if (!currentUser) return { success: false, error: "Non connecté. Veuillez vous connecter." };
    if (!params.amount || isNaN(params.amount) || params.amount < 3000) {
      return { success: false, error: "Le montant minimum de recharge est de 3 000 FCFA." };
    }
    if (!params.method || !params.method.trim()) {
      return { success: false, error: "Veuillez choisir un moyen de paiement." };
    }
    const cleanPhone = (params.phoneNumber || '').trim();
    if (!cleanPhone || cleanPhone.length < 6) {
      return { success: false, error: "Veuillez renseigner un numéro de téléphone valide." };
    }

    const res = await checkoutDeposit({
      userId: currentUser.id,
      amount: params.amount,
      country: params.country,
      countryCode: params.countryCode,
      method: params.method,
      phoneNumber: cleanPhone
    });

    if (res.success && res.deposit) {
      setDeposits(prev => {
        const filtered = prev.filter(d => d.id !== res.deposit.id);
        const updated = [res.deposit, ...filtered];
        safeSetLocalStorage('fintech_deposits', updated);
        return updated;
      });
      setTimeout(() => {
        fetchAndSyncAllFromSupabase(true);
      }, 400);
    }

    return res;
  };

  const saveWithdrawalAccount = async (
    accountName: string,
    accountNumber: string,
    pin: string,
    network?: string,
    country?: string,
    isAdminOverride?: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Non connecté." };

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

    const targetNetwork = network || currentUser.withdrawalNetwork || 'MTN Mobile Money';
    const targetCountry = country || currentUser.withdrawalCountry || 'CM';
    const authObj = parseAuthFromPinHash(currentUser.withdrawalPinHash);
    const newPinHash = buildPinHash(authObj.pwd, pin.trim(), targetNetwork, targetCountry, currentUser.withdrawalPinHash);

    const dbFields = {
      withdrawalAccountName: accountName.trim(),
      withdrawalAccountNumber: accountNumber.trim(),
      withdrawalPinHash: newPinHash
    };

    // Update in Supabase central DB first
    const res = await updateItem('users', dbFields, currentUser.id);
    if (!res.success) {
      return {
        success: false,
        error: res.error || "Erreur de connexion à la base de données centrale."
      };
    }

    const updatedUser: User = {
      ...currentUser,
      balance: currentUser.balance,
      dailyEarnings: currentUser.dailyEarnings,
      totalEarnings: currentUser.totalEarnings,
      vipLevel: currentUser.vipLevel,
      drawTickets: currentUser.drawTickets,
      ...dbFields,
      withdrawalNetwork: targetNetwork,
      withdrawalCountry: targetCountry
    };

    setCurrentUser(updatedUser);
    safeSetSessionStorage('fintech_current_user', updatedUser);
    safeSetLocalStorage('fintech_current_user', updatedUser);
    setUsers(prev => {
      const nextUsers = prev.map(u => u.id === currentUser.id ? updatedUser : u);
      safeSetLocalStorage('fintech_users', nextUsers);
      return nextUsers;
    });

    return { success: true };
  };

  const sendAdminDirectMessage = async (userId: string, message: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !message.trim()) return { success: false, error: "Message ou utilisateur invalide." };
    const targetUser = users.find(u => u.id === userId || u.phone === userId || u.name === userId);
    const actualUserId = targetUser?.id || userId;
    const userName = targetUser?.name || 'Client ' + userId.slice(0, 5);
    const userPhone = targetUser?.phone || null;

    const nowIso = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: 'tkt-adm-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7),
      userId: actualUserId,
      userName: userName,
      userPhone: userPhone || undefined,
      subject: "Message de l'Administration",
      message: "Message direct du Support Client AirPods.",
      reply: message.trim(),
      status: 'closed',
      createdAt: nowIso,
      replyCreatedAt: nowIso,
      isReadByUser: false
    };

    setTickets(prev => {
      const updated = [newTicket, ...prev];
      safeSetLocalStorage('fintech_tickets', updated);
      return updated;
    });

    const res = await sendAdminDirectSupportTicket(actualUserId, message.trim(), "Message de l'Administration");
    if (!res.success) {
      await insertItem('tickets', newTicket);
    }
    return { success: true };
  };

  const requestWithdrawal = (amount: number, network: any, accountNumber: string) => {
    if (!currentUser) return { success: false, error: "Non connecté." };

    const currentHour = new Date().getHours();
    if (currentHour < 9 || currentHour >= 17) {
      return { success: false, error: "Les retraits sont uniquement autorisés de 09h00 à 17h00." };
    }

    const hasActiveProduct = userInvestments.some(
      inv => inv.userId === currentUser.id && inv.daysRemaining > 0
    );
    if (!hasActiveProduct) {
      return { success: false, error: "Impossible d'effectuer un retrait : vous devez posséder au moins un produit actif." };
    }

    if (amount < 1500) return { success: false, error: "Le montant minimum de retrait est de 1 500 XOF." };
    if (!accountNumber.trim()) return { success: false, error: "Le numéro de compte de réception est requis." };
    
    const dbUser = users.find(u => u.id === currentUser.id) || currentUser;
    if (dbUser.balance < amount) {
      return { success: false, error: "Solde insuffisant pour ce montant de retrait." };
    }

    const todayIso = new Date().toISOString().split('T')[0];
    const todaysWithdrawalsCount = withdrawals.filter(w => w.userId === currentUser.id && w.createdAt.startsWith(todayIso)).length;
    if (todaysWithdrawalsCount >= 2) {
      return { success: false, error: "Vous avez déjà effectué 2 demandes de retrait aujourd'hui. Limité à 2 retraits par jour." };
    }
    
    // Deduct balance
    const newBalance = dbUser.balance - amount;
    const updatedUser = { ...currentUser, balance: newBalance };
    setCurrentUser(updatedUser);
    safeSetSessionStorage('fintech_current_user', updatedUser);
    safeSetLocalStorage('fintech_current_user', updatedUser);

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    updateItem('users', { balance: newBalance }, currentUser.id);
    
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
      accountNumber: accountNumber.trim(),
      status: 'pending',
      createdAt: now.toISOString()
    };
    
    setWithdrawals(prev => [newWithdrawal, ...prev]);
    safeSetLocalStorage('fintech_withdrawals', [newWithdrawal, ...withdrawals]);
    submitWithdrawalRequest(newWithdrawal);
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
    
    const newUsedBy = [...(bonus.usedBy || []), currentUser.id];
    setBonusCodes(prev => prev.map(b => b.code.toUpperCase() === cleanCode ? { ...b, usedBy: newUsedBy } : b));
    updateItem('bonus_codes', { usedBy: newUsedBy }, bonus.code, 'code');
    
    // Credit User balance
    const newBalance = (currentUser.balance || 0) + bonus.amount;
    const newTotal = (currentUser.totalEarnings || 0) + bonus.amount;
    const updatedCurrent = {
      ...currentUser,
      balance: newBalance,
      totalEarnings: newTotal
    };

    setCurrentUser(updatedCurrent);
    safeSetSessionStorage('fintech_current_user', updatedCurrent);
    safeSetLocalStorage('fintech_current_user', updatedCurrent);

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedCurrent : u));
    updateItem('users', { balance: newBalance, totalEarnings: newTotal }, currentUser.id);
    
    return { success: true, amount: bonus.amount };
  };

  const claimDailyBonus = () => {
    if (!currentUser) return { success: false, error: "Non connecté." };
    
    const bonusKey = `daily_bonus_claim_${currentUser.id}`;
    const lastClaim = safeGetLocalStorage(bonusKey);
    const bonusAmount = 20; // 20 FCFA strictly
    
    if (lastClaim) {
      const hoursSinceClaim = (Date.now() - parseInt(lastClaim)) / (3600 * 1000);
      if (hoursSinceClaim < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceClaim);
        return { success: false, error: `Revenez demain ! Prochain pointage disponible dans ${remainingHours} heures.` };
      }
    }
    
    safeSetLocalStorage(bonusKey, Date.now().toString());
    
    const newBalance = currentUser.balance + bonusAmount;
    const newTotal = currentUser.totalEarnings + bonusAmount;
    const updatedUser = {
      ...currentUser,
      balance: newBalance,
      totalEarnings: newTotal
    };

    setCurrentUser(updatedUser);
    safeSetSessionStorage('fintech_current_user', updatedUser);
    safeSetLocalStorage('fintech_current_user', updatedUser);

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    updateItem('users', { balance: newBalance, totalEarnings: newTotal }, currentUser.id);
    
    return { success: true, amount: bonusAmount };
  };

  const spinLuckyWheel = () => {
    if (!currentUser) return { success: false, error: "Veuillez vous connecter." };

    const dbUser = users.find(u => u.id === currentUser.id) || currentUser;
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

    const validPrizes = rawPrizes.map(p => {
      const clamped = Math.min(50, Math.max(25, Number(p.value) || 25));
      return {
        ...p,
        value: clamped,
        label: `+${clamped} FCFA`
      };
    });

    const prize = validPrizes[Math.floor(Math.random() * validPrizes.length)];

    const nextTickets = Math.max(0, (dbUser.drawTickets || 1) - 1);
    const nextBalance = dbUser.balance + prize.value;
    const nextTotal = dbUser.totalEarnings + prize.value;

    const updatedUser = {
      ...dbUser,
      drawTickets: nextTickets,
      balance: nextBalance,
      totalEarnings: nextTotal
    };

    setCurrentUser(updatedUser);
    safeSetSessionStorage('fintech_current_user', updatedUser);
    safeSetLocalStorage('fintech_current_user', updatedUser);

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    updateItem('users', {
      drawTickets: nextTickets,
      balance: nextBalance,
      totalEarnings: nextTotal
    }, currentUser.id);

    let maskedPhone = currentUser.phone;
    if (maskedPhone.length >= 8) {
      maskedPhone = maskedPhone.slice(0, 5) + '****' + maskedPhone.slice(-2);
    }

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
      saveSystemConfig('__SYS_DRAW_RECORDS__', updated);
      return updated;
    });

    return { success: true, prize };
  };

  const updateWheelConfig = (newConfig: WheelConfig) => {
    setWheelConfig(newConfig);
    safeSetLocalStorage('fintech_wheel_config', newConfig);
    saveSystemConfig('__SYS_WHEEL_CONFIG__', newConfig);
  };

  const deleteDrawRecord = (recordId: string) => {
    setDrawRecords(prev => {
      const updated = prev.filter(r => r.id !== recordId);
      saveSystemConfig('__SYS_DRAW_RECORDS__', updated);
      return updated;
    });
  };

  const addTicketsToUser = (userId: string, count: number) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const nextCount = Math.max(0, (target.drawTickets || 0) + count);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, drawTickets: nextCount } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, drawTickets: nextCount } : null);
    }
    updateItem('users', { drawTickets: nextCount }, userId);
  };

  const createSupportTicket = async (
    subject: string,
    message: string,
    imageUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: "Vous devez être connecté pour envoyer un message." };
    }
    if (!message || !message.trim()) {
      return { success: false, error: "Le message ne peut pas être vide." };
    }

    const newTicket: SupportTicket = {
      id: 'tkt-' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name || ('Client ' + currentUser.phone),
      userPhone: currentUser.phone || undefined,
      subject: (subject || "Message Chat Support").trim(),
      message: message.trim(),
      imageUrl: imageUrl || undefined,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    setTickets(prev => [newTicket, ...prev]);
    safeSetLocalStorage('fintech_tickets', [newTicket, ...tickets]);

    const res = await submitSupportTicket(newTicket);
    if (!res.success) {
      console.warn('[createSupportTicket] DB notice:', res.error);
    }

    return { success: true };
  };

  // ==========================================
  // ADMINISTRATION OPERATIONS
  // ==========================================
  const toggleBlockUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const nextBlock = !target.isBlocked;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: nextBlock } : u));
    adminUpdateUserBlock(userId, nextBlock);
  };

  const updateUserRole = (userId: string, role: 'admin' | 'user') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role } : null);
    }
    adminUpdateUserRole(userId, role);
  };

  const updateUserBalance = async (userId: string, amount: number, isDirectSet: boolean = false) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const cleanBalance = isDirectSet ? Math.max(0, amount) : Math.max(0, target.balance + amount);

    // 1. Immediate optimistic UI update
    setUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, balance: cleanBalance } : u);
      safeSetLocalStorage('fintech_users', updated);
      return updated;
    });

    if (currentUser?.id === userId) {
      const updatedCurr = { ...currentUser, balance: cleanBalance };
      setCurrentUser(updatedCurr);
      safeSetSessionStorage('fintech_current_user', updatedCurr);
      safeSetLocalStorage('fintech_current_user', updatedCurr);
    }

    // 2. Authoritative backend update with service role
    await adminUpdateUserBalance(userId, isDirectSet ? cleanBalance : amount, isDirectSet);
    await updateItem('users', { balance: cleanBalance }, userId);

    // 3. Trigger fresh sync
    setTimeout(() => {
      fetchAndSyncAllFromSupabase(true);
    }, 400);
  };

  const adminUpdateUserPassword = (userId: string, newWord: string): { success: boolean; error?: string } => {
    const usr = users.find(u => u.id === userId);
    if (!usr) return { success: false, error: "Utilisateur non trouvé." };
    if (!newWord || newWord.length < 4) {
      return { success: false, error: "Le mot de passe doit contenir au moins 4 caractères." };
    }
    
    const authObj = parseAuthFromPinHash(usr.withdrawalPinHash);
    const newPinHash = buildPinHash(newWord, authObj.pin, usr.withdrawalPinHash);

    setPasswords(prev => ({
      ...prev,
      [usr.phone]: newWord,
      [usr.phone.replace(/\s+/g, '')]: newWord
    }));

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, withdrawalPinHash: newPinHash } : u));
    updateItem('users', { withdrawalPinHash: newPinHash }, userId);

    return { success: true };
  };

  const adminUpdateUserPin = (userId: string, newPin: string): { success: boolean; error?: string } => {
    const usr = users.find(u => u.id === userId);
    if (!usr) return { success: false, error: "Utilisateur non trouvé." };
    if (!newPin || newPin.trim().length < 4) {
      return { success: false, error: "Le code PIN de retrait doit comporter au moins 4 chiffres." };
    }
    
    const authObj = parseAuthFromPinHash(usr.withdrawalPinHash);
    const newPinHash = buildPinHash(authObj.pwd, newPin.trim(), usr.withdrawalPinHash);

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, withdrawalPinHash: newPinHash } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, withdrawalPinHash: newPinHash } : null);
    }
    updateItem('users', { withdrawalPinHash: newPinHash }, userId);

    return { success: true };
  };

  const adminSetUserSponsor = async (
    userId: string, 
    sponsorCodeOrPhone: string
  ): Promise<{ success: boolean; error?: string; sponsor?: any }> => {
    try {
      const response = await fetch('/api/admin/users/set-sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sponsorCodeOrPhone })
      });
      const data = await response.json();
      if (!data.success) {
        return { success: false, error: data.error || 'Erreur lors de la modification du parrain.' };
      }
      
      // Update local state immediately
      const newRefCode = data.user?.referredByCode || (data.sponsor ? data.sponsor.referralCode : sponsorCodeOrPhone);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, referredByCode: newRefCode } : u));
      
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, referredByCode: newRefCode } : null);
      }

      setTimeout(() => {
        fetchAndSyncAllFromSupabase(true);
      }, 300);

      return { success: true, sponsor: data.sponsor };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur réseau lors de la mise à jour.' };
    }
  };

  const processDeposit = async (
    depositId: string, 
    status: 'approved' | 'rejected'
  ): Promise<{ success: boolean; error?: string; alreadyApproved?: boolean; newBalance?: number }> => {
    const dep = deposits.find(d => d.id === depositId);
    if (!dep) {
      return { success: false, error: "Dépôt introuvable." };
    }
    
    // Idempotency: Prevent double approval
    if (dep.status === 'approved') {
      return { success: true, alreadyApproved: true, error: "Ce dépôt a déjà été approuvé et crédité." };
    }

    if (dep.status !== 'pending') {
      return { success: false, error: `Le dépôt est déjà au statut ${dep.status}.` };
    }

    // 1. Optimistic Local State & Storage update
    const updatedDeposits = deposits.map(d => d.id === depositId ? { ...d, status } : d);
    setDeposits(updatedDeposits);
    safeSetLocalStorage('fintech_deposits', updatedDeposits);

    let nextBalance: number | null = null;
    const targetUser = users.find(u => u.id === dep.userId || (dep.userPhone && u.phone === dep.userPhone));

    if (status === 'approved' && targetUser) {
      nextBalance = Number(targetUser.balance || 0) + Number(dep.amount || 0);
      const updatedUsers = users.map(u => (u.id === targetUser.id || (dep.userPhone && u.phone === dep.userPhone)) ? { ...u, balance: nextBalance! } : u);
      setUsers(updatedUsers);
      safeSetLocalStorage('fintech_users', updatedUsers);

      if (currentUser?.id === targetUser.id || (dep.userPhone && currentUser?.phone === dep.userPhone)) {
        const updatedCurr = { ...currentUser, balance: nextBalance };
        setCurrentUser(updatedCurr);
        safeSetSessionStorage('fintech_current_user', updatedCurr);
        safeSetLocalStorage('fintech_current_user', updatedCurr);
      }
    }

    // 2. Authoritative Server-side call (Service Role + Database Idempotency Lock)
    const serverResult = await adminProcessDeposit(depositId, status, dep);

    // 3. Fallback database backup update
    if (serverResult && serverResult.success) {
      if (status === 'approved' && targetUser && nextBalance !== null) {
        updateItem('users', { balance: serverResult.newBalance ?? nextBalance }, targetUser.id);
      }
      // Trigger background sync with DB
      setTimeout(() => {
        fetchAndSyncAllFromSupabase();
      }, 300);

      return {
        success: true,
        alreadyApproved: serverResult.alreadyApproved,
        newBalance: serverResult.newBalance ?? (nextBalance || undefined)
      };
    } else {
      // In case server route failed, apply client-side DB update
      if (status === 'approved' && targetUser && nextBalance !== null) {
        await updateItem('users', { balance: nextBalance }, targetUser.id);
        await updateItem('deposits', { status: 'approved' }, depositId);
      } else {
        await updateItem('deposits', { status }, depositId);
      }
      setTimeout(() => {
        fetchAndSyncAllFromSupabase();
      }, 300);
      return { success: true };
    }
  };

  const processWithdrawal = (withdrawalId: string, status: 'approved' | 'rejected') => {
    const wth = withdrawals.find(w => w.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return;
    
    setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? { ...w, status } : w));
    adminProcessWithdrawal(withdrawalId, status);

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
        message: 'Retrait validé et payé avec succès par AirPods.',
        imageUrl: null,
        createdAt: new Date().toISOString().split('T')[0],
        isVerified: true,
        status: 'approved'
      };

      setWithdrawalProofs(prev => [autoProof, ...prev]);
      upsertItem('withdrawal_proofs', autoProof);
    }
    
    // If rejected, refund the user
    if (status === 'rejected') {
      const targetUser = users.find(u => u.id === wth.userId);
      if (targetUser) {
        const nextBalance = targetUser.balance + wth.amount;
        setUsers(prev => prev.map(u => u.id === wth.userId ? { ...u, balance: nextBalance } : u));
        if (currentUser?.id === wth.userId) {
          const updatedCurr = { ...currentUser, balance: nextBalance };
          setCurrentUser(updatedCurr);
          safeSetSessionStorage('fintech_current_user', updatedCurr);
          safeSetLocalStorage('fintech_current_user', updatedCurr);
        }
      }
    }
  };

  const addOrUpdateProduct = (prodData: Omit<InvestmentProduct, 'isActive'> & { isActive?: boolean; image?: string; description?: string; order?: number; badge?: string; color?: string }) => {
    const existing = products.find(p => p.id === prodData.id);
    let targetProduct: InvestmentProduct;
    if (existing) {
      targetProduct = {
        ...existing,
        ...prodData,
        price: Number(prodData.price) !== undefined && !isNaN(Number(prodData.price)) ? Number(prodData.price) : existing.price,
        dailyGain: Number(prodData.dailyGain) !== undefined && !isNaN(Number(prodData.dailyGain)) ? Number(prodData.dailyGain) : existing.dailyGain,
        duration: Number(prodData.duration) || existing.duration,
        totalGain: Number(prodData.totalGain) || ((Number(prodData.dailyGain) || existing.dailyGain) * (Number(prodData.duration) || existing.duration)),
        isActive: prodData.isActive !== undefined ? prodData.isActive : existing.isActive
      } as InvestmentProduct;
      setProducts(prev => {
        const next = prev.map(p => p.id === prodData.id ? targetProduct : p);
        safeSetLocalStorage('fintech_products', next);
        return next;
      });
    } else {
      targetProduct = {
        id: prodData.id || 'vip-' + (products.length + 1),
        name: prodData.name,
        price: Number(prodData.price) || 0,
        dailyGain: Number(prodData.dailyGain) || 0,
        duration: Number(prodData.duration) || 0,
        totalGain: Number(prodData.totalGain) || (Number(prodData.dailyGain) * Number(prodData.duration)),
        isActive: prodData.isActive ?? true,
        image: prodData.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        description: prodData.description || 'Offre d\'investissement rentable.',
        order: prodData.order ?? (products.length + 1),
        badge: prodData.badge || 'Nouveau',
        color: prodData.color || 'from-amber-950/40 via-amber-900/10 to-transparent border-amber-500/20'
      };
      setProducts(prev => {
        const next = [...prev, targetProduct];
        safeSetLocalStorage('fintech_products', next);
        return next;
      });
    }

    // Persist immediately to dedicated server route, DB and trigger instant sync
    (async () => {
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetProduct)
        });
      } catch (_) {}
      await upsertItem('products', targetProduct);
      fetchAndSyncAllFromSupabase(true);
      window.dispatchEvent(new CustomEvent('fintech_products_updated', { detail: targetProduct }));
    })();
  };

  const resetToOfficialProducts = async (): Promise<void> => {
    const obsoleteIds = [
      'vip-1-pro', 'vip-2-elite', 'vip-3-premium', 'vip-4-platinum', 'vip-5-or',
      'vip-6-saphir', 'vip-7-silver', 'vip-8-gray', 'vip-9-gold',
      'vip-partenaire-bronze', 'vip-partenaire-argent'
    ];
    for (const oldId of obsoleteIds) {
      deleteRecord('products', oldId);
    }
    setProducts(OFFICIAL_INVESTMENT_PRODUCTS);
    safeSetLocalStorage('fintech_products', OFFICIAL_INVESTMENT_PRODUCTS);
    for (const p of OFFICIAL_INVESTMENT_PRODUCTS) {
      await upsertItem('products', p);
    }
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    deleteRecord('products', productId);
  };

  const deleteUserInvestment = (investmentId: string) => {
    setUserInvestments(prev => prev.filter(inv => inv.id !== investmentId));
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
    
    setBonusCodes(prev => [newCode, ...prev]);
    upsertItem('bonus_codes', newCode);
    return { success: true };
  };

  const sendGlobalNotification = (text: string | null) => {
    setGlobalNotification(text);
    if (text) {
      safeSetLocalStorage('fintech_global_notification', text);
      saveSystemConfig('__SYS_GLOBAL_NOTIF__', [{ notif: text }]);
    } else {
      safeRemoveLocalStorage('fintech_global_notification');
      saveSystemConfig('__SYS_GLOBAL_NOTIF__', [{ notif: '' }]);
    }
  };

  const replyToTicket = async (ticketId: string, reply: string): Promise<{ success: boolean; error?: string }> => {
    if (!ticketId || !reply.trim()) return { success: false, error: "Réponse invalide." };
    const nowIso = new Date().toISOString();
    
    setTickets(prev => {
      const updated = prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            reply: reply.trim(),
            status: 'closed' as const,
            isReadByUser: false,
            replyCreatedAt: nowIso
          };
        }
        return t;
      });
      safeSetLocalStorage('fintech_tickets', updated);
      return updated;
    });

    const res = await replySupportTicket(ticketId, reply.trim());
    if (!res.success) {
      await updateItem('tickets', {
        reply: reply.trim(),
        status: 'closed',
        isReadByUser: false,
        replyCreatedAt: nowIso
      }, ticketId);
    }

    return { success: true };
  };

  const markTicketsAsRead = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    setTickets(prev => prev.map(t => {
      const isUserTicket = t.userId === userId || (targetUser?.phone && t.userPhone === targetUser.phone);
      if (isUserTicket && t.isReadByUser === false) {
        updateItem('tickets', { isReadByUser: true }, t.id);
        return { ...t, isReadByUser: true };
      }
      return t;
    }));
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
        referralCode: 'AIRPODS'
      };
      
      const rawPhone = (user.phone || '').trim();
      let maskedPhone = rawPhone;
      if (rawPhone.length >= 6) {
        maskedPhone = `${rawPhone.slice(0, 3)}****${rawPhone.slice(-3)}`;
      } else if (rawPhone.length > 0) {
        maskedPhone = `****${rawPhone.slice(-2)}`;
      } else {
        maskedPhone = '****';
      }

      const validAmount = Number(amount) > 0 ? Number(amount) : 2000;
      const validNetwork = (network || 'Mobile Money').trim();
      const validMessage = (message || '').trim() || `Retrait reçu avec succès via ${validNetwork}. Merci AirPods !`;

      const newProof: WithdrawalProof = {
        id: 'proof-' + Date.now(),
        userId: user.id,
        userName: user.name || 'Membre AirPods',
        userPhone: maskedPhone,
        amount: validAmount,
        network: validNetwork,
        message: validMessage,
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString().split('T')[0],
        isVerified: true,
        status: 'approved'
      };

      setWithdrawalProofs(prev => [newProof, ...prev]);
      upsertItem('withdrawal_proofs', newProof);
      return { success: true };
    } catch (err: any) {
      return { success: true };
    }
  };

  const processWithdrawalProof = (proofId: string, status: 'approved' | 'rejected') => {
    setWithdrawalProofs(prev => prev.map(p => p.id === proofId ? { ...p, status, isVerified: status === 'approved' } : p));
    updateItem('withdrawal_proofs', { status, isVerified: status === 'approved' }, proofId);
  };

  const deleteWithdrawalProof = (proofId: string) => {
    setWithdrawalProofs(prev => prev.filter(p => p.id !== proofId));
    deleteRecord('withdrawal_proofs', proofId);
  };

  const updateWithdrawalProof = (proofId: string, data: Partial<WithdrawalProof>) => {
    const nextStatus = data.status || 'approved';
    setWithdrawalProofs(prev => prev.map(p => p.id === proofId ? { ...p, ...data, status: nextStatus, isVerified: nextStatus === 'approved' } : p));
    updateItem('withdrawal_proofs', { ...data, status: nextStatus, isVerified: nextStatus === 'approved' }, proofId);
  };

  const addAnnouncement = async (data: { title: string; content: string; imageUrl?: string }) => {
    const formattedDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const newAnn: Announcement = {
      id: `ann-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      content: data.content.trim(),
      imageUrl: data.imageUrl?.trim() || null,
      createdAt: formattedDate,
      isNew: true
    };

    setAnnouncements(prev => {
      const updated = [newAnn, ...prev.filter(a => a.id !== newAnn.id)];
      safeSetLocalStorage('fintech_announcements', updated);
      saveSystemConfig('__SYS_ANNOUNCEMENTS__', updated).catch(() => {});
      return updated;
    });

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnn)
      });
      const resJson = await res.json();
      if (resJson && resJson.success && Array.isArray(resJson.announcements)) {
        setAnnouncements(resJson.announcements);
        safeSetLocalStorage('fintech_announcements', resJson.announcements);
      }
    } catch (err) {
      console.warn('[Add Announcement API Error]:', err);
    }

    const notifMsg = `📢 Nouvel avis officiel : ${data.title.trim()}`;
    sendGlobalNotification(notifMsg);
  };

  const updateAnnouncement = async (id: string, data: { title: string; content: string; imageUrl?: string }) => {
    setAnnouncements(prev => {
      const updated = prev.map(a => a.id === id ? {
        ...a,
        title: data.title.trim(),
        content: data.content.trim(),
        imageUrl: data.imageUrl?.trim() || null
      } : a);
      safeSetLocalStorage('fintech_announcements', updated);
      saveSystemConfig('__SYS_ANNOUNCEMENTS__', updated).catch(() => {});
      return updated;
    });

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title: data.title.trim(),
          content: data.content.trim(),
          imageUrl: data.imageUrl?.trim() || null
        })
      });
      const resJson = await res.json();
      if (resJson && resJson.success && Array.isArray(resJson.announcements)) {
        setAnnouncements(resJson.announcements);
        safeSetLocalStorage('fintech_announcements', resJson.announcements);
      }
    } catch (err) {
      console.warn('[Update Announcement API Error]:', err);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements(prev => {
      const updated = prev.filter(a => a.id !== id);
      safeSetLocalStorage('fintech_announcements', updated);
      saveSystemConfig('__SYS_ANNOUNCEMENTS__', updated).catch(() => {});
      return updated;
    });

    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson && resJson.success && Array.isArray(resJson.announcements)) {
        setAnnouncements(resJson.announcements);
        safeSetLocalStorage('fintech_announcements', resJson.announcements);
      }
    } catch (err) {
      console.warn('[Delete Announcement API Error]:', err);
    }
  };

  // =========================================================================
  // TASK CENTER (CENTRE DE TÂCHES AIRPRODS) ACTIONS
  // =========================================================================

  const claimTaskReward = async (taskId: string): Promise<{ success: boolean; error?: string; reward?: number; newBalance?: number }> => {
    if (!currentUser) return { success: false, error: 'Veuillez vous connecter pour réclamer votre récompense.' };

    try {
      const res = await fetch('/api/tasks/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, taskId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data?.error || 'Impossible de réclamer la récompense.' };
      }

      const reward = Number(data.reward) || 0;
      const newBal = Number(data.newBalance) !== undefined ? Number(data.newBalance) : (Number(currentUser.balance) + reward);
      const claim = data.claim;

      setCurrentUser(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          balance: newBal,
          totalEarnings: (Number(prev.totalEarnings) || 0) + reward
        };
        safeSetLocalStorage('fintech_current_user', updated);
        return updated;
      });

      setUsers(prev => prev.map(u => u.id === currentUser.id ? {
        ...u,
        balance: newBal,
        totalEarnings: (Number(u.totalEarnings) || 0) + reward
      } : u));

      if (claim) {
        setUserTaskClaims(prev => {
          const updated = [claim, ...prev.filter(c => c.id !== claim.id)];
          safeSetLocalStorage('fintech_task_claims', updated);
          return updated;
        });
      }

      // Add revenue log
      const newLog: RevenueLog = {
        id: `rev_task_${Date.now()}`,
        userId: currentUser.id,
        investmentId: claim?.taskId || 'task_reward',
        productName: claim?.taskTitle || 'Récompense Centre de Tâches',
        amount: reward,
        creditedAt: new Date().toISOString()
      };
      setRevenueLogs(prev => [newLog, ...prev]);

      return { success: true, reward, newBalance: newBal };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur lors de la communication avec le serveur.' };
    }
  };

  const updateTask = async (
    idOrTask: string | (Partial<TaskItem> & { id: string }),
    updates?: Partial<TaskItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const taskId = typeof idOrTask === 'string' ? idOrTask : idOrTask.id;
      const taskBody = typeof idOrTask === 'string' ? { ...updates, id: taskId } : idOrTask;
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskBody)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data?.error || 'Erreur mise à jour de la tâche.' };
      }
      if (Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        safeSetLocalStorage('fintech_tasks', data.tasks);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur réseau.' };
    }
  };

  const resetDefaultTasks = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/tasks/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTasks(OFFICIAL_TASKS);
        safeSetLocalStorage('fintech_tasks', OFFICIAL_TASKS);
        return { success: true };
      }
      if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        setTasks(data.tasks);
        safeSetLocalStorage('fintech_tasks', data.tasks);
      } else {
        setTasks(OFFICIAL_TASKS);
        safeSetLocalStorage('fintech_tasks', OFFICIAL_TASKS);
      }
      return { success: true };
    } catch (err: any) {
      setTasks(OFFICIAL_TASKS);
      safeSetLocalStorage('fintech_tasks', OFFICIAL_TASKS);
      return { success: true };
    }
  };

  const purgeAllUsersDepositsWithdrawals = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch('/api/admin/purge-users-deposits-withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const resJson = await res.json();
      if (resJson && resJson.success) {
        // Clear local storage copies
        safeSetLocalStorage('fintech_deposits', []);
        safeSetLocalStorage('fintech_withdrawals', []);
        setDeposits([]);
        setWithdrawals([]);
        setUserInvestments([]);
        // Re-sync with master server
        await fetchAndSyncAllFromSupabase(true);
        return { success: true, message: resJson.message };
      }
      return { success: false, error: resJson?.error || 'Erreur lors de la purge.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur de connexion au serveur.' };
    }
  };

  const markAnnouncementAsRead = (id: string) => {
    setAnnouncements(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, isNew: false } : a);
      safeSetLocalStorage('fintech_announcements', updated);
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
      saveSystemConfig('__SYS_FAQS__', updated);
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
      saveSystemConfig('__SYS_FAQS__', updated);
      return updated;
    });
  };

  const deleteFaq = (id: string) => {
    setFaqs(prev => {
      const updated = prev.filter(f => f.id !== id);
      safeSetLocalStorage('fintech_faqs', updated);
      saveSystemConfig('__SYS_FAQS__', updated);
      return updated;
    });
  };

  // Recharge Channels CRUD methods
  const addRechargeChannel = async (data: {
    name: string;
    countryCode?: string;
    accountNumber: string;
    accountHolder?: string;
    instructions?: string;
    isActive?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    const finalCountryCode = 'TG';

    const newChannel: RechargeChannel = {
      id: `rc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
      countryCode: finalCountryCode,
      accountNumber: data.accountNumber.trim(),
      accountHolder: data.accountHolder?.trim() || '',
      instructions: data.instructions?.trim() || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      order: rechargeChannels.length + 1,
      createdAt: new Date().toISOString()
    };
    const updated = [...rechargeChannels, newChannel];
    setRechargeChannels(updated);
    safeSetLocalStorage('fintech_recharge_channels', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recharge_channels_updated', { detail: updated }));
    }
    const res = await saveSystemConfig('__SYS_RECHARGE_CHANNELS__', updated);
    return res;
  };

  const updateRechargeChannel = async (id: string, data: Partial<RechargeChannel>): Promise<{ success: boolean; error?: string }> => {
    const updated = rechargeChannels.map(ch => {
      if (ch.id === id) {
        return {
          ...ch,
          ...data,
          name: data.name !== undefined ? data.name.trim() : ch.name,
          countryCode: data.countryCode !== undefined ? data.countryCode : ch.countryCode,
          accountNumber: data.accountNumber !== undefined ? data.accountNumber.trim() : ch.accountNumber,
          accountHolder: data.accountHolder !== undefined ? data.accountHolder.trim() : ch.accountHolder,
          instructions: data.instructions !== undefined ? data.instructions.trim() : ch.instructions,
          isActive: data.isActive !== undefined ? data.isActive : ch.isActive
        };
      }
      return ch;
    });
    setRechargeChannels(updated);
    safeSetLocalStorage('fintech_recharge_channels', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recharge_channels_updated', { detail: updated }));
    }
    const res = await saveSystemConfig('__SYS_RECHARGE_CHANNELS__', updated);
    return res;
  };

  const deleteRechargeChannel = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const updated = rechargeChannels.filter(ch => ch.id !== id);
    setRechargeChannels(updated);
    safeSetLocalStorage('fintech_recharge_channels', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recharge_channels_updated', { detail: updated }));
    }
    const res = await saveSystemConfig('__SYS_RECHARGE_CHANNELS__', updated);
    return res;
  };

  const toggleRechargeChannel = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const updated = rechargeChannels.map(ch => ch.id === id ? { ...ch, isActive: !ch.isActive } : ch);
    setRechargeChannels(updated);
    safeSetLocalStorage('fintech_recharge_channels', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recharge_channels_updated', { detail: updated }));
    }
    const res = await saveSystemConfig('__SYS_RECHARGE_CHANNELS__', updated);
    return res;
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
      tasks,
      userTaskClaims,
      claimTaskReward,
      updateTask,
      resetDefaultTasks,
      faqs,
      rechargeChannels,
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
      initiateDepositCheckout,
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
      adminSetUserSponsor,
      processDeposit,
      processWithdrawal,
      processWithdrawalProof,
      deleteWithdrawalProof,
      updateWithdrawalProof,
      addOrUpdateProduct,
      resetToOfficialProducts,
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
      updateAnnouncement,
      deleteAnnouncement,
      markAnnouncementAsRead,
      purgeAllUsersDepositsWithdrawals,
      addFaq,
      updateFaq,
      deleteFaq,
      addRechargeChannel,
      updateRechargeChannel,
      deleteRechargeChannel,
      toggleRechargeChannel,
      refreshData: (force: boolean = true) => fetchAndSyncAllFromSupabase(force),
      supabaseStatus,
      isQuotaExceeded,
      probeSupabase
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
