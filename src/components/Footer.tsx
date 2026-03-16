import { Github, Linkedin, Mail, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

import Logo from './Logo';

export const Footer = () => {
  return (
    <footer className="bg-[#FAF9F6] border-t border-[#E9E1D9]/50 pt-20 pb-10 overflow-hidden relative" dir="rtl">
      {/* Decorative Background Element */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#E9E1D9]/30 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Logo & Brand */}
          <div className="col-span-1 md:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
            </div>
            <p className="text-[#5F5F5F] max-w-sm leading-relaxed font-light">
              الأداة العربية الأولى لإزالة خلفيات الصور بالذكاء الاصطناعي مع الحفاظ التام على الخصوصية. معالجة محلية 100% داخل متصفحك.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/mohamed-khairy-5i" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-[#E9E1D9] rounded-full flex items-center justify-center text-[#2D2D2D] hover:bg-[#E9E1D9] transition-all">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/mohamed-khairy-5i/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-[#E9E1D9] rounded-full flex items-center justify-center text-[#2D2D2D] hover:bg-[#E9E1D9] transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:mohamedkhairy0887@gmail.com" className="w-10 h-10 bg-white border border-[#E9E1D9] rounded-full flex items-center justify-center text-[#2D2D2D] hover:bg-[#E9E1D9] transition-all">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-[#2D2D2D]">روابط سريعة</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-[#5F5F5F] hover:text-[#2D2D2D] transition-colors font-light">الرئيسية</Link></li>
              <li><Link to="/gallery" className="text-[#5F5F5F] hover:text-[#2D2D2D] transition-colors font-light">معرض الصور</Link></li>
              <li><Link to="/instructions" className="text-[#5F5F5F] hover:text-[#2D2D2D] transition-colors font-light">كيفية الاستخدام</Link></li>
              <li><Link to="/developer" className="text-[#5F5F5F] hover:text-[#2D2D2D] transition-colors font-light">المطور</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-[#2D2D2D]">قانوني</h4>
            <ul className="space-y-4">
              <li><Link to="/privacy" className="text-[#5F5F5F] hover:text-[#2D2D2D] transition-colors font-light">سياسة الخصوصية</Link></li>
              <li><Link to="/contact" className="text-[#5F5F5F] hover:text-[#2D2D2D] transition-colors font-light">اتصل بنا</Link></li>
              <li><Link to="/terms" className="text-[#5F5F5F] hover:text-[#2D2D2D] transition-colors font-light">الشروط والأحكام</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-[#E9E1D9]/30 flex flex-col items-center justify-center text-center gap-6">
          <p className="text-[#5F5F5F] text-sm">
            © {new Date().getFullYear()} TrimBG. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2 text-[#5F5F5F] text-sm font-bold">
            <span>Developed with ❤️ by <a href="https://mokhairy.netlify.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#2D2D2D] transition-colors underline decoration-[#E9E1D9] underline-offset-4">Mohamed Khairy</a></span>
          </div>
        </div>
      </div>
    </footer>
  );
};