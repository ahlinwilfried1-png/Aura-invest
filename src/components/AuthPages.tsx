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
  ChevronDown,
  ArrowLeft,
  Headphones
} from 'lucide-react';
import { ALLOWED_COUNTRIES } from '../constants/countries';
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

const COUNTRIES = ALLOWED_COUNTRIES.map(c => ({
  name: c.name,
  code: c.code,
  prefix: c.prefix,
  flag: c.flag
}));

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

  // Country Code State (Default +228 Togo)
  const [countryPrefix, setCountryPrefix] = useState("+228");
  const [countryName, setCountryName] = useState("Togo");

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regReferrer, setRegReferrer] = useState('');
  const [isReferralFromUrl, setIsReferralFromUrl] = useState(false);

  // Visibility Toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot Password State
  const [forgotPhone, setForgotPhone] = useState('');
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
      setIsReferralFromUrl(true);
      setMode('register');
      if (!safeGetLocalStorage('aurainvest_ref_code')) {
        safeSetLocalStorage('aurainvest_ref_code', refFromUrl);
      }
    }
  }, []);

  const handleCountryChange = (prefix: string) => {
    setCountryPrefix(prefix);
    const found = COUNTRIES.find(c => c.prefix === prefix);
    if (found) {
      setCountryName(found.name);
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
      const fullPhone = normalizePhoneNumber(loginPhone, countryPrefix);
      const selectedCountryName = countryName || (countryPrefix === '+237' ? 'Cameroun' : 'Togo');
      const res = await authActions.login(fullPhone, loginPassword, selectedCountryName);

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
      setErrorMsg("Veuillez entrer votre mot de passe.");
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

    setLoading(true);
    try {
      const fullPhone = normalizePhoneNumber(cleanPhone, countryPrefix);
      const rawDigits = fullPhone.replace(/\D/g, '');
      const defaultName = `Membre ${rawDigits.slice(-4)}`;
      const selectedCountryName = countryName || (countryPrefix === '+237' ? 'Cameroun' : 'Togo');

      const res = await authActions.register({
        name: defaultName,
        phone: fullPhone,
        whatsapp: fullPhone,
        country: selectedCountryName,
        word: regPassword,
        referrerCode: regReferrer.trim()
      });

      if (res.success) {
        setSuccessMsg("Inscription réussie ! Redirection immédiate...");
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

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPhone.trim()) {
      setErrorMsg("Veuillez entrer votre numéro de téléphone.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotSuccess("Instructions de réinitialisation transmises. Un agent du service client va traiter votre demande.");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans select-none antialiased relative overflow-hidden">
      
      {/* Background AirPods Audio Product Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none transform scale-105"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1200&auto=format&fit=crop&q=80')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/75 to-slate-900/95 pointer-events-none" />

      {/* HEADER SECTION (FEATURING AIRPODS BACKDROP) */}
      <div className="relative text-white pt-8 pb-14 px-5 shadow-md overflow-hidden min-h-[170px] flex flex-col justify-center">
        {/* AirPods Audio Atmosphere Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-100 transition-all duration-300 opacity-80"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=1200&auto=format&fit=crop&q=80')` }}
        />
        {/* Subtle dark gradient overlay to ensure text contrast while keeping the image clear */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-900/60" />
        
        {/* Top Header Bar: Logo & Centered Title */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          {/* Logo "AirPods" on Top Left */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/30 backdrop-blur-xs flex items-center justify-center text-amber-300 font-black text-sm tracking-tight border border-amber-400/40 shadow-xs">
              <Headphones className="w-5 h-5 text-amber-300 stroke-[2.5px]" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white drop-shadow-xs">
              AirPods
            </span>
          </div>

          {/* Centered Title */}
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white text-center flex-1 pr-12">
            {mode === 'register' ? 'Inscription' : mode === 'login' ? 'Connexion' : 'Mot de passe oublié'}
          </h1>
        </div>

        {/* Header Subtitle text */}
        <p className="relative z-10 text-xs sm:text-sm font-medium text-emerald-100 max-w-sm leading-relaxed tracking-wide">
          {mode === 'register' 
            ? 'Fournissez vos informations pour enregistrer votre compte'
            : mode === 'login'
            ? 'Connectez-vous à votre compte pour continuer'
            : 'Saisissez votre numéro de téléphone pour réinitialiser votre compte'}
        </p>
      </div>

      {/* FORM SECTION (ELEGANT WHITE CARD WITH ROUNDED TOP CORNERS) */}
      <div className="relative z-10 flex-1 bg-white -mt-6 rounded-t-[32px] px-5 sm:px-8 pt-7 pb-10 shadow-2xl max-w-md w-full mx-auto flex flex-col justify-between border-t border-emerald-100">
        
        <AnimatePresence mode="wait">
          {/* ========================================================= */}
          {/* 1. PAGE D'INSCRIPTION (REGISTER)                          */}
          {/* ========================================================= */}
          {mode === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Alert Messages */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex flex-col space-y-2 text-xs text-red-700 animate-fadeIn font-medium">
                  <div className="flex items-center space-x-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  {errorMsg.toLowerCase().includes('déjà un compte') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setLoginPhone(regPhone);
                        setErrorMsg(null);
                      }}
                      className="self-start text-[11px] font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-xl transition-colors cursor-pointer ml-6"
                    >
                      → Se connecter maintenant
                    </button>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs text-emerald-800 animate-fadeIn font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* 1. Téléphone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Téléphone
                  </label>
                  
                  <div className="flex items-center bg-[#f4f5f8] rounded-2xl px-3.5 py-3 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
                    {/* Indicatif pays selector */}
                    <div className="relative flex items-center pr-2 border-r border-slate-200/80 mr-2 shrink-0">
                      <select
                        value={countryPrefix}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none pr-4 cursor-pointer appearance-none"
                        id="reg-country-prefix"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.prefix}>
                            {c.flag} {c.prefix} ({c.name})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                    </div>

                    {/* Champ de saisie numéro */}
                    <input
                      type="tel"
                      placeholder="Veuillez entrer le numéro de télép..."
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400"
                      id="reg-phone-input"
                      required
                    />
                  </div>
                </div>

                {/* 2. Mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Mot de passe
                  </label>

                  <div className="flex items-center bg-[#f4f5f8] rounded-2xl px-3.5 py-3 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Veuillez entrer le mot de passe"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 pr-8"
                      id="reg-password-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showRegPassword ? "Masquer" : "Afficher"}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 3. Confirmer le mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Mot de passe
                  </label>

                  <div className="flex items-center bg-[#f4f5f8] rounded-2xl px-3.5 py-3 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Veuillez entrer le mot de passe"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 pr-8"
                      id="reg-confirm-password-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showConfirmPassword ? "Masquer" : "Afficher"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dynamic Match Indicator */}
                  {regConfirmPassword.length > 0 && (
                    <div className="pt-0.5 text-[11px] font-medium">
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

                {/* 4. Code d'invitation */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Code d'invitation
                  </label>

                  <div className="flex items-center bg-[#f4f5f8] rounded-2xl px-3.5 py-3 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
                    <input
                      type="text"
                      placeholder="97194059"
                      value={regReferrer}
                      onChange={(e) => setRegReferrer(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400"
                      id="reg-referrer-input"
                    />
                  </div>
                </div>

                {/* Grand Bouton Vert: S'inscrire */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#046A38] hover:bg-[#03542c] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-sm cursor-pointer transition-all flex items-center justify-center space-x-2 mt-4"
                  id="reg-submit-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>S'inscrire</span>
                  )}
                </button>
              </form>

              {/* Link Se connecter */}
              <div className="text-center pt-2">
                <span className="text-xs text-slate-600">Vous avez déjà un compte ? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-[#046A38] hover:underline cursor-pointer"
                  id="switch-to-login-btn"
                >
                  Se connecter
                </button>
              </div>

              {/* Logo AirPods en bas de la page d'inscription */}
              <div className="pt-5 border-t border-slate-100 mt-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 flex items-center justify-center space-x-3 w-full shadow-2xs">
                  {/* AirPods Headphones SVG Logo Icon */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 flex items-center justify-center shrink-0 shadow-xs border border-amber-400/40">
                    <Headphones className="w-6 h-6 stroke-[2.5px] text-slate-950" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base font-black tracking-tight text-slate-900">AirPods</span>
                      <span className="text-[10px] font-black text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded font-mono">Official</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                      AirPods Official • Audio Premium & FinTech
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  © AirPods — Plateforme Officielle Certifiée
                </span>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 2. PAGE DE CONNEXION (LOGIN)                              */}
          {/* ========================================================= */}
          {mode === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Alert Messages */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs text-red-700 animate-fadeIn font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* 1. Téléphone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Téléphone
                  </label>

                  <div className="flex items-center bg-[#f4f5f8] rounded-2xl px-3.5 py-3 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
                    {/* Indicatif pays selector */}
                    <div className="relative flex items-center pr-2 border-r border-slate-200/80 mr-2 shrink-0">
                      <select
                        value={countryPrefix}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none pr-4 cursor-pointer appearance-none"
                        id="login-country-prefix"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.prefix}>
                            {c.flag} {c.prefix} ({c.name})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                    </div>

                    {/* Champ de saisie numéro */}
                    <input
                      type="tel"
                      placeholder="Veuillez entrer le numéro de télép..."
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400"
                      id="login-phone-input"
                      required
                    />
                  </div>
                </div>

                {/* 2. Mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Mot de passe
                  </label>

                  <div className="flex items-center bg-[#f4f5f8] rounded-2xl px-3.5 py-3 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Veuillez entrer le mot de passe"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 pr-8"
                      id="login-password-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showLoginPassword ? "Masquer" : "Afficher"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>



                {/* Grand Bouton Vert: SE CONNECTER */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#046A38] hover:bg-[#03542c] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-sm cursor-pointer transition-all flex items-center justify-center space-x-2 mt-2"
                  id="login-submit-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>SE CONNECTER</span>
                  )}
                </button>
              </form>

              {/* Link S'inscrire */}
              <div className="text-center pt-2">
                <span className="text-xs text-slate-600">Vous n'avez pas encore de compte ? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-[#046A38] hover:underline cursor-pointer"
                  id="switch-to-register-btn"
                >
                  S'inscrire
                </button>
              </div>

              {/* Logo AirPods en bas de la page de connexion */}
              <div className="pt-5 border-t border-slate-100 mt-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 flex items-center justify-center space-x-3 w-full shadow-2xs">
                  {/* AirPods Headphones SVG Logo Icon */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 flex items-center justify-center shrink-0 shadow-xs border border-amber-400/40">
                    <Headphones className="w-6 h-6 stroke-[2.5px] text-slate-950" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base font-black tracking-tight text-slate-900">AirPods</span>
                      <span className="text-[10px] font-black text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded font-mono">Official</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                      AirPods Official • Audio Premium & FinTech
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  © AirPods — Plateforme Officielle Certifiée
                </span>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 3. MOT DE PASSE OUBLIÉ (FORGOT PASSWORD)                 */}
          {/* ========================================================= */}
          {mode === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Alert Messages */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs text-red-700 animate-fadeIn font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 leading-relaxed font-medium animate-fadeIn space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Demande enregistrée</span>
                  </div>
                  <p>{forgotSuccess}</p>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Numéro de Téléphone
                  </label>

                  <div className="flex items-center bg-[#f4f5f8] rounded-2xl px-3.5 py-3 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
                    <div className="relative flex items-center pr-2 border-r border-slate-200/80 mr-2 shrink-0">
                      <select
                        value={countryPrefix}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none pr-4 cursor-pointer appearance-none"
                        id="forgot-country-prefix"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.prefix}>
                            {c.flag} {c.prefix} ({c.name})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                    </div>

                    <input
                      type="tel"
                      placeholder="Veuillez entrer le numéro de télép..."
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400"
                      id="forgot-phone-input"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#046A38] hover:bg-[#03542c] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-sm cursor-pointer transition-all flex items-center justify-center space-x-2 mt-2"
                  id="forgot-submit-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>ENVOYER LA DEMANDE</span>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setForgotSuccess(null);
                  }}
                  className="text-xs font-bold text-[#046A38] hover:underline cursor-pointer flex items-center justify-center space-x-1 mx-auto"
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
    </div>
  );
};
