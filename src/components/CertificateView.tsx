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
  const { withdrawalProofs, withdrawals, addWithdrawalProof } = useApp();

  // Submission form toggle & states
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [amountInput, setAmountInput] = useState<number>(2000);
  const [networkInput, setNetworkInput] = useState<string>('Mobile Money');
  const [messageInput, setMessageInput] = useState<string>('');
  const [imageInput, setImageInput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Combine published proofs and system-approved withdrawals so all proofs are visibly available across all user accounts
  const approvedProofs = React.useMemo(() => {
    const list = [...(withdrawalProofs || []).filter(p => p.status !== 'rejected')];
    const existingProofIds = new Set(list.map(p => p.id));
    
    (withdrawals || []).forEach(w => {
      if (w.status === 'approved') {
        const proofId = 'proof-auto-' + w.id;
        if (!existingProofIds.has(proofId) && !existingProofIds.has(w.id)) {
          const rawPhone = (w.userPhone || w.accountNumber || '').trim();
          let maskedPhone = rawPhone;
          if (rawPhone.length >= 6) {
            maskedPhone = `${rawPhone.slice(0, 3)}****${rawPhone.slice(-3)}`;
          } else if (rawPhone.length > 0) {
            maskedPhone = `****${rawPhone.slice(-2)}`;
          } else {
            maskedPhone = '****';
          }

          list.push({
            id: proofId,
            userId: w.userId,
            userName: w.userName || 'Membre VIP',
            userPhone: maskedPhone,
            amount: w.amount,
            network: w.network || 'Mobile Money',
            message: 'Retrait validé et payé avec succès par Nutrien.',
            imageUrl: null,
            createdAt: w.createdAt ? w.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            isVerified: true,
            status: 'approved'
          });
        }
      }
    });

    return list;
  }, [withdrawalProofs, withdrawals]);

  // Image Compression Helper - Never fails
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve('');
      reader.onload = (event) => {
        const rawDataUrl = (event.target?.result as string) || '';
        if (!rawDataUrl) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onerror = () => resolve(rawDataUrl);
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxWidth = 600;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }

            canvas.width = width || 300;
            canvas.height = height || 300;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(rawDataUrl);
              return;
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(dataUrl || rawDataUrl);
          } catch (e) {
            resolve(rawDataUrl);
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSubmitting(true);
      try {
        const compressedDataUrl = await compressImage(file);
        if (compressedDataUrl) {
          setImageInput(compressedDataUrl);
          onShowToast('success', "Capture de preuve chargée !");
        } else {
          onShowToast('err', "Impossible de lire la capture.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = Number(amountInput) > 0 ? Number(amountInput) : 2000;
    const finalMessage = messageInput.trim() || `Retrait reçu avec succès via ${networkInput}. Merci Nutrien !`;

    setIsSubmitting(true);
    setTimeout(() => {
      const res = addWithdrawalProof(finalAmount, networkInput, finalMessage, imageInput);
      setIsSubmitting(false);

      if (res.success) {
        onShowToast('success', "Votre preuve de retrait a été publiée avec succès et est maintenant visible par tous !");
        setMessageInput('');
        setImageInput(null);
        setShowUploadForm(false);
      } else {
        onShowToast('err', res.error || "Une erreur est survenue lors de l'envoi.");
      }
    }, 150);
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
      <div className="relative overflow-hidden rounded-md bg-gradient-to-r from-[#FEDB87] via-[#FEBA4F] to-[#FA9E2C] px-2.5 py-2 shadow-2xs border border-amber-200/60 flex items-center justify-between min-h-[60px]">
        <div className="max-w-[75%] space-y-0.5 z-10">
          <h2 className="text-slate-950 font-extrabold text-[10px] sm:text-[11px] leading-snug tracking-wide font-sans uppercase">
            TÉLÉCHARGEZ VOTRE BON DE RETRAIT POUR DES RÉCOMPENSES EN ESPÈCES
          </h2>
          <p className="text-[9px] sm:text-[10px] text-amber-950/90 font-medium leading-tight">
            Partagez vos captures de retrait validées et gagnez des bonus exclusifs.
          </p>
        </div>

        {/* Money Bag & Gold Coins Illustration */}
        <div className="absolute -right-2 -bottom-2 w-16 sm:w-18 h-16 sm:h-18 pointer-events-none select-none flex items-center justify-center">
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
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Téléchargement des preuves
          </h3>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-2 py-0.5 rounded transition-all flex items-center space-x-1 cursor-pointer"
          >
            <Upload className="w-2.5 h-2.5" />
            <span>{showUploadForm ? 'Fermer' : 'Ajouter une preuve'}</span>
          </button>
        </div>

        {/* Upload Form Box */}
        {showUploadForm && (
          <form onSubmit={handleFormSubmit} className="bg-white rounded-md border border-slate-200/70 p-2 space-y-2 animate-fadeIn">
            <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50/80 p-1.5 rounded border border-emerald-100">
              <ShieldCheck className="w-3 h-3 shrink-0 text-emerald-600" />
              <span>Vos informations personnelles (numéro de téléphone) seront automatiquement masquées.</span>
            </div>

            {/* Hidden / Preset network default */}
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
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-900 font-bold text-xs outline-none focus:border-slate-900"
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
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-900 text-xs outline-none focus:border-slate-900 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                Image de la preuve (Screenshot du reçu)
              </label>
              <div className="border border-dashed border-slate-200 hover:border-slate-400 rounded p-1.5 text-center cursor-pointer bg-slate-50/50 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {imageInput ? (
                  <div className="flex flex-col items-center justify-center p-1 space-y-1">
                    <img src={imageInput} alt="Aperçu" className="max-h-28 max-w-full object-contain rounded-md border border-slate-300 shadow-2xs" />
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Image chargée avec succès (cliquez pour remplacer)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-0.5">
                    <Upload className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-600">Cliquez pour importer la preuve</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>{isSubmitting ? 'Publication...' : 'Publier la preuve instantanément'}</span>
            </button>
          </form>
        )}
      </div>

      {/* 4. List of Public Proofs matching reference image layout - Compact Cards */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Preuves de retrait
          </h3>
        </div>

        {approvedProofs.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-100 p-3 text-center space-y-1">
            <MessageCircle className="w-4 h-4 text-slate-300 mx-auto" />
            <p className="text-[10px] font-medium text-slate-500">Aucune preuve publiée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
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
                  className="bg-white rounded-md border border-slate-200/60 px-2.5 py-1.5 sm:px-3 sm:py-2 transition-all relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Left Column: Phone, Amount, Date, Comment */}
                    <div className="space-y-0.5 flex-1 min-w-0 pr-1">
                      <div className="flex items-baseline justify-between flex-wrap gap-x-2">
                        <span className="font-extrabold text-slate-900 text-[11px] sm:text-xs tracking-tight">
                          {formattedPhone}
                        </span>
                        <span className="font-black text-red-600 text-[11px] sm:text-xs tracking-tight font-sans">
                          {formattedAmount}
                        </span>
                      </div>

                      <div className="text-slate-400 text-[9px] font-medium">
                        {formattedDate}
                      </div>

                      {proof.message && (
                        <p className="text-slate-700 font-medium text-[10px] leading-snug pt-0.5 font-sans">
                          {proof.message}
                        </p>
                      )}
                    </div>

                    {/* Right Column: Mobile Screenshot Frame */}
                    <div className="shrink-0">
                      {proof.imageUrl ? (
                        <div className="w-16 sm:w-20 h-20 sm:h-24 rounded-lg border border-slate-300 overflow-hidden bg-slate-900 shadow-2xs flex items-center justify-center">
                          <img
                            src={proof.imageUrl}
                            alt="Preuve de retrait"
                            className="w-full h-full object-cover object-top pointer-events-none select-none"
                          />
                        </div>
                      ) : (
                        <div className="w-14 sm:w-16 h-16 sm:h-18 rounded-lg border border-slate-200/80 bg-slate-50 flex flex-col items-center justify-center p-1 text-center text-slate-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-0.5" />
                          <span className="text-[8px] font-bold text-slate-600 leading-tight">Reçu Confirmé</span>
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
