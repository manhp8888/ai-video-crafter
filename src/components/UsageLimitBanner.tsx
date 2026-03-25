import { AlertTriangle } from "lucide-react";
import { useUsageLimit } from "@/hooks/use-usage-limit";

interface UsageLimitBannerProps {
  feature: string;
  limit: number;
  label?: string;
}

const UsageLimitBanner = ({ feature, limit, label }: UsageLimitBannerProps) => {
  const { canUse, remaining, isPremium } = useUsageLimit(feature, limit);

  if (isPremium) return null;

  if (!canUse) {
    return (
      <div className="w-full bg-destructive/10 border border-destructive/30 rounded-2xl px-5 py-3 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Đã hết lượt miễn phí hôm nay</p>
          <p className="text-xs text-muted-foreground">Nâng cấp Premium để sử dụng {label || "tính năng này"} không giới hạn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        Còn lại: <span className="font-semibold text-foreground">{remaining}/{limit}</span> lượt hôm nay
      </span>
    </div>
  );
};

export { UsageLimitBanner, useUsageLimit };
