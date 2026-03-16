import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Wand2 } from 'lucide-react';

// DEFINITIVE MAPPING - VERIFIED 2026-03-15 00:38
const GALLERY_ITEMS = [
  {
    id: 1,
    title: "بورتريه احترافي",
    category: "أشخاص",
    original: "/photo_2026-03-15_00-14-14.jpg", // Man with hat
    result: "/9554fc68-bd16-467c-9421-55d61728025b.png", // Man cutout
    desc: "عزل دقيق لخصلات الشعر الشقراء وتفاصيل القبعة بذكاء اصطناعي فائق."
  },
  {
    id: 2,
    title: "أحذية نايك",
    category: "منتجات",
    original: "/photo_2026-03-15_00-14-48.jpg", // Red sneaker
    result: "/455381dc-dc9c-4280-bb0f-ea3707a0f5ed.png", // Red sneaker cutout
    desc: "تجهيز صور المنتجات بخلفية شفافة تماماً، مثالية للمتاجر الإلكترونية."
  },
  {
    id: 3,
    title: "أزياء عصرية",
    category: "أشخاص",
    original: "/photo-1517841905240-472988babdf9.jpg", // Woman in denim
    result: "/b692b74d-9958-4e23-a111-a7dddc0e6519.png", // Woman in denim cutout
    desc: "معالجة دقيقة لملابس الجينز والأنسجة المعقدة مع الحفاظ على حواف النظارات."
  },
  {
    id: 4,
    title: "عاشقة للرياضة",
    category: "أشخاص",
    original: "/photo-1515886657613-9f3515b0c78f.jpg", // Woman in yellow
    result: "/830040b7-451b-4f0b-98f8-3ff8f7ef5996.png", // Woman in yellow cutout
    desc: "فصل الشخصية عن ملاعب كرة السلة بوضوح تام، مثالي للمحتوى الرياضي."
  },
  {
    id: 5,
    title: "ساعة ذكية",
    category: "منتجات",
    original: "/photo-1523275335684-37898b6baf30.jpg", // White watch
    result: "/10fbcb24-2584-4942-bacb-e67379c39044.png", // White watch cutout
    desc: "إبراز التفاصيل الهندسية الدقيقة والظلال الطبيعية للمنتجات التقنية."
  },
  {
    id: 6,
    title: "قطة فضولية",
    category: "حيوانات",
    original: "/photo-1514888286974-6c03e2ca1dba.jpg", // Cat
    result: "/47f53b3a-d3ce-41eb-954b-5bdebf41c262.png", // Cat cutout
    desc: "التعامل بذكاء مع فراء الحيوانات الدقيق لضمان نتيجة طبيعية واحترافية."
  }
];

const CATEGORIES = ["الكل", "أشخاص", "منتجات", "حيوانات"];

const GalleryCard = ({ img }: { img: typeof GALLERY_ITEMS[0] }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="minimal-card group cursor-default relative rounded-3xl overflow-hidden border-[#E9E1D9] hover:shadow-xl transition-all duration-500 bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[4/5] relative overflow-hidden bg-[#FAF9F6]">
        {/* Transparent Grid Base */}
        <div 
          className="absolute inset-0 z-0 opacity-20" 
          style={{ 
            backgroundImage: 'conic-gradient(#E9E1D9 90deg, #FAF9F6 90deg 180deg, #E9E1D9 180deg 270deg, #FAF9F6 270deg)',
            backgroundSize: '16px 16px' 
          }}
        ></div>
        
        {/* Result Image (Cutout) */}
        <div className={`absolute inset-0 z-10 transition-opacity duration-300 ease-in-out`}>
          <img 
            src={img.result} 
            alt={img.title} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Original Image (Original with Background) */}
        <div className={`absolute inset-0 z-20 transition-opacity duration-300 ease-in-out ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <img 
            src={img.original} 
            alt="Original" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Status Label */}
        <div className={`absolute top-6 right-6 z-30 px-5 py-2 backdrop-blur-xl text-white rounded-xl text-xs font-bold border border-white/20 shadow-2xl transition-all duration-300 ${isHovered ? 'bg-[#2D2D2D]/90' : 'bg-[#D2A084]/90'}`}>
          <span>{isHovered ? 'الأصل' : 'النتيجة'}</span>
        </div>

        {/* Action button */}
        <div className="absolute inset-x-0 bottom-0 z-40 p-6 translate-y-full group-hover:translate-y-0 transition-all duration-500 bg-gradient-to-t from-[#2D2D2D]/90 to-transparent">
          <Link to="/">
            <div className="peachy-button w-full h-12 text-sm bg-[#FAF9F6] text-[#2D2D2D] hover:bg-white border-none shadow-2xl">
              <Wand2 className="w-4 h-4 ml-2" />
              <span>جرب نفس التقنية</span>
            </div>
          </Link>
        </div>
      </div>
      
      <div className="p-6 space-y-2 bg-white relative z-50">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-[#2D2D2D] tracking-tight">{img.title}</h3>
          <span className="text-[9px] font-bold text-[#8B7E74] bg-[#E9E1D9]/30 px-3 py-1 rounded-full uppercase tracking-widest">
            {img.category}
          </span>
        </div>
        <p className="text-[#5F5F5F] text-sm font-light leading-relaxed">
          {img.desc}
        </p>
      </div>
    </Card>
  );
};

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filteredImages = activeCategory === "الكل" 
    ? GALLERY_ITEMS 
    : GALLERY_ITEMS.filter(img => img.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#FAF9F6]" dir="rtl">
      <Header />
      
      <main className="pt-16 pb-24 md:pt-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-6">
            <h1 className="text-5xl md:text-6xl font-black text-[#2D2D2D] tracking-tightest">دقة متناهية</h1>
            <p className="text-lg md:text-xl text-[#5F5F5F] font-light max-w-3xl mx-auto leading-relaxed">
              استكشف نتائج معالجة TrimBG وشاهد كيف يتعامل الذكاء الاصطناعي مع أدق التفاصيل في شتى أنواع الصور.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-8 h-12 text-sm font-bold transition-all duration-500 hover:scale-105 shadow-sm ${
                  activeCategory === cat 
                  ? "bg-[#2D2D2D] text-white shadow-lg ring-2 ring-[#2D2D2D]/10" 
                  : "border-[#E9E1D9] text-[#2D2D2D] hover:bg-white hover:border-[#2D2D2D]"
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Grid with stagger effect */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            {filteredImages.map((img) => (
              <GalleryCard key={img.id} img={img} />
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Gallery;