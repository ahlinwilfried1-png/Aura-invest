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
    <div className="animate-fadeIn max-w-2xl mx-auto space-y-6 pb-24 text-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between py-2 px-1 border-b border-pink-500/20 pb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-pink-300 hover:text-pink-100 transition-transform active:scale-95 cursor-pointer flex items-center space-x-1"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          <span className="text-xs font-bold hidden sm:inline">Retour</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center justify-center space-x-2">
            <HelpCircle className="w-5 h-5 text-pink-400 stroke-[2.5]" />
            <span>Foire Aux Questions</span>
          </h1>
          <p className="text-xs text-pink-300/70 font-medium mt-0.5">
            Réponses instantanées à toutes vos préoccupations
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* Banner / Intro */}
      <div className="bg-gradient-to-r from-pink-900/50 via-purple-950 to-[#1a082b] rounded-3xl p-5 text-white shadow-lg border border-pink-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
          <HelpCircle className="w-36 h-36 text-pink-400" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-pink-500/20 border border-pink-500/30 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-pink-300">
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            <span>Assistance Instantanée 24/7</span>
          </div>
          <h2 className="text-base sm:text-lg font-black leading-snug">
            Comment pouvons-nous vous aider aujourd'hui ?
          </h2>
          <p className="text-xs text-pink-200/80 font-medium leading-relaxed max-w-md">
            Trouvez rapidement des réponses claires sur la souscription VIP, les recharges Mobile Money, les retraits express et le parrainage.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-pink-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher une question (ex: retrait, dépôt, parrainage...)"
          className="w-full bg-[#1a082b] focus:bg-[#200a35] border border-pink-500/30 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-white outline-none transition-all placeholder:text-pink-300/40 placeholder:font-normal shadow-md"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-pink-300 hover:text-white bg-[#120422] border border-pink-500/30 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
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
                className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md border-pink-400 scale-105'
                    : 'bg-[#1a082b] border-pink-500/20 text-pink-300 hover:bg-[#250b3f]'
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
          <div className="text-center py-12 bg-[#1a082b] rounded-3xl border border-pink-500/20 p-6 space-y-3 shadow-md">
            <HelpCircle className="w-10 h-10 text-pink-400/40 mx-auto" />
            <p className="text-sm font-bold text-white">Aucune question trouvée</p>
            <p className="text-xs text-pink-300/70 max-w-sm mx-auto">
              Essayez avec d'autres mots clés ou contactez directement le support client.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className={`bg-[#1a082b] rounded-2xl border transition-all duration-200 overflow-hidden shadow-md ${
                  isExpanded
                    ? 'border-pink-500/60 ring-1 ring-pink-500/30'
                    : 'border-pink-500/25 hover:border-pink-500/40'
                }`}
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full text-left p-4.5 flex items-start justify-between space-x-3 cursor-pointer select-none"
                >
                  <div className="space-y-1.5 pr-2">
                    {faq.category && (
                      <span className="inline-block px-2.5 py-0.5 bg-pink-950/60 border border-pink-500/30 text-pink-300 text-[10px] font-black uppercase tracking-wider rounded-md font-mono">
                        {faq.category}
                      </span>
                    )}
                    <h3 className="text-sm font-extrabold text-white leading-snug">
                      {faq.question}
                    </h3>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rotate-180' : 'bg-[#120422] border border-pink-500/30 text-pink-300'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4.5 pb-4.5 pt-2 text-xs text-pink-100/90 font-medium leading-relaxed border-t border-pink-500/20 bg-[#120422]/60">
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
        <div className="bg-gradient-to-r from-[#1a082b] via-[#240b3b] to-[#1a082b] border border-pink-500/30 rounded-3xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 font-bold shadow-md">
              <MessageCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Vous n'avez pas trouvé votre réponse ?</h4>
              <p className="text-xs text-pink-200/80 font-normal mt-0.5">
                Notre équipe du service client répond instantanément en direct sur le chat.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSupport}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 text-center shadow-md border border-pink-300/30"
          >
            Contacter le support
          </button>
        </div>
      )}
    </div>
  );
};
