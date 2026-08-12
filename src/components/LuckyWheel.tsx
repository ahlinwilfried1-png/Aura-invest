import React, { useState, useEffect } from 'react';
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
  if (diffSec < 5) return "À l'instant";
  if (diffSec < 60) return `il y a ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `il y a ${diffHours}h`;
  return new Date(isoString).toLocaleDateString('fr-FR');
};

const DEFAULT_SIMULATED_RECORDS = [
  { id: 'sim-1', userPhone: '+228 90 ** ** 48', prizeLabel: '+50 FCFA', action: 'a gagné le lot maximal', createdAt: new Date(Date.now() - 12000).toISOString() },
  { id: 'sim-2', userPhone: '+228 91 ** ** 12', prizeLabel: '+25 FCFA', action: 'a fait tourner la roue', createdAt: new Date(Date.now() - 35000).toISOString() },
  { id: 'sim-3', userPhone: '+228 92 ** ** 90', prizeLabel: '+35 FCFA', action: 'a fait tourner la roue', createdAt: new Date(Date.now() - 72000).toISOString() },
  { id: 'sim-4', userPhone: '+228 93 ** ** 33', prizeLabel: '+30 FCFA', action: 'a fait tourner la roue', createdAt: new Date(Date.now() - 140000).toISOString() },
  { id: 'sim-5', userPhone: '+228 90 ** ** 88', prizeLabel: '+45 FCFA', action: 'a fait tourner la roue', createdAt: new Date(Date.now() - 210000).toISOString() },
];

const PRESET_PHONES = [
  '+228 90 ** ** 19', '+228 91 ** ** 64', '+228 92 ** ** 82',
  '+228 93 ** ** 91', '+228 90 ** ** 40', '+228 91 ** ** 37',
  '+228 92 ** ** 55', '+228 93 ** ** 73', '+228 90 ** ** 26'
];

const PRESET_PRIZES = ['+25 FCFA', '+30 FCFA', '+35 FCFA', '+40 FCFA', '+45 FCFA', '+50 FCFA'];

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onShowToast }) => {
  const { currentUser, drawRecords, wheelConfig, spinLuckyWheel } = useApp();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Dynamic live feed state combining real database draw records & simulated live activity
  const [dynamicLiveFeed, setDynamicLiveFeed] = useState(() => DEFAULT_SIMULATED_RECORDS);

  // Refresh relative times every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const liveTimer = setInterval(() => {
      // 40% chance to insert a new live participant win
      if (Math.random() < 0.4) {
        const randomPhone = PRESET_PHONES[Math.floor(Math.random() * PRESET_PHONES.length)];
        const randomPrize = PRESET_PRIZES[Math.floor(Math.random() * PRESET_PRIZES.length)];
        const newRecord = {
          id: `live-${Date.now()}`,
          userPhone: randomPhone,
          prizeLabel: randomPrize,
          action: randomPrize.includes('50') ? 'a gagné le lot maximal' : 'a fait tourner la roue',
          createdAt: new Date().toISOString()
        };
        setDynamicLiveFeed(prev => [newRecord, ...prev.slice(0, 15)]);
      }
    }, 6000);
    return () => clearInterval(liveTimer);
  }, []);

  // Merge real draw records from AppContext first, then simulated ones
  const combinedFeed = React.useMemo(() => {
    const realFormatted = drawRecords.map(r => ({
      id: r.id,
      userPhone: r.userPhone,
      prizeLabel: r.prizeLabel,
      action: r.action || 'a fait tourner la roue',
      createdAt: r.createdAt
    }));
    const merged = [...realFormatted, ...dynamicLiveFeed];
    const uniqueMap = new Map();
    merged.forEach(item => {
      if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
    });
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [drawRecords, dynamicLiveFeed]);

  const availableTickets = currentUser?.drawTickets || 0;
  const prizes = (wheelConfig?.prizes && wheelConfig.prizes.length > 0)
    ? wheelConfig.prizes.map(p => {
        const val = Math.min(50, Math.max(25, Number(p.value) || 25));
        return {
          ...p,
          value: val,
          label: `+${val} FCFA`
        };
      })
    : [
        { id: 1, label: '+25 FCFA', value: 25, color: '#059669' },
        { id: 2, label: '+30 FCFA', value: 30, color: '#d97706' },
        { id: 3, label: '+35 FCFA', value: 35, color: '#2563eb' },
        { id: 4, label: '+40 FCFA', value: 40, color: '#7c3aed' },
        { id: 5, label: '+45 FCFA', value: 45, color: '#e11d48' },
        { id: 6, label: '+50 FCFA', value: 50, color: '#b45309' },
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

    const numSlices = prizes.length;
    const sliceAngle = 360 / numSlices;
    const prizeIndex = prizes.findIndex((p) => p.id === wonPrize.id) >= 0 
      ? prizes.findIndex((p) => p.id === wonPrize.id)
      : 0;

    // Calculate rotation to align the slice center with top pointer (0 deg)
    const targetSliceCenter = prizeIndex * sliceAngle + sliceAngle / 2;
    const currentModulo = rotation % 360;
    const extraTurns = 360 * 6; // 6 full rotations
    const delta = (360 - targetSliceCenter) - currentModulo;
    const finalRotation = rotation + extraTurns + (delta >= 0 ? delta : delta + 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinMessage(`🎉 Gagné : +${formatAmount(wonPrize.value)} FCFA crédités sur votre portefeuille !`);
      onShowToast('success', `🎉 Félicitations ! Vous avez gagné ${formatAmount(wonPrize.value)} FCFA sur le tirage !`);
    }, 4500);
  };

  // SVG Helper variables for professional casino wheel
  const numSlices = prizes.length;
  const sliceAngle = 360 / numSlices;
  const sliceColors = ['#dc2626', '#16a34a', '#2563eb', '#d97706', '#9333ea', '#0284c7', '#c026d3', '#059669'];

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 font-sans pb-10">
      
      {/* 1. TICKET STATUS & WHEEL GAME CONTAINER */}
      <div className="space-y-5 text-center relative bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-sm">
        
        {/* WhatsApp Channel Header Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageCircle className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Canal WhatsApp Officiel
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                Rejoindre la chaîne WhatsApp
              </div>
            </div>
          </div>

          <a
            href="https://whatsapp.com/channel/0029Vb8YR5RInlqVFq9AOa33"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba5a] active:scale-[0.98] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shrink-0 shadow-xs"
          >
            <MessageCircle className="w-4 h-4 fill-white text-white" />
            <span>Rejoindre la chaîne</span>
          </a>
        </div>

        {/* Header & Ticket Counter */}
        <div className="space-y-2 pt-1">
          <div className="inline-flex items-center space-x-1.5 bg-amber-500/10 text-amber-700 border border-amber-500/20 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>TIRAGE AU SORT INSTANTANÉ</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Roue de la Chance VIP
          </h2>

          {/* Ticket Balance Pill */}
          <div className="inline-flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xs border border-slate-800">
            <Ticket className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-slate-300">Vos tickets disponibles :</span>
            <span className="text-sm font-black font-mono text-amber-400">{availableTickets} ticket(s)</span>
          </div>
        </div>

        {/* PROFESSIONAL CASINO WHEEL DISPLAY */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto my-4 flex items-center justify-center">
          
          {/* Top Golden Pointer Needle */}
          <div className="absolute -top-4 z-40 transform -translate-x-1/2 left-1/2 filter drop-shadow-md">
            <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 38L0 6C0 2.68629 3.58172 0 8 0H24C28.4183 0 32 2.68629 32 6L16 38Z" fill="url(#pointerGold)" />
              <path d="M16 32L4 6H28L16 32Z" fill="#FBBF24" />
              <circle cx="16" cy="7" r="3" fill="#FFF" />
              <defs>
                <linearGradient id="pointerGold" x1="0" y1="0" x2="32" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F59E0B" />
                  <stop offset="0.5" stopColor="#FCD34D" />
                  <stop offset="1" stopColor="#B45309" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Outer Casino Golden Rim with Flashing LED Bulbs */}
          <div className="absolute inset-0 rounded-full border-[10px] border-amber-500 bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 shadow-xl z-20 flex items-center justify-center p-1.5">
            {/* 12 Perimeter LED Bulbs */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (360 / 12) * i;
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 46 * Math.cos(rad);
              const y = 50 + 46 * Math.sin(rad);
              return (
                <div
                  key={i}
                  className={`absolute w-2.5 h-2.5 rounded-full border border-amber-200 shadow-xs transition-opacity duration-500 ${
                    i % 2 === 0 ? 'bg-amber-100 animate-pulse' : 'bg-yellow-300'
                  }`}
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                />
              );
            })}
          </div>

          {/* ROTATING SVG WHEEL DISK */}
          <div
            className="w-[calc(100%-18px)] h-[calc(100%-18px)] rounded-full relative z-10 overflow-hidden transition-transform duration-[4500ms] cubic-bezier(0.2, 0.8, 0.2, 1) shadow-inner"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg viewBox="0 0 300 300" className="w-full h-full">
              <defs>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
                </filter>
              </defs>
              <g transform="translate(150, 150)">
                {prizes.map((prize, i) => {
                  const startAngle = i * sliceAngle - 90;
                  const endAngle = (i + 1) * sliceAngle - 90;
                  const midAngle = startAngle + sliceAngle / 2;

                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const midRad = (midAngle * Math.PI) / 180;

                  const r = 145;
                  const x1 = r * Math.cos(startRad);
                  const y1 = r * Math.sin(startRad);
                  const x2 = r * Math.cos(endRad);
                  const y2 = r * Math.sin(endRad);

                  const pathData = `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

                  // Text radius
                  const textR = 95;
                  const tx = textR * Math.cos(midRad);
                  const ty = textR * Math.sin(midRad);

                  const fillColor = prize.color || sliceColors[i % sliceColors.length];

                  return (
                    <g key={prize.id || i}>
                      {/* Sector Slice */}
                      <path
                        d={pathData}
                        fill={fillColor}
                        stroke="#FFF"
                        strokeWidth="2.5"
                      />
                      {/* Radial Text */}
                      <g transform={`translate(${tx}, ${ty}) rotate(${midAngle + 90})`}>
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#FFFFFF"
                          fontSize="13"
                          fontWeight="900"
                          fontFamily="sans-serif"
                          filter="url(#shadow)"
                        >
                          {prize.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Center Shiny Jackpot Badge / Cap */}
            <div className="absolute inset-0 m-auto w-14 h-14 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 rounded-full z-30 flex items-center justify-center border-2 border-white shadow-lg">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-amber-300">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>

        </div>

        {/* Win Message */}
        {winMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3.5 text-xs font-extrabold animate-fadeIn flex items-center justify-center space-x-2 shadow-2xs">
            <Trophy className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <span>{winMessage}</span>
          </div>
        )}

        {/* Spin Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:brightness-105 active:scale-[0.99] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
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
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wider uppercase">
              FLUX EN DIRECT DES PARTICIPANTS
            </h3>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center space-x-1 shrink-0">
            <span>DIRECT</span>
            <span className="text-xs">🎡</span>
          </div>
        </div>

        {/* Dynamic Live Winners Feed List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {combinedFeed.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-medium">
              Aucune participation enregistrée pour le moment. Soyez le premier à tenter votre chance !
            </div>
          ) : (
            combinedFeed.map((rec) => (
              <div
                key={rec.id}
                className="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3 transition-all"
              >
                {/* Left Icon Badge */}
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Gift className="w-4.5 h-4.5" />
                </div>

                {/* Middle Info */}
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-black text-slate-900 font-mono tracking-tight">
                    {rec.userPhone}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 truncate flex items-center space-x-1 pt-0.5">
                    <span className="text-slate-700 font-semibold">{rec.action}</span>
                    <span>•</span>
                    <span className="text-slate-400 font-mono">{getRelativeTime(rec.createdAt)}</span>
                  </div>
                </div>

                {/* Right Prize Pill */}
                <div className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-2xs shrink-0 font-mono">
                  {rec.prizeLabel}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. COMMENT OBTENIR DES TICKETS DE TIRAGE ? */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wider uppercase">
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
            className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm py-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-2xs"
          >
            <Share2 className="w-4 h-4" />
            <span>COPIER MON LIEN DE PARRAINAGE</span>
          </button>
        </div>
      </div>

      {/* 4. CANAL WHATSAPP OFFICIEL POUR LES TIRAGES AU SORT */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
              Résultats & Lots du Tirage
            </div>
            <h4 className="text-sm sm:text-base font-extrabold tracking-tight leading-snug">
              Chaîne WhatsApp Officielle des Tirages
            </h4>
            <p className="text-xs text-emerald-100 font-medium leading-relaxed">
              Suivez la publication quotidienne des gagnants, les événements spéciaux de tirage au sort et les codes bonus exclusifs sur notre chaîne.
            </p>
          </div>
        </div>

        <a
          href="https://whatsapp.com/channel/0029Vb8YR5RInlqVFq9AOa33"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-white hover:bg-emerald-50 active:scale-[0.99] text-emerald-800 font-extrabold text-xs sm:text-sm py-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
        >
          <MessageCircle className="w-4 h-4 fill-emerald-700 text-emerald-700" />
          <span>REJOINDRE LA CHAÎNE WHATSAPP</span>
        </a>
      </div>

    </div>
  );
};
