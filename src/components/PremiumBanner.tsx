import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const PremiumBanner = () => (
  <div className="w-full max-w-4xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-2xl px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <Crown className="w-5 h-5 text-primary" />
      <div>
        <p className="text-sm font-semibold text-foreground">Nâng cấp Premium</p>
        <p className="text-xs text-muted-foreground">Tạo prompt không giới hạn & Bộ nâng cấp prompt AI</p>
      </div>
    </div>
    <Button size="sm" className="rounded-xl text-xs font-semibold shrink-0">
      Nâng cấp ngay
    </Button>
  </div>
);

export default PremiumBanner;
