export type ProgressCallback = (progress: number) => void;

/**
 * دالة إزالة الخلفية باستخدام محرك IMG.LY المتقدم (المستوى العالمي)
 */
export const removeBackground = async (imageElement: HTMLImageElement, onProgress?: ProgressCallback): Promise<Blob> => {
  try {
    console.log('Initiating IMG.LY SOTA Background Removal...');

    // تحميل المكتبة 
    const imgly = await import('@imgly/background-removal');

    // استخراج الدالة الصحيحة (تدعم التصدير الافتراضي أو المسمى)
    const removeFn = imgly.removeBackground || (imgly as any).default;

    if (typeof removeFn !== 'function') {
      console.error('Available exports in @imgly/background-removal:', Object.keys(imgly));
      throw new Error('Background removal function not found in the library exports.');
    }

    // تجهيز بيانات الصورة كـ URL لتسهيل المعالجة
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');
    ctx.drawImage(imageElement, 0, 0);
    const imageData = canvas.toDataURL('image/png');

    const config: any = {
      progress: (key: string, current: number, total: number) => {
        console.log(`Phase: ${key}, Progress: ${current}/${total}`);
        if (onProgress) {
          onProgress(current / total);
        }
      },
      output: {
        format: 'image/png',
        quality: 1.0
      }
    };

    // تنفيذ المعالجة الحقيقية
    const resultBlob = await removeFn(imageData, config);
    console.log('Background removed successfully by IMG.LY');
    return resultBlob;
  } catch (error) {
    console.error('Error during background removal:', error);
    throw error;
  }
};

/**
 * دالة مساعدة لتحميل الصور
 */
export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image element'));
    const url = URL.createObjectURL(file);
    img.src = url;
  });
};
