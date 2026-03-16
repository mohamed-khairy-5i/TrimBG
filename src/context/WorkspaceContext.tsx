import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { removeBackground, loadImage, ProgressCallback } from '@/lib/backgroundRemover';

interface WorkspaceContextType {
  originalImage: string | null;
  processedImage: string | null;
  isProcessing: boolean;
  isLoadingModel: boolean;
  progress: number;
  setOriginalImage: (url: string | null) => void;
  processImage: () => Promise<void>;
  reset: () => void;
  downloadImage: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [progress, setProgress] = useState(0);

  const processImage = useCallback(async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setProgress(0);
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
    link.download = 'trimbg-result.png';
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
    setIsProcessing(false);
    setIsLoadingModel(false);
  };

  return (
    <WorkspaceContext.Provider value={{
      originalImage,
      processedImage,
      isProcessing,
      isLoadingModel,
      progress,
      setOriginalImage,
      processImage,
      reset,
      downloadImage
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
