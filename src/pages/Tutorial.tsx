import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Wand2, Download, CheckCircle, Play, Clock, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Tutorial = () => {
  const steps = [
    {
      number: 1,
      title: "ارفع صورتك",
      description: "اختر صورة من جهازك أو اسحبها وأفلتها في المنطقة المخصصة",
      icon: Upload,
      tip: "تأكد من أن الصورة واضحة وبدقة جيدة للحصول على أفضل النتائج"
    },
    {
      number: 2,
      title: "اضغط إزالة الخلفية",
      description: "اضغط على زر 'إزالة الخلفية بالذكاء الاصطناعي' وانتظر المعالجة",
      icon: Wand2,
      tip: "المعالجة تتم محلياً في متصفحك لضمان خصوصية صورك"
    },
    {
      number: 3,
      title: "حمل النتيجة",
      description: "احصل على صورتك بخلفية شفافة وحملها بصيغة PNG",
      icon: Download,
      tip: "يمكنك استخدام الصورة مباشرة في تصاميمك أو مواقعك"
    }
  ];

  const tips = [
    {
      title: "جودة الصورة",
      description: "استخدم صور عالية الدقة للحصول على أفضل النتائج",
      icon: CheckCircle
    },
    {
      title: "الإضاءة الجيدة", 
      description: "تأكد من وجود إضاءة واضحة وتباين جيد مع الخلفية",
      icon: CheckCircle
    },
    {
      title: "حواف واضحة",
      description: "الصور ذات الحواف الواضحة تعطي نتائج أكثر دقة",
      icon: CheckCircle
    },
    {
      title: "تجنب الخلفيات المعقدة",
      description: "الخلفيات البسيطة تسهل عملية الإزالة",
      icon: CheckCircle
    }
  ];

  const faqs = [
    {
      question: "ما أنواع الملفات المدعومة؟",
      answer: "ندعم جميع صيغ الصور الشائعة: JPG, JPEG, PNG, WEBP, BMP"
    },
    {
      question: "هل هناك حد أقصى لحجم الصورة؟",
      answer: "يمكن رفع صور حتى 10MB، وسيتم تحسين الصور الكبيرة تلقائياً للمعالجة السريعة"
    },
    {
      question: "هل صوري آمنة؟",
      answer: "نعم، جميع الصور تتم معالجتها محلياً في متصفحك ولا ترسل لأي خادم خارجي"
    },
    {
      question: "كم من الوقت تستغرق المعالجة؟",
      answer: "عادة بين 5-30 ثانية حسب حجم الصورة وقوة جهازك"
    }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="py-20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E9E1D9]/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-[#2D2D2D]">
              كيفية الاستخدام
            </h1>
            <p className="text-xl text-[#5F5F5F] max-w-3xl mx-auto font-light">
              تعلم كيفية استخدام TrimBG لإزالة خلفيات الصور في 3 خطوات بسيطة.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-24">
            <Card className="minimal-card p-8 text-center border-none">
              <div className="w-16 h-16 bg-[#E9E1D9] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-[#2D2D2D]" />
              </div>
              <h3 className="text-3xl font-bold text-[#2D2D2D] mb-2 font-mono">30 ثانية</h3>
              <p className="text-[#5F5F5F] font-light">متوسط وقت المعالجة</p>
            </Card>
            
            <Card className="minimal-card p-8 text-center border-none">
              <div className="w-16 h-16 bg-[#E9E1D9] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#2D2D2D]" />
              </div>
              <h3 className="text-3xl font-bold text-[#2D2D2D] mb-2 font-mono">100%</h3>
              <p className="text-[#5F5F5F] font-light">خصوصية تامة محلياً</p>
            </Card>
            
            <Card className="minimal-card p-8 text-center border-none">
              <div className="w-16 h-16 bg-[#E9E1D9] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#2D2D2D]" />
              </div>
              <h3 className="text-3xl font-bold text-[#2D2D2D] mb-2">مجاني</h3>
              <p className="text-[#5F5F5F] font-light">بدون علامات مائية</p>
            </Card>
          </div>

          <div className="mb-24">
            <h2 className="text-3xl font-bold text-center text-[#2D2D2D] mb-12">خطوات الاستخدام</h2>
            <div className="grid lg:grid-cols-3 gap-12 relative">
              {/* Optional: Add a connector line behind cards (hidden on mobile) */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#E9E1D9] to-transparent -translate-y-1/2 z-0"></div>
              
              {steps.map((step) => (
                <div key={step.number} className="relative group z-10">
                  <Card className="minimal-card p-10 h-full flex flex-col items-center text-center hover:-translate-y-2 group">
                    {/* Number Badge - Fixed and Styled */}
                    <div className="w-12 h-12 bg-[#2D2D2D] text-[#FAF9F6] rounded-full flex items-center justify-center font-bold text-xl shadow-xl absolute -top-4 -right-4 border-4 border-background z-20">
                      {step.number}
                    </div>
                    
                    {/* Icon Container */}
                    <div className="w-24 h-24 bg-[#E9E1D9]/50 rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-[#E9E1D9] transition-all duration-500">
                      <step.icon className="w-10 h-10 text-[#2D2D2D]" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-[#2D2D2D] mb-4">{step.title}</h3>
                    <p className="text-[#5F5F5F] font-light leading-relaxed mb-8 flex-grow">
                      {step.description}
                    </p>
                    
                    {/* Tip Section */}
                    <div className="w-full bg-[#FAF9F6] border border-[#E9E1D9]/50 rounded-2xl p-5 mt-auto text-right">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <p className="text-sm text-[#2D2D2D] font-medium leading-relaxed">
                          {step.tip}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 mb-24">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-[#2D2D2D]">نصائح للنتائج المثالية</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {tips.map((tip, index) => (
                  <Card key={index} className="minimal-card p-6 hover:bg-[#FAF9F6]">
                    <div className="flex items-start space-x-4 rtl:space-x-reverse">
                      <div className="w-10 h-10 bg-[#E9E1D9] rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-[#2D2D2D]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#2D2D2D] mb-1">{tip.title}</h3>
                        <p className="text-[#5F5F5F] text-xs font-light">{tip.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-[#2D2D2D]">الأسئلة الشائعة</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index} className="minimal-card p-6">
                    <h3 className="font-bold text-[#2D2D2D] mb-2">{faq.question}</h3>
                    <p className="text-[#5F5F5F] text-sm font-light leading-relaxed">{faq.answer}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <Card className="p-16 bg-[#E9E1D9] border-none rounded-[4rem] text-center relative overflow-hidden group">
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <div className="w-24 h-24 bg-[#FAF9F6] rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-[#2D2D2D] fill-[#2D2D2D] ms-1" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-[#2D2D2D]">شاهد الطريقة في ثوانٍ</h2>
              <p className="text-[#5F5F5F] text-lg font-light">فيديو سريع يوضح لك كيف يمكنك تحويل صورك بضغطة واحدة.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="peachy-button bg-[#2D2D2D] text-[#FAF9F6] hover:bg-[#1A1A1A] h-14 px-10 rounded-full">
                      <Play className="w-5 h-5 ml-2" /> تشغيل الفيديو
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none rounded-3xl shadow-2xl">
                    <DialogHeader className="sr-only">
                      <DialogTitle>فيديو كيفية الاستخدام</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-video w-full relative group">
                      <video 
                        src="/tutorial.mp4" 
                        controls 
                        autoPlay
                        className="w-full h-full object-contain"
                      >
                        متصفحك لا يدعم تشغيل الفيديو.
                      </video>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button size="lg" variant="outline" className="rounded-full border-[#2D2D2D]/10 text-[#2D2D2D] hover:bg-white/20 h-14 px-10" onClick={() => window.location.href = '/'}>
                  ابدأ الآن
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tutorial;