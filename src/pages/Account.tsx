import { useState, useEffect } from "react";
import { Crown, User, Calendar, Loader2, KeyRound, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

const Account = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setEmail(user.email || "");

        // Load premium status
        const { data } = await supabase
          .from("premium_activations")
          .select("expires_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          if (data.expires_at) {
            const exp = new Date(data.expires_at);
            const now = new Date();
            if (exp > now) {
              setIsPremium(true);
              setExpiresAt(data.expires_at);
              setDaysLeft(Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            }
          } else {
            setIsPremium(true);
          }
        }

        // Load balance
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .maybeSingle();
        setBalance(profile?.balance || 0);

        // Load transactions
        const { data: txns } = await supabase
          .from("balance_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setTransactions((txns as Transaction[]) || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleActivate = async () => {
    if (!code.trim()) return;
    setActivating(true);
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
        toast({ title: "Mã không hợp lệ", variant: "destructive" });
        return;
      }

      if (codeData.current_uses >= codeData.max_uses) {
        toast({ title: "Mã đã hết lượt", variant: "destructive" });
        return;
      }

      const premiumDays = codeData.premium_days || 30;
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + premiumDays);

      const { data: existing } = await supabase
        .from("premium_activations")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        let baseDate = new Date();
        if (existing.expires_at) {
          const existingExp = new Date(existing.expires_at);
          if (existingExp > baseDate) baseDate = existingExp;
        }
        baseDate.setDate(baseDate.getDate() + premiumDays);

        await supabase
          .from("premium_activations")
          .update({ expires_at: baseDate.toISOString(), code_id: codeData.id })
          .eq("id", existing.id);

        setExpiresAt(baseDate.toISOString());
        setDaysLeft(Math.ceil((baseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      } else {
        await supabase
          .from("premium_activations")
          .insert({ user_id: user.id, code_id: codeData.id, expires_at: expiresDate.toISOString() });

        setExpiresAt(expiresDate.toISOString());
        setDaysLeft(premiumDays);
      }

      await supabase
        .from("premium_codes")
        .update({ current_uses: codeData.current_uses + 1 })
        .eq("id", codeData.id);

      setIsPremium(true);
      setShowInput(false);
      setCode("");
      toast({ title: "🎉 Kích hoạt thành công!", description: `Premium ${premiumDays} ngày` });
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6">
      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Tài khoản</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Số dư tài khoản</p>
              <p className="text-2xl font-bold text-foreground">{balance.toLocaleString()}đ</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Liên hệ Admin để nạp tiền vào tài khoản</p>
        </div>

        {/* Premium Status */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isPremium ? "bg-gradient-to-br from-primary to-[hsl(280,80%,55%)]" : "bg-muted"}`}>
              <Crown className={`w-5 h-5 ${isPremium ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                {isPremium ? "Premium đang hoạt động ✨" : "Chưa kích hoạt Premium"}
              </p>
              {isPremium && expiresAt && daysLeft !== null && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Còn <span className="font-bold text-foreground">{daysLeft}</span> ngày · Hết hạn {new Date(expiresAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!showInput ? (
            <Button
              variant={isPremium ? "outline" : "default"}
              size="sm"
              className="rounded-xl text-xs font-bold w-full"
              onClick={() => setShowInput(true)}
            >
              <KeyRound className="w-3.5 h-3.5 mr-1.5" />
              {isPremium ? "Gia hạn thêm" : "Nhập mã kích hoạt"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã kích hoạt..."
                className="h-10 rounded-xl text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleActivate()}
              />
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold h-10 px-5"
                onClick={handleActivate}
                disabled={activating || !code.trim()}
              >
                {activating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Kích hoạt"}
              </Button>
            </div>
          )}
        </div>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Lịch sử giao dịch</span>
            </div>
            <div className="divide-y divide-border">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.amount > 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                      {t.amount > 0 ? (
                        <ArrowDownLeft className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.description || t.type}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${t.amount > 0 ? "text-success" : "text-destructive"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;
