import React, { useState } from 'react';
import partnershipImage from '../assets/partnership_accord.svg';
import { WithdrawalHistoryView } from './WithdrawalHistoryView';
import { LuckyWheel } from './LuckyWheel';
import { LinkBankCardView } from './LinkBankCardView';
import { FaqView } from './FaqView';
import { OrdersView } from './OrdersView';
import { useApp } from '../context/AppContext';
import { ALLOWED_COUNTRIES } from '../constants/countries';
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
  HeartHandshake,
  RefreshCw
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
  onOpenTab?: (tab: 'deposit' | 'withdraw' | 'announcements' | 'chat' | 'products') => void;
  onToggleAdmin?: () => void;
  onClaimDailyEarning?: (investmentId: string) => { success: boolean; error?: string };
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
  onClaimDailyEarning,
}) => {
  const { faqs = [], users = [], refreshData } = useApp();
  const [isSyncingAdmin, setIsSyncingAdmin] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState<SubPage>(null);

  const handleManualAdminSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncingAdmin(true);
    try {
      if (refreshData) await refreshData();
      onShowToast('success', "Base de données centrale Supabase synchronisée en direct !");
    } catch (_) {
      onShowToast('err', "Erreur lors de la synchronisation.");
    } finally {
      setIsSyncingAdmin(false);
    }
  };

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
      const amountStr = res.amount ? ` +${(Number(res.amount) || 0).toLocaleString('fr-FR')} FCFA` : '';
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
  const myDeposits = deposits.filter((d) => 
    d.userId === currentUser.id || 
    (currentUser.phone && currentUser.phone !== 'Non renseigné' && d.userPhone === currentUser.phone)
  );
  const myWithdrawals = withdrawals.filter((w) => 
    w.userId === currentUser.id || 
    (currentUser.phone && currentUser.phone !== 'Non renseigné' && w.userPhone === currentUser.phone)
  );
  const myInvestments = userInvestments.filter((i) => i.userId === currentUser.id);
  const myTickets = tickets.filter((t) => 
    t.userId === currentUser.id ||
    (currentUser.phone && currentUser.phone !== 'Non renseigné' && t.userPhone === currentUser.phone) ||
    (currentUser.name && t.userName === currentUser.name)
  );

  const userCountry = ALLOWED_COUNTRIES.find(c => 
    c.name.toLowerCase() === (currentUser.country || '').toLowerCase() || 
    c.code.toLowerCase() === (currentUser.country || '').toLowerCase() ||
    (currentUser.phone && currentUser.phone.startsWith(c.prefix)) ||
    c.code === currentUser.withdrawalCountry
  ) || (currentUser.country?.toLowerCase().includes('cameroun') ? ALLOWED_COUNTRIES[1] : ALLOWED_COUNTRIES[0]);

  // Render Sub-Page Header with Back Button
  const renderHeader = (title: string) => (
    <div className="flex items-center space-x-3 pb-3 border-b border-pink-500/25 mb-5 text-white">
      <button
        onClick={() => setActiveSubPage(null)}
        className="p-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 transition-all cursor-pointer border border-pink-500/30"
        title="Retour à Mon compte"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2 className="text-lg sm:text-xl font-black text-white">{title}</h2>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn pb-12 font-sans text-pink-50">
      {/* ========================================================= */}
      {/* SUB-PAGE 0: MAIN ACCOUNT HUB (When activeSubPage === null) */}
      {/* ========================================================= */}
      {activeSubPage === null && (
        <div className="space-y-4 animate-fadeIn max-w-lg mx-auto pb-6 font-sans">
          {/* SPECIAL ADMIN ACCESS HUB (DISPLAYED PROMINENTLY FOR ADMINISTRATOR ROLES) */}
          {currentUser.role === 'admin' && (
            <div 
              onClick={() => onToggleAdmin && onToggleAdmin()}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-700 via-fuchsia-700 to-purple-800 p-4 sm:p-5 text-white shadow-xl border border-pink-400/40 cursor-pointer group hover:brightness-105 transition-all"
            >
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-black shadow-md shrink-0 border border-white/20">
                      <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm sm:text-base font-black text-white tracking-tight">Panneau d'Administration</h3>
                        <span className="bg-pink-500/30 text-pink-100 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-extrabold tracking-wider border border-pink-300/30">
                          PRO
                        </span>
                      </div>
                      <p className="text-[11px] text-pink-100 font-medium">Gestion centrale, utilisateurs, transactions & chat</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Real-time stats pills */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-mono">
                  <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2 border border-white/10">
                    <div className="text-xs sm:text-sm font-black text-white">{users.length || 1}</div>
                    <div className="text-[9px] text-pink-200 font-sans font-semibold">Comptes</div>
                  </div>
                  <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2 border border-white/10">
                    <div className="text-xs sm:text-sm font-black text-pink-300">
                      {deposits.filter(d => d.status === 'pending').length}
                    </div>
                    <div className="text-[9px] text-pink-200 font-sans font-semibold">Dépôts att.</div>
                  </div>
                  <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2 border border-white/10">
                    <div className="text-xs sm:text-sm font-black text-pink-300">
                      {withdrawals.filter(w => w.status === 'pending').length}
                    </div>
                    <div className="text-[9px] text-pink-200 font-sans font-semibold">Retraits att.</div>
                  </div>
                  <div className="bg-black/25 backdrop-blur-xs rounded-xl p-2 border border-white/10">
                    <div className="text-xs sm:text-sm font-black text-emerald-300">
                      {tickets.filter(t => t.status === 'open').length}
                    </div>
                    <div className="text-[9px] text-pink-200 font-sans font-semibold">Messages</div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center space-x-2 pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleAdmin) onToggleAdmin();
                    }}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 active:scale-98 text-white font-black text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md cursor-pointer border border-pink-300/40"
                  >
                    <LockKeyhole className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Ouvrir le Panneau Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleManualAdminSync}
                    disabled={isSyncingAdmin}
                    className="bg-black/30 hover:bg-black/40 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center space-x-1.5 border border-white/20 cursor-pointer disabled:opacity-50 shrink-0"
                    title="Synchroniser immédiatement"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAdmin ? 'animate-spin' : ''}`} />
                    <span className="text-[10px] font-mono uppercase">{isSyncingAdmin ? 'Sync...' : 'Sync'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. Top Header Card: "Mon portefeuille" in Rose-Violet Theme */}
          <div 
            className="py-4 px-4 relative overflow-hidden space-y-4 text-pink-50 bg-[#1a082b] rounded-3xl border border-pink-500/25 shadow-xl"
          >
            {/* AirPods Badge & User Info */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 flex items-center justify-center font-bold">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Mon portefeuille</h3>
                  <div className="text-[11px] text-pink-200/80 font-medium flex items-center space-x-1.5">
                    <span>{currentUser.phone}</span>
                    <span>•</span>
                    <span className="font-bold text-pink-200 flex items-center space-x-1">
                      <span>{userCountry.flag}</span>
                      <span>{userCountry.name}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-pink-500/20 border border-pink-500/30 px-2.5 py-1 rounded-full flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                <span className="text-[10px] font-black font-mono text-pink-300 uppercase tracking-widest">AirPods Official</span>
              </div>
            </div>

            {/* Balance ("Équilibre") */}
            <div className="relative z-10 pt-0.5">
              <div className="text-xs sm:text-sm text-pink-200/90 font-medium flex items-baseline space-x-2">
                <span>Équilibre disponible:</span>
                <span className="text-2xl sm:text-3xl font-black text-pink-400 tracking-tight font-mono">
                  {currentUser.balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} <span className="text-xs font-sans text-pink-300 font-bold">FCFA</span>
                </span>
              </div>
            </div>

            {/* 6 Grid items (2 rows x 3 cols) */}
            <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 pt-3 text-center font-mono border-t border-pink-500/20">
              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-white">
                  {myInvestments.reduce((acc, inv) => acc + (inv.claimsHistory ? inv.claimsHistory.filter(c => new Date(c).toDateString() === new Date().toDateString()).length * inv.dailyGain : 0), 0)}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-pink-300/80 leading-tight">
                  Revenu du jour (FCFA)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-pink-400">
                  {myInvestments.reduce((acc, inv) => acc + (inv.totalGain || 0), 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-pink-300/80 leading-tight">
                  Revenu cumulé (FCFA)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-white">
                  {myWithdrawals.filter(w => new Date(w.createdAt).toDateString() === new Date().toDateString()).reduce((acc, w) => acc + w.amount, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-pink-300/80 leading-tight">
                  Retiré aujourd'hui (FCFA)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-emerald-400">
                  {myWithdrawals.filter(w => w.status === 'approved').reduce((acc, w) => acc + w.amount, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-pink-300/80 leading-tight">
                  Retraits totaux (FCFA)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-purple-300">
                  {currentUser.referralsCount || 0}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-pink-300/80 leading-tight">
                  Taille de l'équipe
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-black text-pink-400">
                  {currentUser.teamBenefits || 0}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-pink-300/80 leading-tight">
                  Avantages équipe (FCFA)
                </div>
              </div>
            </div>
          </div>

          {/* 2. Framed Cards for key actions (Commande, Lier carte bancaire, Rechargement enregistré, Retrait enregistré) */}
          <div className="space-y-2.5 pt-1">
            {/* Commande */}
            <div 
              onClick={() => setActiveSubPage('order_history')}
              className="bg-[#1a082b] hover:bg-[#240c3c] border border-pink-500/25 rounded-2xl p-3.5 sm:p-4 shadow-xl cursor-pointer flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold shrink-0 group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-purple-600 group-hover:text-white transition-all border border-pink-500/30">
                  <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm font-extrabold text-white block">Commande</span>
                    {myInvestments.length > 0 && (
                      <span className="bg-pink-500/20 text-pink-300 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border border-pink-500/30">
                        {myInvestments.length} active{myInvestments.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-pink-300/80 font-medium">Consulter mes commandes, achats & gains quotidiens</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Lier carte bancaire */}
            <div 
              onClick={() => setActiveSubPage('link_card')}
              className="bg-[#1a082b] hover:bg-[#240c3c] border border-pink-500/25 rounded-2xl p-3.5 sm:p-4 shadow-xl cursor-pointer flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold shrink-0 group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-purple-600 group-hover:text-white transition-all border border-purple-500/30">
                  <CreditCard className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-white block">Lier carte bancaire</span>
                  <span className="text-[10px] sm:text-[11px] text-pink-300/80 font-medium">Coordonnées de retrait & RIB bancaire</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Rechargement enregistré */}
            <div 
              onClick={() => setActiveSubPage('deposit_history')}
              className="bg-[#1a082b] hover:bg-[#240c3c] border border-pink-500/25 rounded-2xl p-3.5 sm:p-4 shadow-xl cursor-pointer flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold shrink-0 group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-purple-600 group-hover:text-white transition-all border border-pink-500/30">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-white block">Rechargement enregistré</span>
                  <span className="text-[10px] sm:text-[11px] text-pink-300/80 font-medium">Historique de tous vos dépôts</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Retrait enregistré */}
            <div 
              onClick={() => setActiveSubPage('withdraw_history')}
              className="bg-[#1a082b] hover:bg-[#240c3c] border border-pink-500/25 rounded-2xl p-3.5 sm:p-4 shadow-xl cursor-pointer flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 flex items-center justify-center font-bold shrink-0 group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-purple-600 group-hover:text-white transition-all border border-fuchsia-500/30">
                  <ArrowDownLeft className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-white block">Retrait enregistré</span>
                  <span className="text-[10px] sm:text-[11px] text-pink-300/80 font-medium">Historique de vos retraits</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* 3. Navigation items group */}
          <div className="bg-[#1a082b] border border-pink-500/25 rounded-2xl p-2 shadow-xl divide-y divide-pink-500/15 mt-3">
            {/* Code cadeau */}
            <div 
              onClick={() => {
                setBonusFeedback(null);
                setActiveSubPage('code_cadeau');
              }}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-pink-500/10 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center shrink-0 border border-pink-500/30">
                  <Gift className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-white block">Code cadeau</span>
                  <span className="text-[10px] text-pink-300/80 font-medium">Entrer un code cadeau ou coupon bonus</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400" />
            </div>

            {/* Tirage au sort */}
            <div 
              onClick={() => setActiveSubPage('bonus')}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-pink-500/10 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white">Tirage au sort</span>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400" />
            </div>

            {/* Modifier le mot de passe */}
            <div 
              onClick={() => setActiveSubPage('security')}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-pink-500/10 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center shrink-0 border border-pink-500/30">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white">Modifier le mot de passe</span>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400" />
            </div>

            {/* À propos d'AirPods */}
            <div 
              onClick={() => setActiveSubPage('profile')}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-pink-500/10 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <Info className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white">À propos</span>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400" />
            </div>

            {/* Foire Aux Questions (FAQ) */}
            <div 
              onClick={() => setActiveSubPage('faq')}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-pink-500/10 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 flex items-center justify-center shrink-0 border border-fuchsia-500/30">
                  <HelpCircle className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-white block">Foire Aux Questions (FAQ)</span>
                  <span className="text-[10px] text-pink-300/80 font-medium">Réponses instantanées à vos questions</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400" />
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
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-pink-500/10 transition-colors rounded-xl relative"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center shrink-0 relative border border-pink-500/30">
                  <Headphones className="w-4.5 h-4.5" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-600 text-white font-black text-[9px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-[#1a082b] animate-bounce shadow-xs">
                      {unreadChatCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-semibold text-white">Service Client (Chat)</span>
                  {unreadChatCount > 0 && (
                    <span className="bg-pink-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                      Nouveau message ({unreadChatCount})
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-pink-400" />
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
                className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-pink-600/20 transition-colors rounded-xl border border-pink-500/40 bg-pink-950/40"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs border border-pink-400/40">
                    <LockKeyhole className="w-4.5 h-4.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white block">Panneau Administratif</span>
                    <span className="text-[10px] font-semibold text-pink-300">Gestion globale du site & utilisateurs</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-pink-300" />
              </div>
            )}

            {/* Se déconnecter */}
            <div 
              onClick={onLogout}
              className="py-3 px-3 flex items-center justify-between cursor-pointer hover:bg-red-500/15 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-300 flex items-center justify-center shrink-0 border border-red-500/30">
                  <LogOut className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-red-400">Se déconnecter</span>
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
          <div className="bg-[#1a082b] border border-pink-500/25 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center justify-center mx-auto">
                <Gift className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Obtenir ma récompense
              </h3>
              <p className="text-xs sm:text-sm text-pink-200/80 leading-relaxed max-w-sm mx-auto">
                Saisissez votre code cadeau ou coupon privilège ci-dessous pour débloquer votre bonus instantané.
              </p>
            </div>

            {/* Input Form */}
            <div className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-pink-200 tracking-wide uppercase font-mono block">
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
                  className="w-full bg-[#120422] border border-pink-500/30 focus:border-pink-400 focus:bg-[#1a082b] rounded-xl px-4 py-3 text-sm font-mono font-bold text-white uppercase tracking-widest outline-none transition-all placeholder:text-pink-300/40 placeholder:font-normal placeholder:tracking-normal"
                />
              </div>

              <button
                onClick={handleValidateCode}
                disabled={!bonusInput.trim()}
                className={`w-full py-3.5 rounded-xl text-sm sm:text-base font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-md ${
                  bonusInput.trim() 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white active:scale-[0.99] border border-pink-300/40' 
                    : 'bg-pink-950/40 border border-pink-500/20 text-pink-300/40 cursor-not-allowed'
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
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200' 
                  : bonusFeedback.type === 'used'
                  ? 'bg-amber-950/50 border-amber-500/50 text-amber-200'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
              }`}>
                {bonusFeedback.type === 'success' && (
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {bonusFeedback.type === 'used' && (
                  <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                {bonusFeedback.type === 'error' && (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
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
          <div className="bg-gradient-to-br from-pink-800 via-purple-800 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-pink-500/30 space-y-3.5">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                <MessageCircle className="w-5 h-5 fill-white text-white" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-pink-200">
                  Codes Cadeaux & Privilèges
                </div>
                <h4 className="text-sm sm:text-base font-extrabold tracking-tight leading-snug">
                  Rejoignez notre chaîne WhatsApp officielle
                </h4>
                <p className="text-xs text-pink-100/80 font-medium leading-relaxed">
                  Abonnez-vous à la chaîne pour recevoir quotidiennement de nouveaux codes coupons et bonus exclusifs publiés par l'équipe.
                </p>
              </div>
            </div>

            <a
              href="https://whatsapp.com/channel/0029VbE6h2OKAwEdLgywe13M"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 active:scale-[0.99] text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-md border border-pink-300/40"
            >
              <MessageCircle className="w-4 h-4 fill-white text-white" />
              <span>Rejoindre la chaîne WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 1: À PROPOS D'AIRPODS */}
      {/* ========================================================= */}
      {activeSubPage === 'profile' && (
        <div className="space-y-6 animate-fadeIn pb-8">
          {renderHeader("À propos d'AirPods")}

          <div className="space-y-6 text-pink-50 font-sans px-1">
            
            {/* OFFICIAL PARTNERSHIP DOCUMENT IMAGE (STATIC / NON-TOUCHABLE) */}
            <div 
              className="relative rounded-2xl overflow-hidden border border-pink-500/30 shadow-xl bg-[#1a082b] select-none pointer-events-none touch-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img 
                src={partnershipImage} 
                alt="Accord de Partenariat International - AirPods Audio & FinTech" 
                className="w-full h-auto object-cover block"
                referrerPolicy="no-referrer"
                loading="eager"
              />
            </div>

            {/* Header Hero Banner */}
            <div className="space-y-2 bg-[#1a082b] p-5 rounded-2xl border border-pink-500/25">
              <div className="flex items-center space-x-2 text-pink-400 font-mono font-extrabold text-xs uppercase tracking-wider">
                <Globe className="w-4 h-4 text-pink-400" />
                <span>Plateforme Officielle Audio Premium & FinTech</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                AirPods Official
              </h2>
              <p className="text-xs sm:text-sm text-pink-200/90 leading-relaxed font-medium">
                AirPods est la première plateforme d'investissement et de distribution exclusive de solutions audio intelligentes et d'écouteurs sans fil haute fidélité en Afrique. En partenariat avec les fabricants et centres logistiques certifiés, nous permettons aux membres d'obtenir des rendements quotidiens réguliers et garantis en soutenant les volumes de distribution de toute la gamme AirPods.
              </p>
            </div>

            {/* Section: Mission & Vision */}
            <div className="space-y-2 bg-[#1a082b] p-5 rounded-2xl border border-pink-500/25">
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                <span>Notre Mission & Vision Globale</span>
              </h3>
              <p className="text-xs sm:text-sm text-pink-200/90 leading-relaxed font-medium">
                Notre mission est de démocratiser l'accès aux technologies audio de pointe tout en offrant des rendements financiers réels, transparents et payés quotidiennement 24h/24 via Mobile Money à nos membres.
              </p>
            </div>

            {/* Section: Contrats & Accords avec les Plus Grandes Entreprises */}
            <div className="space-y-4 bg-[#1a082b] p-5 rounded-2xl border border-pink-500/25">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
                  <Handshake className="w-5 h-5 text-pink-400 shrink-0" />
                  <span>Contrats & Accords Internationaux Majeurs</span>
                </h3>
                <p className="text-xs text-pink-300/80 font-medium">
                  AirPods entretient des partenariats industriels et logistiques majeurs pour assurer la rentabilité de chaque plan :
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-white">Apple Audio Supply</span>
                    <span className="text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">Certification Originale</span>
                  </div>
                  <p className="text-xs text-pink-200/80 leading-relaxed font-medium pl-6">
                    Approvisionnement direct et certification des composants acoustiques haute fidélité pour l'ensemble des gammes AirPods.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-white">Foxconn Technology</span>
                    <span className="text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">Lignes de Production</span>
                  </div>
                  <p className="text-xs text-pink-200/80 leading-relaxed font-medium pl-6">
                    Lignes d'assemblage de haute précision assurant un volume continu et des rendements réguliers sur chaque investissement.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-white">DHL Express & Bolloré Logistics</span>
                    <span className="text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">Hub Logistique Africain</span>
                  </div>
                  <p className="text-xs text-pink-200/80 leading-relaxed font-medium pl-6">
                    Réseau logistique express garantissant la livraison rapide et la rotation active des stocks d'AirPods sur les 5 pays partenaires.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-white">Qualcomm Audio Tech</span>
                    <span className="text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">Technologies Puces</span>
                  </div>
                  <p className="text-xs text-pink-200/80 leading-relaxed font-medium pl-6">
                    Intégration des processeurs H2 et réduction active du bruit pour garantir la performance des écouteurs.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm text-white">WestPay & Mobile Money Africa</span>
                    <span className="text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">Paiements Sécurisés</span>
                  </div>
                  <p className="text-xs text-pink-200/80 leading-relaxed font-medium pl-6">
                    Passerelles automatisées garantissant des dépôts instantanés et des retraits fluides 24/7 vers Orange, MTN, Moov et Yas.
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Certifications & Garanties */}
            <div className="space-y-2 bg-[#1a082b] p-5 rounded-2xl border border-pink-500/25">
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-pink-400 shrink-0" />
                <span>Certifications & Garanties d'Investissement</span>
              </h3>
              <p className="text-xs sm:text-sm text-pink-200/90 leading-relaxed font-medium">
                AirPods opère sous licence internationale (#AIRPODS-2026-8890). Tous les projets distribués font l'objet d'un audit de conformité rigoureux assurant la transparence totale et la régularité des paiements quotidiens.
              </p>
            </div>

            {/* Section: Équipe AirPods & Engagement Communautaire (En bas de page) */}
            <div className="space-y-3 pt-5 border-t border-pink-500/25">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-pink-400 font-extrabold text-xs uppercase tracking-wider">
                  <Users className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Notre Équipe & Engagement Communautaire</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  L'Équipe AirPods sur le Terrain
                </h3>
                <p className="text-xs sm:text-sm text-pink-200/90 leading-relaxed font-medium">
                  Nos ambassadeurs et experts techniques AirPods s'engagent activement au quotidien pour apporter un support de proximité et maximiser la rentabilité de nos investisseurs.
                </p>
              </div>

              {/* IMAGE DE L'ÉQUIPE AIRPODS */}
              <div 
                className="relative rounded-2xl overflow-hidden border border-pink-500/30 shadow-xl bg-[#1a082b] select-none pointer-events-none touch-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80" 
                  alt="Équipe AirPods - Action Communautaire & Support" 
                  className="w-full h-auto object-cover block"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <div className="p-3 bg-gradient-to-r from-pink-900 via-purple-900 to-indigo-950 text-white flex items-center justify-between text-xs font-bold border-t border-pink-500/30">
                  <span className="flex items-center space-x-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
                    <span>Équipe Support & Ambassadeurs Régionaux</span>
                  </span>
                  <span className="text-[10px] bg-pink-500/30 text-pink-200 px-2.5 py-0.5 rounded-full border border-pink-400/30 font-mono">
                    AirPods Official Team
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
        <div className="space-y-4 font-sans">
          {renderHeader('Dépôt (Recharger le Solde)')}

          <div className="space-y-4 pt-2 bg-[#1a082b] border border-pink-500/25 p-5 rounded-2xl">
            <div className="bg-pink-950/40 border border-pink-500/30 p-3.5 rounded-xl text-xs text-pink-200 space-y-1">
              <p className="font-bold text-pink-100">Instructions de Dépôt Mobile Money :</p>
              <p className="text-[11px] text-pink-200/80 leading-relaxed">
                Renseignez le montant et le réseau souhaité, puis cliquez sur Recharger pour être redirigé vers la validation sécurisée.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-pink-200 font-mono">RÉSEAU MOBILE MONEY</label>
              <select
                value={depForm.method}
                onChange={(e) => setDepForm({ ...depForm, method: e.target.value as any })}
                className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white outline-none focus:border-pink-400"
              >
                <option value="Orange Money">Orange Money</option>
                <option value="MTN Money">MTN Money</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Wave">Wave</option>
                <option value="TMoney">TMoney</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-pink-200 font-mono">MONTANT EN FCFA</label>
              <input
                type="number"
                value={depForm.amount}
                onChange={(e) => setDepForm({ ...depForm, amount: Number(e.target.value) })}
                className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white outline-none focus:border-pink-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-pink-200 font-mono">N° DE TRANSACTION (TxID SMS / Référence)</label>
              <input
                type="text"
                placeholder="Ex: TXN82649102"
                value={depForm.transactionId}
                onChange={(e) => setDepForm({ ...depForm, transactionId: e.target.value })}
                className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white outline-none placeholder:text-pink-300/40 focus:border-pink-400"
              />
            </div>

            <button
              onClick={() => {
                const res = onRequestDeposit(depForm.amount, depForm.method, depForm.transactionId || `WP-${Date.now().toString().slice(-6)}`, null);
                if (res.success) {
                  onShowToast('success', 'Demande de recharge enregistrée ! Redirection vers la passerelle sécurisée...');
                  const paymentUrl = 'https://soccopay.com/pay_link.php?id=108d608fd7c949fce11acb78537955ac';
                  try {
                    if (window.top && window.top !== window) {
                      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      window.location.href = paymentUrl;
                    }
                  } catch {
                    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
                  }
                  setDepForm({ amount: 5000, method: 'Orange Money', transactionId: '' });
                  setActiveSubPage('deposit_history');
                } else {
                  onShowToast('err', res.error || 'Erreur lors du dépôt.');
                }
              }}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-extrabold py-3.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-md flex items-center justify-center space-x-2 border border-pink-300/30"
            >
              <span>Recharger maintenant ({(Number(depForm.amount) || 0).toLocaleString('fr-FR')} FCFA)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 3: RETRAIT */}
      {/* ========================================================= */}
      {activeSubPage === 'withdraw' && (
        <div className="space-y-4 font-sans">
          {renderHeader('Retrait (Demander un Paiement)')}

          <div className="space-y-4 pt-2 bg-[#1a082b] border border-pink-500/25 p-5 rounded-2xl">
            <div className="bg-purple-950/40 border border-purple-500/30 p-3.5 rounded-xl text-xs text-purple-200 space-y-1">
              <p className="font-bold text-purple-100">Conditions de Retrait :</p>
              <p className="text-[11px] text-purple-200/80 leading-relaxed">
                Montant minimum : <strong className="font-mono font-bold text-pink-300">1 000 FCFA</strong> (Limité à 2 retraits par jour). Les retraits sont traités rapidement par Mobile Money.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-pink-200 font-mono">RÉSEAU DE RÉCEPTION</label>
              <select
                value={wthForm.network}
                onChange={(e) => setWthForm({ ...wthForm, network: e.target.value as any })}
                className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white outline-none focus:border-pink-400"
              >
                <option value="Orange Money">Orange Money</option>
                <option value="MTN Money">MTN Money</option>
                <option value="Moov Money">Moov Money</option>
                <option value="Mixx By Yas">Mixx By Yas</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-pink-200 font-mono">NUMÉRO DE COMPTE BÉNÉFICIAIRE</label>
              <input
                type="text"
                value={wthForm.accountNumber}
                onChange={(e) => setWthForm({ ...wthForm, accountNumber: e.target.value })}
                className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white outline-none focus:border-pink-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-pink-200 font-mono">MONTANT À RETIRER (FCFA)</label>
              <input
                type="number"
                value={wthForm.amount}
                onChange={(e) => setWthForm({ ...wthForm, amount: Number(e.target.value) })}
                className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white outline-none focus:border-pink-400"
              />
              <span className="text-[10px] text-pink-300/70 block font-mono pt-0.5">
                Solde actuel : {(Number(currentUser.balance) || 0).toLocaleString('fr-FR')} FCFA
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
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-extrabold py-3.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-md border border-pink-300/30"
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
        <div className="space-y-4 font-sans">
          {renderHeader(`Rechargement enregistré (${myDeposits.length})`)}

          <div className="space-y-2 pt-2">
            {myDeposits.length === 0 ? (
              <div className="bg-[#1a082b] border border-pink-500/20 rounded-2xl p-8 text-center text-xs text-pink-300/60">
                Aucun dépôt enregistré.
              </div>
            ) : (
              <div className="space-y-2.5">
                {myDeposits.map((dep) => (
                  <div key={dep.id} className="bg-[#1a082b] rounded-2xl p-4 border border-pink-500/20 shadow-md flex items-center justify-between text-xs transition-all hover:border-pink-500/40">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-white block text-sm">{dep.method}</span>
                      <span className="text-[10px] text-pink-300/70 font-mono block">
                        TxID: {dep.transactionId} • {new Date(dep.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="font-black text-pink-300 font-mono text-sm block">
                        +{(Number(dep.amount) || 0).toLocaleString('fr-FR')} FCFA
                      </span>
                      <span
                        className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono border ${
                          dep.status === 'approved'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : dep.status === 'pending'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
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
      {/* SUB-PAGE 6: COMMANDE (SUIVI DES COMMANDES & ACHATS) */}
      {/* ========================================================= */}
      {activeSubPage === 'order_history' && (
        <div className="space-y-4 animate-fadeIn">
          {renderHeader('Mes Commandes & Achats')}
          <OrdersView
            currentUser={currentUser}
            userInvestments={userInvestments}
            onClaimDailyEarning={onClaimDailyEarning || (() => ({ success: false, error: 'Fonction de collecte non disponible.' }))}
            onShowToast={onShowToast}
            onGoToProducts={() => {
              setActiveSubPage(null);
              if (onOpenTab) onOpenTab('products');
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 7: PRODUITS */}
      {/* ========================================================= */}
      {activeSubPage === 'products' && (
        <div className="space-y-4 font-sans">
          {renderHeader(`Catalogue Produits (${products.filter((p) => p.isActive).length})`)}

          <div className="space-y-3 pt-2">
            {products
              .filter((p) => p.isActive !== false)
              .sort((a, b) => (a.order || 99) - (b.order || 99))
              .map((prod) => (
                <div key={prod.id} className="p-3.5 rounded-2xl bg-[#1a082b] border border-pink-500/25 flex items-center justify-between gap-3 shadow-md hover:border-pink-500/40 transition-all">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <img 
                      src={prod.image || 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80'} 
                      alt={prod.name}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80'; }}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0 border border-pink-500/30 bg-[#120422]"
                    />
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-bold text-pink-400 uppercase font-mono">{prod.badge || 'PRODUIT VIP'}</span>
                      <h4 className="text-sm font-black text-white truncate">{prod.name}</h4>
                      <p className="text-xs text-pink-200/80">
                        Prix : <strong className="text-pink-300 font-mono">{(Number(prod.price) || 0).toLocaleString('fr-FR')} FCFA</strong> • Gain : <strong className="text-emerald-400 font-mono">+{(Number(prod.dailyGain) || 0).toLocaleString('fr-FR')} FCFA/j</strong>
                      </p>
                    </div>
                  </div>

                  {onBuyProduct && (
                    <button
                      onClick={() => onBuyProduct(prod)}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex-shrink-0 shadow-md border border-pink-300/30"
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
        <div className="space-y-4 font-sans">
          {renderHeader('Notifications & Annonces Officielles')}

          <div className="space-y-3 pt-2">
            {globalNotification ? (
              <div className="bg-[#1a082b] border border-pink-500/30 rounded-2xl p-4 sm:p-5 space-y-2 shadow-md">
                <div className="flex items-center space-x-2 text-pink-400 font-extrabold text-xs font-mono uppercase">
                  <Bell className="w-4 h-4 text-pink-400" />
                  <span>Annonce Générale du Système</span>
                </div>
                <p className="text-xs sm:text-sm text-pink-100 leading-relaxed pt-1">{globalNotification}</p>
              </div>
            ) : (
              <div className="bg-[#1a082b] border border-pink-500/20 rounded-2xl p-8 text-center text-xs text-pink-300/60">
                Aucune annonce actuellement.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 9: SÉCURITÉ */}
      {/* ========================================================= */}
      {activeSubPage === 'security' && (
        <div className="space-y-4 font-sans">
          {renderHeader('Sécurité & Mot de Passe')}

          <div className="space-y-4 pt-2 bg-[#1a082b] border border-pink-500/25 p-5 rounded-2xl shadow-md">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-pink-200 font-mono">ANCIEN MOT DE PASSE</label>
              <input
                type="password"
                value={pwdForm.oldWord}
                onChange={(e) => setPwdForm({ ...pwdForm, oldWord: e.target.value })}
                className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-pink-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-pink-200 font-mono">NOUVEAU MOT DE PASSE</label>
              <input
                type="password"
                value={pwdForm.newWord}
                onChange={(e) => setPwdForm({ ...pwdForm, newWord: e.target.value })}
                className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-pink-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-pink-200 font-mono">CONFIRMER LE NOUVEAU MOT DE PASSE</label>
              <input
                type="password"
                value={pwdForm.confirmWord}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmWord: e.target.value })}
                className="w-full bg-[#120422] border border-pink-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-pink-400"
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
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-extrabold py-3.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-md border border-pink-300/30"
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
