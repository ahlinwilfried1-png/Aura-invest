import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { InvestmentProduct, User, DepositRequest, WithdrawalRequest, SupportTicket, FaqItem, RechargeChannel } from '../types';
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
  Lock,
  KeyRound,
  RotateCw,
  Ticket,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Power,
  EyeOff,
  HelpCircle,
  CreditCard,
  Copy
} from 'lucide-react';

const ADMIN_BG_IMAGES = [
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1600&auto=format&fit=crop&q=80'
];

interface AdminDashboardProps {
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExitAdmin }) => {
  // Rotating background images state
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % ADMIN_BG_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
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
    adminUpdateUserPin,
    toggleBlockUser,
    updateUserRole,
    addOrUpdateProduct,
    deleteProduct,
    deleteUserInvestment,
    sendGlobalNotification,
    replyToTicket,
    sendAdminDirectMessage,
    generateBonusCode,
    drawRecords,
    wheelConfig,
    updateWheelConfig,
    deleteDrawRecord,
    addTicketsToUser,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    faqs,
    addFaq,
    updateFaq,
    deleteFaq,
    rechargeChannels,
    addRechargeChannel,
    updateRechargeChannel,
    deleteRechargeChannel,
    toggleRechargeChannel
  } = useApp();

  // New Announcement form state
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnImageUrl, setNewAnnImageUrl] = useState('');

  const handleAnnImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', "La taille de la photo ne doit pas dépasser 5 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAnnImageUrl(reader.result as string);
        showToast('success', "Photo sélectionnée avec succès !");
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) {
      showToast('error', "Veuillez saisir au moins un titre et le contenu de l'annonce.");
      return;
    }
    addAnnouncement({
      title: newAnnTitle,
      content: newAnnContent,
      imageUrl: newAnnImageUrl
    });
    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnImageUrl('');
    showToast('success', "Annonce publiée avec succès !");
  };

  // Navigation tab state
  const [activeAdminTab, setActiveAdminTab] = useState<
    'dashboard' | 'deposits' | 'withdrawals' | 'proofs' | 'users' | 'products' | 'paid_products' | 'support' | 'announcements' | 'wheel' | 'faq' | 'recharge_channels'
  >('dashboard');

  // Recharge Channels Admin State
  const [channelName, setChannelName] = useState('');
  const [channelNumber, setChannelNumber] = useState('');
  const [channelHolder, setChannelHolder] = useState('');
  const [channelInstructions, setChannelInstructions] = useState('');
  const [channelIsActive, setChannelIsActive] = useState(true);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [channelSearch, setChannelSearch] = useState('');
  const [copiedChannelId, setCopiedChannelId] = useState<string | null>(null);
  const [isProcessingChannel, setIsProcessingChannel] = useState(false);

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) {
      showToast('error', "Veuillez renseigner le nom de l'opérateur / canal.");
      return;
    }
    if (!channelNumber.trim()) {
      showToast('error', "Veuillez renseigner le numéro de téléphone pour la recharge.");
      return;
    }

    setIsProcessingChannel(true);
    try {
      if (editingChannelId) {
        const res = await updateRechargeChannel(editingChannelId, {
          name: channelName.trim(),
          accountNumber: channelNumber.trim(),
          accountHolder: channelHolder.trim(),
          instructions: channelInstructions.trim(),
          isActive: channelIsActive
        });
        if (res.success) {
          showToast('success', "Canal de recharge mis à jour et synchronisé avec succès !");
          setEditingChannelId(null);
          setChannelName('');
          setChannelNumber('');
          setChannelHolder('');
          setChannelInstructions('');
          setChannelIsActive(true);
        } else {
          showToast('error', res.error || "Erreur lors de la mise à jour en base.");
        }
      } else {
        const res = await addRechargeChannel({
          name: channelName.trim(),
          accountNumber: channelNumber.trim(),
          accountHolder: channelHolder.trim(),
          instructions: channelInstructions.trim(),
          isActive: channelIsActive
        });
        if (res.success) {
          showToast('success', "Nouveau canal de recharge ajouté et enregistré en base de données !");
          setChannelName('');
          setChannelNumber('');
          setChannelHolder('');
          setChannelInstructions('');
          setChannelIsActive(true);
        } else {
          showToast('error', res.error || "Erreur lors de l'enregistrement en base.");
        }
      }
    } catch (err: any) {
      showToast('error', err?.message || "Erreur de connexion.");
    } finally {
      setIsProcessingChannel(false);
    }
  };

  const handleEditChannel = (channel: RechargeChannel) => {
    setEditingChannelId(channel.id);
    setChannelName(channel.name);
    setChannelNumber(channel.accountNumber);
    setChannelHolder(channel.accountHolder || '');
    setChannelInstructions(channel.instructions || '');
    setChannelIsActive(channel.isActive);

    showToast('success', `Modification de "${channel.name}" - Formulaire rempli.`);

    setTimeout(() => {
      const el = document.getElementById('channel-form-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleDeleteChannel = async (channel: RechargeChannel) => {
    if (window.confirm(`Confirmez-vous la suppression définitive du canal "${channel.name}" (${channel.accountNumber}) ? Il disparaîtra immédiatement de tous les comptes utilisateurs.`)) {
      setIsProcessingChannel(true);
      try {
        const res = await deleteRechargeChannel(channel.id);
        if (editingChannelId === channel.id) {
          handleCancelEditChannel();
        }
        if (res.success) {
          showToast('success', `Canal "${channel.name}" supprimé définitivement.`);
        } else {
          showToast('error', res.error || "Erreur lors de la suppression en base.");
        }
      } catch (err: any) {
        showToast('error', err?.message || "Erreur de connexion.");
      } finally {
        setIsProcessingChannel(false);
      }
    }
  };

  const handleToggleChannelStatus = async (id: string, currentStatus: boolean, name: string) => {
    const res = await toggleRechargeChannel(id);
    if (res.success) {
      showToast('success', `Canal "${name}" ${currentStatus ? 'désactivé' : 'activé'} avec succès.`);
    } else {
      showToast('error', res.error || "Erreur lors du changement de statut.");
    }
  };

  const handleCancelEditChannel = () => {
    setEditingChannelId(null);
    setChannelName('');
    setChannelNumber('');
    setChannelHolder('');
    setChannelInstructions('');
    setChannelIsActive(true);
  };

  const handleCopyChannelNumber = (id: string, num: string) => {
    try {
      navigator.clipboard.writeText(num);
      setCopiedChannelId(id);
      showToast('success', `Numéro ${num} copié !`);
      setTimeout(() => setCopiedChannelId(null), 2000);
    } catch (_) {
      showToast('success', `Numéro : ${num}`);
    }
  };

  // FAQ Admin States
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState('Général');
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState('');

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      showToast('error', "Veuillez remplir la question et la réponse.");
      return;
    }
    if (editingFaqId) {
      updateFaq(editingFaqId, newFaqQuestion, newFaqAnswer, newFaqCategory);
      showToast('success', "Question mise à jour avec succès !");
      setEditingFaqId(null);
    } else {
      addFaq(newFaqQuestion, newFaqAnswer, newFaqCategory);
      showToast('success', "Nouvelle question FAQ ajoutée !");
    }
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setNewFaqCategory('Général');
  };

  const handleEditFaq = (faq: FaqItem) => {
    setEditingFaqId(faq.id);
    setNewFaqQuestion(faq.question);
    setNewFaqAnswer(faq.answer);
    setNewFaqCategory(faq.category || 'Général');
    
    // Scroll smoothly to the FAQ edit form container so the admin sees the form prefilled
    setTimeout(() => {
      const formEl = document.getElementById('faq-form-container');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleDeleteFaq = (faq: FaqItem) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la question FAQ : "${faq.question}" ?`)) {
      deleteFaq(faq.id);
      if (editingFaqId === faq.id) {
        handleCancelEditFaq();
      }
      showToast('success', "Question FAQ supprimée avec succès.");
    }
  };

  const handleCancelEditFaq = () => {
    setEditingFaqId(null);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setNewFaqCategory('Général');
  };

  // Wheel Admin States
  const [ticketsPerRefInput, setTicketsPerRefInput] = useState<number>(wheelConfig.ticketsPerReferral || 1);
  const [newPrizeLabel, setNewPrizeLabel] = useState('');
  const [newPrizeValue, setNewPrizeValue] = useState<number>(35);
  const [manualTicketUserId, setManualTicketUserId] = useState('');
  const [manualTicketCount, setManualTicketCount] = useState<number>(1);
  const [drawSearch, setDrawSearch] = useState('');

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
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [chatMessageText, setChatMessageText] = useState<string>('');
  const [chatSearch, setChatSearch] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

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
  const [balanceAdjustType, setBalanceAdjustType] = useState<'add' | 'subtract' | 'set'>('add');

  // 1.5. Password adjustment modal
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [newUserPassword, setNewUserPassword] = useState<string>('');

  // 1.6. PIN adjustment modal
  const [selectedUserForPin, setSelectedUserForPin] = useState<User | null>(null);
  const [newUserPin, setNewUserPin] = useState<string>('');

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

  // Toggle Product Active / Inactive Status
  const handleToggleProductStatus = (prod: InvestmentProduct) => {
    const nextStatus = !(prod.isActive !== false);
    addOrUpdateProduct({
      ...prod,
      isActive: nextStatus
    });
    showToast('success', nextStatus ? `Produit "${prod.name}" activé` : `Produit "${prod.name}" désactivé`);
  };

  // Move Product Order Up / Down
  const handleMoveProductOrder = (prod: InvestmentProduct, direction: 'up' | 'down') => {
    const sorted = [...products].sort((a, b) => (a.order || 99) - (b.order || 99));
    const index = sorted.findIndex(p => p.id === prod.id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const prevProd = sorted[index - 1];
      const currentOrder = prod.order || (index + 1);
      const prevOrder = prevProd.order || index;
      
      addOrUpdateProduct({ ...prod, order: prevOrder });
      addOrUpdateProduct({ ...prevProd, order: currentOrder });
      showToast('success', `Ordre de "${prod.name}" déplacé vers le haut`);
    } else if (direction === 'down' && index < sorted.length - 1) {
      const nextProd = sorted[index + 1];
      const currentOrder = prod.order || (index + 1);
      const nextOrder = nextProd.order || (index + 2);
      
      addOrUpdateProduct({ ...prod, order: nextOrder });
      addOrUpdateProduct({ ...nextProd, order: currentOrder });
      showToast('success', `Ordre de "${prod.name}" déplacé vers le bas`);
    }
  };

  // Balance adjustment handler
  const handleApplyBalanceAdjust = () => {
    if (!selectedUserForBalance) return;
    const val = Number(balanceAdjustAmount);
    if (isNaN(val) || (balanceAdjustType !== 'set' && val <= 0) || (balanceAdjustType === 'set' && val < 0)) {
      showToast('error', 'Veuillez saisir un montant valide.');
      return;
    }

    if (balanceAdjustType === 'set') {
      updateUserBalance(selectedUserForBalance.id, val, true);
      showToast(
        'success',
        `Solde de ${selectedUserForBalance.name} défini à ${val.toLocaleString()} FCFA avec succès !`
      );
    } else {
      const finalChange = balanceAdjustType === 'add' ? Math.abs(val) : -Math.abs(val);
      updateUserBalance(selectedUserForBalance.id, finalChange, false);
      showToast(
        'success', 
        `Solde de ${selectedUserForBalance.name} ${finalChange > 0 ? 'crédité (+)' : 'déduit (-)'} de ${Math.abs(val).toLocaleString()} FCFA avec succès !`
      );
    }
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

  // Per-user chat thread helpers
  const existingUserMap = new Map(users.map(u => [u.id, u]));
  const combinedChatUsers = [...users.filter(u => u.role !== 'admin')];

  // Guarantee that every single support ticket maps to a chat thread user
  tickets.forEach(t => {
    if (!t) return;
    const uId = t.userId || 'usr-' + (t.userPhone || t.userName || 'guest');
    const matchesAny = combinedChatUsers.some(u => 
      u.id === uId || 
      (u.phone && u.phone !== 'Non renseigné' && u.phone === t.userPhone) ||
      (u.name && t.userName && u.name.trim().toLowerCase() === t.userName.trim().toLowerCase())
    );
    if (!matchesAny) {
      const existingUser = existingUserMap.get(uId);
      if (existingUser) {
        combinedChatUsers.push(existingUser);
      } else {
        combinedChatUsers.push({
          id: uId,
          name: t.userName || 'Client ' + uId.slice(0, 5),
          phone: t.userPhone || 'Non renseigné',
          balance: 0,
          dailyEarnings: 0,
          totalEarnings: 0,
          vipLevel: 0,
          isBlocked: false,
          createdAt: t.createdAt || new Date().toISOString(),
          role: 'user',
          referralCode: 'REF' + uId.slice(0, 4)
        });
      }
    }
  });

  const getTicketsForUser = (usr: User) => {
    return tickets.filter(t => 
      t.userId === usr.id ||
      (usr.phone && usr.phone !== 'Non renseigné' && t.userPhone === usr.phone) ||
      (usr.name && t.userName && t.userName.trim().toLowerCase() === usr.name.trim().toLowerCase())
    );
  };

  const chatUserList = combinedChatUsers.filter(u => {
    if (!chatSearch.trim()) return true;
    const q = chatSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.phone.includes(q);
  }).sort((a, b) => {
    const aTickets = getTicketsForUser(a);
    const bTickets = getTicketsForUser(b);
    const aUnread = aTickets.some(t => t.status === 'open');
    const bUnread = bTickets.some(t => t.status === 'open');
    if (aUnread && !bUnread) return -1;
    if (!aUnread && bUnread) return 1;

    const aLatest = aTickets.reduce((max, t) => Math.max(max, new Date(t.createdAt).getTime()), 0);
    const bLatest = bTickets.reduce((max, t) => Math.max(max, new Date(t.createdAt).getTime()), 0);
    return bLatest - aLatest;
  });

  const selectedChatUser = combinedChatUsers.find(u => u.id === selectedChatUserId) || chatUserList[0] || null;

  const selectedUserTickets = selectedChatUser
    ? getTicketsForUser(selectedChatUser).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  useEffect(() => {
    if (activeAdminTab === 'support') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedUserTickets.length, activeAdminTab, selectedChatUserId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 flex flex-col font-sans pb-16 relative">
      
      {/* Changing Background Image Layer with Smooth Crossfade Transition */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {ADMIN_BG_IMAGES.map((imgUrl, idx) => (
          <div
            key={imgUrl}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 transform scale-105 ${
              idx === bgIndex ? 'opacity-35' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${imgUrl}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/75 to-slate-950/90 backdrop-blur-[2px]" />
      </div>

      {/* Main Admin UI Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
      
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

          <div className="flex items-center space-x-2">
            {/* Background Image Switcher Badge */}
            <button 
              onClick={() => setBgIndex((prev) => (prev + 1) % ADMIN_BG_IMAGES.length)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="Changer l'image d'arrière-plan de l'admin"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline text-[11px]">Fond ({bgIndex + 1}/{ADMIN_BG_IMAGES.length})</span>
            </button>

            <button 
              onClick={onExitAdmin}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl border border-red-500 transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shrink-0"
              title="Quitter le panneau d'administration"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span className="font-black uppercase text-[11px] tracking-tight">Sortir Admin</span>
            </button>
          </div>
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

            <button
              onClick={() => setActiveAdminTab('wheel')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'wheel'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <RotateCw className="w-4 h-4" />
              <span>Tirage & Roue</span>
              <span className="text-[10px] opacity-80 bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded ml-1 font-mono">{drawRecords.length}</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('faq')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'faq'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Gestion FAQ</span>
              <span className="text-[10px] opacity-80 bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded ml-1 font-mono">{faqs.length}</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('recharge_channels')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeAdminTab === 'recharge_channels'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Canaux de recharge</span>
              <span className="text-[10px] opacity-80 bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded ml-1 font-mono">
                {rechargeChannels.filter(c => c.isActive).length}/{rechargeChannels.length}
              </span>
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

              {/* Passerelle de paiement WestPay active */}
              <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-amber-400 block">Lien Passerelle Recharge Actif (WestPay) :</span>
                    <span className="text-xs font-mono text-slate-300 truncate block">https://westpay.cfd/link/3s7hn53gmsupa11l</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://westpay.cfd/link/3s7hn53gmsupa11l');
                      showToast('success', 'Lien WestPay copié !');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Copier le lien
                  </button>
                  <a
                    href="https://westpay.cfd/link/3s7hn53gmsupa11l"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition-colors"
                  >
                    Tester le lien ↗
                  </a>
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
                            onClick={() => {
                              setSelectedUserForPin(usr);
                              setNewUserPin('');
                            }}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                            title="Modifier le code PIN de retrait"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">Code PIN</span>
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
            
            {/* Header & Stats Banner */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Package className="w-5 h-5 text-amber-400" />
                    <span>Gestion des Produits d'Investissement</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ajoutez, modifiez, supprimez et réorganisez les offres d'investissement. Les mises à jour sont immédiatement appliquées sur le site.
                  </p>
                </div>

                <button 
                  onClick={() => handleOpenProductModal()}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2 shadow-md shadow-red-600/20 shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                  <span>Nouveau Produit</span>
                </button>
              </div>

              {/* Quick Stats bar */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700/60 font-mono text-center">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Total Produits</span>
                  <span className="text-base sm:text-lg font-black text-white">{products.length}</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Produits Actifs</span>
                  <span className="text-base sm:text-lg font-black text-emerald-400">
                    {products.filter(p => p.isActive !== false).length}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-semibold">Inactifs / Masqués</span>
                  <span className="text-base sm:text-lg font-black text-red-400">
                    {products.filter(p => p.isActive === false).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Cards Grid (Sorted by Order) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...products]
                .sort((a, b) => (a.order || 99) - (b.order || 99))
                .map((prod, idx, sortedArr) => (
                  <div 
                    key={prod.id} 
                    className={`bg-slate-800/90 border rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all ${
                      prod.isActive !== false ? 'border-slate-700/80' : 'border-red-900/50 opacity-75'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Row: Badge, Order & Status Pill */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded uppercase">
                            {prod.badge || 'VIP'}
                          </span>
                          <span className="text-[10px] font-bold font-mono bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                            Ordre #{prod.order || idx + 1}
                          </span>
                        </div>

                        {/* Clickable Quick Status Toggle */}
                        <button
                          onClick={() => handleToggleProductStatus(prod)}
                          className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer transition-all ${
                            prod.isActive !== false 
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' 
                              : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          }`}
                          title={prod.isActive !== false ? "Cliquer pour désactiver" : "Cliquer pour activer"}
                        >
                          <Power className="w-3 h-3" />
                          <span>{prod.isActive !== false ? 'Actif' : 'Masqué'}</span>
                        </button>
                      </div>

                      {/* Header Info + Image */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="text-base font-bold text-white leading-snug truncate">{prod.name}</h4>
                          {prod.description && (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {prod.description}
                            </p>
                          )}
                        </div>
                        <img 
                          src={prod.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'} 
                          alt={prod.name}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'; }}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                        />
                      </div>

                      {/* Specs Box */}
                      <div className="bg-slate-900/90 p-3 rounded-xl grid grid-cols-2 gap-2 text-center text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px]">Prix (FCFA)</div>
                          <div className="font-bold text-white text-sm font-mono">{prod.price.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">Durée Cycle</div>
                          <div className="font-bold text-white text-sm font-mono">{prod.duration} Jours</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">Revenu / Jour</div>
                          <div className="font-bold text-emerald-400 text-sm font-mono">+{prod.dailyGain.toLocaleString()} FCFA</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">Revenu Total</div>
                          <div className="font-bold text-amber-400 text-sm font-mono">{prod.totalGain.toLocaleString()} FCFA</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Controls: Reorder + Edit + Delete */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
                      {/* Reorder Buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleMoveProductOrder(prod, 'up')}
                          disabled={idx === 0}
                          className="bg-slate-900 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 p-1.5 rounded-lg transition-all cursor-pointer"
                          title="Déplacer vers le haut"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveProductOrder(prod, 'down')}
                          disabled={idx === sortedArr.length - 1}
                          className="bg-slate-900 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 p-1.5 rounded-lg transition-all cursor-pointer"
                          title="Déplacer vers le bas"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleOpenProductModal(prod)}
                          className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer flex items-center space-x-1 transition-all"
                          title="Modifier le produit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Modifier</span>
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
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 p-1.5 rounded-lg cursor-pointer transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

        {/* 7. SUPPORT CLIENT - PANNEAU DE DISCUSSION SEPARE PAR UTILISATEUR */}
        {activeAdminTab === 'support' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header banner */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Headphones className="w-5 h-5 text-blue-400" />
                  <span>Messagerie & Support Client Dédié</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chaque utilisateur dispose de son propre panneau de discussion indépendant avec l'administrateur.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-3 py-1 rounded-full border border-blue-500/30">
                  {tickets.filter(t => t.status === 'open').length} messages en attente
                </span>
              </div>
            </div>

            {/* SPLIT PANELS: LIST OF USER DISCUSSIONS ON LEFT, CHAT ROOM ON RIGHT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* LIST OF USERS (4 cols) */}
              <div className="lg:col-span-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="Rechercher un client par nom ou tél..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>

                {/* User Conversation List */}
                <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                  {chatUserList.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Aucun client correspondant.
                    </div>
                  ) : (
                    chatUserList.map(usr => {
                      const userTickets = getTicketsForUser(usr);
                      const openCount = userTickets.filter(t => t.status === 'open').length;
                      const isSelected = selectedChatUser?.id === usr.id;

                      return (
                        <button
                          key={usr.id}
                          type="button"
                          onClick={() => setSelectedChatUserId(usr.id)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                              : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                              isSelected ? 'bg-white text-blue-700' : 'bg-slate-700 text-amber-400'
                            }`}>
                              {usr.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs truncate">{usr.name}</div>
                              <div className={`text-[11px] font-mono truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                {usr.phone}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {openCount > 0 ? (
                              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full inline-block animate-pulse">
                                {openCount} non lu{openCount > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                                {userTickets.length} msg
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* INDIVIDUAL CHAT ROOM FOR SELECTED USER (8 cols) */}
              <div className="lg:col-span-8 bg-slate-800/90 border border-slate-700/80 rounded-2xl flex flex-col h-[580px] overflow-hidden shadow-lg">
                {selectedChatUser ? (
                  <>
                    {/* Chat Header */}
                    <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 flex items-center justify-between shrink-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs">
                          {selectedChatUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-white text-xs sm:text-sm">{selectedChatUser.name}</h3>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full">
                              Discussion Active
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-2">
                            <span>Tél: {selectedChatUser.phone}</span>
                            <span>• Solde: <strong className="text-emerald-400">{selectedChatUser.balance.toLocaleString()} FCFA</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUserForBalance(selectedChatUser)}
                          className="text-xs px-2.5 py-1 rounded-lg font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Ajuster le solde"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Solde</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBlockUser(selectedChatUser.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                            selectedChatUser.isBlocked
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          }`}
                        >
                          {selectedChatUser.isBlocked ? 'Débloquer' : 'Bloquer'}
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/40">
                      {selectedUserTickets.length === 0 ? (
                        <div className="text-center py-12 space-y-2">
                          <MessageCircle className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="text-xs text-slate-400 font-medium">
                            Aucun message enregistré pour {selectedChatUser.name}. Envoyez un message ci-dessous pour ouvrir la discussion.
                          </p>
                        </div>
                      ) : (
                        selectedUserTickets.map((tkt) => {
                          const isAdminDirect = tkt.id.startsWith('tkt-adm-') || tkt.message === "Message direct du Support Client Nutrien.";

                          return (
                            <div key={tkt.id} className="space-y-2">
                              {/* User Question */}
                              {!isAdminDirect && (
                                <div className="flex items-start space-x-2 max-w-xl">
                                  <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-1">
                                    {selectedChatUser.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-3 space-y-1.5 shadow-xs">
                                    <div className="flex items-center justify-between gap-4 text-[10px]">
                                      <span className="font-bold text-amber-400 uppercase tracking-wider">{tkt.subject}</span>
                                      <span className="text-slate-400">{new Date(tkt.createdAt).toLocaleString('fr-FR')}</span>
                                    </div>
                                    <p className="text-xs text-slate-100 leading-relaxed font-sans">{tkt.message}</p>

                                    {tkt.imageUrl && (
                                      <div className="pt-1">
                                        <a href={tkt.imageUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-700 max-w-xs hover:opacity-90">
                                          <img src={tkt.imageUrl} alt="Pièce jointe" className="w-full max-h-48 object-cover" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Admin Reply */}
                            {tkt.reply && (
                              <div className="flex items-start justify-end space-x-2 max-w-xl ml-auto">
                                <div className="bg-blue-900/80 border border-blue-500/40 rounded-2xl rounded-tr-none p-3 space-y-1 shadow-xs text-right">
                                  <div className="flex items-center justify-between gap-4 text-[10px]">
                                    <span className="text-slate-300 font-mono">
                                      {tkt.replyCreatedAt ? new Date(tkt.replyCreatedAt).toLocaleString('fr-FR') : 'Réponse Admin'}
                                    </span>
                                    <span className="font-bold text-blue-300 uppercase font-mono">Admin Support</span>
                                  </div>
                                  <p className="text-xs text-white leading-relaxed font-sans">{tkt.reply}</p>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-1">
                                  A
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 bg-slate-900 border-t border-slate-700 space-y-2 shrink-0">
                      {/* Quick responses */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setChatMessageText("Bonjour, votre demande a été traitée avec succès ! Merci de votre confiance.")}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg whitespace-nowrap border border-slate-700 cursor-pointer"
                        >
                          ✅ Traité avec succès
                        </button>
                        <button
                          type="button"
                          onClick={() => setChatMessageText("Bonjour, veuillez nous envoyer la capture d'écran du transfert Mobile Money pour vérification.")}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg whitespace-nowrap border border-slate-700 cursor-pointer"
                        >
                          📷 Demander capture
                        </button>
                        <button
                          type="button"
                          onClick={() => setChatMessageText("Bonjour, le paiement a été crédité sur votre compte Nutrien.")}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg whitespace-nowrap border border-slate-700 cursor-pointer"
                        >
                          💰 Solde crédité
                        </button>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!chatMessageText.trim()) return;
                          const targetTicket = [...selectedUserTickets].reverse().find(t => t.status === 'open' || !t.reply);
                          if (targetTicket) {
                            replyToTicket(targetTicket.id, chatMessageText.trim());
                          } else {
                            sendAdminDirectMessage(selectedChatUser.id, chatMessageText.trim());
                          }
                          setChatMessageText('');
                          showToast('success', 'Message envoyé avec succès au client !');
                        }}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="text"
                          value={chatMessageText}
                          onChange={(e) => setChatMessageText(e.target.value)}
                          placeholder={`Répondre à ${selectedChatUser.name}...`}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={!chatMessageText.trim()}
                          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition-all shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer</span>
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2 p-6 text-center">
                    <Headphones className="w-10 h-10 text-slate-600" />
                    <p className="text-xs font-bold text-slate-300">Aucun utilisateur sélectionné</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. GESTION DES ANNONCES */}
        {activeAdminTab === 'announcements' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Publisher Form for Official Announcements */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  <span>Publier une Annonce Officielle (Rubrique « Annonces »)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publiez une annonce avec photo qui s'affichera directement dans la rubrique Annonces pour tous les utilisateurs.
                </p>
              </div>

              <form onSubmit={handlePublishAnnouncement} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 text-xs uppercase font-bold mb-1.5">
                    Titre de l'annonce *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Récompenser les agents exceptionnels"
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 font-bold p-3 rounded-xl outline-none border border-slate-200 focus:border-red-600 focus:bg-white"
                    required
                  />
                </div>

                {/* Photo Selection with Live Preview */}
                <div>
                  <label className="block text-slate-700 text-xs uppercase font-bold mb-1.5">
                    Ajouter une photo *
                  </label>
                  {newAnnImageUrl ? (
                    <div className="relative w-full max-w-md h-48 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                      <img src={newAnnImageUrl} alt="Prévisualisation" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <label className="bg-white text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 shadow-md">
                          Changer la photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAnnImageChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setNewAnnImageUrl('')}
                          className="bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-700 shadow-md cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-8 h-8 text-slate-400 mb-1" />
                        <p className="text-xs font-bold text-slate-700">Cliquez pour ajouter une photo depuis votre appareil</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Formats acceptés : PNG, JPG, WEBP</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAnnImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 text-xs uppercase font-bold mb-1.5">
                    Courte description / contenu complet *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Rédigez ici la description complète de votre annonce..."
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 font-normal p-3 rounded-xl outline-none border border-slate-200 focus:border-red-600 focus:bg-white leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-xs"
                >
                  📢 Publier dans la rubrique Annonces
                </button>
              </form>
            </div>

            {/* List of Published Announcements */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>Annonces Publiées ({announcements.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toutes les annonces actuellement affichées dans la rubrique Annonces du site.
                  </p>
                </div>
              </div>

              {announcements.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Aucune annonce publiée pour l'instant.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann, idx) => (
                    <div
                      key={`${ann.id || 'ann'}-${idx}`}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start space-x-3 max-w-2xl">
                        {ann.imageUrl && (
                          <img
                            src={ann.imageUrl}
                            alt={ann.title}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {ann.isNew && (
                              <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block shrink-0" />
                            )}
                            <h4 className="text-sm font-bold text-slate-900">
                              {ann.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {ann.content}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Publié le : {ann.createdAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => {
                            deleteAnnouncement(ann.id);
                            showToast('success', "Annonce supprimée.");
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-xl border border-red-200 transition-all cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Banner Control Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  <span>Bandeau d'Annonce Défilant (Marquee)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Ce message défile en haut de l'écran pour tous les utilisateurs connectés.</p>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: Événement VIP : Bonus de 10% sur les recharges Orange & MTN..."
                  value={bannerInput}
                  onChange={(e) => setBannerInput(e.target.value)}
                  className="flex-grow bg-slate-50 text-xs text-slate-900 px-3.5 py-3 rounded-xl outline-none border border-slate-200 focus:border-red-600 font-bold"
                />
                <button 
                  onClick={() => {
                    sendGlobalNotification(bannerInput.trim() || null);
                    showToast('success', "Bandeau d'annonce mis à jour !");
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-2xs"
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
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Bonus Promo Codes Generator */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  <span>Générateur de Codes Promo & Bonus</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Créez des codes promotionnels que les utilisateurs peuvent utiliser dans la rubrique "Mon Compte".</p>
              </div>

              <form onSubmit={handleCreateBonusCode} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-medium">
                <div>
                  <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">Code promo</label>
                  <input 
                    type="text" 
                    placeholder="EX: CADEAU2000"
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 font-mono uppercase font-bold p-2.5 rounded-xl outline-none border border-slate-200 focus:border-red-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">Montant crédité (FCFA)</label>
                  <input 
                    type="number" 
                    value={newCodeAmount}
                    onChange={(e) => setNewCodeAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 text-slate-900 font-mono font-bold p-2.5 rounded-xl outline-none border border-slate-200 focus:border-red-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] uppercase font-bold mb-1">Limite d'utilisations</label>
                  <input 
                    type="number" 
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(Number(e.target.value))}
                    className="w-full bg-slate-50 text-slate-900 font-mono font-bold p-2.5 rounded-xl outline-none border border-slate-200 focus:border-red-600"
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
                <h4 className="text-xs font-bold text-slate-600 uppercase mb-2 font-mono">Codes Bonus Actifs ({bonusCodes.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {bonusCodes.map(b => (
                    <div key={b.code} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="font-black text-amber-600 text-sm">{b.code}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Valeur: <strong className="text-emerald-700">{b.amount.toLocaleString()} FCFA</strong></div>
                      </div>
                      <div className="text-right text-[11px] text-slate-500">
                        {b.usedBy.length} / {b.maxUses} utilisés
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 9. GESTION DE LA ROUE ET DES TIRAGES AU SORT */}
        {activeAdminTab === 'wheel' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header banner */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <RotateCw className="w-5 h-5 text-amber-400" />
                    <span>Gestion de la Roue & Tirages au Sort</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configurez les règles de tickets, gérez les lots et supervisez le flux en direct des gagnants.
                  </p>
                </div>

                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-mono text-amber-400">
                  <Ticket className="w-4 h-4 text-amber-400" />
                  <span>{drawRecords.length} participations réelles</span>
                </div>
              </div>
            </div>

            {/* Grid 1: Rule Configuration & Manual Ticket Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Ticket Allocation Rule */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Ticket className="w-4 h-4 text-emerald-400" />
                  <span>Règle d'Attribution Automatique</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Nombre de tickets gratuits attribués automatiquement au parrain lorsqu'un filleul direct (Niveau 1) active une offre VIP.
                </p>

                <div className="flex items-center space-x-3 pt-2">
                  <div className="flex-1">
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Tickets par Filleul VIP</label>
                    <input 
                      type="number" 
                      min="1"
                      max="100"
                      value={ticketsPerRefInput}
                      onChange={(e) => setTicketsPerRefInput(Number(e.target.value))}
                      className="w-full bg-slate-900 text-white font-mono font-bold text-sm p-3 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        updateWheelConfig({
                          ...wheelConfig,
                          ticketsPerReferral: ticketsPerRefInput
                        });
                        showToast('success', "Règle des tickets mise à jour !");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual Ticket Assignment */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>Attribution Manuelle de Tickets</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Créditez des tickets de tirage directement au compte d'un utilisateur de votre choix.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={manualTicketUserId}
                      onChange={(e) => setManualTicketUserId(e.target.value)}
                      className="bg-slate-900 text-white text-xs font-bold p-3 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                    >
                      <option value="">Sélectionner un utilisateur...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.phone}) - {u.drawTickets || 0} tkt
                        </option>
                      ))}
                    </select>

                    <input 
                      type="number"
                      min="1"
                      max="500"
                      placeholder="Nombre de tickets"
                      value={manualTicketCount}
                      onChange={(e) => setManualTicketCount(Number(e.target.value))}
                      className="bg-slate-900 text-white font-mono font-bold text-xs p-3 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!manualTicketUserId) {
                        showToast('error', "Veuillez choisir un utilisateur.");
                        return;
                      }
                      addTicketsToUser(manualTicketUserId, manualTicketCount);
                      showToast('success', `${manualTicketCount} ticket(s) attribué(s) avec succès !`);
                      setManualTicketUserId('');
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl transition-all cursor-pointer"
                  >
                    ATTRIBUER {manualTicketCount} TICKET(S)
                  </button>
                </div>
              </div>

            </div>

            {/* Wheel Prizes List & Adder */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>Récompenses & Lots de la Roue ({wheelConfig.prizes.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifiez les lots disponibles lors du tirage. Chaque lot correspond à un segment sur la roue.
                  </p>
                </div>
              </div>

              {/* Add New Prize Form */}
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Intitulé du prix</label>
                  <input 
                    type="text" 
                    placeholder="Ex: +35 FCFA"
                    value={newPrizeLabel}
                    onChange={(e) => setNewPrizeLabel(e.target.value)}
                    className="w-full bg-slate-950 text-white font-bold p-2.5 rounded-lg border border-slate-700 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Valeur FCFA (25 - 50 FCFA)</label>
                  <input 
                    type="number" 
                    placeholder="35"
                    min={25}
                    max={50}
                    value={newPrizeValue}
                    onChange={(e) => setNewPrizeValue(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white font-mono font-bold p-2.5 rounded-lg border border-slate-700 outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      if (!newPrizeLabel.trim()) {
                        showToast('error', "Intitulé du prix requis.");
                        return;
                      }
                      const clampedVal = Math.min(50, Math.max(25, newPrizeValue));
                      const updatedPrizes = [
                        ...wheelConfig.prizes,
                        {
                          id: Date.now(),
                          label: newPrizeLabel.trim(),
                          value: clampedVal,
                          color: 'bg-emerald-600 text-white'
                        }
                      ];
                      updateWheelConfig({ ...wheelConfig, prizes: updatedPrizes });
                      setNewPrizeLabel('');
                      showToast('success', `Nouveau prix (+${clampedVal} FCFA) ajouté à la roue !`);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter le lot</span>
                  </button>
                </div>
              </div>

              {/* Active Prizes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {wheelConfig.prizes.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-700/70 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></div>
                      <div>
                        <div className="font-bold text-white">{p.label}</div>
                        <div className="text-[11px] text-slate-400 font-mono">+{p.value.toLocaleString()} FCFA</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (wheelConfig.prizes.length <= 2) {
                          showToast('error', "La roue doit contenir au moins 2 prix.");
                          return;
                        }
                        const updatedPrizes = wheelConfig.prizes.filter(pr => pr.id !== p.id);
                        updateWheelConfig({ ...wheelConfig, prizes: updatedPrizes });
                        showToast('success', "Prix supprimé.");
                      }}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Supprimer ce lot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Real Participations Feed & Fraud Removal Table */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <span>Historique Réel des Participations & Suppression Fraudes</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Liste dynamique alimentée uniquement par les tirages réels enregistrés en base de données.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Filtrer téléphone ou nom..."
                    value={drawSearch}
                    onChange={(e) => setDrawSearch(e.target.value)}
                    className="w-full bg-slate-900 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Participations Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-700/70">
                <table className="w-full text-left text-xs text-slate-300 font-medium">
                  <thead className="bg-slate-900/90 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Horodatage</th>
                      <th className="px-4 py-3">Participant</th>
                      <th className="px-4 py-3">Téléphone (Masqué)</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Gain Emporté</th>
                      <th className="px-4 py-3 text-right">Action Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {drawRecords.filter(r => 
                      r.userName.toLowerCase().includes(drawSearch.toLowerCase()) || 
                      r.userPhone.includes(drawSearch)
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                          Aucune participation trouvée dans la base de données.
                        </td>
                      </tr>
                    ) : (
                      drawRecords
                        .filter(r => 
                          r.userName.toLowerCase().includes(drawSearch.toLowerCase()) || 
                          r.userPhone.includes(drawSearch)
                        )
                        .map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-700/30 transition-all">
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                              {new Date(rec.createdAt).toLocaleString('fr-FR')}
                            </td>
                            <td className="px-4 py-3 font-bold text-white">
                              {rec.userName}
                            </td>
                            <td className="px-4 py-3 font-mono text-emerald-400 font-bold">
                              {rec.userPhone}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {rec.action}
                            </td>
                            <td className="px-4 py-3 font-black text-emerald-400 font-mono">
                              {rec.prizeLabel}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  deleteDrawRecord(rec.id);
                                  showToast('success', "Participation supprimée du flux en direct !");
                                }}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center space-x-1"
                                title="Supprimer la participation si frauduleuse"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Supprimer</span>
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB: FAQ MANAGEMENT */}
        {activeAdminTab === 'faq' && (
          <div className="space-y-6">
            
            {/* Form Card: Create / Edit FAQ */}
            <div id="faq-form-container" className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    <span>{editingFaqId ? 'Modifier la Question Fréquente' : 'Ajouter une Nouvelle Question Fréquente'}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Créez ou éditez les questions-réponses affichées dans la rubrique FAQ de la page "Mon Compte".
                  </p>
                </div>
                {editingFaqId && (
                  <button
                    onClick={handleCancelEditFaq}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Annuler l'édition
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveFaq} className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                      Question posée par les utilisateurs *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Comment effectuer un retrait rapide ?"
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                      className="w-full bg-slate-900 text-white font-bold p-3 rounded-xl outline-none border border-slate-700 focus:border-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                      Catégorie
                    </label>
                    <select
                      value={newFaqCategory}
                      onChange={(e) => setNewFaqCategory(e.target.value)}
                      className="w-full bg-slate-900 text-white font-bold p-3 rounded-xl outline-none border border-slate-700 focus:border-red-500 cursor-pointer"
                    >
                      <option value="Général">Général</option>
                      <option value="Dépôts & Retraits">Dépôts & Retraits</option>
                      <option value="Parrainage & Bonus">Parrainage & Bonus</option>
                      <option value="Compte & Sécurité">Compte & Sécurité</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Réponse détaillée *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Saisissez la réponse complète et explicite qui sera lue par les utilisateurs..."
                    value={newFaqAnswer}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                    className="w-full bg-slate-900 text-white p-3 rounded-xl outline-none border border-slate-700 focus:border-red-500 font-normal leading-relaxed"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center space-x-2"
                  >
                    {editingFaqId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{editingFaqId ? 'Enregistrer les modifications' : 'Ajouter la question'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List Card: Existing FAQs */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-teal-400" />
                    <span>Questions Fréquentes Enregistrées ({faqs.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifiez ou supprimez les questions de la FAQ dynamique en temps réel.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher une FAQ..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="w-full bg-slate-900 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {faqs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                  Aucune question fréquente créée pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {faqs
                    .filter(f => 
                      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
                      f.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
                      (f.category || '').toLowerCase().includes(faqSearch.toLowerCase())
                    )
                    .map((faq) => (
                      <div
                        key={faq.id}
                        className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 space-y-2 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase rounded-md">
                              {faq.category || 'Général'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white leading-snug">
                            {faq.question}
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-start">
                          <button
                            onClick={() => handleEditFaq(faq)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600 transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Éditer</span>
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq)}
                            className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-800/50 transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
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

        {/* ========================================================================= */}
        {/* TAB: RECHARGE CHANNELS (CANAUX DE RECHARGE MOBILE MONEY)                  */}
        {/* ========================================================================= */}
        {activeAdminTab === 'recharge_channels' && (
          <div className="space-y-6 animate-fadeIn font-sans">
            
            {/* Header & Stats Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-black uppercase text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3" />
                      <span>Système Mobile Money Togo 🇹🇬</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Synchro Supabase Directe
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    Canaux & Numéros de Recharge
                  </h2>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Configurez ici les numéros de dépôt Mobile Money (TMoney, Moov Money, Flooz). Les canaux actifs sont automatiquement synchronisés et affichés aux utilisateurs sur la page de recharge.
                  </p>
                </div>

                {/* Quick Summary Counter */}
                <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 p-3 rounded-2xl shrink-0">
                  <div className="text-center px-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Canaux</p>
                    <p className="text-lg font-black text-white font-mono">{rechargeChannels.length}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="text-center px-2">
                    <p className="text-[10px] uppercase font-bold text-emerald-400">Actifs</p>
                    <p className="text-lg font-black text-emerald-400 font-mono">
                      {rechargeChannels.filter(c => c.isActive).length}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="text-center px-2">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Inactifs</p>
                    <p className="text-lg font-black text-slate-400 font-mono">
                      {rechargeChannels.filter(c => !c.isActive).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FORM CONTAINER (ADD / EDIT) */}
            <div id="channel-form-container" className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                    {editingChannelId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {editingChannelId ? "Modifier le canal de recharge" : "Ajouter un nouveau canal de recharge"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Renseignez le nom de l'opérateur, le numéro officiel de dépôt et les détails de transfert.
                    </p>
                  </div>
                </div>
                {editingChannelId && (
                  <button
                    type="button"
                    onClick={handleCancelEditChannel}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-bold transition-all cursor-pointer"
                  >
                    Annuler la modification
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveChannel} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Nom du canal / opérateur */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>Nom de l'opérateur / Canal</span>
                      <span className="text-amber-400 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: TMoney (Togocom), Moov Money (Flooz)..."
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                  </div>

                  {/* Numéro de recharge */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>Numéro de téléphone pour la recharge</span>
                      <span className="text-amber-400 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: +228 90 12 34 56"
                      value={channelNumber}
                      onChange={(e) => setChannelNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-amber-300 placeholder-slate-500 outline-none focus:border-amber-400 transition-colors font-bold"
                      required
                    />
                  </div>

                  {/* Nom du titulaire */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Nom du titulaire / Bénéficiaire (Optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Service Nutrien Togo, Agence Dépôt..."
                      value={channelHolder}
                      onChange={(e) => setChannelHolder(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  {/* Statut d'activation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Statut du canal</label>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setChannelIsActive(true)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-all cursor-pointer ${
                          channelIsActive 
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-xs' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Actif (Visible aux utilisateurs)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setChannelIsActive(false)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-all cursor-pointer ${
                          !channelIsActive 
                            ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-xs' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Inactif (Masqué)</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Instructions / Notes de transfert */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Instructions spécifiques de dépôt (Optionnel)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Composez *145# puis effectuez le transfert vers ce numéro TMoney, puis collez la référence SMS..."
                    value={channelInstructions}
                    onChange={(e) => setChannelInstructions(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Bouton de soumission */}
                <div className="flex justify-end gap-3 pt-2">
                  {editingChannelId && (
                    <button
                      type="button"
                      onClick={handleCancelEditChannel}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isProcessingChannel}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingChannel ? (
                      <span className="inline-block animate-spin">⏳</span>
                    ) : editingChannelId ? (
                      <Edit2 className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>
                      {isProcessingChannel 
                        ? "Enregistrement en base..." 
                        : editingChannelId 
                          ? "Enregistrer les modifications" 
                          : "Ajouter le canal de recharge"}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* LIST OF CHANNELS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Canaux de recharge enregistrés</h3>
                  <span className="bg-slate-800 text-slate-300 text-xs font-mono px-2 py-0.5 rounded-full">
                    {rechargeChannels.length}
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Rechercher par opérateur ou numéro..."
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {rechargeChannels.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                  <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">Aucun canal de recharge configuré</p>
                  <p className="text-xs text-slate-500">Utilisez le formulaire ci-dessus pour ajouter votre premier canal Mobile Money.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rechargeChannels
                    .filter(c => {
                      if (!channelSearch) return true;
                      const q = channelSearch.toLowerCase();
                      return c.name.toLowerCase().includes(q) ||
                        c.accountNumber.toLowerCase().includes(q) ||
                        (c.accountHolder && c.accountHolder.toLowerCase().includes(q));
                    })
                    .map((channel) => {
                      const isCopied = copiedChannelId === channel.id;
                      return (
                        <div
                          key={channel.id}
                          className={`rounded-2xl border p-4.5 transition-all space-y-3 relative ${
                            channel.isActive
                              ? 'bg-slate-900/90 border-slate-700 shadow-md hover:border-slate-600'
                              : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                          }`}
                        >
                          {/* Top Row: Operator & Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                <h4 className="text-sm sm:text-base font-black text-white">{channel.name}</h4>
                              </div>
                              {channel.accountHolder && (
                                <p className="text-xs text-slate-400">
                                  Titulaire : <span className="text-slate-200 font-semibold">{channel.accountHolder}</span>
                                </p>
                              )}
                            </div>

                            {/* Status Pill */}
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shrink-0 ${
                              channel.isActive
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${channel.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                              <span>{channel.isActive ? 'Actif' : 'Inactif'}</span>
                            </span>
                          </div>

                          {/* Phone Number Display Box */}
                          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Numéro de Recharge</p>
                              <p className="text-base font-mono font-black text-amber-400 tracking-wide">
                                {channel.accountNumber}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyChannelNumber(channel.id, channel.accountNumber)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Copier le numéro"
                            >
                              {isCopied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                              <span>{isCopied ? "Copié !" : "Copier"}</span>
                            </button>
                          </div>

                          {/* Instructions note if present */}
                          {channel.instructions && (
                            <div className="bg-slate-950/50 rounded-xl p-2.5 text-xs text-slate-300 border border-slate-800/60 space-y-0.5">
                              <p className="text-[10px] uppercase font-bold text-slate-400">Instructions :</p>
                              <p className="text-[11px] text-slate-300 leading-relaxed">{channel.instructions}</p>
                            </div>
                          )}

                          {/* Action Buttons Row */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                            {/* Toggle Active / Inactive */}
                            <button
                              type="button"
                              onClick={() => handleToggleChannelStatus(channel.id, channel.isActive, channel.name)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
                                channel.isActive
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              <Power className="w-3 h-3" />
                              <span>{channel.isActive ? "Désactiver" : "Activer"}</span>
                            </button>

                            <div className="flex items-center space-x-2">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleEditChannel(channel)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600 transition-all cursor-pointer flex items-center space-x-1"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Modifier</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteChannel(channel)}
                                className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-800/50 transition-all cursor-pointer flex items-center space-x-1"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
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
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setBalanceAdjustType('add')}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                    balanceAdjustType === 'add' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  + Créditer
                </button>
                <button 
                  onClick={() => setBalanceAdjustType('subtract')}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                    balanceAdjustType === 'subtract' ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  - Déduire
                </button>
                <button 
                  onClick={() => {
                    setBalanceAdjustType('set');
                    if (selectedUserForBalance) setBalanceAdjustAmount(selectedUserForBalance.balance);
                  }}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                    balanceAdjustType === 'set' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  ✏️ Définir solde
                </button>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                  {balanceAdjustType === 'set' ? 'Nouveau solde exact (FCFA)' : 'Montant à ajouter ou déduire (FCFA)'}
                </label>
                <input 
                  type="number" 
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 text-white font-mono font-bold text-base p-3 rounded-xl border border-slate-700 outline-none focus:border-amber-500"
                />
              </div>

              <button 
                onClick={handleApplyBalanceAdjust}
                className={`w-full py-3.5 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md ${
                  balanceAdjustType === 'add' 
                    ? 'bg-emerald-600 hover:bg-emerald-500' 
                    : balanceAdjustType === 'subtract'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {balanceAdjustType === 'add' 
                  ? `+ Créditer le solde (${Math.abs(Number(balanceAdjustAmount) || 0).toLocaleString()} FCFA)` 
                  : balanceAdjustType === 'subtract'
                  ? `- Déduire du solde (${Math.abs(Number(balanceAdjustAmount) || 0).toLocaleString()} FCFA)`
                  : `Confirmer le nouveau solde (${(Number(balanceAdjustAmount) || 0).toLocaleString()} FCFA)`
                }
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

      {/* MODAL: USER PIN MODIFICATION */}
      {selectedUserForPin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full relative space-y-4 shadow-2xl">
            <button 
              onClick={() => setSelectedUserForPin(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full">
                Code PIN de Retrait
              </span>
              <h3 className="text-lg font-bold text-white mt-2">Modifier le code PIN de retrait</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Utilisateur: <strong className="text-white font-bold">{selectedUserForPin.name}</strong> ({selectedUserForPin.phone})
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const res = adminUpdateUserPin(selectedUserForPin.id, newUserPin);
                if (res.success) {
                  showToast('success', `Code PIN de retrait de ${selectedUserForPin.name} modifié avec succès !`);
                  setSelectedUserForPin(null);
                  setNewUserPin('');
                } else {
                  showToast('error', res.error || "Erreur de modification du code PIN.");
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                  Nouveau code PIN de retrait (4 chiffres min)
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: 1234"
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 text-white font-mono font-bold text-lg p-3 rounded-xl border border-slate-700 outline-none focus:border-amber-500 text-center tracking-widest"
                  required
                  minLength={4}
                  maxLength={6}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                Enregistrer le nouveau code PIN
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
                  placeholder="Ex: Pack Santé & Vitalité VIP 1"
                  className="w-full bg-slate-950 text-white font-bold p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Description du Produit</label>
                <textarea 
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Description du produit d'investissement..."
                  rows={2}
                  className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500 leading-relaxed resize-none"
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
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Cycle / Durée (Jours)</label>
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
                <div className="flex items-center space-x-3">
                  <input 
                    type="text" 
                    value={prodForm.image}
                    onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-950 text-white font-mono text-xs p-2.5 rounded-xl border border-slate-700 outline-none focus:border-red-500"
                  />
                  {prodForm.image && (
                    <img 
                      src={prodForm.image} 
                      alt="Aperçu"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'; }}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <input 
                  type="checkbox" 
                  id="prod-active-toggle"
                  checked={prodForm.isActive}
                  onChange={(e) => setProdForm({ ...prodForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 accent-red-600 cursor-pointer"
                />
                <label htmlFor="prod-active-toggle" className="text-xs text-slate-200 font-bold cursor-pointer">
                  Produit actif & disponible immédiatement à l'achat sur le site
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
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Solde:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400 font-mono font-bold">{selectedUserDetails.balance.toLocaleString()} FCFA</span>
                  <button
                    onClick={() => {
                      setSelectedUserForBalance(selectedUserDetails);
                      setSelectedUserDetails(null);
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Modifier
                  </button>
                </div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Code Parrain:</span>
                <span className="text-white font-mono font-bold">{selectedUserDetails.referralCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Pays:</span>
                <span className="text-white font-bold">{selectedUserDetails.country}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Compte de Retrait:</span>
                <span className="text-white font-mono font-bold text-[11px]">
                  {selectedUserDetails.withdrawalAccountNumber 
                    ? `${selectedUserDetails.withdrawalAccountName || ''} (${selectedUserDetails.withdrawalAccountNumber})` 
                    : 'Non lié'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Code PIN Retrait:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400 font-mono font-bold">
                    {selectedUserDetails.withdrawalPinHash ? '•••• (Configuré)' : 'Non configuré'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedUserForPin(selectedUserDetails);
                      setSelectedUserDetails(null);
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Modifier
                  </button>
                </div>
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

      {/* Floating Quick Exit Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={onExitAdmin}
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-2xl border-2 border-red-400 flex items-center space-x-2 cursor-pointer transition-transform hover:scale-105"
          title="Quitter l'administration"
        >
          <LogOut className="w-4 h-4 text-white" />
          <span className="font-black uppercase tracking-wider text-xs">Sortir Admin</span>
        </button>
      </div>

      </div>
    </div>
  );
};
