import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { removeBackground, preloadBackgroundRemoval, ProgressCallback } from '@/lib/backgroundRemover';
import { preloadU2Netp, removeBackgroundWithU2Netp } from '@/lib/u2netpBrowser';

export type ProcessingMode = 'quality' | 'fast';

interface WorkspaceContextType {
  originalImage: string | null;
  processedImage: string | null;
  isProcessing: boolean;
  isLoadingModel: boolean;
  progress: number;
  processingMode: ProcessingMode;
  setOriginalImage: (url: string | null) => void;
  setProcessingMode: (mode: ProcessingMode) => void;
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
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('quality');
  const operationIdRef = useRef(0);

  // Begin model initialization after an image is selected, so the Remove
  // button does not carry the full download cost in its critical path.
  useEffect(() => {
    if (!originalImage) return;
    if (processingMode === 'fast') {
      void preloadU2Netp('fp16');
    } else {
      void preloadBackgroundRemoval();
    }
  }, [originalImage, processingMode]);

  const processImage = useCallback(async () => {
    if (!originalImage) return;

    const operationId = ++operationIdRef.current;
    setIsProcessing(true);
    setProgress(0);
    setIsLoadingModel(true);

    try {
      const response = await fetch(originalImage);
      const blob = await response.blob();
      let processedBlob: Blob;
      if (processingMode === 'fast') {
        // U2NetP has no download-progress callback; show the inference state
        // after the image blob is ready and use the production FP16 artifact.
        setIsLoadingModel(false);
        setProgress(20);
        const result = await removeBackgroundWithU2Netp(blob, { variant: 'fp16' });
        console.info('[TrimBG] U2NetP FP16 timing', result.timing);
        processedBlob = result.blob;
      } else {
        const onProgress: ProgressCallback = (p) => {
          setIsLoadingModel(false);
          setProgress(Math.round(p * 100));
        };
        processedBlob = await removeBackground(blob, onProgress);
      }
      if (operationId !== operationIdRef.current) return;
      const processedUrl = URL.createObjectURL(processedBlob);

      setProgress(100);
      setProcessedImage(processedUrl);

      toast({
        title: "اكتملت المعالجة!",
        description: processingMode === 'fast'
          ? "تمت إزالة الخلفية بسرعة على جهازك"
          : "تمت إزالة الخلفية بدقة احترافية",
      });
    } catch (error) {
      if (operationId !== operationIdRef.current) return;
      console.error('Error processing image:', error);
      toast({
        title: "فشلت العملية",
        description: "حدث خطأ أثناء معالجة الصورة. يرجى المحاولة لاحقاً",
        variant: "destructive",
      });
    } finally {
      if (operationId === operationIdRef.current) {
        setIsProcessing(false);
        setIsLoadingModel(false);
      }
    }
  }, [originalImage, processingMode, toast]);

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
    operationIdRef.current += 1;
    if (originalImage?.startsWith('blob:')) URL.revokeObjectURL(originalImage);
    if (processedImage?.startsWith('blob:')) URL.revokeObjectURL(processedImage);
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
      processingMode,
      setOriginalImage,
      setProcessingMode,
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
