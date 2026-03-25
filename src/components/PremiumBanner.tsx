import { useState } from "react";
import { Crown, Check, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const VALID_CODES = ["PREMIUM2024", "AIVIDEO", "CREATOR", "FREEPROMPT"];

const PremiumBanner = () => {
  const [code, setCode] = useState("");
  const [isActivated, setIsActivated] = useState(() => {
    try {
      return localStorage.getItem("premium_activated") === "true";
    } catch {
      return false;
    }
  });
  const [isChecking, setIsChecking] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const { toast } = useToast();

  const handleActivate = async () => {
    if (!code.trim()) return;
    setIsChecking(true);
    // Simulate check delay
    await new Promise((r) => setTimeout(r, 800));

    const normalized = code.trim().toUpperCase();
    if (VALID_CODES.includes(normalized)) {
      localStorage.setItem("premium_activated", "true");
      setIsActivated(true);
      toast({ title: "🎉 Kích hoạt thành công!", description: "Bạn đã được nâng cấp lên Premium." });
    } else {
      toast({ title: "Mã không hợp lệ", description: "Vui lòng kiểm tra lại mã kích hoạt.", variant: "destructive" });
    }
    setIsChecking(false);
  };

  if (isActivated) {
    return (
      <div className="w-full max-w-4xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-2xl px-5 py-3 flex items-center gap-3">
        <Check className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Premium đã kích hoạt</p>
          <p className="text-xs text-muted-foreground">Bạn đang sử dụng phiên bản Premium không giới hạn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-2xl px-5 py-3 space-y-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Nâng cấp Premium</p>
            <p className="text-xs text-muted-foreground">Tạo prompt không giới hạn & Bộ nâng cấp prompt AI</p>
          </div>
        </div>
        {!showInput && (
          <Button size="sm" className="rounded-xl text-xs font-semibold shrink-0" onClick={() => setShowInput(true)}>
            <KeyRound className="w-3.5 h-3.5 mr-1.5" />
            Nhập mã kích hoạt
          </Button>
        )}
      </div>

      {showInput && (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập mã kích hoạt Premium..."
            className="h-9 rounded-xl text-sm bg-background border-border"
            onKeyDown={(e) => e.key === "Enter" && handleActivate()}
          />
          <Button
            size="sm"
            className="rounded-xl text-xs font-semibold shrink-0 h-9 px-4"
            onClick={handleActivate}
            disabled={isChecking || !code.trim()}
          >
            {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Kích hoạt"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PremiumBanner;
