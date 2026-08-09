import React, { useState } from 'react';
import { ArrowLeft, Info, Headphones, X, ShieldCheck, Phone, Globe, Smartphone } from 'lucide-react';
import { User, DepositRequest } from '../types';
import { ALLOWED_COUNTRIES } from '../constants/countries';

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

    const fullPhone = `${currentCountry.prefix} ${phone.trim()}`;
    const txRef = `REC-${Date.now().toString().slice(-6)}`;
    const res = onRequestDeposit(depAmount, selectedNetwork, txRef, null);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      if (res.success) {
        onShowToast('success', `Recharge ${selectedNetwork} (${currentCountry.name}) enregistrée avec succès !`);
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
        {/* ÉTAPE 1: IDENTIFICATION PAYS & RÉSEAU & NUMÉRO (OBLIGATOIRE EN PREMIER) */}
        <div className="bg-white rounded-2xl p-3.5 space-y-3 border border-slate-200/70 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider font-mono">
            <Phone className="w-4 h-4 text-amber-500 shrink-0" />
            <span>1. Pays, Réseau & Numéro de téléphone</span>
          </div>

          <div className="space-y-2.5">
            {/* Choix du pays (5 pays uniquement) */}
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

        {/* CADRE RECHARGE MAINTENANT RÉDUIT ET DE TAILLE ADAPTÉE */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleOpenConfirm}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wide rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center text-center"
            >
              Recharger maintenant
            </button>

            <button
              type="button"
              onClick={() => onShowToast('info', "Service Client Nutrien 24/7 disponible.")}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl px-3 py-2 flex items-center space-x-1.5 cursor-pointer shrink-0"
              title="Support Client"
            >
              <Headphones className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[10px] font-black uppercase font-mono hidden sm:inline">Support</span>
            </button>
          </div>
        </div>

        {/* ÉTAPES SIMPLIFIÉES */}
        <div className="px-1 space-y-1.5 text-slate-600 text-xs">
          <p className="font-extrabold text-slate-800 text-[11px] uppercase font-mono">
            Guide rapide de recharge :
          </p>
          <ul className="space-y-1 text-[11px] text-slate-500 leading-snug">
            <li>• Renseignez votre indicatif et numéro de téléphone mobile.</li>
            <li>• Sélectionnez le montant à recharger (minimum 1 000 FCFA).</li>
            <li>• Validez en cliquant sur "Recharger maintenant".</li>
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
              Confirmez-vous la demande de recharge de <strong className="text-slate-800 font-mono">{depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA</strong> ?
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
                className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {isSubmitting ? (
                  <span>Validation...</span>
                ) : (
                  <span>Confirmer</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

