import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Zap, CheckCircle2, ShoppingBag } from 'lucide-react';
import { InvestmentProduct } from '../types';

interface WellnessProductsCarouselProps {
  products: InvestmentProduct[];
  onSelectProduct: (product: InvestmentProduct) => void;
}

export const WellnessProductsCarousel: React.FC<WellnessProductsCarouselProps> = ({
  products,
  onSelectProduct
}) => {
  // Filter active products and sort by order
  const activeProducts = products
    .filter(p => p.isActive !== false)
    .sort((a, b) => (a.order || 99) - (b.order || 99));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto slide every 4 seconds
  useEffect(() => {
    if (activeProducts.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activeProducts.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeProducts.length, isPaused]);

  if (activeProducts.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
        Aucun produit de bien-être disponible pour le moment.
      </div>
    );
  }

  const currentProduct = activeProducts[currentIndex] || activeProducts[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeProducts.length) % activeProducts.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeProducts.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="w-full bg-white rounded-3xl p-4 sm:p-6 relative overflow-hidden space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Upper Bar Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 font-mono block">
            OFFRES VIP EXCLUSIVES
          </span>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Produits de Bien-être</span>
          </h3>
        </div>

        {/* Indicator dots */}
        <div className="flex items-center space-x-1.5">
          {activeProducts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'w-6 bg-amber-500'
                  : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              title={`Produit ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Main Vertical Product Card Container */}
      <div className="relative overflow-hidden transition-all duration-500 flex flex-col space-y-3 max-w-md mx-auto sm:max-w-none">
        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          title="Produit précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          title="Produit suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Product Card matching exact reference image design */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80 space-y-3">
          {/* Top Row: Title + Duration on left, Image Thumbnail on right */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentProduct.name}
              </h4>
              <div className="text-xs sm:text-sm text-slate-700 font-medium flex items-center space-x-1">
                <span>Durée du cycle (Jours) :</span>
                <strong className="text-slate-900 font-bold text-sm sm:text-base ml-1">{currentProduct.duration}</strong>
              </div>
            </div>

            <img
              src={currentProduct.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'}
              alt={currentProduct.name}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'; }}
              className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl object-cover flex-shrink-0 border border-slate-100"
            />
          </div>

          {/* Middle Row: Light Gray Box with 2 Columns */}
          <div className="bg-slate-100/90 rounded-2xl p-3 sm:p-4 grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-red-500 font-bold text-lg sm:text-xl tracking-tight">
                {currentProduct.dailyGain.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-900 mt-0.5">
                Revenu quotidien
              </div>
            </div>
            <div>
              <div className="text-red-500 font-bold text-lg sm:text-xl tracking-tight">
                {currentProduct.totalGain.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-900 mt-0.5">
                Revenu total
              </div>
            </div>
          </div>

          {/* Bottom Row: Price + Red INVESTIR Button */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-sm sm:text-base font-normal text-slate-900">
              Prix(XAF):<span className="text-red-500 font-bold ml-1 text-base sm:text-lg">{currentProduct.price.toLocaleString()}</span>
            </div>

            <button
              onClick={() => onSelectProduct(currentProduct)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg tracking-wider transition-all cursor-pointer shadow-xs uppercase"
            >
              INVESTIR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
