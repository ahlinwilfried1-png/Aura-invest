/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  Lock, 
  User, 
  Globe, 
  UserPlus, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Send
} from 'lucide-react';

interface AuthPagesProps {
  initialMode: 'login' | 'register';
  onBackToLanding: () => void;
  onSuccess: () => void;
  authActions: {
    login: (phone: string, word: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: {
      name: string;
      phone: string;
      whatsapp: string;
      country: string;
      word: string;
      referrerCode: string;
    }) => Promise<{ success: boolean; error?: string }>;
  };
}

const COUNTRIES = [
  { name: "Côte d'Ivoire", code: "CI", prefix: "+225" },
  { name: "Sénégal", code: "SN", prefix: "+221" },
  { name: "Mali", code: "ML", prefix: "+223" },
  { name: "Burkina Faso", code: "BF", prefix: "+226" },
  { name: "Togo", code: "TG", prefix: "+228" },
  { name: "Bénin", code: "BJ", prefix: "+229" },
  { name: "Cameroun", code: "CM", prefix: "+237" },
  { name: "Niger", code: "NE", prefix: "+227" }
];

export const AuthPages: React.FC<AuthPagesProps> = ({ 
  initialMode, 
  onBackToLanding, 
  onSuccess,
  authActions 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountryPrefix, setRegCountryPrefix] = useState("+225");
  const [regCountryName, setRegCountryName] = useState("Côte d'Ivoire");
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regReferrer, setRegReferrer] = useState('');
  const [isReferralFromUrl, setIsReferralFromUrl] = useState(false);
  
  // Visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Forgot Password Flow State
  const [forgotPasswordActive, setForgotPasswordActive] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Read URL params & local storage for referral code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refFromUrl = params.get('ref') || localStorage.getItem('aurainvest_ref_code');
    if (refFromUrl) {
      setRegReferrer(refFromUrl);
      setIsReferralFromUrl(true);
    }
  }, []);

  const handleCountryChange = (prefix: string) => {
    setRegCountryPrefix(prefix);
    const found = COUNTRIES.find(c => c.prefix === prefix);
    if (found) {
      setRegCountryName(found.name);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim() || !loginPassword) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await authActions.login(loginPhone.trim(), loginPassword);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.error || "Une erreur est survenue lors de la connexion.");
      }
    } catch (err) {
      setErrorMsg("Erreur de connexion au serveur. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = regPhone.trim();
    if (!cleanPhone) {
      setErrorMsg("Veuillez entrer votre numéro de téléphone.");
      return;
    }
    if (!regPassword) {
      setErrorMsg("Veuillez choisir un mot de passe.");
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg("Le mot de passe doit comporter au moins 4 caractères.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      // Build full phone with prefix if user didn't write leading +
      const fullPhone = cleanPhone.startsWith('+') 
        ? cleanPhone 
        : `${regCountryPrefix} ${cleanPhone}`;

      // Default name if left blank
      const fullName = regName.trim() || `Membre ${cleanPhone.slice(-4)}`;

      const res = await authActions.register({
        name: fullName,
        phone: fullPhone,
        whatsapp: fullPhone,
        country: regCountryName,
        word: regPassword,
        referrerCode: regReferrer.trim()
      });

      if (res.success) {
        setSuccessMsg("Inscription réussie ! Connexion automatique...");
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setErrorMsg(res.error || "Une erreur est survenue lors de l'inscription.");
      }
    } catch (err) {
      setErrorMsg("Échec de l'inscription. Veuillez vérifier vos informations.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPhone.trim()) {
      setErrorMsg("Veuillez saisir votre numéro de téléphone.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotSuccess("Instructions de réinitialisation envoyées ! Si votre numéro est enregistré, un code temporaire vous sera transmis via WhatsApp.");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative font-sans">
      

      {/* Main Content Area - Form directly on background without outer card or heavy shadow */}
      <div className="w-full max-w-md my-auto space-y-6">
        
        {/* Logo and Site Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/20">
            <TrendingUp className="w-7 h-7 text-slate-950 stroke-[2.5px]" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              AURA <span className="text-amber-600">INVEST</span>
            </span>
            <span className="block text-[9px] tracking-[0.25em] font-mono text-amber-800 font-extrabold uppercase mt-0.5">
              FINTECH SÉCURISÉE & TRANSPARENTE
            </span>
          </div>
        </div>

        {/* AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          {forgotPasswordActive ? (
            /* ========================================================= */
            /* 1. FORGOT PASSWORD VIEW                                  */
            /* ========================================================= */
            <motion.div
              key="forgot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Mot de passe oublié ?
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Saisissez votre numéro de téléphone d'inscription pour réinitialiser l'accès à votre compte.
                </p>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-2xl flex items-center space-x-2 text-xs text-red-700 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 leading-relaxed font-medium animate-fadeIn space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Demande prise en compte</span>
                  </div>
                  <p>{forgotSuccess}</p>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Numéro de Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="tel" 
                      placeholder="Ex: 07070707" 
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="w-full bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 outline-none rounded-2xl py-3.5 pl-10 pr-4 text-sm font-bold text-slate-900 transition-all"
                      id="forgot-phone-input"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 active:scale-[0.99] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm cursor-pointer transition-all flex items-center justify-center space-x-2"
                  id="forgot-submit-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Envoyer la demande</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setForgotPasswordActive(false);
                      setForgotSuccess(null);
                      setErrorMsg(null);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-amber-600 transition-colors cursor-pointer"
                    id="back-to-login-btn-from-forgot"
                  >
                    ← Retour à la connexion
                  </button>
                </div>
              </form>
            </motion.div>
          ) : mode === 'login' ? (
            /* ========================================================= */
            /* 2. PAGE DE CONNEXION                                     */
            /* ========================================================= */
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Header Title & Subtitle */}
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Bienvenue
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Connectez-vous à votre compte pour continuer.
                </p>
              </div>

              {/* Error Message Display */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-center space-x-2 text-xs text-red-700 animate-fadeIn font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Numéro de téléphone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Numéro de Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="tel" 
                      placeholder="Saisissez votre numéro"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 outline-none rounded-2xl py-3.5 pl-10 pr-4 text-sm font-bold text-slate-900 transition-all"
                      id="login-phone-input"
                      required
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Mot de passe
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type={showLoginPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 outline-none rounded-2xl py-3.5 pl-10 pr-11 text-sm font-bold text-slate-900 transition-all"
                      id="login-password-input"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title={showLoginPassword ? "Masquer" : "Afficher"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Main Submit Button */}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 active:scale-[0.99] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm cursor-pointer transition-all flex items-center justify-center space-x-2"
                  id="login-submit-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>SE CONNECTER</span>
                  )}
                </button>
              </form>

              {/* Footer Switcher */}
              <div className="text-center pt-3 border-t border-slate-200/80">
                <span className="text-xs text-slate-500 font-medium">Vous n'avez pas encore de compte ? </span>
                <button 
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-amber-600 font-black hover:underline cursor-pointer"
                  id="switch-to-register-btn"
                >
                  S'inscrire
                </button>
              </div>
            </motion.div>
          ) : (
            /* ========================================================= */
            /* 3. PAGE D'INSCRIPTION                                    */
            /* ========================================================= */
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Header Title & Subtitle */}
              <div className="text-center space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Créer un compte
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Inscrivez-vous pour accéder à votre espace personnel
                </p>
              </div>

              {/* Success Message Display */}
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800 animate-fadeIn font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Error Message Display */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-center space-x-2 text-xs text-red-700 animate-fadeIn font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Register Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">

                {/* 1. Numéro de téléphone (avec indicatif pays + icône téléphone) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Numéro de Téléphone
                  </label>
                  <div className="flex space-x-2">
                    {/* Indicatif pays */}
                    <div className="relative w-32 flex-shrink-0">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <select 
                        value={regCountryPrefix}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 outline-none rounded-2xl py-3 pl-8 pr-2 text-xs font-extrabold text-slate-900 transition-all cursor-pointer appearance-none"
                        id="reg-country-select"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.prefix}>
                            {c.prefix} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Champ numéro */}
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel" 
                        placeholder="Ex: 07080910" 
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 outline-none rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-slate-900 transition-all"
                        id="reg-phone-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Mot de passe */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type={showRegPassword ? "text" : "password"} 
                      placeholder="Créez votre mot de passe"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 outline-none rounded-2xl py-3 pl-10 pr-11 text-sm font-bold text-slate-900 transition-all"
                      id="reg-password-input"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title={showRegPassword ? "Masquer" : "Afficher"}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 3. Confirmer le mot de passe */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Répétez votre mot de passe" 
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 outline-none rounded-2xl py-3 pl-10 pr-11 text-sm font-bold text-slate-900 transition-all"
                      id="reg-confirm-password-input"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title={showConfirmPassword ? "Masquer" : "Afficher"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Automatic password match indicator */}
                  {regConfirmPassword.length > 0 && (
                    <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] font-bold">
                      {regPassword === regConfirmPassword ? (
                        <span className="text-emerald-600 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Les mots de passe correspondent</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 flex items-center space-x-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Les mots de passe ne correspondent pas</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Code parrain */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Code parrain <span className="text-slate-400 font-normal">(Optionnel)</span>
                    </label>
                    {isReferralFromUrl && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        Code d'invitation appliqué
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Code d'invitation (Ex: INV123456)" 
                      value={regReferrer}
                      onChange={(e) => setRegReferrer(e.target.value)}
                      className="w-full bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-amber-500 outline-none rounded-2xl py-3 pl-10 pr-4 text-sm font-mono font-bold text-slate-900 uppercase transition-all"
                      id="reg-referrer-input"
                    />
                  </div>
                </div>

                {/* Main Submit Button */}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 active:scale-[0.99] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm cursor-pointer transition-all flex items-center justify-center space-x-2 mt-2"
                  id="reg-submit-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>S'INSCRIRE</span>
                  )}
                </button>
              </form>

              {/* Footer Switcher */}
              <div className="text-center pt-3 border-t border-slate-200/80">
                <span className="text-xs text-slate-500 font-medium">Vous avez déjà un compte ? </span>
                <button 
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-amber-600 font-black hover:underline cursor-pointer"
                  id="switch-to-login-btn"
                >
                  Se connecter
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

