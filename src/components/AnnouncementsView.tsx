import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';

interface AnnouncementsViewProps {
  notificationText?: string | null;
  onBack: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ onBack }) => {
  const { announcements, markAnnouncementAsRead } = useApp();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Sort announcements with newest first
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleSelectAnnouncement = (ann: Announcement) => {
    if (ann.isNew) {
      markAnnouncementAsRead(ann.id);
    }
    setSelectedAnnouncement(ann);
  };

  const unreadCount = announcements.filter(a => a.isNew).length;

  const handleMarkAllAsRead = () => {
    announcements.forEach(a => {
      if (a.isNew) markAnnouncementAsRead(a.id);
    });
  };

  // IF AN ANNOUNCEMENT IS SELECTED -> SHOW DETAIL PAGE
  if (selectedAnnouncement) {
    return (
      <div className="animate-fadeIn max-w-md sm:max-w-xl mx-auto pb-24 px-3 sm:px-4 text-slate-900">
        {/* Top Header Bar matching mobile app style */}
        <div className="flex items-center justify-between py-3.5 border-b border-slate-200/90 mb-4 bg-white/80 sticky top-0 z-10 backdrop-blur-md">
          <button
            onClick={() => setSelectedAnnouncement(null)}
            className="flex items-center space-x-1.5 text-slate-900 hover:text-amber-600 transition-colors font-bold text-sm cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 text-center tracking-tight">
            Message
          </h1>
          <div className="w-6"></div>
        </div>

        {/* Announcement Detail Body */}
        <div className="space-y-4 py-2 px-1">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Annonce Officielle
              </span>
              <span className="text-xs text-slate-500 font-mono flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedAnnouncement.createdAt}</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug pt-1">
              {selectedAnnouncement.title}
            </h2>
          </div>

          {/* Featured Image */}
          <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-slate-900 relative">
            <img
              src={selectedAnnouncement.imageUrl || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80'}
              alt={selectedAnnouncement.title}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          {/* Full Announcement Text Content */}
          <div className="pt-2 text-slate-800 text-sm sm:text-base leading-relaxed font-normal whitespace-pre-wrap">
            {selectedAnnouncement.content}
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Retour à la liste des messages
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW MATCHING THE REFERENCE IMAGE EXACTLY
  return (
    <div className="animate-fadeIn max-w-md sm:max-w-xl mx-auto pb-24 px-3 sm:px-4 text-slate-900">
      {/* Top Mobile Header Navigation Bar */}
      <div className="flex items-center justify-between py-3.5 border-b border-slate-200/90 mb-2 bg-white/90 sticky top-0 z-10 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 text-slate-900 hover:text-amber-600 transition-colors font-bold text-sm cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 text-center tracking-tight">
          Annonces & Messages
        </h1>
        {unreadCount > 0 ? (
          <button
            onClick={handleMarkAllAsRead}
            className="text-[11px] font-extrabold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Tout lire
          </button>
        ) : (
          <div className="w-6"></div>
        )}
      </div>

      {/* Main Container List - Direct on Background */}
      <div className="space-y-1 py-1 px-1">
        {sortedAnnouncements.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-medium">
            Aucun message ou annonce pour le moment.
          </div>
        ) : (
          sortedAnnouncements.map((ann) => (
            <div
              key={ann.id}
              onClick={() => handleSelectAnnouncement(ann)}
              className="group flex items-center justify-between py-3.5 px-2 hover:bg-slate-50/80 rounded-xl transition-colors cursor-pointer border-b border-slate-100 last:border-0"
            >
              <div className="flex-1 pr-3 space-y-1">
                <div className="flex items-start space-x-2">
                  {/* Red dot for new announcement */}
                  {ann.isNew && (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block shrink-0 mt-1.5" />
                  )}
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors leading-snug line-clamp-2">
                    {ann.title}
                  </h2>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-mono pl-0.5">
                  {ann.createdAt}
                </p>
              </div>

              <div className="shrink-0 text-slate-400 group-hover:text-slate-700 transition-colors">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
