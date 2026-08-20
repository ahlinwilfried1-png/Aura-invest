import React, { useState } from 'react';
import partnershipImage from '../assets/partnership_accord.svg';
import { WithdrawalHistoryView } from './WithdrawalHistoryView';
import { LuckyWheel } from './LuckyWheel';
import { LinkBankCardView } from './LinkBankCardView';
import { FaqView } from './FaqView';
import { useApp } from '../context/AppContext';
import { 
  User, 
  DepositRequest, 
  WithdrawalRequest, 
  UserInvestment, 
  InvestmentProduct, 
  SupportTicket 
} from '../types';
import { 
  User as UserIcon, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  ShoppingBag, 
  Package, 
  Bell, 
  Lock, 
  Headphones, 
  Gift, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  LogOut, 
  Send,
  HelpCircle,
  FileText,
  LockKeyhole,
  Info,
  Globe,
  Building2,
  Handshake,
  Award,
  AlertCircle,
  MessageCircle,
  Users,
  HeartHandshake
} from 'lucide-react';

interface AccountViewProps {
  currentUser: User;
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  userInvestments: UserInvestment[];
  products: InvestmentProduct[];
  tickets: SupportTicket[];
  globalNotification: string | null;
  announcements?: any[];
  unreadChatCount?: number;
  onRequestDeposit: (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => { success: boolean; error?: string };
  onRequestWithdrawal: (amount: number, network: any, accountNumber: string) => { success: boolean; error?: string };
  onUpdateProfile: (data: { name: string; whatsapp: string; country: string }) => void;
  onChangePassword: (oldWord: string, newWord: string) => { success: boolean; error?: string };
  onRedeemBonusCode: (code: string) => { success: boolean; error?: string; amount?: number };
  onClaimDailyBonus: () => { success: boolean; error?: string; amount?: number };
  onCreateSupportTicket: (subject: string, message: string) => void;
  onLogout: () => void;
  onShowToast: (type: 'success' | 'err' | 'info', message: string) => void;
  onBuyProduct?: (product: InvestmentProduct) => void;
  onOpenTab?: (tab: 'deposit' | 'withdraw' | 'certificate' | 'announcements' | 'chat') => void;
  onToggleAdmin?: () => void;
}

type SubPage = 
  | null
  | 'profile'
  | 'deposit'
  | 'withdraw'
  | 'deposit_history'
  | 'withdraw_history'
  | 'order_history'
  | 'products'
  | 'notifications'
  | 'security'
  | 'support'
  | 'bonus'
  | 'code_cadeau'
  | 'link_card'
  | 'faq';

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  deposits,
  withdrawals,
  userInvestments,
  products,
  tickets,
  globalNotification,
  announcements = [],
  unreadChatCount = 0,
  onRequestDeposit,
  onRequestWithdrawal,
  onUpdateProfile,
  onChangePassword,
  onRedeemBonusCode,
  onClaimDailyBonus,
  onCreateSupportTicket,
  onLogout,
  onShowToast,
  onBuyProduct,
  onOpenTab,
  onToggleAdmin,
}) => {
  const { faqs = [] } = useApp();
  const [activeSubPage, setActiveSubPage] = useState<SubPage>(null);

  const unreadAnnouncementsCount = announcements.filter((a: any) => a.isNew).length;
  const hasUnreadAnnouncements = unreadAnnouncementsCount > 0;
  const totalUnreadAnnouncements = unreadAnnouncementsCount;

  // Forms state
  // Profile edit
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    whatsapp: currentUser.whatsapp,
    country: currentUser.country,
  });

  // Deposit form
  const [depForm, setDepForm] = useState({
    amount: 5000,
    method: 'Orange Money' as any,
    transactionId: '',
  });

  // Withdraw form
  const [wthForm, setWthForm] = useState({
    amount: 3000,
    network: 'Orange Money' as any,
    accountNumber: currentUser.phone,
  });

  // Password form
  const [pwdForm, setPwdForm] = useState({
    oldWord: '',
    newWord: '',
    confirmWord: '',
  });

  // Promo / Gift code form state
  const [bonusInput, setBonusInput] = useState('');
  const [bonusFeedback, setBonusFeedback] = useState<{
    type: 'success' | 'used' | 'error';
    message: string;
  } | null>(null);

  // Validate Code Cadeau against server/database
  const handleValidateCode = () => {
    if (!bonusInput.trim()) return;
    const cleanCode = bonusInput.trim().toUpperCase();
    const res = onRedeemBonusCode(cleanCode);

    if (res.success) {
      const amountStr = res.amount ? ` +${res.amount.toLocaleString('en-US')} FCFA` : '';
      setBonusFeedback({
        type: 'success',
        message: `Félicitations ! Le code « ${cleanCode} » est valide.${amountStr} ont été crédités sur votre portefeuille.`
      });
      onShowToast('success', `Code cadeau validé !${amountStr}`);
      setBonusInput('');
    } else {
      const errText = res.error || 'Code invalide ou expiré.';
      const isAlreadyUsed = errText.toLowerCase().includes('déjà') || errText.toLowerCase().includes('already');

      if (isAlreadyUsed) {
        setBonusFeedback({
          type: 'used',
          message: `Vous avez déjà utilisé le code cadeau « ${cleanCode} ».`
        });
        onShowToast('err', `Code « ${cleanCode} » déjà utilisé.`);
      } else {
        setBonusFeedback({
          type: 'error',
          message: errText
        });
        onShowToast('err', errText);
      }
    }
  };

  // Support ticket form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // User filter lists
  const myDeposits = deposits.filter((d) => d.userId === currentUser.id);
  const myWithdrawals = withdrawals.filter((w) => w.userId === currentUser.id);
  const myInvestments = userInvestments.filter((i) => i.userId === currentUser.id);
  const myTickets = tickets.filter((t) => 
    t.userId === currentUser.id ||
    (currentUser.phone && currentUser.phone !== 'Non renseigné' && t.userPhone === currentUser.phone) ||
    (currentUser.name && t.userName === currentUser.name)
  );

  // Render Sub-Page Header with Back Button
  const renderHeader = (title: string) => (
    <div className="flex items-center space-x-3 pb-3 border-b border-slate-200/80 mb-5">
      <button
        onClick={() => setActiveSubPage(null)}
        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
        title="Retour à Mon compte"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2 className="text-lg sm:text-xl font-black text-slate-900">{title}</h2>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn pb-4 font-sans text-slate-800">
      {/* ========================================================= */}
      {/* SUB-PAGE 0: MAIN ACCOUNT HUB (When activeSubPage === null) */}
      {/* ========================================================= */}
      {activeSubPage === null && (
        <div className="space-y-4 animate-fadeIn max-w-lg mx-auto pb-6 font-sans">
          {/* 1. Top Header Card: "Mon portefeuille" Nutrien Ag Solutions style (White theme) */}
          <div 
            className="py-3 px-1 relative overflow-hidden space-y-4 text-slate-900"
          >
            {/* Nutrien Ag Badge */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">Mon portefeuille</h3>
              </div>
              <div className="bg-emerald-50 px-2.5 py-1 rounded-full flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black font-mono text-emerald-700 uppercase tracking-widest">Nutrien Ag</span>
              </div>
            </div>

            {/* Balance ("Équilibre") */}
            <div className="relative z-10 pt-0.5">
              <div className="text-xs sm:text-sm text-slate-600 font-medium flex items-baseline space-x-2">
                <span>Équilibre disponible:</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
                  {currentUser.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} <span className="text-xs font-sans text-amber-700">FCFA</span>
                </span>
              </div>
            </div>

            {/* 6 Grid items (2 rows x 3 cols) - clean & borderless */}
            <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 pt-3.5 text-center font-mono">
              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-slate-900">
                  {myInvestments.reduce((acc, inv) => acc + (inv.claimsHistory ? inv.claimsHistory.filter(c => new Date(c).toDateString() === new Date().toDateString()).length * inv.dailyGain : 0), 0)}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
                  Revenu du jour (FCFA)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-amber-600">
                  {myInvestments.reduce((acc, inv) => acc + (inv.totalGain || 0), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
                  Revenu cumulé (FCFA)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-slate-900">
                  {myWithdrawals.filter(w => new Date(w.createdAt).toDateString() === new Date().toDateString()).reduce((acc, w) => acc + w.amount, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
                  Retiré aujourd'hui (FCFA)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-emerald-600">
                  {myWithdrawals.filter(w => w.status === 'approved').reduce((acc, w) => acc + w.amount, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
                  Retraits totaux (FCFA)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-sky-600">
                  {currentUser.referralsCount || 0}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
                  Taille de l'équipe
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-amber-600">
                  {currentUser.teamBenefits || 0}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 leading-tight">
                  Avantages équipe (FCFA)
                </div>
              </div>
            </div>
          </div>

          {/* 2. Framed Cards for key actions (Lier carte bancaire, Rechargement enregistré, Retrait enregistré) */}
          <div className="space-y-2.5 pt-1">
            {/* Lier carte bancaire */}
            <div 
              onClick={() => setActiveSubPage('link_card')}
              className="bg-white hover:bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs cursor-pointer flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-all">
                  <CreditCard className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">Lier carte bancaire</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Coordonnées de retrait & RIB bancaire</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>

            {/* Rechargement enregistré */}
            <div 
              onClick={() => setActiveSubPage('deposit_history')}
              className="bg-white hover:bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs cursor-pointer flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-all">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">Rechargement enregistré</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Historique de tous vos dépôts</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </div>

            {/* Retrait enregistré */}
            <div 
              onClick={() => setActiveSubPage('withdraw_history')}
              className="bg-white hover:bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs cursor-pointer flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">Retrait enregistré</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Historique de vos retraits</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </div>
          </div>

          {/* 3. Navigation items group */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-2xs divide-y divide-slate-100 mt-3">
            {/* Code cadeau (Replaces Argent gratuit) */}
            <div 
              onClick={() => {
                setBonusFeedback(null);
                setActiveSubPage('code_cadeau');
              }}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <Gift className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block">Code cadeau</span>
                  <span className="text-[10px] text-slate-500 font-medium">Entrer un code cadeau ou coupon bonus</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Tirage au sort */}
            <div 
              onClick={() => setActiveSubPage('bonus')}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Tirage au sort</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Modifier le mot de passe */}
            <div 
              onClick={() => setActiveSubPage('security')}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center shrink-0">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Modifier le mot de passe</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* À propos de Nutrien */}
            <div 
              onClick={() => setActiveSubPage('profile')}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <Info className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">À propos</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Foire Aux Questions (FAQ) */}
            <div 
              onClick={() => setActiveSubPage('faq')}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 block">Foire Aux Questions (FAQ)</span>
                  <span className="text-[10px] text-slate-500 font-medium">Réponses instantanées à vos questions</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Service Client (Chat Support) */}
            <div 
              onClick={() => {
                if (onOpenTab) {
                  onOpenTab('chat');
                } else {
                  setActiveSubPage('support');
                }
              }}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl relative"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0 relative">
                  <Headphones className="w-4.5 h-4.5" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[9px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-xs">
                      {unreadChatCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">Service Client (Chat)</span>
                  {unreadChatCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                      Nouveau message ({unreadChatCount})
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Panneau Administratif (RÉSERVÉ UNIQUEMENT AUX ADMINISTRATEURS) */}
            {currentUser.role === 'admin' && (
              <div 
                onClick={() => {
                  if (onToggleAdmin) {
                    onToggleAdmin();
                  } else {
                    onShowToast('info', "Accès au panneau d'administration");
                  }
                }}
                className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-red-500/10 transition-colors rounded-xl border border-red-200/60 bg-red-50/40"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <LockKeyhole className="w-4.5 h-4.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">Panneau Administratif</span>
                    <span className="text-[10px] font-semibold text-red-800">Gestion globale du site & utilisateurs</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-700" />
              </div>
            )}

            {/* Se déconnecter */}
            <div 
              onClick={onLogout}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-red-50/50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-600 flex items-center justify-center shrink-0">
                  <LogOut className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-red-600">Se déconnecter</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE: CODE CADEAU */}
      {/* ========================================================= */}
      {activeSubPage === 'code_cadeau' && (
        <div className="space-y-4 animate-fadeIn max-w-lg mx-auto pb-6 font-sans">
          {renderHeader('Code cadeau')}

          {/* Clean, modern framed card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <Gift className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Obtenir ma récompense
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                Saisissez votre code cadeau ou coupon privilège ci-dessous pour débloquer votre bonus instantané.
              </p>
            </div>

            {/* Input Form */}
            <div className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase font-mono block">
                  Code Cadeau / Coupon
                </label>
                <input
                  type="text"
                  placeholder="Ex: BIENVENU ou FINTECH2026"
                  value={bonusInput}
                  onChange={(e) => {
                    setBonusInput(e.target.value.toUpperCase());
                    setBonusFeedback(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleValidateCode();
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 uppercase tracking-widest outline-none transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal"
                />
              </div>

              <button
                onClick={handleValidateCode}
                disabled={!bonusInput.trim()}
                className={`w-full py-3.5 rounded-xl text-sm sm:text-base font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs ${
                  bonusInput.trim() 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99]' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Valider</span>
              </button>
            </div>

            {/* Feedback alert banner */}
            {bonusFeedback && (
              <div className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start space-x-3 animate-fadeIn ${
                bonusFeedback.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200/80 text-emerald-900' 
                  : bonusFeedback.type === 'used'
                  ? 'bg-amber-50 border-amber-200/80 text-amber-900'
                  : 'bg-rose-50 border-rose-200/80 text-rose-900'
              }`}>
                {bonusFeedback.type === 'success' && (
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {bonusFeedback.type === 'used' && (
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                {bonusFeedback.type === 'error' && (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 font-medium">
                  <p className="font-bold">
                    {bonusFeedback.type === 'success' && 'Code validé avec succès !'}
                    {bonusFeedback.type === 'used' && 'Code déjà utilisé'}
                    {bonusFeedback.type === 'error' && 'Code invalide ou expiré'}
                  </p>
                  <p className="leading-snug text-xs opacity-90">
                    {bonusFeedback.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Channel Banner for Gift Codes */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 fill-white text-white" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                  Codes Cadeaux & Privilèges
                </div>
                <h4 className="text-sm sm:text-base font-extrabold tracking-tight leading-snug">
                  Rejoignez notre chaîne WhatsApp officielle
                </h4>
                <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                  Abonnez-vous à la chaîne pour recevoir quotidiennement de nouveaux codes coupons et bonus exclusifs publiés par l'équipe.
                </p>
              </div>
            </div>

            <a
              href="https://whatsapp.com/channel/0029Vb8YR5RInlqVFq9AOa33"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white hover:bg-emerald-50 active:scale-[0.99] text-emerald-800 font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-700 text-emerald-700" />
              <span>Rejoindre la chaîne WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 1: À PROPOS DE NUTRIEN */}
      {/* ========================================================= */}
      {activeSubPage === 'profile' && (
        <div className="space-y-6 animate-fadeIn pb-8">
          {renderHeader('À propos de Nutrien')}

          {/* Clean presentation laid directly on background without borders or outer card boxes */}
          <div className="space-y-6 text-slate-900 font-sans px-1">
            
            {/* OFFICIAL PARTNERSHIP DOCUMENT IMAGE (STATIC / NON-TOUCHABLE) */}
            <div 
              className="relative rounded-2xl overflow-hidden border border-emerald-800/20 shadow-lg bg-white select-none pointer-events-none touch-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img 
                src={partnershipImage} 
                alt="Accord de Partenariat International - Nutrien Agriculture" 
                className="w-full h-auto object-cover block"
                referrerPolicy="no-referrer"
                loading="eager"
              />
            </div>

            {/* Header Hero Banner */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-amber-700 font-mono font-extrabold text-xs uppercase tracking-wider">
                <Globe className="w-4 h-4 text-amber-600" />
                <span>Leader Mondial de l'Agro-Industrie & FinTech</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Nutrien Ag Solutions
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Nutrien est le plus grand fournisseur mondial d'intrants agricoles, de nutrition des cultures et de solutions financières d'investissement à fort impact. Avec plus de 25 000 collaborateurs et une présence dans plus de 50 pays, Nutrien produit et distribue plus de 27 millions de tonnes de potasse, d'azote et de phosphate.
              </p>
            </div>

            {/* Section: Mission & Vision */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Notre Mission & Vision Globale</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Notre mission est d'alimenter l'avenir de manière durable en combinant la puissance de la technologie agricole, des investissements responsables et du bien-être. Nous permettons à des centaines de milliers de membres à travers le monde de participer au rendement direct des chaînes de valeur agricoles mondiales.
              </p>
            </div>

            {/* Section: Contrats & Accords avec les Plus Grandes Entreprises */}
            <div className="space-y-4 pt-3">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <Handshake className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Contrats & Accords Internationaux Majeurs</span>
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Nutrien entretient des alliances stratégiques et des contrats de distribution exclusive avec les géants mondiaux de l'industrie :
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">Bayer CropScience</span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-full">Accord Cadre Exclusif</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium pl-6">
                    Partenariat stratégique pluriannuel pour la distribution exclusive de semences de haute qualité, d'intrants certifiés et le développement de technologies agricoles à rendement garanti.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">Yara International</span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-full">Partenariat Décarbonation</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium pl-6">
                    Accord international pour la production et la distribution d'engrais verts à faible empreinte carbone et le financement des chaînes d'approvisionnement durables.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">The Mosaic Company</span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-full">Alliance Logistique</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium pl-6">
                    Joint-venture mondiale sécurisant l'approvisionnement en nutriments essentiels (potasse et phosphates) pour stabiliser les retours sur investissement.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">Syngenta Group & BASF</span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-full">Alliance Numérique</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium pl-6">
                    Contrats d'intégration technologique garantissant la traçabilité numérique, la protection des actifs et la certification des produits de bien-être.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">Cargill & John Deere</span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-full">Partenariat FinTech</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium pl-6">
                    Accords de liquidité financière et d'automatisation des paiements garantissant des retraits rapides et sécurisés 24/7 pour tous les investisseurs.
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Certifications & Garanties */}
            <div className="space-y-2 pt-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Certifications & Garanties d'Investissement</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Nutrien opère sous licence d'exploitation internationale FinTech & AgTech (#NUTRIEN-2026-8890). Tous les projets distribués font l'objet d'un audit de conformité rigoureux assurant la transparence totale et la régularité des paiements quotidiens.
              </p>
            </div>

            {/* Section: Équipe Nutrien & Engagement Communautaire (En bas de page) */}
            <div className="space-y-3 pt-5 border-t border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
                  <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Notre Équipe & Engagement Communautaire</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  L'Équipe Nutrien sur le Terrain
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  Nos collaborateurs en maillots verts Nutrien s'engagent activement au quotidien dans les initiatives de développement durable, d'action sociale et de protection de l'environnement.
                </p>
              </div>

              {/* IMAGE DE L'ÉQUIPE NUTRIEN */}
              <div 
                className="relative rounded-2xl overflow-hidden border border-emerald-800/20 shadow-lg bg-white select-none pointer-events-none touch-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img 
                  src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&auto=format&fit=crop&q=80" 
                  alt="Équipe Nutrien - Action Communautaire & Environnementale" 
                  className="w-full h-auto object-cover block"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <div className="p-3 bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center space-x-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Semaine d'Action & Engagement Communautaire</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-mono">
                    Nutrien Green Team
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 2: DÉPÔT */}
      {/* ========================================================= */}
      {activeSubPage === 'deposit' && (
        <div className="space-y-4">
          {renderHeader('Dépôt (Recharger le Solde)')}

          <div className="space-y-4 pt-2">
            <div className="bg-amber-50 p-3.5 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">Instructions de Dépôt Mobile Money :</p>
              <p className="text-[11px] font-medium leading-relaxed">
                Renseignez le montant et le réseau souhaité, puis cliquez sur Recharger pour être redirigé vers la validation sécurisée.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">RÉSEAU MOBILE MONEY</label>
              <select
                value={depForm.method}
                onChange={(e) => setDepForm({ ...depForm, method: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none"
              >
                <option value="Orange Money">Orange Money</option>
                <option value="MTN Money">MTN Money</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Wave">Wave</option>
                <option value="TMoney">TMoney</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">MONTANT EN FCFA</label>
              <input
                type="number"
                value={depForm.amount}
                onChange={(e) => setDepForm({ ...depForm, amount: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">N° DE TRANSACTION (TxID SMS / Référence)</label>
              <input
                type="text"
                placeholder="Ex: TXN82649102"
                value={depForm.transactionId}
                onChange={(e) => setDepForm({ ...depForm, transactionId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 outline-none"
              />
            </div>

            <button
              onClick={() => {
                const res = onRequestDeposit(depForm.amount, depForm.method, depForm.transactionId || `WP-${Date.now().toString().slice(-6)}`, null);
                if (res.success) {
                  onShowToast('success', 'Demande de recharge enregistrée !');
                  window.open('https://westpay.cfd/link/3s7hn53gmsupa11l', '_blank');
                  setDepForm({ amount: 5000, method: 'Orange Money', transactionId: '' });
                  setActiveSubPage('deposit_history');
                } else {
                  onShowToast('err', res.error || 'Erreur lors du dépôt.');
                }
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center space-x-2"
            >
              <span>Recharger maintenant ({depForm.amount.toLocaleString()} FCFA)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 3: RETRAIT */}
      {/* ========================================================= */}
      {activeSubPage === 'withdraw' && (
        <div className="space-y-4">
          {renderHeader('Retrait (Demander un Paiement)')}

          <div className="space-y-4 pt-2">
            <div className="bg-emerald-50 p-3.5 rounded-xl text-xs text-emerald-900 space-y-1">
              <p className="font-bold">Conditions de Retrait :</p>
              <p className="text-[11px] font-medium leading-relaxed">
                Montant minimum : <strong className="font-mono font-bold">1 000 FCFA</strong> (Limité à 2 retraits par jour). Les retraits sont traités rapidement par Mobile Money.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">RÉSEAU DE RÉCEPTION</label>
              <select
                value={wthForm.network}
                onChange={(e) => setWthForm({ ...wthForm, network: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none"
              >
                <option value="Orange Money">Orange Money</option>
                <option value="MTN Money">MTN Money</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Mixx By Yas">Mixx By Yas</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">NUMÉRO DE COMPTE BÉNÉFICIAIRE</label>
              <input
                type="text"
                value={wthForm.accountNumber}
                onChange={(e) => setWthForm({ ...wthForm, accountNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">MONTANT À RETIRER (FCFA)</label>
              <input
                type="number"
                value={wthForm.amount}
                onChange={(e) => setWthForm({ ...wthForm, amount: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 outline-none"
              />
              <span className="text-[10px] text-slate-500 block font-mono pt-0.5">
                Solde actuel : {currentUser.balance.toLocaleString()} FCFA
              </span>
            </div>

            <button
              onClick={() => {
                const res = onRequestWithdrawal(wthForm.amount, wthForm.network, wthForm.accountNumber);
                if (res.success) {
                  onShowToast('success', 'Demande de retrait enregistrée avec succès !');
                  setActiveSubPage('withdraw_history');
                } else {
                  onShowToast('err', res.error || 'Erreur lors de la demande.');
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              Confirmer la demande de retrait
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 4: HISTORIQUE DES DÉPÔTS */}
      {/* ========================================================= */}
      {activeSubPage === 'deposit_history' && (
        <div className="space-y-4">
          {renderHeader(`Rechargement enregistré (${myDeposits.length})`)}

          <div className="space-y-2 pt-2">
            {myDeposits.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Aucun dépôt enregistré.</p>
            ) : (
              <div className="space-y-2.5">
                {myDeposits.map((dep) => (
                  <div key={dep.id} className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between text-xs transition-all hover:border-slate-300">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-900 block text-sm">{dep.method}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        TxID: {dep.transactionId} • {new Date(dep.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="font-black text-amber-600 font-mono text-sm block">
                        +{dep.amount.toLocaleString()} FCFA
                      </span>
                      <span
                        className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono border ${
                          dep.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : dep.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {dep.status === 'approved' ? 'Validé' : dep.status === 'pending' ? 'En attente' : 'Refusé'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 5: HISTORIQUE DES RETRAITS */}
      {/* ========================================================= */}
      {activeSubPage === 'withdraw_history' && (
        <WithdrawalHistoryView
          withdrawals={withdrawals}
          currentUser={currentUser}
          onBack={() => setActiveSubPage(null)}
        />
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 7: PRODUITS */}
      {/* ========================================================= */}
      {activeSubPage === 'products' && (
        <div className="space-y-4">
          {renderHeader(`Catalogue Produits (${products.filter((p) => p.isActive).length})`)}

          <div className="space-y-3 pt-2">
            {products
              .filter((p) => p.isActive !== false)
              .sort((a, b) => (a.order || 99) - (b.order || 99))
              .map((prod) => (
                <div key={prod.id} className="py-3 border-b border-slate-200/60 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <img 
                      src={prod.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'} 
                      alt={prod.name}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'; }}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0 border border-slate-100"
                    />
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-bold text-amber-700 uppercase font-mono">{prod.badge || 'PRODUIT VIP'}</span>
                      <h4 className="text-sm font-black text-slate-900 truncate">{prod.name}</h4>
                      <p className="text-xs text-slate-500">
                        Prix : <strong className="text-red-600 font-mono">{prod.price.toLocaleString()} FCFA</strong> • Gain : <strong className="text-emerald-600 font-mono">+{prod.dailyGain.toLocaleString()} FCFA/j</strong>
                      </p>
                    </div>
                  </div>

                  {onBuyProduct && (
                    <button
                      onClick={() => onBuyProduct(prod)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex-shrink-0 shadow-xs"
                    >
                      Investir
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 8: NOTIFICATIONS */}
      {/* ========================================================= */}
      {activeSubPage === 'notifications' && (
        <div className="space-y-4">
          {renderHeader('Notifications & Annonces Officielles')}

          <div className="space-y-3 pt-2">
            {globalNotification ? (
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 space-y-1">
                <div className="flex items-center space-x-2 text-amber-800 font-extrabold text-xs font-mono uppercase">
                  <Bell className="w-4 h-4" />
                  <span>Annonce Générale du Système</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pt-1">{globalNotification}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">Aucune annonce actuellement.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 9: SÉCURITÉ */}
      {/* ========================================================= */}
      {activeSubPage === 'security' && (
        <div className="space-y-4">
          {renderHeader('Sécurité & Mot de Passe')}

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">ANCIEN MOT DE PASSE</label>
              <input
                type="password"
                value={pwdForm.oldWord}
                onChange={(e) => setPwdForm({ ...pwdForm, oldWord: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">NOUVEAU MOT DE PASSE</label>
              <input
                type="password"
                value={pwdForm.newWord}
                onChange={(e) => setPwdForm({ ...pwdForm, newWord: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">CONFIRMER LE NOUVEAU MOT DE PASSE</label>
              <input
                type="password"
                value={pwdForm.confirmWord}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmWord: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
              />
            </div>

            <button
              onClick={() => {
                if (pwdForm.newWord !== pwdForm.confirmWord) {
                  onShowToast('err', 'Les nouveaux mots de passe ne correspondent pas.');
                  return;
                }
                const res = onChangePassword(pwdForm.oldWord, pwdForm.newWord);
                if (res.success) {
                  onShowToast('success', 'Mot de passe modifié avec succès !');
                  setPwdForm({ oldWord: '', newWord: '', confirmWord: '' });
                  setActiveSubPage(null);
                } else {
                  onShowToast('err', res.error || 'Erreur lors du changement.');
                }
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              Mettre à jour le mot de passe
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 11: ROUE DE LA CHANCE (TIRAGE AU SORT) */}
      {/* ========================================================= */}
      {activeSubPage === 'bonus' && (
        <div className="space-y-4">
          {renderHeader('Roue de la Chance & Tirage')}
          <LuckyWheel 
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 12: LIER CARTE BANCAIRE (PAGE DÉDIÉE FLUIDE) */}
      {/* ========================================================= */}
      {activeSubPage === 'link_card' && (
        <LinkBankCardView
          currentUser={currentUser}
          onBack={() => setActiveSubPage(null)}
          onShowToast={onShowToast}
        />
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 13: FOIRE AUX QUESTIONS (FAQ DYNAMIQUE) */}
      {/* ========================================================= */}
      {activeSubPage === 'faq' && (
        <FaqView
          faqs={faqs}
          onBack={() => setActiveSubPage(null)}
          onOpenSupport={() => {
            if (onOpenTab) {
              onOpenTab('chat');
            } else {
              setActiveSubPage('support');
            }
          }}
        />
      )}
    </div>
  );
};
