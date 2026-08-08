/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Users, 
  ArrowUpRight, 
  CreditCard, 
  MessageCircle, 
  Award,
  ChevronRight,
  Sparkles,
  DollarSign,
  CheckCircle,
  PhoneCall
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  liveStats: {
    membersCount: number;
    depositsSum: number;
    withdrawalsSum: number;
    revenueDistributed: number;
  };
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, liveStats }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative overflow-hidden font-sans">
      {/* Floating WhatsApp Sticky Action */}
      <a 
        href="https://wa.me/22501010101" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-xl shadow-green-500/20 flex items-center justify-center transition-transform hover:scale-110 group cursor-pointer"
        id="whatsapp-floater"
      >
        <MessageCircle className="w-6 h-6 fill-white text-green-500" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold pl-0 group-hover:pl-2">
          Support WhatsApp
        </span>
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3.5 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20">
              <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5px]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                AURA <span className="text-amber-700 font-extrabold">INVEST</span>
              </span>
              <span className="block text-[9px] tracking-[0.2em] uppercase font-mono text-amber-800 font-bold">FINTECH VIP</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              onClick={onLogin}
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-amber-700 transition-colors py-2 px-3 rounded-xl hover:bg-slate-100"
              id="header-login-btn"
            >
              Connexion
            </button>
            <button 
              onClick={onStart}
              className="bg-amber-500 text-slate-950 text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider"
              id="header-start-btn"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col">
        <section className="px-4 py-12 sm:py-20 max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-800 mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>La plateforme d'investissement & bien-être de référence en Afrique</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6">
            Investissez dans des Produits de Bien-être & <span className="text-amber-700 underline decoration-amber-400 decoration-wavy underline-offset-8">Générez des Revenus Quotidiens</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
            Profitez de nos formules de nutrition certifiées. Rechargez via vos opérateurs Mobile Money préférés (Orange, MTN, Moov, Mixx By Yas) et réclamez vos rendements toutes les 24h.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-12">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Commencer Maintenant</span>
              <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
            </button>
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Espace Membre</span>
            </button>
          </div>

          {/* Key Guarantee Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-xs font-bold text-slate-700">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Retraits 24h/7j</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center justify-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Capital Sécurisé</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center justify-center space-x-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Recharge Instantanée</span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center justify-center space-x-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>20% Parrainage</span>
            </div>
          </div>
        </section>

        {/* Live Metrics Grid */}
        <section className="bg-white border-y border-slate-200 py-10 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">Membres Inscrits</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                {liveStats.membersCount.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">Volume Rechargé</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
                {liveStats.depositsSum.toLocaleString()} FCFA
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">Retraits Effectués</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-700">
                {liveStats.withdrawalsSum.toLocaleString()} FCFA
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block mb-1">Revenus Distribués</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-blue-700">
                {liveStats.revenueDistributed.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-bold text-slate-800">© 2026 AURA INVEST – Nutrien Ag Solutions. Tous droits réservés.</p>
          <p>Plateforme sécurisée de micro-investissement et distribution de produits de bien-être.</p>
        </div>
      </footer>
    </div>
  );
};
