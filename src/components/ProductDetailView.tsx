import React, { useState } from 'react';
import { ArrowLeft, Headphones, ShieldCheck, CheckCircle2, AlertTriangle, CreditCard, X, Sparkles, Check } from 'lucide-react';
import { InvestmentProduct, User } from '../types';

interface ProductDetailViewProps {
  product: InvestmentProduct;
  currentUser: User;
  onBack: () => void;
  onConfirmPurchase: (product: InvestmentProduct, quantity: number) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
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
  const totalGain40Days = (product.gain40Days || (product.dailyGain * (product.duration || 40))) * quantity;
  const totalGain = (product.totalGain || (product.price * quantity + totalGain40Days));

  const hasSufficientBalance = (Number(currentUser.balance) || 0) >= totalPrice;

  const handleConfirmClick = async () => {
    if (isSubmitting) return;

    if (!hasSufficientBalance) {
      onShowToast('err', `Solde insuffisant (${(Number(currentUser.balance) || 0).toLocaleString('fr-FR')} FCFA disponible sur ${(Number(totalPrice) || 0).toLocaleString('fr-FR')} FCFA requis).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onConfirmPurchase(product, quantity);
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
    <div className="animate-fadeIn max-w-xl mx-auto pb-28 text-pink-50 space-y-4 font-sans">
      {/* 1. TOP HERO IMAGE HEADER MATCHING REFERENCE IMAGE */}
      <div className="relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-2xl bg-[#140624] border border-pink-500/30">
        <img
          src={product.image && product.image.trim() !== '' ? product.image : 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80'}
          alt={product.name}
          className="w-full h-full object-cover object-center brightness-95"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80';
          }}
        />
        
        {/* Top Gradient Overlay */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

        {/* Back Button (Circle with Arrow Left on Top-Left) */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-[#1c072c]/90 backdrop-blur-md text-pink-200 border border-pink-500/30 flex items-center justify-center shadow-lg hover:bg-pink-900/50 hover:text-white active:scale-95 transition-all cursor-pointer z-10"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Customer Support Badge on Top-Right */}
        <div className="absolute top-4 right-4 bg-[#1f0a33]/90 backdrop-blur-md border border-pink-500/40 text-white rounded-full pl-2 pr-3 py-1 flex items-center space-x-1.5 shadow-lg z-10">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 font-bold">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-mono font-bold tracking-tight uppercase text-pink-300 leading-none">
              CUSTOMER SERVICE
            </span>
            <span className="text-[10px] font-extrabold leading-none text-white">
              Support Center
            </span>
          </div>
        </div>
      </div>

      {/* 2. FIRST CONTAINER: STATS BOX MATCHING OFFICIAL TABLE */}
      <div className="py-3 px-4 text-white grid grid-cols-3 gap-2 bg-gradient-to-r from-[#240c3c] via-[#1a072c] to-[#240c3c] border border-pink-500/30 rounded-2xl shadow-xl font-mono text-center">
        <div className="space-y-0.5">
          <div className="text-lg sm:text-xl font-black tracking-tight text-white">
            {(Number(totalPrice) || 0).toLocaleString('fr-FR')} F
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-pink-300 uppercase font-sans">
            Prix
          </div>
        </div>

        <div className="space-y-0.5 border-x border-pink-500/20 px-1">
          <div className="text-lg sm:text-xl font-black tracking-tight text-amber-400">
            {(Number(totalGain40Days) || 0).toLocaleString('fr-FR')} F
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-pink-300 uppercase font-sans">
            Gain sur 40j
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-lg sm:text-xl font-black tracking-tight text-purple-300">
            {(Number(totalGain) || 0).toLocaleString('fr-FR')} F
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-pink-300 uppercase font-sans">
            Total à 40j
          </div>
        </div>
      </div>

      {/* 3. SECOND SECTION: QUANTITY, DAILY REVENUE (NO BOXES/BORDERS) */}
      <div className="py-2 px-2 space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium py-1">
          <span className="text-pink-200/90 font-semibold">Quantité de packs :</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 rounded-lg bg-[#270b42] hover:bg-[#340f56] text-pink-200 border border-pink-500/30 font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer"
            >
              -
            </button>
            <span className="font-extrabold text-white font-mono text-sm sm:text-base px-2">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-7 h-7 rounded-lg bg-[#270b42] hover:bg-[#340f56] text-pink-200 border border-pink-500/30 font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm font-medium py-1">
          <span className="text-pink-200/90 font-semibold">Rendement quotidien (15% chaque 24h) :</span>
          <span className="font-extrabold text-amber-400 font-mono text-sm sm:text-base">
            +{(Number(totalDailyGain) || 0).toLocaleString('fr-FR')} FCFA / jour
          </span>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm font-medium py-1">
          <span className="text-pink-200/90 font-semibold">Durée du cycle énergétique :</span>
          <span className="font-extrabold text-pink-300 font-mono text-sm sm:text-base">
            {product.duration || 40} jours
          </span>
        </div>
      </div>

      {/* 4. THIRD SECTION: PRODUCT SUMMARY & DETAILS */}
      <div className="py-2 px-2 space-y-4">
        <div className="space-y-2.5 text-sm sm:text-base font-bold text-white leading-relaxed font-sans">
          <div className="flex items-center space-x-2">
            <span>☀️⚡</span>
            <span className="text-pink-200">Formule {product.name} — PLAN Duke Energy</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>💰</span>
            <span>Prix : {(Number(totalPrice) || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📈</span>
            <span className="text-amber-300">Revenu journalier (15%) : +{(Number(totalDailyGain) || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⚡</span>
            <span className="text-pink-300">Gain sur {product.duration || 40} jours : {(Number(totalGain40Days) || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🏆</span>
            <span className="text-purple-300">Total à {product.duration || 40} jours : {(Number(totalGain) || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        <div className="pt-2 space-y-3 text-pink-200/80 font-medium text-xs sm:text-sm leading-relaxed">
          <p>
            {product.description || `La formule solaire ${product.name} de Duke Energy génère un rendement quotidien garanti de 15% par jour pendant un cycle complet de 40 jours.`}
          </p>
          <p>
            Vos revenus sont automatiquement crédités toutes les 24 heures sur votre compte et sont immédiatement retirables via Mobile Money (TMoney, Moov Money, MTN, Orange, Wave).
          </p>
        </div>
      </div>

      {/* 5. BOTTOM ROSE/PURPLE ACTION BUTTON */}
      <div className="pt-2">
        <button
          onClick={() => setShowConfirmModal(true)}
          className="w-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 active:scale-[0.99] text-white font-black text-sm sm:text-base py-3.5 rounded-full shadow-lg shadow-pink-600/40 transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center space-x-2 border border-pink-400/40"
        >
          <span>Investissez maintenant</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* CONFIRMATION MODAL BEFORE PAYMENT */}
      {/* ========================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-[#1f0a33] to-[#120521] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-pink-500/30 relative text-pink-50">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-pink-500/25 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-pink-400 tracking-wider block">
                    Vérification
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Confirmation d'investissement
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-pink-500/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Summary Table */}
            <div className="bg-[#240c3c] rounded-2xl p-4 space-y-2.5 border border-pink-500/25">
              <div className="flex justify-between items-center text-xs">
                <span className="text-pink-300 font-medium">Nom du produit</span>
                <span className="font-extrabold text-white">{product.name}</span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-pink-300 font-medium">Prix unitaire</span>
                <span className="font-bold text-white font-mono">{(Number(product.price) || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-pink-300 font-medium">Quantité</span>
                <span className="font-extrabold text-white font-mono bg-[#160526] px-2 py-0.5 rounded border border-pink-500/30">
                  {quantity}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-pink-500/25 pt-2">
                <span className="text-pink-200 font-extrabold uppercase font-mono">Montant total à payer</span>
                <span className="font-black text-pink-400 font-mono text-sm sm:text-base">
                  {(Number(totalPrice) || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-pink-300 font-medium">Revenu quotidien prévu</span>
                <span className="font-extrabold text-pink-300 font-mono">+{(Number(totalDailyGain) || 0).toLocaleString('fr-FR')} FCFA / jour</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-pink-300 font-medium">Revenu total prévu</span>
                <span className="font-black text-purple-300 font-mono">+{(Number(totalGain) || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            {/* User Balance Check Bar */}
            <div className={`p-3.5 rounded-2xl border text-xs font-bold space-y-1 ${
              hasSufficientBalance 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                : 'bg-red-950/40 border-red-500/40 text-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-pink-300" />
                  <span>Votre Solde Actuel :</span>
                </span>
                <span className="font-mono font-black text-sm">{(Number(currentUser.balance) || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>

              {!hasSufficientBalance && (
                <div className="pt-1.5 flex items-start space-x-2 border-t border-red-500/30 text-[11px] text-red-300 leading-snug">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>
                    Solde insuffisant. Il vous manque <strong>{(Number(totalPrice - currentUser.balance) || 0).toLocaleString('fr-FR')} FCFA</strong> pour effectuer cet achat.
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
                  className="w-full bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-lg shadow-pink-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-pink-400/40"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Traitement en cours...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmer l'achat ({(Number(totalPrice) || 0).toLocaleString('fr-FR')} FCFA)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    onOpenDeposit();
                  }}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm py-3 rounded-xl transition-all shadow-lg shadow-pink-600/30 flex items-center justify-center space-x-2 cursor-pointer border border-pink-400/40"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Recharger mon compte (Faire un dépôt)</span>
                </button>
              )}

              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="w-full bg-[#270b42] hover:bg-[#340f56] text-pink-200 font-bold text-xs sm:text-sm py-2.5 rounded-xl transition-all cursor-pointer border border-pink-500/25"
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
