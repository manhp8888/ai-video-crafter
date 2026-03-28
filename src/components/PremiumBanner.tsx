import { useState, useEffect } from "react";
import { Crown, Check, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PremiumBanner = () => {
  const [code, setCode] = useState("");
  const [isActivated, setIsActivated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase
          .from("premium_activations")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        setIsActivated(!!data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  const handleActivate = async () => {
    if (!code.trim()) return;
    setIsChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const normalized = code.trim().toUpperCase();
      const { data: codeData, error: codeError } = await supabase
        .from("premium_codes")
        .select("*")
        .eq("code", normalized)
        .eq("is_active", true)
        .maybeSingle();

      if (codeError || !codeData) {
        toast({ title: "Mã không hợp lệ", description: "Vui lòng kiểm tra lại mã kích hoạt.", variant: "destructive" });
        setIsChecking(false);
        return;
      }

      if (codeData.current_uses >= codeData.max_uses) {
        toast({ title: "Mã đã hết lượt sử dụng", description: "Mã này đã được sử dụng hết.", variant: "destructive" });
        setIsChecking(false);
        return;
      }

      const { error: activateError } = await supabase
        .from("premium_activations")
        .insert({ user_id: user.id, code_id: codeData.id });

      if (activateError) {
        if (activateError.code === "23505") {
          toast({ title: "Đã kích hoạt rồi", description: "Tài khoản của bạn đã là Premium." });
          setIsActivated(true);
        } else {
          throw activateError;
        }
        setIsChecking(false);
        return;
      }

      setIsActivated(true);
      toast({ title: "🎉 Kích hoạt thành công!", description: "Bạn đã được nâng cấp lên Premium." });
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi kích hoạt", variant: "destructive" });
    } finally {
      setIsChecking(false);
    }
  };

  if (loading) return null;

  if (isActivated) {
    return (
      <div className="w-full max-w-5xl glass-card rounded-2xl px-5 py-4 flex items-center gap-3 border-primary/30">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Premium đã kích hoạt ✨</p>
          <p className="text-xs text-muted-foreground">Sử dụng không giới hạn tất cả tính năng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl glass-card rounded-2xl px-5 py-4 space-y-3 border-primary/20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-[hsl(280,80%,55%)]/20 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Nâng cấp Premium</p>
            <p className="text-xs text-muted-foreground">Tạo prompt không giới hạn & Mở khóa tất cả công cụ AI</p>
          </div>
        </div>
        {!showInput && (
          <Button size="sm" className="rounded-xl text-xs font-bold shrink-0 bg-gradient-to-r from-primary to-[hsl(280,80%,55%)] hover:opacity-90" onClick={() => setShowInput(true)}>
            <KeyRound className="w-3.5 h-3.5 mr-1.5" />
            Nhập mã kích hoạt
          </Button>
        )}
      </div>

      {showInput && (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã kích hoạt Premium..."
            className="h-10 rounded-xl text-sm bg-background/50 border-border"
            onKeyDown={(e) => e.key === "Enter" && handleActivate()}
          />
          <Button
            size="sm"
            className="rounded-xl text-xs font-bold shrink-0 h-10 px-5 bg-gradient-to-r from-primary to-[hsl(280,80%,55%)] hover:opacity-90"
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
