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
  const { rechargeChannels } = useApp();

  // Active channels from central DB
  const activeChannels = rechargeChannels.filter(c => c.isActive);
  
  // Default country is Togo 🇹🇬
  const currentCountry = ALLOWED_COUNTRIES[0] || {
    name: 'Togo',
    code: 'TG',
    prefix: '+228',
    flag: '🇹🇬',
    networks: ['TMoney', 'Moov Money (Flooz)']
  };

  // Preset amounts in FCFA
  const presetAmounts = [4000, 15000, 20000, 30000, 50000, 75000, 100000, 150000];

  // States
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    activeChannels.length > 0 ? activeChannels[0].id : ''
  );

  // Sync selectedChannelId when activeChannels list updates from central DB
  useEffect(() => {
    if (activeChannels.length > 0) {
      if (!selectedChannelId || !activeChannels.some(c => c.id === selectedChannelId)) {
        setSelectedChannelId(activeChannels[0].id);
      }
    } else {
      setSelectedChannelId('');
    }
  }, [activeChannels, selectedChannelId]);

  const selectedChannel = activeChannels.find(c => c.id === selectedChannelId) || activeChannels[0];

  const [phone, setPhone] = useState<string>(currentUser.phone || '');
  const [depAmount, setDepAmount] = useState<number>(4000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('4000');
  const [txRef, setTxRef] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [latestTxId, setLatestTxId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 6) {
      onShowToast('err', "Veuillez renseigner votre numéro de téléphone.");
      return;
    }
    if (!depAmount || depAmount < 1000) {
      onShowToast('err', "Le montant minimum de recharge est de 1 000 FCFA.");
      return;
    }
    if (!selectedChannel) {
      onShowToast('err', "Veuillez sélectionner un canal de recharge.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteDeposit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const generatedRef = txRef.trim() || `DEP-${Date.now().toString().slice(-6)}`;
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
          <span className="text-base">🇹🇬</span>
        </h1>

        <div className="w-12" />
      </div>

      <div className="p-3.5 space-y-3.5">
        
        {/* BANDEAU PAYS : TOGO 🇹🇬 */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-2xl p-3 text-white border border-emerald-800/40 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🇹🇬</span>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Zone de paiement</p>
              <h2 className="text-xs sm:text-sm font-black text-white">Togo (Mobile Money TMoney & Moov Flooz)</h2>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            +228
          </span>
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
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                Votre numéro de téléphone (Émetteur)
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
                />
              </div>
            </div>

            {/* Référence ou ID de transaction SMS */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>ID / Référence de la transaction SMS (Optionnel)</span>
                <span className="text-slate-400 text-[9px]">Reçu par SMS après transfert</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-amber-500 transition-colors">
                <FileText className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder="Ex: TX-987654321 ou réf SMS TMoney / Moov"
                  className="w-full bg-transparent outline-none font-semibold text-slate-900 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CADRE SOUMETTRE LA RECHARGE */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
          <button
            type="button"
            onClick={handleOpenConfirm}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 text-center"
            id="btn-soumettre-recharge"
          >
            <Lock className="w-4 h-4 text-slate-950 shrink-0" />
            <span>Valider la recharge ({depAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA)</span>
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
              <span>Copiez le numéro officiel de recharge affiché ci-dessus ({selectedChannel?.name || 'Mobile Money'}).</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-[10px] shrink-0">2</span>
              <span>Effectuez le transfert depuis votre téléphone (TMoney ou Moov Money Flooz) vers ce numéro.</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-[10px] shrink-0">3</span>
              <span>Cliquez sur <strong>"Valider la recharge"</strong>. Votre solde sera crédité dès confirmation de la transaction.</span>
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
