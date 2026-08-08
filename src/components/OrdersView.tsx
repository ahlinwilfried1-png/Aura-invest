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
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  currentUser,
  userInvestments,
  onClaimDailyEarning,
  onShowToast,
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
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-4 font-sans text-slate-800">
      {/* Top Banner Overview */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          <Package className="w-7 h-7 text-red-600 flex-shrink-0" />
          <h2>Suivi des Commandes & Investissements</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 font-normal">
          Consultez vos produits souscrits et l'évolution de vos gains.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 sm:p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
            Commandes Actives
          </span>
          <span className="text-lg sm:text-2xl font-black text-slate-900 mt-1 block">
            {activeCount}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 sm:p-4">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
            Gains Collectés
          </span>
          <span className="text-lg sm:text-2xl font-black text-emerald-600 font-mono mt-1 block">
            {totalCollectedAmount.toLocaleString()}{' '}
            <span className="text-xs font-sans text-emerald-600">FCFA</span>
          </span>
        </div>
      </div>

      {/* List of Orders */}
      {myInvestments.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 sm:p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-800">Aucune commande souscrite pour l'instant</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Rendez-vous sur la page d'accueil pour choisir un produit et commencer à percevoir vos revenus quotidiens.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block font-mono">
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
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 transition-all"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase font-mono ${
                            isCompleted
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCompleted ? 'TERMINÉ' : 'EN COURS (ACTIF)'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">#{inv.id.slice(-6)}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                        {inv.productName}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block font-mono">
                        MONTANT PAYÉ
                      </span>
                      <span className="text-base sm:text-lg font-black text-red-600 font-mono">
                        {inv.price.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>

                  {/* 24h Progress & Next Scheduled Credit Bar */}
                  {!isCompleted && (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 sm:p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-700 font-mono flex items-center space-x-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>ÉVOLUTION SUR 24 HEURES : {progressPct}%</span>
                        </span>

                        <span className="font-mono text-slate-600 font-bold">
                          {isReadyToClaim ? (
                            <span className="text-emerald-600 font-black">Rendement Prêt !</span>
                          ) : (
                            <span className="text-slate-500">
                              Prochain crédit : {hoursLeft.toString().padStart(2, '0')}:
                              {minutesLeft.toString().padStart(2, '0')}:
                              {secondsLeft.toString().padStart(2, '0')}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Progress Track */}
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-1000 ${
                            isReadyToClaim ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                        <span>Revenu quotidien : <strong className="text-slate-800 font-mono font-bold">+{inv.dailyGain.toLocaleString()} FCFA</strong></span>
                        <span>Date de crédit prévue : <strong className="text-slate-800 font-mono">{new Date(nextClaimTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</strong></span>
                      </div>
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
