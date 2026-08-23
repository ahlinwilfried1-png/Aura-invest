import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Info, 
  ShieldCheck, 
  Phone, 
  Copy, 
  Check, 
  CreditCard, 
  Lock, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { User, DepositRequest, RechargeChannel } from '../types';
import { useApp } from '../context/AppContext';
import { ALLOWED_COUNTRIES } from '../constants/countries';

interface DepositViewProps {
  currentUser: User;
  deposits: DepositRequest[];
  onRequestDeposit: (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => { success: boolean; error?: string };
  onBack: () => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
}

export const DepositView: React.FC<DepositViewProps> = ({
  currentUser,
  onRequestDeposit,
  onBack,
  onShowToast
}) => {
  const { rechargeChannels, products } = useApp();

  // Detect user's country or fallback
  const userCountry = ALLOWED_COUNTRIES.find(c => 
    c.name.toLowerCase() === (currentUser.country || '').toLowerCase() || 
    c.code.toLowerCase() === (currentUser.country || '').toLowerCase() ||
    (currentUser.phone && currentUser.phone.startsWith(c.prefix)) ||
    c.code === currentUser.withdrawalCountry
  ) || ALLOWED_COUNTRIES[0];

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(userCountry.code);
  const currentCountry = ALLOWED_COUNTRIES.find(c => c.code === selectedCountryCode) || userCountry;

  // Active channels filtered strictly by selected country
  const activeChannels = React.useMemo(() => {
    return rechargeChannels.filter(c => {
      if (!c.isActive) return false;
      const chCountry = c.countryCode || (
        c.accountNumber?.startsWith('+237') ||
        c.name?.toLowerCase().includes('cameroun') ||
        c.name?.toLowerCase().includes('orange money') ||
        c.name?.toLowerCase().includes('mtn')
          ? 'CM'
          : 'TG'
      );
      return chCountry === currentCountry.code;
    });
  }, [rechargeChannels, currentCountry.code]);

  // Preset amounts in FCFA configured according to official VIP products
  const presetAmounts = React.useMemo(() => {
    const dynamicPrices = (products || [])
      .filter(p => p.isActive !== false && p.price >= 1000)
      .map(p => p.price);
    const defaults = [2500, 6000, 15000, 32000, 70000, 250000, 500000, 1000000];
    const combined = Array.from(new Set([...dynamicPrices, ...defaults])).sort((a, b) => a - b);
    return combined.slice(0, 8);
  }, [products]);

  // States
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    activeChannels.length > 0 ? activeChannels[0].id : ''
  );

  // Sync selectedChannelId when activeChannels list updates from central DB or country switch
  useEffect(() => {
    if (activeChannels.length > 0) {
      if (!selectedChannelId || !activeChannels.some(c => c.id === selectedChannelId)) {
        setSelectedChannelId(activeChannels[0].id);
      }
    } else {
      setSelectedChannelId('');
    }
  }, [activeChannels, selectedChannelId, currentCountry.code]);

  const selectedChannel = activeChannels.find(c => c.id === selectedChannelId) || activeChannels[0];

  const [phone, setPhone] = useState<string>(currentUser.phone || '');
  const [depAmount, setDepAmount] = useState<number>(2500);
  const [customAmountStr, setCustomAmountStr] = useState<string>('2500');
  const [txRef, setTxRef] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [latestTxId, setLatestTxId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Strict Validation Calculation
  const missingFields = React.useMemo(() => {
    const missing: string[] = [];
    if (!selectedChannelId || !selectedChannel) {
      missing.push("Canal de paiement");
    }
    if (!depAmount || depAmount < 1000) {
      missing.push("Montant valide (min. 1 000 FCFA)");
    }
    const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 6) {
      missing.push("Numéro de téléphone émetteur");
    }
    if (!txRef.trim() || txRef.trim().length < 3) {
      missing.push("ID / Référence de la transaction SMS");
    }
    return missing;
  }, [selectedChannelId, selectedChannel, depAmount, phone, txRef]);

  const isFormValid = missingFields.length === 0;

  const handleSelectPreset = (amount: number) => {
    setDepAmount(amount);
    setCustomAmountStr(amount.toString());
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmountStr(val);
    setDepAmount(val ? parseInt(val, 10) : 0);
  };

  const handleCopyNumber = (num: string) => {
    try {
      navigator.clipboard.writeText(num);
      setCopiedNumber(true);
      onShowToast('success', `Numéro de recharge ${num} copié !`);
      setTimeout(() => setCopiedNumber(false), 2000);
    } catch (_) {
      onShowToast('success', `Numéro : ${num}`);
    }
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      onShowToast('err', `Champs manquants obligatoires : ${missingFields.join(', ')}`);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteDeposit = () => {
    if (isSubmitting) return;
    if (!isFormValid) {
      onShowToast('err', `Veuillez remplir tous les champs obligatoires : ${missingFields.join(', ')}`);
      return;
    }
    setIsSubmitting(true);

    const generatedRef = txRef.trim();
    setLatestTxId(generatedRef);

    const methodName = selectedChannel ? `${selectedChannel.name}` : 'Mobile Money Togo';
    const res = onRequestDeposit(depAmount, methodName, generatedRef, null);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmModal(false);

      if (res.success) {
        setShowSuccessModal(true);
        onShowToast('success', "Demande de recharge soumise avec succès !");
      } else {
        onShowToast('err', res.error || "Erreur lors de la soumission de la recharge.");
      }
    }, 400);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12 animate-fadeIn max-w-lg mx-auto font-sans">
      {/* 1. EN-TÊTE COMPACT */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center space-x-1 text-slate-800 hover:text-amber-600 font-bold text-xs sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight text-center flex items-center gap-1.5">
          <span>Recharger mon compte</span>
          <span className="text-base">{currentCountry.flag}</span>
        </h1>

        <div className="w-12" />
      </div>

      <div className="p-3.5 space-y-3.5">
        
        {/* BANDEAU PAYS : TOGO 🇹🇬 / CAMEROUN 🇨🇲 */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-2xl p-3.5 text-white border border-emerald-800/40 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">{currentCountry.flag}</span>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Zone de paiement</p>
                <h2 className="text-xs sm:text-sm font-black text-white">{currentCountry.name} ({currentCountry.networks.join(' & ')})</h2>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {currentCountry.prefix}
            </span>
          </div>

          {/* Quick country switcher */}
          <div className="flex items-center space-x-2 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400">Changer de pays :</span>
            <div className="flex items-center space-x-1.5">
              {ALLOWED_COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCountryCode(c.code)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer border ${
                    currentCountry.code === c.code
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 font-black shadow-xs'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ÉTAPE 1: CHOISIR LE CANAL DE RECHARGE CONFIGURE PAR L'ADMIN */}
        <div className="bg-white rounded-2xl p-3.5 space-y-3 border border-slate-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider font-mono">
              <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
              <span>1. Sélectionner un canal de recharge</span>
            </div>
            <span className="text-[10px] font-mono bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
              {activeChannels.length} disponible{activeChannels.length > 1 ? 's' : ''}
            </span>
          </div>

          {activeChannels.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Aucun canal de recharge configuré</p>
                <p className="text-[11px] text-amber-800">Veuillez contacter le support client pour effectuer votre recharge.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeChannels.map((channel) => {
                const isSelected = selectedChannel?.id === channel.id;
                return (
                  <div
                    key={channel.id}
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={`rounded-2xl p-3 border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-amber-600 bg-amber-500' : 'border-slate-400 bg-white'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="font-black text-xs sm:text-sm text-slate-900">{channel.name}</span>
                      </div>

                      {channel.accountHolder && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          {channel.accountHolder}
                        </span>
                      )}
                    </div>

                    {/* Encadré Numéro Officiel de Recharge */}
                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Numéro de dépôt officiel</p>
                        <p className="text-xs sm:text-sm font-mono font-black text-amber-600 tracking-wide">
                          {channel.accountNumber}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyNumber(channel.accountNumber);
                        }}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg flex items-center space-x-1 transition-all cursor-pointer active:scale-95"
                      >
                        {copiedNumber && selectedChannel?.id === channel.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-amber-300" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Instructions if provided */}
                    {channel.instructions && isSelected && (
                      <div className="text-[11px] text-slate-600 bg-white/80 rounded-lg p-2 border border-slate-200/60 leading-relaxed">
                        <strong className="text-slate-800 font-bold">Consigne : </strong>
                        {channel.instructions}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ÉTAPE 2: SELECTION DU MONTANT */}
        <div className="bg-white rounded-2xl p-3.5 space-y-2.5 border border-slate-200/70 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider font-mono">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>2. Montant de la recharge</span>
          </div>

          {/* Grille des montants prédéfinis */}
          <div className="grid grid-cols-4 gap-1.5">
            {presetAmounts.map(amt => {
              const isSelected = depAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectPreset(amt)}
                  className={`py-2 px-1 rounded-xl text-center font-black text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-400/50'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {amt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                </button>
              );
            })}
          </div>

          {/* Champ de saisie personnalisé */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 flex items-center space-x-2 focus-within:border-amber-500 transition-colors">
            <span className="text-xs font-black text-slate-900 font-mono tracking-wider shrink-0">
              FCFA
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={customAmountStr}
              onChange={handleCustomAmountChange}
              className="w-full bg-transparent outline-none font-black text-amber-600 text-sm sm:text-base font-mono"
              placeholder="Saisir un autre montant..."
            />
          </div>
        </div>

        {/* ÉTAPE 3: VOS COORDONNÉES ET RÉFÉRENCE DE TRANSFERT */}
        <div className="bg-white rounded-2xl p-3.5 space-y-3 border border-slate-200/70 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider font-mono">
            <Phone className="w-4 h-4 text-amber-500 shrink-0" />
            <span>3. Coordonnées & Référence SMS</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Numéro de téléphone de l'utilisateur */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>Votre numéro de téléphone (Émetteur)</span>
                <span className="text-red-500 font-bold text-[9px]">* Obligatoire</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-amber-500 transition-colors">
                <span className="text-xs font-bold font-mono text-amber-600 mr-2 shrink-0">{currentCountry.prefix}</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 90 12 34 56"
                  className="w-full bg-transparent outline-none font-bold text-slate-900 text-xs sm:text-sm font-mono"
                  required
                />
              </div>
            </div>

            {/* Référence ou ID de transaction SMS */}
            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>ID / Référence de la transaction SMS</span>
                <span className="text-red-500 font-bold text-[9px]">* Obligatoire</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-amber-500 transition-colors">
                <FileText className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder={currentCountry.code === 'CM' ? "Ex: MP240101.1234.A12345 ou réf SMS Orange/MTN" : "Ex: TX-987654321 ou réf SMS TMoney / Moov"}
                  className="w-full bg-transparent outline-none font-semibold text-slate-900 text-xs font-mono"
                  required
                />
              </div>
              <span className="text-slate-400 text-[9px] block mt-0.5">Saisissez l'ID ou code reçu par SMS après votre transfert Mobile Money {currentCountry.name}.</span>
            </div>
          </div>
        </div>

        {/* CADRE SOUMETTRE LA RECHARGE */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
          {!isFormValid && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-900 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px]">Champs obligatoires à compléter :</p>
                <p className="text-[10px] text-amber-800">{missingFields.join(' • ')}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleOpenConfirm}
            disabled={!isFormValid}
            className={`w-full py-3.5 px-4 font-black text-sm uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-center ${
              isFormValid
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 cursor-pointer shadow-amber-500/20 active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
            id="btn-soumettre-recharge"
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              {isFormValid 
                ? `Valider la recharge (${depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA)`
                : `Complétez le formulaire (${missingFields.length} champ${missingFields.length > 1 ? 's' : ''} restant${missingFields.length > 1 ? 's' : ''})`
              }
            </span>
          </button>
        </div>

        {/* GUIDE RAPIDE */}
        <div className="px-1 space-y-1.5 text-slate-600 text-xs">
          <p className="font-extrabold text-slate-800 text-[11px] uppercase font-mono flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Comment recharger mon compte ?</span>
          </p>
          <ul className="space-y-1.5 text-[11px] text-slate-500 leading-snug bg-white rounded-xl p-3 border border-slate-200/60">
            <li className="flex items-start space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-[10px] shrink-0">1</span>
              <span>Copiez le numéro officiel de recharge affiché ci-dessus ({selectedChannel?.name || `Mobile Money ${currentCountry.name}`}).</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-[10px] shrink-0">2</span>
              <span>Effectuez le transfert depuis votre compte Mobile Money ({currentCountry.networks.join(' ou ')}) vers ce numéro.</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-[10px] shrink-0">3</span>
              <span>Collez la référence SMS puis cliquez sur <strong>"Valider la recharge"</strong>. Votre solde sera crédité dès validation.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* MODAL DE CONFIRMATION DE RECHARGE */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xs sm:max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-amber-600">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-black text-sm text-slate-900">Confirmation de Recharge</h3>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Canal de transfert :</span>
                <span className="font-bold text-slate-900 text-xs">{selectedChannel?.name}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Numéro destinataire :</span>
                <span className="font-bold font-mono text-amber-700 text-xs">{selectedChannel?.accountNumber}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Votre numéro :</span>
                <span className="font-bold font-mono text-slate-900 text-xs">{currentCountry.prefix} {phone}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Montant :</span>
                <span className="font-black font-mono text-slate-900 text-xs">{depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA</span>
              </div>

              {txRef.trim() && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Réf. SMS :</span>
                  <span className="font-mono text-slate-700 text-xs">{txRef.trim()}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 font-medium text-center">
              Confirmez-vous avoir effectué ou vouloir initier le transfert de <strong className="text-slate-800 font-mono">{depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA</strong> ?
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteDeposit}
                disabled={isSubmitting}
                className="py-2.5 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {isSubmitting ? (
                  <span>Envoi...</span>
                ) : (
                  <span>Confirmer</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUCCÈS APRÈS SOUMISSION */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xs sm:max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Demande de recharge envoyée</h3>
              <p className="text-xs text-slate-500">
                Référence : <strong className="font-mono text-slate-800">{latestTxId}</strong>
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 text-left text-xs">
              <div className="flex items-center justify-between font-bold text-emerald-900 text-[11px]">
                <span>Montant à valider :</span>
                <span className="font-mono">{depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Votre demande de recharge a été enregistrée avec succès. Notre équipe validera votre transfert sous quelques minutes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                onBack();
              }}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
