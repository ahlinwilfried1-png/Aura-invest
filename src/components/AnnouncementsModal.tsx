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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full relative overflow-hidden space-y-4 max-h-[88vh] flex flex-col shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 pr-8">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-amber-600" />
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Annonce Officielle
            </h3>
          </div>
          {selectedAnn && sortedAnnouncements.length > 1 && (
            <button
              onClick={() => setSelectedAnn(null)}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1 bg-amber-50 px-2.5 py-1 rounded-full cursor-pointer"
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
              <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>{selectedAnn.createdAt}</span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {selectedAnn.title}
              </h4>
              <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-slate-900 relative shadow-inner">
                <img
                  src={selectedAnn.imageUrl || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80'}
                  alt={selectedAnn.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedAnn.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Liste des Messages
                </span>
              </div>
              {sortedAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => handleSelect(ann)}
                  className="group flex items-center justify-between py-3 px-3 hover:bg-amber-50/60 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-amber-200"
                >
                  <div className="flex-1 pr-3 space-y-1">
                    <div className="flex items-start space-x-2">
                      {ann.isNew && (
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block shrink-0 mt-1 shadow-xs" />
                      )}
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors leading-snug line-clamp-2">
                        {ann.title}
                      </h4>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                      {ann.createdAt}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0 shadow-md"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
