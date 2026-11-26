/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronRight, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { InvestmentProduct, User, UserInvestment } from '../types';
import { ProductDetailView } from './ProductDetailView';

interface ProductsViewProps {
  products: InvestmentProduct[];
  currentUser: User;
  userInvestments?: UserInvestment[];
  onConfirmPurchase: (product: InvestmentProduct, quantity: number) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onOpenDeposit: () => void;
  onShowToast: (status: 'success' | 'err' | 'info', text: string) => void;
}

const formatAmount = (num: number | undefined | null): string => {
  const n = Number(num) || 0;
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  currentUser,
  userInvestments = [],
  onConfirmPurchase,
  onOpenDeposit,
  onShowToast
}) => {
  const [selectedProduct, setSelectedProduct] = useState<InvestmentProduct | null>(null);

  // Active products sorted by order
  const activeProducts = products
    .filter((p) => p.isActive !== false)
    .sort((a, b) => (a.order || 99) - (b.order || 99));

  // User investments calculations
  const myInvestments = userInvestments.filter((inv) => inv.userId === currentUser.id);
  const activeDevicesCount = myInvestments.reduce((acc, inv) => acc + (inv.quantity || 1), 0);

  // Total revenues collected from investments
  const totalRevenues = myInvestments.reduce(
    (sum, inv) => sum + (inv.totalGain || ((inv.duration - inv.daysRemaining) * inv.dailyGain)),
    0
  );

  // If a product is selected, show the full detail & purchase flow
  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        currentUser={currentUser}
        onBack={() => setSelectedProduct(null)}
        onConfirmPurchase={onConfirmPurchase}
        onOpenDeposit={onOpenDeposit}
        onShowToast={(status, text) => onShowToast(status, text)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white font-sans pb-24 select-none antialiased">
      <div className="max-w-md mx-auto px-4 pt-4 space-y-5">

        {/* 1. DUAL SUMMARY TILES (MON APPAREIL & MES REVENUS) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tile 1: Mon appareil */}
          <div className="bg-gradient-to-b from-[#2b2c32] to-[#17181d] border border-gray-700/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between min-h-[88px]">
            <span className="text-xs font-medium text-gray-300 block">
              Mon appareil
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-1.5 block">
              {activeDevicesCount}
            </span>
          </div>

          {/* Tile 2: Mes revenus */}
          <div className="bg-gradient-to-b from-[#2b2c32] to-[#17181d] border border-gray-700/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between min-h-[88px]">
            <span className="text-xs font-medium text-gray-300 block">
              Mes revenus
            </span>
            <span className="text-lg sm:text-xl font-black text-[#00E575] font-mono mt-1.5 block">
              FCFA {formatAmount(totalRevenues)}
            </span>
          </div>
        </div>

        {/* 2. ACTIVE USER INVESTMENTS (IF ANY) */}
        {myInvestments.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                Mes produits actifs ({myInvestments.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {myInvestments.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-[#121318] border border-emerald-500/30 rounded-2xl p-3.5 shadow-md flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-white block">
                      {inv.productName}
                    </span>
                    <span className="text-xs text-[#00E575] block font-mono font-semibold">
                      Revenu quotidien : +{formatAmount(inv.dailyGain)} FCFA
                    </span>
                    <span className="text-[11px] text-gray-400 block">
                      Jours restants : {inv.daysRemaining} / {inv.duration} j
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono shrink-0">
                    Actif
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. DIRECT PRODUCT PLANS LIST (GOLD 1 - GOLD 8, NO BANNER/POSTER) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Plans Gold Speed</span>
            </h2>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              {activeProducts.length} plans disponibles
            </span>
          </div>

          <div className="space-y-3">
            {activeProducts.map((p) => {
              const durationDays = p.duration || 150;
              const totalGain = p.totalGain || p.dailyGain * durationDays;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="bg-[#121318] hover:bg-[#191b22] border border-gray-800 hover:border-amber-500/50 rounded-2xl p-4 shadow-lg cursor-pointer transition-all group space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-gray-900 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-amber-400">GOLD</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors truncate">
                            {p.name}
                          </h3>
                          {p.badge && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5 flex items-center space-x-2">
                          <span className="inline-flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>Cycle : {durationDays} jours</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] uppercase text-gray-400 font-semibold">Prix</div>
                      <div className="text-sm sm:text-base font-black text-amber-400 font-mono">
                        {formatAmount(p.price)} F
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#0a0b0e] rounded-xl p-2.5 border border-gray-800/80 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 font-sans block">Revenu quotidien</span>
                      <span className="font-bold text-[#00E575] flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{formatAmount(p.dailyGain)} FCFA</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-sans block">Revenu total</span>
                      <span className="font-bold text-white">
                        {formatAmount(totalGain)} FCFA
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-gray-400 truncate pr-2">
                      Crédit automatique chaque 24h
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(p);
                      }}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl flex items-center space-x-1 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <span>Investir</span>
                      <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
