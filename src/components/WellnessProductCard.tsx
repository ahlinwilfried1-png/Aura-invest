import React, { useRef, useState, useEffect } from 'react';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WellnessProduct } from '../types';

interface WellnessProductCardProps {
  onSelectProduct?: (product: any) => void;
}

export const WellnessProductCard: React.FC<WellnessProductCardProps> = ({ onSelectProduct }) => {
  const { wellnessProducts } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollPosition = container.scrollLeft;
      const cardWidth = container.offsetWidth;
      if (cardWidth > 0) {
        const newIndex = Math.round(scrollPosition / cardWidth);
        setActiveIndex(newIndex);
      }
    }
  };

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const cardWidth = container.offsetWidth;
      container.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  };

  // Automatic scrolling every 5 seconds if multiple products exist
  useEffect(() => {
    if (!wellnessProducts || wellnessProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % wellnessProducts.length;
        if (scrollRef.current) {
          const container = scrollRef.current;
          const cardWidth = container.offsetWidth;
          container.scrollTo({
            left: nextIndex * cardWidth,
            behavior: 'smooth'
          });
        }
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [wellnessProducts.length]);

  if (!wellnessProducts || wellnessProducts.length === 0) {
    return null;
  }

  return (
    <div className="w-full my-3">
      {/* Outer Red Container Card matching reference image */}
      <div className="bg-[#be1d2c] rounded-[24px] p-3 sm:p-4 text-center shadow-md relative overflow-hidden">
        
        {/* Section Header Title */}
        <div className="pb-3 pt-1">
          <h3 className="text-white font-extrabold text-base sm:text-lg tracking-tight text-center font-sans">
            Produit de bien-être
          </h3>
        </div>

        {/* Horizontal Scrollable Container for products */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth space-x-4 scrollbar-none pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {wellnessProducts.map((product: WellnessProduct) => {
            const isAvailable = product.status === 'disponible' && product.quantity > 0;
            const fallbackImage = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80';
            
            const duration = 3;
            const dailyGain = (product as any).dailyGain || product.price;
            const totalGain = (product as any).totalGain || (dailyGain * duration);

            return (
              <div 
                key={product.id}
                onClick={() => {
                  if (onSelectProduct && isAvailable) {
                    onSelectProduct({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      dailyGain,
                      duration,
                      totalGain,
                      image: product.imageUrl || fallbackImage,
                      description: product.description,
                      badge: 'BIEN-ÊTRE'
                    });
                  }
                }}
                className="min-w-full snap-center bg-white rounded-[20px] p-3 sm:p-3.5 text-left shadow-2xs space-y-3 cursor-pointer group hover:shadow-md transition-all shrink-0"
              >
                {/* Product Image with HOT Badge on Top-Left */}
                <div className="relative w-full h-44 sm:h-52 rounded-[16px] overflow-hidden bg-slate-100">
                  {/* HOT Flame Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-[#ef3838] text-white font-black text-[9px] px-2 py-0.5 rounded-full flex items-center space-x-0.5 shadow-md z-10 tracking-wider">
                    <Flame className="w-3 h-3 text-white fill-white" />
                    <span>HOT</span>
                  </div>

                  <img 
                    src={product.imageUrl || fallbackImage} 
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                </div>

                {/* Product Title */}
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug font-sans px-0.5">
                  {product.name}
                </h4>

                {/* 3-Column Stats Grid matching exact screenshot layout */}
                <div className="grid grid-cols-3 gap-1 text-center py-1 font-sans border-t border-slate-100/80">
                  {/* Column 1: Cycle d'investissement */}
                  <div className="space-y-0.5">
                    <div className="text-sm sm:text-base font-extrabold text-slate-900">
                      <span>{duration}</span> <span className="text-xs text-slate-700 font-medium">Jours</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-normal leading-tight">
                      Cycle d'investissement
                    </div>
                  </div>

                  {/* Column 2: Revenu quotidien */}
                  <div className="space-y-0.5">
                    <div className="text-sm sm:text-base font-extrabold text-[#1d6bd3]">
                      {dailyGain.toLocaleString('en-US')}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-normal leading-tight">
                      Revenu quotidien
                    </div>
                  </div>

                  {/* Column 3: Revenu total */}
                  <div className="space-y-0.5">
                    <div className="text-sm sm:text-base font-extrabold text-[#1d6bd3]">
                      {totalGain.toLocaleString('en-US')}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-normal leading-tight">
                      Revenu total
                    </div>
                  </div>
                </div>

                {/* Blue CTA Button matching exact image button styling */}
                <button
                  disabled={!isAvailable}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectProduct && isAvailable) {
                      onSelectProduct({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        dailyGain,
                        duration,
                        totalGain,
                        image: product.imageUrl || fallbackImage,
                        description: product.description,
                        badge: 'BIEN-ÊTRE'
                      });
                    }
                  }}
                  className={`w-full py-3 text-white font-black text-lg sm:text-xl rounded-[14px] shadow-xs transition-all flex items-center justify-center font-sans tracking-wide ${
                    isAvailable 
                      ? 'bg-[#1d6bd3] hover:bg-[#185cb8] active:scale-[0.99] cursor-pointer' 
                      : 'bg-slate-400 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isAvailable ? `${product.price.toLocaleString('en-US')}XAF` : 'Stock Épuisé'}
                </button>

              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Dots */}
        {wellnessProducts.length > 1 && (
          <div className="flex items-center justify-center space-x-1.5 pt-2">
            {wellnessProducts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeIndex === idx 
                    ? 'w-5 bg-white' 
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Aller au produit de bien-être ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

