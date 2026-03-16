import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon, Shield, Zap, Sparkles, Sliders, Globe, Lock } from "lucide-react";
import React from "react";
import { useWorkspace } from "@/context/WorkspaceContext";

const Index = () => {
  const navigate = useNavigate();
  const { setOriginalImage } = useWorkspace();
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setOriginalImage(imageUrl);
    navigate('/workspace');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const features = [
    {
      title: "خصوصية تامة 100%",
      desc: "تتم معالجة كافة الصور محلياً في متصفحك. لا يتم رفع أي صورة لخوادمنا، مما يضمن أمانك التام.",
      icon: Lock,
    },
    {
      title: "سرعة البرق",
      desc: "بفضل تقنية WebGPU، نقوم بإزالة الخلفية في ثوانٍ معدودة وبدقة عالية جداً تصل إلى 4K.",
      icon: Zap,
    },
    {
      title: "دقة الذكاء الاصطناعي",
      desc: "نستخدم أقوى النماذج لفصل العناصر المعقدة مثل الشعر والأطراف الدقيقة بدقة احترافية.",
      icon: Sparkles,
    },
    {
      title: "سهولة الاستخدام",
      desc: "ببساطة اسحب وأفلت الصورة، وسيقوم نظامنا بكل العمل الشاق بدلاً عنك بضغطة واحدة.",
      icon: Sliders,
    },
    {
        title: "مجاني للأبد",
        desc: "استمتع بكافة مميزات الموقع بشكل مجاني تماماً، بدون اشتراكات أو علامات مائية مزعجة.",
        icon: Globe,
    },
    {
        title: "حماية البيانات",
        desc: "نحن نؤمن بأن بياناتك ملكك. لا نجمع أي معلومات شخصية ولا نستخدم ملفات التتبع.",
        icon: Shield,
    }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="relative pt-16 pb-24 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-[#E9E1D9]/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-[#E9E1D9]/20 rounded-full blur-[120px] -z-10"></div>
        
        {/* Hero Section */}
        <div className="container mx-auto px-6 mb-24 text-center">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E9E1D9]/40 rounded-full text-[#2D2D2D] text-sm font-bold border border-[#E9E1D9] animate-in fade-in slide-in-from-top-4 duration-1000">
                 <Sparkles className="w-4 h-4" />
                 <span>مدعوم بأقوى تقنيات الذكاء الاصطناعي</span>
              </div>
              
              <h1 className="text-5xl lg:text-8xl font-black text-[#2D2D2D] leading-[1.1] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-700">
                  أحدث ثورة في <br /> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#2D2D2D] to-[#8B7E74]">إزالة الخلفيات</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-[#5F5F5F] font-light leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000">
                  أداة احترافية، مجانية تماماً، والأهم من ذلك أنها تحترم خصوصيتك بمعالجة الصور داخل جهازك مباشرة.
              </p>
            </div>

            {/* Upload Area */}
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-0">
              <div
                className={`relative group py-8 md:py-20 px-5 md:px-12 text-center space-y-5 md:space-y-10 border-2 border-dashed rounded-[2rem] md:rounded-[3.5rem] transition-all duration-500 cursor-pointer ${
                  dragActive 
                    ? 'border-[#2D2D2D] bg-[#E9E1D9]/20 scale-[1.02]' 
                    : 'border-[#E9E1D9] bg-white shadow-soft hover:shadow-hover hover:border-[#8B7E74] hover:scale-[1.01]'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="w-16 h-16 md:w-28 md:h-28 mx-auto bg-[#FAF9F6] rounded-2xl md:rounded-[2.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm border border-[#E9E1D9]/50">
                  <ImageIcon className="w-8 h-8 md:w-14 md:h-14 text-[#2D2D2D]" />
                </div>
                
                <div className="space-y-2 md:space-y-4">
                  <h3 className="text-2xl md:text-4xl font-extrabold text-[#2D2D2D] tracking-tight">ارفع صورتك وابدأ الآن</h3>
                  <p className="text-[#5F5F5F] text-sm md:text-xl font-light leading-relaxed max-w-lg mx-auto px-2">
                    اسحب وأفلت الصورة مباشرة، أو اضغط للاختيار من جهازك لمعالجتها فوراً بأقوى تقنيات الذكاء الاصطناعي
                  </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <label className="cursor-pointer inline-block">
                    <input 
                      id="file-upload"
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
                      className="hidden" 
                    />
                    <div className="peachy-button px-8 md:px-12 h-14 md:h-18 text-lg md:text-xl group/btn shadow-lg hover:shadow-2xl">
                      <Upload className="w-6 h-6 md:w-7 md:h-7 transition-transform group-hover/btn:-translate-y-1" />
                      <span>اختر صورة</span>
                    </div>
                  </label>
                  <p className="text-sm text-[#8B7E74] font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    يدعم JPG, PNG, WEBP حتى 10 ميجابايت
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-24 border-t border-[#E9E1D9]/30">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#2D2D2D] mb-6">لماذا تختار TrimBG؟</h2>
            <div className="w-24 h-1 bg-[#E9E1D9] mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="minimal-card p-10 hover:shadow-xl group transition-all duration-500">
                <div className="w-16 h-16 bg-[#E9E1D9] rounded-[1.5rem] flex items-center justify-center mb-8 border border-[#E9E1D9]/50 group-hover:scale-110 group-hover:bg-[#2D2D2D] transition-all duration-500">
                  <f.icon className="w-8 h-8 text-[#2D2D2D] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-[#2D2D2D] mb-4">{f.title}</h3>
                <p className="text-[#5F5F5F] leading-relaxed font-light">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;