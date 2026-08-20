/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  fetchTableData, 
  upsertItem, 
  insertItem, 
  updateItem, 
  deleteRecord, 
  saveSystemConfig, 
  fetchSystemConfig,
  deleteSystemConfig 
} from '../lib/supabaseService';
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
  RechargeChannel
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
  rechargeChannels: RechargeChannel[];
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
  processDeposit: (depositId: string, status: 'approved' | 'rejected') => void;
  processWithdrawal: (withdrawalId: string, status: 'approved' | 'rejected') => void;
  processWithdrawalProof: (proofId: string, status: 'approved' | 'rejected') => void;
  deleteWithdrawalProof: (proofId: string) => void;
  updateWithdrawalProof: (proofId: string, data: Partial<WithdrawalProof>) => void;
  addOrUpdateProduct: (product: Omit<InvestmentProduct, 'isActive'> & { isActive?: boolean; image?: string; description?: string; order?: number; badge?: string; color?: string }) => void;
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
  deleteAnnouncement: (id: string) => void;
  markAnnouncementAsRead: (id: string) => void;
  addFaq: (question: string, answer: string, category?: string) => void;
  updateFaq: (id: string, question: string, answer: string, category?: string) => void;
  deleteFaq: (id: string) => void;
  
  // Recharge channels management
  addRechargeChannel: (data: { name: string; accountNumber: string; accountHolder?: string; instructions?: string; isActive?: boolean }) => Promise<{ success: boolean; error?: string }>;
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
  const finalNetwork = network !== undefined ? network : (existing.network || 'TMoney');
  const finalCountry = country !== undefined ? country : (existing.country || 'TG');
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
  const [users, setUsers] = useState<User[]>(() => {
    const data = safeGetLocalStorage('fintech_users');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
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
      '11111111': 'admin123',
      '07070707': 'koffi123',
      '77777777': 'seydou123'
    };
  });

  const [products, setProducts] = useState<InvestmentProduct[]>(() => {
    const data = safeGetLocalStorage('fintech_products');
    if (data) {
      try { return deduplicateById(JSON.parse(data)); } catch (_) {}
    }
    return [];
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

  const [rechargeChannels, setRechargeChannels] = useState<RechargeChannel[]>(() => {
    const data = safeGetLocalStorage('fintech_recharge_channels');
    if (data !== null && data !== undefined) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return deduplicateById(parsed);
        }
      } catch (_) {}
    }
    return [
      {
        id: 'rc-tmoney',
        name: 'TMoney (Togocom)',
        accountNumber: '+228 90 00 00 00',
        accountHolder: 'Service Recharge Nutrien',
        instructions: 'Effectuez le transfert vers ce numéro TMoney puis saisissez la référence de transaction.',
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rc-moov',
        name: 'Moov Money (Flooz)',
        accountNumber: '+228 99 00 00 00',
        accountHolder: 'Service Recharge Nutrien',
        instructions: 'Effectuez le transfert vers ce numéro Moov Money Flooz puis saisissez la référence de transaction.',
        isActive: true,
        order: 2,
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

  // Track if initial sync has occurred
  const isHydratedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(currentUser?.id || null);
  currentUserIdRef.current = currentUser?.id || null;

  // Master Central Sync Function
  const fetchAndSyncAllFromSupabase = useCallback(async () => {
    try {
      // 1. Fetch main native tables in parallel
      const [
        dbUsers,
        dbProducts,
        dbInvestments,
        dbDeposits,
        dbWithdrawals,
        dbProofs,
        dbTickets,
        dbCommissions,
        dbBonusRows
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

      // Process Users
      if (dbUsers && dbUsers.length > 0) {
        const enrichedUsers = dbUsers.map(u => {
          const auth = parseAuthFromPinHash(u.withdrawalPinHash);
          return {
            ...u,
            withdrawalNetwork: auth.network || u.withdrawalNetwork || 'TMoney',
            withdrawalCountry: auth.country || u.withdrawalCountry || 'TG'
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
        if (currentUserIdRef.current) {
          const freshUser = dedupedUsers.find(u => u.id === currentUserIdRef.current);
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
      if (dbProducts) {
        const dedupedProducts = deduplicateById(dbProducts);
        setProducts(dedupedProducts);
        safeSetLocalStorage('fintech_products', dedupedProducts);
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

      // Process Support Tickets / Chat (sort newest first)
      if (dbTickets) {
        const sortedTickets = deduplicateById([...dbTickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setTickets(sortedTickets);
        safeSetLocalStorage('fintech_tickets', sortedTickets);
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
        let sysAnnouncements: Announcement[] | null = null;
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
          setRechargeChannels(sysRechargeChannels);
          safeSetLocalStorage('fintech_recharge_channels', sysRechargeChannels);
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

      isHydratedRef.current = true;
    } catch (err) {
      console.warn('[Sync] Supabase fetch error:', err);
    }
  }, []);

  // Initial mount: load immediately, start continuous background polling (2.5s)
  useEffect(() => {
    fetchAndSyncAllFromSupabase();
    const interval = setInterval(fetchAndSyncAllFromSupabase, 2500);

    // Also listen to Realtime broadcast if supported
    const channel = supabase
      .channel('nutrien-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchAndSyncAllFromSupabase();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchAndSyncAllFromSupabase]);

  // Automatic 24h revenue distribution cycle
  useEffect(() => {
    const checkAndDistributeEarnings = () => {
      if (!currentUser || userInvestments.length === 0) return;

      let hasEarned = false;
      let totalDailyGain = 0;
      const updatedInvestments = userInvestments.map(inv => {
        if (inv.userId === currentUser.id && inv.daysRemaining > 0) {
          const lastClaim = new Date(inv.lastClaimDate).getTime();
          const now = Date.now();
          const hoursElapsed = (now - lastClaim) / (3600 * 1000);

          if (hoursElapsed >= 24) {
            hasEarned = true;
            totalDailyGain += inv.dailyGain;
            return {
              ...inv,
              daysRemaining: inv.daysRemaining - 1,
              lastClaimDate: new Date().toISOString()
            };
          }
        }
        return inv;
      });

      if (hasEarned) {
        setUserInvestments(updatedInvestments);
        safeSetLocalStorage('fintech_investments', updatedInvestments);
        
        // Sync updated investments to Supabase
        updatedInvestments.forEach(inv => {
          if (inv.userId === currentUser.id) {
            updateItem('investments', { daysRemaining: inv.daysRemaining, lastClaimDate: inv.lastClaimDate }, inv.id);
          }
        });

        // Credit User Balance in DB & locally
        const newBalance = currentUser.balance + totalDailyGain;
        const newTotalEarnings = currentUser.totalEarnings + totalDailyGain;
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

        const newLog: RevenueLog = {
          id: `rev-${Date.now()}`,
          userId: currentUser.id,
          investmentId: 'auto-cycle',
          productName: 'Rendement Quotidien 24h',
          amount: totalDailyGain,
          creditedAt: new Date().toISOString()
        };
        setRevenueLogs(prev => {
          const updatedLogs = [newLog, ...prev];
          safeSetLocalStorage('fintech_revenue_logs', updatedLogs);
          saveSystemConfig('__SYS_REVENUE_LOGS__', updatedLogs);
          return updatedLogs;
        });
      }
    };

    checkAndDistributeEarnings();
    const interval = setInterval(checkAndDistributeEarnings, 5000);
    return () => clearInterval(interval);
  }, [userInvestments, currentUser]);

  // ==========================================
  // AUTHENTICATION OPERATIONS
  // ==========================================
  const login = async (phone: string, word: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const cleanPhone = phone.trim();
    const strippedPhone = cleanPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

    // Refresh users from DB first to get latest users and passwords
    let currentUsersList = users;
    try {
      const fresh = await fetchTableData<User>('users');
      if (fresh && fresh.length > 0) {
        currentUsersList = fresh;
        setUsers(fresh);
      }
    } catch (_) {}
    
    // Find user by exact match or stripped match or ending digits
    const user = currentUsersList.find(u => {
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

    // Check credentials
    const authObj = parseAuthFromPinHash(user.withdrawalPinHash);
    const correctWord = authObj.pwd || passwords[user.phone] || passwords[cleanPhone] || passwords[strippedPhone];
    
    // Special admin emergency fallback
    const isSpecialAdmin = user.role === 'admin' && (word === 'admin123' || word === 'ADMIN7');

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
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const cleanPhone = data.phone.trim();
    const strippedPhone = cleanPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

    // Fetch latest users from DB to prevent duplicate registration
    let currentUsersList = users;
    try {
      const fresh = await fetchTableData<User>('users');
      if (fresh) currentUsersList = fresh;
    } catch (_) {}

    const exists = currentUsersList.some(u => {
      const uClean = u.phone.trim();
      const uStripped = uClean.replace(/\s+/g, '').replace(/[^\d+]/g, '');
      return uClean === cleanPhone || uStripped === strippedPhone;
    });

    if (exists) {
      return { success: false, error: "Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter." };
    }
    
    // Unique referral code
    const refCode = 'INV' + Math.floor(100000 + Math.random() * 900000);
    
    let referredByCodeObj: string | null = null;
    
    if (data.referrerCode.trim()) {
      const codeClean = data.referrerCode.trim();
      const parent = currentUsersList.find(u => 
        u.referralCode?.toLowerCase() === codeClean.toLowerCase() || 
        u.phone === codeClean || 
        u.phone.replace(/\s+/g, '') === codeClean.replace(/\s+/g, '')
      );
      if (parent) {
        referredByCodeObj = parent.referralCode;
      } else {
        return { success: false, error: "Code d'invitation invalide." };
      }
    }

    const pinHash = buildPinHash(data.word, '');
    
    const newUser: User = {
      id: 'usr-' + Math.floor(100000 + Math.random() * 9000000),
      name: data.name.trim(),
      phone: cleanPhone,
      whatsapp: data.whatsapp.trim() || cleanPhone,
      country: data.country || 'Togo',
      balance: 200, // 200 XAF/XOF bonus d'inscription
      dailyEarnings: 0,
      totalEarnings: 0,
      vipLevel: 0,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      role: 'user',
      referralCode: refCode,
      referredByCode: referredByCodeObj,
      withdrawalPinHash: pinHash
    };

    // Save directly to Supabase
    await upsertItem('users', newUser);
    
    // Update local state
    setPasswords(prev => ({ 
      ...prev, 
      [cleanPhone]: data.word,
      [strippedPhone]: data.word,
      [newUser.phone]: data.word 
    }));
    setUsers(prev => [newUser, ...prev]);
    safeSetLocalStorage('fintech_users', [newUser, ...users]);
    
    setCurrentUser(newUser);
    safeSetSessionStorage('fintech_current_user', newUser);
    safeSetLocalStorage('fintech_current_user', newUser);
    
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
  const buyInvestment = (productId: string, quantity: number = 1) => {
    if (!currentUser) return { success: false, error: "Veuillez vous connecter." };
    
    const product = products.find(p => p.id === productId && p.isActive);
    if (!product) return { success: false, error: "Produit indisponible." };
    
    const dbUser = users.find(u => u.id === currentUser.id) || currentUser;
    const totalPrice = product.price * quantity;
    if (dbUser.balance < totalPrice) {
      return { success: false, error: `Solde insuffisant. Le montant total est de ${totalPrice.toLocaleString()} FCFA et votre solde disponible est de ${dbUser.balance.toLocaleString()} FCFA. Veuillez effectuer un dépôt.` };
    }
    
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
        const commL1 = Math.round(totalPrice * 0.15); // 15% Level 1
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
            const commL2 = Math.round(totalPrice * 0.02);
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
                const commL3 = Math.round(totalPrice * 0.01);
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
      transactionId: transactionId.trim(),
      screenshotUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setDeposits(prev => [newDeposit, ...prev]);
    upsertItem('deposits', newDeposit);
    return { success: true };
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

    const targetNetwork = network || currentUser.withdrawalNetwork || 'TMoney';
    const targetCountry = country || currentUser.withdrawalCountry || 'TG';
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
      ...dbFields,
      withdrawalNetwork: targetNetwork,
      withdrawalCountry: targetCountry
    };

    setCurrentUser(updatedUser);
    safeSetSessionStorage('fintech_current_user', updatedUser);
    safeSetLocalStorage('fintech_current_user', updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    return { success: true };
  };

  const sendAdminDirectMessage = async (userId: string, message: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !message.trim()) return { success: false, error: "Message ou utilisateur invalide." };
    const targetUser = users.find(u => u.id === userId || u.phone === userId || u.name === userId);
    const actualUserId = targetUser?.id || userId;
    const userName = targetUser?.name || 'Client ' + userId.slice(0, 5);

    const newTicket: SupportTicket = {
      id: 'tkt-adm-' + Math.random().toString(36).substr(2, 9),
      userId: actualUserId,
      userName: userName,
      subject: "Message de l'Administration",
      message: "Message direct du Support Client Nutrien.",
      reply: message.trim(),
      status: 'closed',
      createdAt: new Date().toISOString(),
      replyCreatedAt: new Date().toISOString(),
      isReadByUser: false
    };

    setTickets(prev => [newTicket, ...prev]);
    const res = await insertItem('tickets', newTicket);
    return res;
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

    if (amount < 1000) return { success: false, error: "Le montant minimum de retrait est de 1 000 XAF." };
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
    upsertItem('withdrawals', newWithdrawal);
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
      subject: (subject || "Message Chat Support").trim(),
      message: message.trim(),
      imageUrl: imageUrl || undefined,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    setTickets(prev => [newTicket, ...prev]);

    const res = await insertItem('tickets', newTicket);
    if (!res.success) {
      // Revert if DB fails
      setTickets(prev => prev.filter(t => t.id !== newTicket.id));
      return {
        success: false,
        error: res.error || "Échec de l'enregistrement du message sur le serveur."
      };
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
    updateItem('users', { isBlocked: nextBlock }, userId);
  };

  const updateUserRole = (userId: string, role: 'admin' | 'user') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role } : null);
    }
    updateItem('users', { role }, userId);
  };

  const updateUserBalance = (userId: string, amount: number, isDirectSet: boolean = false) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const cleanBalance = isDirectSet ? Math.max(0, amount) : Math.max(0, target.balance + amount);

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: cleanBalance } : u));
    if (currentUser?.id === userId) {
      const updatedCurr = { ...currentUser, balance: cleanBalance };
      setCurrentUser(updatedCurr);
      safeSetSessionStorage('fintech_current_user', updatedCurr);
      safeSetLocalStorage('fintech_current_user', updatedCurr);
    }
    updateItem('users', { balance: cleanBalance }, userId);
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

  const processDeposit = (depositId: string, status: 'approved' | 'rejected') => {
    const dep = deposits.find(d => d.id === depositId);
    if (!dep || dep.status !== 'pending') return;
    
    setDeposits(prev => prev.map(d => d.id === depositId ? { ...d, status } : d));
    updateItem('deposits', { status }, depositId);
    
    if (status === 'approved') {
      const targetUser = users.find(u => u.id === dep.userId);
      if (targetUser) {
        const nextBalance = targetUser.balance + dep.amount;
        setUsers(prev => prev.map(u => u.id === dep.userId ? { ...u, balance: nextBalance } : u));
        if (currentUser?.id === dep.userId) {
          const updatedCurr = { ...currentUser, balance: nextBalance };
          setCurrentUser(updatedCurr);
          safeSetSessionStorage('fintech_current_user', updatedCurr);
          safeSetLocalStorage('fintech_current_user', updatedCurr);
        }
        updateItem('users', { balance: nextBalance }, dep.userId);
      }
    }
  };

  const processWithdrawal = (withdrawalId: string, status: 'approved' | 'rejected') => {
    const wth = withdrawals.find(w => w.id === withdrawalId);
    if (!wth || wth.status !== 'pending') return;
    
    setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? { ...w, status } : w));
    updateItem('withdrawals', { status }, withdrawalId);

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
        updateItem('users', { balance: nextBalance }, wth.userId);
      }
    }
  };

  const addOrUpdateProduct = (prodData: Omit<InvestmentProduct, 'isActive'> & { isActive?: boolean; image?: string; description?: string; order?: number; badge?: string; color?: string }) => {
    const existing = products.find(p => p.id === prodData.id);
    let targetProduct: InvestmentProduct;
    if (existing) {
      targetProduct = { ...existing, ...prodData } as InvestmentProduct;
      setProducts(prev => prev.map(p => p.id === prodData.id ? targetProduct : p));
    } else {
      targetProduct = {
        id: prodData.id || 'vip-' + (products.length + 1),
        name: prodData.name,
        price: prodData.price,
        dailyGain: prodData.dailyGain,
        duration: prodData.duration,
        totalGain: prodData.totalGain,
        isActive: prodData.isActive ?? true,
        image: prodData.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        description: prodData.description || 'Offre d\'investissement rentable.',
        order: prodData.order ?? (products.length + 1),
        badge: prodData.badge || 'Nouveau',
        color: prodData.color || 'from-amber-950/40 via-amber-900/10 to-transparent border-amber-500/20'
      };
      setProducts(prev => [...prev, targetProduct]);
    }
    upsertItem('products', targetProduct);
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
    const targetTicket = tickets.find(t => t.id === ticketId);
    const nowIso = new Date().toISOString();
    
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId || (targetTicket && t.userId === targetTicket.userId && t.status === 'open')) {
        return {
          ...t,
          reply: t.id === ticketId ? reply : (t.reply || reply),
          status: 'closed' as const,
          isReadByUser: false,
          replyCreatedAt: nowIso
        };
      }
      return t;
    }));

    const res = await updateItem('tickets', {
      reply,
      status: 'closed',
      isReadByUser: false,
      replyCreatedAt: nowIso
    }, ticketId);
    return res;
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
        referralCode: 'NUTRIEN'
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
      saveSystemConfig('__SYS_ANNOUNCEMENTS__', updated);
      return updated;
    });

    const notifMsg = `📢 Nouvel avis officiel : ${data.title.trim()}`;
    sendGlobalNotification(notifMsg);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => {
      const updated = prev.filter(a => a.id !== id);
      safeSetLocalStorage('fintech_announcements', updated);
      saveSystemConfig('__SYS_ANNOUNCEMENTS__', updated);
      return updated;
    });
  };

  const markAnnouncementAsRead = (id: string) => {
    setAnnouncements(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, isNew: false } : a);
      safeSetLocalStorage('fintech_announcements', updated);
      saveSystemConfig('__SYS_ANNOUNCEMENTS__', updated);
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
    accountNumber: string;
    accountHolder?: string;
    instructions?: string;
    isActive?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    const newChannel: RechargeChannel = {
      id: `rc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: data.name.trim(),
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
    const res = await saveSystemConfig('__SYS_RECHARGE_CHANNELS__', updated);
    return res;
  };

  const deleteRechargeChannel = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const updated = rechargeChannels.filter(ch => ch.id !== id);
    setRechargeChannels(updated);
    safeSetLocalStorage('fintech_recharge_channels', updated);
    const res = await saveSystemConfig('__SYS_RECHARGE_CHANNELS__', updated);
    return res;
  };

  const toggleRechargeChannel = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const updated = rechargeChannels.map(ch => ch.id === id ? { ...ch, isActive: !ch.isActive } : ch);
    setRechargeChannels(updated);
    safeSetLocalStorage('fintech_recharge_channels', updated);
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
      addRechargeChannel,
      updateRechargeChannel,
      deleteRechargeChannel,
      toggleRechargeChannel
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
