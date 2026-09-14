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
    <div className="max-w-3xl mx-auto space-y-4 animate-fadeIn pb-6 font-sans text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-800/40 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>CYCLE D'INVESTISSEMENT DE 365 JOURS</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Catalogue des Produits Agricoles
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
            Choisissez votre formule d'adhésion VIP pour commencer à percevoir vos revenus quotidiens automatisés directement sur votre portefeuille.
          </p>

          {/* Quick value props */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/10">
              <div className="text-[11px] sm:text-xs font-black text-amber-300">24h / 24</div>
              <div className="text-[9px] sm:text-[10px] text-slate-300 font-sans font-medium">Gains continus</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/10">
              <div className="text-[11px] sm:text-xs font-black text-emerald-300">365 Jours</div>
              <div className="text-[9px] sm:text-[10px] text-slate-300 font-sans font-medium">Cycle annuel</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/10">
              <div className="text-[11px] sm:text-xs font-black text-sky-300">Mobile Money</div>
              <div className="text-[9px] sm:text-[10px] text-slate-300 font-sans font-medium">Retraits 7j/7</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Section Title */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-emerald-700" />
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Plans Disponibles ({activeProducts.length})
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
          Gains automatisés
        </span>
      </div>

      {/* 3. Products List */}
      {activeProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700">Aucun produit actif pour le moment</h4>
          <p className="text-xs text-slate-500">Les nouvelles formules seront bientôt disponibles.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-2.5 border-2 border-emerald-900/15 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Top row: Title + Duration on left, Image Thumbnail on right */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors">
                      {product.name}
                    </h4>
                    {product.badge && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300/60">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 font-medium flex items-center space-x-1">
                    <span>Cycle de profit :</span>
                    <strong className="text-emerald-800 font-bold ml-1 font-mono">
                      {product.duration || 365} jours
                    </strong>
                  </div>
                </div>

                <img
                  src={
                    product.image && product.image.trim() !== ''
                      ? product.image
                      : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'
                  }
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80';
                  }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                />
              </div>

              {/* Middle row: Light Amber Box with 2 Columns */}
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3 sm:p-4 grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-emerald-700 font-black text-lg sm:text-xl tracking-tight font-mono">
                    +{(Number(product.dailyGain) || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                    Revenu quotidien (24h)
                  </div>
                </div>
                <div>
                  <div className="text-amber-900 font-black text-lg sm:text-xl tracking-tight font-mono">
                    {(Number(product.totalGain) || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                    Revenu total ({product.duration || 365}j)
                  </div>
                </div>
              </div>

              {/* Bottom row: Price + Green/Amber INVESTIR Button */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-sm sm:text-base font-normal text-slate-900">
                  Prix d'adhésion :{' '}
                  <span className="text-emerald-950 font-black ml-1 text-base sm:text-lg font-mono">
                    {(Number(product.price) || 0).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProduct(product);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl tracking-wider transition-all cursor-pointer shadow-xs uppercase flex items-center space-x-1.5"
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
