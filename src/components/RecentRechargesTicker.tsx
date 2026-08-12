import React from 'react';
import { Megaphone, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface WithdrawalItem {
  id: string;
  phone: string;
  amount: string;
  method: string;
  status: string;
  timeAgo: string;
  vipBadge?: string;
}

const LIVE_WITHDRAWALS: WithdrawalItem[] = [
  { id: 'w1', phone: '+228 91****34', amount: '15 000 XOF', method: 'T-Money', status: 'Paiement Effectué', timeAgo: "à l'instant", vipBadge: 'VIP 2' },
  { id: 'w2', phone: '+225 07****89', amount: '50 000 XOF', method: 'Orange Money', status: 'Retrait Validé', timeAgo: 'il y a 1 min', vipBadge: 'VIP 4' },
  { id: 'w3', phone: '+229 97****56', amount: '25 000 XOF', method: 'Moov Money', status: 'Transfert Réussi', timeAgo: 'il y a 2 min', vipBadge: 'VIP 3' },
  { id: 'w4', phone: '+228 90****12', amount: '4 000 XOF', method: 'T-Money', status: 'Paiement Effectué', timeAgo: 'il y a 2 min', vipBadge: 'VIP 1' },
  { id: 'w5', phone: '+223 76****44', amount: '100 000 XOF', method: 'Orange Money', status: 'Succès 100%', timeAgo: 'il y a 3 min', vipBadge: 'VIP 5' },
  { id: 'w6', phone: '+226 70****88', amount: '150 000 XOF', method: 'Coris Money', status: 'Paiement Effectué', timeAgo: 'il y a 4 min', vipBadge: 'VIP 6' },
  { id: 'w7', phone: '+221 77****01', amount: '200 000 XOF', method: 'Wave', status: 'Retrait Validé', timeAgo: 'il y a 5 min', vipBadge: 'VIP 7' },
  { id: 'w8', phone: '+237 69****67', amount: '300 000 XOF', method: 'MTN Mobile', status: 'Transfert Réussi', timeAgo: 'il y a 5 min', vipBadge: 'VIP 8' },
  { id: 'w9', phone: '+225 05****21', amount: '500 000 XOF', method: 'Wave / Orange', status: 'Paiement Effectué', timeAgo: 'il y a 6 min', vipBadge: 'VIP 9' },
  { id: 'w10', phone: '+228 92****90', amount: '800 000 XOF', method: 'T-Money', status: 'Retrait Validé', timeAgo: 'il y a 7 min', vipBadge: 'VIP 10' },
  { id: 'w11', phone: '+227 96****15', amount: '15 000 XOF', method: 'Airtel Money', status: 'Succès 100%', timeAgo: 'il y a 8 min', vipBadge: 'VIP 2' },
  { id: 'w12', phone: '+228 93****82', amount: '25 000 XOF', method: 'Moov Money', status: 'Paiement Effectué', timeAgo: 'il y a 9 min', vipBadge: 'VIP 3' },
];

export const RecentRechargesTicker: React.FC<{ notificationText?: string }> = () => {
  return (
    <div className="w-full bg-white text-slate-800 py-2 px-3 flex items-center space-x-2.5 overflow-hidden border-b border-slate-200/90 shadow-2xs z-30">
      {/* Badge avec Megaphone */}
      <div className="shrink-0 flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-1 rounded-lg">
        <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0 stroke-[2.5]" />
        <span className="ml-1 text-[10px] font-black uppercase text-emerald-800 tracking-wider">RETRAITS</span>
      </div>

      {/* Marquee de défilement sur fond blanc */}
      <div className="flex-1 overflow-hidden relative">
        <div className="inline-flex items-center whitespace-nowrap animate-marquee text-xs font-mono">
          {LIVE_WITHDRAWALS.concat(LIVE_WITHDRAWALS).map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="inline-flex items-center space-x-2 mr-8 text-slate-800">
              <span className="font-extrabold text-slate-900">{item.phone}</span>
              
              {item.vipBadge && (
                <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-bold">
                  {item.vipBadge}
                </span>
              )}

              <span className="inline-flex items-center space-x-1 text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                <ArrowUpRight className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>+{item.amount}</span>
              </span>

              <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                <span>{item.status} ({item.method} • {item.timeAgo})</span>
              </span>

              <span className="text-slate-300 ml-3">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

