import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, Search, ChevronDown, ChevronUp, MessageCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { FaqItem } from '../types';

interface FaqViewProps {
  faqs: FaqItem[];
  onBack: () => void;
  onOpenSupport?: () => void;
}

export const FaqView: React.FC<FaqViewProps> = ({
  faqs,
  onBack,
  onOpenSupport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [expandedId, setExpandedId] = useState<string | null>(faqs[0]?.id || null);

  // Extract categories
  const categories = ['Tous', ...Array.from(new Set(faqs.map(f => f.category || 'Général')))];

  // Filter FAQs
  const filteredFaqs = faqs.filter(f => {
    const matchesCategory = selectedCategory === 'Tous' || (f.category || 'Général') === selectedCategory;
    const matchesSearch = 
      f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto space-y-6 pb-24 text-slate-900 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between py-2 px-1 border-b border-slate-200/60 pb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-800 hover:text-amber-600 transition-transform active:scale-95 cursor-pointer flex items-center space-x-1"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          <span className="text-xs font-bold hidden sm:inline">Retour</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center space-x-2">
            <HelpCircle className="w-5 h-5 text-teal-600 stroke-[2.5]" />
            <span>Foire Aux Questions</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Réponses instantanées à toutes vos préoccupations
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* Banner / Intro */}
      <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-20 pointer-events-none">
          <HelpCircle className="w-36 h-36" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Assistance Instantanée 24/7</span>
          </div>
          <h2 className="text-base sm:text-lg font-black leading-snug">
            Comment pouvons-nous vous aider aujourd'hui ?
          </h2>
          <p className="text-xs text-teal-50 font-medium leading-relaxed max-w-md">
            Trouvez rapidement des réponses claires sur la souscription VIP, les recharges Mobile Money, les retraits express et le parrainage.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher une question (ex: retrait, dépôt, parrainage...)"
          className="w-full bg-slate-100/90 focus:bg-white border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal shadow-2xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* FAQs Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-6 space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Aucune question trouvée</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Essayez avec d'autres mots clés ou contactez directement le support client.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-teal-500/50 shadow-md ring-1 ring-teal-500/20'
                    : 'border-slate-200/80 shadow-2xs hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full text-left p-4.5 flex items-start justify-between space-x-3 cursor-pointer select-none"
                >
                  <div className="space-y-1 pr-2">
                    {faq.category && (
                      <span className="inline-block px-2.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-wider rounded-md">
                        {faq.category}
                      </span>
                    )}
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                      {faq.question}
                    </h3>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'bg-teal-600 text-white rotate-180' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4.5 pb-4.5 pt-1 text-xs text-slate-700 font-medium leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    <p className="whitespace-pre-line">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Support Callout Banner */}
      {onOpenSupport && (
        <div className="bg-slate-900 rounded-3xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
              <MessageCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Vous n'avez pas trouvé votre réponse ?</h4>
              <p className="text-xs text-slate-300 font-normal mt-0.5">
                Notre équipe du service client répond instantanément en direct sur le chat.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSupport}
            className="w-full sm:w-auto px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 text-center"
          >
            Contacter le support
          </button>
        </div>
      )}
    </div>
  );
};
