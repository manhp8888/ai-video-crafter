import { useState, useEffect } from "react";
import { Shield, Users, KeyRound, Plus, Trash2, ToggleLeft, ToggleRight, Crown, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";

interface UserItem {
  id: string;
  email: string;
  created_at: string;
  isPremium: boolean;
  premiumSince: string | null;
}

interface CodeItem {
  id: string;
  code: string;
  is_active: boolean;
  max_uses: number;
  current_uses: number;
  created_at: string;
}

const Admin = () => {
  const { isAdmin, loading: adminLoading, adminCall } = useAdmin();
  const { toast } = useToast();
  const [tab, setTab] = useState<"users" | "codes">("codes");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("100");
  const [creating, setCreating] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoadingData(true);
    try {
      const data = await adminCall("list-users");
      setUsers(data as UserItem[]);
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  const loadCodes = async () => {
    setLoadingData(true);
    try {
      const data = await adminCall("list-codes");
      setCodes(data as CodeItem[]);
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "users") loadUsers();
    else loadCodes();
  }, [isAdmin, tab]);

  const handleInitAdmin = async () => {
    setInitLoading(true);
    try {
      await adminCall("init-admin");
      toast({ title: "Thành công!", description: "Bạn đã trở thành Admin." });
      window.location.reload();
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setInitLoading(false);
    }
  };

  const handleCreateCode = async () => {
    if (!newCode.trim()) return;
    setCreating(true);
    try {
      await adminCall("create-code", { code: newCode.trim(), max_uses: parseInt(newMaxUses) || 100 });
      toast({ title: "Tạo mã thành công!" });
      setNewCode("");
      loadCodes();
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleCode = async (id: string, currentActive: boolean) => {
    try {
      await adminCall("toggle-code", { code_id: id, is_active: !currentActive });
      loadCodes();
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    }
  };

  const handleDeleteCode = async (id: string) => {
    try {
      await adminCall("delete-code", { code_id: id });
      toast({ title: "Đã xóa mã." });
      loadCodes();
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    }
  };

  const handleRevokePremium = async (userId: string) => {
    try {
      await adminCall("revoke-premium", { target_user_id: userId });
      toast({ title: "Đã thu hồi Premium." });
      loadUsers();
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    }
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Khu vực Admin</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Chỉ tài khoản Admin mới có thể truy cập trang này. Nếu đây là lần đầu và chưa có Admin nào, nhấn nút bên dưới.
        </p>
        <Button onClick={handleInitAdmin} disabled={initLoading} className="rounded-xl">
          {initLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
          Kích hoạt Admin
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Quản trị Admin
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Quản lý người dùng và mã kích hoạt Premium</p>
      </div>

      {/* Tabs */}
      <div className="w-full max-w-4xl flex gap-2">
        <Button
          variant={tab === "codes" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setTab("codes")}
        >
          <KeyRound className="w-3.5 h-3.5 mr-1.5" />
          Mã Premium
        </Button>
        <Button
          variant={tab === "users" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setTab("users")}
        >
          <Users className="w-3.5 h-3.5 mr-1.5" />
          Người dùng
        </Button>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        {tab === "codes" && (
          <>
            {/* Create code */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <span className="text-sm font-medium text-foreground">Tạo mã kích hoạt mới</span>
              <div className="flex gap-2 flex-wrap">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã VD: PREMIUM2024"
                  className="flex-1 min-w-[200px] rounded-xl h-9"
                />
                <Input
                  type="number"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(e.target.value)}
                  placeholder="Số lần dùng"
                  className="w-28 rounded-xl h-9"
                />
                <Button onClick={handleCreateCode} disabled={creating || !newCode.trim()} size="sm" className="h-9 rounded-xl">
                  {creating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                  Tạo mã
                </Button>
              </div>
            </div>

            {/* Codes list */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {loadingData ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : codes.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Chưa có mã nào</div>
              ) : (
                <div className="divide-y divide-border">
                  {codes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-semibold text-foreground">{c.code}</code>
                          <button onClick={() => handleCopyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                            {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${c.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {c.is_active ? "Hoạt động" : "Tắt"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Đã dùng: {c.current_uses}/{c.max_uses} · Tạo: {new Date(c.created_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleToggleCode(c.id, c.is_active)}>
                          {c.is_active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteCode(c.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === "users" && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {loadingData ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Không có người dùng</div>
            ) : (
              <div className="divide-y divide-border">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{u.email}</span>
                        {u.isPremium && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Premium
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Đăng ký: {new Date(u.created_at).toLocaleDateString("vi-VN")}
                        {u.premiumSince && ` · Premium từ: ${new Date(u.premiumSince).toLocaleDateString("vi-VN")}`}
                      </p>
                    </div>
                    {u.isPremium && (
                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl" onClick={() => handleRevokePremium(u.id)}>
                        Thu hồi
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
