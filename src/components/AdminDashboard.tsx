import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InvestmentProduct, User, DepositRequest, WithdrawalRequest, SupportTicket } from '../types';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  Package, 
  ShoppingBag,
  Headphones, 
  Megaphone, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Gift, 
  UserX, 
  UserCheck, 
  X, 
  Eye, 
  LogOut, 
  Send,
  Sparkles,
  Shield,
  ShieldCheck,
  Wallet,
  AlertCircle,
  Lock
} from 'lucide-react';

interface AdminDashboardProps {
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExitAdmin }) => {
  const {
    users,
    products,
    userInvestments,
    deposits,
    withdrawals,
    withdrawalProofs,
    tickets,
    bonusCodes,
    globalNotification,
    processDeposit,
    processWithdrawal,
    processWithdrawalProof,
    deleteWithdrawalProof,
    updateWithdrawalProof,
    updateUserBalance,
    adminUpdateUserPassword,
    toggleBlockUser,
    updateUserRole,
    addOrUpdateProduct,
    deleteProduct,
    deleteUserInvestment,
    sendGlobalNotification,
    replyToTicket,
    generateBonusCode
  } = useApp();

  // Navigation tab state
  const [activeAdminTab, setActiveAdminTab] = useState<
    'dashboard' | 'deposits' | 'withdrawals' | 'proofs' | 'users' | 'products' | 'paid_products' | 'support' | 'announcements'
  >('dashboard');

  // Proof filter states
  const [proofFilter, setProofFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [proofSearch, setProofSearch] = useState('');
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);
  const [editingProof, setEditingProof] = useState<any | null>(null);

  // Search & Filters State
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [depositSearch, setDepositSearch] = useState('');

  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const [paidSearch, setPaidSearch] = useState('');
  const [paidFilter, setPaidFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [investmentToDelete, setInvestmentToDelete] = useState<any | null>(null);

  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'closed'>('all');

  // Toast Feedback State
  const [toast, setToast] = useState<{ status: 'success' | 'error'; text: string } | null>(null);

  const showToast = (status: 'success' | 'error', text: string) => {
    setToast({ status, text });
    setTimeout(() => setToast(null), 3500);
  };

  // Modals state
  // 1. Balance adjustment modal
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<number>(1000);
  const [balanceAdjustType, setBalanceAdjustType] = useState<'add' | 'subtract'>('add');

  // 1.5. Password adjustment modal
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [newUserPassword, setNewUserPassword] = useState<string>('');

  // 2. User details modal
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null);

  // 3. Product Create / Edit modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InvestmentProduct | null>(null);
  const [prodForm, setProdForm] = useState({
    id: '',
    name: '',
    price: 5000,
    dailyGain: 720,
    duration: 30,
    totalGain: 21600,
    image: '',
    description: '',
    badge: 'POPULAIRE',
    order: 1,
    isActive: true
  });

  // 4. Ticket Reply modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyMessage, setTicketReplyMessage] = useState('');

  // 5. Promo code generator form
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeAmount, setNewCodeAmount] = useState<number>(2000);
  const [newCodeMaxUses, setNewCodeMaxUses] = useState<number>(50);

  // 6. Global Banner announcement form
  const [bannerInput, setBannerInput] = useState(globalNotification || '');

  // 7. Generic Delete Confirmation Modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Calculate high level stats
  const pendingDepositsCount = deposits.filter(d => d.status === 'pending').length;
  const approvedDepositsSum = deposits.filter(d => d.status === 'approved').reduce((acc, d) => acc + d.amount, 0);

  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;
  const approvedWithdrawalsSum = withdrawals.filter(w => w.status === 'approved').reduce((acc, w) => acc + w.amount, 0);

  const openTicketsCount = tickets.filter(t => t.status === 'open').length;

  // Open Product Modal
  const handleOpenProductModal = (prod?: InvestmentProduct) => {
    if (prod) {
      setEditingProduct(prod);
      setProdForm({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        dailyGain: prod.dailyGain,
        duration: prod.duration,
        totalGain: prod.totalGain,
        image: prod.image || '',
        description: prod.description || '',
        badge: prod.badge || 'VIP',
        order: prod.order || 1,
        isActive: prod.isActive !== false
      });
    } else {
      setEditingProduct(null);
      const newId = `prod-${Date.now()}`;
      setProdForm({
        id: newId,
        name: 'Nouveau Produit Investissement',
        price: 10000,
        dailyGain: 1500,
        duration: 30,
        totalGain: 45000,
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
        description: 'Pack haut rendement financier.',
        badge: 'EXCLUSIF',
        order: products.length + 1,
        isActive: true
      });
    }
    setIsProductModalOpen(true);
  };

  // Submit Product Form
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim()) return;

    addOrUpdateProduct({
      id: prodForm.id,
      name: prodForm.name,
      price: Number(prodForm.price),
      dailyGain: Number(prodForm.dailyGain),
      duration: Number(prodForm.duration),
      totalGain: Number(prodForm.totalGain) || (Number(prodForm.dailyGain) * Number(prodForm.duration)),
      image: prodForm.image.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
      description: prodForm.description.trim(),
      badge: prodForm.badge.trim(),
      order: Number(prodForm.order),
      isActive: prodForm.isActive
    });

    setIsProductModalOpen(false);
    showToast('success', editingProduct ? 'Produit mis à jour avec succès !' : 'Nouveau produit créé avec succès !');
  };

  // Balance adjustment handler
  const handleApplyBalanceAdjust = () => {
    if (!selectedUserForBalance || balanceAdjustAmount <= 0) return;
    const finalChange = balanceAdjustType === 'add' ? balanceAdjustAmount : -balanceAdjustAmount;
    updateUserBalance(selectedUserForBalance.id, finalChange);
    showToast('success', `Solde de ${selectedUserForBalance.name} ajusté (${finalChange > 0 ? '+' : ''}${finalChange.toLocaleString()} FCFA).`);
    setSelectedUserForBalance(null);
  };

  // Bonus Code Generator Handler
  const handleCreateBonusCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) return;
    const res = generateBonusCode(newCodeName.trim(), newCodeAmount, newCodeMaxUses);
    if (res.success) {
      showToast('success', `Code promo ${newCodeName.trim().toUpperCase()} généré !`);
      setNewCodeName('');
    } else {
      showToast('error', res.error || 'Erreur lors de la création.');
    }
  };

  // Ticket Reply Handler
  const handleSendTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyMessage.trim()) return;
    replyToTicket(selectedTicket.id, ticketReplyMessage.trim());
    showToast('success', 'Réponse envoyée au client !');
    setSelectedTicket(null);
    setTicketReplyMessage('');
  };

  // Filtered Lists
  const filteredDeposits = deposits.filter(d => {
    const matchesFilter = depositFilter === 'all' || d.status === depositFilter;
    const matchesSearch = 
      d.userName.toLowerCase().includes(depositSearch.toLowerCase()) ||
      d.userPhone.includes(depositSearch) ||
      d.transactionId.toLowerCase().includes(depositSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesFilter = withdrawalFilter === 'all' || w.status === withdrawalFilter;
    const matchesSearch = 
      w.userName.toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
      w.userPhone.includes(withdrawalSearch) ||
      w.accountNumber.includes(withdrawalSearch);
    return matchesFilter && matchesSearch;
  });

  const filteredUsers = users.filter(u => {
    const matchesStatus = 
      userStatusFilter === 'all' || 
      (userStatusFilter === 'active' && !u.isBlocked) || 
      (userStatusFilter === 'blocked' && u.isBlocked);
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(userSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const filteredPaidProducts = userInvestments.filter(inv => {
    const user = users.find(u => u.id === inv.userId);
    const userName = user ? user.name : 'Utilisateur Inconnu';
    const userPhone = user ? user.phone : '';

    const matchesStatus = 
      paidFilter === 'all' || 
      (paidFilter === 'active' && inv.daysRemaining > 0) || 
      (paidFilter === 'completed' && inv.daysRemaining <= 0);

    const query = paidSearch.toLowerCase();
    const matchesSearch = 
      inv.productName.toLowerCase().includes(query) ||
      userName.toLowerCase().includes(query) ||
      userPhone.includes(query) ||
      inv.id.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === 'open') return t.status === 'open';
    if (ticketFilter === 'closed') return t.status === 'closed';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border flex items-center space-x-3 animate-fadeIn ${
          toast.status === 'success' 
            ? 'bg-emerald-600 border-emerald-500 text-white' 
            : 'bg-red-600 border-red-500 text-white'
        }`}>
          {toast.status === 'success' ? (
            <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
          )}
          <span className="text-xs font-bold leading-snug">{toast.text}</span>
        </div>
      )}

      {/* ADMIN HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Panneau d'Administration</h1>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold">
                  EN DIRECT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Gestion globale de la plateforme, transactions et utilisateurs</p>
            </div>
          </div>

          <button 
            onClick={onExitAdmin}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-all flex items-center space-x-2 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Quitter l'administration</span>
          </button>
        </div>

        {/* HORIZONTAL NAVIGATION BAR */}
        <div className="border-t border-slate-200 bg-slate-50 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 sm:space-x-2 py-2 min-w-max">
            
            <button
              onClick={() => setActiveAdminTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'dashboard'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Tableau de bord</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('deposits')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                activeAdminTab === 'deposits'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Dépôt</span>
              {pendingDepositsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                  {pendingDepositsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveAdminTab('withdrawals')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                activeAdminTab === 'withdrawals'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Retrait</span>
              {pendingWithdrawalsCount > 0 && (
                <span className="bg-red-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                  {pendingWithdrawalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveAdminTab('proofs')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                activeAdminTab === 'proofs'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Preuves de retrait</span>
              {withdrawalProofs.filter(p => p.status === 'pending').length > 0 && (
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                  {withdrawalProofs.filter(p => p.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveAdminTab('users')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'users'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Utilisateurs</span>
              <span className="text-[10px] opacity-80 bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded ml-1 font-mono">{users.length}</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('products')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'products'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Produits</span>
              <span className="text-[10px] opacity-80 bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded ml-1 font-mono">{products.length}</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('paid_products')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'paid_products'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Produits Payés</span>
              <span className="text-[10px] opacity-80 bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded ml-1 font-mono">{userInvestments.length}</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('support')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'support'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Support</span>
              {openTicketsCount > 0 && (
                <span className="bg-blue-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                  {openTicketsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveAdminTab('announcements')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'announcements'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Gestion des annonces</span>
            </button>

          </div>
        </div>
      </header>

      {/* MAIN ADMIN WORKSPACE AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-grow w-full">

        {/* 1. TABLEAU DE BORD (OVERVIEW PAGE) */}
        {activeAdminTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Alert banner if pending items exist */}
            {(pendingDepositsCount > 0 || pendingWithdrawalsCount > 0 || openTicketsCount > 0) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-amber-200 font-medium">
                    Actions requises: <strong className="text-white font-bold">{pendingDepositsCount}</strong> dépôt(s) en attente, <strong className="text-white font-bold">{pendingWithdrawalsCount}</strong> retrait(s) à traiter, <strong className="text-white font-bold">{openTicketsCount}</strong> ticket(s) support ouvert(s).
                  </p>
                </div>
                <div className="flex space-x-2">
                  {pendingDepositsCount > 0 && (
                    <button 
                      onClick={() => setActiveAdminTab('deposits')}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      Traiter les dépôts
                    </button>
                  )}
                  {pendingWithdrawalsCount > 0 && (
                    <button 
                      onClick={() => setActiveAdminTab('withdrawals')}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      Traiter les retraits
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-xs font-bold">Utilisateurs</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-1">{users.length}</div>
                <div className="text-[10px] text-slate-500 font-medium">Inscrits au total</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-xs font-bold">Dépôts Validés</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-emerald-700 mt-1">
                  {approvedDepositsSum.toLocaleString()} FCFA
                </div>
                <div className="text-[10px] text-amber-700 font-bold">{pendingDepositsCount} en attente</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-xs font-bold">Retraits Payés</span>
                  <ArrowDownLeft className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-red-600 mt-1">
                  {approvedWithdrawalsSum.toLocaleString()} FCFA
                </div>
                <div className="text-[10px] text-red-700 font-bold">{pendingWithdrawalsCount} à traiter</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-xs font-bold">Catalogue</span>
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                  {products.filter(p => p.isActive !== false).length} / {products.length}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Produits actifs</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-xs font-bold">Support Client</span>
                  <Headphones className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 mt-1">{tickets.length}</div>
                <div className="text-[10px] text-blue-700 font-bold">{openTicketsCount} ouverts</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-xs font-bold">Solde Global</span>
                  <Wallet className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-purple-800 mt-1">
                  {users.reduce((acc, u) => acc + u.balance, 0).toLocaleString()} FCFA
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Comptes clients</div>
              </div>

            </div>

            {/* Quick Actions Grid & Activity Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Pending Deposits Preview */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span>Dépôts récents en attente ({pendingDepositsCount})</span>
                  </h3>
                  <button 
                    onClick={() => setActiveAdminTab('deposits')}
                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                  >
                    Voir tout
                  </button>
                </div>

                {deposits.filter(d => d.status === 'pending').slice(0, 4).length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Aucune demande de dépôt en attente.</p>
                ) : (
                  <div className="space-y-2.5">
                    {deposits.filter(d => d.status === 'pending').slice(0, 4).map(dep => (
                      <div key={dep.id} className="bg-slate-900/80 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-700/50">
                        <div>
                          <div className="font-bold text-white">{dep.userName} ({dep.userPhone})</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {dep.method} • TxID: <span className="font-mono text-amber-300">{dep.transactionId}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-emerald-400 text-sm font-mono">{dep.amount.toLocaleString()} FCFA</span>
                          <button 
                            onClick={() => {
                              processDeposit(dep.id, 'approved');
                              showToast('success', "Dépôt approuvé ! Solde crédité.");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            Valider
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Withdrawals Preview */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <ArrowDownLeft className="w-4 h-4 text-red-400" />
                    <span>Demandes de retrait à traiter ({pendingWithdrawalsCount})</span>
                  </h3>
                  <button 
                    onClick={() => setActiveAdminTab('withdrawals')}
                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                  >
                    Voir tout
                  </button>
                </div>

                {withdrawals.filter(w => w.status === 'pending').slice(0, 4).length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Aucune demande de retrait en attente.</p>
                ) : (
                  <div className="space-y-2.5">
                    {withdrawals.filter(w => w.status === 'pending').slice(0, 4).map(wth => (
                      <div key={wth.id} className="bg-slate-900/80 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-700/50">
                        <div>
                          <div className="font-bold text-white">{wth.userName} ({wth.userPhone})</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {wth.network} • Numéro: <span className="font-mono text-slate-200">{wth.accountNumber}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-red-400 text-sm font-mono">-{wth.amount.toLocaleString()} FCFA</span>
                          <button 
                            onClick={() => {
                              processWithdrawal(wth.id, 'approved');
                              showToast('success', "Retrait validé & payé !");
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            Payer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* 2. DÉPÔT (DEPOSIT MANAGEMENT) */}
        {activeAdminTab === 'deposits' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header & Filter Controls */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                    <span>Gestion des Demandes de Dépôt</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Validez les recharges effectuées par Mobile Money pour créditer les comptes clients.</p>
                </div>

                <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  Total Validé : {approvedDepositsSum.toLocaleString()} FCFA
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex space-x-1.5 bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
                  <button 
                    onClick={() => setDepositFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      depositFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tous ({deposits.length})
                  </button>
                  <button 
                    onClick={() => setDepositFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      depositFilter === 'pending' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    En attente ({pendingDepositsCount})
                  </button>
                  <button 
                    onClick={() => setDepositFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      depositFilter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Validés ({deposits.filter(d => d.status === 'approved').length})
                  </button>
                  <button 
                    onClick={() => setDepositFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      depositFilter === 'rejected' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Refusés ({deposits.filter(d => d.status === 'rejected').length})
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, tel, TxID..."
                    value={depositSearch}
                    onChange={(e) => setDepositSearch(e.target.value)}
                    className="w-full bg-slate-900 text-xs text-white pl-9 pr-3 py-2 rounded-xl outline-none border border-slate-700/80 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Deposits Table / Cards */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden">
              {filteredDeposits.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  Aucun dépôt correspondant trouvé.
                </div>
              ) : (
                <div className="divide-y divide-slate-700/60">
                  {filteredDeposits.map(dep => (
                    <div key={dep.id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-800/50 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{dep.userName}</span>
                          <span className="text-xs text-slate-400 font-mono">({dep.userPhone})</span>
                        </div>
                        <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Moyen : <strong className="text-slate-100 font-bold">{dep.method}</strong></span>
                          <span>TxID : <strong className="text-amber-300 font-mono font-bold">{dep.transactionId}</strong></span>
                          <span className="text-slate-400 text-[11px]">{new Date(dep.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-400 text-base sm:text-lg">
                            +{dep.amount.toLocaleString()} FCFA
                          </div>
                        </div>

                        {dep.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                processDeposit(dep.id, 'approved');
                                showToast('success', "Dépôt approuvé avec succès !");
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                              Valider
                            </button>
                            <button 
                              onClick={() => {
                                processDeposit(dep.id, 'rejected');
                                showToast('error', "Dépôt refusé.");
                              }}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              Refuser
                            </button>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                            dep.status === 'approved' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {dep.status === 'approved' ? 'Validé' : 'Refusé'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. RETRAIT (WITHDRAWAL MANAGEMENT) */}
        {activeAdminTab === 'withdrawals' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header & Filter Controls */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <ArrowDownLeft className="w-5 h-5 text-red-400" />
                    <span>Gestion des Demandes de Retrait</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Validez et traitez les paiements des utilisateurs vers leurs numéros Mobile Money.</p>
                </div>

                <div className="text-xs font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">
                  Total Payé : {approvedWithdrawalsSum.toLocaleString()} FCFA
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex space-x-1.5 bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
                  <button 
                    onClick={() => setWithdrawalFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      withdrawalFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tous ({withdrawals.length})
                  </button>
                  <button 
                    onClick={() => setWithdrawalFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      withdrawalFilter === 'pending' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    En attente ({pendingWithdrawalsCount})
                  </button>
                  <button 
                    onClick={() => setWithdrawalFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      withdrawalFilter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Payés ({withdrawals.filter(w => w.status === 'approved').length})
                  </button>
                  <button 
                    onClick={() => setWithdrawalFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      withdrawalFilter === 'rejected' ? 'bg-slate-700 text-slate-300 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Annulés ({withdrawals.filter(w => w.status === 'rejected').length})
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, tel, numéro..."
                    value={withdrawalSearch}
                    onChange={(e) => setWithdrawalSearch(e.target.value)}
                    className="w-full bg-slate-900 text-xs text-white pl-9 pr-3 py-2 rounded-xl outline-none border border-slate-700/80 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Withdrawals Table / Cards */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden">
              {filteredWithdrawals.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  Aucune demande de retrait correspondante.
                </div>
              ) : (
                <div className="divide-y divide-slate-700/60">
                  {filteredWithdrawals.map(wth => (
                    <div key={wth.id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-800/50 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{wth.userName}</span>
                          <span className="text-xs text-slate-400 font-mono">({wth.userPhone})</span>
                        </div>
                        <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Réseau : <strong className="text-slate-100 font-bold">{wth.network}</strong></span>
                          <span>Numéro de réception : <strong className="text-amber-300 font-mono font-bold">{wth.accountNumber}</strong></span>
                          <span className="text-slate-400 text-[11px]">{new Date(wth.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                        <div className="text-right">
                          <div className="font-mono font-bold text-red-400 text-base sm:text-lg">
                            -{wth.amount.toLocaleString()} FCFA
                          </div>
                        </div>

                        {wth.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                processWithdrawal(wth.id, 'approved');
                                showToast('success', "Retrait validé & payé !");
                              }}
                              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                              Valider & Payer
                            </button>
                            <button 
                              onClick={() => {
                                processWithdrawal(wth.id, 'rejected');
                                showToast('error', "Retrait rejeté & solde remboursé.");
                              }}
                              className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              Rejeter / Rembourser
                            </button>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                            wth.status === 'approved' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {wth.status === 'approved' ? 'Payé' : 'Annulé'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3.5. PREUVES DE RETRAIT (WITHDRAWAL PROOFS MANAGEMENT) */}
        {/* 3. GESTION DES PREUVES DE RETRAIT */}
        {activeAdminTab === 'proofs' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Gestion des Preuves de Retrait ({withdrawalProofs.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Preuves soumises par les utilisateurs et publiées automatiquement sur le site. Vous pouvez les supprimer ici.
                  </p>
                </div>

                <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  {withdrawalProofs.length} Publiée(s) en direct
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Rechercher par nom, téléphone masqué, commentaire..."
                  value={proofSearch}
                  onChange={(e) => setProofSearch(e.target.value)}
                  className="w-full bg-slate-900 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl outline-none border border-slate-700 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Proofs Cards Grid */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-4 sm:p-5 shadow-2xs">
              {withdrawalProofs.filter(p => {
                const query = proofSearch.toLowerCase();
                return (
                  p.userName.toLowerCase().includes(query) ||
                  p.userPhone.includes(query) ||
                  (p.message && p.message.toLowerCase().includes(query)) ||
                  p.amount.toString().includes(query)
                );
              }).length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-medium">
                  Aucune preuve de retrait enregistrée dans la base de données.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {withdrawalProofs.filter(p => {
                    const query = proofSearch.toLowerCase();
                    return (
                      p.userName.toLowerCase().includes(query) ||
                      p.userPhone.includes(query) ||
                      (p.message && p.message.toLowerCase().includes(query)) ||
                      p.amount.toString().includes(query)
                    );
                  }).map((proof) => (
                    <div key={proof.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative shadow-2xs">
                      <div className="space-y-2">
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Publiée en direct</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{proof.createdAt}</span>
                        </div>

                        {/* User Info & Amount */}
                        <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{proof.userName}</div>
                            <div className="text-xs text-slate-500 font-mono">{proof.userPhone}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-extrabold text-emerald-700 text-base">
                              +{proof.amount.toLocaleString()} FCFA
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold">{proof.network}</div>
                          </div>
                        </div>

                        {/* User Comment */}
                        {proof.message && (
                          <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200">
                            "{proof.message}"
                          </p>
                        )}

                        {/* Image Preview Thumbnail */}
                        {proof.imageUrl ? (
                          <div 
                            onClick={() => setSelectedProofImage(proof.imageUrl)}
                            className="relative rounded-xl overflow-hidden border border-slate-200 group cursor-pointer bg-slate-200 h-36 flex items-center justify-center"
                          >
                            <img src={proof.imageUrl} alt="Preuve" className="w-full h-full object-cover object-top group-hover:scale-105 transition-all" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center space-x-1.5 text-white text-xs font-bold">
                              <Eye className="w-4 h-4" />
                              <span>Agrandir</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 text-xs font-medium">
                            Aucune image jointe
                          </div>
                        )}
                      </div>

                      {/* Action Button: ONLY Supprimer */}
                      <div className="pt-2 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setDeleteConfirmation({
                              isOpen: true,
                              title: "Suppression de la preuve de retrait",
                              message: `Êtes-vous sûr de vouloir supprimer définitivement la preuve de retrait de ${proof.userName} (${proof.amount.toLocaleString()} FCFA) ? Elle disparaîtra immédiatement de la plateforme.`,
                              onConfirm: () => {
                                deleteWithdrawalProof(proof.id);
                                showToast('success', "Preuve de retrait supprimée avec succès !");
                              }
                            });
                          }}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 4. UTILISATEURS (USERS MANAGEMENT) */}
        {activeAdminTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span>Gestion des Utilisateurs ({users.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Consultez, modifiez les soldes et gérez les accès des comptes utilisateurs.</p>
                </div>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex space-x-1.5 bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
                  <button 
                    onClick={() => setUserStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      userStatusFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tous ({users.length})
                  </button>
                  <button 
                    onClick={() => setUserStatusFilter('active')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      userStatusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Actifs ({users.filter(u => !u.isBlocked).length})
                  </button>
                  <button 
                    onClick={() => setUserStatusFilter('blocked')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      userStatusFilter === 'blocked' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Bloqués ({users.filter(u => u.isBlocked).length})
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, téléphone, code..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-slate-900 text-xs text-white pl-9 pr-3 py-2 rounded-xl outline-none border border-slate-700/80 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Users List / Cards */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  Aucun utilisateur trouvé.
                </div>
              ) : (
                <div className="divide-y divide-slate-700/60">
                  {filteredUsers.map(usr => (
                    <div key={usr.id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-800/50 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-base">{usr.name}</span>
                          <span className="text-xs text-slate-400 font-mono">({usr.phone})</span>
                          {usr.role === 'admin' && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">ADMIN</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                          <span>WhatsApp: <strong className="text-slate-200">{usr.whatsapp}</strong></span>
                          <span>Code Parrain: <strong className="text-amber-300 font-mono font-bold">{usr.referralCode}</strong></span>
                          <span>Pays: <strong className="text-slate-200">{usr.country}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Solde Client</div>
                          <div className="font-mono font-bold text-white text-base sm:text-lg">
                            {usr.balance.toLocaleString()} FCFA
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setSelectedUserForBalance(usr)}
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                            title="Ajuster le solde"
                          >
                            <Wallet className="w-3.5 h-3.5 text-amber-400" />
                            <span>Solde</span>
                          </button>

                          <button 
                            onClick={() => {
                              setSelectedUserForPassword(usr);
                              setNewUserPassword('');
                            }}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                            title="Modifier le mot de passe"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">Mot de passe</span>
                          </button>

                          <button 
                            onClick={() => setSelectedUserDetails(usr)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                            title="Voir détails"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span className="hidden sm:inline">Détails</span>
                          </button>

                          <button 
                            onClick={() => {
                              toggleBlockUser(usr.id);
                              showToast('success', usr.isBlocked ? `Compte de ${usr.name} débloqué.` : `Compte de ${usr.name} bloqué.`);
                            }}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              usr.isBlocked 
                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            title={usr.isBlocked ? "Débloquer le compte" : "Bloquer le compte"}
                          >
                            {usr.isBlocked ? <UserX className="w-4 h-4 text-red-400" /> : <UserCheck className="w-4 h-4 text-emerald-400" />}
                          </button>

                          <button 
                            onClick={() => {
                              const newRole = usr.role === 'admin' ? 'user' : 'admin';
                              updateUserRole(usr.id, newRole);
                              showToast('success', newRole === 'admin' 
                                ? `Le compte de ${usr.name} est désormais Administrateur.` 
                                : `Le rôle d'administrateur a été retiré à ${usr.name}.`
                              );
                            }}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              usr.role === 'admin' 
                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                            title={usr.role === 'admin' ? "Retirer le rôle Administrateur" : "Nommer Administrateur"}
                          >
                            <Shield className={`w-4 h-4 ${usr.role === 'admin' ? 'text-amber-400 fill-amber-400/20' : 'text-slate-400'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 5. PRODUITS (PRODUCTS MANAGEMENT) */}
        {activeAdminTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  <span>Catalogue des Produits d'Investissement</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Gérez, créez ou modifiez les formules d'investissement visibles par les utilisateurs.</p>
              </div>

              <button 
                onClick={() => handleOpenProductModal()}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2 shadow-md shadow-red-600/20"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>Ajouter un Produit</span>
              </button>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(prod => (
                <div key={prod.id} className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded uppercase">
                          {prod.badge || 'VIP'}
                        </span>
                        <h4 className="text-base font-bold text-white leading-snug">{prod.name}</h4>
                      </div>
                      <img 
                        src={prod.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'} 
                        alt={prod.name}
                        className="w-16 h-14 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                      />
                    </div>

                    <div className="bg-slate-900/90 p-3 rounded-xl grid grid-cols-2 gap-2 text-center text-xs">
                      <div>
                        <div className="text-slate-400 text-[10px]">Prix(FCFA)</div>
                        <div className="font-bold text-white text-sm font-mono">{prod.price.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Durée</div>
                        <div className="font-bold text-white text-sm font-mono">{prod.duration} Jours</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Revenu / Jour</div>
                        <div className="font-bold text-emerald-400 text-sm font-mono">+{prod.dailyGain.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Revenu Total</div>
                        <div className="font-bold text-amber-400 text-sm font-mono">{prod.totalGain.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                    <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
                      prod.isActive !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {prod.isActive !== false ? 'Actif' : 'Masqué'}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleOpenProductModal(prod)}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs p-2 rounded-lg cursor-pointer"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setDeleteConfirmation({
                            isOpen: true,
                            title: "Suppression du produit",
                            message: `Êtes-vous sûr de vouloir supprimer définitivement le produit "${prod.name}" ?`,
                            onConfirm: () => {
                              deleteProduct(prod.id);
                              showToast('success', "Produit supprimé avec succès.");
                            }
                          });
                        }}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 p-2 rounded-lg cursor-pointer transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 6. PRODUITS PAYÉS (PAID PRODUCTS / USER INVESTMENTS MANAGEMENT) */}
        {activeAdminTab === 'paid_products' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header & Overview */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-red-500/20 text-red-300 font-mono border border-red-500/30 px-2.5 py-0.5 rounded-full uppercase font-bold">
                      ADMINISTRATION DES COMMANDES CLIENTS
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2 mt-1.5">
                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                    <span>Produits Payés & Contrats d'Investissement ({userInvestments.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Consultez tous les produits payés et souscrits par les utilisateurs. Vous pouvez supprimer un produit payé en cas de besoin.
                  </p>
                </div>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Produits Souscrits</span>
                  <div className="text-xl font-black text-white font-mono mt-0.5">{userInvestments.length}</div>
                </div>
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Capital Total Investi</span>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                    {userInvestments.reduce((sum, inv) => sum + inv.price, 0).toLocaleString()} FCFA
                  </div>
                </div>
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Gains Quotidiens Générés</span>
                  <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                    +{userInvestments.reduce((sum, inv) => sum + inv.dailyGain, 0).toLocaleString()} FCFA/j
                  </div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Chercher client, téléphone, produit..."
                    value={paidSearch}
                    onChange={(e) => setPaidSearch(e.target.value)}
                    className="w-full bg-slate-900 text-xs text-white pl-9 pr-8 py-2.5 rounded-xl outline-none border border-slate-700 focus:border-red-500 font-medium"
                  />
                  {paidSearch && (
                    <button
                      onClick={() => setPaidSearch('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex space-x-2 bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setPaidFilter('all')}
                    className={`flex-1 sm:flex-initial text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      paidFilter === 'all' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tous ({userInvestments.length})
                  </button>
                  <button
                    onClick={() => setPaidFilter('active')}
                    className={`flex-1 sm:flex-initial text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      paidFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    En cours ({userInvestments.filter(i => i.daysRemaining > 0).length})
                  </button>
                  <button
                    onClick={() => setPaidFilter('completed')}
                    className={`flex-1 sm:flex-initial text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      paidFilter === 'completed' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Terminés ({userInvestments.filter(i => i.daysRemaining <= 0).length})
                  </button>
                </div>
              </div>
            </div>

            {/* List of Paid Products */}
            {filteredPaidProducts.length === 0 ? (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-12 text-center text-slate-400 text-xs font-medium space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Aucun produit payé trouvé correspondant à vos critères de recherche.</p>
              </div>
            ) : (
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 text-[10px] font-mono uppercase tracking-wider border-b border-slate-700/80">
                        <th className="py-3 px-4">Utilisateur / Client</th>
                        <th className="py-3 px-4">Produit Payé</th>
                        <th className="py-3 px-4">Prix & Rendement</th>
                        <th className="py-3 px-4">Statut & Durée</th>
                        <th className="py-3 px-4">Date d'Achat</th>
                        <th className="py-3 px-4 text-right">Action Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 font-medium">
                      {filteredPaidProducts.map(inv => {
                        const user = users.find(u => u.id === inv.userId);
                        const isFinished = inv.daysRemaining <= 0;

                        return (
                          <tr key={inv.id} className="hover:bg-slate-700/30 transition-colors">
                            {/* Client */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white text-sm">
                                {user ? user.name : 'Utilisateur Inconnu'}
                              </div>
                              <div className="text-[11px] text-amber-300 font-mono mt-0.5">
                                {user ? user.phone : 'N/A'}
                              </div>
                            </td>

                            {/* Product Name */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white flex items-center space-x-1.5">
                                <span>{inv.productName}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono block">ID: {inv.id}</span>
                            </td>

                            {/* Price & Daily Return */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-emerald-400">
                                {inv.price.toLocaleString()} FCFA
                              </div>
                              <div className="text-[10px] text-slate-300">
                                +{inv.dailyGain.toLocaleString()} FCFA/jour
                              </div>
                            </td>

                            {/* Status & Remaining Days */}
                            <td className="py-3.5 px-4">
                              {isFinished ? (
                                <span className="inline-flex items-center text-[10px] font-bold uppercase font-mono bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-full">
                                  Terminé (0 j)
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-bold uppercase font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                  Actif ({inv.daysRemaining} j / {inv.duration} j)
                                </span>
                              )}
                            </td>

                            {/* Purchase Date */}
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                              {new Date(inv.purchaseDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </td>

                            {/* Delete Button */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setInvestmentToDelete(inv)}
                                className="bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer inline-flex items-center space-x-1.5"
                                title="Supprimer ce produit payé"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Supprimer</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 7. SUPPORT CLIENT */}
        {activeAdminTab === 'support' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Headphones className="w-5 h-5 text-blue-400" />
                    <span>Support Client ({tickets.length} tickets)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Répondez aux demandes d'assistance des utilisateurs en temps réel.</p>
                </div>
              </div>

              <div className="flex space-x-2 bg-slate-900 p-1 rounded-xl w-fit">
                <button 
                  onClick={() => setTicketFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    ticketFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tous ({tickets.length})
                </button>
                <button 
                  onClick={() => setTicketFilter('open')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    ticketFilter === 'open' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ouverts ({openTicketsCount})
                </button>
                <button 
                  onClick={() => setTicketFilter('closed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    ticketFilter === 'closed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Résolus ({tickets.filter(t => t.status === 'closed').length})
                </button>
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl py-12 text-center text-slate-400 text-xs font-medium">
                  Aucun ticket support correspondant.
                </div>
              ) : (
                filteredTickets.map(tkt => (
                  <div key={tkt.id} className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-base">{tkt.subject}</span>
                          <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
                            tkt.status === 'open' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {tkt.status === 'open' ? 'En attente' : 'Résolu'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Client: <strong className="text-slate-200">{tkt.userName}</strong> • {new Date(tkt.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedTicket(tkt)}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Répondre</span>
                      </button>
                    </div>

                    <div className="bg-slate-900/90 p-3.5 rounded-xl text-xs text-slate-200 leading-relaxed font-sans">
                      {tkt.message}
                    </div>

                    {tkt.imageUrl && (
                      <div className="pt-2 space-y-1">
                        <span className="text-[10px] text-amber-400 font-mono font-bold uppercase block">
                          📷 Image transmise par l'utilisateur :
                        </span>
                        <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 max-w-sm max-h-64 shadow-md">
                          <a href={tkt.imageUrl} target="_blank" rel="noreferrer" title="Cliquer pour agrandir">
                            <img 
                              src={tkt.imageUrl} 
                              alt="Capture envoyée par le client" 
                              className="w-full h-full object-contain hover:scale-102 transition-transform cursor-pointer" 
                            />
                          </a>
                        </div>
                      </div>
                    )}

                    {tkt.reply && (
                      <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-200 space-y-1">
                        <div className="font-bold text-emerald-400 text-[11px] uppercase">Réponse de l'administration :</div>
                        <p>{tkt.reply}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* 7. GESTION DES ANNONCES */}
        {activeAdminTab === 'announcements' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Active Banner Control Card */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Megaphone className="w-5 h-5 text-amber-400" />
                  <span>Bandeau d'Annonce Défilant (Marquee)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Ce message défile en haut de l'écran pour tous les utilisateurs connectés.</p>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: Événement VIP : Bonus de 10% sur les recharges Orange & MTN..."
                  value={bannerInput}
                  onChange={(e) => setBannerInput(e.target.value)}
                  className="flex-grow bg-slate-900 text-xs text-white px-3.5 py-3 rounded-xl outline-none border border-slate-700 focus:border-red-500 font-bold"
                />
                <button 
                  onClick={() => {
                    sendGlobalNotification(bannerInput.trim() || null);
                    showToast('success', "Bandeau d'annonce mis à jour !");
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Publier
                </button>
                {globalNotification && (
                  <button 
                    onClick={() => {
                      sendGlobalNotification(null);
                      setBannerInput('');
                      showToast('success', "Bandeau effacé.");
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Bonus Promo Codes Generator */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <span>Générateur de Codes Promo & Bonus</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Créez des codes promotionnels que les utilisateurs peuvent utiliser dans la rubrique "Mon Compte".</p>
              </div>

              <form onSubmit={handleCreateBonusCode} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-medium">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Code promo</label>
                  <input 
                    type="text" 
                    placeholder="EX: CADEAU2000"
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value)}
                    className="w-full bg-slate-900 text-white font-mono uppercase font-bold p-2.5 rounded-xl outline-none border border-slate-700 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Montant crédité (FCFA)</label>
                  <input 
                    type="number" 
                    value={newCodeAmount}
                    onChange={(e) => setNewCodeAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 text-white font-mono font-bold p-2.5 rounded-xl outline-none border border-slate-700 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Limite d'utilisations</label>
                  <input 
                    type="number" 
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(Number(e.target.value))}
                    className="w-full bg-slate-900 text-white font-mono font-bold p-2.5 rounded-xl outline-none border border-slate-700 focus:border-red-500"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Générer Code
                  </button>
                </div>
              </form>

              {/* List of active bonus codes */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase mb-2 font-mono">Codes Bonus Actifs ({bonusCodes.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {bonusCodes.map(b => (
                    <div key={b.code} className="bg-slate-900 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="font-black text-amber-300 text-sm">{b.code}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Valeur: <strong className="text-emerald-400">{b.amount.toLocaleString()} FCFA</strong></div>
                      </div>
                      <div className="text-right text-[11px] text-slate-400">
                        {b.usedBy.length} / {b.maxUses} utilisés
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* MODAL: BALANCE ADJUSTMENT */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full relative space-y-4">
            <button 
              onClick={() => setSelectedUserForBalance(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full">Ajustement Financier</span>
              <h3 className="text-lg font-bold text-white mt-2">Modifier le solde de {selectedUserForBalance.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Solde actuel: <strong className="text-amber-300 font-mono">{selectedUserForBalance.balance.toLocaleString()} FCFA</strong></p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex gap-2">
                <button 
                  onClick={() => setBalanceAdjustType('add')}
                  className={`flex-1 py-2.5 rounded-xl font-bold cursor-pointer transition-all ${
                    balanceAdjustType === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  + Ajouter (Créditer)
                </button>
                <button 
                  onClick={() => setBalanceAdjustType('subtract')}
                  className={`flex-1 py-2.5 rounded-xl font-bold cursor-pointer transition-all ${
                    balanceAdjustType === 'subtract' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  - Déduire (Débiter)
                </button>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Montant (FCFA)</label>
                <input 
                  type="number" 
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 text-white font-mono font-bold text-base p-3 rounded-xl border border-slate-700 outline-none focus:border-amber-500"
                />
              </div>

              <button 
                onClick={handleApplyBalanceAdjust}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
              >
                Confirmer la modification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: USER PASSWORD MODIFICATION */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full relative space-y-4">
            <button 
              onClick={() => setSelectedUserForPassword(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full">Sécurité Compte</span>
              <h3 className="text-lg font-bold text-white mt-2">Modifier le mot de passe</h3>
              <p className="text-xs text-slate-400 mt-0.5">Utilisateur: <strong className="text-white font-bold">{selectedUserForPassword.name}</strong> ({selectedUserForPassword.phone})</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const res = adminUpdateUserPassword(selectedUserForPassword.id, newUserPassword);
                if (res.success) {
                  showToast('success', `Mot de passe de ${selectedUserForPassword.name} modifié avec succès !`);
                  setSelectedUserForPassword(null);
                  setNewUserPassword('');
                } else {
                  showToast('error', res.error || "Erreur de modification du mot de passe.");
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Nouveau mot de passe</label>
                <input 
                  type="text" 
                  placeholder="Saisissez le nouveau mot de passe"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono font-bold text-sm p-3 rounded-xl border border-slate-700 outline-none focus:border-amber-500"
                  required
                  minLength={4}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                Confirmer le nouveau mot de passe
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRODUCT CREATE / EDIT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full relative space-y-4 my-8">
            <button 
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-red-400 bg-red-500/20 px-2.5 py-0.5 rounded-full">Catalogue Produit</span>
              <h3 className="text-xl font-bold text-white mt-2">
                {editingProduct ? `Modifier: ${editingProduct.name}` : "Nouveau Produit d'Investissement"}
              </h3>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Nom du Produit</label>
                <input 
                  type="text" 
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full bg-slate-950 text-white font-bold p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Prix (FCFA)</label>
                  <input 
                    type="number" 
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-white font-mono font-bold p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Revenu / Jour (FCFA)</label>
                  <input 
                    type="number" 
                    value={prodForm.dailyGain}
                    onChange={(e) => {
                      const dg = Number(e.target.value);
                      setProdForm({ ...prodForm, dailyGain: dg, totalGain: dg * prodForm.duration });
                    }}
                    className="w-full bg-slate-950 text-white font-mono font-bold p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Durée (Jours)</label>
                  <input 
                    type="number" 
                    value={prodForm.duration}
                    onChange={(e) => {
                      const dur = Number(e.target.value);
                      setProdForm({ ...prodForm, duration: dur, totalGain: prodForm.dailyGain * dur });
                    }}
                    className="w-full bg-slate-950 text-white font-mono font-bold p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Revenu Total (FCFA)</label>
                  <input 
                    type="number" 
                    value={prodForm.totalGain}
                    onChange={(e) => setProdForm({ ...prodForm, totalGain: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-white font-mono font-bold p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Badge (Ex: HOT, VIP)</label>
                  <input 
                    type="text" 
                    value={prodForm.badge}
                    onChange={(e) => setProdForm({ ...prodForm, badge: e.target.value })}
                    className="w-full bg-slate-950 text-white font-bold p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Ordre d'affichage</label>
                  <input 
                    type="number" 
                    value={prodForm.order}
                    onChange={(e) => setProdForm({ ...prodForm, order: Number(e.target.value) })}
                    className="w-full bg-slate-950 text-white font-mono font-bold p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">URL de l'image du produit</label>
                <input 
                  type="text" 
                  value={prodForm.image}
                  onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 text-white font-mono text-xs p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="prod-active-toggle"
                  checked={prodForm.isActive}
                  onChange={(e) => setProdForm({ ...prodForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 accent-red-600 cursor-pointer"
                />
                <label htmlFor="prod-active-toggle" className="text-xs text-slate-200 font-bold cursor-pointer">
                  Produit actif & disponible à l'achat
                </label>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-600/20 mt-2"
              >
                Enregistrer le Produit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUPPORT TICKET REPLY */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full relative space-y-4">
            <button 
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-blue-400 bg-blue-500/20 px-2.5 py-0.5 rounded-full">Réponse Support</span>
              <h3 className="text-lg font-bold text-white mt-2">Répondre à {selectedTicket.userName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sujet: <strong className="text-white">{selectedTicket.subject}</strong></p>
            </div>

            <form onSubmit={handleSendTicketReply} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Message de l'utilisateur :</label>
                <div className="bg-slate-950 p-3 rounded-xl text-slate-300 font-sans leading-relaxed">
                  {selectedTicket.message}
                </div>
                {selectedTicket.imageUrl && (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] text-amber-400 font-mono font-bold uppercase block">📷 Image jointe :</span>
                    <div className="rounded-xl overflow-hidden max-h-48 bg-slate-950 border border-slate-700">
                      <a href={selectedTicket.imageUrl} target="_blank" rel="noreferrer">
                        <img src={selectedTicket.imageUrl} alt="Pièce jointe" className="w-full h-full object-contain cursor-pointer" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Votre réponse :</label>
                <textarea 
                  rows={4}
                  value={ticketReplyMessage}
                  onChange={(e) => setTicketReplyMessage(e.target.value)}
                  placeholder="Saisissez votre réponse explicative..."
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-700 outline-none focus:border-red-500 font-sans text-xs"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer la réponse</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: USER DETAILS */}
      {selectedUserDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full relative space-y-4">
            <button 
              onClick={() => setSelectedUserDetails(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full">Fiche Utilisateur</span>
              <h3 className="text-xl font-bold text-white mt-2">{selectedUserDetails.name}</h3>
              <p className="text-xs text-slate-400">Inscrit le {new Date(selectedUserDetails.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="space-y-2 text-xs font-medium bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Téléphone:</span>
                <span className="text-white font-mono font-bold">{selectedUserDetails.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">WhatsApp:</span>
                <span className="text-white font-mono font-bold">{selectedUserDetails.whatsapp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Solde:</span>
                <span className="text-amber-400 font-mono font-bold">{selectedUserDetails.balance.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Code Parrain:</span>
                <span className="text-white font-mono font-bold">{selectedUserDetails.referralCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Pays:</span>
                <span className="text-white font-bold">{selectedUserDetails.country}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Rôle:</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
                    selectedUserDetails.role === 'admin' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {selectedUserDetails.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </span>
                  <button
                    onClick={() => {
                      const newRole = selectedUserDetails.role === 'admin' ? 'user' : 'admin';
                      updateUserRole(selectedUserDetails.id, newRole);
                      setSelectedUserDetails({ ...selectedUserDetails, role: newRole });
                      showToast('success', newRole === 'admin' 
                        ? `Le compte de ${selectedUserDetails.name} est désormais Administrateur.` 
                        : `Le rôle Admin a été retiré à ${selectedUserDetails.name}.`
                      );
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    {selectedUserDetails.role === 'admin' ? 'Rétrograder' : 'Promouvoir Admin'}
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedUserDetails(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL: DELETE PAID PRODUCT CONFIRMATION */}
      {investmentToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full relative space-y-4">
            <button 
              onClick={() => setInvestmentToDelete(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Supprimer le produit payé</h3>
                <p className="text-xs text-slate-400">Confirmation d'annulation de souscription</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Client :</span>
                <strong className="text-white">
                  {users.find(u => u.id === investmentToDelete.userId)?.name || 'Inconnu'}
                </strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Produit :</span>
                <strong className="text-amber-300">{investmentToDelete.productName}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Prix :</span>
                <strong className="text-emerald-400 font-mono">{investmentToDelete.price.toLocaleString()} FCFA</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gains quotidiens :</span>
                <strong className="text-white font-mono">+{investmentToDelete.dailyGain.toLocaleString()} FCFA/j</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Durée restante :</span>
                <strong className="text-white font-mono">{investmentToDelete.daysRemaining} jours</strong>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200">
              ⚠️ Attention: Supprimer ce produit payé le retirera définitivement de la liste des contrats souscrits de l'utilisateur.
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setInvestmentToDelete(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteUserInvestment(investmentToDelete.id);
                  showToast('success', `Produit payé "${investmentToDelete.productName}" supprimé avec succès !`);
                  setInvestmentToDelete(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer shadow-md shadow-red-600/20"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROOF IMAGE FULLVIEW LIGHTBOX */}
      {selectedProofImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setSelectedProofImage(null)}
              className="absolute -top-12 right-0 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedProofImage}
              alt="Preuve de retrait"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl border-2 border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROOF INFO */}
      {editingProof && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full relative space-y-4 shadow-xl">
            <button
              onClick={() => setEditingProof(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">Édition Preuve</span>
              <h3 className="text-lg font-bold text-slate-900 mt-2">Modifier la Preuve de Retrait</h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateWithdrawalProof(editingProof.id, {
                  amount: editingProof.amount,
                  userPhone: editingProof.userPhone,
                  message: editingProof.message,
                  network: editingProof.network
                });
                showToast('success', "Informations de la preuve mises à jour !");
                setEditingProof(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  value={editingProof.amount}
                  onChange={(e) => setEditingProof({ ...editingProof, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 text-slate-900 font-mono font-bold p-2.5 rounded-xl border border-slate-200 outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">Téléphone affiché</label>
                <input
                  type="text"
                  value={editingProof.userPhone}
                  onChange={(e) => setEditingProof({ ...editingProof, userPhone: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 font-mono p-2.5 rounded-xl border border-slate-200 outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">Commentaire / Témoignage</label>
                <textarea
                  rows={3}
                  value={editingProof.message || ''}
                  onChange={(e) => setEditingProof({ ...editingProof, message: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">Réseau / Moyen</label>
                <input
                  type="text"
                  value={editingProof.network}
                  onChange={(e) => setEditingProof({ ...editingProof, network: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Sauvegarder les modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GENERIC DELETE CONFIRMATION MODAL */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{deleteConfirmation.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{deleteConfirmation.message}</p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteConfirmation.onConfirm();
                  setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
