import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, History, Eye, EyeOff, Headphones, Sparkles } from 'lucide-react';
import { User } from '../types';

const AIRPODS_BG_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1200&auto=format&fit=crop&q=80',
    title: 'AirPods Pro — Audio Spatial & Réduction Active du Bruit'
  },
  {
    url: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=1200&auto=format&fit=crop&q=80',
    title: 'AirPods Max — Qualité Acoustique Studio'
  },
  {
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
    title: 'AirPods 4 — Performance Haute Définition'
  }
];

interface MainWalletCardProps {
  user: User;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenHistory: () => void;
  onOpenSupport?: () => void;
}

export const MainWalletCard: React.FC<MainWalletCardProps> = ({
  user,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenHistory,
  onOpenSupport
}) => {
  const [hideBalance, setHideBalance] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  // Auto-rotate 3 AirPods images every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % AIRPODS_BG_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currencySymbol = 'FCFA';

  return (
    <div className="w-full bg-gradient-to-br from-[#270b42] via-[#1a072d] to-[#10031d] text-white rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-4 border-2 border-pink-500/30 shadow-2xl shadow-purple-950/50">
      
      {/* 3 Rotating AirPods Background Images Layer - High Visibility */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {AIRPODS_BG_IMAGES.map((img, idx) => (
          <div
            key={img.url}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 transform scale-105 ${
              idx === bgIndex ? 'opacity-40' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${img.url}')` }}
          />
        ))}
        {/* Soft Rose-Violet Gradient Overlay to preserve text contrast while keeping images vivid */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#10031d] via-[#1a072d]/80 to-[#270b42]/60" />
      </div>

      {/* Header Row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold border border-pink-500/40 shadow-xs backdrop-blur-md">
            <CreditCard className="w-4.5 h-4.5 stroke-[2.5px]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-pink-300 font-mono flex items-center space-x-1">
              <span>TABLEAU DE BORD & PORTEFEUILLE</span>
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Portefeuille Principal
            </h3>
          </div>
        </div>

        {/* Action icons row */}
        <div className="flex items-center space-x-2">
          {/* Headphones Service Client Button */}
          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="w-8 h-8 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 border border-pink-500/40 backdrop-blur-md"
              title="Service Client"
            >
              <Headphones className="w-4 h-4 stroke-[2.2]" />
            </button>
          )}

          {/* Secured Badge */}
          <div className="flex items-center space-x-1 text-pink-200 bg-[#2b0c47]/80 border border-pink-500/40 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono shadow-xs backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
            <span>Sécurisé</span>
          </div>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="w-8 h-8 rounded-full bg-[#2b0c47]/80 hover:bg-[#3d1264] text-pink-200 flex items-center justify-center transition-all cursor-pointer border border-pink-500/40 backdrop-blur-md"
            title="Historique des transactions"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Privacy Eye Toggle */}
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="w-8 h-8 rounded-full bg-[#2b0c47]/80 hover:bg-[#3d1264] text-pink-200 flex items-center justify-center transition-all cursor-pointer border border-pink-500/40 backdrop-blur-md"
            title={hideBalance ? "Afficher le solde" : "Masquer le solde"}
          >
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Active Image Tag Banner */}
      <div className="relative z-10 pt-1">
        <span className="inline-flex items-center space-x-1.5 bg-[#170526]/80 border border-pink-500/30 text-pink-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-pink-400" />
          <span>{AIRPODS_BG_IMAGES[bgIndex].title}</span>
        </span>
      </div>

      {/* Available Balance Display */}
      <div className="relative z-10 py-1 flex items-end justify-between">
        <div>
          <span className="text-xs text-pink-200/80 font-medium block mb-1">
            Solde disponible
          </span>
          <div className="flex items-center space-x-3">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono drop-shadow-md">
              {hideBalance ? '••••••••' : user.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            </span>
            <span className="bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 text-white font-black px-3 py-1 rounded-xl text-xs sm:text-sm tracking-wide shadow-lg shadow-pink-500/25 border border-pink-400/40">
              {currencySymbol}
            </span>
          </div>
        </div>

        {/* 3 Dots Image Switcher Indicator */}
        <div className="flex items-center space-x-1.5 pb-1 bg-[#170526]/80 px-2.5 py-1 rounded-full border border-pink-500/30 backdrop-blur-md">
          {AIRPODS_BG_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setBgIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === bgIndex ? 'w-5 bg-gradient-to-r from-pink-400 to-purple-400' : 'w-2 bg-pink-300/30 hover:bg-pink-300/60'
              }`}
              title={`Vue AirPods ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
