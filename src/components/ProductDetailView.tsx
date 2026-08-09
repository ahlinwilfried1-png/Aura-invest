import React, { useState } from 'react';
import { ArrowLeft, Headphones, ShieldCheck, CheckCircle2, AlertTriangle, CreditCard, X, Sparkles, Check } from 'lucide-react';
import { InvestmentProduct, User } from '../types';

interface ProductDetailViewProps {
  product: InvestmentProduct;
  currentUser: User;
  onBack: () => void;
  onConfirmPurchase: (product: InvestmentProduct, quantity: number) => { success: boolean; error?: string };
  onOpenDeposit: () => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  currentUser,
  onBack,
  onConfirmPurchase,
  onOpenDeposit,
  onShowToast
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const totalPrice = product.price * quantity;
  const totalDailyGain = product.dailyGain * quantity;
  const totalGain = product.totalGain * quantity;

  const hasSufficientBalance = currentUser.balance >= totalPrice;

  const handleConfirmClick = async () => {
    if (isSubmitting) return;

    if (!hasSufficientBalance) {
      onShowToast('err', `Solde insuffisant (${currentUser.balance.toLocaleString()} FCFA disponible sur ${totalPrice.toLocaleString()} FCFA requis).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = onConfirmPurchase(product, quantity);
      if (res.success) {
        setShowConfirmModal(false);
        onShowToast('success', `Souscription réussie ! Vous avez investi dans "${product.name}".`);
        onBack();
      } else {
        onShowToast('err', res.error || "Erreur lors de la souscription.");
      }
    } catch (err) {
      onShowToast('err', "Une erreur inattendue s'est produite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-xl mx-auto pb-28 text-slate-900 space-y-4">
      {/* 1. TOP HERO IMAGE HEADER MATCHING REFERENCE IMAGE */}
      <div className="relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-sm bg-slate-900">
        <img
          src={product.image && product.image.trim() !== '' ? product.image : 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80'}
          alt={product.name}
          className="w-full h-full object-cover object-center brightness-95"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80';
          }}
        />
        
        {/* Top Gradient Overlay */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

        {/* Back Button (Circle with Arrow Left on Top-Left) */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-slate-900 flex items-center justify-center shadow-md hover:bg-white active:scale-95 transition-all cursor-pointer z-10"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Customer Support Badge on Top-Right */}
        <div className="absolute top-4 right-4 bg-sky-950/80 backdrop-blur-md border border-sky-400/40 text-white rounded-full pl-2 pr-3 py-1 flex items-center space-x-1.5 shadow-lg z-10">
          <div className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-mono font-bold tracking-tight uppercase text-sky-300 leading-none">
              CUSTOMER SERVICE
            </span>
            <span className="text-[10px] font-extrabold leading-none">
              Support Center
            </span>
          </div>
        </div>
      </div>

      {/* 2. FIRST CONTAINER: PRICE & TOTAL REVENUE */}
      <div className="py-2 px-4 text-slate-900 flex items-center justify-around">
        <div className="text-center space-y-0.5">
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">
            {product.price.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Prix(XAF)
          </div>
        </div>

        <div className="h-10 w-px bg-slate-300/80" />

        <div className="text-center space-y-0.5">
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-red-600">
            {product.totalGain.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Revenu total(XAF)
          </div>
        </div>
      </div>

      {/* 3. SECOND SECTION: CYCLE, QUANTITY, DAILY REVENUE (NO BOXES/BORDERS) */}
      <div className="py-2 px-2 space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium py-1">
          <span className="text-slate-800 font-semibold">Cycle d'investissement(Jours):</span>
          <span className="font-extrabold text-slate-900 font-mono text-sm sm:text-base">
            {product.duration}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm font-medium py-1">
          <span className="text-slate-800 font-semibold">Quantité d'achat</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer"
            >
              -
            </button>
            <span className="font-extrabold text-slate-900 font-mono text-sm sm:text-base px-2">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-7 h-7 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm font-medium py-1">
          <span className="text-slate-800 font-semibold">Revenu quotidien</span>
          <span className="font-extrabold text-slate-900 font-mono text-sm sm:text-base">
            {totalDailyGain.toLocaleString()}XAF
          </span>
        </div>
      </div>

      {/* 4. THIRD SECTION: PRODUCT EMOJI SUMMARY & DETAILS (TEXT LAID DIRECTLY ON BACKGROUND) */}
      <div className="py-2 px-2 space-y-4">
        <div className="space-y-2.5 text-sm sm:text-base font-bold text-slate-900 leading-relaxed font-sans">
          <div className="flex items-center space-x-2">
            <span>🌾✨</span>
            <span>{product.name} — Avancez vers la réalisation de vos rêves !</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>💰</span>
            <span>Prix : {totalPrice.toLocaleString()} XAF</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📅</span>
            <span>Durée : {product.duration} Jours</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📈</span>
            <span>Revenu journalier : {totalDailyGain.toLocaleString()} XAF</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🏆</span>
            <span>Revenu total : {totalGain.toLocaleString()} XAF</span>
          </div>
        </div>

        <div className="pt-2 space-y-3 text-slate-800 font-medium text-xs sm:text-sm leading-relaxed">
          <p>
            Chaque effort est un pas vers le succès : chaque acte de persévérance renforce votre potentiel pour l'avenir.
          </p>

          <p>
            {product.description || `Chez Nutrien, nous croyons que les opportunités appartiennent à ceux qui osent agir. Grâce à une participation active, à l'apprentissage continu et au partage d'expériences, vous pouvez non seulement vous épanouir personnellement, mais aussi grandir aux côtés de votre équipe pour bâtir ensemble un avenir meilleur.`}
          </p>

          <p className="font-bold text-slate-900 pt-1">
            🌟 Le succès n'attend pas les hésitants ; il appartient à ceux qui ont le courage de faire le premier pas.
          </p>

          <p>
            Avançons main dans la main : restons confiants, déterminés à atteindre nos objectifs et créateurs de valeur.
          </p>

          <p className="font-bold text-slate-900 pt-1">
            💪 Rejoignez Nutrien et ouvrez la voie à un avenir brillant !
          </p>
        </div>
      </div>

      {/* 5. BOTTOM RED ACTION BUTTON MATCHING REFERENCE IMAGE */}
      <div className="pt-2">
        <button
          onClick={() => setShowConfirmModal(true)}
          className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-black text-sm sm:text-base py-3.5 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center space-x-2"
        >
          <span>Investissez maintenant</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* CONFIRMATION MODAL BEFORE PAYMENT */}
      {/* ========================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-100 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-red-600 tracking-wider block">
                    Vérification
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Confirmation d'investissement
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Summary Table */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 border border-slate-200/80">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Nom du produit</span>
                <span className="font-extrabold text-slate-900">{product.name}</span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Prix unitaire</span>
                <span className="font-bold text-slate-900 font-mono">{product.price.toLocaleString()} FCFA</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Quantité</span>
                <span className="font-extrabold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  {quantity}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-slate-200/80 pt-2">
                <span className="text-slate-900 font-extrabold uppercase font-mono">Montant total à payer</span>
                <span className="font-black text-red-600 font-mono text-sm sm:text-base">
                  {totalPrice.toLocaleString()} FCFA
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-600 font-medium">Revenu quotidien prévu</span>
                <span className="font-extrabold text-emerald-700 font-mono">+{totalDailyGain.toLocaleString()} FCFA / jour</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Durée du cycle</span>
                <span className="font-bold text-slate-900 font-mono">{product.duration} Jours</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Revenu total prévu</span>
                <span className="font-black text-emerald-700 font-mono">+{totalGain.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* User Balance Check Bar */}
            <div className={`p-3.5 rounded-2xl border text-xs font-bold space-y-1 ${
              hasSufficientBalance 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-slate-700" />
                  <span>Votre Solde Actuel :</span>
                </span>
                <span className="font-mono font-black text-sm">{currentUser.balance.toLocaleString()} FCFA</span>
              </div>

              {!hasSufficientBalance && (
                <div className="pt-1.5 flex items-start space-x-2 border-t border-red-200 text-[11px] text-red-700 leading-snug">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>
                    Solde insuffisant. Il vous manque <strong>{(totalPrice - currentUser.balance).toLocaleString()} FCFA</strong> pour effectuer cet achat.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Buttons */}
            <div className="space-y-2 pt-1">
              {hasSufficientBalance ? (
                <button
                  onClick={handleConfirmClick}
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Traitement en cours...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmer l'achat ({totalPrice.toLocaleString()} FCFA)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    onOpenDeposit();
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm py-3 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Recharger mon compte (Faire un dépôt)</span>
                </button>
              )}

              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
