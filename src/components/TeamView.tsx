import React, { useState, useMemo } from 'react';
import { User, CommissionHistory, UserInvestment, DepositRequest } from '../types';
import { 
  Trophy, 
  Users, 
  Copy, 
  Check, 
  Share2, 
  HelpCircle, 
  ArrowUpRight, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Award,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UserX
} from 'lucide-react';

interface TeamViewProps {
  currentUser: User;
  users: User[];
  commissions: CommissionHistory[];
  userInvestments?: UserInvestment[];
  deposits?: DepositRequest[];
  onShowToast: (type: 'success' | 'err' | 'info', message: string) => void;
}

const formatAmount = (num: number): string => {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Strict helper to determine whether child is a direct referee of parent
 */
export const isDirectReferee = (child: User, parent: User): boolean => {
  if (!child || !parent) return false;
  if (child.id === parent.id) return false;
  
  const childRefBy = (child.referredByCode || '').trim();
  if (!childRefBy) return false;

  const parentCode = (parent.referralCode || '').trim();
  const parentId = (parent.id || '').trim();
  const parentPhone = (parent.phone || '').trim();

  // 1. Direct referralCode match (case-insensitive)
  if (parentCode && childRefBy.toLowerCase() === parentCode.toLowerCase()) {
    return true;
  }

  // 2. Direct ID match
  if (parentId && childRefBy.toLowerCase() === parentId.toLowerCase()) {
    return true;
  }

  // 3. Direct Phone match
  if (parentPhone) {
    const pDigits = parentPhone.replace(/\D/g, '');
    const cDigits = childRefBy.replace(/\D/g, '');
    if (childRefBy === parentPhone || childRefBy.replace(/\s+/g, '') === parentPhone.replace(/\s+/g, '')) {
      return true;
    }
    if (pDigits.length >= 8 && cDigits.length >= 8 && (pDigits.endsWith(cDigits) || cDigits.endsWith(pDigits))) {
      return true;
    }
  }

  return false;
};

export const TeamView: React.FC<TeamViewProps> = ({
  currentUser,
  users,
  commissions,
  userInvestments = [],
  deposits = [],
  onShowToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'ALL' | 1 | 2 | 3>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Referral URL
  const referralUrl = `${window.location.origin}?ref=${currentUser.referralCode || 'INV' + currentUser.id.slice(-4)}`;

  // =========================================================================
  // 1. DETERMINISTIC MULTI-LEVEL AFFILIATION CALCULATIONS
  // =========================================================================
  
  // Level 1: Direct referees of currentUser only
  const level1Users = useMemo(() => {
    return users.filter(u => isDirectReferee(u, currentUser));
  }, [users, currentUser]);

  // Level 2: Direct referees of Level 1 users only
  const level2Users = useMemo(() => {
    if (level1Users.length === 0) return [];
    return users.filter(u => level1Users.some(l1 => isDirectReferee(u, l1)));
  }, [users, level1Users]);

  // Level 3: Direct referees of Level 2 users only
  const level3Users = useMemo(() => {
    if (level2Users.length === 0) return [];
    return users.filter(u => level2Users.some(l2 => isDirectReferee(u, l2)));
  }, [users, level2Users]);

  // Helper to test if a referral is active (has investments, approved deposit, or active VIP status)
  const isRefereeActive = (u: User) => {
    const hasInvestments = userInvestments.some(inv => inv.userId === u.id);
    const hasApprovedDeposit = deposits.some(d => d.userId === u.id && d.status === 'approved');
    const hasVip = (u.vipLevel || 0) > 0;
    return hasInvestments || hasApprovedDeposit || hasVip;
  };

  // Compile all referral items with enriched stats
  const allReferralItems = useMemo(() => {
    const l1 = level1Users.map(u => ({
      user: u,
      level: 1 as const,
      badgeText: 'Niveau 1 (10%)',
      badgeClass: 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
    }));

    const l2 = level2Users.map(u => ({
      user: u,
      level: 2 as const,
      badgeText: 'Niveau 2 (1%)',
      badgeClass: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    }));

    const l3 = level3Users.map(u => ({
      user: u,
      level: 3 as const,
      badgeText: 'Niveau 3 (1%)',
      badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
    }));

    return [...l1, ...l2, ...l3].map(item => {
      const active = isRefereeActive(item.user);

      // Total invested by this referral
      const totalInvested = userInvestments
        .filter(inv => inv.userId === item.user.id)
        .reduce((sum, inv) => sum + (inv.price || 0) * (inv.quantity || 1), 0);

      // Total commission earned by currentUser from this referral
      const totalCommission = commissions
        .filter(
          c =>
            c.referrerId === currentUser.id &&
            (c.refereeId === item.user.id ||
              c.refereeName === item.user.name ||
              c.refereeName === item.user.phone)
        )
        .reduce((sum, c) => sum + (c.amount || 0), 0);

      return {
        ...item,
        isActive: active,
        totalInvested,
        totalCommission
      };
    });
  }, [level1Users, level2Users, level3Users, userInvestments, deposits, commissions, currentUser]);

  // Filtered referrals based on search and selected filters
  const filteredReferrals = useMemo(() => {
    return allReferralItems.filter(item => {
      // Level filter
      if (selectedLevelFilter !== 'ALL' && item.level !== selectedLevelFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter === 'ACTIVE' && !item.isActive) {
        return false;
      }
      if (selectedStatusFilter === 'INACTIVE' && item.isActive) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = item.user.name?.toLowerCase().includes(q);
        const matchesPhone = item.user.phone?.toLowerCase().includes(q);
        const matchesCode = item.user.referralCode?.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesCode;
      }
      return true;
    });
  }, [allReferralItems, selectedLevelFilter, selectedStatusFilter, searchQuery]);

  // Aggregate statistics
  const totalSponsoredCount = allReferralItems.length;
  const activeCount = allReferralItems.filter(i => i.isActive).length;
  const inactiveCount = totalSponsoredCount - activeCount;

  const totalCommissionsAmount = useMemo(() => {
    return commissions
      .filter(c => c.referrerId === currentUser.id)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [commissions, currentUser.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    onShowToast('success', 'Lien de parrainage officiel copié dans le presse-papier !');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.referralCode || '');
    setCopiedCode(true);
    onShowToast('success', `Code de parrainage "${currentUser.referralCode}" copié !`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareText = encodeURIComponent(
    `Rejoins mon équipe sur AirPods et gagne des revenus quotidiens garantis ! Inscription avec mon code ${currentUser.referralCode} : ${referralUrl}`
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-8 font-sans text-white">
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="bg-gradient-to-br from-[#1a082b] via-[#260c3d] to-[#120422] rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-pink-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1 rounded-full text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PROGRAMME D'AFFILIATION MULTI-NIVEAUX</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Mon Équipe & Filleuls</span>
            </h2>
            <p className="text-xs text-pink-200/80 leading-relaxed max-w-md">
              Percevez des commissions instantanées sur 3 niveaux (10% • 1% • 1%) chaque fois qu'un membre de votre équipe souscrit une offre VIP.
            </p>
          </div>

          <div className="bg-[#120422]/80 backdrop-blur-md rounded-2xl p-3.5 text-center sm:text-right border border-pink-500/30 min-w-[130px] w-full sm:w-auto shadow-md">
            <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-pink-300 block">
              COMMISSIONS TOTALES
            </span>
            <span className="text-xl sm:text-2xl font-black text-pink-400 font-mono block">
              {formatAmount(totalCommissionsAmount)} <span className="text-xs font-sans text-pink-300">FCFA</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. STATISTIQUES RÉSUMÉES DU RÉSEAU */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a082b] border border-pink-500/25 rounded-2xl p-3.5 text-center shadow-md">
          <div className="flex items-center justify-center space-x-1.5 text-pink-300 text-xs mb-1">
            <Users className="w-3.5 h-3.5 text-pink-400" />
            <span className="font-bold">Total Filleuls</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalSponsoredCount}
          </div>
          <div className="text-[10px] text-pink-300/60 font-medium">
            Sur vos 3 niveaux
          </div>
        </div>

        <div className="bg-[#1a082b] border border-pink-500/25 rounded-2xl p-3.5 text-center shadow-md">
          <div className="flex items-center justify-center space-x-1.5 text-emerald-400 text-xs mb-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">Filleuls Actifs</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {activeCount}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-medium">
            Offre VIP activée
          </div>
        </div>

        <div className="bg-[#1a082b] border border-pink-500/25 rounded-2xl p-3.5 text-center shadow-md">
          <div className="flex items-center justify-center space-x-1.5 text-pink-300/70 text-xs mb-1">
            <UserX className="w-3.5 h-3.5 text-pink-300/50" />
            <span className="font-bold">Inactifs</span>
          </div>
          <div className="text-2xl font-black text-pink-200/60 font-mono">
            {inactiveCount}
          </div>
          <div className="text-[10px] text-pink-300/50 font-medium">
            En attente d'achat
          </div>
        </div>
      </div>

      {/* 3. CODE & LIEN DE PARRAINAGE OFFICIEL */}
      <div className="bg-[#1a082b] border border-pink-500/25 rounded-3xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Inviter des amis</h3>
              <p className="text-[11px] text-pink-300/70">Partagez votre code ou lien unique pour enregistrer vos filleuls</p>
            </div>
          </div>
        </div>

        {/* Code de parrainage */}
        <div className="flex items-center justify-between p-3 bg-[#120422] border border-pink-500/30 rounded-2xl gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase font-mono text-pink-300/60 block">
              VOTRE CODE DE PARRAINAGE :
            </span>
            <span className="text-base sm:text-lg font-black text-white font-mono tracking-wider">
              {currentUser.referralCode || 'INDISPONIBLE'}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md border border-pink-300/30"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'COPIÉ' : 'COPIER CODE'}</span>
          </button>
        </div>

        {/* Lien complet */}
        <div className="flex items-center justify-between p-3 bg-[#120422] border border-pink-500/30 rounded-2xl gap-2">
          <div className="overflow-hidden pr-2">
            <span className="text-[10px] font-extrabold uppercase font-mono text-pink-300/60 block">
              LIEN D'INVITATION DIRECT :
            </span>
            <span className="text-xs font-mono font-medium text-pink-200 truncate block">
              {referralUrl}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 cursor-pointer shadow-md border border-pink-300/30"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'COPIÉ' : 'COPIER LIEN'}</span>
          </button>
        </div>

        {/* Partage réseaux sociaux */}
        <div>
          <span className="text-[10px] font-extrabold text-pink-300/70 uppercase tracking-wider block font-mono mb-2">
            PARTAGE RAPIDE EN 1 CLIC :
          </span>
          <div className="grid grid-cols-5 gap-2">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center transition-all shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              <span className="text-[9px] font-bold">WhatsApp</span>
            </a>

            {/* Telegram */}
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Rejoins mon équipe sur AirPods !')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-500 hover:bg-sky-600 text-white py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center transition-all shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.128.832.941z" />
              </svg>
              <span className="text-[9px] font-bold">Telegram</span>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center transition-all shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
              </svg>
              <span className="text-[9px] font-bold">Facebook</span>
            </a>

            {/* Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-400 hover:bg-sky-500 text-white py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center transition-all shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-[9px] font-bold">Twitter</span>
            </a>

            {/* Instagram */}
            <button
              onClick={() => {
                handleCopyLink();
                onShowToast('info', 'Lien copié ! Collez-le dans votre story ou bio Instagram.');
              }}
              className="bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center transition-all shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span className="text-[9px] font-bold">Insta</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. STRUCTURE DES NIVEAUX D'AFFILIATION */}
      <div className="bg-[#1a082b] border border-pink-500/25 rounded-3xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-pink-300 uppercase tracking-wider block font-mono">
            RÉPARTITION PAR NIVEAU
          </span>
          <span className="text-[11px] text-pink-300/60 font-medium">Commissions automatiques</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* NIVEAU 1 */}
          <button
            onClick={() => setSelectedLevelFilter(selectedLevelFilter === 1 ? 'ALL' : 1)}
            className={`p-3.5 rounded-2xl text-center space-y-1 transition-all cursor-pointer border ${
              selectedLevelFilter === 1
                ? 'bg-pink-500/20 border-pink-500 ring-2 ring-pink-500/30'
                : 'bg-[#120422] hover:bg-[#1f0734] border-pink-500/20'
            }`}
          >
            <span className="inline-block bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
              NIVEAU 1 (10%)
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {level1Users.length}
            </div>
            <span className="text-[10px] font-medium text-pink-300/60 block">Filleuls directs</span>
          </button>

          {/* NIVEAU 2 */}
          <button
            onClick={() => setSelectedLevelFilter(selectedLevelFilter === 2 ? 'ALL' : 2)}
            className={`p-3.5 rounded-2xl text-center space-y-1 transition-all cursor-pointer border ${
              selectedLevelFilter === 2
                ? 'bg-purple-500/20 border-purple-500 ring-2 ring-purple-500/30'
                : 'bg-[#120422] hover:bg-[#1f0734] border-pink-500/20'
            }`}
          >
            <span className="inline-block bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
              NIVEAU 2 (1%)
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {level2Users.length}
            </div>
            <span className="text-[10px] font-medium text-pink-300/60 block">Filleuls de N1</span>
          </button>

          {/* NIVEAU 3 */}
          <button
            onClick={() => setSelectedLevelFilter(selectedLevelFilter === 3 ? 'ALL' : 3)}
            className={`p-3.5 rounded-2xl text-center space-y-1 transition-all cursor-pointer border ${
              selectedLevelFilter === 3
                ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30'
                : 'bg-[#120422] hover:bg-[#1f0734] border-pink-500/20'
            }`}
          >
            <span className="inline-block bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
              NIVEAU 3 (1%)
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {level3Users.length}
            </div>
            <span className="text-[10px] font-medium text-pink-300/60 block">Filleuls de N2</span>
          </button>
        </div>
      </div>

      {/* 5. LISTE DÉTAILLÉE DES FILLEULS AVEC STATUTS & RECHERCHE */}
      <div className="bg-[#1a082b] border border-pink-500/25 rounded-3xl p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-pink-500/20">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-pink-400" />
            <h3 className="text-sm sm:text-base font-black text-white">
              Liste de mes filleuls ({filteredReferrals.length} / {allReferralItems.length})
            </h3>
          </div>

          {/* Filtres de statut */}
          <div className="flex items-center space-x-1.5 bg-[#120422] p-1 rounded-xl text-xs font-bold w-full sm:w-auto justify-between sm:justify-start border border-pink-500/20">
            <button
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedStatusFilter === 'ALL' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-pink-300/70 hover:text-white'
              }`}
            >
              Tous ({allReferralItems.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                selectedStatusFilter === 'ACTIVE' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Actifs ({activeCount})</span>
            </button>
            <button
              onClick={() => setSelectedStatusFilter('INACTIVE')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                selectedStatusFilter === 'INACTIVE' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-pink-300/70 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Inactifs ({inactiveCount})</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche dans les filleuls */}
        <div className="relative">
          <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par numéro de téléphone ou nom..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#120422] border border-pink-500/30 rounded-xl text-xs font-medium text-white placeholder:text-pink-300/40 focus:outline-none focus:border-pink-400 transition-all"
          />
        </div>

        {/* Contenu de la liste des filleuls */}
        {filteredReferrals.length === 0 ? (
          <div className="py-10 text-center text-pink-300/70 text-xs space-y-2">
            <Users className="w-10 h-10 text-pink-400/40 mx-auto" />
            <p className="font-bold text-white text-sm">
              {allReferralItems.length === 0 
                ? "Aucun filleul enregistré pour le moment" 
                : "Aucun filleul ne correspond à vos filtres"}
            </p>
            <p className="text-pink-200/60 max-w-xs mx-auto text-[11px]">
              {allReferralItems.length === 0 
                ? "Partagez votre lien de parrainage ou votre code avec vos contacts pour bâtir votre réseau et toucher des gains quotidiens !"
                : "Essayez de réinitialiser vos critères de recherche ou vos filtres de niveau."}
            </p>
            {(selectedLevelFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedLevelFilter('ALL');
                  setSelectedStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 text-pink-400 font-bold text-xs underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-pink-500/20">
            {filteredReferrals.map((ref, idx) => {
              const regDate = ref.user.createdAt ? new Date(ref.user.createdAt) : new Date();
              const formattedDate = regDate.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              const formattedTime = regDate.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={ref.user.id || idx}
                  className="py-4 space-y-3 hover:bg-[#120422]/50 transition-all rounded-2xl px-2 sm:px-3"
                >
                  {/* Ligne 1: Identifiant, Badges niveau & Statut actif */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs font-mono flex-shrink-0 ${
                        ref.isActive 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-[#120422] text-pink-300/60 border border-pink-500/20'
                      }`}>
                        {ref.user.name ? ref.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-white text-sm sm:text-base">
                            {ref.user.phone || ref.user.name}
                          </span>
                          {ref.user.name && ref.user.phone && ref.user.name !== ref.user.phone && (
                            <span className="text-xs text-pink-300/70 font-medium hidden sm:inline">
                              ({ref.user.name})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-[11px] text-pink-300/60 mt-0.5">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-pink-400" />
                            <span>Inscrit le {formattedDate} à {formattedTime}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {/* Badge Niveau */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${ref.badgeClass}`}>
                        {ref.badgeText}
                      </span>

                      {/* Badge Statut Actif / Inactif */}
                      {ref.isActive ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>ACTIF {ref.user.vipLevel ? `(VIP ${ref.user.vipLevel})` : '(Investisseur)'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-[#120422] text-pink-300/60 border border-pink-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-300/40" />
                          <span>INACTIF (Non investi)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ligne 2: Montant investi par le filleul et Commissions générées pour vous */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pink-500/20 bg-[#120422]/70 p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-pink-300/60 block">
                        Investissement Filleul
                      </span>
                      <span className="font-mono font-black text-white text-xs sm:text-sm">
                        {formatAmount(ref.totalInvested)} FCFA
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono font-bold text-pink-400 block">
                        Votre commission générée
                      </span>
                      <span className="font-mono font-black text-pink-400 text-xs sm:text-sm">
                        +{formatAmount(ref.totalCommission)} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. FONCTIONNEMENT DU PROGRAMME D'AFFILIATION */}
      <div className="bg-[#1a082b] border border-pink-500/25 rounded-3xl p-5 space-y-2.5">
        <div className="flex items-center space-x-2 text-white font-extrabold text-sm sm:text-base">
          <HelpCircle className="w-5 h-5 text-pink-400 flex-shrink-0" />
          <h3>Règles et Fonctionnement des Commissions</h3>
        </div>
        <p className="text-xs text-pink-200/90 leading-relaxed font-medium">
          Chaque nouvel utilisateur qui s'inscrit avec votre code ou lien est automatiquement et exclusivement lié à votre compte dans la base de données Supabase.
        </p>
        <ul className="text-xs text-pink-200/80 space-y-1.5 list-disc pl-4 font-medium">
          <li><strong>Niveau 1 (Direct) :</strong> 10% du montant à chaque souscription VIP ou recharge de vos filleuls directs.</li>
          <li><strong>Niveau 2 :</strong> 1% de commission sur les filleuls parrainés par vos membres de Niveau 1.</li>
          <li><strong>Niveau 3 :</strong> 1% de commission sur les filleuls de Niveau 3.</li>
          <li><strong>Crédit immédiat :</strong> Les commissions sont versées automatiquement sur votre solde en FCFA et sont retirables 24h/24 par Mobile Money.</li>
        </ul>
      </div>

      {/* 7. HISTORIQUE DES DERNIÈRES COMMISSIONS */}
      {commissions.filter(c => c.referrerId === currentUser.id).length > 0 && (
        <div className="bg-[#1a082b] border border-pink-500/25 rounded-3xl p-5 shadow-md space-y-3">
          <div className="flex items-center space-x-2 text-xs font-black text-pink-400 uppercase font-mono">
            <ArrowUpRight className="w-4 h-4 text-pink-400" />
            <span>Historique des commissions perçues</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-pink-500/20">
            {commissions
              .filter(c => c.referrerId === currentUser.id)
              .map(comm => (
                <div
                  key={comm.id}
                  className="py-2.5 flex justify-between items-center text-xs first:pt-0"
                >
                  <div>
                    <span className="font-bold text-white block">{comm.refereeName}</span>
                    <span className="text-[10px] text-pink-300/60 font-mono">
                      Niveau {comm.level} • {new Date(comm.createdAt).toLocaleDateString('fr-FR')} à {new Date(comm.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="font-black text-pink-400 font-mono text-sm">
                    +{formatAmount(comm.amount)} FCFA
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
