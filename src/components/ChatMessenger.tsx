/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  MessageCircle, 
  CheckCheck, 
  Zap, 
  ShieldCheck, 
  HelpCircle,
  TrendingUp,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { User, SupportTicket } from '../types';

interface ChatMessengerProps {
  currentUser: User;
  tickets: SupportTicket[];
  createSupportTicket: (subject: string, message: string, imageUrl?: string) => Promise<{ success: boolean; error?: string }> | void;
  replyToTicket?: (ticketId: string, reply: string) => Promise<{ success: boolean; error?: string }> | void;
  onShowToast?: (status: 'success' | 'err', text: string) => void;
}

export const ChatMessenger: React.FC<ChatMessengerProps> = ({
  currentUser,
  tickets,
  createSupportTicket,
  onShowToast
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [autoReplying, setAutoReplying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter tickets belonging to current user and sort chronologically (oldest to newest)
  const cleanCurrentPhone = (currentUser.phone || '').replace(/\s+/g, '').replace(/[^\d+]/g, '');
  const cleanCurrentPhoneNoPrefix = cleanCurrentPhone.replace(/^\+?(228|237)/, '');

  const userTickets = [...tickets]
    .filter(t => {
      if (!t) return false;
      if (t.userId === currentUser.id) return true;
      if (currentUser.id && t.userId && (t.userId.includes(currentUser.id) || currentUser.id.includes(t.userId))) return true;
      if (currentUser.name && t.userName && t.userName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) return true;
      if (t.userPhone && t.userPhone !== 'Non renseigné') {
        const cleanTktPhone = t.userPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
        const cleanTktPhoneNoPrefix = cleanTktPhone.replace(/^\+?(228|237)/, '');
        if (cleanCurrentPhone && cleanTktPhone && (cleanCurrentPhone === cleanTktPhone || cleanCurrentPhone.endsWith(cleanTktPhone) || cleanTktPhone.endsWith(cleanCurrentPhone))) {
          return true;
        }
        if (cleanCurrentPhoneNoPrefix && cleanTktPhoneNoPrefix && (cleanCurrentPhoneNoPrefix === cleanTktPhoneNoPrefix || cleanCurrentPhoneNoPrefix.endsWith(cleanTktPhoneNoPrefix) || cleanTktPhoneNoPrefix.endsWith(cleanCurrentPhoneNoPrefix))) {
          return true;
        }
      }
      return false;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Auto-scroll to bottom of chat area
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [userTickets, autoReplying]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      if (onShowToast) onShowToast('err', "L'image est trop lourde (max 3Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      if (onShowToast) onShowToast('success', "Image jointe avec succès !");
    };
    reader.readAsDataURL(file);
  };

  // Handle message submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || isSending) return;

    const messageToSend = inputText.trim() || (selectedImage ? "Image transmise" : "");
    const imageToSend = selectedImage || undefined;

    setIsSending(true);

    try {
      const res = await createSupportTicket("Message Chat Support", messageToSend, imageToSend);

      if (res && res.success === false) {
        if (onShowToast) onShowToast('err', res.error || "Erreur lors de l'enregistrement du message sur le serveur.");
        setIsSending(false);
        return;
      }

      // Reset local inputs ONLY after confirmed success
      setInputText('');
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onShowToast) onShowToast('success', "Message envoyé avec succès à l'administration !");
    } catch (err: any) {
      if (onShowToast) onShowToast('err', err?.message || "Erreur réseau lors de l'envoi.");
    } finally {
      setIsSending(false);
    }
  };

  // Format timestamp helper
  const formatTime = (isoString?: string) => {
    if (!isoString) return '09:34';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '09:34';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] sm:h-[calc(100vh-120px)] max-w-3xl mx-auto bg-[#0d0417] text-white relative font-sans">
      
      {/* 1. CHAT HEADER / SUPPORT BAR */}
      <div className="sticky top-0 bg-[#120422]/95 backdrop-blur-md px-4 py-3 border-b border-pink-500/20 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-black shadow-md border border-pink-300/30">
            <TrendingUp className="w-5 h-5 stroke-[2.5px]" />
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
              Service Client <span className="text-pink-400">AirPods</span>
            </h3>
            <p className="text-[11px] text-pink-300/70 font-medium">Assistance instantanée VIP • Réponse en 5 min</p>
          </div>
        </div>
      </div>

      {/* 2. CONVERSATION CANVAS AREA */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-6 bg-[#0d0417] pb-36">
        
        {/* Date Divider Badge */}
        <div className="flex justify-center my-2">
          <span className="text-[11px] font-mono font-bold text-pink-300/60 bg-[#1a082b] border border-pink-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Aujourd'hui • Communication Officielle
          </span>
        </div>

        {/* REQ / REFERENCE IMAGE EXACT REPLICATION: SEAMLESS TEXT FLOW DIRECTLY ON BACKGROUND */}
        <div className="max-w-2xl mx-auto space-y-6 text-white font-sans text-sm sm:text-base leading-relaxed py-2 bg-[#1a082b] p-4 sm:p-6 rounded-3xl border border-pink-500/25 shadow-lg">
          
          {/* Header Line with Emojis */}
          <div className="space-y-3 font-medium text-white">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
              <span>🎧✨</span> <span>AirPods — Avancez vers la réalisation de vos rêves !</span>
            </h2>

            <div className="py-2 flex items-center space-x-2 text-pink-200 font-medium">
              <span>💸 Code de réduction du jour :</span>
              <span className="font-mono font-black text-pink-300 text-sm bg-pink-500/20 border border-pink-500/30 px-2.5 py-1 rounded-md select-all">
                649138
              </span>
            </div>

            <p className="text-pink-100/90 text-sm sm:text-base leading-relaxed">
              Chaque effort est un pas vers le succès, chaque acte de persévérance renforce votre potentiel pour l'avenir.
            </p>
          </div>

          <p className="text-pink-200/90 text-sm sm:text-base leading-relaxed">
            Chez AirPods, nous croyons que les opportunités appartiennent à ceux qui osent agir. Grâce à une participation active, à l'apprentissage continu et au partage d'expériences, vous pouvez non seulement vous épanouir personnellement, mais aussi grandir aux côtés de votre équipe pour bâtir ensemble un avenir meilleur.
          </p>

          <p className="text-white font-bold text-sm sm:text-base leading-relaxed flex items-start space-x-2">
            <span className="text-lg">🌟</span>
            <span>Le succès n'attend pas les hésitants ; il appartient à ceux qui ont le courage de faire le premier pas.</span>
          </p>

          <p className="text-pink-200/90 text-sm sm:text-base leading-relaxed">
            Avançons main dans la main : restons confiants, déterminés à atteindre nos objectifs et créateurs de valeur par l'action.
          </p>

          <p className="font-extrabold text-pink-400 text-sm sm:text-base flex items-center space-x-2 pt-2">
            <span className="text-lg">💪</span>
            <span>Rejoignez AirPods et ouvrez la voie à un avenir brillant !</span>
          </p>

          {/* Bullet Points Section */}
          <div className="space-y-3 pt-4 text-xs sm:text-sm">
            <p className="font-bold text-white flex items-center space-x-2">
              <span>💡</span> <span>Pourquoi choisir AirPods ?</span>
            </p>

            <ul className="space-y-2.5 pl-1 text-pink-200/90 font-medium">
              <li className="flex items-start space-x-2.5">
                <span className="text-base leading-none">📈</span>
                <span>Rendements stables et fiables au quotidien</span>
              </li>

              <li className="flex items-start space-x-2.5">
                <span className="text-base leading-none">🧩</span>
                <span>Plusieurs options d'investissement de bien-être sur-mesure</span>
              </li>

              <li className="flex items-start space-x-2.5">
                <span className="text-base leading-none">💰</span>
                <span>Commissions de parrainage jusqu'à <strong className="text-pink-300 font-black">20 %</strong></span>
              </li>

              <li className="flex items-start space-x-2.5">
                <span className="text-base leading-none">🏛️</span>
                <span>Aucun dépôt requis pour retirer vos récompenses de parrainage</span>
              </li>

              <li className="flex items-start space-x-2.5">
                <span className="text-base leading-none">⚡</span>
                <span>Retraits rapides : en seulement <strong>5 minutes</strong></span>
              </li>
            </ul>
          </div>

          {/* Message Timestamp */}
          <div className="flex justify-end items-center space-x-1 pt-2 text-[10px] text-pink-300/60 font-mono font-medium">
            <span>09:34</span>
          </div>
        </div>

        {/* DYNAMIC USER SUPPORT TICKETS & MESSAGES */}
        {userTickets.map((tkt) => {
          const isAdminDirect = tkt.id.startsWith('tkt-adm-') || tkt.message === "Message direct du Support Client AirPods." || tkt.message === "Message direct du Support Client Nutrien." || tkt.subject?.includes("Administration");
          const adminReplyText = tkt.reply || (isAdminDirect ? tkt.message : '');

          return (
            <div key={tkt.id} className="max-w-2xl mx-auto space-y-4 my-6">
              
              {/* User Message (Hidden only if it's an admin direct transmission message) */}
              {!isAdminDirect && tkt.message && (
                <div className="flex flex-col items-end animate-fadeIn">
                  <div className="max-w-md space-y-1.5 text-right bg-[#1a082b] border border-pink-500/30 p-3.5 rounded-2xl rounded-tr-none shadow-md">
                    {tkt.subject && tkt.subject !== "Message Chat Support" && (
                      <span className="text-[10px] uppercase font-mono font-black text-pink-400 block">
                        {tkt.subject}
                      </span>
                    )}

                    {/* Attached Image if present */}
                    {tkt.imageUrl && (
                      <div className="rounded-2xl overflow-hidden max-h-56 max-w-xs mb-2 border border-pink-500/30">
                        <img src={tkt.imageUrl} alt="Pièce jointe" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed whitespace-pre-wrap">
                      {tkt.message}
                    </p>

                    <div className="flex items-center justify-end space-x-1 text-[9px] font-mono text-pink-300/60 font-bold">
                      <span>{formatTime(tkt.createdAt)}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5px]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Admin or Support Reply */}
              {adminReplyText ? (
                <div className="flex items-start space-x-3 max-w-xl animate-fadeIn py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 font-black text-xs shadow-md border border-pink-300/30">
                    ADM
                  </div>

                  <div className="space-y-1 text-xs sm:text-sm text-white font-medium leading-relaxed">
                    <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 font-mono block">
                      Administration AirPods
                    </span>

                    <p className="whitespace-pre-wrap text-pink-100 bg-[#1a082b] p-3 rounded-2xl border border-pink-500/30 shadow-md">
                      {adminReplyText}
                    </p>

                    <div className="text-[9px] text-pink-300/60 font-mono font-medium pt-0.5">
                      <span>{formatTime(tkt.replyCreatedAt || tkt.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ) : null}

            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. ATTACHED IMAGE PREVIEW BAR */}
      {selectedImage && (
        <div className="fixed bottom-[108px] sm:bottom-[114px] left-0 right-0 z-30 bg-[#1a082b] border-t border-pink-500/30 px-4 py-2 flex items-center justify-between animate-fadeIn max-w-3xl mx-auto shadow-xl rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-pink-500/40 relative shadow-xs">
              <img src={selectedImage} alt="Aperçu" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Image prête à l'envoi</span>
              <span className="text-[10px] text-emerald-400 font-medium">Capture d'écran / Pièce jointe</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setSelectedImage(null)}
            className="p-1.5 rounded-full bg-[#120422] hover:bg-pink-500/20 text-pink-300 transition-colors cursor-pointer"
            title="Supprimer la photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. MESSENGER INPUT BAR (FIXED AT BOTTOM OF SCREEN WITH ZERO GAP) */}
      <form onSubmit={handleSendMessage} className="fixed bottom-[52px] sm:bottom-[56px] left-0 right-0 bg-[#120422]/95 backdrop-blur-md px-3 sm:px-4 py-2.5 border-t border-pink-500/20 z-30 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center space-x-2 sm:space-x-3">
          
          {/* Image Attachment Icon Button */}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
            id="chat-file-input"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-2xl hover:bg-pink-500/20 text-pink-300 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            title="Ajouter une image"
            id="chat-attach-image-btn"
          >
            <ImageIcon className="w-5 h-5 stroke-[2px]" />
          </button>

          {/* Text Input Field */}
          <input 
            type="text" 
            placeholder="Écrire un message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow bg-[#1a082b] hover:bg-[#200a35] focus:bg-[#200a35] border border-pink-500/30 focus:border-pink-400 outline-none rounded-2xl py-2.5 px-4 text-xs sm:text-sm font-medium text-white transition-all placeholder:text-pink-300/40"
            id="chat-input-field"
          />

          {/* Send Button */}
          <button 
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isSending}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
              (inputText.trim() || selectedImage) && !isSending
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-md border border-pink-300/30 scale-100'
                : 'bg-[#1a082b] text-pink-300/30 border border-pink-500/20 cursor-not-allowed scale-95'
            }`}
            id="chat-send-btn"
          >
            <Send className="w-4 h-4 ml-0.5 stroke-[2.5px]" />
          </button>

        </div>
      </form>

    </div>
  );
};
