import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { removeBackground, loadImage, ProgressCallback } from '@/lib/backgroundRemover';
import { ImageComparison } from './ImageComparison';
import { Upload, Download, Wand2, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';

export const BackgroundRemover = () => {
  const { toast } = useToast();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "الملف غير مدعوم",
        description: "يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setOriginalImage(imageUrl);
    setProcessedImage(null);

    toast({
      title: "تم رفع الصورة بنجاح",
      description: "يمكنك الآن البدء في إزالة الخلفية",
    });
  };

  const processImage = useCallback(async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setProgress(0);
    
    // We assume the first time it stays at 0 for a while it's loading the model
    setIsLoadingModel(true);

    try {
      const response = await fetch(originalImage);
      const blob = await response.blob();
      const imageElement = await loadImage(blob);

      const onProgress: ProgressCallback = (p) => {
        setIsLoadingModel(false);
        setProgress(Math.round(p * 100));
      };

      const processedBlob = await removeBackground(imageElement, onProgress);
      const processedUrl = URL.createObjectURL(processedBlob);

      setProgress(100);
      setProcessedImage(processedUrl);

      toast({
        title: "اكتملت المعالجة!",
        description: "تمت إزالة الخلفية بدقة احترافية",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "فشلت العملية",
        description: "حدث خطأ أثناء معالجة الصورة. يرجى المحاولة لاحقاً",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsLoadingModel(false);
    }
  }, [originalImage, toast]);

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'pixelshift-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "تم التحميل",
      description: "تم حفظ الصورة في جهازك بنجاح",
    });
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setProgress(0);
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

  return (
    <div className="w-full max-w-6xl mx-auto p-6" dir="rtl">
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Upload/Original Area */}
        <Card className={`minimal-card p-4 md:p-10 transition-all duration-500 overflow-hidden ${dragActive ? 'border-[#E9E1D9] bg-[#E9E1D9]/10' : ''}`}>
          <div
            className="relative min-h-[420px] h-full flex flex-col items-center justify-center overflow-hidden rounded-2xl"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {originalImage ? (
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 relative overflow-hidden group">
                  <img
                    src={originalImage}
                    alt="Original Content"
                    className="w-full h-full object-contain rounded-xl"
                  />
                  {!isProcessing && (
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" />
                        <div className="peachy-button px-6 py-3 shadow-xl h-12 text-sm bg-white/90 backdrop-blur-sm text-[#2D2D2D] hover:bg-white border-none">
                          <Upload className="w-4 h-4" />
                          تغيير الصورة
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-8 p-12 w-full border-2 border-dashed border-[#E9E1D9] bg-[#FAF9F6] rounded-3xl group hover:border-[#8B7E74]/50 transition-colors">
                <div className="w-24 h-24 mx-auto bg-[#E9E1D9]/50 rounded-[2.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <ImageIcon className="w-12 h-12 text-[#2D2D2D]/60" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-[#2D2D2D]">ارفع صورتك هنا</h3>
                  <p className="text-[#5F5F5F] text-lg font-light leading-relaxed">
                    اسحب وأفلت الصورة مباشرة، أو اضغط للاختيار من جهازك
                  </p>
                </div>
                <label className="cursor-pointer inline-block mt-4">
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" />
                  <div className="peachy-button px-10 h-14 text-xl group/btn">
                    <Upload className="w-6 h-6 transition-transform group-hover/btn:-translate-y-1" />
                    <span>اختر صورة</span>
                  </div>
                </label>
                <p className="text-xs text-[#5F5F5F] pt-4">يدعم JPG, PNG, WEBP حتى 10 ميجابايت</p>
              </div>
            )}
          </div>
        </Card>

        {/* Action/Result Area */}
        <div className="flex flex-col gap-8">
          <Card className="minimal-card p-4 md:p-10 flex-1 relative overflow-hidden">
            {processedImage ? (
              <div className="space-y-8 h-full flex flex-col">
                <div className="flex-1 relative overflow-hidden rounded-2xl bg-[#f0f0f0] border-2 border-[#E9E1D9]/30 min-h-[400px]">
                  {/* Result Image with Checkerboard Background */}
                  <div className="absolute inset-0 checkerboard-bg flex items-center justify-center p-6">
                    <img
                      src={processedImage}
                      alt="Result"
                      className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in zoom-in-95 duration-500"
                    />
                  </div>
                  
                  {/* Result Label */}
                  <div className="absolute top-4 right-4 bg-[#2D2D2D]/80 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/10 z-10">
                    النتيجة النهائية
                  </div>

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
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-auto">
                    <Button onClick={downloadImage} className="peachy-button bg-[#2D2D2D] text-white hover:bg-black w-full sm:w-auto px-10 h-14 text-lg">
                      <Download className="w-5 h-5 ml-3" />
                      تحميل النتيجة (PNG)
                    </Button>
                    <Button variant="ghost" onClick={reset} className="text-[#5F5F5F] hover:text-[#2D2D2D] rounded-full h-14 px-8">
                      <RefreshCw className="w-5 h-5 ml-2" />
                      البدء من جديد
                    </Button>
                </div>
              </div>
            ) : isProcessing ? (
              <div className="h-full flex flex-col items-center justify-center space-y-12">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-[#E9E1D9] border-t-[#2D2D2D] rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wand2 className="w-12 h-12 text-[#2D2D2D]" />
                  </div>
                </div>
                
                <div className="text-center space-y-8 w-full max-w-sm">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-[#2D2D2D]">
                      {isLoadingModel ? "جاري تحميل محرك الذكاء الاصطناعي..." : "جاري المعالجة بدقة..."}
                    </h3>
                    <p className="text-[#5F5F5F] font-light">
                      {isLoadingModel ? "يتم التحميل لأول مرة فقط، يرجى الانتظار ثوانٍ" : "قد تستغرق العملية 10-20 ثانية حسب قوة جهازك"}
                    </p>
                  </div>
                  
                  {!isLoadingModel && (
                    <div className="space-y-2">
                       <Progress value={progress} className="h-3 bg-[#E9E1D9]/40" />
                       <span className="text-sm font-bold text-[#2D2D2D]">{progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-8 opacity-40">
                <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center">
                  <Wand2 className="w-12 h-12 text-slate-300" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-400">منطقة النتيجة</h3>
                  <p className="text-slate-400 max-w-xs leading-relaxed">
                    بعد رفع صورتك، اضغط على زر المعالجة لرؤية النتيجة هنا مباشرة.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {originalImage && !processedImage && !isProcessing && (
            <Card className="minimal-card p-8 bg-[#E9E1D9]/30 border-none animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col gap-6 text-center">
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-[#2D2D2D]">جاهز للتحويل؟</h4>
                  <p className="text-[#5F5F5F] font-light">بدقة 4K وخصوصية تامة 100%</p>
                </div>
                <Button 
                  onClick={processImage} 
                  className="peachy-button bg-[#2D2D2D] text-white hover:bg-black h-16 text-xl rounded-2xl shadow-xl w-full"
                >
                  <Wand2 className="w-6 h-6 ml-4" />
                  إزالة الخلفية الآن
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};