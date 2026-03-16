import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Header />
      
      <main className="max-w-4xl mx-auto pt-16 pb-24 md:pt-20 px-6" dir="rtl">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-8 text-[#2D2D2D]"> الشروط والأحكام وإخلاء المسؤولية</h1>
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">مرحباً بك في TrimBG. باستخدامك لهذه الأداة، فإنك توافق التزاماً كاملاً بالشروط والأحكام الموضحة أدناه. إذا كنت لا توافق على أي من هذه الشروط، يُرجى التوقف عن استخدام الموقع فوراً.</p>

        <h2 className="text-xl md:text-3xl font-bold mt-10 mb-4 text-[#2D2D2D]">1. الاستخدام المشروع والأخلاقي</h2>
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">تم تطوير TrimBG كأداة مساعدة للمصممين، المطورين، وصناع المحتوى لتسهيل أعمالهم الإبداعية والمشروعة. يلتزم المستخدم بأن جميع الصور التي يقوم بمعالجتها تمتلك حقوقها أو لديه تصريح باستخدامها.</p>

        <h3 className="text-lg md:text-xl font-bold mt-6 mb-3 text-[#2D2D2D]">محظورات الاستخدام (Strict Prohibitions):</h3>
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">يمنع منعاً باتاً وقاطعاً استخدام TrimBG في الأغراض التالية:</p>
        <ul className="list-disc list-inside space-y-2 text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">
          <li>تزوير أو التلاعب بالمستندات الرسمية، الهويات الوطنية، جوازات السفر، أو الشهادات الطبية والأكاديمية.</li>
          <li>معالجة أو إنتاج صور تهدف إلى الابتزاز، التشهير، أو الإساءة لأي شخص أو جهة.</li>
          <li>انتهاك خصوصية الأفراد من خلال معالجة صورهم دون إذن صريح منهم (بما في ذلك إنتاج صور مسيئة أو ما يعرف بـ Deepfakes).</li>
          <li>أي استخدام يخالف القوانين المحلية والدولية، أو يتنافى مع الآداب والأخلاق العامة.</li>
        </ul>

        <h2 className="text-xl md:text-3xl font-bold mt-10 mb-4 text-[#2D2D2D]">2. إخلاء المسؤولية القانونية (Limitation of Liability)</h2>
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">تُقدم أداة TrimBG خدماتها "كما هي" (As Is) دون أي ضمانات صريحة أو ضمنية.</p> 
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">لا يتحمل مطور الموقع (محمد خيري) أو أي جهة مرتبطة بـ TrimBG أي مسؤولية قانونية، جنائية، أو مدنية، بشكل مباشر أو غير مباشر، عن:</p>
        <ul className="list-disc list-inside space-y-2 text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">
          <li>أي إساءة استخدام للأداة من قِبل المستخدمين.</li>
          <li>أي أضرار ناتجة عن استخدام الصور المُعالجة بواسطة الأداة في أغراض غير مشروعة.</li>
        </ul>
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">المستخدم وحده يتحمل التبعات القانونية الكاملة لأفعاله ولطبيعة الصور التي يقوم بمعالجتها.</p>

        <h2 className="text-xl md:text-3xl font-bold mt-10 mb-4 text-[#2D2D2D]">3. حقوق الملكية الفكرية</h2>
        <p className="text-base md:text-lg leading-relaxed text-[#5F5F5F] mb-4">واجهة المستخدم، الشعار، والأكواد البرمجية (Front-end) الخاصة بـ TrimBG محمية بموجب حقوق الطبع والنشر. لا يحق للمستخدم إعادة بيع الخدمة أو استنساخ الواجهة لأغراض تجارية دون إذن مسبق.</p>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
