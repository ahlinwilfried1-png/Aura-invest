import React from 'react';
import { CreditCard, ArrowUpRight, Calendar, Bell } from 'lucide-react';

interface QuickOperationsGridProps {
  onRecharger: () => void;
  onRetirer: () => void;
  onPointage: () => void;
  onAnnonces: () => void;
  onGuide?: () => void;
  onChat?: () => void;
  hasUnreadAnnouncements?: boolean;
  unreadAnnouncementsCount?: number;
  unreadChatCount?: number;
}

export const QuickOperationsGrid: React.FC<QuickOperationsGridProps> = ({
  onRecharger,
  onRetirer,
  onPointage,
  onAnnonces,
  hasUnreadAnnouncements,
  unreadAnnouncementsCount = 0,
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
      color: 'bg-slate-900 text-amber-400 shadow-slate-900/20',
      action: onRetirer
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
      action: onAnnonces,
      unreadCount: unreadAnnouncementsCount || (hasUnreadAnnouncements ? 1 : 0),
      hasBadge: hasUnreadAnnouncements
    }
  ];

  return (
    <div className="w-full space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono">
          OPÉRATIONS RAPIDES
        </h3>
        <span className="text-[10px] font-bold uppercase font-mono px-2.5 py-0.5 rounded-full text-amber-800 bg-amber-100">
          NUTRIEN
        </span>
      </div>

      {/* Grid of operations */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {operations.map((op) => {
          const Icon = op.icon;
          const displayCount = op.unreadCount || 0;
          return (
            <button
              key={op.id}
              onClick={op.action}
              className="flex flex-col items-center justify-center space-y-1.5 p-1.5 sm:p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-400 hover:shadow-sm active:scale-95 transition-all cursor-pointer group min-w-0"
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${op.color} flex items-center justify-center group-hover:scale-105 transition-all shadow-xs shrink-0 relative`}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.25]" />
                {displayCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-black text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-xs z-10">
                    {displayCount}
                  </span>
                ) : op.hasBadge ? (
                  <span className="absolute -top-1 -right-1 bg-red-600 w-3.5 h-3.5 rounded-full border-2 border-white animate-pulse" />
                ) : null}
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
