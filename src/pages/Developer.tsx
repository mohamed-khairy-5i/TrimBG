import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, Mail, Code2, Cpu, Globe, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Developer = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="py-20 relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#E9E1D9]/20 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <Card className="minimal-card overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Profile Image/Avatar Section */}
              <div className="md:w-1/3 bg-[#FAF9F6] p-12 flex flex-col items-center justify-center border-l border-[#E9E1D9]/30">
                <div className="relative group">
                  <div className="w-48 h-48 rounded-full border-8 border-[#E9E1D9] overflow-hidden shadow-inner bg-white flex items-center justify-center">
                    {/* Placeholder for Avatar - In a real app this would be an <img> */}
                    <div className="text-6xl text-[#2D2D2D]/20 font-black">MK</div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#2D2D2D] rounded-full flex items-center justify-center shadow-lg border-4 border-[#FAF9F6]">
                    <Zap className="w-5 h-5 text-[#E9E1D9]" />
                  </div>
                </div>
                
                <div className="mt-8 flex gap-4">
                   <a href="https://github.com/mohamed-khairy-5i" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border border-[#E9E1D9]/50">
                      <Github className="w-5 h-5 text-[#2D2D2D]" />
                   </a>
                   <a href="mailto:mohamedkhairy0887@gmail.com" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border border-[#E9E1D9]/50">
                      <Mail className="w-5 h-5 text-[#2D2D2D]" />
                   </a>
                </div>
              </div>

              {/* Bio Section */}
              <div className="md:w-2/3 p-12 md:p-16 flex flex-col justify-center space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-black text-[#2D2D2D] leading-tight">
                    مرحباً، أنا <a href="https://mokhairy.netlify.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#5F5F5F] transition-colors underline decoration-[#E9E1D9] decoration-4 underline-offset-8">محمد خيري</a> 👋
                  </h1>
                  <p className="text-xl text-[#5F5F5F] font-medium">
                    مطور ويب ومهتم بتقنيات الذكاء الاصطناعي
                  </p>
                </div>

                <p className="text-lg text-[#2D2D2D] leading-relaxed font-light">
                  أنا مطور ويب وشغوف بدمج تقنيات الذكاء الاصطناعي لإنشاء تطبيقات ويب تفاعلية وحلول برمجية حديثة. أؤمن بأن الأدوات القوية يجب أن تكون مجانية، سريعة، والأهم من ذلك: تحترم خصوصية المستخدم. تم بناء TrimBG كأداة تعتمد على المعالجة المحلية (Local Processing) بنسبة 100%؛ مما يعني أن صورك لا تغادر متصفحك أبداً.
                </p>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-[#2D2D2D] flex items-center gap-2">
                    <Code2 className="w-5 h-5" />
                    التقنيات المستخدمة
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-[#E9E1D9] text-[#2D2D2D] hover:bg-[#DED2C7] border-none px-4 py-2 rounded-full text-sm font-bold transition-colors">
                      React
                    </Badge>
                    <Badge className="bg-[#E9E1D9] text-[#2D2D2D] hover:bg-[#DED2C7] border-none px-4 py-2 rounded-full text-sm font-bold transition-colors">
                      Tailwind CSS
                    </Badge>
                    <Badge className="bg-[#E9E1D9] text-[#2D2D2D] hover:bg-[#DED2C7] border-none px-4 py-2 rounded-full text-sm font-bold transition-colors">
                      WebAssembly
                    </Badge>
                    <Badge className="bg-[#E9E1D9] text-[#2D2D2D] hover:bg-[#DED2C7] border-none px-4 py-2 rounded-full text-sm font-bold transition-colors">
                      ONNX AI
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <a href="https://github.com/mohamed-khairy-5i" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button className="peachy-button w-full h-14 text-lg">
                      <Github className="w-5 h-5" />
                      حسابي على GitHub
                    </Button>
                  </a>
                  <Link to="/contact" className="flex-1">
                    <Button variant="outline" className="w-full h-14 rounded-full border-2 border-[#E9E1D9] text-[#2D2D2D] hover:bg-[#E9E1D9] transition-all text-lg font-bold">
                      تواصل معي
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Experience Section (Optional aesthetic touch) */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-[#2D2D2D] rounded-xl flex items-center justify-center mx-auto shadow-lg">
                <Globe className="w-6 h-6 text-[#FAF9F6]" />
              </div>
              <h4 className="font-bold text-[#2D2D2D]">حلول عالمية</h4>
              <p className="text-sm text-[#5F5F5F] font-light">تطبيقات ويب تتخطى الحدود الجغرافية.</p>
            </div>
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-[#2D2D2D] rounded-xl flex items-center justify-center mx-auto shadow-lg">
                <Cpu className="w-6 h-6 text-[#FAF9F6]" />
              </div>
              <h4 className="font-bold text-[#2D2D2D]">أداء فائق</h4>
              <p className="text-sm text-[#5F5F5F] font-light">استغلال كامل لقدرات المعالجة الحديثة.</p>
            </div>
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-[#2D2D2D] rounded-xl flex items-center justify-center mx-auto shadow-lg">
                <Shield className="w-6 h-6 text-[#FAF9F6]" />
              </div>
              <h4 className="font-bold text-[#2D2D2D]">خصوصية تامة</h4>
              <p className="text-sm text-[#5F5F5F] font-light">بيانات المستخدم ملك له وحده دائماً.</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Internal imports check
const Shield = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);

export default Developer;
