import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, LogIn, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Đăng nhập thành công!" });
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: "Đăng ký thành công!", description: "Bạn đã có thể sử dụng ứng dụng." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Prompt AI Studio</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Đăng nhập để tiếp tục" : "Tạo tài khoản mới"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Mật khẩu</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-xl"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl">
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isLogin ? (
              <LogIn className="w-4 h-4 mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
