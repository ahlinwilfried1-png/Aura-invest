import React, { useState } from 'react';
import { User, CommissionHistory, UserInvestment } from '../types';
import { Trophy, Users, Copy, Check, Share2, HelpCircle, ArrowUpRight, TrendingUp } from 'lucide-react';

interface TeamViewProps {
  currentUser: User;
  users: User[];
  commissions: CommissionHistory[];
  userInvestments?: UserInvestment[];
  onShowToast: (type: 'success' | 'err' | 'info', message: string) => void;
}

const formatAmount = (num: number): string => {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const TeamView: React.FC<TeamViewProps> = ({
  currentUser,
  users,
  commissions,
  userInvestments = [],
  onShowToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  // Referral URL
  const referralUrl = `${window.location.origin}?ref=${currentUser.referralCode}`;

  // Calculate actual network numbers from users DB
  // Level 1: Direct referrals (referredByCode matches currentUser.referralCode)
  const level1Users = users.filter((u) => u.referredByCode === currentUser.referralCode);
  const level1Codes = level1Users.map((u) => u.referralCode);

  // Level 2: Referrals of Level 1 users
  const level2Users = users.filter((u) => u.referredByCode && level1Codes.includes(u.referredByCode));
  const level2Codes = level2Users.map((u) => u.referralCode);

  // Level 3: Referrals of Level 2 users
  const level3Users = users.filter((u) => u.referredByCode && level2Codes.includes(u.referredByCode));

  // Total members
  const totalSponsoredMembers = level1Users.length + level2Users.length + level3Users.length;

  // Calculate total commissions credited for currentUser
  const totalCommissionsAmount = commissions
    .filter((c) => c.referrerId === currentUser.id)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Build referral list items with investment amount & commission
  const allReferralItems = [
    ...level1Users.map((u) => ({
      user: u,
      level: 1,
      badgeText: 'Niveau 1 (15%)',
      badgeClass: 'bg-emerald-100 text-emerald-800',
    })),
    ...level2Users.map((u) => ({
      user: u,
      level: 2,
      badgeText: 'Niveau 2 (2%)',
      badgeClass: 'bg-sky-100 text-sky-800',
    })),
    ...level3Users.map((u) => ({
      user: u,
      level: 3,
      badgeText: 'Niveau 3 (1%)',
      badgeClass: 'bg-amber-100 text-amber-800',
    })),
  ].map((item) => {
    // Total invested by this referral
    const totalInvested = userInvestments
      .filter((inv) => inv.userId === item.user.id)
      .reduce((sum, inv) => sum + inv.price * (inv.quantity || 1), 0);

    // Total commission earned from this referral
    const totalCommission = commissions
      .filter(
        (c) =>
          c.referrerId === currentUser.id &&
          (c.refereeId === item.user.id ||
            c.refereeName === item.user.name ||
            c.refereeName === item.user.phone)
      )
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      ...item,
      totalInvested,
      totalCommission,
    };
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    onShowToast('success', 'Lien de parrainage copié dans le presse-papier !');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareText = encodeURIComponent(
    `Rejoins-moi et gagne des commissions directes ! Inscription via mon lien : ${referralUrl}`
  );

  return (
    <div className="max-w-2xl mx-auto space-y-7 animate-fadeIn pb-6 font-sans text-slate-800">
      {/* 1. En-tête */}
      <div className="space-y-1.5 pb-2 border-b border-slate-200/60">
        <div className="flex items-center space-x-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          <Trophy className="w-7 h-7 text-blue-600 flex-shrink-0" />
          <h2>Réseau & Commissions d'Affiliation</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          Percevez des commissions directes sur 3 niveaux d'affiliation à chaque rechargement et souscription de votre réseau.
        </p>
      </div>

      {/* 2. Résumé du réseau */}
      <div className="flex items-center justify-between py-2 px-1 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-slate-400 block font-mono">
              MEMBRES PARRAINÉS
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900">
              {totalSponsoredMembers} membre{totalSponsoredMembers > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-slate-400 block font-mono">
            COMMISSIONS CUMULÉES
          </span>
          <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
            {formatAmount(totalCommissionsAmount)} <span className="text-xs font-sans text-emerald-600">FCFA</span>
          </span>
        </div>
      </div>

      {/* 3. Lien de parrainage officiel */}
      <div className="space-y-2.5">
        <div className="flex items-center space-x-1.5 text-xs font-extrabold text-slate-700 uppercase tracking-wider font-mono">
          <Share2 className="w-4 h-4 text-blue-600" />
          <span>LIEN DE PARRAINAGE OFFICIEL</span>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div className="px-1 text-xs sm:text-sm font-mono font-bold text-slate-800 truncate flex-grow">
            {referralUrl}
          </div>
          <button
            onClick={handleCopy}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs px-4 sm:px-5 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 flex-shrink-0 cursor-pointer shadow-xs"
          >
            {copiedLink ? <Check className="w-4 h-4 stroke-[3px]" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'COPIÉ !' : 'COPIER'}</span>
          </button>
        </div>
      </div>

      {/* 4. Partage */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">
          PARTAGER DIRECTEMENT :
        </span>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center transition-all shadow-2xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            <span className="text-[10px] font-extrabold tracking-tight">WhatsApp</span>
          </a>

          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sky-400 hover:bg-sky-500 text-white py-3 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center transition-all shadow-2xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-[10px] font-extrabold tracking-tight">Twitter</span>
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Rejoins-moi !')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sky-500 hover:bg-sky-600 text-white py-3 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center transition-all shadow-2xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.128.832.941z" />
            </svg>
            <span className="text-[10px] font-extrabold tracking-tight">Telegram</span>
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center transition-all shadow-2xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
            </svg>
            <span className="text-[10px] font-extrabold tracking-tight">Facebook</span>
          </a>

          {/* Instagram */}
          <button
            onClick={() => {
              handleCopy();
              onShowToast('info', 'Lien copié ! Vous pouvez le coller dans votre bio ou story Instagram.');
            }}
            className="bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white py-3 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 text-center transition-all cursor-pointer shadow-2xs"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="text-[10px] font-extrabold tracking-tight">Instagram</span>
          </button>
        </div>
      </div>

      {/* 5. Structure de l'équipe */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block font-mono">
          STRUCTURE DE L'ÉQUIPE
        </span>

        <div className="grid grid-cols-3 gap-3">
          {/* NIVEAU 1 */}
          <div className="py-3 px-2 text-center space-y-1 border-b sm:border-b-0 sm:border-r border-slate-200/60">
            <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
              NIVEAU 1 (15%)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono pt-1">
              {level1Users.length}
            </div>
            <span className="text-[11px] font-medium text-slate-500 block">Filleuls directs</span>
          </div>

          {/* NIVEAU 2 */}
          <div className="py-3 px-2 text-center space-y-1 border-b sm:border-b-0 sm:border-r border-slate-200/60">
            <span className="inline-block bg-sky-100 text-sky-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
              NIVEAU 2 (2%)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono pt-1">
              {level2Users.length}
            </div>
            <span className="text-[11px] font-medium text-slate-500 block">Filleuls de N1</span>
          </div>

          {/* NIVEAU 3 */}
          <div className="py-3 px-2 text-center space-y-1">
            <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
              NIVEAU 3 (1%)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono pt-1">
              {level3Users.length}
            </div>
            <span className="text-[11px] font-medium text-slate-500 block">Filleuls de N2</span>
          </div>
        </div>
      </div>

      {/* 6. LISTE DÉTAILLÉE DES FILLEULS AVEC MONTANT INVESTI ET COMMISSIONS */}
      <div className="space-y-3 pt-4 border-t border-slate-200/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block font-mono">
            MES FILLEULS PARRAINÉS ({allReferralItems.length})
          </span>
        </div>

        {allReferralItems.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs space-y-1">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">Aucun filleul inscrit pour le moment</p>
            <p className="text-[11px] text-slate-500">
              Partagez votre lien de parrainage ci-dessus pour inviter des membres et cumuler des commissions !
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {allReferralItems.map((ref, idx) => (
              <div
                key={ref.user.id || idx}
                className="py-3.5 border-b border-slate-200/60 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center font-mono">
                      {ref.user.name ? ref.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <span className="font-black text-slate-900 text-xs sm:text-sm block">
                        {ref.user.phone || ref.user.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Inscrit le {new Date(ref.user.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono ${ref.badgeClass}`}>
                    {ref.badgeText}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                      Montant investi
                    </span>
                    <span className="font-mono font-black text-slate-800">
                      {formatAmount(ref.totalInvested)} FCFA
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-800 block">
                      Commission générée
                    </span>
                    <span className="font-mono font-black text-emerald-600">
                      +{formatAmount(ref.totalCommission)} FCFA
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Fonctionnement des commissions */}
      <div className="space-y-2 pt-4 border-t border-slate-200/60">
        <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm sm:text-base">
          <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <h3>Comment fonctionnent les commissions ?</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          Chaque fois qu'un utilisateur s'inscrit via votre lien d'affiliation et effectue un rechargement ou souscrit à une offre, la commission est instantanément créditée sur votre solde en FCFA (XOF). Les commissions de Niveau 1 s'élèvent à 15%, celles de Niveau 2 à 2% et celles de Niveau 3 à 1%. Vous pouvez retirer vos gains à tout moment par Mobile Money.
        </p>
      </div>

      {/* Historical logs of user commissions if any */}
      {commissions.filter((c) => c.referrerId === currentUser.id).length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200/60">
          <div className="flex items-center space-x-2 text-xs font-black text-slate-900 uppercase font-mono">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>Dernières commissions perçues</span>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {commissions
              .filter((c) => c.referrerId === currentUser.id)
              .map((comm) => (
                <div
                  key={comm.id}
                  className="py-2 border-b border-slate-100 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{comm.refereeName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Niveau {comm.level} • {new Date(comm.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="font-extrabold text-emerald-600 font-mono">
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
