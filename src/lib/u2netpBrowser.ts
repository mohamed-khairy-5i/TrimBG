import * as ort from 'onnxruntime-web/wasm';

const DEFAULT_MODEL_URL = '/models/u2netp/u2netp.onnx';
const FP16_MODEL_URL = '/models/u2netp/u2netp-fp16.onnx';
const WASM_MODULE_URL = new URL('../assets/onnxruntime/ort-wasm-simd-threaded.mjs', import.meta.url);
const WASM_BINARY_URL = new URL('../assets/onnxruntime/ort-wasm-simd-threaded.wasm', import.meta.url);
const INPUT_SIZE = 320;

export type U2NetpVariant = 'fp32' | 'fp16';

const sessionPromises: Partial<Record<U2NetpVariant, Promise<ort.InferenceSession>>> = {};
let runtimeConfigured = false;

export interface U2NetpTiming {
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

function getBenchmarkVariant(): U2NetpVariant {
  return new URLSearchParams(window.location.search).get('fp16') === '1' ? 'fp16' : 'fp32';
}

function getSession(variant: U2NetpVariant = getBenchmarkVariant()): Promise<ort.InferenceSession> {
  configureRuntime();
  const existing = sessionPromises[variant];
  if (existing) return existing;

  const modelUrl = variant === 'fp16' ? FP16_MODEL_URL : DEFAULT_MODEL_URL;
  const sessionPromise = ort.InferenceSession.create(modelUrl, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  }).catch((error) => {
    delete sessionPromises[variant];
    throw error;
  });
  sessionPromises[variant] = sessionPromise;
  return sessionPromise;
}

export function preloadU2Netp(variant: U2NetpVariant = getBenchmarkVariant()): Promise<void> {
  return getSession(variant).then(() => undefined);
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
    data[i] = pixels[source] / 255;
    data[plane + i] = pixels[source + 1] / 255;
    data[plane * 2 + i] = pixels[source + 2] / 255;
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
  const normalized = new Float32Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    let value = values[i];
    if (min < 0 || max > 1) value = 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));
    normalized[i] = value;
  }
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (const value of normalized) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  const result = new Uint8ClampedArray(values.length);
  for (let i = 0; i < values.length; i += 1) {
    const value = (normalized[i] - low) / Math.max(high - low, 1e-6);
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
    outputCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode U2NetP output.')), 'image/png');
  });
}

export async function removeBackgroundWithU2Netp(
  blob: Blob,
  options: { variant?: U2NetpVariant } = {},
): Promise<{ blob: Blob; timing: U2NetpTiming }> {
  const totalStart = performance.now();
  const bitmap = await createImageBitmap(blob);
  try {
    const session = await getSession(options.variant);
    const input = imageToTensor(bitmap);
    const inferenceStart = performance.now();
    const outputs = await session.run({ [session.inputNames[0]]: input });
    const inferenceMs = performance.now() - inferenceStart;
    const output = outputs[session.outputNames[0]];
    if (!output || !(output.data instanceof Float32Array)) throw new Error('Unexpected U2NetP output tensor.');
    const result = await renderResult(bitmap, output.data);
    return { blob: result, timing: { totalMs: performance.now() - totalStart, inferenceMs } };
  } finally {
    bitmap.close();
  }
}
