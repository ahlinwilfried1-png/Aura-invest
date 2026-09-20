import React from 'react';
import { ChevronLeft, Send, MessageCircle } from 'lucide-react';

interface ServiceClientViewProps {
  onBack: () => void;
  telegramUrl?: string;
}

export const ServiceClientView: React.FC<ServiceClientViewProps> = ({
  onBack,
  telegramUrl = "https://t.me/+Nml17Ji3CY8wYWQ8"
}) => {
  return (
    <div className="min-h-screen bg-[#0d0417] text-white pb-20 font-sans animate-fadeIn">
      
      {/* 1. Header with back arrow and title */}
      <div className="sticky top-0 bg-[#120422] border-b border-pink-500/20 px-4 py-3.5 flex items-center justify-between z-30 shadow-md">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 text-pink-300 hover:text-white hover:bg-pink-500/20 rounded-full transition-all cursor-pointer"
          title="Retour"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight text-center flex-1 pr-6">
          Service client
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-6">

        {/* 2. Channels List Card */}
        <div className="bg-[#1a082b] border border-pink-500/25 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
          
          {/* Row 1: Telegram Channel */}
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Send className="w-5 h-5 -ml-0.5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                Chaîne officielle Telegram
              </span>
            </div>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0 border border-pink-300/30"
            >
              Rejoindre
            </a>
          </div>

          {/* Row 2: Telegram Group */}
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Send className="w-5 h-5 -ml-0.5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                Canal Telegram Communauté
              </span>
            </div>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0 border border-pink-300/30"
            >
              Rejoindre
            </a>
          </div>

          {/* Row 3: Telegram Service */}
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Send className="w-5 h-5 -ml-0.5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white truncate">
                Service Client Telegram 24/7
              </span>
            </div>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0 border border-pink-300/30"
            >
              Contacter
            </a>
          </div>

        </div>

        {/* 3. "Règles du client" Section */}
        <div className="bg-[#1a082b] border border-pink-500/25 rounded-3xl p-5 shadow-lg space-y-4">
          
          {/* Centered section title with lines */}
          <div className="flex items-center justify-center space-x-3 py-1">
            <div className="h-[1px] bg-pink-500/30 flex-1 max-w-[60px]" />
            <h2 className="text-xs sm:text-sm font-bold text-pink-300 tracking-tight">
              Règles du client
            </h2>
            <div className="h-[1px] bg-pink-500/30 flex-1 max-w-[60px]" />
          </div>

          {/* Rules items list matching layout and exact text */}
          <div className="space-y-4 text-xs sm:text-sm font-medium text-pink-200/90 leading-relaxed">
            
            {/* Rule 1 */}
            <div className="flex items-start space-x-2.5">
              <div className="w-5 h-5 bg-pink-500/25 border border-pink-500/40 text-pink-300 font-bold text-[11px] rounded flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                1
              </div>
              <p className="text-white">
                Horaires du service : de 9h30 à 21h30 tous les jours. Nous sommes là pour vous aider à tout moment.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="flex items-start space-x-2.5">
              <div className="w-5 h-5 bg-pink-500/25 border border-pink-500/40 text-pink-300 font-bold text-[11px] rounded flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                2
              </div>
              <p className="text-white">
                Pour toute question concernant notre plateforme, veuillez contacter notre service client en ligne.
              </p>
            </div>

            {/* Notice paragraph */}
            <p className="text-pink-200/80 pt-1 leading-relaxed">
              Si notre service client en ligne ne répond pas immédiatement à votre message, veuillez patienter.
            </p>

            {/* Rule 3 */}
            <div className="flex items-start space-x-2.5 pt-1">
              <div className="w-5 h-5 bg-pink-500/25 border border-pink-500/40 text-pink-300 font-bold text-[11px] rounded flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                3
              </div>
              <p className="text-white">
                Problèmes de dépôt : si votre dépôt n'apparaît pas sur votre compte, veuillez envoyer le reçu de paiement au service client dès que possible. Quel que soit le problème rencontré lors de l'utilisation de la plateforme.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
