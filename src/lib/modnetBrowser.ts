import * as ort from 'onnxruntime-web/wasm';

const MODEL_URL = '/models/modnet/model_quantized.onnx';
const WASM_MODULE_URL = new URL('../assets/onnxruntime/ort-wasm-simd-threaded.mjs', import.meta.url);
const WASM_BINARY_URL = new URL('../assets/onnxruntime/ort-wasm-simd-threaded.wasm', import.meta.url);
const INPUT_SIZE = 256;

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let runtimeConfigured = false;

export interface ModnetTiming {
  totalMs: number;
  inferenceMs: number;
}

function configureRuntime(): void {
  if (runtimeConfigured) return;
  ort.env.wasm.wasmPaths = { mjs: WASM_MODULE_URL, wasm: WASM_BINARY_URL };
  ort.env.wasm.simd = true;
  ort.env.wasm.numThreads = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated
    ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1))
    : 1;
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

export function preloadModnet(): Promise<void> {
  return getSession().then(() => undefined);
}

function imageToTensor(bitmap: ImageBitmap): ort.Tensor {
  const canvas = document.createElement('canvas');
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Could not create a canvas context.');
  context.drawImage(bitmap, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const pixels = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
  const plane = INPUT_SIZE * INPUT_SIZE;
  const data = new Float32Array(plane * 3);
  for (let i = 0; i < plane; i += 1) {
    const source = i * 4;
    data[i] = pixels[source] / 127.5 - 1;
    data[plane + i] = pixels[source + 1] / 127.5 - 1;
    data[plane * 2 + i] = pixels[source + 2] / 127.5 - 1;
  }
  return new ort.Tensor('float32', data, [1, 3, INPUT_SIZE, INPUT_SIZE]);
}

function normalizeOutput(values: Float32Array | number[]): Uint8ClampedArray {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const result = new Uint8ClampedArray(values.length);
  for (let i = 0; i < values.length; i += 1) {
    let value = values[i];
    if (min < 0 || max > 1) value = 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));
    result[i] = Math.max(0, Math.min(255, Math.round(value * 255)));
  }
  return result;
}

async function renderResult(bitmap: ImageBitmap, maskValues: Float32Array | number[]): Promise<Blob> {
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = INPUT_SIZE;
  maskCanvas.height = INPUT_SIZE;
  const maskContext = maskCanvas.getContext('2d');
  if (!maskContext) throw new Error('Could not create a mask canvas context.');
  const alpha = normalizeOutput(maskValues);
  const maskImage = new ImageData(INPUT_SIZE, INPUT_SIZE);
  for (let i = 0; i < alpha.length; i += 1) {
    const offset = i * 4;
    maskImage.data[offset] = 255;
    maskImage.data[offset + 1] = 255;
    maskImage.data[offset + 2] = 255;
    maskImage.data[offset + 3] = alpha[i];
  }
  maskContext.putImageData(maskImage, 0, 0);

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = bitmap.width;
  outputCanvas.height = bitmap.height;
  const outputContext = outputCanvas.getContext('2d');
  if (!outputContext) throw new Error('Could not create an output canvas context.');
  outputContext.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
  outputContext.globalCompositeOperation = 'destination-in';
  outputContext.imageSmoothingEnabled = true;
  outputContext.drawImage(maskCanvas, 0, 0, bitmap.width, bitmap.height);
  return new Promise((resolve, reject) => {
    outputCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode MODNet output.')), 'image/png');
  });
}

export async function removeBackgroundWithModnet(blob: Blob): Promise<{ blob: Blob; timing: ModnetTiming }> {
  const totalStart = performance.now();
  const bitmap = await createImageBitmap(blob);
  try {
    const session = await getSession();
    const input = imageToTensor(bitmap);
    const inferenceStart = performance.now();
    const outputs = await session.run({ [session.inputNames[0]]: input });
    const inferenceMs = performance.now() - inferenceStart;
    const output = outputs[session.outputNames[0]];
    if (!output || !(output.data instanceof Float32Array)) throw new Error('Unexpected MODNet output tensor.');
    const result = await renderResult(bitmap, output.data);
    return { blob: result, timing: { totalMs: performance.now() - totalStart, inferenceMs } };
  } finally {
    bitmap.close();
  }
}
