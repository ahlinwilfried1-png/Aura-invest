import React from 'react';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import { WithdrawalRequest, User } from '../types';

interface WithdrawalHistoryViewProps {
  withdrawals: WithdrawalRequest[];
  currentUser: User;
  onBack?: () => void;
  isModal?: boolean;
}

export function formatWithdrawalDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateStr;
  }
}

export function formatWithdrawalId(wth: WithdrawalRequest): string {
  if (wth.id && wth.id.startsWith('B') && wth.id.length >= 10) {
    return wth.id;
  }
  try {
    const d = new Date(wth.createdAt);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const numPart = (wth.id.replace(/\D/g, '') || '01').padStart(4, '0');
    return `B${yy}${mm}${dd}${hh}${min}${ss}${numPart}`;
  } catch {
    return wth.id.toUpperCase();
  }
}

export const WithdrawalHistoryView: React.FC<WithdrawalHistoryViewProps> = ({
  withdrawals,
  currentUser,
  onBack,
  isModal = false
}) => {
  // Filter current user's withdrawals & sort newest first
  const userWithdrawals = withdrawals
    .filter(w => w.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className={`w-full max-w-xl mx-auto ${isModal ? 'bg-[#150524] p-4 text-pink-50' : 'min-h-[500px] pb-6 text-pink-50'} font-sans`}>
      {/* 1. Header Bar matching Rose-Violet Theme */}
      <div className="bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 text-white px-4 py-3.5 flex items-center justify-between rounded-t-2xl sm:rounded-2xl shadow-lg border border-pink-400/30">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-white hover:opacity-80 transition-opacity cursor-pointer flex items-center"
            aria-label="Retour"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
        ) : (
          <div className="w-6" />
        )}
        <h1 className="text-base sm:text-lg font-bold text-center flex-1 pr-5 tracking-tight">
          Historique des retraits
        </h1>
      </div>

      {/* 2. List of Withdrawal Cards */}
      <div className="py-2 space-y-3 min-h-[300px]">
        {userWithdrawals.length === 0 ? (
          <div className="py-12 text-center text-pink-300/60 font-medium text-xs sm:text-sm">
            Aucun retrait enregistré pour le moment.
          </div>
        ) : (
          userWithdrawals.map((wth) => {
            const displayId = formatWithdrawalId(wth);
            const formattedDate = formatWithdrawalDate(wth.createdAt);
            const received = wth.receivedAmount || Math.round(wth.amount * 0.82);

            return (
              <div
                key={wth.id}
                className="bg-[#240c3c] rounded-2xl border border-pink-500/25 p-3.5 sm:p-4 shadow-xl space-y-2.5 text-pink-50 transition-all hover:border-pink-400/50"
              >
                {/* ID & Status */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold border-b border-pink-500/20 pb-2">
                  <span className="font-mono font-bold text-white tracking-tight select-all">
                    {displayId}
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-[11px] sm:text-xs uppercase font-mono ${
                      wth.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : wth.status === 'rejected'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse'
                    }`}
                  >
                    {wth.status === 'approved'
                      ? 'Réussi'
                      : wth.status === 'rejected'
                      ? 'Rejeté'
                      : 'En attente'}
                  </span>
                </div>

                {/* Details Table Lines */}
                <div className="space-y-1 text-xs sm:text-sm text-pink-200/90 font-medium">
                  <div className="flex items-center">
                    <span className="w-20 text-pink-300">Montant</span>
                    <span className="text-white font-mono font-bold">: FCFA {wth.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-20 text-pink-300">Reçu</span>
                    <span className="text-white font-mono font-bold">: FCFA {received.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-20 text-pink-300">Date</span>
                    <span className="text-pink-100">: {formattedDate}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Bottom indicator text */}
        <div className="pt-4 pb-2 text-center text-xs sm:text-sm text-pink-300/50 font-medium select-none">
          Aucune autre donnée
        </div>
      </div>
    </div>
  );
};
