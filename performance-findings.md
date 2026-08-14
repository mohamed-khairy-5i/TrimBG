# TrimBG Performance Findings

## Diagnosis

The current app uses `@imgly/background-removal@1.7.0` in the browser. The original implementation dynamically imported the library on the first click, copied every image into a full-size canvas, converted it to a base64 PNG data URL, and then called the model. This introduced unnecessary CPU, memory, and conversion work for large images.

The package documentation states that its ONNX and WASM assets are fetched on the first run and cached afterward. It supports `preload`, `device: 'gpu' | 'cpu'`, and the lighter `isnet_quint8` model. The package also benefits from cross-origin isolation for SharedArrayBuffer and WebAssembly multi-threading.

## Implemented Changes

1. Added one shared dynamic-import promise so the runtime is loaded once.
2. Added model preloading after image selection, before the user presses the processing button.
3. Passed the original `Blob` directly to the model instead of converting it through `canvas.toDataURL()`.
4. Enabled the GPU provider when WebGPU is available; otherwise selected the lighter quantized CPU model.
5. Enabled worker proxying and retained PNG output.
6. Added Netlify `_headers` and Vite server/preview headers for cross-origin isolation.
7. Revoked temporary object URLs in `loadImage` to avoid leaks.

## Validation

- `npm run build`: passed.
- `npx tsc --noEmit -p tsconfig.app.json`: passed.
- Local page loaded successfully at `/` and `/workspace`.
- A local test image was uploaded through the UI and produced a processed result.
- Before isolation headers were active in the development process, the browser warned that WASM multi-threading fell back to single-threading; the added headers target this issue in Netlify production and new Vite processes.

## Remaining Baseline Warnings

The repository's existing ESLint configuration reports unrelated pre-existing errors in UI boilerplate and `tailwind.config.ts`. These were not introduced by the performance changes. The build and TypeScript checks pass.


## Final Browser Check

After restarting the Vite process with the new headers, the browser reported `crossOriginIsolated: true` and `SharedArrayBuffer` available. This confirms that the local test environment can use the multi-threaded WebAssembly path instead of the previous single-thread fallback.
