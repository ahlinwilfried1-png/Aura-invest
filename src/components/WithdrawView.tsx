import React, { useState } from 'react';
import { ArrowLeft, CreditCard, History, X, PlusCircle, Edit3, ShieldCheck, LockKeyhole, Globe, Smartphone, Lock } from 'lucide-react';
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

  // Form states for account binding (Strictly Togo)
  const defaultCountryCode = 'TG';
  const [bindCountryCode, setBindCountryCode] = useState<string>('TG');
  
  const currentBindCountry = ALLOWED_COUNTRIES[0];
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

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.withdrawalAccountName && currentUser.withdrawalAccountNumber) {
      onShowToast('err', "Votre compte bancaire/retrait est verrouillé et ne peut pas être modifié.");
      setShowBindModal(false);
      return;
    }
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

    const res = await saveWithdrawalAccount(bindName, bindPhone, bindPin, bindNetwork, bindCountryCode);
    if (res && res.success) {
      onShowToast('success', "Compte de retrait enregistré avec succès !");
      setShowBindModal(false);
      setBindPin('');
    } else {
      onShowToast('err', res?.error || "Erreur lors de l'enregistrement du compte.");
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

    if (amountNum < 1500) {
      onShowToast('err', "Le montant minimum de retrait est de 1 500 FCFA.");
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

    if (currentUser.withdrawalPinHash) {
      const cleanEntered = wthPin.trim();
      let isPinValid = false;

      try {
        if (currentUser.withdrawalPinHash.startsWith('{') && currentUser.withdrawalPinHash.endsWith('}')) {
          const parsed = JSON.parse(currentUser.withdrawalPinHash);
          if (parsed.pin === cleanEntered) isPinValid = true;
        }
      } catch (_) {}

      if (!isPinValid) {
        try {
          const decoded = atob(currentUser.withdrawalPinHash);
          if (decoded.startsWith('{') && decoded.endsWith('}')) {
            const parsed = JSON.parse(decoded);
            if (parsed.pin === cleanEntered) isPinValid = true;
          } else if (decoded === cleanEntered + '_aura_sec_salt') {
            isPinValid = true;
          }
        } catch (_) {}
      }

      if (!isPinValid) {
        const legacyHash = btoa(cleanEntered + '_aura_sec_salt');
        if (currentUser.withdrawalPinHash === legacyHash || currentUser.withdrawalPinHash === cleanEntered) {
          isPinValid = true;
        }
      }

      if (!isPinValid) {
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

    // Check 2 withdrawals per day limit
    const todayIso = new Date().toISOString().split('T')[0];
    const todaysWithdrawalsCount = myWithdrawals.filter(w => w.createdAt.startsWith(todayIso)).length;
    if (todaysWithdrawalsCount >= 2) {
      onShowToast('err', "Vous avez déjà effectué 2 demandes de retrait aujourd'hui. Limité à 2 retraits par jour.");
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
    <div className="animate-fadeIn max-w-xl mx-auto space-y-4 pb-12 text-pink-50 font-sans">
      {/* 1. En-tête (Header) */}
      <div className="flex items-center justify-between py-2 px-1">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 text-pink-300 hover:text-white transition-transform active:scale-95 cursor-pointer"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h1 className="text-base sm:text-lg font-black text-white text-center tracking-tight">
          Retirer
        </h1>

        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          className="p-1.5 text-pink-300 hover:text-white cursor-pointer"
          aria-label="Historique"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Solde disponible & Section Compte de retrait */}
      <div className="bg-[#1a082b] rounded-2xl p-4 sm:p-5 shadow-xl border border-pink-500/25 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-pink-200">
            Solde disponible
          </span>
          <span className="text-base sm:text-lg font-black text-pink-400 font-mono">
            FCFA {currentUser.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
          </span>
        </div>

        {/* Carte VIP rose-violette de compte de retrait */}
        {isAccountLinked ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 p-4 text-white shadow-lg space-y-2 border border-pink-400/40">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-black/20 border border-white/20 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-white stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-1.5">
                    <span>{currentUser.withdrawalAccountName || currentUser.name}</span>
                    {currentUser.withdrawalCountry && (
                      <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded font-mono font-bold">
                        {ALLOWED_COUNTRIES.find(c => c.code === currentUser.withdrawalCountry)?.flag || '🇹🇬'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-mono font-bold text-pink-100 flex items-center gap-2">
                    <span>{currentUser.withdrawalAccountNumber || currentUser.phone}</span>
                    {currentUser.withdrawalNetwork && (
                      <span className="bg-black/30 text-white font-sans text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-white/20">
                        {currentUser.withdrawalNetwork}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onShowToast('err', "Votre compte bancaire/retrait est verrouillé définitivement. Modification impossible.");
                }}
                className="text-[10px] font-extrabold bg-black/25 text-white px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer hover:bg-black/30 transition-colors border border-white/20"
                title="Compte lié verrouillé"
              >
                <Lock className="w-3 h-3 text-pink-200" />
                <span>Verrouillé</span>
              </button>
            </div>

            <div className="text-[11px] font-semibold text-pink-100/90 tracking-wide pt-1 flex items-center justify-between">
              <span>Compte de retrait actif</span>
              {currentUser.withdrawalNetwork && (
                <span className="font-extrabold">{currentUser.withdrawalNetwork}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-pink-500/40 bg-pink-950/20 p-4 text-center space-y-2">
            <p className="text-xs font-bold text-pink-200">
              Aucun compte de retrait lié
            </p>
            <p className="text-[11px] text-pink-300/80">
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
              className="mt-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md transition-all inline-flex items-center space-x-1.5 cursor-pointer border border-pink-400/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ajouter un compte</span>
            </button>
          </div>
        )}

        <div className="text-center pt-1">
          <span className="text-xs font-semibold text-pink-300/80 block">
            Montant minimum de retrait : <strong className="text-pink-400 font-bold">1 500 FCFA</strong> (Frais : 15%)
          </span>
        </div>
      </div>

      {/* 3. Demande de retrait */}
      <div className="space-y-2.5 pt-1">
        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center justify-between">
          <span>Demande de retrait</span>
          {isAccountLinked && (
            <span className="text-[10px] bg-pink-500/20 text-pink-300 font-extrabold px-2 py-0.5 rounded-full font-mono border border-pink-500/30">
              Compte récepteur lié
            </span>
          )}
        </h2>

        <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
          {/* Champ de saisie avec FCFA à gauche */}
          <div className="bg-[#1a082b] rounded-2xl p-3 sm:p-3.5 flex items-center space-x-3 shadow-xl border border-pink-500/25 focus-within:border-pink-400 transition-colors">
            <span className="text-pink-300 font-black text-sm sm:text-base pr-3 border-r border-pink-500/25 select-none">
              FCFA
            </span>
            <input
              type="number"
              min={1500}
              max={currentUser.balance}
              value={wthAmount}
              onChange={(e) => setWthAmount(e.target.value)}
              placeholder="Entrez le montant du retrait"
              className="w-full text-white font-bold text-xs sm:text-sm outline-none bg-transparent placeholder:text-pink-300/40 placeholder:font-normal font-mono"
            />
          </div>

          {/* Champ Code PIN Obligatoire */}
          <div className="bg-[#1a082b] rounded-2xl p-3 sm:p-3.5 flex items-center space-x-3 shadow-xl border border-pink-500/25 focus-within:border-pink-400 transition-colors">
            <div className="flex items-center space-x-1.5 text-pink-300 font-black text-xs sm:text-sm pr-3 border-r border-pink-500/25 select-none shrink-0">
              <LockKeyhole className="w-4 h-4 text-pink-400 stroke-[2.2]" />
              <span>PIN</span>
            </div>
            <input
              type="password"
              required
              maxLength={6}
              value={wthPin}
              onChange={(e) => setWthPin(e.target.value)}
              placeholder="Code PIN de retrait obligatoire (ex: 1234)"
              className="w-full text-white font-mono font-bold text-xs sm:text-sm outline-none bg-transparent placeholder:text-pink-300/40 placeholder:font-sans placeholder:font-normal"
            />
          </div>

          {/* Grand bouton rose/violet Retrait */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base rounded-full shadow-lg shadow-pink-600/40 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2 border border-pink-400/40"
          >
            <LockKeyhole className="w-4 h-4 stroke-[2.5]" />
            <span>Valider le Retrait</span>
          </button>
        </form>
      </div>

      {/* 4. Règles de retrait */}
      <div className="bg-[#1a082b] rounded-2xl p-4 sm:p-5 shadow-xl border border-pink-500/25 space-y-3.5 text-xs sm:text-sm text-pink-200/90 leading-relaxed font-sans">
        <p className="font-medium text-pink-200">
          <strong className="font-extrabold text-white">Règles de retrait :</strong> Le montant minimum de retrait est de 1 500 FCFA, limité à 2 retraits par jour.
        </p>

        <p className="font-medium text-pink-200">
          <strong className="font-extrabold text-white">Heures de traitement des retraits :</strong> De 08h00 à 17h00
        </p>

        <p className="font-medium text-pink-300/80">
          Afin de garantir un traitement efficace de vos transactions, le montant minimum de retrait est fixé à 1 500 FCFA.
        </p>

        <p className="font-medium text-pink-300/80">
          Nous nous engageons à vous offrir une expérience de retrait rapide et sécurisée.
        </p>
      </div>

      {/* MODAL: LIAISON DU COMPTE DE RETRAIT */}
      {showBindModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-[#1f0a33] to-[#120521] rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 relative shadow-2xl border border-pink-500/30 text-pink-50">
            <div className="flex items-center justify-between border-b border-pink-500/25 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold text-white">
                  Compte de retrait
                </h3>
              </div>
              <button
                onClick={() => setShowBindModal(false)}
                className="p-1 rounded-full bg-pink-500/20 text-pink-300 hover:text-white cursor-pointer border border-pink-500/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3.5 text-xs sm:text-sm">
              {/* Pays (Exclusif Togo) */}
              <div>
                <label className="block text-xs font-bold text-pink-200 mb-1">
                  Pays de votre compte Mobile Money
                </label>
                <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-[#240c3c] border border-pink-500/30 text-white font-bold text-xs">
                  <span className="text-base">🇹🇬</span>
                  <span>Togo (+228)</span>
                </div>
              </div>

              {/* Choix du réseau Mobile Money pour ce pays */}
              <div>
                <label className="block text-xs font-bold text-pink-200 mb-1">
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
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-400 shadow-md'
                            : 'bg-[#240c3c] border-pink-500/20 text-pink-200 hover:bg-[#320f50]'
                        }`}
                      >
                        {net}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-pink-200 mb-1">
                  Nom complet (Titulaire du compte)
                </label>
                <input
                  type="text"
                  value={bindName}
                  onChange={(e) => setBindName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="w-full bg-[#250d3c] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none focus:border-pink-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-pink-200 mb-1">
                  Numéro de retrait Mobile Money ({bindNetwork})
                </label>
                <div className="flex items-center bg-[#250d3c] border border-pink-500/30 rounded-xl px-3.5 py-2 focus-within:border-pink-400">
                  <span className="text-xs font-bold font-mono text-pink-400 mr-2 shrink-0">{currentBindCountry.prefix}</span>
                  <input
                    type="tel"
                    value={bindPhone}
                    onChange={(e) => setBindPhone(e.target.value)}
                    placeholder="Ex: 0701020304"
                    className="w-full bg-transparent text-white font-mono font-bold outline-none text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-pink-200 mb-1 flex items-center justify-between">
                  <span>Code PIN de sécurité</span>
                  <span className="text-[10px] text-pink-300 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-pink-400" /> Chiffré & Masqué
                  </span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={bindPin}
                  onChange={(e) => setBindPin(e.target.value)}
                  placeholder="**** (Ex: 1234)"
                  className="w-full bg-[#250d3c] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold outline-none focus:border-pink-400"
                  required
                />
              </div>

              <div className="bg-[#240c3c] border border-pink-500/25 rounded-xl p-2.5 text-[11px] text-pink-300 leading-snug">
                <LockKeyhole className="w-3.5 h-3.5 text-pink-400 inline-block mr-1 -mt-0.5" />
                Votre code PIN est crypté et sécurisé. Il ne sera jamais affiché à l'écran.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 text-white font-extrabold text-sm rounded-full shadow-lg shadow-pink-600/40 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer border border-pink-400/40"
              >
                Valider
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIQUE DES RETRAITS */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-[#1f0a33] to-[#120521] rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col relative shadow-2xl border border-pink-500/30 overflow-hidden text-pink-50">
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
