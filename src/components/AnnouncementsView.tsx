import React from 'react';
import { ArrowLeft, Megaphone, Calendar, Sparkles, ShieldCheck, Gift } from 'lucide-react';

interface AnnouncementsViewProps {
  notificationText: string | null;
  onBack: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  notificationText,
  onBack
}) => {
  const announcements = [
    {
      id: 'ann-1',
      title: '🚀 Lancement Officiel de la Gamme Produits Bien-être VIP',
      date: 'Aujourd\'hui',
      content: notificationText || 'Profitez de nos 10 produits de bien-être haut de gamme avec des retours sur investissement quotidiens garantis. Rechargez votre compte pour démarrer dès maintenant !',
      badge: 'Nouveau',
      icon: Sparkles
    },
    {
      id: 'ann-2',
      title: '⚡ Recharges et Retraits Instantanés 24h/7j',
      date: 'Hier',
      content: 'Nos partenariats avec Orange Money, MTN Mobile Money, Moov Money et Mixx By Yas garantissent le traitement fluide de toutes vos transactions en moins de 10 minutes.',
      badge: 'Info',
      icon: ShieldCheck
    },
    {
      id: 'ann-3',
      title: '🎁 Programme de Parrainage & Commissions jusqu\'à 30%',
      date: 'Il y a 3 jours',
      content: 'Invitez vos proches avec votre code unique et touchez 20% sur le niveau 1, 7% sur le niveau 2 et 3% sur le niveau 3 sur chaque souscription de produit.',
      badge: 'Bonus',
      icon: Gift
    }
  ];

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6 pb-20">
      {/* Top Header / Navigation Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-700 hover:text-red-600 transition-colors font-bold text-sm cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>
        <span className="text-xs font-mono font-bold uppercase text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
          BULLETIN OFFICIEL
        </span>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center">
            <Megaphone className="w-6 h-6 stroke-[2.5px]" />
          </div>
          <span>Annonces & Communications Officielles</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Restez informé de toutes les mises à jour, nouveautés produits et bonus exclusifs AURA INVEST.
        </p>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => {
          const IconComponent = ann.icon;
          return (
            <div key={ann.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {ann.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 inline" />
                  <span>{ann.date}</span>
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug flex items-center space-x-2">
                <IconComponent className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>{ann.title}</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                {ann.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
