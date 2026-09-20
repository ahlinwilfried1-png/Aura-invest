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
  { id: 'w1', phone: '+237 67****34', amount: '15 000 XOF', method: 'MTN Mobile', status: 'Paiement Effectué', timeAgo: "à l'instant", vipBadge: 'VIP 2' },
  { id: 'w2', phone: '+237 69****89', amount: '50 000 XOF', method: 'Orange Money', status: 'Retrait Validé', timeAgo: 'il y a 1 min', vipBadge: 'VIP 4' },
  { id: 'w3', phone: '+237 65****56', amount: '25 000 XOF', method: 'MTN Mobile', status: 'Transfert Réussi', timeAgo: 'il y a 2 min', vipBadge: 'VIP 3' },
  { id: 'w4', phone: '+237 68****12', amount: '4 000 XOF', method: 'Orange Money', status: 'Paiement Effectué', timeAgo: 'il y a 2 min', vipBadge: 'VIP 1' },
  { id: 'w5', phone: '+237 69****44', amount: '100 000 XOF', method: 'MTN Mobile', status: 'Succès 100%', timeAgo: 'il y a 3 min', vipBadge: 'VIP 5' },
  { id: 'w6', phone: '+237 67****88', amount: '150 000 XOF', method: 'Orange Money', status: 'Paiement Effectué', timeAgo: 'il y a 4 min', vipBadge: 'VIP 6' },
  { id: 'w7', phone: '+237 65****01', amount: '200 000 XOF', method: 'MTN Mobile', status: 'Retrait Validé', timeAgo: 'il y a 5 min', vipBadge: 'VIP 7' },
  { id: 'w8', phone: '+237 69****67', amount: '300 000 XOF', method: 'Orange Money', status: 'Transfert Réussi', timeAgo: 'il y a 5 min', vipBadge: 'VIP 8' },
  { id: 'w9', phone: '+237 68****21', amount: '400 000 XOF', method: 'MTN Mobile', status: 'Paiement Effectué', timeAgo: 'il y a 6 min', vipBadge: 'VIP 9' },
  { id: 'w10', phone: '+237 67****90', amount: '250 000 XOF', method: 'Orange Money', status: 'Retrait Validé', timeAgo: 'il y a 7 min', vipBadge: 'VIP 8' },
  { id: 'w11', phone: '+237 69****15', amount: '15 000 XOF', method: 'MTN Mobile', status: 'Succès 100%', timeAgo: 'il y a 8 min', vipBadge: 'VIP 2' },
  { id: 'w12', phone: '+237 65****82', amount: '25 000 XOF', method: 'Orange Money', status: 'Paiement Effectué', timeAgo: 'il y a 9 min', vipBadge: 'VIP 3' },
];

export const RecentRechargesTicker: React.FC<{ notificationText?: string }> = () => {
  return (
    <div className="w-full bg-[#160627] text-pink-100 py-2 px-3 flex items-center space-x-2.5 overflow-hidden border-b border-pink-500/20 shadow-md z-30">
      {/* Badge avec Megaphone */}
      <div className="shrink-0 flex items-center justify-center bg-pink-500/20 border border-pink-500/40 text-pink-300 px-2 py-1 rounded-lg">
        <Megaphone className="w-3.5 h-3.5 text-pink-400 shrink-0 stroke-[2.5]" />
        <span className="ml-1 text-[10px] font-black uppercase text-pink-200 tracking-wider">RETRAITS</span>
      </div>

      {/* Marquee de défilement sur fond rose-violet */}
      <div className="flex-1 overflow-hidden relative">
        <div className="inline-flex items-center whitespace-nowrap animate-marquee text-xs font-mono">
          {LIVE_WITHDRAWALS.concat(LIVE_WITHDRAWALS).map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="inline-flex items-center space-x-2 mr-8 text-pink-100">
              <span className="font-extrabold text-white">{item.phone}</span>
              
              {item.vipBadge && (
                <span className="text-[9px] bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/40 font-bold">
                  {item.vipBadge}
                </span>
              )}

              <span className="inline-flex items-center space-x-1 text-pink-300 font-extrabold bg-pink-950/60 border border-pink-500/40 px-2 py-0.5 rounded-md text-[11px]">
                <ArrowUpRight className="w-3 h-3 text-pink-400 shrink-0" />
                <span>+{item.amount}</span>
              </span>

              <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                <span>{item.status} ({item.method} • {item.timeAgo})</span>
              </span>

              <span className="text-pink-500/40 ml-3">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

