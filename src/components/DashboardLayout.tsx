/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Wallet, 
  ShoppingBag, 
  Award, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  User, 
  Lock, 
  Plus, 
  Minus, 
  RefreshCw, 
  Gift, 
  Hourglass, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  PlusCircle, 
  Trash2, 
  Megaphone, 
  Globe, 
  FileText, 
  ChevronRight, 
  Sparkles, 
  BadgeCheck, 
  LockKeyhole, 
  Share2, 
  LogOut, 
  Check,
  ShieldAlert,
  HelpCircle,
  Inbox,
  Send,
  MessageCircle,
  Zap,
  CreditCard,
  X,
  Headphones,
  Package,
  ArrowLeft
} from 'lucide-react';
import { 
  User as UserType, 
  InvestmentProduct, 
  UserInvestment, 
  DepositRequest, 
  WithdrawalRequest, 
  BonusCode, 
  CommissionHistory,
  SupportTicket 
} from '../types';
import { RecentRechargesTicker } from './RecentRechargesTicker';
import { MainWalletCard } from './MainWalletCard';
import { QuickOperationsGrid } from './QuickOperationsGrid';
import { ChatMessenger } from './ChatMessenger';
import { AnnouncementsModal } from './AnnouncementsModal';
import { UserGuideModal } from './UserGuideModal';
import { AdminDashboard } from './AdminDashboard';
import { TeamView } from './TeamView';
import { OrdersView } from './OrdersView';
import { AccountView } from './AccountView';
import { DepositView } from './DepositView';
import { WithdrawView } from './WithdrawView';
import { AnnouncementsView } from './AnnouncementsView';
import { TaskCenterView } from './TaskCenterView';
import { ProductDetailView } from './ProductDetailView';
import { ProductsView } from './ProductsView';
import { ProofOfWithdrawalView } from './ProofOfWithdrawalView';
import { LinkBankCardView } from './LinkBankCardView';
import { LuckyWheel } from './LuckyWheel';
import { ServiceClientView } from './ServiceClientView';

interface DashboardLayoutProps {
  currentUser: UserType;
  users: UserType[];
  products: InvestmentProduct[];
  userInvestments: UserInvestment[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  bonusCodes: BonusCode[];
  commissions: CommissionHistory[];
  tickets: SupportTicket[];
  globalNotification: string | null;
  liveStats: {
    membersCount: number;
    depositsSum: number;
    withdrawalsSum: number;
    revenueDistributed: number;
  };
  
  // Handlers
  logout: () => void;
  updateProfile: (data: { name: string; whatsapp: string; country: string }) => void;
  changePassword: (oldWord: string, newWord: string) => { success: boolean; error?: string };
  buyInvestment: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  claimDailyEarning: (investmentId: string) => { success: boolean; error?: string };
  requestDeposit: (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => { success: boolean; error?: string };
  requestWithdrawal: (amount: number, network: any, accountNumber: string) => { success: boolean; error?: string };
  redeemBonusCode: (code: string) => { success: boolean; error?: string; amount?: number };
  claimDailyBonus: () => { success: boolean; error?: string; amount?: number };
  createSupportTicket: (subject: string, message: string) => void;
  
  // Admin handlers
  toggleBlockUser: (userId: string) => void;
  updateUserBalance: (userId: string, amount: number) => void;
  processDeposit: (depositId: string, status: 'approved' | 'rejected') => void;
  processWithdrawal: (withdrawalId: string, status: 'approved' | 'rejected') => void;
  addOrUpdateProduct: (product: any) => void;
  deleteProduct: (productId: string) => void;
  generateBonusCode: (code: string, amount: number, maxUses: number) => { success: boolean; error?: string };
  sendGlobalNotification: (text: string | null) => void;
  replyToTicket: (ticketId: string, reply: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentUser,
  users,
  products,
  userInvestments,
  deposits,
  withdrawals,
  bonusCodes,
  commissions,
  tickets,
  globalNotification,
  liveStats,
  
  logout,
  updateProfile,
  changePassword,
  buyInvestment,
  claimDailyEarning,
  requestDeposit,
  requestWithdrawal,
  redeemBonusCode,
  claimDailyBonus,
  createSupportTicket,
  
  toggleBlockUser,
  updateUserBalance,
  processDeposit,
  processWithdrawal,
  addOrUpdateProduct,
  deleteProduct,
  generateBonusCode,
  sendGlobalNotification,
  replyToTicket
}) => {
  const { announcements, tasks = [], userTaskClaims = [], markTicketsAsRead, revenueLogs = [], rechargeChannels = [] } = useApp();
  const userRevenueLogs = revenueLogs.filter(log => log.userId === currentUser.id);

  // Compute tasks ready to be claimed
  const todayDate = new Date().toISOString().split('T')[0];
  const unclaimedTasksCount = tasks.filter(t => {
    if (!t.isActive) return false;
    const userClaims = userTaskClaims.filter(c => c.userId === currentUser.id && c.taskId === t.id);
    if (t.rewardType === 'one_time' && userClaims.length > 0) return false;
    if (t.rewardType === 'daily_salary' && userClaims.some(c => c.claimedDate === todayDate)) return false;

    if (t.targetType === 'level1_investors_count') {
      const l1Count = users.filter(u => (u.referredByCode || '').trim().toLowerCase() === (currentUser.referralCode || '').trim().toLowerCase() && userInvestments.some(i => i.userId === u.id)).length;
      return l1Count >= Number(t.targetValue);
    }
    if (t.targetType === 'vip_purchase') {
      const targetVip = Number(t.targetVipLevel || t.targetValue);
      return (currentUser.vipLevel || 0) >= targetVip || userInvestments.some(i => i.userId === currentUser.id && ((i.productId || '').toLowerCase().includes(`vip${targetVip}`) || (i.productName || '').toLowerCase().includes(`vip${targetVip}`)));
    }
    return false;
  }).length;

  const isCurrentUserTicket = (t: SupportTicket) =>
    t.userId === currentUser.id ||
    (currentUser.phone && currentUser.phone !== 'Non renseigné' && t.userPhone === currentUser.phone) ||
    (currentUser.name && t.userName === currentUser.name);

  // Calculate unread chat messages/replies for current user
  const unreadChatCount = tickets.filter(
    t => isCurrentUserTicket(t) && !!t.reply && t.isReadByUser === false
  ).length;

  const unreadAnnouncementsCount = announcements.filter(a => a.isNew).length;
  const hasUnreadAnnouncements = unreadAnnouncementsCount > 0;
  const totalUnreadAnnouncements = unreadAnnouncementsCount;

  // Navigation State (Req: Accueil, Produit, Équipe, Chat, Mon compte + full-page operations)
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'orders' | 'team' | 'chat' | 'profile' | 'deposit' | 'withdraw' | 'tasks' | 'announcements' | 'link_card' | 'proofs' | 'service_client'>('home');

  const navigateToHome = () => {
    setSelectedProductDetail(null);
    setActiveTab('home');
    setGuideModalOpen(true);
  };

  useEffect(() => {
    if (activeTab === 'chat' && unreadChatCount > 0) {
      markTicketsAsRead(currentUser.id);
    }
  }, [activeTab, unreadChatCount, currentUser.id, markTicketsAsRead]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<InvestmentProduct | null>(null);

  // Modals & Notifications
  const [feedbackToast, setFeedbackToast] = useState<{ status: 'success' | 'err'; text: string } | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [annoncesModalOpen, setAnnoncesModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(true);

  // Profile feature modals
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<'all' | 'deposits' | 'withdrawals' | null>(null);

  // Deposit workflow state
  const [depAmount, setDepAmount] = useState<number>(3000);
  const [depMethod, setDepMethod] = useState<'Mixx By Yas' | 'Moov Money' | 'MTN Money' | 'Orange Money'>('Orange Money');
  const [depTxId, setDepTxId] = useState('');
  const [depScreenshot, setDepScreenshot] = useState<string | null>(null);

  // Active matching channel for deposit modal
  const activeModalChannel = rechargeChannels.find(c => {
    if (!c.isActive) return false;
    const nameLow = (c.name || '').toLowerCase();
    const depLow = (depMethod || '').toLowerCase();
    return nameLow.includes(depLow) || depLow.includes(nameLow) ||
      (depLow.includes('orange') && nameLow.includes('orange')) ||
      (depLow.includes('mtn') && nameLow.includes('mtn')) ||
      (depLow.includes('moov') && (nameLow.includes('moov') || nameLow.includes('flooz'))) ||
      (depLow.includes('yas') && (nameLow.includes('yas') || nameLow.includes('tmoney')));
  }) || rechargeChannels.find(c => c.isActive) || rechargeChannels[0];

  // Withdrawal workflow state
  const [wthAmount, setWthAmount] = useState<number>(3000);
  const [wthNetwork, setWthNetwork] = useState<'Mixx By Yas' | 'Moov Money' | 'MTN Money' | 'Orange Money'>('Orange Money');
  const [wthAccount, setWthAccount] = useState(currentUser.phone);

  // Promo code & Referral state
  const [bonusCodeInput, setBonusCodeInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Support Chat State
  const [chatSubject, setChatSubject] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  // Change password states
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');

  // Admin Workspace state variables
  const [adminSelectedUser, setAdminSelectedUser] = useState<string>('');
  const [adminBalanceAdjust, setAdminBalanceAdjust] = useState<number>(0);
  const [adminNewBonusCode, setAdminNewBonusCode] = useState('');
  const [adminNewBonusAmount, setAdminNewBonusAmount] = useState<number>(500);
  const [adminNewBonusUses, setAdminNewBonusUses] = useState<number>(20);
  const [adminNewNotify, setAdminNewNotify] = useState('');
  const [ticketReplyText, setTicketReplyText] = useState<{ [id: string]: string }>({});

  const showToast = (status: 'success' | 'err', text: string) => {
    setFeedbackToast({ status, text });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleBuyProduct = async (product: InvestmentProduct) => {
    const res = await buyInvestment(product.id);
    if (res.success) {
      showToast('success', `Souscription réussie au produit "${product.name}" ! Vos revenus quotidiens sont activés.`);
    } else {
      showToast('err', res.error || "Erreur lors de la souscription.");
      if (res.error?.includes('Solde insuffisant')) {
        setDepositModalOpen(true);
      }
    }
  };

  const handleClaimEarningRow = (investmentId: string, amount: number) => {
    const res = claimDailyEarning(investmentId);
    if (res.success) {
      showToast('success', `Félicitations ! Gain quotidien de +${(Number(amount) || 0).toLocaleString('fr-FR')} FCFA crédité avec succès.`);
    } else {
      showToast('err', res.error || "Échec du retrait quotidien.");
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depAmount || depAmount < 1000) {
      showToast('err', "Le montant minimum de recharge est de 1 000 FCFA.");
      return;
    }
    if (!depTxId.trim()) {
      showToast('err', "Veuillez saisir l'ID de transaction Mobile Money.");
      return;
    }
    const res = requestDeposit(depAmount, depMethod, depTxId, depScreenshot);
    if (res.success) {
      showToast('success', "Demande de recharge enregistrée ! Redirection vers la passerelle sécurisée...");
      window.open('https://tchin.tech/pay/6wy9goqpge', '_blank');
      setDepositModalOpen(false);
      setDepTxId('');
      setDepScreenshot(null);
    } else {
      showToast('err', res.error || "Une erreur est survenue.");
    }
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wthAmount || wthAmount < 1500) {
      showToast('err', "Le montant minimum de retrait est de 1 500 XOF.");
      return;
    }
    if (wthAmount > currentUser.balance) {
      showToast('err', "Solde insuffisant pour effectuer ce retrait.");
      return;
    }
    if (!wthAccount.trim()) {
      showToast('err', "Saisissez le numéro de réception du paiement.");
      return;
    }
    const res = requestWithdrawal(wthAmount, wthNetwork, wthAccount);
    if (res.success) {
      showToast('success', "Demande de retrait enregistrée ! Les fonds arriveront sous peu.");
      setWithdrawModalOpen(false);
    } else {
      showToast('err', res.error || "Erreur lors du retrait.");
    }
  };

  const handleRedeemBonus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusCodeInput.trim()) return;
    const res = redeemBonusCode(bonusCodeInput.trim());
    if (res.success) {
      showToast('success', `Code activé ! +${(Number(res.amount) || 0).toLocaleString('fr-FR')} FCFA ajoutés à votre solde.`);
      setBonusCodeInput('');
    } else {
      showToast('err', res.error || "Code promo invalide ou déjà utilisé.");
    }
  };

  const handleCopyReferral = () => {
    const url = `${window.location.origin}?ref=${currentUser.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('success', "Lien de parrainage copié dans le presse-papier !");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPw || !newPw) {
      showToast('err', "Remplissez tous les champs.");
      return;
    }
    const res = changePassword(oldPw, newPw);
    if (res.success) {
      showToast('success', "Mot de passe modifié avec succès.");
      setOldPw('');
      setNewPw('');
    } else {
      showToast('err', res.error || "L'ancien mot de passe est incorrect.");
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    createSupportTicket(chatSubject || "Message Support", chatMessage.trim());
    showToast('success', "Message envoyé au support ! Vous recevrez une réponse rapidement.");
    setChatMessage('');
    setChatSubject('');
  };

  const userActiveInvestments = userInvestments.filter(inv => inv.userId === currentUser.id);
  const userDeposits = deposits.filter(d => d.userId === currentUser.id || (currentUser.phone && d.userPhone === currentUser.phone));
  const userWithdrawals = withdrawals.filter(w => w.userId === currentUser.id || (currentUser.phone && w.userPhone === currentUser.phone));
  const userTickets = tickets.filter(t => t.userId === currentUser.id || (currentUser.phone && t.userPhone === currentUser.phone));

  // Active products list sorted by order
  const activeProducts = products
    .filter(p => p.isActive !== false)
    .sort((a, b) => (a.order || 99) - (b.order || 99));

  if (isAdminMode && currentUser.role === 'admin') {
    return <AdminDashboard onExitAdmin={() => setIsAdminMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0d0417] text-pink-50 flex flex-col pb-20 relative overflow-x-hidden font-sans">
      
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 max-w-md p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 animate-fadeIn backdrop-blur-md ${
          feedbackToast.status === 'success' 
            ? 'bg-[#250d3c]/95 border-pink-500/50 text-pink-100 shadow-pink-900/40' 
            : 'bg-[#3c0d1d]/95 border-red-500/50 text-red-100 shadow-red-900/40'
        }`}>
          {feedbackToast.status === 'success' ? (
            <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span className="text-xs font-bold leading-normal">{feedbackToast.text}</span>
        </div>
      )}

      {/* Live Official Announcement Ticker Bar with Megaphone */}
      <RecentRechargesTicker notificationText={globalNotification} />

      {/* Main Container Workspace (Stuck to top of site) */}
      <main className="max-w-7xl mx-auto px-2 sm:px-6 pt-1 sm:pt-3 pb-2 flex-grow w-full">
        {/* USER WORKSPACE (DYNAMIC SUB-SCREENS VIA TABS) */}
        <div>
            {/* TAB 1: ACCUEIL (DASHBOARD HOME SANS LES PRODUITS DÉPLACÉS) */}
            {activeTab === 'home' && (
              <div className="space-y-4 animate-fadeIn">
                
                {/* 1. Carte Portefeuille Principal Encadrée */}
                <MainWalletCard 
                  user={currentUser}
                  onOpenDeposit={() => setActiveTab('deposit')}
                  onOpenWithdraw={() => setActiveTab('withdraw')}
                  onOpenHistory={() => {
                    setActiveTab('orders');
                  }}
                  onOpenSupport={() => setActiveTab('service_client')}
                />

                {/* 2. Section Opérations Rapides */}
                <QuickOperationsGrid
                  onRecharger={() => setActiveTab('deposit')}
                  onRetirer={() => setActiveTab('withdraw')}
                  onPointage={() => {
                    const res = claimDailyBonus();
                    if (res.success) {
                      showToast('success', `Pointage quotidien récompensé ! +${res.amount || 20} FCFA crédités.`);
                    } else {
                      showToast('err', res.error || "Pointage déjà effectué aujourd'hui.");
                    }
                  }}
                  onTasks={() => setActiveTab('tasks')}
                  onAnnonces={() => setActiveTab('tasks')}
                  onGuide={() => setGuideModalOpen(true)}
                  onChat={() => setActiveTab('service_client')}
                  hasUnreadAnnouncements={hasUnreadAnnouncements}
                  unreadAnnouncementsCount={totalUnreadAnnouncements}
                  unclaimedTasksCount={unclaimedTasksCount}
                  unreadChatCount={unreadChatCount}
                />

                {/* 3. Carte d'accès rapide vers la page Produit */}
                <div className="bg-gradient-to-br from-[#2b0c48] via-[#1c0730] to-[#120420] text-white rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-xl border border-pink-500/30 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 max-w-sm">
                      <div className="inline-flex items-center space-x-1.5 bg-pink-500/20 text-pink-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border border-pink-500/30">
                        <Sparkles className="w-3 h-3 text-pink-400" />
                        <span>Formules d'Investissement</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        Gamme Officielle AirPods & Revenus Quotidiens
                      </h3>
                      <p className="text-xs text-pink-200/80 leading-relaxed">
                        Découvrez tous nos plans d'adhésion VIP avec gains quotidiens garantis 24h/24 et retraits Mobile Money instantanés.
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold border border-pink-500/30 shrink-0 shadow-lg shadow-pink-500/20">
                      <Package className="w-6 h-6 stroke-[2.2]" />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <div className="text-xs text-pink-300 font-mono">
                      {activeProducts.length} formules disponibles
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProductDetail(null);
                        setActiveTab('products');
                      }}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 active:scale-95 text-white font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl tracking-wider transition-all cursor-pointer shadow-lg shadow-pink-500/30 flex items-center space-x-1.5 uppercase font-sans border border-pink-400/30"
                    >
                      <span>VOIR LES PRODUITS</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: PRODUIT (ESPACE PRINCIPAL CONSACRÉ AUX PRODUITS) */}
            {activeTab === 'products' && (
              <ProductsView
                products={products}
                currentUser={currentUser}
                onConfirmPurchase={(product, qty) => buyInvestment(product.id, qty)}
                onOpenDeposit={() => setActiveTab('deposit')}
                onShowToast={showToast}
              />
            )}

            {/* VUE DIRECTE: COMMANDE (ACCESSIBLE DEPUIS MON COMPTE OU HISTORIQUE) */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-200/80 mb-2">
                  <button
                    onClick={navigateToHome}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                    title="Retour à l'accueil"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">Mes Commandes & Achats</h2>
                </div>
                <OrdersView
                  currentUser={currentUser}
                  userInvestments={userInvestments}
                  onClaimDailyEarning={claimDailyEarning}
                  onShowToast={showToast}
                  onGoToProducts={() => setActiveTab('products')}
                />
              </div>
            )}

            {/* TAB 3: ÉQUIPE (REQ: REFERRAL & NETWORK - MATCHING EXACT REFERENCE UI) */}
            {activeTab === 'team' && (
              <TeamView 
                currentUser={currentUser}
                users={users}
                commissions={commissions}
                userInvestments={userInvestments}
                deposits={deposits}
                onShowToast={showToast}
              />
            )}

            {/* TAB 4: CHAT (REQ: LIVE CHAT & MODERN MESSENGER) */}
            {activeTab === 'chat' && (
              <div className="animate-fadeIn">
                <ChatMessenger 
                  currentUser={currentUser}
                  tickets={tickets}
                  createSupportTicket={createSupportTicket}
                  replyToTicket={replyToTicket}
                  onShowToast={showToast}
                />
              </div>
            )}

            {/* TAB 5: MON COMPTE (REORGANIZED ACCORDING TO USER SPECIFICATIONS) */}
            {activeTab === 'profile' && (
              <AccountView
                currentUser={currentUser}
                deposits={deposits}
                withdrawals={withdrawals}
                userInvestments={userInvestments}
                products={products}
                tickets={tickets}
                globalNotification={globalNotification}
                announcements={announcements}
                unreadChatCount={unreadChatCount}
                onRequestDeposit={requestDeposit}
                onRequestWithdrawal={requestWithdrawal}
                onUpdateProfile={updateProfile}
                onChangePassword={changePassword}
                onRedeemBonusCode={redeemBonusCode}
                onClaimDailyBonus={claimDailyBonus}
                onCreateSupportTicket={createSupportTicket}
                onLogout={logout}
                onShowToast={showToast}
                onBuyProduct={handleBuyProduct}
                onOpenTab={(tab) => setActiveTab(tab as any)}
                onToggleAdmin={() => setIsAdminMode(true)}
                onClaimDailyEarning={claimDailyEarning}
              />
            )}

            {/* FULL-PAGE VIEW 1: RECHARGE (PAGE TOUT ENTIÈRE SANS CADRE) */}
            {activeTab === 'deposit' && (
              <DepositView
                currentUser={currentUser}
                deposits={deposits}
                onRequestDeposit={requestDeposit}
                onBack={navigateToHome}
                onShowToast={showToast}
              />
            )}

            {/* FULL-PAGE VIEW 2: RETRAIT (PAGE TOUT ENTIÈRE SANS CADRE) */}
            {activeTab === 'withdraw' && (
              <WithdrawView
                currentUser={currentUser}
                withdrawals={withdrawals}
                onRequestWithdrawal={requestWithdrawal}
                onBack={navigateToHome}
                onShowToast={showToast}
                onOpenLinkCard={() => setActiveTab('link_card')}
              />
            )}

            {/* FULL-PAGE VIEW 4: CENTRE DE TÂCHES AIRPRODS (REMPLACE COMPLÈTEMENT LA RUBRIQUE ANNONCE) */}
            {(activeTab === 'tasks' || activeTab === 'announcements') && (
              <TaskCenterView
                onBack={navigateToHome}
                onNavigateToProducts={() => setActiveTab('products')}
                onNavigateToTeam={() => setActiveTab('team')}
              />
            )}

            {/* FULL-PAGE VIEW 5: PREUVES DE RETRAIT (PAGE TOUT ENTIÈRE) */}
            {activeTab === 'proofs' && (
              <ProofOfWithdrawalView
                onBack={navigateToHome}
              />
            )}

            {/* FULL-PAGE VIEW 6: LIER CARTE BANCAIRE (PAGE DÉDIÉE FLUIDE SANS CADRES) */}
            {activeTab === 'link_card' && (
              <LinkBankCardView
                currentUser={currentUser}
                onBack={() => setActiveTab('profile')}
                onShowToast={showToast}
              />
            )}

            {/* FULL-PAGE VIEW 7: SERVICE CLIENT (PAGE DÉDIÉE SANS CADRES NI TRACE) */}
            {activeTab === 'service_client' && (
              <ServiceClientView
                onBack={navigateToHome}
              />
            )}
          </div>

      </main>

      {/* Floating Headphone ("Casque") Button to open Service Client page */}
      {!isAdminMode && activeTab !== 'service_client' && (
        <button
          onClick={() => setActiveTab('service_client')}
          className="fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-700 hover:from-pink-400 hover:to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-600/40 transition-all active:scale-95 cursor-pointer border-2 border-pink-400/50"
          title="Service Client"
        >
          <Headphones className="w-6 h-6 stroke-[2.2]" />
        </button>
      )}

      {/* DYNAMIC FIXED FOOTER NAVIGATION TABS MENU BAR */}
      {/* REQ ORDER: Accueil – Produit – Équipe – Chat – Mon compte */}
      {!isAdminMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#140624]/95 backdrop-blur-md py-2 px-2 border-t border-pink-500/20 shadow-2xl">
          <div className="max-w-md mx-auto flex justify-between items-center text-center">
            
            {/* 1. Accueil */}
            <button 
              onClick={navigateToHome}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-1 transition-all cursor-pointer ${
                activeTab === 'home' ? 'text-pink-400 font-black scale-105' : 'text-pink-200/50 hover:text-pink-200 font-medium'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-[10px]">Accueil</span>
            </button>

            {/* 2. Produit (remplace Commande à cet emplacement) */}
            <button 
              onClick={() => {
                setSelectedProductDetail(null);
                setActiveTab('products');
              }}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-1 transition-all cursor-pointer ${
                activeTab === 'products' ? 'text-pink-400 font-black scale-105' : 'text-pink-200/50 hover:text-pink-200 font-medium'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px]">Produit</span>
            </button>

            {/* 3. Équipe */}
            <button 
              onClick={() => setActiveTab('team')}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-1 transition-all cursor-pointer ${
                activeTab === 'team' ? 'text-pink-400 font-black scale-105' : 'text-pink-200/50 hover:text-pink-200 font-medium'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px]">Équipe</span>
            </button>

            {/* 4. Chat */}
            <button 
              onClick={() => {
                setActiveTab('chat');
                if (currentUser) markTicketsAsRead(currentUser.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-1 transition-all cursor-pointer relative ${
                activeTab === 'chat' ? 'text-pink-400 font-black scale-105' : 'text-pink-200/50 hover:text-pink-200 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-pink-600 text-white font-black text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-[#140624] animate-bounce shadow-xs">
                    {unreadChatCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Chat</span>
            </button>

            {/* 5. Mon compte */}
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-1 transition-all cursor-pointer ${
                activeTab === 'profile' ? 'text-pink-400 font-black scale-105' : 'text-pink-200/50 hover:text-pink-200 font-medium'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px]">Mon compte</span>
            </button>

          </div>
        </nav>
      )}

      {/* MODAL ZONE */}
      
      {/* 1. DEPOSIT MODAL WORKSPACE */}
      {depositModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#1f0a33] to-[#120521] border border-pink-500/30 text-pink-50 rounded-3xl p-6 max-w-md w-full relative space-y-4 shadow-2xl">
            <button 
              onClick={() => setDepositModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-pink-500/30"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-pink-200 bg-pink-500/20 border border-pink-500/30 px-2.5 py-0.5 rounded-full">Recharge Mobile Money</span>
              <h3 className="text-xl font-black text-white mt-2">Recharger votre Portefeuille</h3>
              <p className="text-xs text-pink-200/70 mt-0.5">Saisissez le montant et votre ID de transaction Mobile Money.</p>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] uppercase font-mono text-pink-200/80 mb-1 font-bold">Sélectionner l'Opérateur</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Orange Money', 'MTN Money', 'Moov Money', 'Mixx By Yas'] as const).map(net => (
                    <button
                      type="button"
                      key={net}
                      onClick={() => setDepMethod(net)}
                      className={`p-2.5 rounded-xl text-center transition-all font-bold cursor-pointer border ${
                        depMethod === net 
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black border-pink-400 shadow-md' 
                          : 'bg-[#270b42] text-pink-200 hover:bg-[#340f56] border-pink-500/20'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Number Box to transfer money to */}
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl space-y-1 font-mono text-[11px]">
                <span className="text-pink-200/80 font-sans block text-[10px]">Numéro marchand pour le transfert ({activeModalChannel ? activeModalChannel.name : depMethod}) :</span>
                <div className="text-white font-extrabold text-sm flex items-center justify-between">
                  <span>{activeModalChannel ? activeModalChannel.accountNumber : '+237 670 00 00 00'}</span>
                  <span className="text-[9px] bg-pink-500/30 text-pink-200 border border-pink-500/40 px-1.5 py-0.5 rounded uppercase font-bold">
                    {activeModalChannel?.accountHolder || 'Officiel'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-pink-200/80 mb-1 font-bold">Montant à Recharger (FCFA)</label>
                <input 
                  type="number" 
                  min={1000}
                  step={500}
                  value={depAmount}
                  onChange={(e) => setDepAmount(Number(e.target.value))}
                  className="w-full bg-[#270b42] border border-pink-500/30 outline-none rounded-xl py-2.5 px-3 text-white font-mono font-bold text-sm focus:border-pink-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-pink-200/80 mb-1 font-bold">ID / Référence de Transaction</label>
                <input 
                  type="text" 
                  placeholder="Ex: MP260806.1023.A001"
                  value={depTxId}
                  onChange={(e) => setDepTxId(e.target.value)}
                  className="w-full bg-[#270b42] border border-pink-500/30 outline-none rounded-xl py-2.5 px-3 text-white font-mono font-bold text-sm focus:border-pink-400"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-pink-600/30 flex items-center justify-center space-x-1.5 border border-pink-400/40"
              >
                <span>Recharger maintenant ({(Number(depAmount) || 0).toLocaleString('fr-FR')} FCFA)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. WITHDRAWAL MODAL WORKSPACE */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#1f0a33] to-[#120521] border border-pink-500/30 text-pink-50 rounded-3xl p-6 max-w-md w-full relative space-y-4 shadow-2xl">
            <button 
              onClick={() => setWithdrawModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-pink-500/30"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-pink-200 bg-pink-500/20 border border-pink-500/30 px-2.5 py-0.5 rounded-full">Demande de Retrait</span>
              <h3 className="text-xl font-black text-white mt-2">Retirer vers Mobile Money</h3>
              <p className="text-xs text-pink-200/70 mt-0.5">Solde actuel disponible : <strong className="text-pink-300 font-mono">{(Number(currentUser.balance) || 0).toLocaleString('fr-FR')} FCFA</strong></p>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] uppercase font-mono text-pink-200/80 mb-1 font-bold">Réseau de Réception</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Orange Money', 'MTN Money', 'Moov Money', 'Mixx By Yas'] as const).map(net => (
                    <button
                      type="button"
                      key={net}
                      onClick={() => setWthNetwork(net)}
                      className={`p-2.5 rounded-xl text-center transition-all font-bold cursor-pointer border ${
                        wthNetwork === net 
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black border-pink-400 shadow-md' 
                          : 'bg-[#270b42] text-pink-200 hover:bg-[#340f56] border-pink-500/20'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-pink-200/80 mb-1 font-bold">Numéro de Téléphone de Réception</label>
                <input 
                  type="tel" 
                  value={wthAccount}
                  onChange={(e) => setWthAccount(e.target.value)}
                  className="w-full bg-[#270b42] border border-pink-500/30 outline-none rounded-xl py-2.5 px-3 text-white font-mono font-bold text-sm focus:border-pink-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-pink-200/80 mb-1 font-bold">Montant à Retirer (XOF)</label>
                <input 
                  type="number" 
                  min={1500}
                  max={currentUser.balance}
                  step={500}
                  value={wthAmount}
                  onChange={(e) => setWthAmount(Number(e.target.value))}
                  className="w-full bg-[#270b42] border border-pink-500/30 outline-none rounded-xl py-2.5 px-3 text-white font-mono font-bold text-sm focus:border-pink-400"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-pink-600/30 border border-pink-400/40"
              >
                Confirmer le Retrait ({(Number(wthAmount) || 0).toLocaleString('fr-FR')} FCFA)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. ANNOUNCEMENTS MODAL */}
      <AnnouncementsModal 
        isOpen={annoncesModalOpen} 
        onClose={() => setAnnoncesModalOpen(false)} 
        notificationText={globalNotification}
      />

      {/* 4.5. USER GUIDE MODAL (GUIDE DE DÉMARRAGE RAPIDE) */}
      <UserGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />

      {/* 5. PROMO & DRAW MODAL - ROUE DE LA CHANCE */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-md w-full relative">
            <button 
              onClick={() => setShowPromoModal(false)}
              className="absolute top-3 right-3 z-40 w-8 h-8 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-pink-500/30"
            >
              <X className="w-4 h-4" />
            </button>

            <LuckyWheel 
              onShowToast={showToast}
            />
          </div>
        </div>
      )}

      {/* 6. PASSWORD CHANGE MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#1f0a33] to-[#120521] border border-pink-500/30 text-pink-50 rounded-3xl p-6 max-w-md w-full relative space-y-4 shadow-2xl">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-pink-500/30"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-pink-200 bg-pink-500/20 border border-pink-500/30 px-2.5 py-0.5 rounded-full">Sécurité du compte</span>
              <h3 className="text-xl font-black text-white mt-2">Modifier le mot de passe</h3>
            </div>

            <form onSubmit={(e) => {
              handleChangePasswordSubmit(e);
              setShowPasswordModal(false);
            }} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] text-pink-200/80 uppercase mb-1 font-bold">Ancien mot de passe</label>
                <input 
                  type="password" 
                  placeholder="Saisissez l'ancien mot de passe"
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  className="w-full bg-[#270b42] border border-pink-500/30 outline-none rounded-xl py-2.5 px-3 text-sm text-white font-bold focus:border-pink-400"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-pink-200/80 uppercase mb-1 font-bold">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  placeholder="Nouveau mot de passe (min. 4)"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full bg-[#270b42] border border-pink-500/30 outline-none rounded-xl py-2.5 px-3 text-sm text-white font-bold focus:border-pink-400"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-pink-600/30 border border-pink-400/40"
              >
                Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. HISTORY / INVOICE MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#1f0a33] to-[#120521] border border-pink-500/30 text-pink-50 rounded-3xl p-6 max-w-md w-full relative space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <button 
              onClick={() => setShowHistoryModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-pink-500/30"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-pink-200 bg-pink-500/20 border border-pink-500/30 px-2.5 py-0.5 rounded-full">
                {showHistoryModal === 'deposits' ? "Historique des Recharges" : showHistoryModal === 'withdrawals' ? "Historique des Retraits" : "Facture de Solde"}
              </span>
              <h3 className="text-xl font-black text-white mt-2">
                {showHistoryModal === 'deposits' ? "Recharger l'enregistrement" : showHistoryModal === 'withdrawals' ? "Enregistrement des retraits" : "Facture de Solde"}
              </h3>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1 text-xs">
              {(showHistoryModal === 'all' || showHistoryModal === 'deposits') && userRevenueLogs.map(log => (
                <div key={log.id} className="p-3 bg-[#240c3c] rounded-xl flex items-center justify-between border border-pink-500/25">
                  <div>
                    <div className="font-bold text-white text-sm flex items-center space-x-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
                      <span>Revenu 24h : {log.productName}</span>
                    </div>
                    <div className="text-[10px] text-pink-300/70 font-mono mt-0.5">{log.creditedAt ? new Date(log.creditedAt).toLocaleString('fr-FR') : 'Date inconnue'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-pink-300 text-sm">+{(Number(log.amount) || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 inline-block font-mono border border-pink-500/30">
                      Crédit Automatique
                    </div>
                  </div>
                </div>
              ))}

              {(showHistoryModal === 'all' || showHistoryModal === 'deposits') && userDeposits.map(dep => (
                <div key={dep.id} className="p-3 bg-[#240c3c] rounded-xl flex items-center justify-between border border-pink-500/25">
                  <div>
                    <div className="font-bold text-white text-sm">Recharge Mobile Money</div>
                    <div className="text-[10px] text-pink-300/70">{dep.createdAt ? new Date(dep.createdAt).toLocaleString('fr-FR') : 'Date inconnue'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-pink-300 text-sm">+{(Number(dep.amount) || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${dep.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : dep.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-pink-500/20 text-pink-300 border border-pink-500/40'}`}>
                      {dep.status === 'approved' ? 'Validé' : dep.status === 'rejected' ? 'Refusé' : 'En attente'}
                    </div>
                  </div>
                </div>
              ))}

              {(showHistoryModal === 'all' || showHistoryModal === 'withdrawals') && userWithdrawals.map(wth => (
                <div key={wth.id} className="p-3 bg-[#240c3c] rounded-xl flex items-center justify-between border border-pink-500/25">
                  <div>
                    <div className="font-bold text-white text-sm">Retrait Mobile Money</div>
                    <div className="text-[10px] text-pink-300/70">{wth.createdAt ? new Date(wth.createdAt).toLocaleString('fr-FR') : 'Date inconnue'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-300 text-sm">-{(Number(wth.amount) || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${wth.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : wth.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                      {wth.status === 'approved' ? 'Payé' : wth.status === 'rejected' ? 'Refusé' : 'En traitement'}
                    </div>
                  </div>
                </div>
              ))}

              {userRevenueLogs.length === 0 && userDeposits.length === 0 && userWithdrawals.length === 0 && (
                <div className="py-8 text-center text-pink-300/60 font-medium">
                  Aucun enregistrement trouvé.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
