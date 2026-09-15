import React, { useState } from 'react';
import { Sparkles, ChevronRight, Package, ShieldCheck, TrendingUp, Clock, AlertCircle } from 'lucide-react';
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
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Gamme Officielle Apple AirPods
          </h2>

          <p className="text-xs sm:text-sm text-pink-200/80 max-w-xl leading-relaxed">
            Choisissez votre formule d'adhésion VIP pour commencer à percevoir vos revenus quotidiens garantis 24h/24 directement sur votre solde.
          </p>

          {/* Quick value props */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-center font-mono">
            <div className="bg-[#240c3c]/80 backdrop-blur-xs rounded-xl p-2 border border-pink-500/25">
              <div className="text-[11px] sm:text-xs font-black text-pink-300">24h / 24</div>
              <div className="text-[9px] sm:text-[10px] text-pink-200/70 font-sans font-medium">Gains continus</div>
            </div>
            <div className="bg-[#240c3c]/80 backdrop-blur-xs rounded-xl p-2 border border-pink-500/25">
              <div className="text-[11px] sm:text-xs font-black text-fuchsia-300">Mobile Money</div>
              <div className="text-[9px] sm:text-[10px] text-pink-200/70 font-sans font-medium">Retraits 7j/7</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Products List */}
      {activeProducts.length === 0 ? (
        <div className="bg-[#1a082b] rounded-3xl p-8 text-center border border-pink-500/25 space-y-2">
          <AlertCircle className="w-10 h-10 text-pink-400 mx-auto" />
          <h4 className="font-bold text-pink-200">Aucun produit actif pour le moment</h4>
          <p className="text-xs text-pink-300/70">Les nouvelles formules seront bientôt disponibles.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-gradient-to-br from-[#1d0831] to-[#140523] rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-2.5 border border-pink-500/25 hover:border-pink-400/70 hover:shadow-pink-900/30 transition-all cursor-pointer group"
            >
              {/* Top row: Title + Duration on left, Image Thumbnail on right */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base sm:text-lg font-extrabold text-white leading-snug group-hover:text-pink-300 transition-colors">
                      {product.name}
                    </h4>
                    {product.badge && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/40">
                        {product.badge}
                      </span>
                    )}
                  </div>
                </div>

                <img
                  src={
                    product.image && product.image.trim() !== ''
                      ? product.image
                      : 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80'
                  }
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80';
                  }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0 border border-pink-500/30 bg-[#250d3c]"
                />
              </div>

              {/* Middle row: Rose-Violet Stats Box with 2 Columns */}
              <div className="bg-[#240b3c]/70 border border-pink-500/30 rounded-2xl p-3 sm:p-4 grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-pink-400 font-black text-lg sm:text-xl tracking-tight font-mono">
                    +{(Number(product.dailyGain) || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-pink-200/80 mt-0.5">
                    Revenu quotidien (24h)
                  </div>
                </div>
                <div>
                  <div className="text-purple-300 font-black text-lg sm:text-xl tracking-tight font-mono">
                    {(Number(product.totalGain) || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-pink-200/80 mt-0.5">
                    Revenu total
                  </div>
                </div>
              </div>

              {/* Bottom row: Price + Rose/Violet INVESTIR Button */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-sm sm:text-base font-normal text-pink-200">
                  Prix d'adhésion :{' '}
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
                  className="bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl tracking-wider transition-all cursor-pointer shadow-lg shadow-pink-600/30 uppercase flex items-center space-x-1.5 border border-pink-400/40"
                >
                  <span>INVESTIR</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
