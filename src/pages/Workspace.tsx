import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Home, ChevronRight, Share2, Layers, Sparkles } from 'lucide-react';
import { ImageComparison } from '@/components/ImageComparison';
import { Progress } from '@/components/ui/progress';
import Logo from '@/components/Logo';

const Workspace = () => {
  const navigate = useNavigate();
  const { 
    originalImage, 
    processedImage, 
    isProcessing, 
    isLoadingModel, 
    progress, 
    reset, 
    downloadImage,
    processImage 
  } = useWorkspace();

  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide' | 'result'>('slider');

  // Trigger processing if it hasn't started and we have an image
  React.useEffect(() => {
    if (originalImage && !processedImage && !isProcessing) {
      processImage();
    }
  }, [originalImage, processedImage, isProcessing, processImage]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TrimBG - إزالة خلفية الصور',
          text: 'قم بإزالة خلفية أي صورة في ثوانٍ مجاناً وبأعلى جودة!',
          url: window.location.origin,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.origin);
      alert('تم نسخ رابط الموقع إلى الحافظة!');
    }
  };

  if (!originalImage) {
    navigate('/');
    return null;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#FAF9F6] overflow-hidden" dir="rtl">
      {/* Workspace Navbar */}
      <header className="h-16 px-6 bg-white border-b border-[#E9E1D9]/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <div className="hidden sm:h-6 sm:w-px sm:bg-[#E9E1D9]"></div>
          <span className="text-[#5F5F5F] text-sm font-medium hidden sm:inline">بيئة العمل</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-[#5F5F5F] hover:text-[#2D2D2D] text-sm gap-2"
          >
            <Home className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">العودة للرئيسية</span>
          </Button>
          <Button 
            onClick={handleShare}
            className="peachy-button bg-[#2D2D2D] text-white hover:bg-black h-10 px-6 text-sm"
          >
              <span className="hidden sm:inline ml-2">مشاركة</span>
              <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Canvas Area */}
        <main className="flex-[1.5] lg:flex-1 relative bg-[#F0F0F0] overflow-hidden flex flex-col min-h-[350px] lg:min-h-0">
          {/* View Toggle */}
          <div className="absolute top-4 lg:top-6 left-1/2 -translate-x-1/2 z-20 bg-white/80 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-white flex gap-1">
             <button 
                onClick={() => setViewMode('slider')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'slider' ? 'bg-[#2D2D2D] text-white' : 'text-[#5F5F5F] hover:bg-black/5'}`}
             >
                منزلق المقارنة
             </button>
             <button 
                onClick={() => setViewMode('result')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'result' ? 'bg-[#2D2D2D] text-white' : 'text-[#5F5F5F] hover:bg-black/5'}`}
             >
                النتيجة فقط
             </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12">
            <div className="w-full h-full max-w-5xl relative">
              {isProcessing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 bg-white/50 backdrop-blur-sm rounded-3xl">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-[#E9E1D9] border-t-[#2D2D2D] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Layers className="w-8 h-8 text-[#2D2D2D] animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-4 max-w-xs">
                    <h3 className="text-xl font-bold text-[#2D2D2D]">
                       {isLoadingModel ? "جاري تجهيز محرك الذكاء الاصطناعي..." : "جاري إزالة الخلفية..."}
                    </h3>
                    {!isLoadingModel && (
                      <div className="space-y-2">
                        <Progress value={progress} className="h-2 bg-[#E9E1D9]" />
                        <span className="text-sm font-black text-[#2D2D2D]">{progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : processedImage ? (
                viewMode === 'slider' ? (
                  <ImageComparison before={originalImage} after={processedImage} />
                ) : (
                  <div className="w-full h-full rounded-3xl shadow-2xl overflow-hidden bg-white border-4 border-white checkerboard-bg flex items-center justify-center">
                    <img src={processedImage} alt="Result" className="max-w-full max-h-full object-contain p-8 drop-shadow-2xl" />
                  </div>
                )
              ) : null}
            </div>
          </div>

          {/* Canvas Styles */}
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
        </main>

        {/* Workspace Sidebar */}
        <aside className="flex-1 lg:flex-none lg:w-[340px] bg-white border-t lg:border-t-0 lg:border-r border-[#E9E1D9]/50 flex flex-col z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] lg:shadow-[-10px_0_30px_rgba(0,0,0,0.02)] overflow-y-auto">
          <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 flex-1">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#2D2D2D] flex items-center gap-2">
                <Download className="w-5 h-5 text-[#8B7E74]" />
                عمليات التصدير
              </h3>
              <Button 
                onClick={downloadImage} 
                className="w-full peachy-button bg-[#2D2D2D] text-white hover:bg-black h-12 lg:h-14 text-base lg:text-lg rounded-2xl shadow-xl shadow-black/10"
                disabled={!processedImage || isProcessing}
              >
                تحميل النتيجة (PNG)
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { reset(); navigate('/'); }}
                className="w-full border-[#E9E1D9] text-[#5F5F5F] hover:bg-black/5 h-14 rounded-2xl gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                البدء من جديد
              </Button>
            </div>

            <div className="h-px bg-[#E9E1D9]/50"></div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#2D2D2D] uppercase tracking-wider">تعديل الخلفية</h3>
                <span className="text-[10px] bg-[#E9E1D9] text-[#2D2D2D] px-2 py-0.5 rounded-full font-black">قريباً</span>
              </div>
              <div className="flex gap-3">
                {['#FFFFFF', '#000000', '#FF5A5F', '#08A045', '#121212'].map((color) => (
                  <div 
                    key={color} 
                    className="w-10 h-10 rounded-full border border-[#E9E1D9] cursor-not-allowed opacity-40 hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="w-10 h-10 rounded-full border border-[#E9E1D9] flex items-center justify-center cursor-not-allowed opacity-40 bg-slate-50">
                   <ChevronRight className="w-4 h-4 text-[#5F5F5F]" />
                </div>
              </div>
            </div>

            <div className="bg-[#FAF9F6] p-4 lg:p-6 rounded-3xl space-y-3 border border-[#E9E1D9]/50">
               <div className="flex items-center gap-2 text-[#2D2D2D] font-bold text-sm">
                 <Sparkles className="w-4 h-4 text-[#8B7E74]" />
                 نصيحة الخبراء
               </div>
               <p className="text-[11px] lg:text-xs text-[#5F5F5F] leading-relaxed">
                 استخدم خلفيات سادة في الصور الأصلية للحصول على أدق النتائج في تفاصيل الشعر والأطراف.
               </p>
            </div>
          </div>

          <div className="p-6 bg-[#FAF9F6] border-t border-[#E9E1D9]/30 text-center">
             <p className="text-[10px] text-[#8B7E74] font-medium">
               جميع المعالجات تتم محلياً على جهازك - خصوصية 100%
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Workspace;
