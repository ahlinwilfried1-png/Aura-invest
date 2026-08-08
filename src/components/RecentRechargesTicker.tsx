import React from 'react';
import { Volume2 } from 'lucide-react';

interface RechargeItem {
  id: string;
  phone: string;
  amount: string;
  timeAgo: string;
}

const RECENT_RECHARGES: RechargeItem[] = [
  { id: 'r1', phone: '****420', amount: '1,500 XOF', timeAgo: 'à l\'instant' },
  { id: 'r2', phone: '65****209', amount: '10,000 XOF', timeAgo: 'il y a 1 min' },
  { id: 'r3', phone: '07****381', amount: '3,000 XOF', timeAgo: 'il y a 2 min' },
  { id: 'r4', phone: '97****118', amount: '50,000 XOF', timeAgo: 'il y a 3 min' },
  { id: 'r5', phone: '05****882', amount: '15,000 XOF', timeAgo: 'il y a 4 min' },
  { id: 'r6', phone: '77****904', amount: '100,000 XOF', timeAgo: 'il y a 5 min' },
  { id: 'r7', phone: '01****512', amount: '5,000 XOF', timeAgo: 'il y a 6 min' },
  { id: 'r8', phone: '90****663', amount: '25,000 XOF', timeAgo: 'il y a 7 min' },
];

export const RecentRechargesTicker: React.FC = () => {
  return (
    <div className="w-full py-2.5 overflow-hidden relative flex items-center space-x-3">
      <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-800">
        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="flex items-center space-x-8 animate-marquee whitespace-nowrap text-xs font-mono">
          {RECENT_RECHARGES.concat(RECENT_RECHARGES).map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="inline-flex items-center space-x-2 text-slate-700">
              <span className="font-bold text-amber-600">{item.phone}</span>
              <span className="text-slate-500">rechargé</span>
              <span className="font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
