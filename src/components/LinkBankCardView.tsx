import React, { useState } from 'react';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, LockKeyhole, Building, Globe, UserCheck, Smartphone } from 'lucide-react';
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

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const selectedC = ALLOWED_COUNTRIES.find(c => c.code === code);
    if (selectedC && selectedC.networks.length > 0) {
      setNetwork(selectedC.networks[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    const res = saveWithdrawalAccount(
      accountName.trim(),
      accountNumber.trim(),
      pinCode.trim(),
      network,
      countryCode
    );

    if (res.success) {
      setIsSaved(true);
      onShowToast('success', "Carte bancaire / Compte de paiement lié avec succès !");
      setPinCode('');
    } else {
      onShowToast('err', res.error || "Erreur lors de la liaison de la carte.");
    }
  };

  return (
    <div className="animate-fadeIn max-w-xl mx-auto space-y-6 pb-24 text-slate-900 font-sans">
      {/* 1. Header (Frameless Header directly integrated into background) */}
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
            Lier une carte bancaire
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Coordonnées financières et compte de retrait
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* 2. Intro Banner (Framed Card) */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
            Compte Financier Sécurisé & Chiffré
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          Liez votre carte bancaire, compte Mobile Money ou RIB. Vos informations financières serviront au versement automatique et instantané de vos retraits.
        </p>
      </div>

      {/* 3. Form enclosed in structured framed cards */}
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
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:brightness-105 active:scale-[0.99] text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center space-x-2"
        >
          <CreditCard className="w-5 h-5 stroke-[2.5]" />
          <span>Lier la carte bancaire</span>
        </button>
      </form>
    </div>
  );
};
