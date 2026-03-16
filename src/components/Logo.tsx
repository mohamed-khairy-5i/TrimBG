import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo = ({ className = "", size = "md" }: LogoProps) => {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16"
  };

  return (
    <motion.div 
      className={`flex items-center gap-2 ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className={`${sizes[size]} aspect-square relative select-none flex items-center justify-center shrink-0`}>
        <img 
          src="/TrimBG.png" 
          alt="TrimBG Logo" 
          className="h-full w-auto object-contain block"
        />
      </div>

      <span className="text-[#2D2D2D] font-black tracking-tighter leading-none" style={{ fontSize: '120%' }}>
        <span className="inline-block" style={{ marginInlineStart: '-0.2em' }}>TrimBG</span>
      </span>
    </motion.div>
  );
};

export default Logo;
