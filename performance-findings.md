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


## Public Dataset Candidates for Expansion

Search found several public sources that may provide real images with alpha mattes or masks instead of duplicating the seven local foregrounds:

| Dataset/source | URL | Relevance |
|---|---|---|
| withoutBG100 | https://withoutbg.com/tech/datasets/withoutbg100 | 100 high-quality image/alpha-matte pairs curated for background removal; useful for a small controlled expansion if the download/license terms permit. |
| Alpha Matting dataset | https://alphamatting.com/datasets.php | Classic image matting dataset with publicly available ground-truth alpha; useful for evaluating fine boundaries and hair, subject to its stated terms. |
| AIM-500 | https://github.com/JizhiziLi/AIM | Natural image matting dataset with a public download route; potentially useful for broader foreground diversity. |
| MODNet / portrait matting references | https://github.com/ZHKKKe/MODNet | Useful when the product is portrait-focused; not a general object-removal dataset. |

The dataset choice must respect each source's license and download terms. The local project currently has only seven RGBA foreground assets and six background photos, so generating many more composites from those same assets would increase quantity but not semantic diversity. The next practical step is to add a real public alpha-matte subset, then reserve distinct subjects for validation to avoid measuring memorization.


## Large-data training experiment

The expanded generator created 6,000 training composites and 600 validation composites from seven local transparent foregrounds and six local backgrounds, with stronger variation in scale, rotation, cropping, blur, color, brightness, contrast, and procedural backgrounds. A four-epoch CPU run at 96x96 took 519.06 seconds. Validation MAE reached 0.0191 at epoch 3 and 0.0215 at epoch 4. The exported ONNX file is about 0.94 MB and measured 0.0029 seconds mean CPU inference across six local photos.

A visual check of `models/tiny-matting-large/eval/photo-1517841905240-472988babdf9.png` still shows severe horizontal/block artifacts and poor generalization on a real photo outside the narrow foreground set. Therefore, despite the excellent raw speed, this model is not production-ready and must not replace the existing ISNet engine. The result confirms that quantity from repeated transformations cannot substitute for more diverse foregrounds and correct real alpha mattes.


## Additional dataset option

`Thinnaphat/transparent-460` on Hugging Face contains 410 train and 50 test transparent foregrounds with corresponding alpha mattes, plus instructions for compositing. It is 3.73 GB because the repository also references/comprises many composited assets, and its license is non-commercial research only. It may improve transparent-object coverage, but it is not suitable for a commercial TrimBG deployment unless the license is verified and compatible. The official P3M-10k source has 9,421 training portraits and 1,000 test portraits under an MIT release agreement, but its Google Drive archive is large; it is a stronger candidate if the product is portrait-focused and the full download is practical.

## Visual check of balanced model
- `aim_0400` produced a visually plausible flower foreground with soft edges, while `aim_0405` was a difficult space-galaxy scene with visible block artifacts. The model is promising for common object/portrait-like cases but not yet a general replacement for ISNet across arbitrary subjects.
- The current balanced model was evaluated at 96x96, so fine hair and thin edges remain resolution-limited.

## Research: better training and model routes
The first research pass suggests that training a tiny U-Net from scratch is not the strongest route. MODNet is a lightweight, trimap-free portrait matting model intended for real-time use; it is appropriate when TrimBG mainly handles people, but not a general object-removal solution. BiRefNet is a stronger high-accuracy dichotomous segmentation family, but its size and compute requirements must be checked before considering browser deployment. BEN/BEN2 and the newer WithoutBG Snap models are additional pretrained background-removal candidates with ONNX-oriented or local-runtime paths; licensing and actual model files must be verified before commercial integration.

Potential methods to test are transfer learning/fine-tuning from pretrained weights instead of training from scratch, knowledge distillation from ISNet/BiRefNet into a small student network, progressive training at 128/256 resolution with best-validation checkpointing, boundary-aware losses for hair and thin edges, and post-training ONNX quantization only after measuring quality loss. A real held-out alpha-matte set must remain separate from generated composites.

Initial external sources to verify:
- MODNet paper: https://ojs.aaai.org/index.php/AAAI/article/view/19999
- MODNet repository: https://github.com/ZHKKKe/MODNet
- BiRefNet paper: https://arxiv.org/abs/2401.03407
- BEN official model: https://huggingface.co/PramaLLC/BEN
- WithoutBG Snap: https://huggingface.co/withoutbg/snap
- Training matting models without alpha labels: https://arxiv.org/html/2408.10539v1
- P3M dataset/repository: https://github.com/JizhiziLi/P3M

## Verified research findings
MODNet is explicitly designed for real-time, trimap-free portrait matting. The AAAI paper reports 67 FPS on a 1080Ti, while the official repository provides Apache-2.0 code, pretrained assets, training code, SOC adaptation, and a community ONNX path. Its scope is portraits, so it is a strong candidate only when users mostly upload people.

BiRefNet is a high-resolution dichotomous segmentation model with a localization module, reconstruction module, bilateral reference features, and auxiliary gradient supervision for fine details. The official repository provides pretrained models, fine-tuning guidance, and ONNX conversion. It also documents a dynamic-resolution model and a matting-specific model, but the project notes substantial GPU requirements; it is better suited to a server or offline GPU than direct browser CPU execution.

P3M-10k provides 9,421 training portraits and 500+500 test portraits with alpha mattes under an MIT release agreement. It is highly relevant for portrait matting but not general objects. The official P3M-Net implementation reports stronger portrait-matting results than older trimap-free baselines, and provides pretrained weights and training/testing code.

The alpha-free matting paper shows that fine alpha labels are not always mandatory: images with coarse trimaps plus a directional distance consistency loss can approach fine-label supervision. This is useful if we can generate reliable coarse trimaps, but it is not a shortcut for arbitrary object matting without any labels.

WithoutBG Snap offers three Apache-2.0 ONNX stages: Depth Anything V2 small, a 256x256 matting model, and a full-resolution refiner. The complete model set is about 140 MB and uses CPU/CUDA ONNX Runtime. It may improve quality, but it is much heavier than the current browser model and is not a drop-in replacement for a single browser model.

Recommended experiment order: first test a pretrained ONNX MODNet route for portraits; then test or fine-tune a lightweight pretrained segmentation/matting model on the real alpha data; keep BiRefNet or WithoutBG as quality references rather than browser replacements; use knowledge distillation from a strong teacher into a small student if browser speed remains the priority. Do not merge any candidate until it beats the current model on a held-out real set and has an acceptable latency.

Verified source URLs:
- https://ojs.aaai.org/index.php/AAAI/article/view/19999
- https://github.com/ZHKKKe/MODNet
- https://arxiv.org/abs/2401.03407
- https://github.com/ZhengPeng7/BiRefNet
- https://github.com/JizhiziLi/P3M
- https://arxiv.org/html/2408.10539v1
- https://huggingface.co/withoutbg/snap
- https://huggingface.co/PramaLLC/BEN

## Additional model findings
MODNet official code is Apache-2.0, portrait-only, RGB-only, trimap-free, and has a community ONNX/WebNN version usable with Transformers.js. The WebNN model card provides a direct browser pipeline example for `onnx-community/modnet-webnn`; this is the lowest-risk browser experiment for portrait images, not for arbitrary products.

RMBG-1.4 is a strong general background-removal baseline trained on more than 12,000 licensed, manually labeled images across objects, people, animals, gaming, e-commerce, advertising, and text. Its model card allows Transformers.js and ONNX usage, but its license is source-available/non-commercial unless a commercial agreement is obtained. It is 44.1M parameters and therefore likely heavier than the current browser model; it is useful as a quality teacher/reference, not an automatic production replacement without license and latency checks.

OpenVINO documents CPU conversion and execution for RMBG-1.4. This offers a low-cost local/server CPU route, but it does not eliminate hosting costs for a public website.

Best next experiment: add a model benchmark script and test `onnx-community/modnet-webnn` on portrait samples, plus test RMBG-1.4 only as a quality reference with license clearly documented. For general objects, continue using the existing ISNet route or distill a teacher model into a small student; MODNet should not replace it for product/object images.

Sources:
- https://github.com/ZHKKKe/MODNet
- https://huggingface.co/onnx-community/modnet-webnn
- https://huggingface.co/briaai/RMBG-1.4
- https://docs.openvino.ai/2024/notebooks/rmbg-background-removal-with-output.html

## Available ONNX artifacts
The Hugging Face repositories expose these browser-compatible artifacts:
- `onnx-community/modnet-webnn`: `onnx/model.onnx`, `onnx/model_fp16.onnx`, and `onnx/model_quantized.onnx`.
- `briaai/RMBG-1.4`: `onnx/model.onnx`, `onnx/model_fp16.onnx`, and `onnx/model_quantized.onnx`.
The quantized MODNet file is the first low-risk browser experiment; RMBG remains a quality reference with its non-commercial license constraint.
Source repositories: https://huggingface.co/onnx-community/modnet-webnn and https://huggingface.co/briaai/RMBG-1.4

## Visual comparison note
On the same AIM-500 flower validation image, MODNet and the balanced tiny model both preserved the flower and stem with visually similar broad contours. MODNet was tested at 512x512 and averaged 0.3929 seconds per CPU inference with mean MAE 0.160583 across 100 real validation images. The balanced tiny model was tested at 96x96 and averaged 0.00353 seconds with mean MAE 0.1117 on the same validation split, but its visual and numerical result must be interpreted cautiously because it was trained on a related augmented dataset and is not a general-purpose replacement yet. MODNet remains portrait-focused and should not be used as the general object remover without category-specific validation.

## RMBG-1.4 official details
The official RMBG-1.4 model card describes it as a general background-removal model based on an enhanced IS-Net, trained on more than 12,000 licensed, manually pixel-labeled images. The stated distribution includes objects only (45.11%), people with objects/animals (25.24%), people only (17.35%), people/objects/animals with text (8.52%), text only (2.52%), and animals only (1.89%). It supports Transformers.js and ONNX artifacts. The official preprocessing resizes to 1024x1024, divides by 255, then normalizes with mean [0.5, 0.5, 0.5] and std [1.0, 1.0, 1.0]. The model card states 44.1M parameters and a source-available license for non-commercial use; commercial use requires a separate agreement. It also points to RMBG-2.0 as a newer version.

Sources:
[1] https://huggingface.co/briaai/RMBG-1.4
[2] https://huggingface.co/briaai/RMBG-1.4/raw/main/README.md

## RMBG-2.0 and browser execution research
The official RMBG-2.0 card says it improves RMBG-1.4 and is based on BiRefNet, trained on more than 15,000 manually pixel-labeled images. Its self-hosted weights are CC BY-NC 4.0; commercial deployment requires a separate agreement. The official ONNX directory lists very large artifacts: model.onnx about 1.02 GB, model_int8/model_quantized/model_uint8 about 366 MB, model_q4 about 367 MB, and model_q4f16 about 234 MB. This makes it unsuitable for the current lightweight browser product unless licensing, download size, and memory are acceptable.

The IMG.LY browser benchmark reports that ONNX Runtime Web with WASM SIMD and 16 threads can reduce a 168 MB model to roughly 2 seconds on an M3 Max, while WebGPU can be faster; the exact gains depend heavily on hardware. It also reports that QUINT8 compression can introduce visible artifacts for visual processing, so quantization must be validated rather than assumed safe.

Sources:
[3] https://huggingface.co/briaai/RMBG-2.0
[4] https://huggingface.co/briaai/RMBG-2.0/tree/main/onnx
[5] https://img.ly/blog/browser-background-removal-using-onnx-runtime-webgpu/

## Browser RMBG experiment setup
Added `onnxruntime-web@1.21.0` as a direct dependency and created `src/lib/rmbgBrowser.ts` with the RMBG-1.4 1024x1024 preprocessing/postprocessing path. The local quantized model is copied to ignored `public/models/rmbg/model_quantized.onnx` for local-only testing. TypeScript and Vite production build pass. The existing `/workspace` page loaded the React shell in Chromium but rendered a blank viewport in this test session without a visible runtime error, so the next measurement should use an isolated test harness rather than modify the production UI blindly.

## First browser RMBG failure
The isolated benchmark page loads with `crossOriginIsolated = true` and six hardware threads. The first execution failed before inference with `no available backend found` because ONNX Runtime Web fetched an HTML Vite fallback instead of a `.wasm` binary (`expected magic word 00 61 73 6d, found 3c 21 44 4f`). The model tensor path was not reached; this is a runtime asset-path configuration issue, not evidence against RMBG.
The first path fix correctly changed the error from an HTML response to a missing dynamic module: ONNX Runtime Web requested `/onnxruntime/ort-wasm-simd-threaded.jsep.mjs`. The browser therefore needs both the WASM binary and the matching runtime `.mjs` loader copied to the public path.

The WASM-only package still failed when its loader was served from `public/`: Vite refuses to dynamically import public `.mjs` files. The fix now stores `ort-wasm-simd-threaded.mjs` and `.wasm` under `src/assets/onnxruntime/` and passes `new URL(..., import.meta.url)` objects as `ort.env.wasm.wasmPaths`. TypeScript and production build continue to pass.

## RMBG-1.4 browser benchmark: successful run
After moving the WASM loader and binary into Vite-managed `src/assets`, the isolated browser benchmark executed successfully with `crossOriginIsolated: true` and six hardware threads. On the existing 162,797-byte JPG test image, cold model/session setup was 1,127 ms, inference was 4,186 ms, and total end-to-end time was 5,506 ms. A warm-cache repeat had 0 ms setup, 3,795 ms inference, and 3,925 ms total. The output rendered as a transparent PNG and visually separated the person from the wall. This is faster than the current ISNet warm end-to-end average (~6.42 s), but not yet below the <3 s target on this CPU browser.

The browser session became unavailable when attempting a third warm click, so the reliable measurements currently remain one cold and one warm run from the same session (5.506 s total cold; 3.925 s total warm). The benchmark page and model assets remain intact and can be reopened without changing production code.
A reopened browser session produced another cold-ish run with 726 ms model setup, 3,929 ms inference, and 4,787 ms total. The extracted result visibly preserves the person, hoodie and glasses while removing the blue wall; edge quality is acceptable for this sample, although this is not yet a general quality conclusion.

## Licensing checkpoint for RMBG-1.4
The official BRIA model card states that RMBG-1.4 is source-available for non-commercial use under the `bria-rmbg-1.4` license; commercial use requires a separate agreement with BRIA. Source: https://huggingface.co/briaai/RMBG-1.4 (see the Model Description and License sections). Therefore the browser benchmark is useful for technical comparison only, and the model must not be shipped in TrimBG production or used as an unlicensed distillation teacher for a commercial deployment. The current IMG.LY package also carries an AGPL software license and should be reviewed separately before any production redistribution.

## Distillation experiment from RMBG-1.4 (research-only)
A new `scripts/distill_from_rmbg.py` generated 400 teacher masks from a 200-synthetic + 200-AIM-500 training subset. CPU teacher generation averaged 2.699 seconds per image and took 1,094.58 seconds total. The student was trained for 10 epochs at 128x128 and exported to `models/tiny-matting-distill-rmbg-400/tiny_matting_128.onnx` (941,613 bytes; 234,017 parameters). On the independent 100-image AIM-500 validation split, the student achieved mean MAE 0.24923 and mean ONNX CPU inference 0.00529 seconds. This is worse than the existing mixed-balanced tiny model (mean MAE 0.1117, mean CPU inference 0.00353 seconds) and far worse than RMBG-1.4 (mean MAE 0.01893), so this distillation run is not a production candidate.

## Tiny student browser benchmark
The isolated `/tiny-benchmark.html` ran successfully under `crossOriginIsolated = true` with six hardware threads. On the same 162,797-byte test JPG, model setup took 318 ms, WASM inference 45 ms, and total end-to-end time 448 ms; output size was 1,367,532 bytes. The visual result preserved the person and removed most of the blue wall on this sample. Despite excellent speed, the AIM-500 MAE of 0.24923 means the student must not replace ISNet; the existing mixed-balanced student is the stronger tiny-model baseline to investigate instead.

The RMBG-1.4 teacher and this distilled student remain research-only because the BRIA model card requires a commercial agreement for commercial use. No production integration was made.

The balanced tiny browser benchmark page loaded successfully with cross-origin isolation and the common test image. Its model path is local and ignored; inference measurement is pending.

The balanced tiny student browser benchmark completed on the same test JPG with crossOriginIsolated=true and six hardware threads: model setup 202 ms, inference 10 ms, total 275 ms, output PNG 893,707 bytes. The result visually retained the person but showed noticeable low-resolution/blocky transparency around the head, face and jacket compared with RMBG; this confirms the speed advantage but also the quality limitation at 96x96.

A console check after the balanced browser run produced no JavaScript errors or runtime warnings in the benchmark page.


## Progressive V3 scaled 2x results

A progressively trained V3 model with `width_multiplier=2.0` was expanded to 272,577 parameters, compared with 72,417 in the original V3. The ONNX artifact is 1,098,227 bytes (about 1.05 MiB).

The best 128x128 progressive checkpoint was trained from 3,100 train pairs, with 100 held-out AIM-500 validation pairs. Its full validation result was `mean_mae=0.13559` and `mean_seconds=0.00722` on the local CPU. In Chromium with `crossOriginIsolated=true` and six threads, it measured `modelReadyMs=203`, `inferenceMs=45`, and `totalMs=324` on the reference image.

The progressive 256x256 fine-tuning did not improve over the previous V3 256 checkpoint. The best complete evaluation currently available for progressive 256-v2 is `mean_mae=0.24015` and `mean_seconds=0.03455` on the same AIM-500 validation split. Chromium measured `modelReadyMs=204`, `inferenceMs=144`, and `totalMs=436` on the reference image. The previous V3 256 result remains better at MAE 0.1734, so the 256 progressive branch is not selected.

The visual Chromium checks show that 128 progressive is fast but loses parts of the subject and thin boundaries, while 256 progressive preserves more of the subject but leaves background leakage around the shoulders and upper edges. These results do not meet the production acceptance rule; ISNet remains the production model. The progressive files and benchmarks remain local experiment artifacts until GitHub authentication is restored.
