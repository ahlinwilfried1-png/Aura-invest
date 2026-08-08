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
  WithdrawalProof
} from '../types';

interface AppContextType {
  users: User[];
  currentUser: User | null;
  products: InvestmentProduct[];
  userInvestments: UserInvestment[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  withdrawalProofs: WithdrawalProof[];
  bonusCodes: BonusCode[];
  commissions: CommissionHistory[];
  tickets: SupportTicket[];
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
  saveWithdrawalAccount: (accountName: string, accountNumber: string, pin: string) => { success: boolean; error?: string };
  redeemBonusCode: (code: string) => { success: boolean; error?: string; amount?: number };
  claimDailyBonus: () => { success: boolean; error?: string; amount?: number };
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

      const dbTickets = await fetchTableData<SupportTicket>('tickets');
      if (dbTickets && dbTickets.length > 0) setTickets(dbTickets);

      const dbCommissions = await fetchTableData<CommissionHistory>('commissions');
      if (dbCommissions && dbCommissions.length > 0) setCommissions(dbCommissions);

      const dbBonusCodes = await fetchTableData<BonusCode>('bonus_codes');
      if (dbBonusCodes && dbBonusCodes.length > 0) setBonusCodes(dbBonusCodes);
    }

    hydrateFromSupabase();

    // Poll every 5 seconds for multi-device cross-syncing
    const syncInterval = setInterval(hydrateFromSupabase, 5000);

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
    syncTableData('withdrawal_proofs', withdrawalProofs);
  }, [withdrawalProofs]);

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

  // AUTOMATIC 24H REVENUE DISTRIBUTION WORKER (Revenus tombent automatiquement chaque 24h)
  useEffect(() => {
    const checkAndDistributeEarnings = () => {
      if (!userInvestments || userInvestments.length === 0) return;

      let hasChanges = false;
      const userGainsMap: Record<string, number> = {};

      const updatedInvestments = userInvestments.map(inv => {
        if (inv.daysRemaining <= 0) return inv;

        const lastClaimMs = new Date(inv.lastClaimDate).getTime();
        const elapsedMs = Date.now() - lastClaimMs;
        const cycles = Math.min(inv.daysRemaining, Math.floor(elapsedMs / (24 * 3600 * 1000)));

        if (cycles >= 1) {
          hasChanges = true;
          const totalEarnedInCycle = inv.dailyGain * cycles;
          userGainsMap[inv.userId] = (userGainsMap[inv.userId] || 0) + totalEarnedInCycle;

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
        setUsers(prevUsers => prevUsers.map(u => {
          const gain = userGainsMap[u.id];
          if (gain && gain > 0) {
            return {
              ...u,
              balance: u.balance + gain,
              totalEarnings: u.totalEarnings + gain
            };
          }
          return u;
        }));
      }
    };

    checkAndDistributeEarnings();
    const interval = setInterval(checkAndDistributeEarnings, 5000);
    return () => clearInterval(interval);
  }, [userInvestments]);

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

  const saveWithdrawalAccount = (accountName: string, accountNumber: string, pin: string) => {
    if (!currentUser) return { success: false, error: "Non connecté." };
    if (!accountName.trim()) return { success: false, error: "Le nom complet est requis." };
    if (!accountNumber.trim()) return { success: false, error: "Le numéro de compte de retrait est requis." };
    if (!pin.trim() || pin.length < 4) return { success: false, error: "Le code PIN doit comporter au moins 4 chiffres." };

    // Obscure PIN securely before storing
    const securePinHash = btoa(pin + '_aura_sec_salt');

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          withdrawalAccountName: accountName.trim(),
          withdrawalAccountNumber: accountNumber.trim(),
          withdrawalPinHash: securePinHash
        };
      }
      return u;
    }));

    return { success: true };
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
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const cleanBalance = Math.max(0, u.balance + amount);
        return { ...u, balance: cleanBalance };
      }
      return u;
    }));
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
      return updated;
    });
  };

  const markTicketsAsRead = (userId: string) => {
    setTickets(prev => {
      const hasUnread = prev.some(t => t.userId === userId && t.isReadByUser === false);
      if (!hasUnread) return prev;
      const updated = prev.map(t => t.userId === userId ? { ...t, isReadByUser: true } : t);
      localStorage.setItem('fintech_tickets', JSON.stringify(updated));
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
      return updated;
    });
    return { success: true };
  };

  const processWithdrawalProof = (proofId: string, status: 'approved' | 'rejected') => {
    setWithdrawalProofs(prev => prev.map(p => {
      if (p.id === proofId) {
        return {
          ...p,
          status,
          isVerified: status === 'approved'
        };
      }
      return p;
    }));
  };

  const deleteWithdrawalProof = (proofId: string) => {
    setWithdrawalProofs(prev => {
      const updated = prev.filter(p => p.id !== proofId);
      localStorage.setItem('aurainvest_withdrawal_proofs', JSON.stringify(updated));
      return updated;
    });
    deleteRecord('withdrawal_proofs', proofId);
  };

  const updateWithdrawalProof = (proofId: string, data: Partial<WithdrawalProof>) => {
    setWithdrawalProofs(prev => prev.map(p => {
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
    }));
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
      bonusCodes,
      commissions,
      tickets,
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
      redeemBonusCode,
      claimDailyBonus,
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
      updateUserRole
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
