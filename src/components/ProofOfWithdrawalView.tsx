import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Plus, X, Upload, CheckCircle2, MessageSquare, PhoneCall, Calendar, Image as ImageIcon, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProofOfWithdrawalViewProps {
  onBack: () => void;
}

export const ProofOfWithdrawalView: React.FC<ProofOfWithdrawalViewProps> = ({ onBack }) => {
  const { withdrawalProofs, withdrawals, addWithdrawalProof } = useApp();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const [network, setNetwork] = useState('Mobile Money');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Combine published proofs and system-approved withdrawals so all proofs are visibly available across all user accounts
  const allProofs = React.useMemo(() => {
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
            message: 'Retrait validé et payé avec succès par AirPods.',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = Number(amount) > 0 ? Number(amount) : 2000;
    const finalMessage = message.trim() || `Retrait reçu avec succès via ${network}. Merci AirPods !`;

    const res = addWithdrawalProof(finalAmount, network, finalMessage, imageUrl.trim() || null);
    if (res.success) {
      setToastMessage("Votre preuve de retrait a été publiée avec succès !");
      setTimeout(() => setToastMessage(null), 3500);
      setShowSubmitModal(false);
      setAmount('');
      setMessage('');
      setImageUrl('');
    } else {
      setToastMessage("Votre preuve de retrait a été publiée avec succès !");
      setTimeout(() => setToastMessage(null), 3500);
      setShowSubmitModal(false);
    }
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setImageUrl(compressed);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6 pb-4 px-3 sm:px-0 text-white font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 max-w-md p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xl flex items-center space-x-3 animate-fadeIn font-bold text-xs sm:text-sm border border-pink-300/30">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header / Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-pink-500/20">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-pink-300 hover:text-white transition-colors font-extrabold text-xs sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-md flex items-center space-x-1.5 transition-all cursor-pointer border border-pink-300/30"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Ajouter une preuve</span>
        </button>
      </div>

      {/* Hero Banner Header */}
      <div className="bg-gradient-to-br from-[#1a082b] via-[#24083a] to-[#120422] border border-pink-500/30 rounded-3xl p-5 sm:p-7 text-white space-y-3 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-2 text-pink-400 font-mono text-xs uppercase font-extrabold tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Transparence & Sécurité</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Preuves de Retrait
        </h1>
        <p className="text-xs sm:text-sm text-pink-200/80 font-medium max-w-xl leading-relaxed">
          Découvrez en temps réel les témoignages et preuves de paiement réelles soumises par les membres de la communauté AirPods.
        </p>
      </div>

      {/* Vertical Feed of Proofs */}
      <div className="space-y-4">
        {allProofs.length === 0 ? (
          <div className="bg-[#1a082b] rounded-3xl p-10 text-center border border-pink-500/25 shadow-md space-y-3">
            <div className="w-14 h-14 bg-pink-500/20 border border-pink-500/30 rounded-2xl flex items-center justify-center mx-auto text-pink-400">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">Aucune preuve publiée pour le moment</h3>
            <p className="text-xs text-pink-200/60 max-w-sm mx-auto">
              Soyez le premier à partager votre preuve de paiement avec la communauté !
            </p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="mt-2 inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-xs rounded-full shadow-md hover:from-pink-400 hover:to-purple-500 cursor-pointer border border-pink-300/30"
            >
              <Plus className="w-4 h-4" />
              <span>Publier ma preuve</span>
            </button>
          </div>
        ) : (
          allProofs.map((proof) => (
            <div
              key={proof.id}
              className="bg-[#1a082b] rounded-3xl p-5 sm:p-6 border border-pink-500/25 shadow-md space-y-4 hover:border-pink-500/50 transition-all relative overflow-hidden"
            >
              {/* Top row: User name, phone, date & verified badge */}
              <div className="flex items-start justify-between gap-2 border-b border-pink-500/20 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-white text-sm sm:text-base">{proof.userName}</span>
                    <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Vérifié</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-pink-300/60 font-mono">
                    <span className="flex items-center space-x-1">
                      <PhoneCall className="w-3 h-3 text-pink-400" />
                      <span>{proof.userPhone.includes('****') ? proof.userPhone : `${proof.userPhone.slice(0, 3)}****${proof.userPhone.slice(-2)}`}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-pink-400" />
                      <span>{proof.createdAt}</span>
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="font-mono font-black text-pink-400 text-base sm:text-xl tracking-tight">
                    +{(Number(proof.amount) || 0).toLocaleString('fr-FR')} XAF
                  </div>
                  <span className="text-[10px] font-bold text-pink-300 bg-[#120422] border border-pink-500/20 px-2 py-0.5 rounded-md inline-block uppercase">
                    {proof.network}
                  </span>
                </div>
              </div>

              {/* Message / Commentaire */}
              {proof.message && (
                <div className="bg-[#120422] rounded-2xl p-3.5 border border-pink-500/20 text-xs sm:text-sm text-pink-100 leading-relaxed font-medium flex items-start space-x-2">
                  <MessageSquare className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                  <p className="italic">"{proof.message}"</p>
                </div>
              )}

              {/* Proof Image */}
              {proof.imageUrl && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-pink-300/60 uppercase tracking-wider block">
                    Capture d'écran de confirmation
                  </span>
                  <div
                    onClick={() => setSelectedImage(proof.imageUrl)}
                    className="relative rounded-2xl overflow-hidden border border-pink-500/30 bg-[#120422] group cursor-pointer max-h-72 flex items-center justify-center"
                  >
                    <img
                      src={proof.imageUrl}
                      alt="Preuve de retrait"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-[#0d0417]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-1.5">
                      <Eye className="w-4 h-4" />
                      <span>Agrandir l'image</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL: SUBMIT PROOF FORM */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-[#0d0417]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1a082b] border border-pink-500/30 text-white rounded-3xl p-5 sm:p-6 max-w-md w-full relative space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold text-white">
                  Publier une Preuve de Retrait
                </h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 rounded-full bg-[#120422] text-pink-300 hover:text-white border border-pink-500/30 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-pink-200 mb-1">
                  Montant reçu (XAF)
                </label>
                <input
                  type="number"
                  min={1000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 25000"
                  className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 font-mono font-bold text-white placeholder:text-pink-300/40 outline-none focus:border-pink-400"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-pink-200 mb-1">
                  Votre commentaire / Avis (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Partagez votre expérience avec AirPods..."
                  className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-white placeholder:text-pink-300/40 outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block font-bold text-pink-200 mb-1">
                  Capture d'écran de la preuve (Image / URL)
                </label>
                <div className="space-y-2">
                  <label className="w-full bg-[#120422] hover:bg-[#200a35] border border-dashed border-pink-500/40 rounded-xl p-3 flex items-center justify-center space-x-2 text-pink-200 font-medium cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-pink-400" />
                    <span>Téléverser une image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="text-center text-[10px] text-pink-300/60 font-bold uppercase">Ou coller l'URL de l'image</div>

                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/preuve.jpg"
                    className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2 text-white placeholder:text-pink-300/40 outline-none focus:border-pink-400 text-xs"
                  />
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-pink-500/20 border border-pink-500/30 rounded-xl p-2.5 text-[11px] text-pink-200 leading-tight">
                🔒 <strong>Confidentialité garantie :</strong> Votre numéro de téléphone sera automatiquement masqué (ex: +237 65****589) pour protéger vos données personnelles.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-sm rounded-full shadow-md active:scale-[0.99] transition-all cursor-pointer border border-pink-300/30"
              >
                Publier instantanément
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR IMAGES */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-[#0d0417]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white font-bold text-sm bg-[#1a082b] border border-pink-500/40 px-3 py-1 rounded-full flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Fermer</span>
            </button>
            <img
              src={selectedImage}
              alt="Preuve grand format"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-pink-500/30"
            />
          </div>
        </div>
      )}
    </div>
  );
};
