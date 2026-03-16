import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Header />
      
      <main className="max-w-4xl mx-auto pt-16 pb-24 md:pt-20 px-6" dir="rtl">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-8 text-[#2D2D2D]">سياسة الخصوصية وأمان البيانات</h1>
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">في TrimBG، الخصوصية ليست مجرد سياسة، بل هي الأساس التقني الذي بُنيت عليه أداتنا. نحن نؤمن بأن بياناتك وصورك هي ملكية خاصة بك وحدك.</p>

        <h2 className="text-xl md:text-3xl font-bold mt-10 mb-4 text-[#2D2D2D]">1. المعالجة المحلية 100% (Local Processing)</h2>
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">تعتمد أداة TrimBG على تقنيات الذكاء الاصطناعي التي تعمل محلياً داخل متصفح الويب الخاص بك (باستخدام WebAssembly و ONNX Models).</p>
        <ul className="list-disc list-inside space-y-2 text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">
          <li>لا يتم رفع صورك إلى أي خوادم (Servers) أو سحابات إلكترونية خارجية.</li>
          <li>جميع عمليات المعالجة والقص تتم باستخدام معالج جهازك (الكمبيوتر أو الهاتف) وفي الذاكرة المؤقتة للمتصفح فقط.</li>
        </ul>

        <h2 className="text-xl md:text-3xl font-bold mt-10 mb-4 text-[#2D2D2D]">2. جمع البيانات وتخزينها (Zero Data Retention)</h2>
        <ul className="list-disc list-inside space-y-2 text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">
          <li>لا نقوم بجمع، تخزين، أو أرشفة أي من الصور التي تقوم بإدراجها في الأداة.</li>
          <li>بمجرد إغلاقك لعلامة التبويب (Tab) أو تحديث الصفحة، يتم مسح الصورة ونتيجتها نهائياً من ذاكرة المتصفح.</li>
          <li>لا نطلب منك إنشاء حساب، ولا نجمع أي بيانات شخصية مثل الاسم أو البريد الإلكتروني (إلا إذا قمت بمراسلتنا طوعاً عبر صفحة التواصل).</li>
        </ul>

        <h2 className="text-xl md:text-3xl font-bold mt-10 mb-4 text-[#2D2D2D]">3. ملفات تعريف الارتباط (Cookies) والتحليلات</h2>
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">قد نستخدم أدوات تحليلات أساسية ومجهولة المصدر (مثل Google Analytics) فقط لمعرفة عدد زوار الموقع والصفحات الأكثر زيارة، وذلك بهدف تحسين أداء الموقع. هذه الأدوات لا يمكنها الوصول إلى صورك أو بياناتك الخاصة على الإطلاق.</p>

        <h2 className="text-xl md:text-3xl font-bold mt-10 mb-4 text-[#2D2D2D]">4. التحديثات على السياسة</h2>
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">نحتفظ بالحق في تحديث سياسة الخصوصية هذه عند الحاجة لتعكس أي تغييرات تقنية أو قانونية. استمرارك في استخدام الموقع يعني موافقتك على أحدث نسخة من هذه السياسة.</p>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;