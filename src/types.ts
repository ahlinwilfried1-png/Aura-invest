/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  country: string;
  balance: number;
  dailyEarnings: number;
  totalEarnings: number;
  vipLevel: number;
  isBlocked: boolean;
  createdAt: string;
  role: 'admin' | 'user';
  referralCode: string;
  referredByCode: string | null;
  withdrawalAccountName?: string;
  withdrawalAccountNumber?: string;
  withdrawalPinHash?: string;
}

export interface InvestmentProduct {
  id: string;
  name: string;
  price: number;
  dailyGain: number;
  duration: number; // in days
  totalGain: number;
  isActive: boolean;
  image?: string;
  description?: string;
  order?: number;
  badge?: string;
  color?: string; // Tailwind color classes for custom styled premium look
}

export interface UserInvestment {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  price: number;
  dailyGain: number;
  duration: number;
  daysRemaining: number;
  purchaseDate: string;
  lastClaimDate: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  method: 'Mixx By Yas' | 'Moov Money' | 'MTN Money' | 'Orange Money';
  transactionId: string;
  screenshotUrl: string | null; // Base64 or mock image url
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  receivedAmount?: number;
  network: 'Mixx By Yas' | 'Moov Money' | 'MTN Money' | 'Orange Money' | string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface BonusCode {
  code: string;
  amount: number;
  maxUses: number;
  usedBy: string[]; // List of userId
  createdAt: string;
}

export interface CommissionHistory {
  id: string;
  referrerId: string;
  refereeId: string;
  refereeName: string;
  amount: number;
  level: 1 | 2 | 3;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  imageUrl?: string;
  status: 'open' | 'closed';
  createdAt: string;
  reply?: string;
  replyCreatedAt?: string;
  isReadByUser?: boolean;
}

export interface RevenueLog {
  id: string;
  userId: string;
  investmentId: string;
  productName: string;
  amount: number;
  creditedAt: string;
}

export interface WithdrawalProof {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  network: string;
  message: string;
  imageUrl?: string | null;
  createdAt: string;
  isVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
}
