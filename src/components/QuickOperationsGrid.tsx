import React from 'react';
import { CreditCard, ArrowUpRight, Calendar, Coins, Bell } from 'lucide-react';

interface QuickOperationsGridProps {
  onRecharger: () => void;
  onRetirer: () => void;
  onPointage: () => void;
  onTasks?: () => void;
  onAnnonces?: () => void;
  onGuide?: () => void;
  onChat?: () => void;
  hasUnreadAnnouncements?: boolean;
  unreadAnnouncementsCount?: number;
  unclaimedTasksCount?: number;
  unreadChatCount?: number;
}

export const QuickOperationsGrid: React.FC<QuickOperationsGridProps> = ({
  onRecharger,
  onRetirer,
  onPointage,
  onTasks,
  onAnnonces,
  hasUnreadAnnouncements,
  unreadAnnouncementsCount = 0,
  unclaimedTasksCount = 0,
}) => {
  const operations = [
    {
      id: 'recharger',
      label: 'Recharger',
      icon: CreditCard,
      color: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-500/30',
      action: onRecharger
    },
    {
      id: 'retirer',
      label: 'Retirer',
      icon: ArrowUpRight,
      color: 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-purple-500/30',
      action: onRetirer
    },
    {
      id: 'pointage',
      label: 'Pointage',
      icon: Calendar,
      color: 'bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-fuchsia-500/30',
      action: onPointage
    },
    {
      id: 'tasks',
      label: 'Tâches',
      icon: Coins,
      color: 'bg-gradient-to-br from-amber-500 via-pink-600 to-purple-700 text-white shadow-amber-500/30',
      action: onTasks || onAnnonces || (() => {}),
      unreadCount: unclaimedTasksCount,
      hasBadge: unclaimedTasksCount > 0
    }
  ];

  return (
    <div className="w-full space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-pink-100 font-mono">
          OPÉRATIONS RAPIDES
        </h3>
        <span className="text-[10px] font-bold uppercase font-mono px-2.5 py-0.5 rounded-full text-pink-300 bg-pink-500/20 border border-pink-500/30">
          AIRPODS
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
              className="flex flex-col items-center justify-center space-y-1.5 p-2 sm:p-3 bg-gradient-to-b from-[#210c37] to-[#150524] rounded-2xl border border-pink-500/25 shadow-lg shadow-black/40 hover:border-pink-400 active:scale-95 transition-all cursor-pointer group min-w-0"
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${op.color} flex items-center justify-center group-hover:scale-105 transition-all shadow-md shrink-0 relative`}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.25]" />
                {displayCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 bg-pink-600 text-white font-black text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-[#150524] animate-bounce shadow-xs z-10">
                    {displayCount}
                  </span>
                ) : op.hasBadge ? (
                  <span className="absolute -top-1 -right-1 bg-pink-600 w-3.5 h-3.5 rounded-full border-2 border-[#150524] animate-pulse" />
                ) : null}
              </div>
              <span className="text-[11px] sm:text-xs md:text-sm font-black text-pink-100 group-hover:text-pink-300 transition-colors text-center leading-tight whitespace-nowrap overflow-visible">
                {op.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
