/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { User, CommissionHistory, UserInvestment, DepositRequest } from '../types';
import { 
  Copy, 
  Check, 
  ChevronRight, 
  ArrowLeft,
  Users,
  Clock,
  HelpCircle,
  TrendingUp,
  Award
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
  const [currentView, setCurrentView] = useState<'hub' | 'details'>('hub');
  const [selectedModalTab, setSelectedModalTab] = useState<'l1' | 'l2' | 'l3'>('l1');

  // Invitation Code & URL
  const inviteCode = currentUser.referralCode || ('ETD' + (currentUser.id ? currentUser.id.slice(-3).toUpperCase() : 'NPZ'));
  const currentHost = typeof window !== 'undefined' ? window.location.host : 'goldspeed.app';
  const referralUrl = `https://${currentHost}/register?ref=${inviteCode}`;
  
  // Truncated link preview matching screenshot: "https://.../reg...."
  const displayTruncatedLink = `https://${currentHost}/reg....`;

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

  // Helper to test if a referral is a valid/active user (has investment or approved deposit or active VIP level)
  const isRefereeValid = (u: User) => {
    const hasInvestments = userInvestments.some(inv => inv.userId === u.id);
    const hasApprovedDeposit = deposits.some(d => d.userId === u.id && d.status === 'approved');
    const hasVip = (u.vipLevel || 0) > 0;
    return hasInvestments || hasApprovedDeposit || hasVip;
  };

  // Valid users per level
  const l1ValidUsers = useMemo(() => level1Users.filter(isRefereeValid), [level1Users, userInvestments, deposits]);
  const l2ValidUsers = useMemo(() => level2Users.filter(isRefereeValid), [level2Users, userInvestments, deposits]);
  const l3ValidUsers = useMemo(() => level3Users.filter(isRefereeValid), [level3Users, userInvestments, deposits]);

  // Total valid users across all levels
  const totalValidUsersCount = l1ValidUsers.length + l2ValidUsers.length + l3ValidUsers.length;

  // Earnings per level
  const l1Earnings = useMemo(() => {
    return commissions
      .filter(c => c.referrerId === currentUser.id && (c.level === 1 || !c.level))
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [commissions, currentUser.id]);

  const l2Earnings = useMemo(() => {
    return commissions
      .filter(c => c.referrerId === currentUser.id && c.level === 2)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [commissions, currentUser.id]);

  const l3Earnings = useMemo(() => {
    return commissions
      .filter(c => c.referrerId === currentUser.id && c.level === 3)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [commissions, currentUser.id]);

  // Total referral rewards (Récompenses de parrainage)
  const totalReferralRewards = l1Earnings + l2Earnings + l3Earnings;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
    }
    setCopiedLink(true);
    onShowToast('success', "Lien d'invitation copié !");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteCode);
    }
    setCopiedCode(true);
    onShowToast('success', "Code d'invitation copié !");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (currentView === 'details') {
    const list = selectedModalTab === 'l1' ? level1Users : selectedModalTab === 'l2' ? level2Users : level3Users;
    const rateLabel = selectedModalTab === 'l1' ? '15%' : '1%';

    return (
      <div className="min-h-screen bg-[#070709] text-white font-sans pb-24 select-none antialiased animate-fadeIn">
        {/* TOP HEADER */}
        <div className="bg-[#121316] border-b border-gray-800 sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between shadow-md">
          <button
            type="button"
            onClick={() => setCurrentView('hub')}
            className="flex items-center space-x-1.5 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-semibold">Retour</span>
          </button>

          <h2 className="text-sm sm:text-base font-bold text-white text-center flex-1 pr-6">
            Détails de mon équipe
          </h2>

          <div className="bg-[#1a1c22] border border-gray-700/80 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold text-gray-300">
            {totalValidUsersCount} actifs
          </div>
        </div>

        {/* CONTAINER */}
        <div className="max-w-md mx-auto p-4 space-y-4">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#121316] border border-gray-800 rounded-xl p-3 text-center">
              <span className="text-[10px] text-gray-400 block font-medium">Niveau 1</span>
              <span className="text-lg font-black text-white font-mono">{level1Users.length}</span>
              <span className="text-[9px] text-[#00E575] font-semibold block mt-0.5">Com. 15%</span>
            </div>
            <div className="bg-[#121316] border border-gray-800 rounded-xl p-3 text-center">
              <span className="text-[10px] text-gray-400 block font-medium">Niveau 2</span>
              <span className="text-lg font-black text-white font-mono">{level2Users.length}</span>
              <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">Com. 1%</span>
            </div>
            <div className="bg-[#121316] border border-gray-800 rounded-xl p-3 text-center">
              <span className="text-[10px] text-gray-400 block font-medium">Niveau 3</span>
              <span className="text-lg font-black text-white font-mono">{level3Users.length}</span>
              <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">Com. 1%</span>
            </div>
          </div>

          {/* LEVEL TABS BAR */}
          <div className="grid grid-cols-3 p-1 bg-[#121316] rounded-xl border border-gray-800 text-xs">
            <button
              onClick={() => setSelectedModalTab('l1')}
              className={`py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                selectedModalTab === 'l1'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Niveau 1 ({level1Users.length})
            </button>
            <button
              onClick={() => setSelectedModalTab('l2')}
              className={`py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                selectedModalTab === 'l2'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Niveau 2 ({level2Users.length})
            </button>
            <button
              onClick={() => setSelectedModalTab('l3')}
              className={`py-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                selectedModalTab === 'l3'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Niveau 3 ({level3Users.length})
            </button>
          </div>

          {/* MEMBERS LIST */}
          <div className="bg-[#121316] rounded-xl border border-gray-800 p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-gray-800/80">
              <span className="font-semibold">Membres inscrits</span>
              <span className="font-mono text-[11px]">Taux: {rateLabel}</span>
            </div>

            {list.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs space-y-2">
                <Users className="w-8 h-8 mx-auto text-gray-600 stroke-1" />
                <p>Aucun membre inscrit dans ce niveau pour le moment.</p>
                <p className="text-[11px] text-gray-600">Partagez votre lien d'invitation pour développer votre réseau !</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/80">
                {list.map((user, idx) => {
                  const isValid = isRefereeValid(user);
                  const regDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Récemment';

                  return (
                    <div key={user.id || idx} className="py-3 first:pt-1 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-200 text-sm">
                          {user.phone || user.name || `Membre #${idx + 1}`}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Inscrit le {regDate} • Commission: {rateLabel}
                        </div>
                      </div>
                      <div>
                        {isValid ? (
                          <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold font-mono">
                            Actif
                          </span>
                        ) : (
                          <span className="text-[11px] bg-gray-800 text-gray-400 px-2.5 py-0.5 rounded-full font-medium">
                            En attente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white font-sans pb-24 select-none antialiased">
      
      {/* 1. TOP HERO BANNER WITH FESTIVAL / CELEBRATION ATMOSPHERE & DOMAIN PILL */}
      <div className="relative w-full h-56 sm:h-64 overflow-hidden">
        {/* Real Festival / Concert Celebration Image */}
        <img
          src="https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&auto=format&fit=crop&q=80"
          alt="Live Changed Live Loud"
          className="w-full h-full object-cover object-center filter brightness-95"
        />
        
        {/* Subtle dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#070709]" />

        {/* Dynamic Stylized Headline Watermark matching screenshot: "LIVE CHANGED LIVE LOUD" with lightning bolt */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
          <div className="text-center relative">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl sm:text-3xl font-black tracking-widest text-white/90 uppercase drop-shadow-lg font-sans">
                LIVE CHANGED
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-md">
                ⚡
              </span>
              <span className="text-2xl sm:text-3xl font-black tracking-widest text-white/90 uppercase drop-shadow-lg font-sans">
                LIVE LOUD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-md mx-auto px-3.5 sm:px-4 space-y-3.5 -mt-6 relative z-10">

        {/* 2. INVITATION CODE & LINK CARD (WHITE CARD WITH DARK PILL BUTTONS) */}
        <div className="bg-white text-gray-900 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          
          {/* Row 1: Code d'invitation */}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-bold tracking-wider text-gray-900 font-mono">
                {inviteCode}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">
                Code d'invitation
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="bg-gradient-to-b from-[#404040] to-[#202020] hover:from-[#4a4a4a] hover:to-[#282828] active:scale-95 text-white font-medium text-xs sm:text-sm px-6 sm:px-7 py-2 rounded-full transition-all shadow-md cursor-pointer flex items-center justify-center min-w-[88px]"
            >
              {copiedCode ? (
                <span className="flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copié</span>
                </span>
              ) : (
                'Copie'
              )}
            </button>
          </div>

          {/* Row 2: Lien d'invitation */}
          <div className="flex items-center justify-between pt-1">
            <div className="min-w-0 pr-2">
              <div className="text-xs sm:text-sm font-medium text-gray-800 truncate font-sans">
                {displayTruncatedLink}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">
                Lien d'invitation
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="bg-gradient-to-b from-[#404040] to-[#202020] hover:from-[#4a4a4a] hover:to-[#282828] active:scale-95 text-white font-medium text-xs sm:text-sm px-6 sm:px-7 py-2 rounded-full transition-all shadow-md cursor-pointer flex items-center justify-center min-w-[88px]"
            >
              {copiedLink ? (
                <span className="flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copié</span>
                </span>
              ) : (
                'Copie'
              )}
            </button>
          </div>

        </div>

        {/* 3. "MON ÉQUIPE >" WHITE PILL BUTTON */}
        <button
          type="button"
          onClick={() => setCurrentView('details')}
          className="w-full bg-white hover:bg-gray-100 active:scale-[0.99] text-gray-900 font-semibold text-sm sm:text-base py-3 px-4 rounded-full shadow-md transition-all flex items-center justify-center cursor-pointer border border-gray-200"
        >
          <span>Mon équipe &gt;</span>
        </button>

        {/* 4. COMMISSION TABLE (DARK CARD WITH 3 COLUMNS) */}
        <div className="bg-[#121316] rounded-xl overflow-hidden border border-gray-800 shadow-md">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-[11px] sm:text-xs">
                <th className="py-3 px-3 sm:px-4 font-normal">Taux de commission</th>
                <th className="py-3 px-3 sm:px-4 text-center font-normal">Utilisateurs valides</th>
                <th className="py-3 px-3 sm:px-4 text-right font-normal">Revenu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80 text-white font-medium">
              <tr>
                <td className="py-3 px-3 sm:px-4 text-gray-200">Équipe de niveau 1 : 15 %</td>
                <td className="py-3 px-3 sm:px-4 text-center font-mono">{l1ValidUsers.length}</td>
                <td className="py-3 px-3 sm:px-4 text-right font-mono">{formatAmount(l1Earnings)}</td>
              </tr>
              <tr>
                <td className="py-3 px-3 sm:px-4 text-gray-200">Équipe de niveau 2 : 1 %</td>
                <td className="py-3 px-3 sm:px-4 text-center font-mono">{l2ValidUsers.length}</td>
                <td className="py-3 px-3 sm:px-4 text-right font-mono">{formatAmount(l2Earnings)}</td>
              </tr>
              <tr>
                <td className="py-3 px-3 sm:px-4 text-gray-200">Équipe de niveau 3 : 1 %</td>
                <td className="py-3 px-3 sm:px-4 text-center font-mono">{l3ValidUsers.length}</td>
                <td className="py-3 px-3 sm:px-4 text-right font-mono">{formatAmount(l3Earnings)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. DUAL SUMMARY BLOCKS (UTILISATEURS VALIDES & RÉCOMPENSES DE PARRAINAGE) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Block 1: Utilisateurs valides */}
          <div className="bg-[#15161A] border border-gray-800 rounded-xl p-3.5 sm:p-4 text-center shadow-md flex flex-col justify-center min-h-[82px]">
            <div className="text-lg sm:text-xl font-black text-white font-mono leading-tight">
              {totalValidUsersCount}
            </div>
            <div className="text-[11px] sm:text-xs text-gray-300 font-medium mt-1">
              Utilisateurs valides
            </div>
          </div>

          {/* Block 2: Récompenses de parrainage */}
          <div className="bg-[#15161A] border border-gray-800 rounded-xl p-3.5 sm:p-4 text-center shadow-md flex flex-col justify-center min-h-[82px]">
            <div className="text-lg sm:text-xl font-black text-white font-mono leading-tight">
              FCFA {formatAmount(totalReferralRewards)}
            </div>
            <div className="text-[11px] sm:text-xs text-gray-300 font-medium mt-1">
              Récompenses de parrainage
            </div>
          </div>
        </div>

        {/* 6. COMMISSION EXPLANATORY RULES (DARK BOTTOM PANEL) */}
        <div className="bg-[#121316] rounded-xl p-4 sm:p-5 border border-gray-800/90 text-xs text-gray-300 leading-relaxed space-y-3.5">
          <p>
            Lorsqu'un ami que vous avez invité s'inscrit et investit, vous recevez immédiatement une récompense en espèces équivalente à 15 % du montant de son investissement.
          </p>
          <p>
            Lorsque des membres de votre équipe de niveau 2 investissent, vous recevez une prime en espèces de 1 %.
          </p>
          <p>
            Lorsque des membres de votre équipe de niveau 3 investissent, vous recevez une prime en espèces de 1 %.
          </p>
        </div>

      </div>

      
    </div>
  );
};
