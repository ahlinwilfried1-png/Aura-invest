import React, { useState } from 'react';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, LockKeyhole, Building, Globe, UserCheck, Lock, AlertTriangle, KeyRound } from 'lucide-react';
import { User } from '../types';
import { useApp } from '../context/AppContext';
import { ALLOWED_COUNTRIES } from '../constants/countries';

interface LinkBankCardViewProps {
  currentUser: User;
  onBack: () => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
}

export const LinkBankCardView: React.FC<LinkBankCardViewProps> = ({
  currentUser,
  onBack,
  onShowToast
}) => {
  const { saveWithdrawalAccount } = useApp();

  const isAlreadyBound = Boolean(currentUser.withdrawalAccountName && currentUser.withdrawalAccountNumber);

  const defaultCountryCode = currentUser.withdrawalCountry || 'CI';
  const [countryCode, setCountryCode] = useState<string>(defaultCountryCode);
  
  const currentCountry = ALLOWED_COUNTRIES.find(c => c.code === countryCode) || ALLOWED_COUNTRIES[0];
  
  // Networks & Card options
  const PAYMENT_NETWORKS = [
    'Carte Visa / Mastercard',
    'Virement Bancaire (RIB)',
    ...currentCountry.networks
  ];

  const [network, setNetwork] = useState<string>(
    currentUser.withdrawalNetwork || PAYMENT_NETWORKS[0]
  );
  
  const [accountName, setAccountName] = useState<string>(
    currentUser.withdrawalAccountName || currentUser.name || ''
  );
  const [accountNumber, setAccountNumber] = useState<string>(
    currentUser.withdrawalAccountNumber || currentUser.phone || ''
  );
  const [pinCode, setPinCode] = useState<string>('');

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCountryChange = (code: string) => {
    if (isAlreadyBound) return;
    setCountryCode(code);
    const selectedC = ALLOWED_COUNTRIES.find(c => c.code === code);
    if (selectedC && selectedC.networks.length > 0) {
      setNetwork(selectedC.networks[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAlreadyBound) {
      onShowToast('err', "Votre compte bancaire/retrait est déjà lié et verrouillé définitivement. Modification impossible.");
      return;
    }

    if (!accountName.trim()) {
      onShowToast('err', "Veuillez entrer le nom complet du titulaire de la carte/compte.");
      return;
    }

    if (!accountNumber.trim()) {
      onShowToast('err', "Veuillez entrer le numéro de compte ou de carte bancaire.");
      return;
    }

    if (!pinCode.trim() || pinCode.length < 4) {
      onShowToast('err', "Veuillez saisir un code PIN de sécurité de 4 à 6 chiffres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveWithdrawalAccount(
        accountName.trim(),
        accountNumber.trim(),
        pinCode.trim(),
        network,
        countryCode
      );

      if (res && res.success) {
        setIsSaved(true);
        onShowToast('success', "Compte bancaire enregistré avec succès !");
        setPinCode('');
      } else {
        onShowToast('err', res?.error || "Erreur lors de l'enregistrement de la carte sur le serveur central.");
      }
    } catch (err: any) {
      onShowToast('err', err?.message || "Erreur réseau lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-xl mx-auto space-y-6 pb-24 text-slate-900 font-sans">
      {/* 1. Header */}
      <div className="flex items-center justify-between py-2 px-1 border-b border-slate-200/50 pb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-800 hover:text-amber-600 transition-transform active:scale-95 cursor-pointer flex items-center space-x-1"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          <span className="text-xs font-bold hidden sm:inline">Retour</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {isAlreadyBound ? 'Carte / Compte Lié & Verrouillé' : 'Lier une carte bancaire'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isAlreadyBound ? 'Compte de retrait scellé et sécurisé' : 'Coordonnées financières et compte de retrait'}
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* 2. IF ALREADY BOUND: SHOW LOCKED CARD & EXPLANATION */}
      {isAlreadyBound ? (
        <div className="space-y-5">
          {/* Locked Badge Banner */}
          <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 flex items-start space-x-3 text-amber-950 shadow-xs">
            <Lock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
                <span>COMPTE RETRAIT DÉFINITIVEMENT LIÉ</span>
                <span className="bg-amber-600 text-white text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">LOCKED</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Pour des raisons strictes de sécurité anti-fraude et de protection bancaire, les coordonnées d'un compte lié ne peuvent plus être modifiées par l'utilisateur.
              </p>
            </div>
          </div>

          {/* Bound Card Details Display */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <CreditCard className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                    Moyen de retrait lié
                  </div>
                  <div className="text-base font-black text-white">
                    {currentUser.withdrawalNetwork || 'Mobile Money / Banque'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Actif</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Titulaire du compte
                </span>
                <span className="text-sm font-extrabold text-white block">
                  {currentUser.withdrawalAccountName}
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Numéro de compte / carte
                </span>
                <span className="text-sm font-extrabold text-amber-300 font-mono block">
                  {currentUser.withdrawalAccountNumber}
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Pays
                </span>
                <span className="text-sm font-bold text-white block">
                  {ALLOWED_COUNTRIES.find(c => c.code === currentUser.withdrawalCountry)?.flag || '🇨🇮'}{' '}
                  {ALLOWED_COUNTRIES.find(c => c.code === currentUser.withdrawalCountry)?.name || currentUser.withdrawalCountry || "Côte d'Ivoire"}
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Code PIN de Sécurité
                </span>
                <span className="text-sm font-bold text-emerald-400 font-mono block">
                  •••• (Enregistré)
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1 text-slate-400">
                <LockKeyhole className="w-3.5 h-3.5 text-amber-400" />
                <span>Verrouillé et scellé</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                Prêt pour les retraits instantanés
              </span>
            </div>
          </div>

          {/* Security Notice / PIN Reminder */}
          <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200/90 shadow-2xs space-y-2 text-xs text-amber-950">
            <div className="flex items-center space-x-2 font-black text-slate-900">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Rappel Important : Conservez bien votre code PIN !</span>
            </div>
            <p className="leading-relaxed font-medium">
              Veuillez mémoriser et conserver précieusement votre code PIN secret de retrait à 4 chiffres. Ce code vous sera systématiquement demandé pour valider et autoriser chacun de vos retraits ultérieurs.
            </p>
          </div>

          {/* Back button */}
          <button
            onClick={onBack}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs cursor-pointer transition-all"
          >
            Retour au profil
          </button>
        </div>
      ) : (
        /* 3. UNBOUND FORM: INITIAL BINDING FORM */
        <>
          {/* Intro Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                Compte Financier Sécurisé & Chiffré
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              Liez votre carte bancaire, compte Mobile Money ou RIB. <strong className="text-amber-800">Attention : une fois le compte lié, les coordonnées seront définitivement verrouillées.</strong>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
              {/* Selection du Pays */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-amber-600" />
                  <span>Pays de la Banque / Compte</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALLOWED_COUNTRIES.map((c) => {
                    const isSel = countryCode === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCountryChange(c.code)}
                        className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSel
                            ? 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-xs scale-[1.02]'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Moyen de Paiement / Type de Carte */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  <span>Moyen de paiement / Type de compte</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_NETWORKS.map((net) => {
                    const isSel = network === net;
                    return (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setNetwork(net)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          isSel
                            ? 'bg-slate-900 border-slate-900 text-amber-400 font-extrabold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {net}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nom du titulaire */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>Nom complet sur la carte / compte bancaire</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Ex: Kouassi Armand Desiré"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* Numéro de compte / carte */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Building className="w-4 h-4 text-amber-600" />
                  <span>Numéro de carte / Compte bancaire ou Mobile</span>
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-amber-500 rounded-xl px-3.5 py-3 transition-all">
                  <span className="text-xs font-black font-mono text-amber-700 mr-2 shrink-0">{currentCountry.prefix}</span>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Ex: 0708091011 ou 4111 2222 3333 4444"
                    className="w-full bg-transparent text-sm font-mono font-bold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Code PIN de Sécurité */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <LockKeyhole className="w-4 h-4 text-emerald-600" />
                    <span>Code PIN de sécurité pour les retraits *</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold lowercase">
                    (masqué)
                  </span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="**** (Ex: 1234)"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-3 text-sm font-mono font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal"
                />
                <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                  Ce code PIN sera strictement requis pour confirmer chacun de vos retraits ultérieurs.
                </p>
              </div>
            </div>

            {/* Confirmation Message */}
            {isSaved && (
              <div className="p-3.5 bg-emerald-100/80 border border-emerald-300 text-emerald-900 rounded-xl flex items-center space-x-2.5 text-xs font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Votre carte bancaire / compte de paiement est lié et enregistré.</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:brightness-105 active:scale-[0.99] text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center space-x-2 ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <CreditCard className="w-5 h-5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Enregistrement en cours...' : 'Lier la carte bancaire'}</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
};

