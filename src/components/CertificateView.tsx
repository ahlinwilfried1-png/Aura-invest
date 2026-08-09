import React, { useState } from 'react';
import { ArrowLeft, Upload, Send, CheckCircle2, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';
import { User, WithdrawalProof } from '../types';
import { useApp } from '../context/AppContext';

interface CertificateViewProps {
  currentUser: User;
  onBack: () => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  currentUser,
  onBack,
  onShowToast
}) => {
  const { withdrawalProofs, addWithdrawalProof } = useApp();

  // Submission form toggle & states
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [amountInput, setAmountInput] = useState<number>(2000);
  const [networkInput, setNetworkInput] = useState<string>('Mobile Money');
  const [messageInput, setMessageInput] = useState<string>('');
  const [imageInput, setImageInput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter only approved / verified proofs for public view
  const approvedProofs = withdrawalProofs.filter(p => p.status === 'approved' || p.isVerified);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onShowToast('err', "L'image ne doit pas dépasser 5 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageInput(reader.result as string);
        onShowToast('success', "Capture de preuve chargée !");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountInput || amountInput <= 0) {
      onShowToast('err', "Veuillez entrer un montant valide.");
      return;
    }
    if (!messageInput.trim()) {
      onShowToast('err', "Veuillez ajouter un commentaire de satisfaction.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = addWithdrawalProof(amountInput, networkInput, messageInput, imageInput);
      setIsSubmitting(false);

      if (res.success) {
        onShowToast('success', "Votre preuve de retrait a été publiée avec succès et est maintenant visible par tous !");
        setMessageInput('');
        setImageInput(null);
        setShowUploadForm(false);
      } else {
        onShowToast('err', res.error || "Une erreur est survenue lors de l'envoi.");
      }
    }, 200);
  };

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto space-y-3 pb-20 text-slate-900">
      {/* 1. Header: Simple top bar with left back arrow & centered title */}
      <div className="relative flex items-center justify-between py-1 px-1">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1.5 text-slate-800 hover:text-black transition-transform active:scale-95 cursor-pointer flex items-center space-x-1"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 text-center tracking-tight flex-1">
          Preuves de retrait
        </h1>
        <div className="w-6" /> {/* Placeholder for balance */}
      </div>

      {/* 2. Banner: Compact warm yellow-orange gradient banner */}
      <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-[#FEDB87] via-[#FEBA4F] to-[#FA9E2C] px-3 py-2.5 sm:p-3 shadow-2xs border border-amber-300/40 flex items-center justify-between min-h-[72px]">
        <div className="max-w-[72%] space-y-0.5 z-10">
          <h2 className="text-slate-950 font-extrabold text-[11px] sm:text-xs leading-snug tracking-wide font-sans uppercase">
            TÉLÉCHARGEZ VOTRE BON DE RETRAIT POUR DES RÉCOMPENSES EN ESPÈCES
          </h2>
          <p className="text-[10px] sm:text-[11px] text-amber-950/90 font-medium leading-tight">
            Partagez vos captures de retrait validées et gagnez des bonus exclusifs.
          </p>
        </div>

        {/* Money Bag & Gold Coins Illustration */}
        <div className="absolute -right-2 -bottom-2 w-20 sm:w-22 h-20 sm:h-22 pointer-events-none select-none flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xs">
            <circle cx="110" cy="110" r="75" fill="#FFEAA7" opacity="0.6" />
            <path d="M60 160 C50 110, 65 80, 100 80 C135 80, 150 110, 140 160 C135 180, 65 180, 60 160 Z" fill="#E67E22" />
            <path d="M65 158 C57 115, 68 85, 100 85 C132 85, 143 115, 135 158 C130 175, 70 175, 65 158 Z" fill="#F39C12" />
            <path d="M80 75 C80 65, 120 65, 120 75 L125 82 L75 82 Z" fill="#D35400" />
            <ellipse cx="100" cy="73" rx="18" ry="6" fill="#C0392B" />
            <text x="100" y="135" textAnchor="middle" fill="#7D3C98" fontSize="42" fontWeight="900" fontFamily="sans-serif">$</text>
            <text x="98" y="133" textAnchor="middle" fill="#F1C40F" fontSize="42" fontWeight="900" fontFamily="sans-serif">$</text>
            <circle cx="45" cy="140" r="16" fill="#F1C40F" stroke="#F39C12" strokeWidth="2" />
            <circle cx="155" cy="148" r="20" fill="#F1C40F" stroke="#F39C12" strokeWidth="2.5" />
          </svg>
        </div>
      </div>

      {/* 3. User Upload Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
            Téléchargement des preuves
          </h3>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="text-[10px] sm:text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-md transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>{showUploadForm ? 'Fermer' : 'Ajouter une preuve'}</span>
          </button>
        </div>

        {/* Upload Form Box */}
        {showUploadForm && (
          <form onSubmit={handleFormSubmit} className="bg-white rounded-lg border border-slate-200 p-2.5 space-y-2.5 shadow-2xs animate-fadeIn">
            <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 p-1.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>Vos informations personnelles (numéro de téléphone) seront automatiquement masquées.</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                Montant du retrait (XOF/FCFA)
              </label>
              <input
                type="number"
                min={500}
                step={100}
                value={amountInput}
                onChange={(e) => setAmountInput(Number(e.target.value))}
                placeholder="Ex: 2000"
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 font-bold text-xs outline-none focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                Commentaire / Témoignage
              </label>
              <textarea
                rows={2}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Ex: Merci beaucoup Nutrien très bonne application"
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-900 text-xs outline-none focus:border-slate-900 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                Image de la preuve (Screenshot du reçu)
              </label>
              <div className="border border-dashed border-slate-200 hover:border-slate-400 rounded-md p-2 text-center cursor-pointer bg-slate-50/50 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {imageInput ? (
                  <div className="flex items-center justify-center space-x-2">
                    <img src={imageInput} alt="Aperçu" className="h-10 w-10 object-cover rounded-md border border-slate-300" />
                    <span className="text-[10px] font-bold text-emerald-600">Image chargée !</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-0.5">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-600">Cliquez pour importer la preuve</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-md transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Publication...' : 'Publier la preuve instantanément'}</span>
            </button>
          </form>
        )}
      </div>

      {/* 4. List of Public Proofs matching reference image layout - Compact Cards */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
            Preuves de retrait
          </h3>
        </div>

        {approvedProofs.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center space-y-1">
            <MessageCircle className="w-5 h-5 text-slate-300 mx-auto" />
            <p className="text-[10px] font-medium text-slate-500">Aucune preuve publiée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {approvedProofs.map((proof) => {
              const maskPhone = (phoneStr: string) => {
                if (!phoneStr) return '****';
                const clean = phoneStr.trim();
                if (clean.includes('****')) return clean;
                if (clean.length >= 8) {
                  return `${clean.slice(0, 4)}****${clean.slice(-2)}`;
                }
                if (clean.length >= 6) {
                  return `${clean.slice(0, 3)}****${clean.slice(-2)}`;
                }
                return `****${clean.slice(-2)}`;
              };

              const formattedPhone = maskPhone(proof.userPhone);
              const formattedAmount = `+${proof.amount.toLocaleString('en-US')}`;
              const formattedDate = proof.createdAt;

              return (
                <div
                  key={proof.id}
                  className="bg-white rounded-lg border border-slate-200/90 px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-2xs transition-all relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Left Column: Phone, Amount, Date, Comment */}
                    <div className="space-y-0.5 flex-1 min-w-0 pr-1">
                      <div className="flex items-baseline justify-between flex-wrap gap-x-2">
                        <span className="font-extrabold text-slate-900 text-xs tracking-tight">
                          {formattedPhone}
                        </span>
                        <span className="font-black text-red-600 text-xs tracking-tight font-sans">
                          {formattedAmount}
                        </span>
                      </div>

                      <div className="text-slate-400 text-[9px] font-medium">
                        {formattedDate}
                      </div>

                      {proof.message && (
                        <p className="text-slate-700 font-medium text-[10px] sm:text-[11px] leading-snug pt-0.5 font-sans">
                          {proof.message}
                        </p>
                      )}
                    </div>

                    {/* Right Column: Reduced Mobile Screenshot Frame */}
                    <div className="shrink-0">
                      {proof.imageUrl ? (
                        <div className="w-12 sm:w-14 h-14 sm:h-18 rounded-md border border-slate-800 overflow-hidden bg-slate-950 shadow-2xs relative group cursor-pointer">
                          <img
                            src={proof.imageUrl}
                            alt="Preuve de retrait"
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      ) : (
                        <div className="w-12 sm:w-14 h-14 sm:h-18 rounded-md border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-0.5 text-center text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
                          <span className="text-[8px] font-bold text-slate-500 leading-tight">Confirmé</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
