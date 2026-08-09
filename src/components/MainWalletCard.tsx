import React, { useState } from 'react';
import { CreditCard, ShieldCheck, History, Eye, EyeOff, Award, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { User } from '../types';

interface MainWalletCardProps {
  user: User;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenHistory: () => void;
}

export const MainWalletCard: React.FC<MainWalletCardProps> = ({
  user,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenHistory
}) => {
  const [hideBalance, setHideBalance] = useState(false);

  return (
    <div className="w-full bg-white rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-4 border-2 border-slate-300 shadow-sm">
      {/* Background radial soft glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4 stroke-[2.5px]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 font-mono">
              TABLEAU DE BORD & PORTEFEUILLE
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Portefeuille Principal
            </h3>
          </div>
        </div>

        {/* Action icons row */}
        <div className="flex items-center space-x-2">
          {/* Secured Badge */}
          <div className="flex items-center space-x-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sécurisé</span>
          </div>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-amber-700 flex items-center justify-center transition-all cursor-pointer"
            title="Historique des transactions"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Privacy Eye Toggle */}
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-amber-700 flex items-center justify-center transition-all cursor-pointer"
            title={hideBalance ? "Afficher le solde" : "Masquer le solde"}
          >
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Available Balance Display */}
      <div className="py-1">
        <span className="text-xs text-slate-500 font-medium block mb-1">
          Solde disponible
        </span>
        <div className="flex items-center space-x-3">
          <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
            {hideBalance ? '••••••••' : user.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
          </span>
          <span className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-xl text-xs sm:text-sm tracking-wide shadow-xs">
            XOF
          </span>
        </div>
      </div>
    </div>
  );
};
