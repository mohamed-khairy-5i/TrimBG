# خط تدريب وتجربة نموذج إزالة الخلفية

أُضيفت سكربتات تجريبية تسمح بتوليد بيانات تدريب من صور PNG الشفافة الموجودة داخل `public/`، ثم تدريب نموذج صغير وتحويله إلى ONNX وقياس السرعة على صور حقيقية.

## تشغيل التجربة

من داخل مجلد المشروع:

```bash
python3 scripts/inspect_assets.py
python3 scripts/generate_matting_data.py --count 256 --width 256 --height 256
python3 scripts/train_tiny_matting.py --data training_data --out models/tiny-matting-v2 --epochs 12 --size 128 --batch-size 8
python3 scripts/evaluate_tiny_matting.py --model models/tiny-matting-v2/tiny_matting_128.onnx --images public --out models/tiny-matting-v2/eval --size 128
```

يمكن فحص مواصفات أي نموذج ONNX بالأمر التالي:

```bash
python3 scripts/inspect_onnx_model.py models/u2netp/u2netp.onnx
```

كما أُضيف سكربت لتجربة نموذج U2NetP الخفيف الرسمي بعد تنزيله من مصدره:

```bash
mkdir -p models/u2netp
curl -L -o models/u2netp/u2netp.onnx \\
  https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
python3 scripts/evaluate_u2netp.py --model models/u2netp/u2netp.onnx --images public --out models/u2netp/eval-corrected
```

## نتيجة التجربة الحالية

تم توليد **256 زوجًا** من الصور والأقنعة باستخدام **7 صور foreground شفافة** و**6 صور خلفيات**. استغرق تدريب النموذج الصغير 84 ثانية على CPU، وأصبح حجم ملف ONNX حوالي **0.94 ميجابايت**. بلغ زمن الاستدلال المحلي للنموذج عند دقة 128×128 حوالي **0.006 ثانية** للصورة، لكن اختباره على صور حقيقية خارج نطاق بيانات التدريب أظهر تعميمًا ضعيفًا؛ لذلك لم يتم استبدال نموذج الموقع به.

تم أيضًا اختبار U2NetP الرسمي. حجمه حوالي **4.4 ميجابايت**، وزمن الاستدلال المحلي في بيئة الاختبار حوالي **0.17 ثانية** عند 320×320. جودته تحتاج اختبارًا أوسع قبل دمجه في المتصفح، كما أن تشغيله في المتصفح يحتاج مسار ONNX مخصصًا بدل واجهة `@imgly/background-removal` الحالية.

> النتيجة المهمة: السكربتات تعمل وتنتج نموذجًا قابلًا للتصدير، لكن النموذج الصغير الحالي ليس بديلًا إنتاجيًا. لا يُنصح بدمجه في الموقع قبل توفير بيانات أكثر تنوعًا وأقنعة حقيقية أو اختبار نموذج جاهز على مجموعة صور من مستخدمي الموقع.

## الملفات

| الملف | الوظيفة |
|---|---|
| `scripts/inspect_assets.py` | فحص الصور الشفافة ومصادر البيانات |
| `scripts/generate_matting_data.py` | توليد صور مركبة وأقنعة صحيحة من foregrounds شفافة |
| `scripts/train_tiny_matting.py` | تدريب نموذج U-Net صغير وتصدير ONNX |
| `scripts/evaluate_tiny_matting.py` | قياس زمن النموذج الصغير وحفظ نتائجه |
| `scripts/evaluate_u2netp.py` | اختبار U2NetP مع التطبيع الرسمي |
| `scripts/inspect_onnx_model.py` | قراءة شكل مدخلات ومخرجات نموذج ONNX |
| `scripts/inspect_alpha_outputs.py` | فحص إحصاءات الأقنعة الناتجة |
