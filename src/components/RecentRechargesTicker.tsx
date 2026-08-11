import React from 'react';
import { Megaphone, ArrowUpRight } from 'lucide-react';

interface WithdrawalItem {
  id: string;
  phone: string;
  amount: string;
  method: string;
  timeAgo: string;
}

const LIVE_WITHDRAWALS: WithdrawalItem[] = [
  { id: 'w1', phone: '97****118', amount: '50 000 XOF', method: 'Orange Money', timeAgo: "à l'instant" },
  { id: 'w2', phone: '65****209', amount: '120 000 XOF', method: 'Moov Money', timeAgo: 'il y a 1 min' },
  { id: 'w3', phone: '07****381', amount: '25 000 XOF', method: 'MTN Mobile', timeAgo: 'il y a 2 min' },
  { id: 'w4', phone: '05****882', amount: '75 000 XOF', method: 'Wave / Orange', timeAgo: 'il y a 2 min' },
  { id: 'w5', phone: '77****904', amount: '150 000 XOF', method: 'Orange Money', timeAgo: 'il y a 3 min' },
  { id: 'w6', phone: '01****512', amount: '30 000 XOF', method: 'Moov Money', timeAgo: 'il y a 4 min' },
  { id: 'w7', phone: '90****663', amount: '200 000 XOF', method: 'MTN Mobile', timeAgo: 'il y a 5 min' },
  { id: 'w8', phone: '05****411', amount: '85 000 XOF', method: 'Orange Money', timeAgo: 'il y a 6 min' },
];

export const RecentRechargesTicker: React.FC = () => {
  return (
    <div className="w-full bg-white text-slate-900 py-2 px-3 flex items-center space-x-2.5 overflow-hidden border-b border-slate-200 shadow-2xs">
      {/* Badge avec Megaphone */}
      <div className="flex-shrink-0 flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-600 px-2 py-1 rounded-md">
        <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
      </div>

      {/* Marquee de défilement sur fond blanc */}
      <div className="flex-1 overflow-hidden relative">
        <div className="inline-flex items-center whitespace-nowrap animate-marquee text-xs font-mono">
          {LIVE_WITHDRAWALS.concat(LIVE_WITHDRAWALS).map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="inline-flex items-center space-x-2 mr-8 text-slate-900">
              <span className="font-extrabold text-slate-900">{item.phone}</span>
              <span className="inline-flex items-center space-x-1 text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                <ArrowUpRight className="w-3 h-3 text-amber-600 shrink-0" />
                <span>+{item.amount}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                ({item.method} • {item.timeAgo})
              </span>
              <span className="text-slate-300 ml-3">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
