import { Card } from "@/components/ui/card";
import { Zap, Shield, Sparkles, Download, Clock, Heart } from 'lucide-react';

export const Features = () => {
  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "معالجة فورية",
      description: "إزالة الخلفية في ثوانٍ معدودة باستخدام أحدث تقنيات الذكاء الاصطناعي"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "خصوصية تامة",
      description: "جميع العمليات تتم في متصفحك، صورك لا تغادر جهازك أبداً"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "جودة احترافية",
      description: "نتائج بدقة عالية تنافس أدوات التصميم المدفوعة"
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: "تحميل بصيغة PNG",
      description: "احصل على صورك بخلفية شفافة جاهزة للاستخدام"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "متاح 24/7",
      description: "استخدم الأداة في أي وقت بدون قيود أو حدود"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "مجاني بالكامل",
      description: "لا رسوم، لا اشتراكات، لا علامات مائية"
    }
  ];

  return (
    <section className="section-container relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E9E1D9]/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-[#2D2D2D]">لماذا تختار <span className="text-[#8B7E74]">TrimBG؟</span></h2>
          <p className="text-[#5F5F5F] text-lg max-w-2xl mx-auto font-light">
            نجمع بين قوة الذكاء الاصطناعي وسهولة الاستخدام لنمنحك أفضل تجربة ممكنة.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="minimal-card p-10 group hover:-translate-y-2 transition-all duration-500"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-[#E9E1D9] rounded-3xl flex items-center justify-center text-[#2D2D2D] group-hover:scale-110 group-hover:bg-[#DED2C7] transition-all duration-300">
                  {feature.icon && (
                    <div className="w-10 h-10">
                      {feature.icon}
                    </div>
                  )}
                </div>
                <h4 className="text-2xl font-bold text-[#2D2D2D]">{feature.title}</h4>
                <p className="text-[#5F5F5F] leading-relaxed text-lg font-light">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};