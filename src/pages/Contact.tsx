import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Github, Linkedin, Mail, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم استلام رسالتك",
      description: "سنقوم بالرد عليك في أقرب وقت ممكن.",
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2D2D2D]" dir="rtl">
      <Header />
      
      <main className="max-w-4xl mx-auto pt-16 pb-24 md:pt-20 px-6">
        <div className="space-y-16">
          <div className="space-y-6 text-center">
            <h1 className="text-5xl md:text-6xl font-black tracking-tightest">اتصل بنا</h1>
            <p className="text-xl text-[#5F5F5F] font-light">نحن هنا للإجابة على تساؤلاتك ودعم تجربتك.</p>
          </div>

          <div className="grid md:grid-cols-5 gap-12">
            <div className="md:col-span-2 space-y-6">
              <Card className="p-8 rounded-3xl bg-white border-[#E9E1D9] shadow-sm flex items-center gap-4 group cursor-default">
                <div className="w-12 h-12 bg-[#E9E1D9] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xs md:text-sm text-[#8B7E74]">راسلنا مباشرة</h3>
                  <a href="mailto:mohamedkhairy0887@gmail.com" className="text-sm md:text-base font-black hover:text-[#D2A084] transition-colors block truncate max-w-[180px] md:max-w-full">
                    mohamedkhairy0887@gmail.com
                  </a>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <a 
                  href="https://github.com/mohamed-khairy-5i" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-6 rounded-3xl bg-white border border-[#E9E1D9] shadow-sm flex flex-col items-center gap-3 hover:bg-[#2D2D2D] hover:text-white transition-all duration-300 group"
                >
                  <Github className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm">GitHub</span>
                </a>
                <a 
                  href="https://www.linkedin.com/in/mohamed-khairy-5i/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-6 rounded-3xl bg-white border border-[#E9E1D9] shadow-sm flex flex-col items-center gap-3 hover:bg-[#0077B5] hover:text-white transition-all duration-300 group"
                >
                  <Linkedin className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm">LinkedIn</span>
                </a>
              </div>
            </div>

            <div className="md:col-span-3">
              <Card className="p-8 md:p-10 rounded-[2.5rem] bg-white border-[#E9E1D9] shadow-xl shadow-[#E9E1D9]/20">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ms-2 text-[#8B7E74]">الاسم</label>
                    <Input 
                      placeholder="اكتب اسمك هنا" 
                      className="h-14 rounded-2xl border-[#E9E1D9] focus:ring-2 focus:ring-[#E9E1D9] bg-[#FAF9F6]/50"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ms-2 text-[#8B7E74]">البريد الإلكتروني</label>
                    <Input 
                      type="email" 
                      placeholder="example@mail.com" 
                      className="h-14 rounded-2xl border-[#E9E1D9] focus:ring-2 focus:ring-[#E9E1D9] bg-[#FAF9F6]/50"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ms-2 text-[#8B7E74]">الرسالة</label>
                    <Textarea 
                      placeholder="كيف يمكننا مساعدتك؟" 
                      className="min-h-[150px] rounded-2xl border-[#E9E1D9] focus:ring-2 focus:ring-[#E9E1D9] bg-[#FAF9F6]/50"
                      required 
                    />
                  </div>
                  <Button className="peachy-button w-full h-14 text-lg shadow-lg">
                    <span>إرسال الرسالة</span>
                    <Send className="w-5 h-5 ms-2 rotate-180" />
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;