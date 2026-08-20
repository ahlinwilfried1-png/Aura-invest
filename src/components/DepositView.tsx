import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Info, 
  Headphones, 
  X, 
  ShieldCheck, 
  Phone, 
  ExternalLink, 
  Copy, 
  Check, 
  CreditCard, 
  Lock, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { User, DepositRequest } from '../types';
import { ALLOWED_COUNTRIES } from '../constants/countries';

export const WESTPAY_RECHARGE_URL = 'https://westpay.cfd/link/3s7hn53gmsupa11l';

interface DepositViewProps {
  currentUser: User;
  deposits: DepositRequest[];
  onRequestDeposit: (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => { success: boolean; error?: string };
  onBack: () => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
}

export const DepositView: React.FC<DepositViewProps> = ({
  currentUser,
  onRequestDeposit,
  onBack,
  onShowToast
}) => {
  // Preset amounts requested
  const presetAmounts = [4000, 15000, 20000, 30000, 50000, 75000, 100000, 150000];

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('CI');
  const currentCountry = ALLOWED_COUNTRIES.find(c => c.code === selectedCountryCode) || ALLOWED_COUNTRIES[0];
  
  const [selectedNetwork, setSelectedNetwork] = useState<string>(currentCountry.networks[0] || 'Mobile Money');
  const [phone, setPhone] = useState<string>(currentUser.phone || '');
  const [depAmount, setDepAmount] = useState<number>(4000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('4000');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessGatewayModal, setShowSuccessGatewayModal] = useState(false);
  const [latestTxRef, setLatestTxRef] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const found = ALLOWED_COUNTRIES.find(c => c.code === code);
    if (found && found.networks.length > 0) {
      setSelectedNetwork(found.networks[0]);
    }
  };

  const handleSelectPreset = (amount: number) => {
    setDepAmount(amount);
    setCustomAmountStr(amount.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmountStr(val);
    setDepAmount(val ? parseInt(val, 10) : 0);
  };

  const handleCopyPaymentLink = () => {
    try {
      navigator.clipboard.writeText(WESTPAY_RECHARGE_URL);
      setCopiedLink(true);
      onShowToast('success', "Lien de paiement WestPay copié dans le presse-papiers !");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (_) {
      onShowToast('success', "Lien WestPay : https://westpay.cfd/link/3s7hn53gmsupa11l");
    }
  };

  const handleOpenDirectWestPay = () => {
    try {
      window.open(WESTPAY_RECHARGE_URL, '_blank', 'noopener,noreferrer');
    } catch (_) {
      window.location.href = WESTPAY_RECHARGE_URL;
    }
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 6) {
      onShowToast('err', "Veuillez renseigner votre numéro de téléphone avant de choisir un montant.");
      return;
    }
    if (!depAmount || depAmount < 1000) {
      onShowToast('err', "Le montant minimum de recharge est de 1 000 FCFA.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteDeposit = () => {
    if (isSubmitting) return; // double-submission guard
    setIsSubmitting(true);

    const txRef = `WP-${Date.now().toString().slice(-6)}`;
    setLatestTxRef(txRef);
    const res = onRequestDeposit(depAmount, `${selectedNetwork} (WestPay)`, txRef, null);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      
      if (res.success) {
        setShowSuccessGatewayModal(true);
        onShowToast('success', `Recharge enregistrée ! Redirection vers la passerelle de paiement WestPay...`);
        
        // Open WestPay in a new tab
        try {
          const opened = window.open(WESTPAY_RECHARGE_URL, '_blank', 'noopener,noreferrer');
          if (!opened || opened.closed || typeof opened.closed === 'undefined') {
            // Popup blocker might have blocked it, modal with direct button is visible
          }
        } catch (_) {}
      } else {
        onShowToast('err', res.error || "Erreur lors de l'enregistrement de la recharge.");
      }
    }, 400);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-10 animate-fadeIn max-w-lg mx-auto font-sans">
      {/* 1. EN-TÊTE COMPACT */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-3.5 py-2.5 flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center space-x-1 text-slate-800 hover:text-amber-600 font-bold text-xs sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight text-center">
          Recharger mon compte
        </h1>

        <div className="w-12" />
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* ÉTAPE 1: IDENTIFICATION PAYS & RÉSEAU & NUMÉRO */}
        <div className="bg-white rounded-2xl p-3.5 space-y-3 border border-slate-200/70 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider font-mono">
            <Phone className="w-4 h-4 text-amber-500 shrink-0" />
            <span>1. Pays, Réseau & Numéro de téléphone</span>
          </div>

          <div className="space-y-2.5">
            {/* Choix du pays (5 pays autorisés) */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Pays partenaire</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ALLOWED_COUNTRIES.map((c) => {
                  const isSelected = selectedCountryCode === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountryChange(c.code)}
                      className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-50 border-amber-400 text-slate-950 font-black shadow-2xs'
                          : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Choix du réseau Mobile Money pour ce pays */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>Réseau Mobile Money ({currentCountry.name})</span>
                <span className="text-amber-600 font-mono text-[9px]">{currentCountry.flag} {currentCountry.prefix}</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {currentCountry.networks.map((net) => {
                  const isSelected = selectedNetwork === net;
                  return (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setSelectedNetwork(net)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {net}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Saisie numéro */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Numéro de téléphone ({selectedNetwork})</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-amber-500 transition-colors">
                <span className="text-xs font-bold font-mono text-amber-600 mr-2 shrink-0">{currentCountry.prefix}</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 07 01 02 03 04"
                  className="w-full bg-transparent outline-none font-bold text-slate-900 text-xs sm:text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ÉTAPE 2: SELECTION DU MONTANT */}
        <div className="bg-white rounded-2xl p-3.5 space-y-2.5 border border-slate-200/70 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider font-mono">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>2. Choisir le montant de la recharge</span>
          </div>

          {/* Grille des montants sélectionnables */}
          <div className="grid grid-cols-4 gap-1.5">
            {presetAmounts.map(amt => {
              const isSelected = depAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectPreset(amt)}
                  className={`py-2 px-1.5 rounded-xl text-center font-black text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-400/50'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {amt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                </button>
              );
            })}
          </div>

          {/* Champ de saisie personnalisé */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 flex items-center space-x-2">
            <span className="text-xs font-black text-slate-900 font-mono tracking-wider shrink-0">
              FCFA
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={customAmountStr}
              onChange={handleCustomAmountChange}
              className="w-full bg-transparent outline-none font-black text-amber-600 text-sm sm:text-base font-mono"
              placeholder="Saisir montant libre..."
            />
          </div>
        </div>

        {/* CADRE RECHARGE MAINTENANT */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
          <button
            type="button"
            onClick={handleOpenConfirm}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 text-center"
            id="btn-recharger-maintenant"
          >
            <Lock className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Recharger maintenant ({depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA)</span>
          </button>
        </div>

        {/* ÉTAPES SIMPLIFIÉES */}
        <div className="px-1 space-y-1.5 text-slate-600 text-xs">
          <p className="font-extrabold text-slate-800 text-[11px] uppercase font-mono flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Guide rapide de recharge :</span>
          </p>
          <ul className="space-y-1 text-[11px] text-slate-500 leading-snug">
            <li>• Renseignez votre indicatif et numéro de téléphone mobile.</li>
            <li>• Choisissez le montant souhaité (minimum 1 000 FCFA).</li>
            <li>• Cliquez sur <strong>"Recharger maintenant"</strong> pour finaliser votre recharge.</li>
            <li>• Votre compte sera automatiquement crédité dès validation du paiement.</li>
          </ul>
        </div>
      </div>

      {/* MODAL DE CONFIRMATION DE RECHARGE */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xs sm:max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-amber-600">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-black text-sm text-slate-900">Confirmation de Recharge</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Paiement :</span>
                <span className="font-bold text-slate-900 text-xs flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Paiement Mobile Sécurisé</span>
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Pays & Réseau :</span>
                <span className="font-bold text-slate-900 text-xs">{currentCountry.flag} {currentCountry.name} ({selectedNetwork})</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Téléphone :</span>
                <span className="font-bold font-mono text-slate-900 text-xs">{currentCountry.prefix} {phone}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Montant :</span>
                <span className="font-bold font-mono text-slate-900 text-xs">{depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-800 font-black text-xs">Montant Total :</span>
                <span className="font-black font-mono text-amber-600 text-sm">{depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium text-center">
              Vous allez être redirigé vers la page sécurisée pour finaliser votre recharge de <strong className="text-slate-800 font-mono">{depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA</strong>.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteDeposit}
                disabled={isSubmitting}
                className="py-2.5 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {isSubmitting ? (
                  <span>Préparation...</span>
                ) : (
                  <>
                    <span>Valider & Payer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REDIRECTION ET CONFIRMATION APRES SOUMISSION */}
      {showSuccessGatewayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xs sm:max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Demande de recharge enregistrée</h3>
              <p className="text-xs text-slate-500">
                Référence : <strong className="font-mono text-slate-800">{latestTxRef}</strong>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between font-bold text-amber-900 text-[11px]">
                <span>Paiement Sécurisé</span>
                <span className="font-mono">{depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Cliquez sur le bouton ci-dessous pour ouvrir la page de paiement sécurisée et finaliser votre transaction.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleOpenDirectWestPay}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Ouvrir la page de paiement</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessGatewayModal(false);
                  onBack();
                }}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fermer et retourner au tableau de bord
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
