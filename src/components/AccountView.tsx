import React, { useState } from 'react';
import { WithdrawalHistoryView } from './WithdrawalHistoryView';
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
  LockKeyhole
} from 'lucide-react';

interface AccountViewProps {
  currentUser: User;
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  userInvestments: UserInvestment[];
  products: InvestmentProduct[];
  tickets: SupportTicket[];
  globalNotification: string | null;
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
  onOpenTab?: (tab: 'deposit' | 'withdraw' | 'certificate' | 'announcements') => void;
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
  | 'bonus';

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  deposits,
  withdrawals,
  userInvestments,
  products,
  tickets,
  globalNotification,
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
  const [activeSubPage, setActiveSubPage] = useState<SubPage>(null);

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

  // Promo code form
  const [bonusInput, setBonusInput] = useState('');

  // Support ticket form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // User filter lists
  const myDeposits = deposits.filter((d) => d.userId === currentUser.id);
  const myWithdrawals = withdrawals.filter((w) => w.userId === currentUser.id);
  const myInvestments = userInvestments.filter((i) => i.userId === currentUser.id);
  const myTickets = tickets.filter((t) => t.userId === currentUser.id);

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
          {/* 1. Top Header Card: "Mon portefeuille" smooth & minimalist style */}
          <div className="bg-white rounded-3xl p-5 relative overflow-hidden space-y-4 border-b border-slate-100">
            {/* Top-right decorative red accent */}
            <div className="absolute top-0 right-0 w-24 h-10 bg-red-600/90 rounded-bl-2xl pointer-events-none" />

            {/* Header Title with Wallet Icon */}
            <div className="flex items-center space-x-2.5 relative z-10">
              <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                <Wallet className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Mon portefeuille</h3>
            </div>

            {/* Balance ("Équilibre") */}
            <div className="relative z-10 pt-0.5">
              <div className="text-sm sm:text-base text-slate-600 font-normal flex items-baseline space-x-2">
                <span>Équilibre:</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {currentUser.balance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 6 Grid items (2 rows x 3 cols) - clean & borderless */}
            <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 pt-3 text-center border-t border-slate-100">
              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {myInvestments.reduce((acc, inv) => acc + (inv.claimsHistory ? inv.claimsHistory.filter(c => new Date(c).toDateString() === new Date().toDateString()).length * inv.dailyGain : 0), 0)}
                </div>
                <div className="text-[10px] sm:text-[11px] font-normal text-slate-500 leading-tight">
                  Aucun revenu reçu aujourd'hui(XAF)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {myInvestments.reduce((acc, inv) => acc + (inv.totalGain || 0), 0).toLocaleString()}
                </div>
                <div className="text-[10px] sm:text-[11px] font-normal text-slate-500 leading-tight">
                  Revenu cumulé(XAF)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {myWithdrawals.filter(w => new Date(w.createdAt).toDateString() === new Date().toDateString()).reduce((acc, w) => acc + w.amount, 0).toLocaleString()}
                </div>
                <div className="text-[10px] sm:text-[11px] font-normal text-slate-500 leading-tight">
                  Retirer aujourd'hui(XAF)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {myWithdrawals.filter(w => w.status === 'approved').reduce((acc, w) => acc + w.amount, 0).toLocaleString()}
                </div>
                <div className="text-[10px] sm:text-[11px] font-normal text-slate-500 leading-tight">
                  Retraits totaux(XAF)
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {currentUser.referralsCount || 0}
                </div>
                <div className="text-[10px] sm:text-[11px] font-normal text-slate-500 leading-tight">
                  Taille de l'équipe
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {currentUser.teamBenefits || 0}
                </div>
                <div className="text-[10px] sm:text-[11px] font-normal text-slate-500 leading-tight">
                  Avantages pour l'équipe(XAF)
                </div>
              </div>
            </div>
          </div>

          {/* 2. Smooth, Minimalist Row Items List */}
          <div className="divide-y divide-slate-100 bg-white rounded-2xl px-2 py-1">
            {/* Tirage au sort */}
            <div 
              onClick={() => setActiveSubPage('bonus')}
              className="py-3.5 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Tirage au sort</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* De l'argent gratuit */}
            <div 
              onClick={() => {
                const res = onClaimDailyBonus();
                if (res.success) {
                  onShowToast('success', `Bonus quotidien débloqué ! +${res.amount} FCFA`);
                } else {
                  setActiveSubPage('bonus');
                }
              }}
              className="py-3.5 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Gift className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">De l'argent gratuit</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Facture de solde */}
            <div 
              onClick={() => setActiveSubPage('order_history')}
              className="py-3.5 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Facture de solde</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Recharger l'enregistrement */}
            <div 
              onClick={() => setActiveSubPage('deposit_history')}
              className="py-3.5 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Recharger l'enregistrement</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Enregistrement des retraits */}
            <div 
              onClick={() => setActiveSubPage('withdraw_history')}
              className="py-3.5 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Enregistrement des retraits</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Modifier le mot de passe */}
            <div 
              onClick={() => setActiveSubPage('security')}
              className="py-3.5 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Modifier le mot de passe</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Profil / Infos Personnelles */}
            <div 
              onClick={() => setActiveSubPage('profile')}
              className="py-3.5 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Profil & Infos Personnelles</span>
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
                className="py-3.5 px-3 flex items-center justify-between cursor-pointer hover:bg-amber-500/10 transition-colors rounded-xl border border-amber-200/60 bg-amber-50/40"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <LockKeyhole className="w-4.5 h-4.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">Panneau Administratif</span>
                    <span className="text-[10px] font-semibold text-amber-800">Gestion globale du site & utilisateurs</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-700" />
              </div>
            )}



            {/* Se déconnecter */}
            <div 
              onClick={onLogout}
              className="py-3.5 px-3 flex items-center justify-between cursor-pointer hover:bg-red-50/50 transition-colors rounded-xl"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
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
      {/* SUB-PAGE 1: PROFIL / INFORMATIONS PERSONNELLES */}
      {/* ========================================================= */}
      {activeSubPage === 'profile' && (
        <div className="space-y-4">
          {renderHeader('Profil / Informations Personnelles')}

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">NOM COMPLET</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">TÉLÉPHONE (NON MODIFIABLE)</label>
              <input
                type="text"
                value={currentUser.phone}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">NUMÉRO WHATSAPP</label>
              <input
                type="text"
                value={profileForm.whatsapp}
                onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 font-mono">PAYS</label>
              <input
                type="text"
                value={profileForm.country}
                onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={() => {
                onUpdateProfile(profileForm);
                onShowToast('success', 'Profil mis à jour avec succès !');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 2: DÉPÔT */}
      {/* ========================================================= */}
      {activeSubPage === 'deposit' && (
        <div className="space-y-4">
          {renderHeader('Dépôt (Recharger le Solde)')}

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="bg-amber-50 p-3 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-bold">Instructions de Dépôt Mobile Money :</p>
              <p className="text-[11px] font-normal">
                Effectuez le dépôt vers le numéro officiel de la plateforme, puis saisissez le montant et le numéro de transaction reçu par SMS.
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
                <option value="Mixx By Yas">Mixx By Yas</option>
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
              <label className="text-xs font-bold text-slate-700 font-mono">N° DE TRANSACTION (TxID SMS)</label>
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
                const res = onRequestDeposit(depForm.amount, depForm.method, depForm.transactionId, null);
                if (res.success) {
                  onShowToast('success', 'Demande de dépôt envoyée ! Un administrateur va la valider.');
                  setDepForm({ amount: 5000, method: 'Orange Money', transactionId: '' });
                  setActiveSubPage('deposit_history');
                } else {
                  onShowToast('err', res.error || 'Erreur lors du dépôt.');
                }
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
            >
              Soumettre la demande de dépôt
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

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="bg-emerald-50 p-3 rounded-xl text-xs text-emerald-800 space-y-1">
              <p className="font-bold">Conditions de Retrait :</p>
              <p className="text-[11px] font-normal">
                Montant minimum : <strong className="font-mono font-bold">1 500 FCFA</strong>. Les retraits sont traités rapidement par Mobile Money.
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
              <span className="text-[10px] text-slate-400 block font-mono">
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
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
          {renderHeader(`Historique des Dépôts (${myDeposits.length})`)}

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            {myDeposits.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Aucun dépôt enregistré.</p>
            ) : (
              <div className="space-y-2">
                {myDeposits.map((dep) => (
                  <div key={dep.id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{dep.method}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        TxID: {dep.transactionId} • {new Date(dep.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-amber-600 font-mono block">
                        +{dep.amount.toLocaleString()} FCFA
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                          dep.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : dep.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
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
      {/* SUB-PAGE 6: HISTORIQUE DES COMMANDES */}
      {/* ========================================================= */}
      {activeSubPage === 'order_history' && (
        <div className="space-y-4">
          {renderHeader(`Historique des Commandes (${myInvestments.length})`)}

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            {myInvestments.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Aucune commande enregistrée.</p>
            ) : (
              <div className="space-y-3">
                {myInvestments.map((inv) => (
                  <div key={inv.id} className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-black text-slate-900 block text-sm">{inv.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Date d'achat : {new Date(inv.purchaseDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-black text-red-600 font-mono text-sm">
                        {inv.price.toLocaleString()} FCFA
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/60 text-slate-600">
                      <span>Gain quotidien : <strong className="text-emerald-600 font-mono font-bold">+{inv.dailyGain.toLocaleString()} FCFA</strong></span>
                      <span>Restant : <strong className="text-slate-900 font-mono font-bold">{inv.daysRemaining} j</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 7: PRODUITS */}
      {/* ========================================================= */}
      {activeSubPage === 'products' && (
        <div className="space-y-4">
          {renderHeader(`Catalogue Produits (${products.filter((p) => p.isActive).length})`)}

          <div className="space-y-3">
            {products
              .filter((p) => p.isActive)
              .map((prod) => (
                <div key={prod.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
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
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex-shrink-0"
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

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
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

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
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
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
            >
              Mettre à jour le mot de passe
            </button>
          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* SUB-PAGE 11: BONUS & CODE PROMO */}
      {/* ========================================================= */}
      {activeSubPage === 'bonus' && (
        <div className="space-y-4">
          {renderHeader('Bonus Quotidien & Code Promo')}

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="bg-yellow-50 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm block">Pointage Quotidien</span>
                <span className="text-xs text-slate-500">Réclamez votre bonus chaque jour</span>
              </div>
              <button
                onClick={() => {
                  const res = onClaimDailyBonus();
                  if (res.success) {
                    onShowToast('success', `Pointage récompensé ! +${res.amount || 100} FCFA`);
                  } else {
                    onShowToast('info', res.error || "Pointage déjà effectué aujourd'hui.");
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Pointer
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 font-mono uppercase">UTILISER UN CODE CADEAU / PROMO</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: BIENVENU"
                  value={bonusInput}
                  onChange={(e) => setBonusInput(e.target.value)}
                  className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none uppercase"
                />
                <button
                  onClick={() => {
                    if (!bonusInput.trim()) return;
                    const res = onRedeemBonusCode(bonusInput);
                    if (res.success) {
                      onShowToast('success', `Code validé ! +${res.amount} FCFA ajoutés à votre solde.`);
                      setBonusInput('');
                    } else {
                      onShowToast('err', res.error || 'Code invalide ou expiré.');
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Activer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
