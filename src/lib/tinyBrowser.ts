import * as ort from 'onnxruntime-web/wasm';

const MODEL_URL = '/models/tiny-matting-distill-rmbg-400/tiny_matting_128.onnx';
const WASM_MODULE_URL = new URL('../assets/onnxruntime/ort-wasm-simd-threaded.mjs', import.meta.url);
const WASM_BINARY_URL = new URL('../assets/onnxruntime/ort-wasm-simd-threaded.wasm', import.meta.url);
const INPUT_SIZE = 128;

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let runtimeConfigured = false;

export interface TinyTiming {
  totalMs: number;
  inferenceMs: number;
}

function configureRuntime(): void {
  if (runtimeConfigured) return;
  ort.env.wasm.wasmPaths = { mjs: WASM_MODULE_URL, wasm: WASM_BINARY_URL };
  ort.env.wasm.simd = true;
  const isolated = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
  const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1;
  ort.env.wasm.numThreads = isolated ? Math.max(1, Math.min(4, hardwareConcurrency)) : 1;
  runtimeConfigured = true;
}

function getSession(): Promise<ort.InferenceSession> {
  configureRuntime();
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    }).catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

export function preloadTinyMatting(): Promise<void> {
  return getSession().then(() => undefined);
}

function imageToTensor(bitmap: ImageBitmap): ort.Tensor {
  const canvas = document.createElement('canvas');
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Could not create a 2D canvas context.');
  context.drawImage(bitmap, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const pixels = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
  const planeSize = INPUT_SIZE * INPUT_SIZE;
  const data = new Float32Array(3 * planeSize);
  for (let i = 0; i < planeSize; i += 1) {
    const source = i * 4;
    data[i] = pixels[source] / 255;
    data[planeSize + i] = pixels[source + 1] / 255;
    data[2 * planeSize + i] = pixels[source + 2] / 255;
  }
  return new ort.Tensor('float32', data, [1, 3, INPUT_SIZE, INPUT_SIZE]);
}

function renderResult(bitmap: ImageBitmap, values: Float32Array | number[]): Promise<Blob> {
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = INPUT_SIZE;
  maskCanvas.height = INPUT_SIZE;
  const maskContext = maskCanvas.getContext('2d');
  if (!maskContext) throw new Error('Could not create mask canvas context.');
  const maskImage = new ImageData(INPUT_SIZE, INPUT_SIZE);
  for (let i = 0; i < values.length; i += 1) {
    const alpha = Math.max(0, Math.min(255, Math.round(Number(values[i]) * 255)));
    const offset = i * 4;
    maskImage.data[offset] = 255;
    maskImage.data[offset + 1] = 255;
    maskImage.data[offset + 2] = 255;
    maskImage.data[offset + 3] = alpha;
  }
  maskContext.putImageData(maskImage, 0, 0);

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = bitmap.width;
  outputCanvas.height = bitmap.height;
  const outputContext = outputCanvas.getContext('2d');
  if (!outputContext) throw new Error('Could not create output canvas context.');
  outputContext.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
  outputContext.globalCompositeOperation = 'destination-in';
  outputContext.imageSmoothingEnabled = true;
  outputContext.drawImage(maskCanvas, 0, 0, bitmap.width, bitmap.height);
  outputContext.globalCompositeOperation = 'source-over';
  return new Promise((resolve, reject) => {
    outputCanvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not encode PNG.')), 'image/png');
  });
}

export async function removeBackgroundWithTinyMatting(blob: Blob): Promise<{ blob: Blob; timing: TinyTiming }> {
  const totalStart = performance.now();
  const bitmap = await createImageBitmap(blob);
  try {
    const session = await getSession();
    const input = imageToTensor(bitmap);
    const inferenceStart = performance.now();
    const outputs = await session.run({ [session.inputNames[0]]: input });
    const inferenceMs = performance.now() - inferenceStart;
    const output = outputs[session.outputNames[0]];
    if (!output || !(output.data instanceof Float32Array)) throw new Error('Unexpected tiny model output tensor.');
    const result = await renderResult(bitmap, output.data);
    return { blob: result, timing: { totalMs: performance.now() - totalStart, inferenceMs } };
  } finally {
    bitmap.close();
  }
}
