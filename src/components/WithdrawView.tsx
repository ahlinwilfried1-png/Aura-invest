import React, { useState } from 'react';
import { ArrowLeft, CreditCard, History, X, PlusCircle, Edit3, ShieldCheck, LockKeyhole, Globe, Smartphone } from 'lucide-react';
import { User, WithdrawalRequest } from '../types';
import { useApp } from '../context/AppContext';
import { WithdrawalHistoryView } from './WithdrawalHistoryView';
import { ALLOWED_COUNTRIES } from '../constants/countries';

interface WithdrawViewProps {
  currentUser: User;
  withdrawals: WithdrawalRequest[];
  onRequestWithdrawal: (amount: number, network: any, accountNumber: string) => { success: boolean; error?: string };
  onBack: () => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
  onOpenLinkCard?: () => void;
}

export const WithdrawView: React.FC<WithdrawViewProps> = ({
  currentUser,
  withdrawals,
  onRequestWithdrawal,
  onBack,
  onShowToast,
  onOpenLinkCard
}) => {
  const { saveWithdrawalAccount } = useApp();

  const [wthAmount, setWthAmount] = useState<string>('');
  const [wthPin, setWthPin] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showBindModal, setShowBindModal] = useState<boolean>(false);

  // Form states for account binding
  const defaultCountryCode = currentUser.withdrawalCountry || 'CI';
  const [bindCountryCode, setBindCountryCode] = useState<string>(defaultCountryCode);
  
  const currentBindCountry = ALLOWED_COUNTRIES.find(c => c.code === bindCountryCode) || ALLOWED_COUNTRIES[0];
  const [bindNetwork, setBindNetwork] = useState<string>(
    currentUser.withdrawalNetwork || currentBindCountry.networks[0]
  );
  
  const [bindName, setBindName] = useState<string>(currentUser.withdrawalAccountName || currentUser.name || '');
  const [bindPhone, setBindPhone] = useState<string>(currentUser.withdrawalAccountNumber || currentUser.phone || '');
  const [bindPin, setBindPin] = useState<string>('');

  // User withdrawals history
  const myWithdrawals = withdrawals.filter(w => w.userId === currentUser.id);

  const handleCountrySelect = (code: string) => {
    setBindCountryCode(code);
    const country = ALLOWED_COUNTRIES.find(c => c.code === code);
    if (country && country.networks.length > 0) {
      setBindNetwork(country.networks[0]);
    }
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bindName.trim()) {
      onShowToast('err', "Veuillez entrer votre nom complet.");
      return;
    }
    if (!bindPhone.trim()) {
      onShowToast('err', "Veuillez entrer le numéro de compte de retrait.");
      return;
    }
    if (!bindPin.trim() || bindPin.length < 4) {
      onShowToast('err', "Le code PIN doit comporter au moins 4 chiffres.");
      return;
    }

    const res = saveWithdrawalAccount(bindName, bindPhone, bindPin, bindNetwork, bindCountryCode);
    if (res.success) {
      onShowToast('success', "Compte de retrait enregistré avec succès !");
      setShowBindModal(false);
      setBindPin('');
    } else {
      onShowToast('err', res.error || "Erreur lors de l'enregistrement du compte.");
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Verify account is linked
    const targetAccountNum = currentUser.withdrawalAccountNumber || currentUser.phone;
    if (!currentUser.withdrawalAccountNumber && !currentUser.withdrawalAccountName) {
      onShowToast('err', "Veuillez d'abord enregistrer un compte de retrait.");
      if (onOpenLinkCard) {
        onOpenLinkCard();
      } else {
        setShowBindModal(true);
      }
      return;
    }

    const amountNum = Number(wthAmount);

    if (!wthAmount || isNaN(amountNum)) {
      onShowToast('err', "Veuillez entrer un montant de retrait valide.");
      return;
    }

    if (amountNum < 1000) {
      onShowToast('err', "Le montant minimum de retrait est de 1 000 XAF.");
      return;
    }

    if (amountNum > currentUser.balance) {
      onShowToast('err', "Solde insuffisant pour effectuer ce retrait.");
      return;
    }

    // 2. VERIFICATION DU CODE PIN OBLIGATOIRE
    if (!wthPin || !wthPin.trim()) {
      onShowToast('err', "Le code PIN est obligatoire pour valider votre demande de retrait.");
      return;
    }

    const enteredPinHash = btoa(wthPin.trim() + '_aura_sec_salt');
    if (currentUser.withdrawalPinHash) {
      if (enteredPinHash !== currentUser.withdrawalPinHash) {
        onShowToast('err', "Code PIN incorrect. Veuillez vérifier votre code PIN secret de retrait.");
        return;
      }
    } else {
      // Si aucun code PIN n'a été pré-enregistré, vérifier qu'il fait au moins 4 chiffres et le sauvegarder
      if (wthPin.trim().length < 4) {
        onShowToast('err', "Le code PIN doit comporter au moins 4 chiffres.");
        return;
      }
      saveWithdrawalAccount(
        currentUser.withdrawalAccountName || currentUser.name,
        currentUser.withdrawalAccountNumber || currentUser.phone,
        wthPin.trim(),
        currentUser.withdrawalNetwork,
        currentUser.withdrawalCountry
      );
    }

    // Check 1 withdrawal per day limit
    const todayIso = new Date().toISOString().split('T')[0];
    const hasWithdrawnToday = myWithdrawals.some(w => w.createdAt.startsWith(todayIso));
    if (hasWithdrawnToday) {
      onShowToast('err', "Vous avez déjà effectué une demande de retrait aujourd'hui. Limité à 1 retrait par jour.");
      return;
    }

    const targetNetwork = currentUser.withdrawalNetwork || bindNetwork || 'Mobile Money';
    const res = onRequestWithdrawal(amountNum, targetNetwork, targetAccountNum);

    if (res.success) {
      onShowToast('success', "Demande de retrait transmise avec succès !");
      setWthAmount('');
      setWthPin('');
    } else {
      onShowToast('err', res.error || "Une erreur est survenue lors de la demande de retrait.");
    }
  };

  const isAccountLinked = Boolean(currentUser.withdrawalAccountNumber || currentUser.withdrawalAccountName);

  return (
    <div className="animate-fadeIn max-w-xl mx-auto space-y-4 pb-4 text-slate-900 font-sans">
      {/* 1. En-tête (Header) */}
      <div className="flex items-center justify-between py-2 px-1">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 text-slate-800 hover:text-black transition-transform active:scale-95 cursor-pointer"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h1 className="text-base sm:text-lg font-bold text-slate-900 text-center tracking-tight">
          Retirer
        </h1>

        <div className="w-9" />
      </div>

      {/* 2. Solde disponible & Section Compte de retrait */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100/80 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            Solde disponible
          </span>
          <span className="text-base sm:text-lg font-black text-red-600 font-sans">
            XAF {currentUser.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
          </span>
        </div>

        {/* Carte jaune/orange de compte de retrait */}
        {isAccountLinked ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFD034] via-[#FFB823] to-[#FFA012] p-4 text-slate-950 shadow-xs space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-950/10 border border-amber-950/20 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-slate-950 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-1.5">
                    <span>{currentUser.withdrawalAccountName || currentUser.name}</span>
                    {currentUser.withdrawalCountry && (
                      <span className="text-xs bg-amber-950/15 px-1.5 py-0.5 rounded font-mono font-bold">
                        {ALLOWED_COUNTRIES.find(c => c.code === currentUser.withdrawalCountry)?.flag || '🇨🇮'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 flex items-center gap-2">
                    <span>{currentUser.withdrawalAccountNumber || currentUser.phone}</span>
                    {currentUser.withdrawalNetwork && (
                      <span className="bg-amber-950 text-amber-300 font-sans text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                        {currentUser.withdrawalNetwork}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onOpenLinkCard) {
                    onOpenLinkCard();
                  } else {
                    setBindName(currentUser.withdrawalAccountName || currentUser.name || '');
                    setBindPhone(currentUser.withdrawalAccountNumber || currentUser.phone || '');
                    if (currentUser.withdrawalCountry) setBindCountryCode(currentUser.withdrawalCountry);
                    if (currentUser.withdrawalNetwork) setBindNetwork(currentUser.withdrawalNetwork);
                    setShowBindModal(true);
                  }
                }}
                className="text-[10px] font-bold bg-amber-950/10 hover:bg-amber-950/20 text-slate-950 px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modifier</span>
              </button>
            </div>

            <div className="text-[11px] font-semibold text-amber-950/80 tracking-wide pt-1 flex items-center justify-between">
              <span>Compte de retrait actif</span>
              {currentUser.withdrawalNetwork && (
                <span className="font-extrabold">{currentUser.withdrawalNetwork}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-4 text-center space-y-2">
            <p className="text-xs font-bold text-amber-900">
              Aucun compte de retrait lié
            </p>
            <p className="text-[11px] text-amber-800">
              Enregistrez vos coordonnées pour recevoir vos gains directement.
            </p>
            <button
              onClick={() => {
                if (onOpenLinkCard) {
                  onOpenLinkCard();
                } else {
                  setShowBindModal(true);
                }
              }}
              className="mt-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-xl shadow-xs transition-all inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ajouter un compte</span>
            </button>
          </div>
        )}

        <div className="text-center pt-1">
          <span className="text-xs font-semibold text-slate-600">
            Montant minimum de retrait: <strong className="text-amber-700 font-black">1,000XAF</strong>
          </span>
        </div>
      </div>

      {/* 3. Demande de retrait */}
      <div className="space-y-2.5 pt-1">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center justify-between">
          <span>Demande de retrait</span>
          {isAccountLinked && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full font-mono">
              Compte récepteur lié
            </span>
          )}
        </h2>

        {/* Informative destination badge if account is linked */}
        {isAccountLinked && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-800 shadow-2xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-amber-900 font-bold uppercase font-mono block">
                  Compte de destination
                </span>
                <span className="font-extrabold text-slate-900 text-xs truncate block">
                  {currentUser.withdrawalNetwork || 'Mobile Money / Carte'} • {currentUser.withdrawalAccountNumber} ({currentUser.withdrawalAccountName})
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
          {/* Champ de saisie avec XAF à gauche */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 flex items-center space-x-3 shadow-xs border border-slate-200/90 focus-within:border-amber-500 transition-colors">
            <span className="text-slate-900 font-black text-sm sm:text-base pr-3 border-r border-slate-200 select-none">
              XAF
            </span>
            <input
              type="number"
              min={1000}
              max={currentUser.balance}
              value={wthAmount}
              onChange={(e) => setWthAmount(e.target.value)}
              placeholder="Entrez le montant du retrait"
              className="w-full text-slate-900 font-bold text-xs sm:text-sm outline-none bg-transparent placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* Champ Code PIN Obligatoire (masqué / jamais en clair) */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 flex items-center space-x-3 shadow-xs border border-slate-200/90 focus-within:border-amber-500 transition-colors">
            <div className="flex items-center space-x-1.5 text-slate-900 font-black text-xs sm:text-sm pr-3 border-r border-slate-200 select-none shrink-0">
              <LockKeyhole className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
              <span>PIN</span>
            </div>
            <input
              type="password"
              required
              maxLength={6}
              value={wthPin}
              onChange={(e) => setWthPin(e.target.value)}
              placeholder="Code PIN de retrait obligatoire (ex: 1234)"
              className="w-full text-slate-900 font-mono font-bold text-xs sm:text-sm outline-none bg-transparent placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal"
            />
          </div>

          {/* Grand bouton orange/jaune Retrait */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#FFC233] via-[#FFAF1A] to-[#FF9914] text-slate-950 font-extrabold text-sm sm:text-base rounded-full shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <LockKeyhole className="w-4 h-4 stroke-[2.5]" />
            <span>Valider le Retrait</span>
          </button>
        </form>
      </div>

      {/* 4. Règles de retrait */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100/80 space-y-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
        <p className="font-medium text-slate-800">
          <strong className="font-extrabold text-slate-900">Règles de retrait :</strong> Le montant minimum de retrait est de 1 000 XAF, limité à un retrait par jour.
        </p>

        <p className="font-medium text-slate-800">
          <strong className="font-extrabold text-slate-900">Heures de traitement des retraits :</strong> De 08h00 à 17h00
        </p>

        <p className="font-medium text-slate-700">
          Afin de garantir un traitement efficace de vos transactions, le montant minimum de retrait est fixé à 1 000 XAF.
        </p>

        <p className="font-medium text-slate-700">
          Nous nous engageons à vous offrir une expérience de retrait rapide et sécurisée.
        </p>
      </div>

      {/* MODAL: LIAISON DU COMPTE DE RETRAIT */}
      {showBindModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 relative shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Compte de retrait
                </h3>
              </div>
              <button
                onClick={() => setShowBindModal(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3.5 text-xs sm:text-sm">
              {/* Choix du pays */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pays de votre compte Mobile Money
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {ALLOWED_COUNTRIES.map((c) => {
                    const isSel = bindCountryCode === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCountrySelect(c.code)}
                        className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSel
                            ? 'bg-amber-100 border-amber-500 text-slate-950 font-black'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Moyen de réseau ({currentBindCountry.name})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {currentBindCountry.networks.map((net) => {
                    const isSel = bindNetwork === net;
                    return (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setBindNetwork(net)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          isSel
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom complet (Titulaire du compte)
                </label>
                <input
                  type="text"
                  value={bindName}
                  onChange={(e) => setBindName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de retrait Mobile Money ({bindNetwork})
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus-within:border-amber-500">
                  <span className="text-xs font-bold font-mono text-amber-600 mr-2 shrink-0">{currentBindCountry.prefix}</span>
                  <input
                    type="tel"
                    value={bindPhone}
                    onChange={(e) => setBindPhone(e.target.value)}
                    placeholder="Ex: 0701020304"
                    className="w-full bg-transparent text-slate-900 font-mono font-bold outline-none text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Code PIN de sécurité</span>
                  <span className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Chiffré & Masqué
                  </span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={bindPin}
                  onChange={(e) => setBindPin(e.target.value)}
                  placeholder="**** (Ex: 1234)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-900 leading-snug">
                <LockKeyhole className="w-3.5 h-3.5 text-amber-700 inline-block mr-1 -mt-0.5" />
                Votre code PIN est crypté et sécurisé. Il ne sera jamais affiché à l'écran.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#FFC233] to-[#FF9914] text-slate-950 font-extrabold text-sm rounded-full shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
              >
                Valider
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIQUE DES RETRAITS */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col relative shadow-xl overflow-hidden">
            <WithdrawalHistoryView
              withdrawals={withdrawals}
              currentUser={currentUser}
              onBack={() => setShowHistoryModal(false)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
