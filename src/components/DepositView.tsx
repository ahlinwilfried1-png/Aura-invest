import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Wallet, 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy,
  Check,
  RefreshCw,
  Info,
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react';
import { User, DepositRequest, RechargeChannel } from '../types';
import { useApp } from '../context/AppContext';
import { ALLOWED_COUNTRIES, AllowedCountry, getCountryByCode, getCountryByPhone } from '../constants/countries';

interface DepositViewProps {
  currentUser: User;
  deposits: DepositRequest[];
  onRequestDeposit?: (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => { success: boolean; error?: string };
  onBack: () => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
}

// Montants de recharge rapides recommandés (alignés sur les packs AirPods)
const QUICK_AMOUNTS = [3000, 8000, 15000, 30000, 50000, 75000, 120000, 250000, 400000];

export const DepositView: React.FC<DepositViewProps> = ({
  currentUser,
  deposits,
  onRequestDeposit,
  onBack,
  onShowToast
}) => {
  const { rechargeChannels, requestDeposit, initiateDepositCheckout } = useApp();

  // Onglet actif : 'form' (Formulaire de recharge) ou 'history' (Historique des dépôts)
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Mode de paiement : 'online' (Passerelle sécurisée Tchin) ou 'manual' (Transfert Mobile Money manuel)
  const [paymentMode, setPaymentMode] = useState<'online' | 'manual'>('online');

  // Pays initial basé sur le profil de l'utilisateur ou son téléphone
  const initialCountry = useMemo(() => {
    if (currentUser.country) {
      return getCountryByCode(currentUser.country);
    }
    return getCountryByPhone(currentUser.phone);
  }, [currentUser.country, currentUser.phone]);

  // Code du pays sélectionné pour la recharge
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(initialCountry.code);

  const selectedCountry: AllowedCountry = useMemo(() => {
    return ALLOWED_COUNTRIES.find(c => c.code === selectedCountryCode) || initialCountry;
  }, [selectedCountryCode, initialCountry]);

  // Réseaux disponibles pour le pays sélectionné
  const availableNetworks = useMemo(() => {
    return [
      ...selectedCountry.networks,
      'Carte Visa / Mastercard'
    ];
  }, [selectedCountry]);

  // Réseau actuellement sélectionné
  const [selectedNetwork, setSelectedNetwork] = useState<string>(selectedCountry.networks[0] || 'Mobile Money');

  // Mettre à jour le réseau sélectionné si le pays change
  useEffect(() => {
    if (selectedCountry && selectedCountry.networks.length > 0) {
      setSelectedNetwork(selectedCountry.networks[0]);
    }
  }, [selectedCountryCode]);

  // Canaux actifs configurés par l'administrateur
  const activeChannels: RechargeChannel[] = useMemo(() => {
    return (rechargeChannels || []).filter(c => c.isActive !== false);
  }, [rechargeChannels]);

  // Canal correspondant au pays sélectionné
  const matchingChannel: RechargeChannel | null = useMemo(() => {
    if (activeChannels.length === 0) return null;
    // Recherche par code de pays
    const byCountry = activeChannels.find(c => c.countryCode === selectedCountry.code);
    if (byCountry) return byCountry;
    // Recherche par nom de réseau
    const netLower = (selectedNetwork || '').toLowerCase();
    const byNetwork = activeChannels.find(c => (c.name || '').toLowerCase().includes(netLower));
    if (byNetwork) return byNetwork;
    return activeChannels[0] || null;
  }, [activeChannels, selectedCountry, selectedNetwork]);

  // Montant à recharger (par défaut 15 000 FCFA)
  const [depAmount, setDepAmount] = useState<number>(15000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('15000');

  // Numéro de téléphone de l'émetteur
  const initialPhoneDigits = useMemo(() => {
    if (!currentUser.phone) return '';
    let p = currentUser.phone.trim();
    for (const c of ALLOWED_COUNTRIES) {
      if (p.startsWith(c.prefix)) {
        p = p.substring(c.prefix.length).trim();
        break;
      }
    }
    return p;
  }, [currentUser.phone]);

  const [senderPhone, setSenderPhone] = useState<string>(initialPhoneDigits);

  // Référence SMS / ID de transaction obligatoire pour dépôt manuel
  const [transactionRef, setTransactionRef] = useState<string>('');

  // État de copie du numéro
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // États de chargement et modales
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
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

  // Validation pour paiement en ligne
  const onlineValidationError = useMemo(() => {
    if (!depAmount || depAmount < 3000) {
      return "Le montant minimum de recharge est de 3 000 FCFA.";
    }
    const cleanSender = senderPhone.replace(/[^0-9]/g, '');
    if (!cleanSender || cleanSender.length < 6) {
      return "Veuillez saisir votre numéro de téléphone émetteur.";
    }
    if (!selectedNetwork) {
      return "Veuillez choisir un réseau de paiement.";
    }
    return null;
  }, [depAmount, senderPhone, selectedNetwork]);

  // Validation pour dépôt manuel
  const manualValidationError = useMemo(() => {
    if (!depAmount || depAmount < 3000) {
      return "Le montant minimum de recharge est de 3 000 FCFA.";
    }
    const cleanSender = senderPhone.replace(/[^0-9]/g, '');
    if (!cleanSender || cleanSender.length < 6) {
      return "Veuillez saisir votre numéro de téléphone émetteur.";
    }
    if (!transactionRef.trim() || transactionRef.trim().length < 3) {
      return "Veuillez renseigner la référence ou l'ID de transaction SMS reçue.";
    }
    return null;
  }, [depAmount, senderPhone, transactionRef]);

  // 1. Procéder au paiement sécurisé en ligne (Tchin)
  const handleOnlineCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onlineValidationError) {
      onShowToast('err', onlineValidationError);
      return;
    }

    setIsSubmitting(true);
    setIsRedirecting(true);

    try {
      const cleanPhone = senderPhone.trim();
      const fullPhone = cleanPhone.startsWith(selectedCountry.prefix) 
        ? cleanPhone 
        : `${selectedCountry.prefix} ${cleanPhone}`;

      // Appel sécurisé au backend via initiateDepositCheckout
      const res = await initiateDepositCheckout({
        amount: depAmount,
        country: selectedCountry.name,
        countryCode: selectedCountry.code,
        method: selectedNetwork,
        phoneNumber: fullPhone
      });

      if (res && res.success) {
        onShowToast('success', "Session de paiement sécurisée créée. Redirection en cours...");

        // Rediriger vers l'endpoint serveur /api/pay-redirect (qui protège le lien réel)
        const targetRedirect = res.redirectUrl || (res as any).paymentUrl || `/api/pay-redirect/${res.deposit?.id || ''}`;
        
        setTimeout(() => {
          window.location.href = targetRedirect;
        }, 800);
      } else {
        setIsSubmitting(false);
        setIsRedirecting(false);
        onShowToast('err', res?.error || "Erreur lors de l'initialisation du paiement sécurisé.");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setIsRedirecting(false);
      onShowToast('err', err?.message || "Une erreur réseau est survenue.");
    }
  };

  // 2. Validation et confirmation du dépôt manuel (SMS)
  const handleConfirmManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualValidationError) {
      onShowToast('err', manualValidationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanSender = senderPhone.trim();
      const fullSenderPhone = cleanSender.startsWith(selectedCountry.prefix)
        ? cleanSender
        : `${selectedCountry.prefix} ${cleanSender}`;

      const channelName = matchingChannel 
        ? matchingChannel.name 
        : `${selectedNetwork} (${selectedCountry.name})`;
      
      const channelAccount = matchingChannel 
        ? matchingChannel.accountNumber 
        : `${selectedCountry.prefix} 90 00 00 00`;

      const channelLabel = `${channelName} - ${channelAccount}`;
      const cleanRef = transactionRef.trim();

      const submitAction = onRequestDeposit || requestDeposit;
      const res = await submitAction(depAmount, channelLabel, cleanRef, null);

      setIsSubmitting(false);

      if (res && res.success) {
        setSubmittedDepositInfo({
          amount: depAmount,
          channelName,
          accountNumber: channelAccount,
          accountHolder: matchingChannel?.accountHolder || 'Service Recharge AirPods',
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
          <span>Recharger mon compte</span>
          <span className="text-sm">{selectedCountry.flag}</span>
        </h1>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'form' ? 'history' : 'form')}
          className="flex items-center space-x-1 text-xs font-bold text-pink-200 hover:text-white bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 px-2.5 py-1 rounded-full cursor-pointer transition-all"
        >
          <Clock className="w-3.5 h-3.5 text-pink-400" />
          <span>{activeTab === 'form' ? 'Historique' : 'Recharger'}</span>
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
                Solde disponible
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{selectedCountry.flag} {selectedCountry.name}</span>
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
              <span>Paiement 100% sécurisé</span>
            </span>
            <span className="font-mono text-pink-300 font-bold">
              {selectedNetwork}
            </span>
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
                        <span className="text-pink-300/70">Réf :</span>
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
          /* FORMULAIRE DE RECHARGE MULTI-PAYS */
          <div className="space-y-3.5 animate-fadeIn">

            {/* 3. SÉLECTION DU PAYS (TOGO, BÉNIN, BURKINA FASO, CÔTE D'IVOIRE, CAMEROUN) */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-pink-400" />
                  <span>1. Sélectionner votre pays</span>
                </label>
                <span className="text-[10px] font-bold text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                  {ALLOWED_COUNTRIES.length} pays disponibles
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ALLOWED_COUNTRIES.map((c) => {
                  const isSel = selectedCountryCode === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCountryCode(c.code)}
                      className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isSel
                          ? 'bg-pink-500/30 border-pink-400 text-white shadow-md ring-1 ring-pink-400/50'
                          : 'bg-[#240c3c] border-pink-500/20 text-pink-200/80 hover:bg-[#320f50]'
                      }`}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] font-mono text-pink-300 ml-auto">{c.prefix}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. CHOIX DU RÉSEAU MOBILE MONEY / PAIEMENT POUR CE PAYS */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-pink-400" />
                  <span>2. Réseau de paiement ({selectedCountry.name})</span>
                </label>
                <span className="text-[10px] font-bold text-pink-300">
                  {selectedCountry.flag} {selectedCountry.currency}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableNetworks.map((net) => {
                  const isSel = selectedNetwork === net;
                  const isTmoney = net.toLowerCase().includes('tmoney');
                  const isWave = net.toLowerCase().includes('wave');
                  const isMoov = net.toLowerCase().includes('moov');
                  const isMtn = net.toLowerCase().includes('mtn');
                  const isOrange = net.toLowerCase().includes('orange');
                  const isCeltiis = net.toLowerCase().includes('celtiis');

                  return (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setSelectedNetwork(net)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center space-x-1.5 ${
                        isSel
                          ? 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 border-pink-400 text-white shadow-md ring-2 ring-pink-400/40'
                          : 'bg-[#240c3c] border-pink-500/20 text-pink-200 hover:bg-[#320f50]'
                      }`}
                    >
                      <span>{net}</span>
                      {isSel && <Check className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. CHOIX DU MODE DE RECHARGE (EN LIGNE AUTOMATIQUE OU MANUEL SMS) */}
            <div className="grid grid-cols-2 gap-2 bg-[#140624] p-1.5 rounded-2xl border border-pink-500/20">
              <button
                type="button"
                onClick={() => setPaymentMode('online')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 border ${
                  paymentMode === 'online'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-400/50 shadow-md shadow-pink-600/30'
                    : 'bg-transparent text-pink-300/70 border-transparent hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-pink-300" />
                <span>Paiement en ligne</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('manual')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 border ${
                  paymentMode === 'manual'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-400/50 shadow-md shadow-pink-600/30'
                    : 'bg-transparent text-pink-300/70 border-transparent hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-pink-300" />
                <span>Transfert manuel (SMS)</span>
              </button>
            </div>

            {/* 6. MONTANT À DÉPOSER (FCFA) & BOUTONS RAPIDES */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono block">
                  3. Montant à recharger ({selectedCountry.currency})
                </label>
                <span className="text-[10px] font-bold text-pink-300/80">Min. 3 000 FCFA</span>
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
                  Montants recommandés :
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

            {/* 7. NUMÉRO DE TÉLÉPHONE ÉMETTEUR */}
            <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 font-mono block">
                4. Votre numéro émetteur ({selectedCountry.name})
              </label>
              <div className="flex items-center bg-[#250d3c] border-2 border-pink-500/30 rounded-xl px-3 py-2.5 focus-within:border-pink-400 transition-all">
                <div className="flex items-center space-x-1.5 mr-2.5 pr-2.5 border-r border-pink-500/30 shrink-0">
                  <span className="text-base leading-none">{selectedCountry.flag}</span>
                  <span className="text-xs font-black font-mono text-pink-200">{selectedCountry.prefix}</span>
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

            {/* MODE 1: PAIEMENT EN LIGNE SÉCURISÉ (TCHIN) */}
            {paymentMode === 'online' && (
              <form onSubmit={handleOnlineCheckout} className="space-y-3">
                <div className="bg-gradient-to-br from-[#270c44] to-[#160528] rounded-2xl p-4 border border-pink-500/30 space-y-2.5 shadow-xl">
                  <div className="flex items-center space-x-2 text-white font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Passerelle de paiement sécurisée Tchin</span>
                  </div>
                  <p className="text-[11px] text-pink-200/80 leading-relaxed">
                    Vous allez être redirigé vers l'interface de paiement sécurisée compatible avec <strong className="text-white">{selectedNetwork}</strong> ({selectedCountry.name}) ainsi que les cartes Visa/Mastercard. Votre solde sera crédité automatiquement dès confirmation.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-pink-300/90 font-mono">
                    <span>Montant : {depAmount.toLocaleString('fr-FR')} FCFA</span>
                    <span className="text-emerald-400 font-bold">Frais : 0 FCFA (Gratuit)</span>
                  </div>
                </div>

                {onlineValidationError && (
                  <div className="bg-[#3c0d1d] border border-red-500/40 rounded-xl p-2.5 text-xs text-red-200 flex items-center space-x-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-[11px] font-semibold">{onlineValidationError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={Boolean(onlineValidationError) || isSubmitting}
                  id="btn-online-checkout"
                  className={`w-full py-4 px-5 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer border ${
                    onlineValidationError || isSubmitting
                      ? 'bg-[#270b42] text-pink-400/40 cursor-not-allowed border-pink-500/20'
                      : 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-pink-400/40 shadow-pink-600/40 active:scale-[0.99]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isRedirecting ? 'Redirection sécurisée...' : 'Génération de la session...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Payer {depAmount > 0 ? `${depAmount.toLocaleString('fr-FR')} FCFA` : ''} en Ligne</span>
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE 2: TRANSFERT MANUEL (SMS) */}
            {paymentMode === 'manual' && (
              <form onSubmit={handleConfirmManualDeposit} className="space-y-3">
                {/* Coordonnées officielles du compte */}
                <div className="bg-gradient-to-br from-[#23093b] to-[#170529] rounded-2xl p-4 border-2 border-pink-500/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-pink-500/25">
                    <div className="flex items-center space-x-2">
                      <span className="text-base leading-none">{selectedCountry.flag}</span>
                      <span className="text-xs font-black uppercase text-white tracking-wide">
                        Numéro officiel : {matchingChannel ? matchingChannel.name : `${selectedNetwork} (${selectedCountry.name})`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-pink-300/80 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                      Officiel
                    </span>
                  </div>

                  {/* Numéro avec bouton Copier */}
                  <div className="bg-[#120420] border border-pink-500/30 rounded-xl p-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-pink-300/70 block font-mono">
                        Numéro à créditer
                      </span>
                      <span className="text-base sm:text-lg font-black text-white font-mono tracking-wider">
                        {matchingChannel ? matchingChannel.accountNumber : `${selectedCountry.prefix} 90 00 00 00`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyNumber(matchingChannel ? matchingChannel.accountNumber : `${selectedCountry.prefix} 90 00 00 00`)}
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

                  {/* Titulaire */}
                  <div className="bg-[#240c3c]/80 border border-pink-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-pink-300/80 font-medium">Titulaire :</span>
                    <span className="font-bold text-white font-mono">
                      {matchingChannel?.accountHolder || `Service Recharge AirPods ${selectedCountry.name}`}
                    </span>
                  </div>

                  {/* Instructions */}
                  <div className="bg-[#240c3c]/90 border border-pink-500/25 rounded-xl p-3 text-xs text-pink-100 space-y-1">
                    <div className="flex items-center space-x-1.5 text-pink-300 font-bold text-[11px] mb-1">
                      <Info className="w-3.5 h-3.5 text-pink-400" />
                      <span>Instructions :</span>
                    </div>
                    <p className="text-[11px] text-pink-200/90 leading-relaxed whitespace-pre-line font-normal">
                      {matchingChannel?.instructions?.trim() || 
                        `Effectuez le transfert ${selectedNetwork} vers ce numéro, puis copiez l'ID de transaction reçu par SMS ci-dessous pour validation.`}
                    </p>
                  </div>
                </div>

                {/* Saisie de l'ID de transaction SMS */}
                <div className="bg-[#1a082b] rounded-2xl p-3.5 border border-pink-500/25 shadow-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-pink-200 block">
                      ID / Référence de la transaction SMS reçue *
                    </label>
                    <span className="text-[10px] text-pink-400 font-mono font-bold">Obligatoire</span>
                  </div>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Ex: 240916.1234.A00123 ou Réf SMS"
                    id="input-deposit-transaction-id"
                    className="w-full bg-[#250d3c] border-2 border-pink-500/30 rounded-xl px-3.5 py-2.5 focus:border-pink-400 outline-none text-white font-mono font-bold text-xs sm:text-sm placeholder:text-pink-300/40 transition-all"
                    required
                  />
                </div>

                {manualValidationError && (
                  <div className="bg-[#3c0d1d] border border-red-500/40 rounded-xl p-2.5 text-xs text-red-200 flex items-center space-x-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-[11px] font-semibold">{manualValidationError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={Boolean(manualValidationError) || isSubmitting}
                  id="btn-confirm-deposit"
                  className={`w-full py-4 px-5 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer border ${
                    manualValidationError || isSubmitting
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
                      <span>Confirmer le dépôt manuel ({depAmount > 0 ? `${depAmount.toLocaleString('fr-FR')} FCFA` : ''})</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* NOTE DE SÉCURITÉ */}
            <div className="bg-[#1a082b] border border-pink-500/20 rounded-xl p-3 text-[11px] text-pink-300/80 text-center flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
              <span>Paiement sécurisé et vérifié. Votre dépôt est immédiatement synchronisé au statut <strong>« En attente »</strong>.</span>
            </div>
          </div>
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
              Votre demande a bien été enregistrée. Votre solde sera crédité dès validation du transfert.
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
