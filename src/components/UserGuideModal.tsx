import React from 'react';
import { X, MessageCircle } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const whatsappChannelUrl = "https://chat.whatsapp.com/Ib2sSp6KvCBA8W5ORBxSMe?s=cl&p=a&ilr=4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative bg-white rounded-2xl max-w-sm w-full p-4 pt-7 shadow-2xl border border-slate-100 animate-scaleUp text-slate-900">
        
        {/* Mascot Badge overlapping top border (Smaller & cleaner) */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20">
          <div className="w-14 h-14 bg-amber-400 rounded-full border-3 border-white shadow-md flex items-center justify-center relative overflow-hidden">
            {/* Mascot Face SVG */}
            <svg viewBox="0 0 100 100" className="w-11 h-11">
              <polygon points="18,18 32,42 12,38" fill="#FACC15" />
              <polygon points="18,18 24,28 12,38" fill="#1E293B" />
              <polygon points="82,18 68,42 88,38" fill="#FACC15" />
              <polygon points="82,18 76,28 88,38" fill="#1E293B" />
              <circle cx="50" cy="55" r="34" fill="#FACC15" />
              <circle cx="38" cy="50" r="4.5" fill="#1E293B" />
              <circle cx="39.5" cy="48.5" r="1.5" fill="#FFFFFF" />
              <circle cx="62" cy="50" r="4.5" fill="#1E293B" />
              <circle cx="63.5" cy="48.5" r="1.5" fill="#FFFFFF" />
              <circle cx="28" cy="62" r="5.5" fill="#EF4444" />
              <circle cx="72" cy="62" r="5.5" fill="#EF4444" />
              <polygon points="50,56 48,58 52,58" fill="#1E293B" />
              <path d="M 42,61 Q 50,70 58,61 Z" fill="#EF4444" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer z-10"
          title="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Content Body */}
        <div className="mt-1 space-y-2.5 text-left text-xs font-medium text-slate-700 leading-relaxed max-h-[58vh] overflow-y-auto pr-1">
          
          <div className="text-center pb-0.5">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug">
              ✨ Lancement officiel de Nutrien ✨
            </h3>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-700 leading-snug font-normal bg-amber-50/90 p-2 rounded-xl border border-amber-200/60">
            <span className="text-red-500 font-bold">🔻</span> Invitez vos amis à investir et gagnez jusqu'à <strong className="text-amber-900 font-bold">20% - 2% - 1%</strong> de commissions sur les investissements.
          </p>

          <div className="space-y-1.5 text-[11px] font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
            <div className="flex items-start space-x-1.5">
              <span className="text-xs shrink-0">🎁</span>
              <span><strong>Bonus d'inscription :</strong> 200 XOF (200 XAF pour le Cameroun)</span>
            </div>
            <div className="flex items-start space-x-1.5">
              <span className="text-xs shrink-0">🔥</span>
              <span><strong>Bonus quotidien (Pointage) :</strong> 20 FCFA</span>
            </div>
            <div className="flex items-start space-x-1.5">
              <span className="text-xs shrink-0">💰</span>
              <span><strong>Dépôt minimum :</strong> 2 500 FCFA</span>
            </div>
            <div className="flex items-start space-x-1.5">
              <span className="text-xs shrink-0">💸</span>
              <span><strong>Retrait minimum :</strong> 1 000 FCFA</span>
            </div>
            <div className="flex items-start space-x-1.5">
              <span className="text-xs shrink-0">⚙️</span>
              <span><strong>Frais de retrait :</strong> 15 %</span>
            </div>
            <div className="flex items-start space-x-1.5">
              <span className="text-xs shrink-0">🍀</span>
              <span><strong>Horaires retraits :</strong> 09h00 à 17h00 (max 2/jour).</span>
            </div>
            <div className="flex items-start space-x-1.5">
              <span className="text-xs shrink-0">🔒</span>
              <span><strong>Condition :</strong> Produit actif requis pour retirer.</span>
            </div>
            <div className="flex items-start space-x-1.5">
              <span className="text-xs shrink-0">👥</span>
              <span><strong>Commissions parrainage :</strong> 15 % - 2 % - 1 %</span>
            </div>
            <div className="flex items-start space-x-1.5">
              <span className="text-xs shrink-0">📍</span>
              <span><strong>Pays concerné :</strong> Togo 🇹🇬 (Mobile Money TMoney & Flooz)</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2.5">
          <a
            href={whatsappChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1 shadow-xs active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white text-sky-500" />
            <span>WhatsApp &gt;</span>
          </a>

          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all text-center active:scale-95 cursor-pointer shadow-sm"
          >
            D'accord
          </button>
        </div>

      </div>
    </div>
  );
};
