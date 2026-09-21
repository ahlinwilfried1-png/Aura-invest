import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Users, 
  Zap, 
  ShieldCheck, 
  Crown, 
  TrendingUp, 
  Trophy, 
  Award, 
  Gift, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
  History,
  Coins
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskItem, User } from '../types';
import { OFFICIAL_TASKS } from '../constants/tasks';

interface TaskCenterViewProps {
  onBack: () => void;
  onNavigateToProducts?: () => void;
  onNavigateToTeam?: () => void;
}

export const TaskCenterView: React.FC<TaskCenterViewProps> = ({ 
  onBack,
  onNavigateToProducts,
  onNavigateToTeam 
}) => {
  const { 
    currentUser, 
    users, 
    userInvestments, 
    tasks, 
    userTaskClaims, 
    claimTaskReward 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ALL' | 'referral' | 'purchase' | 'team_salary'>('ALL');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [claimToast, setClaimToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Helper to test if a user is direct referee of parent
  const isDirectReferee = (child: User, parent: User | null): boolean => {
    if (!child || !parent || child.id === parent.id) return false;
    const childRefBy = (child.referredByCode || '').trim();
    if (!childRefBy) return false;

    const parentCode = (parent.referralCode || '').trim();
    const parentId = (parent.id || '').trim();
    const parentPhone = (parent.phone || '').trim();

    if (parentCode && childRefBy.toLowerCase() === parentCode.toLowerCase()) return true;
    if (parentId && childRefBy.toLowerCase() === parentId.toLowerCase()) return true;
    if (parentPhone) {
      const pDigits = parentPhone.replace(/\D/g, '');
      const cDigits = childRefBy.replace(/\D/g, '');
      if (childRefBy === parentPhone || childRefBy.replace(/\s+/g, '') === parentPhone.replace(/\s+/g, '')) return true;
      if (pDigits.length >= 8 && cDigits.length >= 8 && (pDigits.endsWith(cDigits) || cDigits.endsWith(pDigits))) return true;
    }
    return false;
  };

  // Team computation for currentUser
  const level1Users = useMemo(() => {
    if (!currentUser) return [];
    return users.filter(u => isDirectReferee(u, currentUser));
  }, [users, currentUser]);

  const level2Users = useMemo(() => {
    if (level1Users.length === 0) return [];
    return users.filter(u => level1Users.some(l1 => isDirectReferee(u, l1)));
  }, [users, level1Users]);

  const level3Users = useMemo(() => {
    if (level2Users.length === 0) return [];
    return users.filter(u => level2Users.some(l2 => isDirectReferee(u, l2)));
  }, [users, level2Users]);

  const level1ActiveInvestors = useMemo(() => {
    return level1Users.filter(u => userInvestments.some(inv => inv.userId === u.id));
  }, [level1Users, userInvestments]);

  const totalTeamInvestmentVolume = useMemo(() => {
    const teamIds = new Set([
      ...level1Users.map(u => u.id),
      ...level2Users.map(u => u.id),
      ...level3Users.map(u => u.id)
    ]);
    return userInvestments
      .filter(inv => teamIds.has(inv.userId))
      .reduce((sum, inv) => sum + (Number(inv.price) || 0) * (Number(inv.quantity) || 1), 0);
  }, [level1Users, level2Users, level3Users, userInvestments]);

  // Check task fulfillment and claims for current user
  const todayDate = new Date().toISOString().split('T')[0];

  const getTaskStatus = (task: TaskItem) => {
    if (!currentUser) {
      return { current: 0, target: task.targetValue, isFulfilled: false, isClaimed: false, percent: 0 };
    }

    // 1. Calculate Real Progress
    let current = 0;
    const target = Number(task.targetValue) || 1;

    if (task.targetType === 'level1_investors_count') {
      current = level1ActiveInvestors.length;
    } else if (task.targetType === 'vip_purchase') {
      const targetVip = Number(task.targetVipLevel || task.targetValue) || 4;
      const userInvs = userInvestments.filter(inv => inv.userId === currentUser.id);
      const hasPurchasedVip = userInvs.some(inv => {
        const pId = String(inv.productId || '').toLowerCase();
        const pName = String(inv.productName || '').toLowerCase();
        if (pId.includes(`vip${targetVip}`) || pName.includes(`vip${targetVip}`)) return true;
        const match = (pName + ' ' + pId).match(/vip(\d+)/i);
        if (match && parseInt(match[1], 10) >= targetVip) return true;
        return false;
      }) || (Number(currentUser.vipLevel || 0) >= targetVip);

      current = hasPurchasedVip ? 1 : 0;
    } else if (task.targetType === 'team_investment_amount') {
      current = totalTeamInvestmentVolume;
    }

    const isFulfilled = current >= target;
    const percent = Math.min(100, Math.round((current / target) * 100));

    // 2. Check Claims
    const userClaims = userTaskClaims.filter(c => c.userId === currentUser.id && c.taskId === task.id);
    let isClaimed = false;
    let claimedToday = false;

    if (task.rewardType === 'one_time') {
      isClaimed = userClaims.length > 0;
    } else if (task.rewardType === 'daily_salary') {
      claimedToday = userClaims.some(c => c.claimedDate === todayDate);
      isClaimed = claimedToday;
    }

    return { current, target, isFulfilled, isClaimed, claimedToday, percent };
  };

  // Ensure tasks are never empty in deployed or fresh environments
  const effectiveTasks = useMemo(() => {
    if (Array.isArray(tasks) && tasks.length > 0) {
      return tasks;
    }
    return OFFICIAL_TASKS;
  }, [tasks]);

  // Filter tasks based on active category
  const filteredTasks = useMemo(() => {
    return effectiveTasks
      .filter(t => t.isActive !== false)
      .filter(t => activeTab === 'ALL' || t.category === activeTab)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [effectiveTasks, activeTab]);

  // Overall User Summary Stats
  const userTotalClaimsCount = useMemo(() => {
    if (!currentUser) return 0;
    return userTaskClaims.filter(c => c.userId === currentUser.id).length;
  }, [userTaskClaims, currentUser]);

  const userTotalRewardsEarned = useMemo(() => {
    if (!currentUser) return 0;
    return userTaskClaims
      .filter(c => c.userId === currentUser.id)
      .reduce((sum, c) => sum + (Number(c.reward) || 0), 0);
  }, [userTaskClaims, currentUser]);

  // Claim handler
  const handleClaim = async (task: TaskItem) => {
    if (!currentUser) {
      setClaimToast({ message: 'Veuillez vous connecter pour réclamer une récompense.', type: 'error' });
      return;
    }

    const status = getTaskStatus(task);
    if (status.isClaimed) {
      setClaimToast({ message: 'Cette récompense a déjà été perçue.', type: 'error' });
      return;
    }

    if (!status.isFulfilled) {
      setClaimToast({ message: 'Conditions non remplies pour le moment. Complétez la tâche pour débloquer la prime.', type: 'error' });
      return;
    }

    try {
      setClaimingTaskId(task.id);
      const res = await claimTaskReward(task.id);
      if (res.success) {
        setClaimToast({ 
          message: `Succès ! +${(res.reward || task.reward).toLocaleString('fr-FR')} XOF crédités directement sur votre solde.`, 
          type: 'success' 
        });
      } else {
        setClaimToast({ message: res.error || 'Erreur lors de la réclamation.', type: 'error' });
      }
    } catch (err: any) {
      setClaimToast({ message: err?.message || 'Erreur de connexion.', type: 'error' });
    } finally {
      setClaimingTaskId(null);
      setTimeout(() => setClaimToast(null), 4500);
    }
  };

  const getTaskIcon = (iconName?: string, category?: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-5 h-5 text-pink-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'Crown': return <Crown className="w-5 h-5 text-yellow-400" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5 text-cyan-400" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-amber-300" />;
      case 'Award': return <Award className="w-5 h-5 text-purple-400" />;
      default:
        if (category === 'referral') return <Users className="w-5 h-5 text-pink-400" />;
        if (category === 'purchase') return <Zap className="w-5 h-5 text-amber-400" />;
        return <TrendingUp className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="animate-fadeIn max-w-md sm:max-w-xl mx-auto pb-28 px-3 sm:px-4 text-white font-sans">
      {/* Top Mobile Header Navigation Bar */}
      <div className="flex items-center justify-between py-3.5 border-b border-pink-500/20 mb-3 bg-[#120422]/95 sticky top-0 z-20 backdrop-blur-md rounded-2xl px-2">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 text-pink-300 hover:text-white transition-colors font-bold text-sm cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <div className="text-center">
          <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
            <Coins className="w-5 h-5 text-pink-400 animate-pulse" />
            Centre de tâches
          </h1>
          <p className="text-[10px] text-pink-300/70 font-mono">AirProds Rewards Hub</p>
        </div>
        <button
          onClick={() => setShowHistoryModal(true)}
          title="Historique des primes"
          className="flex items-center space-x-1 text-[11px] font-bold text-pink-300 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Historique</span>
        </button>
      </div>

      {/* Dynamic Toast Feedback */}
      {claimToast && (
        <div 
          className={`mb-3 p-3 rounded-xl border flex items-center space-x-2 text-xs font-semibold shadow-lg transition-all animate-bounce ${
            claimToast.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {claimToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{claimToast.message}</span>
        </div>
      )}

      {/* Hero Welcome & Earnings Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a082b] via-[#24083d] to-[#120422] border border-pink-500/30 p-4 mb-4 shadow-xl">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-pink-300 bg-pink-500/20 border border-pink-500/30 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-pink-300" />
              Bonus & Salaires Quotidiens
            </span>
            <p className="text-xs text-pink-100/90 leading-relaxed font-normal pt-1">
              💸 Accomplissez des tâches pour gagner davantage de récompenses : bonus de parrainage, primes d’achat d’équipement et salaires quotidiens d’équipe.
            </p>
          </div>
        </div>

        {/* User Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-pink-500/20 text-center">
          <div className="bg-[#120422]/80 rounded-xl p-2 border border-pink-500/20">
            <p className="text-[10px] text-pink-300/70 uppercase tracking-wider font-mono">Primes Perçues</p>
            <p className="text-xs sm:text-sm font-extrabold text-pink-300 mt-0.5">
              {userTotalRewardsEarned.toLocaleString('fr-FR')} XOF
            </p>
          </div>
          <div className="bg-[#120422]/80 rounded-xl p-2 border border-pink-500/20">
            <p className="text-[10px] text-pink-300/70 uppercase tracking-wider font-mono">Tâches Validées</p>
            <p className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
              {userTotalClaimsCount}
            </p>
          </div>
          <div className="bg-[#120422]/80 rounded-xl p-2 border border-pink-500/20">
            <p className="text-[10px] text-pink-300/70 uppercase tracking-wider font-mono">Solde Actuel</p>
            <p className="text-xs sm:text-sm font-extrabold text-emerald-400 mt-0.5">
              {(Number(currentUser?.balance) || 0).toLocaleString('fr-FR')} XOF
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Regulatory Disclaimer Box */}
      <div className="flex items-start space-x-2 bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 mb-3 text-[11px] text-amber-200/90 leading-snug">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong className="font-bold text-amber-300">Note légale et promotionnelle :</strong> Les récompenses sont accordées selon les conditions promotionnelles officielles AirProds et ne garantissent en aucun cas un revenu fixe permanent.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md border border-pink-300/40'
              : 'bg-[#1a082b] text-pink-300/70 hover:text-white border border-pink-500/20'
          }`}
        >
          Toutes ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('referral')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'referral'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md border border-pink-300/40'
              : 'bg-[#1a082b] text-pink-300/70 hover:text-white border border-pink-500/20'
          }`}
        >
          Parrainage (Niveau 1)
        </button>
        <button
          onClick={() => setActiveTab('purchase')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'purchase'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md border border-pink-300/40'
              : 'bg-[#1a082b] text-pink-300/70 hover:text-white border border-pink-500/20'
          }`}
        >
          AirProds (VIP)
        </button>
        <button
          onClick={() => setActiveTab('team_salary')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'team_salary'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md border border-pink-300/40'
              : 'bg-[#1a082b] text-pink-300/70 hover:text-white border border-pink-500/20'
          }`}
        >
          Salaires Quotidiens
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-pink-300/60 text-sm font-medium bg-[#1a082b] rounded-2xl border border-pink-500/20">
            Aucune tâche disponible dans cette catégorie.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const status = getTaskStatus(task);
            const isProcessing = claimingTaskId === task.id;

            return (
              <div 
                key={task.id}
                className="bg-[#1a082b] hover:bg-[#1e0a32] border border-pink-500/25 hover:border-pink-500/45 rounded-2xl p-3.5 transition-all shadow-md relative overflow-hidden group"
              >
                {/* Header of Task Card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#120422] border border-pink-500/30 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                      {getTaskIcon(task.iconName, task.category)}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white leading-snug group-hover:text-pink-300 transition-colors">
                        {task.title}
                      </h3>
                      <p className="text-[11px] text-pink-300/70 leading-relaxed mt-0.5">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {/* Reward Badge */}
                  <div className="text-right shrink-0">
                    <span className="inline-block bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/40 text-pink-300 font-extrabold text-xs px-2.5 py-1 rounded-xl whitespace-nowrap shadow-sm">
                      +{task.reward.toLocaleString('fr-FR')} XOF
                    </span>
                    <p className="text-[9px] text-pink-400/60 font-mono mt-0.5 uppercase">
                      {task.rewardType === 'daily_salary' ? '/ jour' : 'Prime unique'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Real Metric */}
                <div className="mt-3 bg-[#120422] rounded-xl p-2.5 border border-pink-500/20">
                  <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
                    <span className="text-pink-300/80 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-pink-400" />
                      Progression réelle
                    </span>
                    <span className="font-mono text-pink-200 font-bold">
                      {task.targetType === 'team_investment_amount' 
                        ? `${status.current.toLocaleString('fr-FR')} / ${status.target.toLocaleString('fr-FR')} XOF`
                        : `${status.current} / ${status.target}`
                      } ({status.percent}%)
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2 bg-[#250738] rounded-full overflow-hidden border border-pink-500/20">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        status.isFulfilled 
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm shadow-emerald-500/50' 
                          : 'bg-gradient-to-r from-pink-500 to-purple-600'
                      }`}
                      style={{ width: `${status.percent}%` }}
                    />
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-pink-500/15">
                  <div className="text-[10px] text-pink-300/60">
                    {task.rewardType === 'daily_salary' ? (
                      <span className="text-cyan-300 font-mono flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Salaire quotidien récurrent
                      </span>
                    ) : (
                      <span className="text-pink-300/70 font-mono">
                        Prime de déblocage direct
                      </span>
                    )}
                  </div>

                  <div>
                    {status.isClaimed ? (
                      <div className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {task.rewardType === 'daily_salary' ? 'Perçu aujourd’hui' : 'Déjà réclamé'}
                        </span>
                      </div>
                    ) : status.isFulfilled ? (
                      <button
                        onClick={() => handleClaim(task)}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/30 border border-emerald-300/40 cursor-pointer flex items-center space-x-1.5 animate-pulse"
                      >
                        {isProcessing ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Crédit en cours...</span>
                          </>
                        ) : (
                          <>
                            <Gift className="w-3.5 h-3.5" />
                            <span>Réclamer</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        {task.category === 'referral' && onNavigateToTeam && (
                          <button
                            onClick={onNavigateToTeam}
                            className="px-2.5 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            Inviter <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {task.category === 'purchase' && onNavigateToProducts && (
                          <button
                            onClick={onNavigateToProducts}
                            className="px-2.5 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            Voir VIP <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <span className="px-2.5 py-1 bg-[#120422] text-pink-300/50 rounded-lg text-[10px] font-bold border border-pink-500/15">
                          En cours ({status.percent}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Claims History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#1a082b] border border-pink-500/30 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-pink-500/20 bg-[#120422]">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-pink-400" />
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Historique de vos primes
                </h2>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-7 h-7 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {userTaskClaims.filter(c => c.userId === currentUser?.id).length === 0 ? (
                <div className="py-12 text-center text-pink-300/60 text-xs">
                  Aucune prime réclamée pour le moment. Accomplissez les tâches du Centre pour percevoir vos gains !
                </div>
              ) : (
                userTaskClaims
                  .filter(c => c.userId === currentUser?.id)
                  .map((claim) => (
                    <div 
                      key={claim.id}
                      className="flex items-center justify-between p-3 bg-[#120422] border border-pink-500/20 rounded-xl"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white leading-snug">
                          {claim.taskTitle}
                        </p>
                        <p className="text-[10px] text-pink-300/60 font-mono">
                          {new Date(claim.claimedAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400">
                          +{(Number(claim.reward) || 0).toLocaleString('fr-FR')} XOF
                        </span>
                        <p className="text-[9px] text-pink-300/50 font-mono uppercase">
                          {claim.rewardType === 'daily_salary' ? 'Salaire' : 'Prime'}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-pink-500/20 bg-[#120422] text-center">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
