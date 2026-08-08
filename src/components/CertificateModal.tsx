import React from 'react';
import { Award, ShieldCheck, X, CheckCircle } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Watermark Header */}
        <div className="text-center pt-2">
          <div className="w-16 h-16 mx-auto mb-3 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-xs">
            <Award className="w-8 h-8 stroke-[2.5px]" />
          </div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-amber-800 block mb-1">
            CERTIFICAT D'AUTHENTICITÉ & DE CONFORMITÉ
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            AURA INVEST & NUTRIEN AG SOLUTIONS
          </h3>
        </div>

        {/* Certificate Body Text Area */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 font-sans relative py-1">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Licence Numérique Fintech Certifiée #AURA-2026-8890</span>
          </div>

          <p className="leading-relaxed text-slate-800">
            Ce document officiel atteste que la plateforme d'investissement <strong className="text-amber-800">AURA INVEST / Nutrien Ag Solutions</strong> est dûment agréée et enregistrée pour la distribution de produits de bien-être et de gestion d'actifs numériques.
          </p>

          <div className="space-y-2.5 font-mono text-[11px] pt-2">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Numéro de Registre :</span>
              <span className="font-bold text-slate-900">CI-ABJ-2026-B-14092</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Garantie des Fonds :</span>
              <span className="font-bold text-emerald-700">100% Capital Sécurisé</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Audit Sécurité :</span>
              <span className="font-bold text-amber-700">Conforme ISO/IEC 27001</span>
            </div>
          </div>

          <p className="text-xs text-slate-700 font-medium leading-relaxed pt-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 inline mr-1.5" />
            Tous les rendements quotidiens distribués sur les produits de bien-être sont garantis et adossés à des actifs physiques de nutrition et d'agro-industrie.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
        >
          Fermer la vue Certificat
        </button>
      </div>
    </div>
  );
};
