import React, { useState } from 'react';
import { Sparkles, Trophy, RotateCw, Gift, Share2, HelpCircle, Ticket, CheckCircle2, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LuckyWheelProps {
  onShowToast: (type: 'success' | 'err' | 'info', message: string) => void;
}

const formatAmount = (num: number): string => {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const getRelativeTime = (isoString: string): string => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return "À l'instant";
  if (diffSec < 60) return `il y a ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `il y a ${diffHours}h`;
  return new Date(isoString).toLocaleDateString('fr-FR');
};

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onShowToast }) => {
  const { currentUser, drawRecords, wheelConfig, spinLuckyWheel } = useApp();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winMessage, setWinMessage] = useState<string | null>(null);

  const availableTickets = currentUser?.drawTickets || 0;
  const prizes = wheelConfig?.prizes || [
    { id: 1, label: '+100 XAF', value: 100, color: 'bg-emerald-500 text-white' },
    { id: 2, label: '+300 XAF', value: 300, color: 'bg-amber-500 text-slate-950' },
    { id: 3, label: '+500 XAF', value: 500, color: 'bg-blue-600 text-white' },
    { id: 4, label: '+1 000 XAF', value: 1000, color: 'bg-purple-600 text-white' },
    { id: 5, label: '+200 XAF', value: 200, color: 'bg-rose-500 text-white' },
    { id: 6, label: '+2 000 XAF', value: 2000, color: 'bg-emerald-700 text-white' },
  ];

  const handleCopyReferralLink = () => {
    if (!currentUser) return;
    const refUrl = `${window.location.origin}/?ref=${currentUser.referralCode}`;
    navigator.clipboard.writeText(refUrl);
    onShowToast('success', "Lien de parrainage copié dans le presse-papier !");
  };

  const handleSpin = () => {
    if (isSpinning) return;

    if (availableTickets <= 0) {
      onShowToast('info', "Vous n'avez aucun ticket de tirage. Partagez votre lien de parrainage pour en gagner !");
      return;
    }

    setWinMessage(null);

    // Call context action
    const res = spinLuckyWheel();
    if (!res.success || !res.prize) {
      onShowToast('err', res.error || "Impossible de tourner la roue.");
      return;
    }

    const wonPrize = res.prize;
    setIsSpinning(true);

    // Calculate rotation: 5 full turns (1800 deg) + angle for prize segment
    const segmentAngle = 360 / prizes.length;
    const prizeIndex = prizes.findIndex((p) => p.id === wonPrize.id) >= 0 
      ? prizes.findIndex((p) => p.id === wonPrize.id)
      : 0;

    const targetAngle = 3600 + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));
    const finalRotation = rotation + targetAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinMessage(`🎉 Gagné : +${formatAmount(wonPrize.value)} FCFA crédités sur votre portefeuille !`);
      onShowToast('success', `🎉 Félicitations ! Vous avez gagné ${formatAmount(wonPrize.value)} FCFA sur le tirage !`);
    }, 4000);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 font-sans pb-10">
      
      {/* 1. TICKET STATUS & WHEEL GAME CONTAINER */}
      <div className="space-y-6 text-center relative">
        
        {/* WhatsApp Channel Header Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 text-left border-b border-emerald-200/60 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageCircle className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Canal WhatsApp Officiel
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900">
                Rejoindre le canal WhatsApp
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/22501010101"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-white text-white" />
            <span>Rejoindre canal WhatsApp</span>
          </a>
        </div>

        {/* Wheel Title */}
        <div className="space-y-1.5 pt-2">
          <div className="inline-flex items-center space-x-1.5 bg-amber-500/10 text-amber-700 border border-amber-500/20 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>TIRAGE AU SORT INSTANTANÉ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
            Roue de la Chance
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto font-medium leading-relaxed">
            Utilisez vos tickets pour faire tourner la roue et recevoir des bonus instantanés.
          </p>
        </div>

        {/* Wheel Visual Disk Container */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto my-4 flex items-center justify-center">
          {/* Top Pointer Arrow */}
          <div className="absolute -top-3 z-30 transform -translate-x-1/2 left-1/2">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-500 drop-shadow-md"></div>
          </div>

          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/50 shadow-md pointer-events-none z-20"></div>

          {/* Rotating Wheel Disk */}
          <div
            className="w-full h-full rounded-full border-4 border-slate-100 relative overflow-hidden shadow-md transition-transform duration-[4000ms] cubic-bezier(0.15,0.85,0.15,1)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {prizes.map((prize, idx) => {
              const angle = (360 / prizes.length) * idx;
              return (
                <div
                  key={prize.id}
                  className="absolute top-0 left-0 w-full h-full origin-center flex items-start justify-center pt-3"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <div className={`w-28 sm:w-32 py-1.5 px-2 rounded-lg text-[11px] font-black font-mono shadow-xs transform ${prize.color}`}>
                    {prize.label}
                  </div>
                </div>
              );
            })}

            {/* Center Hub */}
            <div className="absolute inset-0 m-auto w-14 h-14 bg-white border-4 border-amber-500 rounded-full z-10 flex items-center justify-center shadow-md">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Win Message */}
        {winMessage && (
          <div className="bg-emerald-50 text-emerald-800 rounded-xl p-3 text-xs font-bold animate-fadeIn flex items-center justify-center space-x-2">
            <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{winMessage}</span>
          </div>
        )}

        {/* Spin Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
        >
          <RotateCw className={`w-4 h-4 text-white ${isSpinning ? 'animate-spin' : ''}`} />
          <span>
            {isSpinning 
              ? 'TIRAGE EN COURS...' 
              : availableTickets > 0 
                ? 'TOURNER LA ROUE (1 TICKET)' 
                : 'OBTENIR DES TICKETS (PARRAINAGE)'}
          </span>
        </button>
      </div>

      {/* 2. FLUX EN DIRECT DES PARTICIPANTS */}
      <div className="space-y-4 pt-4 border-t border-slate-200/60">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide uppercase">
              FLUX EN DIRECT DES PARTICIPANTS
            </h3>
          </div>

          <div className="bg-emerald-50 text-emerald-700 text-[11px] font-black px-3 py-1 rounded-full flex items-center space-x-1 shrink-0">
            <span>EN DIRECT</span>
            <span className="text-xs">🎡</span>
          </div>
        </div>

        {/* Live List of Real Database Draw Records */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {drawRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-medium">
              Aucune participation enregistrée pour le moment. Soyez le premier à tenter votre chance !
            </div>
          ) : (
            drawRecords.map((rec) => (
              <div
                key={rec.id}
                className="py-3 border-b border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-all px-2 rounded-xl"
              >
                {/* Left Icon Badge */}
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Gift className="w-4.5 h-4.5" />
                </div>

                {/* Middle Info */}
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-black text-slate-900 font-mono tracking-tight">
                    {rec.userPhone}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 truncate flex items-center space-x-1 pt-0.5">
                    <span>{rec.action || 'a fait tourner la roue'}</span>
                    <span>•</span>
                    <span className="text-slate-400">{getRelativeTime(rec.createdAt)}</span>
                  </div>
                </div>

                {/* Right Prize Pill */}
                <div className="bg-emerald-600 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-2xs shrink-0">
                  {rec.prizeLabel}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. COMMENT OBTENIR DES TICKETS DE TIRAGE ? */}
      <div className="space-y-4 pt-4 border-t border-slate-200/60">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide uppercase">
            COMMENT OBTENIR DES TICKETS DE TIRAGE ?
          </h3>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          {/* Step 1 */}
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              Partagez votre lien ou code de parrainage avec vos proches et amis.
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              Chaque fois qu'un filleul direct (Niveau 1) active un plan d'investissement VIP, vous débloquez <strong className="text-slate-900">1 ticket gratuit</strong>.
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              Tous les gains remportés sur la roue sont <strong className="text-emerald-700">directement crédités sur votre solde principal</strong> et retirables immédiatement !
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleCopyReferralLink}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm py-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>COPIER MON LIEN DE PARRAINAGE</span>
          </button>
        </div>
      </div>

    </div>
  );
};
