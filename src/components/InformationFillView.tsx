import React, { useState } from 'react';
import { ArrowLeft, User, Phone, MapPin, CreditCard, ShieldCheck, CheckCircle2, Copy, Send, Sparkles, Globe } from 'lucide-react';
import { User as UserType } from '../types';
import { ALLOWED_COUNTRIES } from '../constants/countries';

interface InformationFillViewProps {
  currentUser: UserType;
  onBack: () => void;
  onUpdateProfile: (data: Partial<UserType>) => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
}

export const InformationFillView: React.FC<InformationFillViewProps> = ({
  currentUser,
  onBack,
  onUpdateProfile,
  onShowToast
}) => {
  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    phone: currentUser.phone || '',
    whatsapp: currentUser.whatsapp || '',
    country: currentUser.country || (currentUser.phone?.startsWith('+237') ? 'Cameroun' : 'Togo'),
    paymentNetwork: currentUser.withdrawalNetwork || 'TMoney (Togocom)',
    paymentAccount: currentUser.withdrawalAccountNumber || currentUser.phone || '',
    idNumber: '',
    email: ''
  });

  const [isSaved, setIsSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fillLink = `${window.location.origin}/?fill=1&ref=${currentUser.referralCode || currentUser.phone}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onShowToast('err', 'Veuillez saisir votre nom complet.');
      return;
    }
    if (!formData.whatsapp.trim()) {
      onShowToast('err', 'Veuillez saisir votre numéro WhatsApp.');
      return;
    }

    onUpdateProfile({
      name: formData.name.trim(),
      whatsapp: formData.whatsapp.trim(),
      country: formData.country.trim() || 'Togo'
    });

    setIsSaved(true);
    onShowToast('success', 'Vos informations ont été enregistrées avec succès dans la base de données !');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fillLink);
    setCopiedLink(true);
    onShowToast('success', 'Lien de remplissage copié dans le presse-papier !');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto space-y-5 pb-24 text-white font-sans">
      {/* 1. Top Header */}
      <div className="flex items-center justify-between py-2 px-1">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-pink-300 hover:text-white transition-transform active:scale-95 cursor-pointer flex items-center space-x-1"
          aria-label="Retour"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-base sm:text-lg font-extrabold text-white text-center tracking-tight flex-1">
          Page de remplissage des informations
        </h1>
        <div className="w-8" />
      </div>

      {/* 2. Intro Banner */}
      <div className="bg-gradient-to-r from-pink-900/60 via-purple-900/60 to-pink-900/60 border border-pink-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-lg space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-pink-300 block font-bold">
              Formulaire Sécurisé
            </span>
            <h2 className="text-sm sm:text-base font-extrabold leading-snug">
              Enregistrement des coordonnées financières
            </h2>
          </div>
        </div>
        <p className="text-xs text-pink-100/90 leading-relaxed font-medium pt-1">
          Remplissez soigneusement vos données ci-dessous. Vos informations permettent de valider vos retraits automatiques et d'assurer la gestion sécurisée de votre compte.
        </p>
      </div>

      {/* 3. Link Sharing Tool */}
      <div className="bg-[#1a082b] border border-pink-500/25 rounded-2xl p-4 space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-pink-200 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Lien direct vers ce formulaire de remplissage :</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={fillLink}
            className="flex-1 bg-[#120422] border border-pink-500/30 rounded-xl px-3 py-2 text-xs font-mono text-pink-200 select-all outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-md"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Copié !' : 'Copier'}</span>
          </button>
        </div>
      </div>

      {/* 4. Form Container */}
      <form onSubmit={handleSubmit} className="bg-[#1a082b] border border-pink-500/25 rounded-2xl p-4 sm:p-6 space-y-4 shadow-md">
        <h3 className="text-xs sm:text-sm font-bold text-pink-300 uppercase tracking-wide border-b border-pink-500/20 pb-2">
          Coordonnées Personnelles & Paiement
        </h3>

        {/* Nom complet */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-pink-200/90 flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-pink-400" />
            <span>Nom complet *</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Koffi Konan Paul"
            className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white placeholder:text-pink-300/40 outline-none focus:border-pink-400 transition-colors"
          />
        </div>

        {/* Téléphone & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-pink-200/90 flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-pink-400" />
              <span>Numéro de Téléphone *</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: 0707070707"
              className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white placeholder:text-pink-300/40 outline-none focus:border-pink-400 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-pink-200/90 flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Numéro WhatsApp *</span>
            </label>
            <input
              type="tel"
              required
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="Ex: +22890909090"
              className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white placeholder:text-pink-300/40 outline-none focus:border-pink-400 transition-colors"
            />
          </div>
        </div>

        {/* Pays (Exclusif Togo) */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-pink-200/90 flex items-center space-x-1">
            <Globe className="w-3.5 h-3.5 text-pink-400" />
            <span>Pays de résidence *</span>
          </label>
          <div className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
            <span className="text-base">🇹🇬</span>
            <span>Togo (+228)</span>
          </div>
        </div>

        {/* Payment Network & Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-pink-200/90 flex items-center space-x-1">
              <CreditCard className="w-3.5 h-3.5 text-pink-400" />
              <span>Moyen de paiement préféré</span>
            </label>
            <select
              value={formData.paymentNetwork}
              onChange={(e) => setFormData({ ...formData, paymentNetwork: e.target.value })}
              className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white outline-none focus:border-pink-400 transition-colors"
            >
              <option value="TMoney (Togocom)" className="bg-[#120422] text-white">TMoney (Togocom)</option>
              <option value="Moov Money (Flooz)" className="bg-[#120422] text-white">Moov Money (Flooz)</option>
              <option value="Carte Visa / Mastercard" className="bg-[#120422] text-white">Carte Visa / Mastercard</option>
              <option value="Virement Bancaire" className="bg-[#120422] text-white">Virement Bancaire</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-pink-200/90 flex items-center space-x-1">
              <CreditCard className="w-3.5 h-3.5 text-pink-400" />
              <span>Numéro de compte pour les retraits</span>
            </label>
            <input
              type="text"
              required
              value={formData.paymentAccount}
              onChange={(e) => setFormData({ ...formData, paymentAccount: e.target.value })}
              placeholder="Ex: 07070707"
              className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white placeholder:text-pink-300/40 outline-none focus:border-pink-400 transition-colors"
            />
          </div>
        </div>

        {/* CNI & Email Optional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-pink-200/90">Numéro de CNI / Pièce d'identité (Optionnel)</label>
            <input
              type="text"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              placeholder="Ex: C009827189"
              className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-pink-300/40 outline-none focus:border-pink-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-pink-200/90">Adresse Email (Optionnel)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ex: exemple@mail.com"
              className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-pink-300/40 outline-none focus:border-pink-400"
            />
          </div>
        </div>

        {/* Status indicator */}
        {isSaved && (
          <div className="bg-pink-500/20 border border-pink-500/40 text-pink-200 p-3 rounded-xl flex items-center space-x-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Vos données sont validées et enregistrées dans la base de données.</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] border border-pink-300/30"
        >
          <Send className="w-4 h-4 text-pink-200" />
          <span>Valider et enregistrer les informations</span>
        </button>
      </form>
    </div>
  );
};
