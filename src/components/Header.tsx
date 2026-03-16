import { Button } from "@/components/ui/button";
import { Wand2, Menu } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import Logo from './Logo';
import { motion, AnimatePresence } from 'framer-motion';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'الرئيسية', path: '/' },
    { name: 'معرض الأعمال', path: '/gallery' },
    { name: 'المطور', path: '/developer' },
    { name: 'تواصل معنا', path: '/contact' }
  ];

  return (
    <header className="relative bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="relative max-w-7xl mx-auto px-6 py-4">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group cursor-pointer">
            <Logo size="md" />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 space-x-reverse items-center">
            <Link to="/" className="text-[#5F5F5F] hover:text-[#2D2D2D] font-medium transition-colors">الرئيسية</Link>
            <Link to="/gallery" className="text-[#5F5F5F] hover:text-[#2D2D2D] font-medium transition-colors">معرض الأعمال</Link>
            <Link to="/developer" className="text-[#5F5F5F] hover:text-[#2D2D2D] font-medium transition-colors">المطور</Link>
            <Link to="/contact" className="peachy-button !py-2 !px-6 text-sm">تواصل معنا</Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-5 h-5 text-[#2D2D2D]" />
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden mt-4 overflow-hidden border-t border-border/50"
            >
              <div className="flex flex-col space-y-4 py-8 px-2">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item.path}
                    initial={{ x: 30, opacity: 0, skewX: -10 }}
                    animate={{ x: 0, opacity: 1, skewX: 0 }}
                    transition={{ 
                      delay: i * 0.08,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                  >
                    <Link 
                      to={item.path} 
                      onClick={() => setIsMenuOpen(false)}
                      className="text-2xl font-black text-[#2D2D2D] hover:text-[#8B7E74] transition-all block text-right pr-6 border-r-4 border-transparent hover:border-[#E9E1D9] py-2"
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};