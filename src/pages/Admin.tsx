import { useState, useEffect } from "react";
import { Shield, Users, KeyRound, Plus, Trash2, ToggleLeft, ToggleRight, Crown, Loader2, Copy, Check, BarChart3, UserCheck, Hash } from "lucide-react";
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
  premiumExpiresAt: string | null;
}

interface CodeItem {
  id: string;
  code: string;
  is_active: boolean;
  max_uses: number;
  current_uses: number;
  premium_days: number;
  created_at: string;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const Admin = () => {
  const { isAdmin, loading: adminLoading, adminCall } = useAdmin();
  const { toast } = useToast();
  const [tab, setTab] = useState<"overview" | "users" | "codes">("overview");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("100");
  const [newPremiumDays, setNewPremiumDays] = useState("30");
  const [creating, setCreating] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [grantDays, setGrantDays] = useState<Record<string, string>>({});

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

  const loadAll = async () => {
    setLoadingData(true);
    try {
      const [u, c] = await Promise.all([adminCall("list-users"), adminCall("list-codes")]);
      setUsers(u as UserItem[]);
      setCodes(c as CodeItem[]);
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "overview") loadAll();
    else if (tab === "users") loadUsers();
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
      await adminCall("create-code", { code: newCode.trim(), max_uses: parseInt(newMaxUses) || 100, premium_days: parseInt(newPremiumDays) || 30 });
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

  const handleGrantPremium = async (userId: string) => {
    const days = parseInt(grantDays[userId] || "30") || 30;
    try {
      await adminCall("grant-premium", { target_user_id: userId, days });
      toast({ title: `Đã cấp Premium ${days} ngày.` });
      setGrantDays((prev) => ({ ...prev, [userId]: "" }));
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
      <div className="flex flex-col items-center justify-center py-20 gap-5 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Khu vực Admin</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Chỉ tài khoản Admin mới có thể truy cập. Nếu chưa có Admin nào, nhấn nút bên dưới để kích hoạt.
        </p>
        <Button onClick={handleInitAdmin} disabled={initLoading} className="rounded-xl">
          {initLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
          Kích hoạt Admin
        </Button>
      </div>
    );
  }

  const premiumUsers = users.filter(u => u.isPremium).length;
  const activeCodes = codes.filter(c => c.is_active).length;
  const totalCodeUses = codes.reduce((sum, c) => sum + c.current_uses, 0);

  const tabs = [
    { key: "overview" as const, label: "Tổng quan", icon: BarChart3 },
    { key: "codes" as const, label: "Mã Premium", icon: KeyRound },
    { key: "users" as const, label: "Người dùng", icon: Users },
  ];

  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6">
      {/* Header */}
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Quản trị Admin</h1>
            <p className="text-muted-foreground text-sm">Quản lý người dùng và mã kích hoạt Premium</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full max-w-5xl">
        <div className="inline-flex gap-1 p-1 bg-muted/60 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-5xl space-y-5">
        {/* Overview Tab */}
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Users} label="Tổng người dùng" value={users.length} color="bg-primary/10 text-primary" />
              <StatCard icon={UserCheck} label="Premium" value={premiumUsers} color="bg-accent text-accent-foreground" />
              <StatCard icon={KeyRound} label="Mã hoạt động" value={activeCodes} color="bg-success/10 text-success" />
              <StatCard icon={Hash} label="Lượt kích hoạt" value={totalCodeUses} color="bg-destructive/10 text-destructive" />
            </div>

            {/* Recent users */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Người dùng gần đây</span>
              </div>
              {loadingData ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="divide-y divide-border">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-5 py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{(u.email?.[0] || "?").toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-foreground truncate block">{u.email}</span>
                          <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>
                      {u.isPremium && (
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <Crown className="w-3 h-3" /> Premium
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Codes Tab */}
        {tab === "codes" && (
          <>
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <span className="text-sm font-semibold text-foreground">Tạo mã kích hoạt mới</span>
              <div className="flex gap-2 flex-wrap">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã VD: PREMIUM2024"
                  className="flex-1 min-w-[200px] rounded-xl h-10"
                />
                <Input
                  type="number"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(e.target.value)}
                  placeholder="Số lần dùng"
                  className="w-28 rounded-xl h-10"
                />
                <Input
                  type="number"
                  value={newPremiumDays}
                  onChange={(e) => setNewPremiumDays(e.target.value)}
                  placeholder="Số ngày"
                  className="w-28 rounded-xl h-10"
                />
                <Button onClick={handleCreateCode} disabled={creating || !newCode.trim()} className="h-10 rounded-xl">
                  {creating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                  Tạo mã
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Danh sách mã ({codes.length})</span>
              </div>
              {loadingData ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : codes.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">Chưa có mã nào</div>
              ) : (
                <div className="divide-y divide-border">
                  {codes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3.5 gap-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-bold text-foreground tracking-wide">{c.code}</code>
                          <button onClick={() => handleCopyCode(c.code)} className="text-muted-foreground hover:text-foreground transition-colors">
                            {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                            {c.is_active ? "Hoạt động" : "Tắt"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Đã dùng: <span className="font-semibold text-foreground">{c.current_uses}</span>/{c.max_uses} · Tạo: {new Date(c.created_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleToggleCode(c.id, c.is_active)}>
                          {c.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteCode(c.id)}>
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

        {/* Users Tab */}
        {tab === "users" && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Người dùng ({users.length})</span>
              <span className="text-xs text-muted-foreground">{premiumUsers} Premium</span>
            </div>
            {loadingData ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">Không có người dùng</div>
            ) : (
              <div className="divide-y divide-border">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-5 py-3.5 gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{(u.email?.[0] || "?").toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{u.email}</span>
                          {u.isPremium && (
                            <span className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold shrink-0">
                              <Crown className="w-3 h-3" /> Premium
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Đăng ký: {new Date(u.created_at).toLocaleDateString("vi-VN")}
                          {u.premiumSince && ` · Premium từ: ${new Date(u.premiumSince).toLocaleDateString("vi-VN")}`}
                        </p>
                      </div>
                    </div>
                    {u.isPremium && (
                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl shrink-0" onClick={() => handleRevokePremium(u.id)}>
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
