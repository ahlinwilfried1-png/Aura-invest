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
        const redUrl = res.redirectUrl || `/api/pay-redirect/${res.deposit.id}`;
        setRedirectPath(redUrl);
        setShowSuccessModal(true);
        onShowToast('success', "Dépôt enregistré avec succès. Redirection vers la passerelle sécurisée...");

        // Automatically open the payment page via server redirect
        try {
          const win = window.open(redUrl, '_blank');
          if (!win || win.closed || typeof win.closed === 'undefined') {
            // Popup was blocked by browser; user will click the explicit button on the success modal
            console.log('[Popup Notice]: Browser blocked automated popup. Fallback button available.');
          }
        } catch (_) {
          // Iframe or sandboxed environment fallback
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
    if (redirectPath) {
      window.open(redirectPath, '_blank');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16 font-sans max-w-lg mx-auto select-none">
      
      {/* 1. EN-TÊTE FIXE */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-2xs">
        <button
          onClick={onBack}
          type="button"
          id="btn-back-deposit"
          className="flex items-center space-x-1.5 text-slate-800 hover:text-slate-950 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
          <span>Recharge Sécurisée</span>
          <span className="text-sm">{currentCountry.flag}</span>
        </h1>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'form' ? 'history' : 'form')}
          className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full cursor-pointer transition-all"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{activeTab === 'form' ? 'Historique' : 'Formulaire'}</span>
        </button>
      </header>

      <div className="p-3.5 space-y-3.5">

        {/* 2. SOLDE ACTUEL AFFICHÉ EN HAUT */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-4 text-white shadow-md border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 font-mono">
                Solde actuel
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Actif</span>
            </div>
          </div>

          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {(currentUser.balance || 0).toLocaleString('fr-FR')}
            </span>
            <span className="text-sm font-bold text-amber-400 font-mono">CFA</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Paiement crypté & instantané</span>
            </span>
            <span className="font-mono text-slate-300 font-bold">{currentCountry.name}</span>
          </div>
        </section>

        {activeTab === 'history' ? (
          /* SECTION HISTORIQUE DES DÉPÔTS */
          <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Mes Recharges Récentes</span>
              </h2>
              <span className="text-[11px] font-bold text-slate-500 font-mono">
                {userDeposits.length} demande{userDeposits.length > 1 ? 's' : ''}
              </span>
            </div>

            {userDeposits.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <Wallet className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-bold text-slate-600">Aucun dépôt enregistré</p>
                <p className="text-[11px]">Effectuez votre première recharge pour approvisionner votre compte.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {userDeposits.map((dep) => (
                  <div 
                    key={dep.id} 
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-black text-slate-900 font-mono text-sm">
                        {(Number(dep.amount) || 0).toLocaleString('fr-FR')} CFA
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center space-x-1.5">
                        <span>{dep.method}</span>
                        <span>•</span>
                        <span>{new Date(dep.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Réf: {dep.transactionId}
                      </div>
                    </div>

                    <div className="text-right">
                      {dep.status === 'approved' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Validé
                        </span>
                      ) : dep.status === 'rejected' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300">
                          Rejeté
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
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
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-mono block">
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
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                          : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xl leading-none">{c.flag}</span>
                      <span className={`text-[10px] font-black truncate w-full ${isSelected ? 'text-amber-900' : 'text-slate-600'}`}>
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. MONTANT À DÉPOSER (CFA) & BOUTONS DE MONTANTS RAPIDES */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-mono block">
                  2. Montant à déposer (CFA)
                </label>
                <span className="text-[10px] font-bold text-slate-400">Min. 1 000 CFA</span>
              </div>

              {/* Champ principal de saisie du montant */}
              <div className="relative flex items-center bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-amber-500 focus-within:bg-white transition-all">
                <input
                  type="text"
                  inputMode="numeric"
                  value={customAmountStr}
                  onChange={handleCustomAmountChange}
                  placeholder="ex: 15000"
                  id="input-deposit-amount"
                  className="w-full bg-transparent outline-none font-black text-slate-900 text-lg sm:text-xl font-mono"
                  required
                />
                <span className="text-xs sm:text-sm font-black text-amber-600 font-mono ml-2 shrink-0">
                  CFA
                </span>
              </div>

              {/* Boutons de montants rapides (exacts demandés : 3000, 8000, 15000, 25000, 70000, 100000) */}
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
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
                            ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs ring-2 ring-amber-400/50 scale-[1.02]'
                            : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200/90 active:scale-95'
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
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-mono block">
                  3. Moyen de paiement ({currentCountry.name})
                </label>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
                          ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                          : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-amber-600 bg-amber-500' : 'border-slate-400 bg-white'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 block truncate">
                            {method.name}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-mono">
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
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-mono block">
                4. Votre numéro de téléphone
              </label>

              <div className="flex items-center bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-amber-500 focus-within:bg-white transition-all">
                <div className="flex items-center space-x-1.5 mr-2.5 pr-2.5 border-r border-slate-300 shrink-0">
                  <span className="text-base leading-none">{currentCountry.flag}</span>
                  <span className="text-xs font-black font-mono text-slate-800">{currentCountry.prefix}</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="ex: 90 12 34 56"
                  id="input-deposit-phone"
                  className="w-full bg-transparent outline-none font-bold text-slate-900 text-xs sm:text-sm font-mono"
                  required
                />
              </div>

              <p className="text-[10px] text-slate-500 leading-normal">
                Indiquez le numéro Mobile Money avec lequel vous effectuerez le paiement sécurisé.
              </p>
            </div>

            {/* MESSAGE D'ERREUR ÉVENTUEL */}
            {validationError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-center space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-semibold">{validationError}</span>
              </div>
            )}

            {/* 7. BOUTON CONFIRMER LE DÉPÔT */}
            <button
              type="submit"
              disabled={Boolean(validationError) || isSubmitting}
              id="btn-confirm-deposit"
              className={`w-full py-4 px-5 font-black text-sm uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                validationError || isSubmitting
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/25 active:scale-[0.99]'
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
            <div className="bg-slate-100/80 rounded-xl p-3 text-[11px] text-slate-500 text-center flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Votre dépôt sera enregistré au statut <strong>« En attente »</strong> et synchronisé avec le serveur central.</span>
            </div>
          </form>
        )}
      </div>

      {/* MODAL DE CONFIRMATION / REDIRECTION SÉCURISÉE */}
      {showSuccessModal && submittedDeposit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xs sm:max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Dépôt enregistré avec succès
              </h3>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                Statut : En attente
              </div>
            </div>

            {/* Récapitulatif du dépôt */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2 text-left text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Montant :</span>
                <span className="font-black font-mono text-slate-900 text-sm">
                  {(Number(submittedDeposit.amount) || 0).toLocaleString('fr-FR')} CFA
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Moyen :</span>
                <span className="font-bold text-slate-800">{submittedDeposit.method}</span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Téléphone :</span>
                <span className="font-mono text-slate-800 font-bold">{submittedDeposit.userPhone}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 font-medium">Réf. transaction :</span>
                <span className="font-mono font-bold text-amber-700">{submittedDeposit.transactionId}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              La page de paiement sécurisée s'est ouverte automatiquement. Si la redirection a été bloquée par votre navigateur, cliquez sur le bouton ci-dessous pour finaliser votre règlement :
            </p>

            <div className="space-y-2 pt-1">
              {/* Bouton sécurisé vers le portail (utilise le point de terminaison du backend) */}
              <button
                type="button"
                onClick={handleOpenGatewayManually}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <span>Accéder à la page de paiement sécurisée</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('history');
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
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
