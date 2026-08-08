import React from 'react';
import { CreditCard, ArrowUpRight, Award, Calendar, Bell } from 'lucide-react';

interface QuickOperationsGridProps {
  onRecharger: () => void;
  onRetirer: () => void;
  onCertificat: () => void;
  onPointage: () => void;
  onAnnonces: () => void;
}

export const QuickOperationsGrid: React.FC<QuickOperationsGridProps> = ({
  onRecharger,
  onRetirer,
  onCertificat,
  onPointage,
  onAnnonces
}) => {
  const operations = [
    {
      id: 'recharger',
      label: 'Recharger',
      icon: CreditCard,
      color: 'bg-amber-500 text-slate-950 shadow-amber-500/20',
      action: onRecharger
    },
    {
      id: 'retirer',
      label: 'Retirer',
      icon: ArrowUpRight,
      color: 'bg-emerald-600 text-white shadow-emerald-600/20',
      action: onRetirer
    },
    {
      id: 'certificat',
      label: 'Certificat',
      icon: Award,
      color: 'bg-indigo-600 text-white shadow-indigo-600/20',
      action: onCertificat
    },
    {
      id: 'pointage',
      label: 'Pointage',
      icon: Calendar,
      color: 'bg-amber-400 text-slate-950 shadow-amber-400/20',
      action: onPointage
    },
    {
      id: 'annonces',
      label: 'Annonces',
      icon: Bell,
      color: 'bg-blue-600 text-white shadow-blue-600/20',
      action: onAnnonces
    }
  ];

  return (
    <div className="w-full space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 font-mono">
          OPÉRATIONS RAPIDES
        </h3>
        <span className="text-[10px] font-bold uppercase font-mono px-2.5 py-0.5 rounded-full text-amber-800 bg-amber-100">
          AURA INVEST
        </span>
      </div>

      {/* Grid of 5 operations */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {operations.map((op) => {
          const Icon = op.icon;
          return (
            <button
              key={op.id}
              onClick={op.action}
              className="flex flex-col items-center justify-center space-y-2 p-2 sm:p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group min-w-0"
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${op.color} flex items-center justify-center group-hover:scale-110 transition-all shadow-xs shrink-0`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.25]" />
              </div>
              <span className="text-[11px] sm:text-xs md:text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors text-center leading-tight whitespace-nowrap overflow-visible">
                {op.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
