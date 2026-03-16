import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-primary-foreground">404</span>
          </div>
          <h1 className="text-3xl font-bold">الصفحة غير موجودة</h1>
          <p className="text-muted-foreground text-lg">
            عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            العودة للصفحة الرئيسية
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <div className="text-sm text-muted-foreground">
            أو جرب إزالة خلفية صورة مجاناً
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
