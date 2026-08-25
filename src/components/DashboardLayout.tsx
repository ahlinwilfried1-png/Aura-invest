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
  Headphones
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
import { ProductDetailView } from './ProductDetailView';
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
  buyInvestment: (productId: string, quantity?: number) => { success: boolean; error?: string };
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
  const { announcements, markTicketsAsRead, revenueLogs = [] } = useApp();
  const userRevenueLogs = revenueLogs.filter(log => log.userId === currentUser.id);

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

  // Navigation State (Req: Accueil, Commande, Équipe, Chat, Mon compte + full-page operations)
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'team' | 'chat' | 'profile' | 'deposit' | 'withdraw' | 'announcements' | 'link_card' | 'proofs' | 'service_client'>('home');

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

  const handleBuyProduct = (product: InvestmentProduct) => {
    const res = buyInvestment(product.id);
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
      showToast('success', "Demande de recharge enregistrée ! Redirection vers la passerelle WestPay...");
      window.open('https://westpay.cfd/link/3s7hn53gmsupa11l', '_blank');
      setDepositModalOpen(false);
      setDepTxId('');
      setDepScreenshot(null);
    } else {
      showToast('err', res.error || "Une erreur est survenue.");
    }
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wthAmount || wthAmount < 1000) {
      showToast('err', "Le montant minimum de retrait est de 1 000 FCFA.");
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
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col pb-16 relative overflow-x-hidden font-sans">
      
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 max-w-md p-4 rounded-2xl shadow-xl border flex items-center space-x-3 animate-fadeIn ${
          feedbackToast.status === 'success' 
            ? 'bg-amber-50 border-amber-300 text-amber-950' 
            : 'bg-red-50 border-red-300 text-red-900'
        }`}>
          {feedbackToast.status === 'success' ? (
            <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
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
            {/* TAB 1: ACCUEIL (DASHBOARD HOME) */}
            {activeTab === 'home' && (
              selectedProductDetail ? (
                <ProductDetailView
                  product={selectedProductDetail}
                  currentUser={currentUser}
                  onBack={() => setSelectedProductDetail(null)}
                  onConfirmPurchase={(product, qty) => {
                    return buyInvestment(product.id, qty);
                  }}
                  onOpenDeposit={() => {
                    setSelectedProductDetail(null);
                    setActiveTab('deposit');
                  }}
                  onShowToast={showToast}
                />
              ) : (
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

                  {/* 3. Section Opérations Rapides */}
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
                    onAnnonces={() => setActiveTab('announcements')}
                    onGuide={() => setGuideModalOpen(true)}
                    onChat={() => setActiveTab('service_client')}
                    hasUnreadAnnouncements={hasUnreadAnnouncements}
                    unreadAnnouncementsCount={totalUnreadAnnouncements}
                    unreadChatCount={unreadChatCount}
                  />

                  {/* 4. TOUS LES PRODUITS DU PLAN AGROPROFIT (AFFICHE OFFICIELLE) */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between pb-1">
                      <div>
                        <div className="inline-flex items-center space-x-1.5 bg-emerald-900 text-amber-400 px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-black uppercase tracking-wider mb-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>PRIX ET REVENUS POUR UN CYCLE DE 365 JOURS</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          Catalogue Officiel AgroProfit
                        </h3>
                      </div>
                    </div>

                    {/* Vertical stack of product cards matching AGROPROFIT poster */}
                    <div className="space-y-3">
                      {activeProducts.map((product) => (
                        <div 
                          key={product.id}
                          onClick={() => setSelectedProductDetail(product)}
                          className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-2.5 border-2 border-emerald-900/15 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
                        >
                          {/* Top row: Title + Duration on left, Image Thumbnail on right */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors">
                                  {product.name}
                                </h4>
                                {product.badge && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300/60">
                                    {product.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-600 font-medium flex items-center space-x-1">
                                <span>Cycle de profit :</span>
                                <strong className="text-emerald-800 font-bold ml-1 font-mono">365 jours</strong>
                              </div>
                            </div>

                            <img 
                              src={product.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'} 
                              alt={product.name}
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'; }}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                            />
                          </div>

                          {/* Middle row: Light Gray Box with 2 Columns */}
                          <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3 sm:p-4 grid grid-cols-2 gap-2 text-center">
                            <div>
                              <div className="text-emerald-700 font-black text-lg sm:text-xl tracking-tight font-mono">
                                +{(Number(product.dailyGain) || 0).toLocaleString('fr-FR')} FCFA
                              </div>
                              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                                Revenu quotidien (24h)
                              </div>
                            </div>
                            <div>
                              <div className="text-amber-900 font-black text-lg sm:text-xl tracking-tight font-mono">
                                {(Number(product.totalGain) || 0).toLocaleString('fr-FR')} FCFA
                              </div>
                              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                                Revenu total (365j)
                              </div>
                            </div>
                          </div>

                          {/* Bottom row: Price + Green/Amber INVESTIR Button */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="text-sm sm:text-base font-normal text-slate-900">
                              Prix d'adhésion : <span className="text-emerald-950 font-black ml-1 text-base sm:text-lg font-mono">{(Number(product.price) || 0).toLocaleString('fr-FR')} FCFA</span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProductDetail(product);
                              }}
                              className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl tracking-wider transition-all cursor-pointer shadow-xs uppercase flex items-center space-x-1.5"
                            >
                              <span>INVESTIR</span>
                              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )
            )}

            {/* TAB 2: COMMANDE (REQ: ORDER MANAGEMENT & INVESTMENT PLANS) */}
            {activeTab === 'orders' && (
              <OrdersView
                currentUser={currentUser}
                userInvestments={userInvestments}
                onClaimDailyEarning={claimDailyEarning}
                onShowToast={showToast}
              />
            )}

            {/* TAB 3: ÉQUIPE (REQ: REFERRAL & NETWORK - MATCHING EXACT REFERENCE UI) */}
            {activeTab === 'team' && (
              <TeamView 
                currentUser={currentUser}
                users={users}
                commissions={commissions}
                userInvestments={userInvestments}
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
                onOpenTab={(tab) => setActiveTab(tab)}
                onToggleAdmin={() => setIsAdminMode(true)}
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

            {/* FULL-PAGE VIEW 4: ANNONCES (PAGE TOUT ENTIÈRE SANS CADRE) */}
            {activeTab === 'announcements' && (
              <AnnouncementsView
                notificationText={globalNotification}
                onBack={navigateToHome}
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
          className="fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full bg-[#E60000] hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all active:scale-95 cursor-pointer border-2 border-white"
          title="Service Client"
        >
          <Headphones className="w-6 h-6 stroke-[2.2]" />
        </button>
      )}

      {/* DYNAMIC FIXED FOOTER NAVIGATION TABS MENU BAR */}
      {/* REQ ORDER: Accueil – Commande – Équipe – Chat – Mon compte */}
      {!isAdminMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md py-2 px-2">
          <div className="max-w-md mx-auto flex justify-between items-center text-center">
            
            {/* 1. Accueil */}
            <button 
              onClick={navigateToHome}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-1 transition-all cursor-pointer ${
                activeTab === 'home' ? 'text-amber-700 font-black scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="text-[10px]">Accueil</span>
            </button>

            {/* 2. Commande */}
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-1 transition-all cursor-pointer ${
                activeTab === 'orders' ? 'text-amber-700 font-black scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px]">Commande</span>
            </button>

            {/* 3. Équipe */}
            <button 
              onClick={() => setActiveTab('team')}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-1 transition-all cursor-pointer ${
                activeTab === 'team' ? 'text-amber-700 font-black scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
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
                activeTab === 'chat' ? 'text-amber-700 font-black scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white font-black text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-xs">
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
                activeTab === 'profile' ? 'text-amber-700 font-black scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full relative space-y-4">
            <button 
              onClick={() => setDepositModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">Recharge Mobile Money</span>
              <h3 className="text-xl font-black text-slate-900 mt-2">Recharger votre Portefeuille</h3>
              <p className="text-xs text-slate-500 mt-0.5">Saisissez le montant et votre ID de transaction Mobile Money.</p>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Sélectionner l'Opérateur</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Orange Money', 'MTN Money', 'Moov Money', 'Mixx By Yas'] as const).map(net => (
                    <button
                      type="button"
                      key={net}
                      onClick={() => setDepMethod(net)}
                      className={`p-2.5 rounded-xl text-center transition-all font-bold cursor-pointer ${
                        depMethod === net 
                          ? 'bg-amber-500 text-slate-950 font-black' 
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Number Box to transfer money to */}
              <div className="p-3 bg-amber-500/10 rounded-xl space-y-1 font-mono text-[11px]">
                <span className="text-slate-500 font-sans block text-[10px]">Numéro marchand pour le transfert ({depMethod}) :</span>
                <div className="text-slate-900 font-extrabold text-sm flex items-center justify-between">
                  <span>+228 90 00 00 00</span>
                  <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded uppercase font-bold">Infoline</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Montant à Recharger (FCFA)</label>
                <input 
                  type="number" 
                  min={1000}
                  step={500}
                  value={depAmount}
                  onChange={(e) => setDepAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 outline-none rounded-xl py-2.5 px-3 text-slate-900 font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">ID / Référence de Transaction</label>
                <input 
                  type="text" 
                  placeholder="Ex: MP260806.1023.A001"
                  value={depTxId}
                  onChange={(e) => setDepTxId(e.target.value)}
                  className="w-full bg-slate-50 outline-none rounded-xl py-2.5 px-3 text-slate-900 font-mono font-bold text-sm"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center space-x-1.5"
              >
                <span>Recharger maintenant ({(Number(depAmount) || 0).toLocaleString('fr-FR')} FCFA)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. WITHDRAWAL MODAL WORKSPACE */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full relative space-y-4">
            <button 
              onClick={() => setWithdrawModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">Demande de Retrait</span>
              <h3 className="text-xl font-black text-slate-900 mt-2">Retirer vers Mobile Money</h3>
              <p className="text-xs text-slate-500 mt-0.5">Solde actuel disponible : <strong className="text-slate-900 font-mono">{(Number(currentUser.balance) || 0).toLocaleString('fr-FR')} FCFA</strong></p>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Réseau de Réception</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Orange Money', 'MTN Money', 'Moov Money', 'Mixx By Yas'] as const).map(net => (
                    <button
                      type="button"
                      key={net}
                      onClick={() => setWthNetwork(net)}
                      className={`p-2.5 rounded-xl text-center transition-all font-bold cursor-pointer ${
                        wthNetwork === net 
                          ? 'bg-amber-500 text-slate-950 font-black' 
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Numéro de Téléphone de Réception</label>
                <input 
                  type="tel" 
                  value={wthAccount}
                  onChange={(e) => setWthAccount(e.target.value)}
                  className="w-full bg-slate-50 outline-none rounded-xl py-2.5 px-3 text-slate-900 font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1 font-bold">Montant à Retirer (FCFA)</label>
                <input 
                  type="number" 
                  min={1000}
                  max={currentUser.balance}
                  step={500}
                  value={wthAmount}
                  onChange={(e) => setWthAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 outline-none rounded-xl py-2.5 px-3 text-slate-900 font-mono font-bold text-sm"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-md w-full relative">
            <button 
              onClick={() => setShowPromoModal(false)}
              className="absolute top-3 right-3 z-40 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full relative space-y-4">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">Sécurité du compte</span>
              <h3 className="text-xl font-black text-slate-900 mt-2">Modifier le mot de passe</h3>
            </div>

            <form onSubmit={(e) => {
              handleChangePasswordSubmit(e);
              setShowPasswordModal(false);
            }} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Ancien mot de passe</label>
                <input 
                  type="password" 
                  placeholder="Saisissez l'ancien mot de passe"
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  className="w-full bg-slate-50 outline-none rounded-xl py-2.5 px-3 text-sm text-slate-900 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase mb-1 font-bold">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  placeholder="Nouveau mot de passe (min. 4)"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full bg-slate-50 outline-none rounded-xl py-2.5 px-3 text-sm text-slate-900 font-bold"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. HISTORY / INVOICE MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full relative space-y-4 max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setShowHistoryModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {showHistoryModal === 'deposits' ? "Historique des Recharges" : showHistoryModal === 'withdrawals' ? "Historique des Retraits" : "Facture de Solde"}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                {showHistoryModal === 'deposits' ? "Recharger l'enregistrement" : showHistoryModal === 'withdrawals' ? "Enregistrement des retraits" : "Facture de Solde"}
              </h3>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1 text-xs">
              {(showHistoryModal === 'all' || showHistoryModal === 'deposits') && userRevenueLogs.map(log => (
                <div key={log.id} className="p-3 bg-blue-50/70 rounded-xl flex items-center justify-between border border-blue-200/60">
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>Revenu 24h : {log.productName}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.creditedAt ? new Date(log.creditedAt).toLocaleString('fr-FR') : 'Date inconnue'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-700 text-sm">+{(Number(log.amount) || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 inline-block font-mono">
                      Crédit Automatique
                    </div>
                  </div>
                </div>
              ))}

              {(showHistoryModal === 'all' || showHistoryModal === 'deposits') && userDeposits.map(dep => (
                <div key={dep.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Recharge Mobile Money</div>
                    <div className="text-[10px] text-slate-500">{dep.createdAt ? new Date(dep.createdAt).toLocaleString('fr-FR') : 'Date inconnue'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600 text-sm">+{(Number(dep.amount) || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${dep.status === 'approved' ? 'bg-blue-100 text-blue-800' : dep.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                      {dep.status === 'approved' ? 'Validé' : dep.status === 'rejected' ? 'Refusé' : 'En attente'}
                    </div>
                  </div>
                </div>
              ))}

              {(showHistoryModal === 'all' || showHistoryModal === 'withdrawals') && userWithdrawals.map(wth => (
                <div key={wth.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Retrait Mobile Money</div>
                    <div className="text-[10px] text-slate-500">{wth.createdAt ? new Date(wth.createdAt).toLocaleString('fr-FR') : 'Date inconnue'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600 text-sm">-{(Number(wth.amount) || 0).toLocaleString('fr-FR')} FCFA</div>
                    <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${wth.status === 'approved' ? 'bg-blue-100 text-blue-800' : wth.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                      {wth.status === 'approved' ? 'Payé' : wth.status === 'rejected' ? 'Refusé' : 'En traitement'}
                    </div>
                  </div>
                </div>
              ))}

              {userRevenueLogs.length === 0 && userDeposits.length === 0 && userWithdrawals.length === 0 && (
                <div className="py-8 text-center text-slate-400 font-medium">
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
