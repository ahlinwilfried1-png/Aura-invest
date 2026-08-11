import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, History, Eye, EyeOff, Headphones, Sparkles } from 'lucide-react';
import { User } from '../types';

const AGRI_BG_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&auto=format&fit=crop&q=80',
    title: 'Technologie & Drones Nutrien'
  },
  {
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?w=1200&auto=format&fit=crop&q=80',
    title: 'Engrais & Nutrition des Cultures'
  },
  {
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80',
    title: 'Tracteurs & Récolte Agricole'
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

  // Auto-rotate 3 agricultural images every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % AGRI_BG_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const isCameroon = Boolean(
    user.country?.toLowerCase().includes('cameroun') || 
    user.country?.toLowerCase().includes('cm') || 
    user.phone?.startsWith('+237') || 
    user.withdrawalCountry === 'CM'
  );
  const currencySymbol = isCameroon ? 'XAF' : 'XOF';

  return (
    <div className="w-full bg-slate-950 text-white rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-4 border-2 border-slate-800 shadow-xl">
      
      {/* 3 Rotating Agricultural Background Images Layer - High Visibility */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {AGRI_BG_IMAGES.map((img, idx) => (
          <div
            key={img.url}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 transform scale-105 ${
              idx === bgIndex ? 'opacity-70' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${img.url}')` }}
          />
        ))}
        {/* Soft Dark Slate Gradient Overlay to preserve text contrast while keeping images vivid */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
      </div>

      {/* Header Row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30 shadow-xs backdrop-blur-md">
            <CreditCard className="w-4.5 h-4.5 stroke-[2.5px]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono flex items-center space-x-1">
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
              className="w-8 h-8 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 border border-amber-400/40 backdrop-blur-md"
              title="Service Client"
            >
              <Headphones className="w-4 h-4 stroke-[2.2]" />
            </button>
          )}

          {/* Secured Badge */}
          <div className="flex items-center space-x-1 text-slate-200 bg-slate-900/80 border border-slate-700/60 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono shadow-2xs backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Sécurisé</span>
          </div>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 flex items-center justify-center transition-all cursor-pointer border border-slate-700/60 backdrop-blur-md"
            title="Historique des transactions"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Privacy Eye Toggle */}
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 flex items-center justify-center transition-all cursor-pointer border border-slate-700/60 backdrop-blur-md"
            title={hideBalance ? "Afficher le solde" : "Masquer le solde"}
          >
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Active Image Tag Banner */}
      <div className="relative z-10 pt-1">
        <span className="inline-flex items-center space-x-1.5 bg-black/60 border border-amber-400/30 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{AGRI_BG_IMAGES[bgIndex].title}</span>
        </span>
      </div>

      {/* Available Balance Display */}
      <div className="relative z-10 py-1 flex items-end justify-between">
        <div>
          <span className="text-xs text-slate-300 font-medium block mb-1">
            Solde disponible
          </span>
          <div className="flex items-center space-x-3">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono drop-shadow-md">
              {hideBalance ? '••••••••' : user.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            </span>
            <span className="bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-xl text-xs sm:text-sm tracking-wide shadow-md border border-amber-300">
              {currencySymbol}
            </span>
          </div>
        </div>

        {/* 3 Dots Image Switcher Indicator */}
        <div className="flex items-center space-x-1.5 pb-1 bg-black/60 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-md">
          {AGRI_BG_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setBgIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === bgIndex ? 'w-5 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              title={`Vue agricole ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
