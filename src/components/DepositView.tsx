import React, { useState } from 'react';
import { ArrowLeft, CreditCard, CheckCircle, Upload, Copy, Check, History } from 'lucide-react';
import { User, DepositRequest } from '../types';

interface DepositViewProps {
  currentUser: User;
  deposits: DepositRequest[];
  onRequestDeposit: (amount: number, method: any, transactionId: string, screenshotUrl: string | null) => { success: boolean; error?: string };
  onBack: () => void;
  onShowToast: (status: 'success' | 'err', text: string) => void;
}

export const DepositView: React.FC<DepositViewProps> = ({
  currentUser,
  deposits,
  onRequestDeposit,
  onBack,
  onShowToast
}) => {
  const [depAmount, setDepAmount] = useState<number>(5000);
  const [depMethod, setDepMethod] = useState<'Mixx By Yas' | 'Moov Money' | 'MTN Money' | 'Orange Money'>('Orange Money');
  const [depTxId, setDepTxId] = useState('');
  const [depScreenshot, setDepScreenshot] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const merchantNumbers: Record<string, string> = {
    'Orange Money': '+225 07 00 11 22 33',
    'MTN Money': '+225 05 44 55 66 77',
    'Moov Money': '+225 01 88 99 00 11',
    'Mixx By Yas': '+225 07 22 33 44 55'
  };

  const myDeposits = deposits.filter(d => d.userId === currentUser.id);

  const handleCopy = () => {
    navigator.clipboard.writeText(merchantNumbers[depMethod] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('success', 'Numéro marchand copié dans le presse-papier !');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        onShowToast('err', "L'image ne doit pas dépasser 3 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDepScreenshot(reader.result as string);
        onShowToast('success', "Capture d'écran de la recharge chargée !");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depAmount || depAmount < 1000) {
      onShowToast('err', "Le montant minimum de recharge est de 1 000 FCFA.");
      return;
    }
    if (!depTxId.trim()) {
      onShowToast('err', "Veuillez indiquer l'ID de transaction Mobile Money.");
      return;
    }

    const res = onRequestDeposit(depAmount, depMethod, depTxId, depScreenshot);
    if (res.success) {
      onShowToast('success', "Demande de recharge soumise avec succès ! Validation sous 10 minutes.");
      setDepTxId('');
      setDepScreenshot(null);
    } else {
      onShowToast('err', res.error || "Une erreur est survenue lors du dépôt.");
    }
  };

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6 pb-4">
      {/* Top Header / Navigation Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-700 hover:text-red-600 transition-colors font-bold text-sm cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>
        <span className="text-xs font-mono font-bold uppercase text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
          RECHARGE MOBILE MONEY
        </span>
      </div>

      {/* Main Full-Page Deposit Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center">
            <CreditCard className="w-6 h-6 stroke-[2.5px]" />
          </div>
          <span>Recharger votre Portefeuille</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Effectuez un virement Mobile Money vers le numéro marchand ci-dessous puis indiquez votre référence de paiement.
        </p>
      </div>

      {/* Operator Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-mono font-bold uppercase text-slate-700">
          1. Choisissez votre réseau
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['Orange Money', 'MTN Money', 'Moov Money', 'Mixx By Yas'] as const).map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setDepMethod(method)}
              className={`p-3.5 rounded-2xl text-center font-bold text-xs sm:text-sm transition-all cursor-pointer border ${
                depMethod === method
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Merchant Number Box */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-2">
        <span className="text-xs text-amber-900 font-bold uppercase font-mono block">
          Numéro marchand officiel ({depMethod}) :
        </span>
        <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-amber-200">
          <span className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-wider">
            {merchantNumbers[depMethod]}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-lg transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copié !' : 'Copier'}</span>
          </button>
        </div>
        <p className="text-[11px] text-amber-800 font-medium">
          ⚠️ Veuillez effectuer le transfert depuis votre compte Mobile Money avant de remplir le formulaire.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="space-y-3">
          <label className="block text-xs font-mono font-bold uppercase text-slate-700">
            2. Montant de la recharge (FCFA)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[3000, 5000, 10000, 25000, 50000, 100000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setDepAmount(amt)}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  depAmount === amt
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {amt.toLocaleString()}
              </button>
            ))}
          </div>

          <input
            type="number"
            min={1000}
            step={500}
            value={depAmount}
            onChange={(e) => setDepAmount(Number(e.target.value))}
            className="w-full bg-slate-50 outline-none rounded-xl py-3 px-4 text-slate-900 font-mono font-bold text-base border border-slate-200 focus:border-amber-500"
            placeholder="Saisissez un autre montant..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold uppercase text-slate-700">
            3. ID / Référence de Transaction Mobile Money
          </label>
          <input
            type="text"
            placeholder="Exemple : MP260807.1420.C002"
            value={depTxId}
            onChange={(e) => setDepTxId(e.target.value)}
            className="w-full bg-slate-50 outline-none rounded-xl py-3 px-4 text-slate-900 font-mono font-bold text-sm border border-slate-200 focus:border-amber-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold uppercase text-slate-700">
            4. Capture d'écran du Reçu de Paiement (Optionnel)
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-4 text-center cursor-pointer bg-slate-50 relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {depScreenshot ? (
              <div className="space-y-2">
                <img src={depScreenshot} alt="Reçu" className="h-28 mx-auto rounded-lg object-contain" />
                <span className="text-xs font-bold text-emerald-600 block">Capture d'écran chargée ! Cliquer pour changer.</span>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <span className="text-xs font-bold text-slate-600 block">Appuyez pour joindre une photo de la preuve</span>
                <span className="text-[10px] text-slate-400 block font-mono">Formats acceptés : PNG, JPG, WEBP (Max 3 Mo)</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-md"
        >
          Valider ma Recharge ({depAmount.toLocaleString()} FCFA)
        </button>
      </form>

      {/* History section */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <History className="w-4 h-4 text-amber-600" />
          <span>Vos Recharges Récentes ({myDeposits.length})</span>
        </h3>

        {myDeposits.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
            Aucune demande de recharge soumise pour le moment.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
            {myDeposits.map(dep => (
              <div key={dep.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{dep.method}</div>
                  <div className="text-xs text-slate-500 font-mono">ID : {dep.transactionId}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(dep.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-amber-600 font-mono text-base">+{dep.amount.toLocaleString()} FCFA</div>
                  <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    dep.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : dep.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {dep.status === 'approved' ? 'Validé' : dep.status === 'rejected' ? 'Refusé' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
