import { Toaster as Sonner } from "@/components/ui/sonner";

export const Toaster = () => {
  return (
    <Sonner
      className="toaster group"
      dir="rtl"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#2D2D2D] group-[.toaster]:border-[#E9E1D9] group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:p-6",
          description: "group-[.toast]:text-[#5F5F5F] group-[.toast]:font-light",
          actionButton: "group-[.toast]:bg-[#2D2D2D] group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-[#2D2D2D]",
        },
      }}
    />
  );
};
