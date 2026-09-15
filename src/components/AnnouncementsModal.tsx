import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Calendar, Megaphone, ListFilter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationText?: string | null;
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { announcements, markAnnouncementAsRead } = useApp();
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  useEffect(() => {
    if (isOpen) {
      if (sortedAnnouncements.length > 0) {
        const topAnn = sortedAnnouncements[0];
        setSelectedAnn(topAnn);
        if (topAnn.isNew) {
          markAnnouncementAsRead(topAnn.id);
        }
      } else {
        setSelectedAnn(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (ann: Announcement) => {
    if (ann.isNew) {
      markAnnouncementAsRead(ann.id);
    }
    setSelectedAnn(ann);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0d0417]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1a082b] border border-pink-500/30 text-white rounded-3xl p-5 sm:p-6 max-w-lg w-full relative overflow-hidden space-y-4 max-h-[88vh] flex flex-col shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#120422] hover:bg-pink-500/20 text-pink-300 hover:text-white border border-pink-500/30 flex items-center justify-center transition-all cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-500/20 pb-3 pr-8">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-pink-400" />
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              Annonce Officielle
            </h3>
          </div>
          {selectedAnn && sortedAnnouncements.length > 1 && (
            <button
              onClick={() => setSelectedAnn(null)}
              className="text-xs font-bold text-pink-300 hover:text-white flex items-center space-x-1 bg-pink-500/20 border border-pink-500/30 px-2.5 py-1 rounded-full cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Toutes les annonces ({sortedAnnouncements.length})</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {selectedAnn ? (
            <div className="space-y-4 py-1">
              <div className="flex items-center space-x-2 text-xs text-pink-300/60 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>{selectedAnn.createdAt}</span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white leading-snug">
                {selectedAnn.title}
              </h4>
              <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-[#120422] relative shadow-inner border border-pink-500/20">
                <img
                  src={selectedAnn.imageUrl || 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80'}
                  alt={selectedAnn.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="bg-[#120422] p-4 rounded-2xl border border-pink-500/25">
                <p className="text-xs sm:text-sm text-pink-100/90 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedAnn.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-2 border-b border-pink-500/20 mb-2">
                <span className="text-xs font-bold text-pink-300/70 uppercase tracking-wider">
                  Liste des Messages
                </span>
              </div>
              {sortedAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => handleSelect(ann)}
                  className="group flex items-center justify-between py-3 px-3 hover:bg-[#120422] rounded-2xl transition-all cursor-pointer border border-transparent hover:border-pink-500/30"
                >
                  <div className="flex-1 pr-3 space-y-1">
                    <div className="flex items-start space-x-2">
                      {ann.isNew && (
                        <span className="w-2.5 h-2.5 bg-pink-500 rounded-full inline-block shrink-0 mt-1 shadow-xs" />
                      )}
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition-colors leading-snug line-clamp-2">
                        {ann.title}
                      </h4>
                    </div>
                    <p className="text-[10px] sm:text-xs text-pink-300/60 font-mono">
                      {ann.createdAt}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-pink-300/50 group-hover:text-pink-300 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 shadow-lg border border-pink-300/30"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
