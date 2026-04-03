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
          .select("id, expires_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          if (data.expires_at) {
            setIsActivated(new Date(data.expires_at) > new Date());
          } else {
            setIsActivated(true);
          }
        }
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

      const premiumDays = (codeData as Record<string, unknown>).premium_days as number || 30;
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + premiumDays);

      // Check existing activation - extend if exists
      const { data: existing } = await supabase
        .from("premium_activations")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        let baseDate = new Date();
        if (existing.expires_at) {
          const exp = new Date(existing.expires_at);
          if (exp > baseDate) baseDate = exp;
        }
        baseDate.setDate(baseDate.getDate() + premiumDays);
        await supabase
          .from("premium_activations")
          .update({ expires_at: baseDate.toISOString(), code_id: codeData.id })
          .eq("id", existing.id);
      } else {
        const { error: activateError } = await supabase
          .from("premium_activations")
          .insert({ user_id: user.id, code_id: codeData.id, expires_at: expiresDate.toISOString() });
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
      }

      // Increment usage
      await supabase
        .from("premium_codes")
        .update({ current_uses: codeData.current_uses + 1 })
        .eq("id", codeData.id);

      setIsActivated(true);
      toast({ title: "🎉 Kích hoạt thành công!", description: `Premium ${premiumDays} ngày` });
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
