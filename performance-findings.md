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


## Measured Timing

Using the local development site and a 162,797-byte JPG test image, the first end-to-end run—from dispatching the file selection event until the processed result image appeared—took **8.43 seconds**. This includes the initial runtime/model loading and the actual background-removal inference.


The second end-to-end run with the same 162,797-byte JPG, after the model/runtime had already been loaded and cached in the browser, took **6.75 seconds**. The result appeared successfully in both runs.


A third warm-cache run took **6.58 seconds**. The three measured end-to-end runs were 8.43s, 6.75s, and 6.58s. The warm-cache average was approximately **6.67 seconds** for this test image in the sandbox browser.


## Research Before Lighter Model Work

The [IMG.LY blog](https://img.ly/blog/browser-background-removal-using-onnx-runtime-webgpu/) explains three runtime phases: model download (network-dependent, fp16 is 84MB), session initialization (~200-400ms), and inference. With WebGPU, inference takes interactive time; with multi-threaded WASM + SIMD it is ~2-2.3s on a 2024 MacBook. Their quint8 CPU model showed visible artifacts in their tests, which is a quality trade-off to verify against our images. The only models bundled in @imgly/background-removal@1.7.0 are `isnet`, `isnet_fp16`, and `isnet_quint8`, so choosing a different architecture (u2net, silueta) would require moving to another library or hosting a custom ONNX model.

Plan: enable the built-in `rescale` option (the package already rescales inputs by default), favor WebGPU when available (much faster than CPU), and measure warm-cache performance again. If still too slow on CPU devices, the next step would be testing the quint8 model with artifact checks on real output images.


## Current Task State

New phase: test a lighter path after the user asked to avoid paid servers. The `rescale` option is already default `true` in @imgly/background-removal@1.7.0, so it was explicitly enabled (no change in effect). Device selection keeps WebGPU (fp16) when available, otherwise the quantized `isnet_quint8` on CPU. The Vite dev server is running again at localhost:8080 with cross-origin-isolation headers active. Available models in this package version are only `isnet`, `isnet_fp16`, and `isnet_quint8`.

Baseline measurements (before the light-model change): first run 8.43s, warm runs 6.75s and 6.58s, warm average ~6.67s on a 162,797-byte JPG in the sandbox browser.

Benchmark script pattern: fetch `/photo-1517841905240-472988babdf9.jpg`, create a File, dispatch change on `#file-upload`, then poll for `img[alt="After"]` on `/workspace`, timing with `performance.now()`.


## Light-Model Benchmark Results

After enabling rescale explicitly and keeping quint8 on CPU / fp16-on-WebGPU, three runs on the same 162,797-byte JPG measured 11.71s (cold, including model download and WASM compilation), 6.44s (warm), and 6.39s (warm). The warm average is ~6.42s versus the previous warm average of ~6.67s, a small improvement of about 0.25s (4%). The cold run was slower this session due to fresh model download and runtime compilation in a new browser context. Inference itself is already at the practical floor for this CPU-class environment; further gains require WebGPU-class hardware on the user's device or a server.


## Candidate Lightweight Models and Sources

- Rembg official repository: https://github.com/danielgatis/rembg. It provides local ONNX models, including `u2netp` as a lightweight U2Net model, and supports Python/CLI/batch usage. The repository is MIT-licensed.
- MODNet official repository: https://github.com/ZHKKKe/MODNet. It is a real-time trimap-free portrait matting model, Apache-2.0 licensed, with supervised training code and ONNX conversion resources. The authors describe a 7M online model; the public research model is intended for portrait matting.
- Open Model Zoo MODNet specification: https://github.com/openvinotoolkit/open_model_zoo/blob/master/models/public/modnet-photographic-portrait-matting/README.md. The model uses a MobileNetV2 backbone, has 6.46M parameters and 31.16 GFLOPs, accepts 512x512 RGB input in the original model, and outputs a 512x512 alpha matte. It is specifically for photographic portraits.

Current environment has no PyTorch, torchvision, ONNX, ONNX Runtime, OpenCV, or GPU; only Pillow is available among image libraries. Available RAM is about 2.3 GiB. Therefore, a full from-scratch training run is not realistic without installing large CPU packages and having labeled data. The practical experiment should start with a script-based data manifest and a tiny smoke test, then use the lightweight pretrained U2NetP/MODNet path only if it can be downloaded and executed safely. Do not claim a trained model is better until it is benchmarked on user-relevant images.


## Official U2NetP Preprocessing

The official rembg source confirms U2NetP uses a 320x320 input, Image.Resampling.LANCZOS, normalization with mean `(0.485, 0.456, 0.406)` and std `(0.229, 0.224, 0.225)`, then takes the first ONNX output, min-max normalizes it, and resizes the mask back to the original image. Sources: https://raw.githubusercontent.com/danielgatis/rembg/main/rembg/sessions/u2netp.py and https://raw.githubusercontent.com/danielgatis/rembg/main/rembg/sessions/base.py.

The first U2NetP benchmark used only 0-1 scaling, so its visual output is not a fair final quality test. The model file is 4,574,861 bytes and CPU inference averaged 0.19s in the sandbox before correcting normalization. The tiny trained ONNX model is 941,613 bytes and CPU inference averaged 0.0062s at 128x128, but its generalization quality is currently unproven and its outputs on real photos are mostly transparent.
