import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Plus, X, Upload, CheckCircle2, MessageSquare, PhoneCall, Calendar, Image as ImageIcon, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProofOfWithdrawalViewProps {
  onBack: () => void;
}

export const ProofOfWithdrawalView: React.FC<ProofOfWithdrawalViewProps> = ({ onBack }) => {
  const { withdrawalProofs, addWithdrawalProof } = useApp();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const [network, setNetwork] = useState('Mobile Money');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert("Veuillez saisir un montant de retrait valide.");
      return;
    }

    const res = addWithdrawalProof(Number(amount), network, message, imageUrl.trim() || null);
    if (res.success) {
      setToastMessage("Votre preuve de retrait a été publiée avec succès !");
      setTimeout(() => setToastMessage(null), 3500);
      setShowSubmitModal(false);
      setAmount('');
      setMessage('');
      setImageUrl('');
    } else {
      alert(res.error || "Une erreur est survenue lors de l'envoi.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6 pb-4 px-3 sm:px-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 max-w-md p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center space-x-3 animate-fadeIn font-bold text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header / Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-700 hover:text-amber-600 transition-colors font-extrabold text-xs sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Ajouter une preuve</span>
        </button>
      </div>

      {/* Hero Banner Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-7 text-white space-y-3 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs uppercase font-extrabold tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Transparence & Sécurité</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Preuves de Retrait
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
          Découvrez en temps réel les témoignages et preuves de paiement réelles soumises par les membres de la communauté Nutrien.
        </p>
      </div>

      {/* Vertical Feed of Proofs */}
      <div className="space-y-4">
        {withdrawalProofs.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-800">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Aucune preuve publiée pour le moment</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Soyez le premier à partager votre preuve de paiement avec la communauté !
            </p>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="mt-2 inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-full shadow-xs hover:bg-amber-400 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publier ma preuve</span>
            </button>
          </div>
        ) : (
          withdrawalProofs.map((proof) => (
            <div
              key={proof.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4 hover:border-amber-400 transition-all relative overflow-hidden"
            >
              {/* Top row: User name, phone, date & verified badge */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-900 text-sm sm:text-base">{proof.userName}</span>
                    <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Vérifié</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono">
                    <span className="flex items-center space-x-1">
                      <PhoneCall className="w-3 h-3 text-slate-400" />
                      <span>{proof.userPhone.includes('****') ? proof.userPhone : `${proof.userPhone.slice(0, 3)}****${proof.userPhone.slice(-2)}`}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{proof.createdAt}</span>
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="font-mono font-black text-emerald-600 text-base sm:text-xl tracking-tight">
                    +{proof.amount.toLocaleString()} XAF
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md inline-block uppercase">
                    {proof.network}
                  </span>
                </div>
              </div>

              {/* Message / Commentaire */}
              {proof.message && (
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium flex items-start space-x-2">
                  <MessageSquare className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                  <p className="italic">"{proof.message}"</p>
                </div>
              )}

              {/* Proof Image */}
              {proof.imageUrl && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Capture d'écran de confirmation
                  </span>
                  <div
                    onClick={() => setSelectedImage(proof.imageUrl)}
                    className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group cursor-pointer max-h-72 flex items-center justify-center"
                  >
                    <img
                      src={proof.imageUrl}
                      alt="Preuve de retrait"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-1.5">
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full relative space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Publier une Preuve de Retrait
                </h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Montant reçu (XAF)
                </label>
                <input
                  type="number"
                  min={1000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 25000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-900 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Votre commentaire / Avis (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Partagez votre expérience avec Nutrien..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Capture d'écran de la preuve (Image / URL)
                </label>
                <div className="space-y-2">
                  <label className="w-full bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-center space-x-2 text-slate-600 font-medium cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-amber-600" />
                    <span>Téléverser une image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="text-center text-[10px] text-slate-400 font-bold uppercase">Ou coller l'URL de l'image</div>

                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/preuve.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 leading-tight">
                🔒 <strong>Confidentialité garantie :</strong> Votre numéro de téléphone sera automatiquement masqué (ex: +237 65****589) pour protéger vos données personnelles.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm rounded-full shadow-xs hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
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
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white font-bold text-sm bg-slate-800/80 px-3 py-1 rounded-full flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Fermer</span>
            </button>
            <img
              src={selectedImage}
              alt="Preuve grand format"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};
