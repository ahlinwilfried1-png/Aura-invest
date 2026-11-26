import React from 'react';
import { ChevronLeft, MessageCircle, Users, Headset } from 'lucide-react';

interface ServiceClientViewProps {
  onBack: () => void;
  whatsappUrl?: string;
  whatsappGroupUrl?: string;
}

export const ServiceClientView: React.FC<ServiceClientViewProps> = ({
  onBack,
  whatsappUrl = "https://whatsapp.com/channel/0029VbE6h2OKAwEdLgywe13M",
  whatsappGroupUrl = "https://whatsapp.com/channel/0029VbE6h2OKAwEdLgywe13M"
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
          Service client WhatsApp
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-6">

        {/* 2. WhatsApp Channels List Card */}
        <div className="bg-[#1a082b] border border-pink-500/25 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
          
          {/* Row 1: WhatsApp Gold Speed Official Channel */}
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-white block truncate">
                  Chaîne WhatsApp Gold Speed
                </span>
                <span className="text-[10px] text-emerald-300 font-medium block">
                  Canal officiel & annonces exclusives
                </span>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0 border border-emerald-400/40 flex items-center space-x-1"
            >
              <span>Rejoindre</span>
            </a>
          </div>

          {/* Row 2: WhatsApp Community Group */}
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-white block truncate">
                  Groupe de discussion WhatsApp
                </span>
                <span className="text-[10px] text-emerald-300 font-medium block">
                  Discussions & entraide entre membres
                </span>
              </div>
            </div>

            <a
              href={whatsappGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0 border border-emerald-400/40"
            >
              Rejoindre
            </a>
          </div>

          {/* Row 3: WhatsApp Support Service */}
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Headset className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-white block truncate">
                  Service Client WhatsApp 24/7
                </span>
                <span className="text-[10px] text-emerald-300 font-medium block">
                  Assistance immédiate sur WhatsApp
                </span>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0 border border-emerald-400/40"
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
                Pour toute question concernant notre plateforme, veuillez contacter notre service client officiel sur WhatsApp.
              </p>
            </div>

            {/* Notice paragraph */}
            <p className="text-pink-200/80 pt-1 leading-relaxed">
              Si notre service client ne répond pas immédiatement à votre message WhatsApp, veuillez patienter quelques instants.
            </p>

            {/* Rule 3 */}
            <div className="flex items-start space-x-2.5 pt-1">
              <div className="w-5 h-5 bg-pink-500/25 border border-pink-500/40 text-pink-300 font-bold text-[11px] rounded flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                3
              </div>
              <p className="text-white">
                Problèmes de dépôt : si votre dépôt n'apparaît pas sur votre compte, veuillez envoyer le reçu de paiement au service client WhatsApp dès que possible.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
