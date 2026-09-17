import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Wallet, 
  ShieldCheck, 
  Phone, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy,
  Check,
  RefreshCw,
  Info,
  ChevronRight
} from 'lucide-react';
import { User, DepositRequest, RechargeChannel } from '../types';
import { useApp } from '../context/AppContext';

interface DepositViewProps {
  currentUser: User;
  deposits: DepositRequest[];
  onRequestDeposit?: (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => { success: boolean; error?: string };
  onBack: () => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
}

// Montants de recharge rapides recommandés (alignés sur les packs VIP Mango)
const QUICK_AMOUNTS = [3000, 8000, 15000, 30000, 50000, 75000, 120000, 250000, 400000];

export const DepositView: React.FC<DepositViewProps> = ({
  currentUser,
  deposits,
  onRequestDeposit,
  onBack,
  onShowToast
}) => {
  const { rechargeChannels, requestDeposit } = useApp();

  // Onglet actif : 'form' (Formulaire de recharge) ou 'history' (Historique des dépôts)
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Canaux configurés et activés par l'administrateur (exclusif Togo 🇹🇬)
  const activeChannels: RechargeChannel[] = useMemo(() => {
    return (rechargeChannels || []).filter(c => c.isActive !== false);
  }, [rechargeChannels]);

  // ID du canal actuellement sélectionné
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  // Initialisation ou mise à jour automatique du canal sélectionné
  useEffect(() => {
    if (activeChannels.length > 0) {
      const exists = activeChannels.some(c => c.id === selectedChannelId);
      if (!exists) {
        setSelectedChannelId(activeChannels[0].id);
      }
    }
  }, [activeChannels, selectedChannelId]);

  // Canal actif sélectionné
  const selectedChannel: RechargeChannel | null = useMemo(() => {
    if (activeChannels.length === 0) return null;
    return activeChannels.find(c => c.id === selectedChannelId) || activeChannels[0];
  }, [activeChannels, selectedChannelId]);

  // Montant à recharger (par défaut 15 000 FCFA)
  const [depAmount, setDepAmount] = useState<number>(15000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('15000');

  // Numéro de téléphone de l'émetteur
  const initialPhone = useMemo(() => {
    if (!currentUser.phone) return '';
    let p = currentUser.phone.trim();
    if (p.startsWith('+228')) {
      p = p.substring(4).trim();
    }
    return p;
  }, [currentUser.phone]);

  const [senderPhone, setSenderPhone] = useState<string>(initialPhone);

  // Référence SMS / ID de transaction obligatoire
  const [transactionRef, setTransactionRef] = useState<string>('');

  // État de copie du numéro
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // États de soumission et modal de succès
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [submittedDepositInfo, setSubmittedDepositInfo] = useState<{
    amount: number;
    channelName: string;
    accountNumber: string;
    accountHolder: string;
    senderPhone: string;
    transactionId: string;
    date: string;
  } | null>(null);

  // Dépôts de l'utilisateur connecté
  const userDeposits = useMemo(() => {
    return (deposits || [])
      .filter(d => d.userId === currentUser.id || (currentUser.phone && d.userPhone === currentUser.phone))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [deposits, currentUser.id, currentUser.phone]);

  // Gestion des montants rapides
  const handleSelectQuickAmount = (amount: number) => {
    setDepAmount(amount);
    setCustomAmountStr(amount.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmountStr(rawVal);
    setDepAmount(rawVal ? parseInt(rawVal, 10) : 0);
  };

  // Copie rapide du numéro du canal avec notification
  const handleCopyNumber = (num: string) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    onShowToast('success', `Numéro ${num} copié dans le presse-papier !`);
  };

  // Validation
  const validationError = useMemo(() => {
    if (activeChannels.length === 0) {
      return "Aucun canal de recharge n'est actuellement actif. Veuillez réessayer plus tard.";
    }
    if (!selectedChannel) {
      return "Veuillez choisir un canal de dépôt.";
    }
    if (!depAmount || depAmount < 1000) {
      return "Le montant minimum de recharge est de 1 000 FCFA.";
    }
    const cleanSender = senderPhone.replace(/[^0-9]/g, '');
    if (!cleanSender || cleanSender.length < 6) {
      return "Veuillez saisir votre numéro de téléphone émetteur.";
    }
    if (!transactionRef.trim() || transactionRef.trim().length < 3) {
      return "Veuillez renseigner la référence ou l'ID de transaction reçu par SMS.";
    }
    return null;
  }, [activeChannels.length, selectedChannel, depAmount, senderPhone, transactionRef]);

  // Validation et confirmation du dépôt manuel
  const handleConfirmDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) {
      onShowToast('err', validationError);
      return;
    }
    if (!selectedChannel) return;

    setIsSubmitting(true);

    try {
      const cleanSender = senderPhone.trim();
      const fullSenderPhone = cleanSender.startsWith('+228') ? cleanSender : `+228 ${cleanSender}`;
      const channelLabel = `${selectedChannel.name} - ${selectedChannel.accountNumber}`;
      const cleanRef = transactionRef.trim();

      const submitAction = onRequestDeposit || requestDeposit;
      const res = await submitAction(depAmount, channelLabel, cleanRef, null);

      setIsSubmitting(false);

      if (res && res.success) {
        setSubmittedDepositInfo({
          amount: depAmount,
          channelName: selectedChannel.name,
          accountNumber: selectedChannel.accountNumber,
          accountHolder: selectedChannel.accountHolder || 'Service Recharge',
          senderPhone: fullSenderPhone,
          transactionId: cleanRef,
          date: new Date().toISOString()
        });
        setShowSuccessModal(true);
        setTransactionRef('');
        onShowToast('success', "Votre dépôt a été enregistré et est en attente de validation !");
      } else {
        onShowToast('err', res?.error || "Erreur lors de l'enregistrement du dépôt.");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      onShowToast('err', err?.message || "Erreur réseau lors de la validation.");
    }
  };

  return (
    <div className="bg-[#0d0417] text-pink-50 min-h-screen pb-20 font-sans max-w-lg mx-auto select-none">
      
      {/* 1. EN-TÊTE FIXE */}
      <header className="bg-[#140624]/95 backdrop-blur-md border-b border-pink-500/20 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-lg">
        <button
          onClick={onBack}
          type="button"
          id="btn-back-deposit"
          className="flex items-center space-x-1.5 text-pink-300 hover:text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <h1 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
          <span>Recharge / Dépôt Manuel</span>
          <span className="text-sm">🇹🇬</span>
        </h1>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'form' ? 'history' : 'form')}
          className="flex items-center space-x-1 text-xs font-bold text-pink-200 hover:text-white bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 px-2.5 py-1 rounded-full cursor-pointer transition-all"
        >
          <Clock className="w-3.5 h-3.5 text-pink-400" />
          <span>{activeTab === 'form' ? 'Historique' : 'Formulaire'}</span>
        </button>
      </header>

      <div className="p-3.5 space-y-3.5">

        {/* 2. SOLDE ACTUEL DE L'UTILISATEUR */}
        <section className="bg-gradient-to-br from-[#2c0b48] via-[#1b072e] to-[#120420] rounded-2xl p-4 text-white shadow-xl border border-pink-500/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center border border-pink-500/30">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-pink-200 font-mono">
                Solde actuel
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Togo 🇹🇬</span>
            </div>
          </div>

          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {(currentUser.balance || 0).toLocaleString('fr-FR')}
            </span>
            <span className="text-sm font-bold text-pink-400 font-mono">FCFA</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-pink-500/20 flex items-center justify-between text-[11px] text-pink-200/80">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
              <span>Dépôt sécurisé & validation rapide</span>
            </span>
            <span className="font-mono text-pink-300 font-bold">TMoney / Moov</span>
          </div>
        </section>

        {activeTab === 'history' ? (
          /* SECTION HISTORIQUE DES DÉPÔTS */
          <section className="bg-[#1a082b] rounded-2xl p-4 border border-pink-500/25 shadow-xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-pink-400" />
                <span>Mes Dépôts Récents</span>
              </h2>
              <span className="text-[11px] font-bold text-pink-300 font-mono">
                {userDeposits.length} transaction{userDeposits.length > 1 ? 's' : ''}
              </span>
            </div>

            {userDeposits.length === 0 ? (
              <div className="text-center py-8 text-pink-300/60 space-y-1">
                <Wallet className="w-8 h-8 mx-auto text-pink-400/40 stroke-1" />
                <p className="text-xs font-bold text-pink-200">Aucun dépôt enregistré</p>
                <p className="text-[11px]">Effectuez votre premier dépôt pour approvisionner votre compte.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {userDeposits.map((dep) => (
                  <div 
                    key={dep.id} 
                    className="p-3.5 bg-[#240c3c] rounded-xl border border-pink-500/25 flex items-center justify-between text-xs hover:border-pink-400/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="font-black text-white font-mono text-sm">
                        {(Number(dep.amount) || 0).toLocaleString('fr-FR')} FCFA
                      </div>
                      <div className="text-[10px] text-pink-300/80 flex items-center space-x-1.5">
                        <span className="font-semibold text-pink-200">{dep.method}</span>
                        <span>•</span>
                        <span>{new Date(dep.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-[10px] font-mono text-pink-400/90 flex items-center space-x-1">
                        <span className="text-pink-300/70">Réf SMS:</span>
                        <span className="font-bold">{dep.transactionId}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {dep.status === 'approved' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Validé
                        </span>
                      ) : dep.status === 'rejected' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40">
                          Rejeté
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          En attente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          /* FORMULAIRE DE RECHARGE PAR CANAL CONFIGURÉ */
          <form onSubmit={handleConfirmDeposit} className="space-y-3.5">
            
            {/* 3. SÉLECTION DU CANAL DE DÉPÔT CONFIGURÉ PAR L'ADMINISTRATEUR */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono block">
                  1. Choisir le canal de dépôt (Togo 🇹🇬)
                </label>
                <span className="text-[10px] font-bold text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                  {activeChannels.length} canal{activeChannels.length > 1 ? 'aux' : ''} disponible{activeChannels.length > 1 ? 's' : ''}
                </span>
              </div>

              {activeChannels.length === 0 ? (
                <div className="p-3 bg-[#240c3c] border border-amber-500/30 rounded-xl text-center text-xs text-amber-200 space-y-1">
                  <AlertCircle className="w-5 h-5 mx-auto text-amber-400" />
                  <p className="font-bold">Aucun canal configuré pour le moment.</p>
                  <p className="text-[10px] text-pink-300/80">L'administrateur est en train de configurer les canaux de dépôt. Veuillez réessayer dans un instant.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeChannels.map((channel) => {
                    const isSelected = selectedChannel?.id === channel.id;
                    const isTMoney = channel.name.toLowerCase().includes('tmoney') || channel.name.toLowerCase().includes('togo');
                    const isMoov = channel.name.toLowerCase().includes('moov') || channel.name.toLowerCase().includes('flooz');

                    return (
                      <div
                        key={channel.id}
                        onClick={() => setSelectedChannelId(channel.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-900/50 via-purple-900/40 to-pink-900/50 border-pink-400 ring-2 ring-pink-400/40 shadow-md'
                            : 'bg-[#240c3c] border-pink-500/20 hover:bg-[#320f50]'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-pink-400 bg-pink-500' : 'border-pink-500/40 bg-[#19062b]'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-white block truncate">
                              {channel.name}
                            </span>
                            <span className="text-[10px] text-pink-300/70 block font-mono">
                              {channel.accountNumber}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border shrink-0 ${
                          isTMoney 
                            ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                            : isMoov
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                            : 'bg-pink-600/30 text-pink-300 border-pink-500/40'
                        }`}>
                          {isTMoney ? 'TMoney' : isMoov ? 'Moov' : 'Togo'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. INFORMATIONS DÉTAILLÉES DU CANAL SÉLECTIONNÉ */}
            {selectedChannel && (
              <div className="bg-gradient-to-br from-[#23093b] to-[#170529] rounded-2xl p-4 border-2 border-pink-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-pink-500/25">
                  <div className="flex items-center space-x-2">
                    <span className="text-base leading-none">🇹🇬</span>
                    <span className="text-xs font-black uppercase text-white tracking-wide">
                      Coordonnées de dépôt : {selectedChannel.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-pink-300/80 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                    Officiel
                  </span>
                </div>

                {/* Numéro avec bouton Copier mis en avant */}
                <div className="bg-[#120420] border border-pink-500/30 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-pink-300/70 block font-mono">
                      Numéro à créditer
                    </span>
                    <span className="text-base sm:text-lg font-black text-white font-mono tracking-wider">
                      {selectedChannel.accountNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyNumber(selectedChannel.accountNumber)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      isCopied
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md scale-105'
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-pink-400/50 shadow-sm active:scale-95'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Titulaire du compte si configuré */}
                {selectedChannel.accountHolder && (
                  <div className="bg-[#240c3c]/80 border border-pink-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-pink-300/80 font-medium">Titulaire du compte :</span>
                    <span className="font-bold text-white font-mono">{selectedChannel.accountHolder}</span>
                  </div>
                )}

                {/* Instructions spécifiques configurées par l'admin */}
                <div className="bg-[#240c3c]/90 border border-pink-500/25 rounded-xl p-3 text-xs text-pink-100 space-y-1">
                  <div className="flex items-center space-x-1.5 text-pink-300 font-bold text-[11px] mb-1">
                    <Info className="w-3.5 h-3.5 text-pink-400" />
                    <span>Instructions de transfert :</span>
                  </div>
                  <p className="text-[11px] text-pink-200/90 leading-relaxed whitespace-pre-line font-normal">
                    {selectedChannel.instructions?.trim() || 
                      "Effectuez le transfert Mobile Money vers ce numéro, puis copiez la référence ou l'ID de la transaction reçue par SMS pour finaliser le formulaire ci-dessous."}
                  </p>
                </div>
              </div>
            )}

            {/* 5. MONTANT À DÉPOSER (FCFA) & BOUTONS RAPIDES */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono block">
                  2. Montant à déposer (FCFA)
                </label>
                <span className="text-[10px] font-bold text-pink-300/80">Min. 1 000 FCFA</span>
              </div>

              {/* Champ de saisie du montant */}
              <div className="relative flex items-center bg-[#250d3c] border-2 border-pink-500/30 rounded-xl px-3.5 py-2.5 focus-within:border-pink-400 transition-all">
                <input
                  type="text"
                  inputMode="numeric"
                  value={customAmountStr}
                  onChange={handleCustomAmountChange}
                  placeholder="ex: 15000"
                  id="input-deposit-amount"
                  className="w-full bg-transparent outline-none font-black text-white text-lg sm:text-xl font-mono placeholder:text-pink-300/40"
                  required
                />
                <span className="text-xs sm:text-sm font-black text-pink-400 font-mono ml-2 shrink-0">
                  FCFA
                </span>
              </div>

              {/* Boutons de montants rapides */}
              <div>
                <span className="text-[9px] uppercase font-bold text-pink-300/80 tracking-wider block mb-1.5">
                  Montants rapides :
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((amt) => {
                    const isSelected = depAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectQuickAmount(amt)}
                        className={`py-2.5 px-2 rounded-xl text-center font-black text-xs font-mono transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-400 shadow-md ring-2 ring-pink-400/50 scale-[1.02]'
                            : 'bg-[#240c3c] text-pink-100 hover:bg-[#320f50] border-pink-500/25 active:scale-95'
                        }`}
                      >
                        {amt.toLocaleString('fr-FR')} FCFA
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 6. NUMÉRO DE TÉLÉPHONE ÉMETTEUR & RÉFÉRENCE DE TRANSACTION SMS */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-3">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono block">
                3. Preuve et identification du transfert
              </label>

              {/* Numéro émetteur */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-pink-200 block">
                  Votre numéro de téléphone (émetteur) *
                </span>
                <div className="flex items-center bg-[#250d3c] border-2 border-pink-500/30 rounded-xl px-3 py-2.5 focus-within:border-pink-400 transition-all">
                  <div className="flex items-center space-x-1.5 mr-2.5 pr-2.5 border-r border-pink-500/30 shrink-0">
                    <span className="text-base leading-none">🇹🇬</span>
                    <span className="text-xs font-black font-mono text-pink-200">+228</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="ex: 90 12 34 56"
                    id="input-deposit-sender-phone"
                    className="w-full bg-transparent outline-none font-bold text-white text-xs sm:text-sm font-mono placeholder:text-pink-300/40"
                    required
                  />
                </div>
              </div>

              {/* ID de transaction SMS */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-pink-200 block">
                    ID / Référence de la transaction SMS reçue *
                  </span>
                  <span className="text-[10px] text-pink-400 font-mono font-bold">Obligatoire</span>
                </div>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Ex: TMoney 240916.1234.A00123 ou Réf Flooz"
                  id="input-deposit-transaction-id"
                  className="w-full bg-[#250d3c] border-2 border-pink-500/30 rounded-xl px-3.5 py-2.5 focus:border-pink-400 outline-none text-white font-mono font-bold text-xs sm:text-sm placeholder:text-pink-300/40 transition-all"
                  required
                />
                <p className="text-[10px] text-pink-300/70 leading-normal">
                  Saisissez le code de référence reçu dans le SMS de confirmation de transfert de votre opérateur.
                </p>
              </div>
            </div>

            {/* MESSAGE D'ERREUR ÉVENTUEL */}
            {validationError && (
              <div className="bg-[#3c0d1d] border border-red-500/40 rounded-xl p-2.5 text-xs text-red-200 flex items-center space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-[11px] font-semibold">{validationError}</span>
              </div>
            )}

            {/* 7. BOUTON CONFIRMER LE DÉPÔT */}
            <button
              type="submit"
              disabled={Boolean(validationError) || isSubmitting}
              id="btn-confirm-deposit"
              className={`w-full py-4 px-5 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer border ${
                validationError || isSubmitting
                  ? 'bg-[#270b42] text-pink-400/40 cursor-not-allowed border-pink-500/20'
                  : 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-pink-400/40 shadow-pink-600/40 active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement du dépôt...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirmer le dépôt ({depAmount > 0 ? `${depAmount.toLocaleString('fr-FR')} FCFA` : ''})</span>
                </>
              )}
            </button>

            {/* NOTE DE SÉCURITÉ */}
            <div className="bg-[#1a082b] border border-pink-500/20 rounded-xl p-3 text-[11px] text-pink-300/80 text-center flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
              <span>Votre dépôt sera enregistré au statut <strong>« En attente »</strong> et synchronisé avec le panneau d'administration.</span>
            </div>
          </form>
        )}
      </div>

      {/* MODAL DE CONFIRMATION DU DÉPÔT MANUEL */}
      {showSuccessModal && submittedDepositInfo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-b from-[#1f0a33] to-[#120521] rounded-3xl max-w-xs sm:max-w-sm w-full p-5 space-y-4 shadow-2xl border border-pink-500/30 text-center text-pink-50">
            
            <div className="w-14 h-14 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30 mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white tracking-tight">
                Demande de dépôt transmise !
              </h3>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                Statut : En attente de validation
              </div>
            </div>

            {/* Récapitulatif du dépôt */}
            <div className="bg-[#240c3c] border border-pink-500/25 rounded-2xl p-3.5 space-y-2 text-left text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-pink-500/20">
                <span className="text-pink-300 font-medium">Montant :</span>
                <span className="font-black font-mono text-white text-sm">
                  {submittedDepositInfo.amount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-pink-500/20">
                <span className="text-pink-300 font-medium">Canal de recharge :</span>
                <span className="font-bold text-white">{submittedDepositInfo.channelName}</span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-pink-500/20">
                <span className="text-pink-300 font-medium">Numéro crédité :</span>
                <span className="font-mono text-white font-bold">{submittedDepositInfo.accountNumber}</span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-pink-500/20">
                <span className="text-pink-300 font-medium">Votre numéro :</span>
                <span className="font-mono text-white font-bold">{submittedDepositInfo.senderPhone}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-pink-300 font-medium">Réf. transaction :</span>
                <span className="font-mono font-bold text-pink-400">{submittedDepositInfo.transactionId}</span>
              </div>
            </div>

            <p className="text-[11px] text-pink-200/80 leading-relaxed">
              Votre demande a bien été transmise à l'administrateur. Votre solde sera crédité dès la confirmation du transfert Mobile Money.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                setActiveTab('history');
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black rounded-xl text-xs shadow-lg shadow-pink-600/40 transition-all cursor-pointer border border-pink-400/40"
            >
              Consulter mes dépôts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
