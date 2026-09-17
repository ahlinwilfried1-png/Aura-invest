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

  // Country Code State (Exclusively Togo +228)
  const countryPrefix = "+228";
  const countryName = "Togo";

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

  const handleCountryChange = (_prefix: string) => {
    // Exclusively Togo (+228)
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
      const selectedCountryName = 'Togo';
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
      const selectedCountryName = 'Togo';

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
    <div className="min-h-screen bg-gradient-to-b from-[#1b062b] via-[#120422] to-[#0c0216] flex flex-col font-sans select-none antialiased relative overflow-hidden text-white">
      
      {/* Ambient glowing background accents */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Background AirPods Audio Product Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none transform scale-105 mix-blend-luminosity"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1200&auto=format&fit=crop&q=80')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1b062b]/85 via-[#120422]/80 to-[#0c0216]/95 pointer-events-none" />

      {/* HEADER SECTION (FEATURING AIRPODS BACKDROP) */}
      <div className="relative text-white pt-8 pb-14 px-5 shadow-md overflow-hidden min-h-[170px] flex flex-col justify-center">
        {/* AirPods Audio Atmosphere Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-100 transition-all duration-300 opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=1200&auto=format&fit=crop&q=80')` }}
        />
        {/* Rose-violet gradient overlay to ensure text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#160626] via-[#1b062b]/85 to-[#240b3c]/90" />
        
        {/* Top Header Bar: Logo & Centered Title */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          {/* Logo "AirPods" on Top Left */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-sm tracking-tight border border-pink-300/40 shadow-md shadow-pink-500/25">
              <Headphones className="w-5 h-5 text-white stroke-[2.5px]" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
              AirPods
            </span>
          </div>

          {/* Centered Title */}
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white text-center flex-1 pr-12">
            {mode === 'register' ? 'Inscription' : mode === 'login' ? 'Connexion' : 'Mot de passe oublié'}
          </h1>
        </div>

        {/* Header Subtitle text */}
        <p className="relative z-10 text-xs sm:text-sm font-medium text-pink-200/90 max-w-sm leading-relaxed tracking-wide">
          {mode === 'register' 
            ? 'Fournissez vos informations pour enregistrer votre compte'
            : mode === 'login'
            ? 'Connectez-vous à votre compte pour continuer'
            : 'Saisissez votre numéro de téléphone pour réinitialiser votre compte'}
        </p>
      </div>

      {/* FORM SECTION (ROSE-VIOLET ELEGANT CARD WITH ROUNDED TOP CORNERS) */}
      <div className="relative z-10 flex-1 bg-[#160626]/95 backdrop-blur-xl -mt-6 rounded-t-[32px] px-5 sm:px-8 pt-7 pb-10 shadow-2xl max-w-md w-full mx-auto flex flex-col justify-between border-t border-x border-pink-500/30 text-white">
        
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
                <div className="bg-pink-950/80 border border-pink-500/60 p-3.5 rounded-2xl flex flex-col space-y-2 text-xs text-pink-100 animate-fadeIn font-medium">
                  <div className="flex items-center space-x-2.5">
                    <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
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
                      className="self-start text-[11px] font-black text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-3 py-1 rounded-xl transition-colors cursor-pointer ml-6 shadow-sm border border-pink-300/30"
                    >
                      → Se connecter maintenant
                    </button>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-950/80 border border-emerald-500/60 p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs text-emerald-200 animate-fadeIn font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* 1. Téléphone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-pink-200 tracking-wide">
                    Téléphone
                  </label>
                  
                  <div className="flex items-center bg-[#250d3c]/90 rounded-2xl px-3.5 py-3 border border-pink-500/30 focus-within:border-pink-400 focus-within:bg-[#2e0f4a] focus-within:ring-2 focus-within:ring-pink-500/25 transition-all shadow-inner">
                    {/* Indicatif pays Togo */}
                    <div className="flex items-center space-x-1 pr-2.5 border-r border-pink-500/30 mr-2 shrink-0 select-none">
                      <span className="text-sm">🇹🇬</span>
                      <span className="text-xs font-black text-pink-100">+228</span>
                    </div>

                    {/* Champ de saisie numéro */}
                    <input
                      type="tel"
                      placeholder="Veuillez entrer le numéro de télép..."
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-white placeholder:text-pink-300/40"
                      id="reg-phone-input"
                      required
                    />
                  </div>
                </div>

                {/* 2. Mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-pink-200 tracking-wide">
                    Mot de passe
                  </label>

                  <div className="flex items-center bg-[#250d3c]/90 rounded-2xl px-3.5 py-3 border border-pink-500/30 focus-within:border-pink-400 focus-within:bg-[#2e0f4a] focus-within:ring-2 focus-within:ring-pink-500/25 transition-all relative shadow-inner">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Veuillez entrer le mot de passe"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-white placeholder:text-pink-300/40 pr-8"
                      id="reg-password-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 text-pink-300 hover:text-white p-1 cursor-pointer transition-colors"
                      title={showRegPassword ? "Masquer" : "Afficher"}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 3. Confirmer le mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-pink-200 tracking-wide">
                    Confirmer le mot de passe
                  </label>

                  <div className="flex items-center bg-[#250d3c]/90 rounded-2xl px-3.5 py-3 border border-pink-500/30 focus-within:border-pink-400 focus-within:bg-[#2e0f4a] focus-within:ring-2 focus-within:ring-pink-500/25 transition-all relative shadow-inner">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Veuillez confirmer le mot de passe"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-white placeholder:text-pink-300/40 pr-8"
                      id="reg-confirm-password-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 text-pink-300 hover:text-white p-1 cursor-pointer transition-colors"
                      title={showConfirmPassword ? "Masquer" : "Afficher"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dynamic Match Indicator */}
                  {regConfirmPassword.length > 0 && (
                    <div className="pt-0.5 text-[11px] font-medium">
                      {regPassword === regConfirmPassword ? (
                        <span className="text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Les mots de passe correspondent</span>
                        </span>
                      ) : (
                        <span className="text-pink-400 flex items-center space-x-1 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Les mots de passe ne correspondent pas</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Code d'invitation */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-pink-200 tracking-wide">
                    Code d'invitation
                  </label>

                  <div className="flex items-center bg-[#250d3c]/90 rounded-2xl px-3.5 py-3 border border-pink-500/30 focus-within:border-pink-400 focus-within:bg-[#2e0f4a] focus-within:ring-2 focus-within:ring-pink-500/25 transition-all shadow-inner">
                    <input
                      type="text"
                      placeholder="97194059"
                      value={regReferrer}
                      onChange={(e) => setRegReferrer(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-white placeholder:text-pink-300/40"
                      id="reg-referrer-input"
                    />
                  </div>
                </div>

                {/* Bouton Rose-Violet : S'inscrire */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 hover:from-pink-400 hover:via-fuchsia-500 hover:to-purple-500 active:scale-[0.99] text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-pink-600/30 cursor-pointer transition-all flex items-center justify-center space-x-2 border border-pink-300/35 mt-4"
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
                <span className="text-xs text-pink-200/80">Vous avez déjà un compte ? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-black text-pink-300 hover:text-white underline underline-offset-4 cursor-pointer transition-colors"
                  id="switch-to-login-btn"
                >
                  Se connecter
                </button>
              </div>

              {/* Logo AirPods en bas de la page d'inscription */}
              <div className="pt-5 border-t border-pink-500/20 mt-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-[#240b3c]/80 rounded-2xl border border-pink-500/30 flex items-center justify-center space-x-3 w-full shadow-md">
                  {/* AirPods Headphones SVG Logo Icon */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm border border-pink-300/40">
                    <Headphones className="w-6 h-6 stroke-[2.5px] text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base font-black tracking-tight text-white">AirPods</span>
                      <span className="text-[10px] font-black text-pink-100 bg-pink-500/40 px-1.5 py-0.5 rounded font-mono border border-pink-400/40">Official</span>
                    </div>
                    <p className="text-[10px] font-bold text-pink-200/80 uppercase tracking-wider truncate">
                      AirPods Official • Audio Premium & FinTech
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-pink-300/60 font-medium">
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
                <div className="bg-pink-950/80 border border-pink-500/60 p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs text-pink-100 animate-fadeIn font-medium">
                  <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* 1. Téléphone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-pink-200 tracking-wide">
                    Téléphone
                  </label>

                  <div className="flex items-center bg-[#250d3c]/90 rounded-2xl px-3.5 py-3 border border-pink-500/30 focus-within:border-pink-400 focus-within:bg-[#2e0f4a] focus-within:ring-2 focus-within:ring-pink-500/25 transition-all shadow-inner">
                    {/* Indicatif pays Togo */}
                    <div className="flex items-center space-x-1 pr-2.5 border-r border-pink-500/30 mr-2 shrink-0 select-none">
                      <span className="text-sm">🇹🇬</span>
                      <span className="text-xs font-black text-pink-100">+228</span>
                    </div>

                    {/* Champ de saisie numéro */}
                    <input
                      type="tel"
                      placeholder="Veuillez entrer le numéro de télép..."
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-white placeholder:text-pink-300/40"
                      id="login-phone-input"
                      required
                    />
                  </div>
                </div>

                {/* 2. Mot de passe */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-pink-200 tracking-wide">
                    Mot de passe
                  </label>

                  <div className="flex items-center bg-[#250d3c]/90 rounded-2xl px-3.5 py-3 border border-pink-500/30 focus-within:border-pink-400 focus-within:bg-[#2e0f4a] focus-within:ring-2 focus-within:ring-pink-500/25 transition-all relative shadow-inner">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Veuillez entrer le mot de passe"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-white placeholder:text-pink-300/40 pr-8"
                      id="login-password-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 text-pink-300 hover:text-white p-1 cursor-pointer transition-colors"
                      title={showLoginPassword ? "Masquer" : "Afficher"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Bouton Rose-Violet : SE CONNECTER */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 hover:from-pink-400 hover:via-fuchsia-500 hover:to-purple-500 active:scale-[0.99] text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-pink-600/30 cursor-pointer transition-all flex items-center justify-center space-x-2 border border-pink-300/35 mt-2"
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
                <span className="text-xs text-pink-200/80">Vous n'avez pas encore de compte ? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-black text-pink-300 hover:text-white underline underline-offset-4 cursor-pointer transition-colors"
                  id="switch-to-register-btn"
                >
                  S'inscrire
                </button>
              </div>

              {/* Logo AirPods en bas de la page de connexion */}
              <div className="pt-5 border-t border-pink-500/20 mt-5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-[#240b3c]/80 rounded-2xl border border-pink-500/30 flex items-center justify-center space-x-3 w-full shadow-md">
                  {/* AirPods Headphones SVG Logo Icon */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm border border-pink-300/40">
                    <Headphones className="w-6 h-6 stroke-[2.5px] text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base font-black tracking-tight text-white">AirPods</span>
                      <span className="text-[10px] font-black text-pink-100 bg-pink-500/40 px-1.5 py-0.5 rounded font-mono border border-pink-400/40">Official</span>
                    </div>
                    <p className="text-[10px] font-bold text-pink-200/80 uppercase tracking-wider truncate">
                      AirPods Official • Audio Premium & FinTech
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-pink-300/60 font-medium">
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
                <div className="bg-pink-950/80 border border-pink-500/60 p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs text-pink-100 animate-fadeIn font-medium">
                  <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="bg-emerald-950/80 border border-emerald-500/60 p-4 rounded-2xl text-xs text-emerald-200 leading-relaxed font-medium animate-fadeIn space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Demande enregistrée</span>
                  </div>
                  <p>{forgotSuccess}</p>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-pink-200 tracking-wide">
                    Numéro de Téléphone
                  </label>

                  <div className="flex items-center bg-[#250d3c]/90 rounded-2xl px-3.5 py-3 border border-pink-500/30 focus-within:border-pink-400 focus-within:bg-[#2e0f4a] focus-within:ring-2 focus-within:ring-pink-500/25 transition-all shadow-inner">
                    {/* Indicatif pays Togo */}
                    <div className="flex items-center space-x-1 pr-2.5 border-r border-pink-500/30 mr-2 shrink-0 select-none">
                      <span className="text-sm">🇹🇬</span>
                      <span className="text-xs font-black text-pink-100">+228</span>
                    </div>

                    <input
                      type="tel"
                      placeholder="Veuillez entrer le numéro de télép..."
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs sm:text-sm font-semibold text-white placeholder:text-pink-300/40"
                      id="forgot-phone-input"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 hover:from-pink-400 hover:via-fuchsia-500 hover:to-purple-500 active:scale-[0.99] text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-pink-600/30 cursor-pointer transition-all flex items-center justify-center space-x-2 border border-pink-300/35 mt-2"
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
                  className="text-xs font-black text-pink-300 hover:text-white underline underline-offset-4 cursor-pointer flex items-center justify-center space-x-1 mx-auto transition-colors"
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
