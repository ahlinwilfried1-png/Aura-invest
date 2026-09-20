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
  Send, 
  Award,
  ChevronRight,
  Sparkles,
  DollarSign,
  CheckCircle,
  Tag,
  Coins,
  Calendar,
  Layers,
  Crown,
  Gem,
  Star,
  Shield,
  Sprout,
  HandCoins,
  Leaf,
  CircleDollarSign
} from 'lucide-react';
import { OFFICIAL_INVESTMENT_PRODUCTS } from '../constants/products';

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
    <div className="min-h-screen bg-[#f8faf7] text-slate-900 flex flex-col relative overflow-hidden font-sans">
      {/* Floating Telegram Community Action */}
      <a 
        href="https://t.me/+Nml17Ji3CY8wYWQ8" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#0088cc] hover:bg-[#0077b5] text-white p-4 rounded-full shadow-2xl shadow-sky-600/30 flex items-center justify-center transition-transform hover:scale-110 group cursor-pointer"
        id="telegram-floater"
      >
        <Send className="w-6 h-6 -ml-0.5 text-white" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold pl-0 group-hover:pl-2">
          Chaîne Officielle Telegram
        </span>
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 px-4 py-3.5 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Sparkles className="w-5 h-5 text-white stroke-[2.5px]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-emerald-900">
                AIR<span className="text-amber-600 font-black">PODS</span>
              </span>
              <span className="block text-[8.5px] tracking-[0.22em] uppercase font-mono text-emerald-700 font-black">INVESTISSEMENT AUDIO VIP</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              onClick={onLogin}
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-800 transition-colors py-2 px-3.5 rounded-xl hover:bg-emerald-50 cursor-pointer"
              id="header-login-btn"
            >
              Connexion
            </button>
            <button 
              onClick={onStart}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs sm:text-sm font-black px-4 sm:px-5 py-2.5 rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider"
              id="header-start-btn"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section styled after AirPods platform */}
      <main className="flex-grow flex flex-col">
        {/* Banner with Background */}
        <section className="relative bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-800 text-white overflow-hidden py-12 sm:py-20 px-4">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="max-w-6xl mx-auto text-center relative z-10 space-y-6">
            {/* AIRPODS Header */}
            <div className="inline-flex flex-col items-center">
              <div className="flex items-center space-x-2 justify-center mb-1">
                <span className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-md">
                  AIR<span className="text-amber-400">PODS</span>
                </span>
                <div className="w-9 h-9 sm:w-14 sm:h-14 bg-gradient-to-tr from-amber-400 to-yellow-200 rounded-full border-2 border-amber-300 flex items-center justify-center shadow-lg shadow-amber-400/30">
                  <DollarSign className="w-5 h-5 sm:w-8 sm:h-8 text-emerald-950 stroke-[3px]" />
                </div>
              </div>
              <div className="inline-flex items-center space-x-2 bg-emerald-800/80 border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-300 shadow-inner">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>INVESTIR AUJOURD’HUI, RÉCOLTER DEMAIN !</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            <p className="text-emerald-100 text-sm sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              La plateforme officielle d'investissement AirPods à haut rendement au Cameroun 🇨🇲. Choisissez votre pack VIP, vos revenus tombent chaque 24h directement sur votre solde et sont retirables instantanément via Mobile Money (MTN Mobile Money & Orange Money Cameroun).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-2">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer hover:scale-105"
              >
                <span>Investir Maintenant</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
              </button>
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer backdrop-blur-xs"
              >
                <span>Accès Espace Client</span>
              </button>
            </div>
          </div>
        </section>

        {/* Live Metrics Grid */}
        <section className="bg-white border-b border-slate-200 py-8 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block mb-1">Membres Actifs</span>
              <span className="text-xl sm:text-3xl font-black font-mono text-emerald-950">
                {(Number(liveStats?.membersCount) || 0).toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block mb-1">Recharges Validées</span>
              <span className="text-xl sm:text-3xl font-black font-mono text-emerald-700">
                {(Number(liveStats?.depositsSum) || 0).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block mb-1">Retraits Payés</span>
              <span className="text-xl sm:text-3xl font-black font-mono text-amber-700">
                {(Number(liveStats?.withdrawalsSum) || 0).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block mb-1">Gains 24h Distribués</span>
              <span className="text-xl sm:text-3xl font-black font-mono text-blue-700">
                {(Number(liveStats?.revenueDistributed) || 0).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        </section>

        {/* OFFICIAL DUKE ENERGY PRICING TABLE SECTION */}
        <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          {/* Header Badge */}
          <div className="text-center mb-8">
            <div className="inline-block bg-[#0e3d1c] border-2 border-amber-400 text-white font-black text-xs sm:text-base md:text-lg uppercase px-6 sm:px-10 py-2.5 rounded-full shadow-lg tracking-wider font-mono">
              PLAN DUKE ENERGY — L'ÉNERGIE SOLAIRE À VOTRE PORTÉE
            </div>
            <p className="text-slate-600 text-xs sm:text-sm mt-3 font-medium">
              Formules à 15% par jour sur 40 jours avec versement automatique chaque 24h et retraits Mobile Money 7j/7.
            </p>
          </div>

          {/* Desktop Table matching the exact plans from image */}
          <div className="hidden md:block overflow-hidden bg-white border-2 border-emerald-900/20 rounded-3xl shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fef3c7] text-[#1c1917] border-b-2 border-amber-300 text-xs uppercase font-mono font-black">
                  <th className="py-4 px-6 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-800" />
                    <span>FORMULES</span>
                  </th>
                  <th className="py-4 px-6 text-center">
                    <span className="inline-flex items-center space-x-1 justify-center">
                      <Tag className="w-4 h-4 text-emerald-800" />
                      <span>PRIX</span>
                    </span>
                  </th>
                  <th className="py-4 px-6 text-center">
                    <span className="inline-flex items-center space-x-1 justify-center">
                      <Coins className="w-4 h-4 text-amber-700" />
                      <span>REVENU / JOUR (15%)</span>
                    </span>
                  </th>
                  <th className="py-4 px-6 text-center">
                    <span className="inline-flex items-center space-x-1 justify-center">
                      <Calendar className="w-4 h-4 text-emerald-800" />
                      <span>GAIN SUR 40 JOURS</span>
                    </span>
                  </th>
                  <th className="py-4 px-6 text-right">
                    <span className="inline-flex items-center space-x-1 justify-end">
                      <TrendingUp className="w-4 h-4 text-emerald-800" />
                      <span>TOTAL À 40 JOURS</span>
                    </span>
                  </th>
                  <th className="py-4 px-6 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm font-semibold">
                {OFFICIAL_INVESTMENT_PRODUCTS.map((item, idx) => {
                  const gain40 = item.gain40Days || (item.dailyGain * (item.duration || 40));
                  const total40 = item.totalGain || (item.price + gain40);
                  return (
                    <tr key={item.id || idx} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-200 text-amber-800 font-bold text-xs">
                            #{idx + 1}
                          </div>
                          <span className="font-extrabold text-slate-900 text-sm">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-bold font-mono text-base text-emerald-900">
                        {(Number(item.price) || 0).toLocaleString('fr-FR')} F
                      </td>
                      <td className="py-4 px-6 text-center font-black font-mono text-base text-emerald-700">
                        +{(Number(item.dailyGain) || 0).toLocaleString('fr-FR')} F
                      </td>
                      <td className="py-4 px-6 text-center font-black font-mono text-base text-amber-800">
                        {(Number(gain40) || 0).toLocaleString('fr-FR')} F
                      </td>
                      <td className="py-4 px-6 text-right font-black font-mono text-slate-950 text-base">
                        {(Number(total40) || 0).toLocaleString('fr-FR')} F
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={onStart}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs hover:scale-105"
                        >
                          Souscrire
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List with exact plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {OFFICIAL_INVESTMENT_PRODUCTS.map((item, idx) => {
              const gain40 = item.gain40Days || (item.dailyGain * (item.duration || 40));
              const total40 = item.totalGain || (item.price + gain40);
              return (
                <div key={item.id || idx} className="bg-white border-2 border-emerald-900/20 rounded-2xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center font-bold text-amber-800 text-xs">
                        #{idx + 1}
                      </div>
                      <span className="font-black text-slate-900 text-sm">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {item.badge || '15% / jour'}
                    </span>
                  </div>
                  
                  <div className="bg-amber-50/60 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs border border-amber-200/60 font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold font-sans">Prix</span>
                      <span className="font-black text-emerald-950 text-sm">{(Number(item.price) || 0).toLocaleString('fr-FR')} F</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold font-sans">15% / Jour</span>
                      <span className="font-black text-emerald-700 text-sm">+{(Number(item.dailyGain) || 0).toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="pt-1 border-t border-amber-200/60">
                      <span className="text-slate-600 text-[10px] uppercase font-bold font-sans block">Gain 40j :</span>
                      <span className="font-black text-amber-900 text-sm">{(Number(gain40) || 0).toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="pt-1 border-t border-amber-200/60">
                      <span className="text-slate-600 text-[10px] uppercase font-bold font-sans block">Total à 40j :</span>
                      <span className="font-black text-slate-950 text-sm">{(Number(total40) || 0).toLocaleString('fr-FR')} F</span>
                    </div>
                  </div>

                  <button
                    onClick={onStart}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Souscrire à cette formule
                  </button>
                </div>
              );
            })}
          </div>

          {/* RÉSUMÉ DU FONCTIONNEMENT */}
          <div className="mt-12 bg-white border-2 border-emerald-900/20 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="inline-flex items-center space-x-2 bg-[#0e3d1c] text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-6 font-mono">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>RÉSUMÉ DU FONCTIONNEMENT :</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* 3 Step Guide on the Left */}
              <div className="md:col-span-7 space-y-4">
                {/* Step 1 */}
                <div className="flex items-start space-x-3.5 bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-950 text-sm uppercase font-mono">PRINCIPE :</h4>
                    <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-0.5">
                      Tu investis un montant selon le modèle d'AirPods que tu choisis.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-3.5 bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-950 text-sm uppercase font-mono">REVENUS :</h4>
                    <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-0.5">
                      Gains crédités automatiquement toutes les 24h sur votre solde.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-3.5 bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-950 text-sm uppercase font-mono">GAIN :</h4>
                    <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-0.5">
                      Tu reçois un revenu quotidien net crédité chaque 24h.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side Golden Shield Emblem */}
              <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border-2 border-amber-400 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center mb-3 shadow-md shadow-amber-400/20">
                  <ShieldCheck className="w-10 h-10 text-emerald-950" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                  AIRPODS
                </h3>
                <p className="text-xs text-emerald-100 font-bold uppercase tracking-wider mt-1">
                  VOTRE PARTENAIRE POUR UN AVENIR PROSPÈRE
                </p>
                <div className="flex items-center justify-center space-x-1 text-amber-400 mt-2">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
                <button
                  onClick={onStart}
                  className="mt-4 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Ouvrir mon compte VIP
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Banner */}
      <div className="bg-[#0e3d1c] text-white border-t-2 border-amber-400 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold font-mono">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1.5 text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>SÉCURISÉ</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>OFFICIEL</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-300">
              <Users className="w-4 h-4 text-amber-400" />
              <span>PROFITABLE</span>
            </div>
          </div>
          <div className="text-amber-300 uppercase tracking-wider text-center sm:text-right font-extrabold text-xs">
            ENSEMBLE, FAISONS CROÎTRE VOS INVESTISSEMENTS !
          </div>
        </div>
      </div>

      {/* Footer Standard Info */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto space-y-1">
          <p className="font-bold text-slate-200">© 2026 AirPods Solutions Cameroun. Tous droits réservés.</p>
          <p>Dépôts et retraits sécurisés Mobile Money au Cameroun 🇨🇲 (MTN Mobile Money & Orange Money Cameroun).</p>
        </div>
      </footer>
    </div>
  );
};

