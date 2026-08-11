import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WithdrawalRequest } from '../types';

interface LiveWithdrawalFeedProps {
  withdrawals: WithdrawalRequest[];
}

/**
 * Format phone or account number into masked handle like +228 90****95
 */
const formatMaskedHandle = (phoneOrAcc: string, userName?: string): string => {
  const raw = (phoneOrAcc || '').trim();
  if (raw.startsWith('+')) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 7) {
      const cc = digits.slice(0, 3);
      const rest = digits.slice(3);
      return `+${cc} ${rest.slice(0, 2)}****${rest.slice(-2)}`;
    }
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 8) {
    return `+228 ${digits.slice(0, 2)}****${digits.slice(-2)}`;
  }
  if (digits.length >= 4) {
    return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
  }
  if (userName && userName.length >= 2) {
    return `${userName.slice(0, 2)}****`;
  }
  return '+228 90****95';
};

/**
 * Calculate relative time string in French ("À l’instant", "Il y a 10s", "Il y a 2 min", etc.)
 */
const getRelativeTimeString = (dateIso: string, now: number): string => {
  const time = new Date(dateIso).getTime();
  if (isNaN(time)) return "À l’instant";
  const diffSec = Math.max(0, Math.floor((now - time) / 1000));

  if (diffSec < 15) {
    return "À l’instant";
  }
  if (diffSec < 60) {
    return `Il y a ${diffSec}s`;
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `Il y a ${diffMin} min`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
};

export const LiveWithdrawalFeed: React.FC<LiveWithdrawalFeedProps> = ({ withdrawals }) => {
  const [now, setNow] = useState<number>(Date.now());
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Filter actual registered withdrawals from DB (valid amount > 0)
  const realWithdrawals = [...withdrawals]
    .filter(w => w && w.amount > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Update timer every second for relative timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cycle to next notification automatically every 3.5 seconds
  useEffect(() => {
    if (realWithdrawals.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % realWithdrawals.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [realWithdrawals.length]);

  // Requirement: "Si aucun retrait n’est disponible, ne rien afficher plutôt que d’inventer des données."
  if (realWithdrawals.length === 0) {
    return null;
  }

  const currentWithdrawal = realWithdrawals[currentIndex % realWithdrawals.length];
  if (!currentWithdrawal) return null;

  const handle = formatMaskedHandle(currentWithdrawal.userPhone || currentWithdrawal.accountNumber, currentWithdrawal.userName);
  const timeAgo = getRelativeTimeString(currentWithdrawal.createdAt, now);
  const amountFormatted = currentWithdrawal.amount.toLocaleString('fr-FR');

  return (
    <div className="w-full flex justify-end mb-1">
      <div className="w-full max-w-[180px] sm:max-w-[195px] bg-emerald-50/50 rounded-lg px-2 py-1 overflow-hidden relative">
        <div className="flex items-center space-x-1">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-800 shrink-0">
            Retrait
          </span>
          <span className="text-[8px] text-slate-300">•</span>
          <span className="text-[8px] font-medium text-slate-400 truncate">
            {timeAgo}
          </span>
        </div>

        <div className="h-5 relative mt-0.5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWithdrawal.id || currentIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-between text-[9px] leading-tight"
            >
              <span className="font-bold text-slate-800 truncate mr-1">
                {handle}
              </span>
              <span className="font-extrabold text-emerald-700 shrink-0">
                +{amountFormatted} XOF
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

