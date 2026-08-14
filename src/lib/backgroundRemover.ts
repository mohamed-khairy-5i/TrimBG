export type ProgressCallback = (progress: number) => void;

type ImglyModule = typeof import('@imgly/background-removal');
type RemovalConfig = Parameters<ImglyModule['removeBackground']>[1];

let imglyModulePromise: Promise<ImglyModule> | null = null;
let preloadPromise: Promise<void> | null = null;

const loadImgly = (): Promise<ImglyModule> => {
  // Keep one shared import promise so concurrent uploads do not initialize the
  // ONNX runtime more than once.
  if (!imglyModulePromise) {
    imglyModulePromise = import('@imgly/background-removal');
  }

  return imglyModulePromise;
};

const supportsWebGPU = (): boolean => {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
};

const createConfig = (onProgress?: ProgressCallback): RemovalConfig => {
  const useGpu = supportsWebGPU();

  return {
    // WebGPU devices run the fp16 model on the GPU, which is roughly 20x
    // faster than the CPU path in IMG.LY's benchmarks. CPU-only devices use
    // the quantized model, which downloads and processes faster at the cost
    // of slightly reduced edge quality on difficult content.
    model: useGpu ? 'isnet_fp16' : 'isnet_quint8',
    device: useGpu ? 'gpu' : 'cpu',
    // Built-in rescaling shrinks large photos before inference, keeping the
    // mask prediction fast while the final cutout is restored to full size.
    rescale: true,
    proxyToWorker: true,
    debug: false,
    output: {
      format: 'image/png',
      quality: 0.92,
    },
    progress: (_key: string, current: number, total: number) => {
      if (onProgress && total > 0) {
        onProgress(Math.max(0, Math.min(1, current / total)));
      }
    },
  } as RemovalConfig;
};

/**
 * Preloads the runtime and model once. Calling this when the workspace opens
 * moves the model download out of the user's click-to-result critical path.
 */
export const preloadBackgroundRemoval = (onProgress?: ProgressCallback): Promise<void> => {
  if (!preloadPromise) {
    preloadPromise = loadImgly()
      .then(({ preload }) => preload(createConfig(onProgress)))
      .catch((error) => {
        // Allow a later user action to retry if a transient preload failed.
        preloadPromise = null;
        throw error;
      });
  }

  return preloadPromise;
};

/**
 * Removes the background without converting the image to a base64 data URL.
 * Passing the original Blob avoids an extra full-size canvas copy and reduces
 * memory pressure for large phone photos.
 */
export const removeBackground = async (
  image: Blob | HTMLImageElement,
  onProgress?: ProgressCallback,
): Promise<Blob> => {
  // If the workspace started preloading, wait for the same shared promise
  // instead of initializing a second ONNX session on button click.
  if (preloadPromise) {
    try {
      await preloadPromise;
    } catch {
      // The removal call below can retry after a transient preload failure.
    }
  }

  const imgly = await loadImgly();
  const removeFn = imgly.removeBackground || (imgly as unknown as { default: ImglyModule['removeBackground'] }).default;

  if (typeof removeFn !== 'function') {
    throw new Error('Background removal function not found in the library exports.');
  }

  let source: Blob | HTMLImageElement = image;

  // Keep backwards compatibility for the existing component while avoiding
  // canvas.toDataURL() whenever the caller already has the original Blob.
  if (image instanceof HTMLImageElement) {
    const response = await fetch(image.currentSrc || image.src);
    source = await response.blob();
  }

  return removeFn(source, createConfig(onProgress));
};

/** Loads an image element for legacy UI paths that need intrinsic dimensions. */
export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image element'));
    };
    img.src = url;
  });
};
