/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Headphones,
  ChevronDown,
  Globe,
  Lock,
  Phone,
  Gift,
  HelpCircle,
  ShieldCheck,
  Check
} from 'lucide-react';
import { DEFAULT_COUNTRY } from '../constants/countries';
import { normalizePhoneNumber } from '../lib/phoneUtils';
import { 
  safeGetLocalStorage, 
  safeSetLocalStorage 
} from '../lib/storage';

interface AuthPagesProps {
  initialMode: 'login' | 'register';
  onBackToLanding?: () => void;
  onSuccess: () => void;
  authActions: {
    login: (phone: string, word: string, country?: string) => Promise<{ success: boolean; error?: string }>;
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

export const AuthPages: React.FC<AuthPagesProps> = ({ 
  initialMode, 
  onSuccess,
  authActions 
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Pays exclusif : Togo (+228)
  const selectedCountry = DEFAULT_COUNTRY;

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State (Clean White UI matching Gold Speed design system)
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regReferrer, setRegReferrer] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Visibility Toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Language Dropdown (Optional visual touch)
  const [selectedLang, setSelectedLang] = useState('Français');
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Forgot Account Number & Password State
  const [recoveryType, setRecoveryType] = useState<'password' | 'account_number' | 'both'>('both');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotContact, setForgotContact] = useState('');
  const [forgotNote, setForgotNote] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Detect referral code from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refFromUrl = 
      params.get('ref') || 
      params.get('code') || 
      params.get('parrain') || 
      params.get('refCode') || 
      params.get('referrer') || 
      params.get('inviter') ||
      params.get('invite') ||
      params.get('invitation') ||
      params.get('referral') ||
      safeGetLocalStorage('aurainvest_ref_code');
    
    if (refFromUrl) {
      setRegReferrer(refFromUrl);
      setMode('register');
      if (!safeGetLocalStorage('aurainvest_ref_code')) {
        safeSetLocalStorage('aurainvest_ref_code', refFromUrl);
      }
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim() || !loginPassword) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const fullPhone = normalizePhoneNumber(loginPhone, selectedCountry.prefix);
      const res = await authActions.login(fullPhone, loginPassword, selectedCountry.name);
      
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.error || "Informations de connexion incorrectes.");
      }
    } catch (err) {
      setErrorMsg("Erreur de connexion. Veuillez réessayer.");
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
      setErrorMsg("Veuillez entrer votre mot de passe de connexion.");
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg("Le mot de passe doit comporter au moins 4 caractères.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg("Veuillez accepter l'accord d'enregistrement et de confidentialité.");
      return;
    }

    setLoading(true);

    try {
      const fullPhone = normalizePhoneNumber(cleanPhone, selectedCountry.prefix);
      const rawDigits = fullPhone.replace(/\D/g, '');
      const defaultName = `Membre ${rawDigits.slice(-4)}`;

      const res = await authActions.register({
        name: defaultName,
        phone: fullPhone,
        whatsapp: fullPhone,
        country: selectedCountry.name,
        word: regPassword,
        referrerCode: regReferrer.trim()
      });

      if (res.success) {
        setSuccessMsg("Inscription réussie ! Connexion automatique en cours...");
        setTimeout(() => {
          onSuccess();
        }, 300);
      } else {
        let err = res.error || "Une erreur est survenue lors de l'inscription.";
        if (
          err.includes('users_phone_key') || 
          err.includes('unique constraint') || 
          err.includes('duplicate key') || 
          err.includes('23505') ||
          err.toLowerCase().includes('déjà un compte') ||
          err.toLowerCase().includes('already exists')
        ) {
          err = "Ce numéro possède déjà un compte, veuillez vous connecter.";
        }
        setErrorMsg(err);
      }
    } catch (err: any) {
      let msg = err?.message || '';
      if (
        msg.includes('users_phone_key') || 
        msg.includes('unique constraint') || 
        msg.includes('duplicate key') || 
        msg.includes('23505')
      ) {
        setErrorMsg("Ce numéro possède déjà un compte, veuillez vous connecter.");
      } else {
        setErrorMsg("Échec de l'inscription. Veuillez vérifier vos informations.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setForgotSuccess(null);

    if (recoveryType === 'password' && !forgotPhone.trim()) {
      setErrorMsg("Veuillez entrer votre numéro de téléphone.");
      return;
    }
    if (recoveryType !== 'password' && !forgotIdentifier.trim() && !forgotContact.trim()) {
      setErrorMsg("Veuillez entrer votre nom, code d'invitation ou numéro de contact.");
      return;
    }

    setLoading(true);
    try {
      const normalizedMainPhone = forgotPhone.trim()
        ? normalizePhoneNumber(forgotPhone.trim(), selectedCountry.prefix)
        : '';
      const normalizedContactPhone = forgotContact.trim()
        ? normalizePhoneNumber(forgotContact.trim(), selectedCountry.prefix)
        : '';

      const res = await fetch('/api/auth/recovery-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryType,
          phone: normalizedMainPhone,
          country: selectedCountry.name,
          identifier: forgotIdentifier.trim(),
          contactPhone: normalizedContactPhone,
          note: forgotNote.trim()
        })
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setForgotSuccess(
          data.message ||
            "Demande transmise au service client. Un administrateur va vérifier vos informations et rétablir votre accès."
        );
        setForgotNote('');
      } else {
        setErrorMsg(data?.error || "Impossible d'envoyer la demande pour le moment. Veuillez réessayer.");
      }
    } catch {
      setErrorMsg("Erreur de connexion au serveur. Vous pouvez aussi contacter notre support WhatsApp directement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans select-none antialiased relative text-gray-800">
      
      {/* TOP HEADER: White background, Top Bar with Gold Speed Logo & Language / Help */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          
          {/* Left: Mode toggle or Back */}
          <div className="flex items-center space-x-2">
            {mode !== 'register' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="p-1.5 -ml-1 text-gray-600 hover:text-[#0076CE] rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span>Portail Sécurisé</span>
              </div>
            )}
          </div>

          {/* Centered Brand: Gold Speed */}
          <div className="flex items-center justify-center space-x-1.5">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-500 font-sans">
              GOLD
            </span>
            <span className="text-sm sm:text-base font-extrabold tracking-wide text-[#0076CE] uppercase">
              SPEED
            </span>
          </div>

          {/* Right: Language Selector & Support Link */}
          <div className="relative flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center space-x-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 px-2 py-1 rounded-md transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-gray-500" />
              <span>{selectedLang}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-9 w-32 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-40 animate-fadeIn text-xs">
                {['Français', 'English', 'Español'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 transition-colors ${selectedLang === lang ? 'text-[#0076CE] font-bold' : 'text-gray-700'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col justify-start items-center px-4 py-6 sm:py-8 max-w-md w-full mx-auto">
        
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200/90 p-5 sm:p-7">
          
          <AnimatePresence mode="wait">
            
            {/* ========================================================= */}
            {/* 1. PAGE D'INSCRIPTION GOLD SPEED                          */}
            {/* ========================================================= */}
            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {/* Clean Header: Enregistrer un compte */}
                <div className="pb-1 text-center">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Enregistrer un compte
                  </h1>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Rejoignez la plateforme officielle Gold Speed
                  </p>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex flex-col space-y-1.5 text-xs animate-fadeIn">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="font-semibold">{errorMsg}</span>
                    </div>
                    {errorMsg.toLowerCase().includes('déjà un compte') && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setLoginPhone(regPhone);
                          setErrorMsg(null);
                        }}
                        className="self-start text-[11px] font-bold text-white bg-[#0076CE] hover:bg-[#005da3] px-3 py-1 rounded-lg transition-colors cursor-pointer ml-6"
                      >
                        → Se connecter maintenant
                      </button>
                    )}
                  </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center space-x-2 text-xs font-bold animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  
                  {/* Champ 1: Veuillez entrer votre numéro de téléphone */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Veuillez entrer votre numéro de téléphone
                    </label>
                    <div className="flex items-center bg-gray-50/80 rounded-xl px-3 py-2.5 border border-gray-300 focus-within:border-[#0076CE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0076CE]/15 transition-all">
                      
                      {/* Indicatif fixe Togo (+228) */}
                      <div className="flex items-center space-x-1.5 shrink-0 pr-2.5 border-r border-gray-300 mr-2.5 text-gray-800 font-bold text-xs sm:text-sm">
                        <span>{selectedCountry.flag}</span>
                        <span>{selectedCountry.prefix}</span>
                      </div>

                      {/* Saisie numéro */}
                      <input
                        type="tel"
                        placeholder="Veuillez entrer votre numéro de téléphone"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400"
                        id="reg-phone-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Champ 2: Veuillez entrer le mot de passe de connexion */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Veuillez entrer le mot de passe de connexion
                    </label>
                    <div className="flex items-center bg-gray-50/80 rounded-xl px-3 py-2.5 border border-gray-300 focus-within:border-[#0076CE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0076CE]/15 transition-all relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        placeholder="Veuillez entrer le mot de passe de connexion"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 pr-8"
                        id="reg-password-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer transition-colors"
                        title={showRegPassword ? "Masquer" : "Afficher"}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Champ 3: Veuillez confirmer le mot de passe de connexion */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Veuillez confirmer le mot de passe de connexion
                    </label>
                    <div className="flex items-center bg-gray-50/80 rounded-xl px-3 py-2.5 border border-gray-300 focus-within:border-[#0076CE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0076CE]/15 transition-all relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Veuillez confirmer le mot de passe de connexion"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 pr-8"
                        id="reg-confirm-password-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer transition-colors"
                        title={showConfirmPassword ? "Masquer" : "Afficher"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Indicateur de concordance */}
                    {regConfirmPassword.length > 0 && (
                      <div className="pt-0.5 text-[11px] font-medium">
                        {regPassword === regConfirmPassword ? (
                          <span className="text-emerald-600 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Les mots de passe correspondent</span>
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center space-x-1 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Les mots de passe ne correspondent pas</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Champ 4: Veuillez entrer le code d'invitation */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Veuillez entrer le code d'invitation
                    </label>
                    <div className="flex items-center bg-gray-50/80 rounded-xl px-3 py-2.5 border border-gray-300 focus-within:border-[#0076CE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0076CE]/15 transition-all">
                      <input
                        type="text"
                        placeholder="Veuillez entrer le code d'invitation"
                        value={regReferrer}
                        onChange={(e) => setRegReferrer(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400"
                        id="reg-referrer-input"
                      />
                    </div>
                  </div>

                  {/* Accord d'enregistrement et de confidentialité */}
                  <div className="pt-2 flex items-start space-x-2.5 select-none">
                    <button
                      type="button"
                      onClick={() => setAgreedToTerms(!agreedToTerms)}
                      className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                        agreedToTerms 
                          ? 'bg-[#0076CE] border-[#0076CE] text-white shadow-xs' 
                          : 'bg-white border-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {agreedToTerms && <Check className="w-3 h-3 stroke-[3px]" />}
                    </button>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">
                      J'ai lu et j'accepte l'
                      <span className="text-[#0076CE] font-semibold cursor-pointer hover:underline">
                        accord d'enregistrement et de confidentialité
                      </span>
                    </p>
                  </div>

                  {/* Bouton d'action principal Bleu Gold Speed: Enregistrer */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#0076CE] hover:bg-[#005da3] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center justify-center space-x-2 mt-4"
                    id="reg-submit-btn"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Enregistrer</span>
                    )}
                  </button>
                </form>

                {/* Lien bascule: Vous avez un compte ? Connectez-vous */}
                <div className="text-center pt-3 border-t border-gray-100 mt-4">
                  <span className="text-xs text-gray-500 font-medium">Vous avez un compte ? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-bold text-[#0076CE] hover:text-[#005da3] hover:underline cursor-pointer transition-colors"
                    id="switch-to-login-btn"
                  >
                    Connectez-vous
                  </button>
                </div>

              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 2. PAGE DE CONNEXION (LOGIN)                              */}
            {/* ========================================================= */}
            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className="pb-1 text-center">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Connexion
                  </h1>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Accédez à votre compte officiel Gold Speed
                  </p>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center space-x-2 text-xs font-medium animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  
                  {/* Numéro de téléphone */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Veuillez entrer votre numéro de téléphone
                    </label>
                    <div className="flex items-center bg-gray-50/80 rounded-xl px-3 py-2.5 border border-gray-300 focus-within:border-[#0076CE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0076CE]/15 transition-all">
                      <div className="flex items-center space-x-1.5 shrink-0 pr-2.5 border-r border-gray-300 mr-2.5 text-gray-800 font-bold text-xs sm:text-sm">
                        <span>{selectedCountry.flag}</span>
                        <span>{selectedCountry.prefix}</span>
                      </div>

                      <input
                        type="tel"
                        placeholder="Veuillez entrer votre numéro de téléphone"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400"
                        id="login-phone-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-gray-700">
                        Veuillez entrer le mot de passe de connexion
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMsg(null);
                          setForgotSuccess(null);
                        }}
                        className="text-[11px] font-semibold text-[#0076CE] hover:underline cursor-pointer text-right"
                      >
                        Numéro ou mot de passe oublié ?
                      </button>
                    </div>
                    <div className="flex items-center bg-gray-50/80 rounded-xl px-3 py-2.5 border border-gray-300 focus-within:border-[#0076CE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0076CE]/15 transition-all relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Veuillez entrer le mot de passe de connexion"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 pr-8"
                        id="login-password-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer transition-colors"
                        title={showLoginPassword ? "Masquer" : "Afficher"}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Bouton SE CONNECTER Gold Speed */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#0076CE] hover:bg-[#005da3] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center justify-center space-x-2 mt-4"
                    id="login-submit-btn"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>SE CONNECTER</span>
                    )}
                  </button>
                </form>

                {/* Lien bascule: Inscription */}
                <div className="text-center pt-3 border-t border-gray-100 mt-4">
                  <span className="text-xs text-gray-500 font-medium">Vous n'avez pas encore de compte ? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-bold text-[#0076CE] hover:text-[#005da3] hover:underline cursor-pointer transition-colors"
                    id="switch-to-register-btn"
                  >
                    Enregistrer un compte
                  </button>
                </div>

              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 3. MOT DE PASSE OUBLIÉ (FORGOT PASSWORD)                 */}
            {/* ========================================================= */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className="pb-1 text-center">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Récupération de compte
                  </h1>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Numéro de compte ou mot de passe oublié
                  </p>
                </div>

                {/* Recovery Type Switcher */}
                <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryType('both');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      recoveryType === 'both'
                        ? 'bg-white text-[#0076CE] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Les deux
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryType('account_number');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      recoveryType === 'account_number'
                        ? 'bg-white text-[#0076CE] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    N° de compte
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryType('password');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      recoveryType === 'password'
                        ? 'bg-white text-[#0076CE] shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Mot de passe
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center space-x-2 text-xs font-medium animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 leading-relaxed font-medium animate-fadeIn space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Demande enregistrée</span>
                    </div>
                    <p>{forgotSuccess}</p>
                    <a
                      href="https://whatsapp.com/channel/0029VbE6h2OKAwEdLgywe13M"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full py-2 px-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Contacter le support sur WhatsApp
                    </a>
                  </div>
                )}

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                  {recoveryType === 'password' ? (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        Numéro de compte (Téléphone)
                      </label>
                      <div className="flex items-center bg-gray-50/80 rounded-xl px-3 py-2.5 border border-gray-300 focus-within:border-[#0076CE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0076CE]/15 transition-all">
                        <div className="flex items-center space-x-1.5 shrink-0 pr-2.5 border-r border-gray-300 mr-2.5 text-gray-800 font-bold text-xs sm:text-sm">
                          <span>{selectedCountry.flag}</span>
                          <span>{selectedCountry.prefix}</span>
                        </div>

                        <input
                          type="tel"
                          placeholder="Numéro de téléphone du compte"
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value)}
                          className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400"
                          id="forgot-phone-input"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          Nom, code d&apos;invitation ou numéro de retrait
                        </label>
                        <div className="flex items-center bg-gray-50/80 rounded-xl px-3 py-2.5 border border-gray-300 focus-within:border-[#0076CE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0076CE]/15 transition-all">
                          <input
                            type="text"
                            placeholder="Ex: INV123456, Membre 3065 ou numéro de retrait"
                            value={forgotIdentifier}
                            onChange={(e) => setForgotIdentifier(e.target.value)}
                            className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400"
                            id="forgot-identifier-input"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          Numéro WhatsApp / téléphone pour vous répondre
                        </label>
                        <div className="flex items-center bg-gray-50/80 rounded-xl px-3 py-2.5 border border-gray-300 focus-within:border-[#0076CE] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0076CE]/15 transition-all">
                          <div className="flex items-center space-x-1.5 shrink-0 pr-2.5 border-r border-gray-300 mr-2.5 text-gray-800 font-bold text-xs sm:text-sm">
                            <span>{selectedCountry.flag}</span>
                            <span>{selectedCountry.prefix}</span>
                          </div>

                          <input
                            type="tel"
                            placeholder="Votre numéro de contact actuel"
                            value={forgotContact}
                            onChange={(e) => setForgotContact(e.target.value)}
                            className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400"
                            id="forgot-contact-input"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Précisions complémentaires (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: dernier dépôt effectué, réseau Mobile Money..."
                      value={forgotNote}
                      onChange={(e) => setForgotNote(e.target.value)}
                      className="w-full bg-gray-50/80 rounded-xl px-3 py-2.5 border border-gray-300 focus:border-[#0076CE] focus:bg-white outline-none text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 transition-all"
                      id="forgot-note-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#0076CE] hover:bg-[#005da3] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center justify-center space-x-2 mt-4"
                    id="forgot-submit-btn"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>ENVOYER LA DEMANDE</span>
                    )}
                  </button>
                </form>

                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setForgotSuccess(null);
                    }}
                    className="text-xs font-bold text-[#0076CE] hover:underline cursor-pointer flex items-center justify-center space-x-1 mx-auto transition-colors"
                    id="back-to-login-btn"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour à la connexion</span>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Footer Security Badges */}
        <div className="mt-6 flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-[#0076CE]" />
            <span className="font-semibold text-gray-600">Connexion chiffrée SSL 256-bit</span>
          </div>
          <p className="text-[11px] text-gray-400">
            © Gold Speed. Tous droits réservés.
          </p>
        </div>

      </main>

    </div>
  );
};
