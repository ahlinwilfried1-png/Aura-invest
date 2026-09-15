import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Wallet, 
  ShieldCheck, 
  Phone, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { User, DepositRequest } from '../types';
import { useApp } from '../context/AppContext';
import { ALLOWED_COUNTRIES, AllowedCountry, getCountryByCode } from '../constants/countries';

interface DepositViewProps {
  currentUser: User;
  deposits: DepositRequest[];
  onRequestDeposit?: (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => { success: boolean; error?: string };
  onBack: () => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
}

// Payment networks tailored specifically per country
interface PaymentMethodOption {
  id: string;
  name: string;
  badge: string;
  color: string;
}

const COUNTRY_PAYMENT_METHODS: Record<string, PaymentMethodOption[]> = {
  CM: [
    { id: 'mtn_cm', name: 'MTN Mobile Money', badge: 'MoMo', color: 'bg-amber-500 text-black border-amber-400' },
    { id: 'orange_cm', name: 'Orange Money', badge: 'OM', color: 'bg-orange-500 text-white border-orange-400' }
  ],
  TG: [
    { id: 'tmoney_tg', name: 'TMoney', badge: 'Togocom', color: 'bg-emerald-600 text-white border-emerald-500' },
    { id: 'moov_tg', name: 'Moov Money', badge: 'Flooz', color: 'bg-blue-600 text-white border-blue-500' }
  ],
  BJ: [
    { id: 'mtn_bj', name: 'MTN Mobile Money', badge: 'MoMo', color: 'bg-amber-500 text-black border-amber-400' },
    { id: 'moov_bj', name: 'Moov Money', badge: 'Flooz', color: 'bg-blue-600 text-white border-blue-500' },
    { id: 'celtiis_bj', name: 'Celtiis Cash', badge: 'Celtiis', color: 'bg-purple-600 text-white border-purple-500' }
  ],
  BF: [
    { id: 'orange_bf', name: 'Orange Money', badge: 'OM', color: 'bg-orange-500 text-white border-orange-400' },
    { id: 'moov_bf', name: 'Moov Money', badge: 'Flooz', color: 'bg-blue-600 text-white border-blue-500' },
    { id: 'wave_bf', name: 'Wave', badge: 'Wave', color: 'bg-sky-500 text-white border-sky-400' }
  ],
  CI: [
    { id: 'wave_ci', name: 'Wave', badge: 'Wave', color: 'bg-sky-500 text-white border-sky-400' },
    { id: 'orange_ci', name: 'Orange Money', badge: 'OM', color: 'bg-orange-500 text-white border-orange-400' },
    { id: 'mtn_ci', name: 'MTN Mobile Money', badge: 'MoMo', color: 'bg-amber-500 text-black border-amber-400' },
    { id: 'moov_ci', name: 'Moov Money', badge: 'Flooz', color: 'bg-blue-600 text-white border-blue-500' }
  ]
};

// Quick selection amounts required by specifications
const QUICK_AMOUNTS = [3000, 8000, 15000, 25000, 70000, 100000];

// Exact Official Payment Gateway Link requested by user
const EXACT_PAYMENT_URL = 'https://soccopay.com/pay_link.php?id=108d608fd7c949fce11acb78537955ac';

export const DepositView: React.FC<DepositViewProps> = ({
  currentUser,
  deposits,
  onBack,
  onShowToast
}) => {
  const { initiateDepositCheckout } = useApp();

  // Active view: 'form' or 'history'
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Detect user's registered country
  const detectedCountry = useMemo(() => {
    return ALLOWED_COUNTRIES.find(c => 
      c.name.toLowerCase() === (currentUser.country || '').toLowerCase() || 
      c.code.toLowerCase() === (currentUser.country || '').toLowerCase() ||
      (currentUser.phone && currentUser.phone.startsWith(c.prefix)) ||
      c.code === currentUser.withdrawalCountry
    ) || ALLOWED_COUNTRIES[0];
  }, [currentUser]);

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(detectedCountry.code);
  const currentCountry: AllowedCountry = useMemo(() => {
    return ALLOWED_COUNTRIES.find(c => c.code === selectedCountryCode) || detectedCountry;
  }, [selectedCountryCode, detectedCountry]);

  // Payment methods for selected country
  const availableMethods = useMemo(() => {
    return COUNTRY_PAYMENT_METHODS[currentCountry.code] || COUNTRY_PAYMENT_METHODS['CM'];
  }, [currentCountry.code]);

  // Selected payment method
  const [selectedMethodName, setSelectedMethodName] = useState<string>(
    availableMethods[0]?.name || 'MTN Mobile Money'
  );

  // Update selected method whenever country changes
  useEffect(() => {
    if (availableMethods.length > 0) {
      setSelectedMethodName(availableMethods[0].name);
    }
  }, [availableMethods]);

  // Amount state (Default to 15 000 CFA or 8 000 CFA)
  const [depAmount, setDepAmount] = useState<number>(15000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('15000');

  // Phone number state
  const initialPhone = useMemo(() => {
    if (!currentUser.phone) return '';
    let p = currentUser.phone.trim();
    if (p.startsWith(currentCountry.prefix)) {
      p = p.substring(currentCountry.prefix.length).trim();
    }
    return p;
  }, [currentUser.phone, currentCountry.prefix]);

  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhone);

  // Submission & Redirection state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedDeposit, setSubmittedDeposit] = useState<DepositRequest | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // User's own deposits
  const userDeposits = useMemo(() => {
    return (deposits || [])
      .filter(d => d.userId === currentUser.id || (currentUser.phone && d.userPhone === currentUser.phone))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [deposits, currentUser.id, currentUser.phone]);

  const handleSelectQuickAmount = (amount: number) => {
    setDepAmount(amount);
    setCustomAmountStr(amount.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmountStr(rawVal);
    setDepAmount(rawVal ? parseInt(rawVal, 10) : 0);
  };

  // Validation
  const validationError = useMemo(() => {
    if (!depAmount || depAmount < 1000) {
      return "Le montant minimum de recharge est de 1 000 CFA.";
    }
    if (!selectedMethodName) {
      return "Veuillez sélectionner un moyen de paiement.";
    }
    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanNum || cleanNum.length < 6) {
      return "Veuillez saisir un numéro de téléphone valide.";
    }
    return null;
  }, [depAmount, selectedMethodName, phoneNumber]);

  // Submit and open secure payment gateway
  const handleConfirmDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) {
      onShowToast('err', validationError);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const fullPhone = `${currentCountry.prefix} ${phoneNumber.trim()}`;
      
      const res = await initiateDepositCheckout({
        amount: depAmount,
        country: currentCountry.name,
        countryCode: currentCountry.code,
        method: selectedMethodName,
        phoneNumber: fullPhone
      });

      setIsSubmitting(false);

      if (res.success && res.deposit) {
        setSubmittedDeposit(res.deposit);
        const paymentUrl = EXACT_PAYMENT_URL;
        setRedirectPath(paymentUrl);
        setShowSuccessModal(true);
        onShowToast('success', "Dépôt enregistré avec le statut « En attente ». Redirection vers la page de paiement...");

        // Direct redirection to the exact payment URL (no iframe, no URL alteration)
        try {
          if (window.top && window.top !== window) {
            try {
              window.top.location.href = paymentUrl;
            } catch {
              window.open(paymentUrl, '_blank', 'noopener,noreferrer');
              window.location.href = paymentUrl;
            }
          } else {
            window.location.href = paymentUrl;
          }
        } catch (_) {
          window.location.href = paymentUrl;
        }
      } else {
        onShowToast('err', res.error || "Erreur lors de la création de la recharge.");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      onShowToast('err', err?.message || "Erreur réseau lors de l'enregistrement.");
    }
  };

  const handleOpenGatewayManually = () => {
    window.open(EXACT_PAYMENT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-[#0d0417] text-pink-50 min-h-screen pb-20 font-sans max-w-lg mx-auto select-none">
      
      {/* 1. EN-TÊTE FIXE */}
      <header className="bg-[#140624]/95 backdrop-blur-md border-b border-pink-500/20 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-lg">
        <button
          onClick={onBack}
          type="button"
          id="btn-back-deposit"
          className="flex items-center space-x-1.5 text-pink-300 hover:text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <h1 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
          <span>Recharge Sécurisée</span>
          <span className="text-sm">{currentCountry.flag}</span>
        </h1>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'form' ? 'history' : 'form')}
          className="flex items-center space-x-1 text-xs font-bold text-pink-200 hover:text-white bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 px-2.5 py-1 rounded-full cursor-pointer transition-all"
        >
          <Clock className="w-3.5 h-3.5 text-pink-400" />
          <span>{activeTab === 'form' ? 'Historique' : 'Formulaire'}</span>
        </button>
      </header>

      <div className="p-3.5 space-y-3.5">

        {/* 2. SOLDE ACTUEL AFFICHÉ EN HAUT */}
        <section className="bg-gradient-to-br from-[#2c0b48] via-[#1b072e] to-[#120420] rounded-2xl p-4 text-white shadow-xl border border-pink-500/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center border border-pink-500/30">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-pink-200 font-mono">
                Solde actuel
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              <span>Actif</span>
            </div>
          </div>

          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {(currentUser.balance || 0).toLocaleString('fr-FR')}
            </span>
            <span className="text-sm font-bold text-pink-400 font-mono">CFA</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-pink-500/20 flex items-center justify-between text-[11px] text-pink-200/80">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
              <span>Paiement crypté & instantané</span>
            </span>
            <span className="font-mono text-pink-300 font-bold">{currentCountry.name}</span>
          </div>
        </section>

        {activeTab === 'history' ? (
          /* SECTION HISTORIQUE DES DÉPÔTS */
          <section className="bg-[#1a082b] rounded-2xl p-4 border border-pink-500/25 shadow-xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-pink-400" />
                <span>Mes Recharges Récentes</span>
              </h2>
              <span className="text-[11px] font-bold text-pink-300 font-mono">
                {userDeposits.length} demande{userDeposits.length > 1 ? 's' : ''}
              </span>
            </div>

            {userDeposits.length === 0 ? (
              <div className="text-center py-8 text-pink-300/60 space-y-1">
                <Wallet className="w-8 h-8 mx-auto text-pink-400/40 stroke-1" />
                <p className="text-xs font-bold text-pink-200">Aucun dépôt enregistré</p>
                <p className="text-[11px]">Effectuez votre première recharge pour approvisionner votre compte.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {userDeposits.map((dep) => (
                  <div 
                    key={dep.id} 
                    className="p-3 bg-[#240c3c] rounded-xl border border-pink-500/25 flex items-center justify-between text-xs hover:border-pink-400/60 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-black text-white font-mono text-sm">
                        {(Number(dep.amount) || 0).toLocaleString('fr-FR')} CFA
                      </div>
                      <div className="text-[10px] text-pink-300/80 flex items-center space-x-1.5">
                        <span>{dep.method}</span>
                        <span>•</span>
                        <span>{new Date(dep.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-[10px] font-mono text-pink-400/80">
                        Réf: {dep.transactionId}
                      </div>
                    </div>

                    <div className="text-right">
                      {dep.status === 'approved' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Validé
                        </span>
                      ) : dep.status === 'rejected' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40">
                          Rejeté
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse">
                          En attente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          /* FORMULAIRE DE RECHARGE MODERNE */
          <form onSubmit={handleConfirmDeposit} className="space-y-3.5">
            
            {/* 3. SÉLECTION DU PAYS (5 PAYS COMPATIBLES) */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-2.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono block">
                1. Sélectionner votre pays
              </label>

              <div className="grid grid-cols-5 gap-1.5">
                {ALLOWED_COUNTRIES.map((c) => {
                  const isSelected = c.code === currentCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountryCode(c.code);
                        // Update default phone prefix if empty
                        if (!phoneNumber || phoneNumber.length < 3) {
                          setPhoneNumber('');
                        }
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                        isSelected
                          ? 'bg-gradient-to-br from-pink-600 to-purple-600 border-pink-400 ring-2 ring-pink-400/40 shadow-md text-white'
                          : 'bg-[#240c3c] border-pink-500/20 hover:bg-[#320f50] text-pink-200'
                      }`}
                    >
                      <span className="text-xl leading-none">{c.flag}</span>
                      <span className={`text-[10px] font-black truncate w-full ${isSelected ? 'text-white' : 'text-pink-200'}`}>
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. MONTANT À DÉPOSER (CFA) & BOUTONS DE MONTANTS RAPIDES */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono block">
                  2. Montant à déposer (CFA)
                </label>
                <span className="text-[10px] font-bold text-pink-300/80">Min. 1 000 CFA</span>
              </div>

              {/* Champ principal de saisie du montant */}
              <div className="relative flex items-center bg-[#250d3c] border-2 border-pink-500/30 rounded-xl px-3.5 py-2.5 focus-within:border-pink-400 transition-all">
                <input
                  type="text"
                  inputMode="numeric"
                  value={customAmountStr}
                  onChange={handleCustomAmountChange}
                  placeholder="ex: 15000"
                  id="input-deposit-amount"
                  className="w-full bg-transparent outline-none font-black text-white text-lg sm:text-xl font-mono placeholder:text-pink-300/40"
                  required
                />
                <span className="text-xs sm:text-sm font-black text-pink-400 font-mono ml-2 shrink-0">
                  CFA
                </span>
              </div>

              {/* Boutons de montants rapides */}
              <div>
                <span className="text-[9px] uppercase font-bold text-pink-300/80 tracking-wider block mb-1.5">
                  Montants rapides :
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((amt) => {
                    const isSelected = depAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectQuickAmount(amt)}
                        className={`py-2.5 px-2 rounded-xl text-center font-black text-xs font-mono transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-400 shadow-md ring-2 ring-pink-400/50 scale-[1.02]'
                            : 'bg-[#240c3c] text-pink-100 hover:bg-[#320f50] border-pink-500/25 active:scale-95'
                        }`}
                      >
                        {amt.toLocaleString('fr-FR')} CFA
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. SÉLECTION DU MOYEN DE PAIEMENT */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono block">
                  3. Moyen de paiement ({currentCountry.name})
                </label>
                <span className="text-[10px] font-bold text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                  Instant
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableMethods.map((method) => {
                  const isSelected = selectedMethodName === method.name;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethodName(method.name)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-900/50 to-purple-900/50 border-pink-400 ring-2 ring-pink-400/40 shadow-md'
                          : 'bg-[#240c3c] border-pink-500/20 hover:bg-[#320f50]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-pink-400 bg-pink-500' : 'border-pink-500/40 bg-[#19062b]'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-white block truncate">
                            {method.name}
                          </span>
                          <span className="text-[9px] text-pink-300/70 block font-mono">
                            {currentCountry.name}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border shrink-0 ${method.color}`}>
                        {method.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. CHAMP VOTRE NUMÉRO DE TÉLÉPHONE */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono block">
                4. Votre numéro de téléphone
              </label>

              <div className="flex items-center bg-[#250d3c] border-2 border-pink-500/30 rounded-xl px-3 py-2.5 focus-within:border-pink-400 transition-all">
                <div className="flex items-center space-x-1.5 mr-2.5 pr-2.5 border-r border-pink-500/30 shrink-0">
                  <span className="text-base leading-none">{currentCountry.flag}</span>
                  <span className="text-xs font-black font-mono text-pink-200">{currentCountry.prefix}</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="ex: 90 12 34 56"
                  id="input-deposit-phone"
                  className="w-full bg-transparent outline-none font-bold text-white text-xs sm:text-sm font-mono placeholder:text-pink-300/40"
                  required
                />
              </div>

              <p className="text-[10px] text-pink-300/70 leading-normal">
                Indiquez le numéro Mobile Money avec lequel vous effectuerez le paiement sécurisé.
              </p>
            </div>

            {/* MESSAGE D'ERREUR ÉVENTUEL */}
            {validationError && (
              <div className="bg-[#3c0d1d] border border-red-500/40 rounded-xl p-2.5 text-xs text-red-200 flex items-center space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-[11px] font-semibold">{validationError}</span>
              </div>
            )}

            {/* 7. BOUTON CONFIRMER LE DÉPÔT */}
            <button
              type="submit"
              disabled={Boolean(validationError) || isSubmitting}
              id="btn-confirm-deposit"
              className={`w-full py-4 px-5 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer border ${
                validationError || isSubmitting
                  ? 'bg-[#270b42] text-pink-400/40 cursor-not-allowed border-pink-500/20'
                  : 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-pink-400/40 shadow-pink-600/40 active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement du dépôt...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirmer le dépôt ({depAmount > 0 ? `${depAmount.toLocaleString('fr-FR')} CFA` : ''})</span>
                </>
              )}
            </button>

            {/* NOTE DE SÉCURITÉ */}
            <div className="bg-[#1a082b] border border-pink-500/20 rounded-xl p-3 text-[11px] text-pink-300/80 text-center flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
              <span>Votre dépôt sera enregistré au statut <strong>« En attente »</strong> et synchronisé avec le serveur central.</span>
            </div>
          </form>
        )}
      </div>

      {/* MODAL DE CONFIRMATION / REDIRECTION SÉCURISÉE */}
      {showSuccessModal && submittedDeposit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-[#1f0a33] to-[#120521] rounded-3xl max-w-xs sm:max-w-sm w-full p-5 space-y-4 shadow-2xl border border-pink-500/30 text-center text-pink-50">
            
            <div className="w-14 h-14 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30 mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white tracking-tight">
                Dépôt enregistré avec succès
              </h3>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-pink-500/20 text-pink-300 border border-pink-500/30 animate-pulse">
                Statut : En attente
              </div>
            </div>

            {/* Récapitulatif du dépôt */}
            <div className="bg-[#240c3c] border border-pink-500/25 rounded-2xl p-3.5 space-y-2 text-left text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-pink-500/20">
                <span className="text-pink-300 font-medium">Montant :</span>
                <span className="font-black font-mono text-white text-sm">
                  {(Number(submittedDeposit.amount) || 0).toLocaleString('fr-FR')} CFA
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-pink-500/20">
                <span className="text-pink-300 font-medium">Moyen :</span>
                <span className="font-bold text-white">{submittedDeposit.method}</span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-pink-500/20">
                <span className="text-pink-300 font-medium">Téléphone :</span>
                <span className="font-mono text-white font-bold">{submittedDeposit.userPhone}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-pink-300 font-medium">Réf. transaction :</span>
                <span className="font-mono font-bold text-pink-400">{submittedDeposit.transactionId}</span>
              </div>
            </div>

            <p className="text-[11px] text-pink-200/80 leading-relaxed">
              La page de paiement sécurisée s'est ouverte automatiquement. Si la redirection a été bloquée par votre navigateur, cliquez sur le bouton ci-dessous pour finaliser votre règlement :
            </p>

            <div className="space-y-2 pt-1">
              {/* Bouton direct vers le portail de paiement */}
              <a
                href={EXACT_PAYMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black rounded-xl text-xs shadow-lg shadow-pink-600/40 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 border border-pink-400/40 text-center"
              >
                <span>Accéder à la page de paiement</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('history');
                }}
                className="w-full py-2.5 px-4 bg-[#270b42] hover:bg-[#340f56] text-pink-200 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-pink-500/25"
              >
                Voir mes dépôts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
