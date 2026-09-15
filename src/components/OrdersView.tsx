import React, { useState, useEffect } from 'react';
import { User, UserInvestment } from '../types';
import { 
  Package, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  Hourglass, 
  ArrowUpRight, 
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';

interface OrdersViewProps {
  currentUser: User;
  userInvestments: UserInvestment[];
  onClaimDailyEarning: (investmentId: string) => { success: boolean; error?: string };
  onShowToast: (type: 'success' | 'err' | 'info', message: string) => void;
  onGoToProducts?: () => void;
}

const formatAmount = (num: number | undefined | null): string => {
  const n = Number(num) || 0;
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const OrdersView: React.FC<OrdersViewProps> = ({
  currentUser,
  userInvestments,
  onClaimDailyEarning,
  onShowToast,
  onGoToProducts,
}) => {
  const [now, setNow] = useState<number>(Date.now());

  // Live timer update for 24h countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const myInvestments = userInvestments.filter((inv) => inv.userId === currentUser.id);

  // Total investment stats
  const activeCount = myInvestments.filter((inv) => inv.daysRemaining > 0).length;
  const totalInvestedAmount = myInvestments.reduce((sum, inv) => sum + inv.price, 0);
  const totalCollectedAmount = myInvestments.reduce(
    (sum, inv) => sum + (inv.duration - inv.daysRemaining) * inv.dailyGain,
    0
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-4 font-sans text-white">
      {/* Top Banner Overview */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2 text-xl sm:text-2xl font-black text-white tracking-tight">
          <Package className="w-7 h-7 text-pink-400 flex-shrink-0" />
          <h2>Suivi des Commandes & Investissements</h2>
        </div>
        <p className="text-xs sm:text-sm text-pink-200/80 font-normal">
          Consultez vos produits souscrits et l'évolution de vos gains.
        </p>
      </div>

      {/* Summary KPI Cards - Nombre de produits & Revenus collectés */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: Nombre de produits */}
        <div className="bg-[#1a082b] border border-pink-500/25 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase font-mono font-bold text-pink-300 tracking-wider block">
              PRODUITS SOUSCRITS
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 block">
              {myInvestments.reduce((acc, inv) => acc + (inv.quantity || 1), 0)}{' '}
              <span className="text-xs font-sans text-pink-300/70 font-normal">produit(s)</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold shrink-0 border border-pink-500/30">
            <Package className="w-5 h-5 stroke-[2.25]" />
          </div>
        </div>

        {/* Card 2: Revenus collectés */}
        <div className="bg-[#1a082b] border border-pink-500/25 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase font-mono font-bold text-emerald-400 tracking-wider block">
              REVENUS COLLECTÉS
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono mt-1 block">
              {formatAmount(totalCollectedAmount)}{' '}
              <span className="text-xs font-sans text-emerald-400 font-normal">FCFA</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* List of Orders */}
      {myInvestments.length === 0 ? (
        <div className="bg-[#1a082b] border border-pink-500/25 rounded-3xl p-8 sm:p-12 text-center space-y-3 shadow-md">
          <Package className="w-12 h-12 text-pink-400/40 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-bold text-white">Aucune commande souscrite pour l'instant</h3>
          <p className="text-xs text-pink-300/70 max-w-sm mx-auto">
            Rendez-vous sur l'onglet <strong className="text-pink-300 font-semibold">Produit</strong> pour choisir une formule d'investissement et commencer à percevoir vos revenus quotidiens.
          </p>
          {onGoToProducts && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onGoToProducts}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 active:scale-95 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-wider border border-pink-300/30"
              >
                <Package className="w-4 h-4" />
                <span>Voir les Produits</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <span className="text-xs font-extrabold text-pink-300 uppercase tracking-wider block font-mono">
            DÉTAILS DES PRODUITS SOUSCRITS ({myInvestments.length})
          </span>

          <div className="space-y-4">
            {myInvestments.map((inv) => {
              const daysCollected = inv.duration - inv.daysRemaining;
              const amountCollected = daysCollected * inv.dailyGain;
              const amountRemaining = inv.daysRemaining * inv.dailyGain;

              const startDate = new Date(inv.purchaseDate);
              const endDate = new Date(
                startDate.getTime() + inv.duration * 24 * 3600 * 1000
              );

              // Calculate 24h progress cycle
              const lastClaim = new Date(inv.lastClaimDate).getTime();
              const nextClaimTime = lastClaim + 24 * 3600 * 1000;
              const diffMs = nextClaimTime - now;

              const hoursLeft = Math.max(0, Math.floor(diffMs / (3600 * 1000)));
              const minutesLeft = Math.max(0, Math.floor((diffMs % (3600 * 1000)) / (60 * 1000)));
              const secondsLeft = Math.max(0, Math.floor((diffMs % (60 * 1000)) / 1000));

              // 24h progress percentage (0 to 100%)
              const elapsedMs = Math.min(24 * 3600 * 1000, Math.max(0, 24 * 3600 * 1000 - diffMs));
              const progressPct = Math.min(100, Math.max(0, Math.round((elapsedMs / (24 * 3600 * 1000)) * 100)));

              const isReadyToClaim = diffMs <= 0 && inv.daysRemaining > 0;
              const isCompleted = inv.daysRemaining <= 0;

              return (
                <div
                  key={inv.id}
                  className="bg-[#1a082b] border border-pink-500/25 rounded-2xl p-4 sm:p-5 shadow-md space-y-4 transition-all"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase font-mono border ${
                            isCompleted
                              ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isCompleted ? 'TERMINÉ' : 'EN COURS (ACTIF)'}
                        </span>
                        <span className="text-xs text-pink-300/60 font-mono">#{inv.id.slice(-6)}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mt-1">
                        {inv.productName}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-pink-300/60 block font-mono">
                        MONTANT PAYÉ
                      </span>
                      <span className="text-base sm:text-lg font-black text-pink-400 font-mono">
                        {formatAmount(inv.price)} FCFA
                      </span>
                    </div>
                  </div>

                  {/* 24h Progress & Next Scheduled Credit Bar */}
                  {!isCompleted && (
                    <div className="bg-[#120422] border border-pink-500/25 rounded-xl p-3 sm:p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-pink-200 font-mono flex items-center space-x-1">
                          <Zap className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                          <span>ÉVOLUTION SUR 24 HEURES : {progressPct}%</span>
                        </span>

                        <span className="font-mono text-pink-300 font-bold">
                          {isReadyToClaim ? (
                            <span className="text-emerald-400 font-black animate-pulse">Rendement Prêt !</span>
                          ) : (
                            <span className="text-pink-300/70">
                              Prochain crédit : {hoursLeft.toString().padStart(2, '0')}:
                              {minutesLeft.toString().padStart(2, '0')}:
                              {secondsLeft.toString().padStart(2, '0')}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Progress Track */}
                      <div className="w-full bg-[#1a082b] rounded-full h-2.5 overflow-hidden border border-pink-500/20">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-1000 ${
                            isReadyToClaim ? 'bg-emerald-400' : 'bg-gradient-to-r from-pink-500 to-purple-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-pink-300/70 pt-1">
                        <span>Revenu quotidien : <strong className="text-emerald-400 font-mono font-bold">+{formatAmount(inv.dailyGain)} FCFA</strong></span>
                        <span>Date de crédit prévue : <strong className="text-pink-200 font-mono">{new Date(nextClaimTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</strong></span>
                      </div>

                      {/* Claim Button when 24h cycle complete */}
                      {isReadyToClaim && (
                        <button
                          onClick={() => onClaimDailyEarning(inv.id)}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2 border border-pink-300/30"
                        >
                          <Zap className="w-4 h-4 fill-white" />
                          <span>Recevoir mon revenu (+{formatAmount(inv.dailyGain)} FCFA) sur le solde principal</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
