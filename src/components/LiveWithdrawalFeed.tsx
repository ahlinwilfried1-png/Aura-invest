import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Zap } from 'lucide-react';
import { WithdrawalRequest } from '../types';

interface LiveWithdrawalFeedProps {
  withdrawals?: WithdrawalRequest[];
}

export interface WithdrawalFeedItem {
  id: string;
  handle: string;
  amount: number;
  network: string;
  statusText: string;
  timeAgo: string;
  vipBadge?: string;
}

// Liste enrichie de retraits simules (irréels) en direct pour dynamiser le flux
const SIMULATED_WITHDRAWALS: WithdrawalFeedItem[] = [
  { id: 'sim-1', handle: '+228 91****34', amount: 15000, network: 'T-Money', statusText: 'Paiement Effectué', timeAgo: 'À l’instant', vipBadge: 'VIP 2' },
  { id: 'sim-2', handle: '+225 07****89', amount: 50000, network: 'Orange Money', statusText: 'Retrait Validé', timeAgo: 'Il y a 5s', vipBadge: 'VIP 4' },
  { id: 'sim-3', handle: '+229 97****56', amount: 25000, network: 'Moov Money', statusText: 'Transfert Réussi', timeAgo: 'Il y a 12s', vipBadge: 'VIP 3' },
  { id: 'sim-4', handle: '+228 90****12', amount: 4000, network: 'T-Money', statusText: 'Paiement Effectué', timeAgo: 'Il y a 18s', vipBadge: 'VIP 1' },
  { id: 'sim-5', handle: '+223 76****44', amount: 100000, network: 'Orange Money', statusText: 'Succès 100%', timeAgo: 'Il y a 25s', vipBadge: 'VIP 5' },
  { id: 'sim-6', handle: '+226 70****88', amount: 150000, network: 'Coris Money', statusText: 'Paiement Effectué', timeAgo: 'Il y a 32s', vipBadge: 'VIP 6' },
  { id: 'sim-7', handle: '+221 77****01', amount: 200000, network: 'Wave', statusText: 'Retrait Validé', timeAgo: 'Il y a 40s', vipBadge: 'VIP 7' },
  { id: 'sim-8', handle: '+237 69****67', amount: 300000, network: 'MTN Mobile', statusText: 'Transfert Réussi', timeAgo: 'Il y a 48s', vipBadge: 'VIP 8' },
  { id: 'sim-9', handle: '+228 93****82', amount: 25000, network: 'Moov Money', statusText: 'Paiement Effectué', timeAgo: 'Il y a 55s', vipBadge: 'VIP 3' },
  { id: 'sim-10', handle: '+225 05****21', amount: 500000, network: 'Wave / Orange', statusText: 'Paiement Effectué', timeAgo: 'Il y a 1 min', vipBadge: 'VIP 9' },
  { id: 'sim-11', handle: '+228 92****90', amount: 800000, network: 'T-Money', statusText: 'Retrait Validé', timeAgo: 'Il y a 1 min', vipBadge: 'VIP 10' },
  { id: 'sim-12', handle: '+227 96****15', amount: 15000, network: 'Airtel Money', statusText: 'Succès 100%', timeAgo: 'Il y a 2 min', vipBadge: 'VIP 2' },
  { id: 'sim-13', handle: '+225 01****78', amount: 50000, network: 'MTN Money', statusText: 'Transfert Réussi', timeAgo: 'Il y a 2 min', vipBadge: 'VIP 4' },
  { id: 'sim-14', handle: '+229 61****33', amount: 100000, network: 'Moov Money', statusText: 'Paiement Effectué', timeAgo: 'Il y a 3 min', vipBadge: 'VIP 5' },
  { id: 'sim-15', handle: '+228 98****04', amount: 4000, network: 'T-Money', statusText: 'Paiement Effectué', timeAgo: 'Il y a 3 min', vipBadge: 'VIP 1' },
];

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
 * Calculate relative time string in French
 */
const getRelativeTimeString = (dateIso: string, now: number): string => {
  const time = new Date(dateIso).getTime();
  if (isNaN(time)) return "À l’instant";
  const diffSec = Math.max(0, Math.floor((now - time) / 1000));

  if (diffSec < 15) return "À l’instant";
  if (diffSec < 60) return `Il y a ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
};

export const LiveWithdrawalFeed: React.FC<LiveWithdrawalFeedProps> = ({ withdrawals = [] }) => {
  const [now, setNow] = useState<number>(Date.now());
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Convert real user withdrawals to feed format
  const realFeedItems: WithdrawalFeedItem[] = (withdrawals || [])
    .filter(w => w && w.amount > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((w, idx) => ({
      id: w.id || `real-${idx}`,
      handle: formatMaskedHandle(w.userPhone || w.accountNumber, w.userName),
      amount: w.amount,
      network: w.network || 'Mobile Money',
      statusText: w.status === 'approved' ? 'Paiement Effectué' : 'Retrait en cours',
      timeAgo: getRelativeTimeString(w.createdAt, now),
      vipBadge: 'VIP'
    }));

  // Combine real items + simulated items
  const allFeedItems = [...realFeedItems, ...SIMULATED_WITHDRAWALS];

  // Update timer every second for relative timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cycle through items every 3.2 seconds
  useEffect(() => {
    if (allFeedItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % allFeedItems.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [allFeedItems.length]);

  const current = allFeedItems[currentIndex % allFeedItems.length];
  if (!current) return null;

  const amountFormatted = current.amount.toLocaleString('fr-FR');

  return (
    <div className="w-full flex justify-end mb-1">
      <div className="w-full max-w-[175px] sm:max-w-[190px] bg-white text-slate-800 rounded-lg p-1.5 border border-emerald-200/90 shadow-2xs relative overflow-hidden">
        {/* Header Row: Indicator Dot + Live Badge + Time */}
        <div className="flex items-center justify-between text-[8px] font-mono mb-1 pb-0.5 border-b border-slate-100">
          <div className="flex items-center space-x-1">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-emerald-800 uppercase tracking-tight flex items-center gap-0.5 text-[7.5px]">
              <Zap className="w-2 h-2 text-amber-500 fill-amber-500 inline shrink-0" />
              <span>RETRAIT EN DIRECT</span>
            </span>
          </div>

          <span className="text-slate-400 font-sans text-[7.5px] font-medium">
            {current.timeAgo}
          </span>
        </div>

        {/* Content Row with Smooth Animation */}
        <div className="h-5.5 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id || currentIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-between text-[8.5px]"
            >
              {/* User Handle & Network */}
              <div className="flex flex-col truncate pr-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="font-extrabold text-slate-900 truncate text-[8.5px]">
                    {current.handle}
                  </span>
                  {current.vipBadge && (
                    <span className="bg-amber-50 text-amber-700 font-mono text-[7px] font-black px-1 py-0 rounded border border-amber-200 shrink-0">
                      {current.vipBadge}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-0.5 text-[7.5px] text-emerald-700 font-semibold truncate">
                  <CheckCircle2 className="w-2 h-2 text-emerald-600 shrink-0" />
                  <span className="truncate">{current.statusText} • {current.network}</span>
                </div>
              </div>

              {/* Amount Pill */}
              <div className="shrink-0 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-black font-mono text-[8.5px] text-right shadow-2xs">
                +{amountFormatted} XOF
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};


