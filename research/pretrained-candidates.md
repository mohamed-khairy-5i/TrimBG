# Pretrained model candidate findings

## MODNet

- Official implementation: https://github.com/yakhyo/modnet
- The repository states that it provides PyTorch and ONNX Runtime inference.
- The repository is marked Apache-2.0 and identifies the model as portrait matting.
- Hugging Face ONNX Community model card: https://huggingface.co/onnx-community/modnet-webnn
- The model card is marked Apache-2.0, tagged for image segmentation, ONNX, Transformers.js, background removal, and portrait matting.
- The model card provides a Transformers.js background-removal pipeline, so browser integration is plausible without custom ONNX plumbing.
- Main limitation: MODNet is designed for portraits, not arbitrary objects. It is a strong candidate for a portrait-focused fallback, not an automatic general-purpose replacement.

## BiRefNet

- Official implementation: https://github.com/ZhengPeng7/BiRefNet
- The repository includes an MIT LICENSE and documents ONNX conversion.
- The README reports ONNX inference around 165 ms on an A100 for the default SwinL and around 93.8 ms for the lightweight SwinT, at 1024x1024. These are GPU figures, not browser CPU figures.
- BiRefNet is a general high-resolution dichotomous image segmentation model and is more relevant to arbitrary objects than MODNet.
- Main risks: the official ONNX path is conversion-oriented, the default input is high resolution, and the likely model size/CPU latency may be too high for TrimBG's browser target. It remains a candidate for quality benchmarking if a permissively licensed lightweight ONNX artifact can be obtained and verified.

## Initial routing decision

1. Test an existing lightweight MODNet ONNX artifact first because it has Apache-2.0 metadata and an explicit Transformers.js/browser path. Treat it as portrait-only.
2. Test a lightweight BiRefNet/SwinT ONNX artifact only if its exact license and distributable weights are verified; do not use third-party converted weights without checking the model card and upstream license.
3. Exclude RMBG-1.4 and RMBG-2.0 from production candidates under the current commercial/no-paid-server constraints: RMBG-1.4 has a commercial agreement constraint and RMBG-2.0 is non-commercial.
4. Keep ISNet as the production baseline until a candidate passes both AIM-500 quality and visual edge-case checks.

## MODNet AIM-500 evaluation

The quantized MODNet ONNX artifact was evaluated on all 100 AIM-500 validation images using 256x256 input and the official-style normalization `(rgb - 0.5) / 0.5`. The result was mean MAE `0.157618`, median latency `0.1035 s`, mean latency `0.1079 s`, and a model size of `6,632,188` bytes.

The visual review confirms the model is portrait-oriented rather than a general replacement. A successful portrait-like sample produces a coherent subject cutout, while the worst sample has MAE `0.601982` and shows severe structural failure and banding. MODNet should therefore be treated as a possible portrait-specific fast mode, not as a general-purpose TrimBG production model.

## MODNet browser benchmark

On Chromium with `crossOriginIsolated=true` and 6 hardware threads, the first run reported `modelReadyMs=634`, `inferenceMs=280`, and `totalMs=1017`. The warm run reported `modelReadyMs=0`, `inferenceMs=169`, and `totalMs=859`. The browser output looked reasonable on the supplied portrait sample, but the result was visibly soft and retained some background texture; this is consistent with MODNet's portrait specialization and does not override the poor general AIM-500 worst-case behavior.

## Additional pretrained candidates

- [withoutbg Snap model card](https://huggingface.co/withoutbg/snap) is Apache-2.0 and exposes a three-stage ONNX pipeline: Depth Anything V2 ViT-S at 518x518, a 256x256 RGBD matting model, and a full-resolution refiner. The card reports about 140 MB total for all three models. It is technically promising but too heavy for the first browser replacement experiment because it requires three models and multiple passes.
- [BackgroundMattingV2 official repository](https://github.com/PeterL1n/BackgroundMattingV2) is MIT licensed and supports ONNX, but it requires a captured clean background image as an additional input. That requirement does not match TrimBG's single-image user workflow, so it is not a suitable direct replacement.
- [PaddleSeg](https://github.com/PaddlePaddle/PaddleSeg) is Apache-2.0 and includes PP-MattingV2, MODNet, and other matting systems. PP-MattingV2 remains a possible research candidate, but its practical browser conversion and model artifact availability must be verified before committing to it.

## U2NetP candidate

The official [rembg repository](https://github.com/danielgatis/rembg) is MIT licensed and distributes `u2netp.onnx` as a lightweight general-purpose model. The original [U-2-Net repository](https://github.com/xuebinqin/U-2-Net) is Apache-2.0, and the downloadable ONNX derivative is listed as Apache-2.0 on [Hugging Face](https://huggingface.co/BritishWerewolf/U-2-Netp). U2NetP is a more appropriate general-object candidate than MODNet, so it is the next model to evaluate.
## U2NetP benchmark داخل Chromium

على Chromium مع `crossOriginIsolated=true` و6 خيوط، كان أول تشغيل: تهيئة 364 ms، inference 698 ms، وإجمالي 1,156 ms. بعد التهيئة، كان warm inference 639 ms وإجمالي 719 ms. حجم نموذج ONNX هو 4,574,861 bytes، والإدخال 320×320. بصرياً، نجح في فصل الشخص في الصورة المرجعية مع حواف خشنة/هالة بسيطة، وهو أسرع من ISNet لكنه ليس قريباً من V3 في السرعة.
