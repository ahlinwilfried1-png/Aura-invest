import React from 'react';
import { Megaphone, X, Calendar } from 'lucide-react';

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationText: string | null;
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({
  isOpen,
  onClose,
  notificationText
}) => {
  if (!isOpen) return null;

  const announcements = [
    {
      id: 'ann-1',
      title: '🚀 Lancement Officiel de la Gamme Produits Bien-être VIP',
      date: 'Aujourd\'hui',
      content: notificationText || 'Profitez de nos 10 produits de bien-être haut de gamme avec des retours sur investissement quotidiens garantis. Rechargez votre compte pour démarrer dès maintenant !',
      badge: 'Nouveau'
    },
    {
      id: 'ann-2',
      title: '⚡ Recharges et Retraits Instantanés 24h/7j',
      date: 'Hier',
      content: 'Nos partenariats avec Orange Money, MTN Mobile Money, Moov Money et Mixx By Yas garantissent le traitement fluide de toutes vos transactions en moins de 10 minutes.',
      badge: 'Info'
    },
    {
      id: 'ann-3',
      title: '🎁 Programme de Parrainage & Commissions jusqu\'à 30%',
      date: 'Il y a 3 jours',
      content: 'Invitez vos proches avec votre code unique et touchez 20% sur le niveau 1, 7% sur le niveau 2 et 3% sur le niveau 3 sur chaque souscription de produit.',
      badge: 'Bonus'
    }
  ];

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

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
            <Megaphone className="w-5 h-5 stroke-[2.5px]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-800 block">
              BULLETIN D'INFORMATIONS
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Annonces & Notifications
            </h3>
          </div>
        </div>

        {/* Announcements list */}
        <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
          {announcements.map((ann) => (
            <div key={ann.id} className="space-y-2 py-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider">
                  {ann.badge}
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                  <Calendar className="w-3 h-3 inline" />
                  <span>{ann.date}</span>
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {ann.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {ann.content}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
        >
          Compris, fermer
        </button>
      </div>
    </div>
  );
};
