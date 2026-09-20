import React, { useState } from 'react';
import { ChevronRight, Sun, Zap, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { InvestmentProduct, User } from '../types';
import { ProductDetailView } from './ProductDetailView';

interface ProductsViewProps {
  products: InvestmentProduct[];
  currentUser: User;
  onConfirmPurchase: (product: InvestmentProduct, quantity: number) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onOpenDeposit: () => void;
  onShowToast: (status: 'success' | 'err' | 'info', text: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  currentUser,
  onConfirmPurchase,
  onOpenDeposit,
  onShowToast
}) => {
  const [selectedProduct, setSelectedProduct] = useState<InvestmentProduct | null>(null);

  // Active products sorted by order
  const activeProducts = products
    .filter((p) => p.isActive !== false)
    .sort((a, b) => (a.order || 99) - (b.order || 99));

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
    <div className="max-w-3xl mx-auto space-y-4 animate-fadeIn pb-6 font-sans text-pink-50">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-[#2c0b46] via-[#1a072c] to-[#10031c] text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-pink-500/30 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>PLAN Duke Energy</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            L'énergie solaire à votre portée
          </h2>

          <p className="text-xs sm:text-sm text-pink-200/80 max-w-xl leading-relaxed">
            Profitez d'un rendement quotidien de <span className="font-bold text-amber-400">15% par jour</span> pendant un cycle de <span className="font-bold text-amber-400">40 jours</span> avec versement automatique de vos gains chaque 24h.
          </p>

          {/* Quick value props */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono">
            <div className="bg-[#240c3c]/80 backdrop-blur-xs rounded-xl p-2 border border-pink-500/25">
              <div className="text-[11px] sm:text-xs font-black text-amber-300">15% / jour</div>
              <div className="text-[9px] sm:text-[10px] text-pink-200/70 font-sans font-medium">Taux garanti</div>
            </div>
            <div className="bg-[#240c3c]/80 backdrop-blur-xs rounded-xl p-2 border border-pink-500/25">
              <div className="text-[11px] sm:text-xs font-black text-pink-300">40 Jours</div>
              <div className="text-[9px] sm:text-[10px] text-pink-200/70 font-sans font-medium">Cycle d'énergie</div>
            </div>
            <div className="bg-[#240c3c]/80 backdrop-blur-xs rounded-xl p-2 border border-pink-500/25">
              <div className="text-[11px] sm:text-xs font-black text-emerald-300">Retraits 7j/7</div>
              <div className="text-[9px] sm:text-[10px] text-pink-200/70 font-sans font-medium">Mobile Money</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Products List */}
      {activeProducts.length === 0 ? (
        <div className="bg-[#1a082b] rounded-3xl p-8 text-center border border-pink-500/25 space-y-2">
          <AlertCircle className="w-10 h-10 text-pink-400 mx-auto" />
          <h4 className="font-bold text-pink-200">Aucune formule active pour le moment</h4>
          <p className="text-xs text-pink-300/70">Les nouvelles formules solaires seront bientôt disponibles.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {activeProducts.map((product) => {
            const gain40 = product.gain40Days || (product.dailyGain * (product.duration || 40));
            const total40 = product.totalGain || (product.price + gain40);
            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-gradient-to-br from-[#1d0831] to-[#140523] rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 border border-pink-500/25 hover:border-amber-400/60 hover:shadow-pink-900/30 transition-all cursor-pointer group"
              >
                {/* Top row: Title + Badges on left, Image on right */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base sm:text-lg font-black text-white leading-snug group-hover:text-amber-300 transition-colors">
                        {product.name}
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {product.badge || '15% / jour'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {product.duration || 40} jours
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-pink-200/70 line-clamp-1">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <img
                    src={
                      product.image && product.image.trim() !== ''
                        ? product.image
                        : 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80';
                    }}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0 border border-pink-500/30 bg-[#250d3c]"
                  />
                </div>

                {/* Middle row: Official Plan Grid (Matching Image Columns) */}
                <div className="bg-[#240b3c]/80 border border-pink-500/30 rounded-2xl p-3 sm:p-4 grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="border-r border-pink-500/20 pr-1">
                    <div className="text-amber-400 font-black text-base sm:text-lg tracking-tight">
                      +{(Number(product.dailyGain) || 0).toLocaleString('fr-FR')} F
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold text-pink-200/80 mt-0.5 font-sans">
                      / jour (15%)
                    </div>
                  </div>
                  <div className="border-r border-pink-500/20 pr-1">
                    <div className="text-pink-300 font-black text-base sm:text-lg tracking-tight">
                      {(Number(gain40) || 0).toLocaleString('fr-FR')} F
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold text-pink-200/80 mt-0.5 font-sans">
                      Gain sur 40j
                    </div>
                  </div>
                  <div>
                    <div className="text-purple-300 font-black text-base sm:text-lg tracking-tight">
                      {(Number(total40) || 0).toLocaleString('fr-FR')} F
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold text-pink-200/80 mt-0.5 font-sans">
                      Total à 40j
                    </div>
                  </div>
                </div>

                {/* Bottom row: Price + INVESTIR Button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs sm:text-sm font-medium text-pink-200">
                    Prix de la formule :{' '}
                    <span className="text-white font-black ml-1 text-base sm:text-lg font-mono">
                      {(Number(product.price) || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                    className="bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl tracking-wider transition-all cursor-pointer shadow-lg shadow-pink-600/30 uppercase flex items-center space-x-1.5 border border-amber-400/30"
                  >
                    <span>SOUSCRIRE</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
