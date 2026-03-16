import React, { useState, useRef, useEffect } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface ImageComparisonProps {
  before: string;
  after: string;
}

export const ImageComparison = ({ before, after }: ImageComparisonProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const position = (x / rect.width) * 100;
    setSliderPosition(position);
  };

  const onMouseDown = () => setIsResizing(true);
  const onMouseUp = () => setIsResizing(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (isResizing) handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isResizing) handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square md:aspect-video select-none overflow-hidden rounded-3xl shadow-2xl border-4 border-white cursor-ew-resize group bg-white"
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
    >
      {/* After Image (Background - Processed) */}
      <div className="absolute inset-0 w-full h-full bg-[#f0f0f0] checkerboard-bg">
        <img 
          src={after} 
          alt="After" 
          className="w-full h-full object-contain p-2 md:p-4 transition-transform duration-500 hover:scale-[1.02]"
        />
      </div>

      {/* Before Image (Overlay - Original) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden bg-white"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={before} 
          alt="Before" 
          className="absolute inset-0 w-full h-full object-contain p-2 md:p-4"
          style={{ width: `${100 / (sliderPosition / 100)}%` }}
        />
      </div>

      {/* Slider Line & Handle */}
      <div 
        className="absolute inset-y-0 w-[2px] bg-white shadow-[0_0_15px_rgba(0,0,0,0.3)] pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-[#E9E1D9] group-active:scale-90 transition-transform cursor-pointer">
          <MoveHorizontal className="w-6 h-6 text-[#2D2D2D]" />
        </div>
      </div>

      {/* Labels - Premium Glassmorphism */}
      <div className="absolute inset-x-0 bottom-4 md:bottom-6 px-4 md:px-8 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-[#2D2D2D]/80 backdrop-blur-md px-3 py-1 md:px-6 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black text-white shadow-xl border border-white/10 uppercase tracking-widest">
          قبل
        </div>
        <div className="bg-[#E9E1D9]/90 backdrop-blur-md px-3 py-1 md:px-6 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black text-[#2D2D2D] shadow-xl border border-white/20 uppercase tracking-widest">
          بعد
        </div>
      </div>

      {/* Checkerboard Pattern Inline CSS */}
      <style>{`
        .checkerboard-bg {
          background-image: linear-gradient(45deg, #e5e5e5 25%, transparent 25%), 
                            linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #e5e5e5 75%), 
                            linear-gradient(-45deg, transparent 75%, #e5e5e5 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
};
