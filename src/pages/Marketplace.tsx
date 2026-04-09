import { useState, useEffect, useMemo } from "react";
import {
  Store, ShoppingCart, Loader2, Eye, Wallet, Search, Tag, Package, Star,
  ShieldCheck, ArrowDownUp, Clock, TrendingUp, DollarSign, Copy, X,
  ShoppingBag, Sparkles, Flame, CheckCircle2, ExternalLink, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  title: string;
  description: string | null;
  details: string | null;
  price: number;
  category: string;
  image_url: string | null;
  content: string | null;
  stock: number;
  sales_count: number;
}

interface Purchase {
  id: string;
  product_id: string;
  purchased_at: string;
  item_content: string | null;
  marketplace_products: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
  };
}

const CATEGORIES = [
  { key: "all", label: "Tất cả", icon: Package },
  { key: "prompt", label: "Prompt", icon: Star },
  { key: "account", label: "Tài khoản", icon: ShieldCheck },
  { key: "tool", label: "Công cụ", icon: Tag },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Mới nhất", icon: Clock },
  { key: "best-selling", label: "Bán chạy", icon: TrendingUp },
  { key: "price-low", label: "Giá thấp", icon: DollarSign },
  { key: "price-high", label: "Giá cao", icon: DollarSign },
];

const categoryColors: Record<string, string> = {
  prompt: "from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/20",
  account: "from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/20",
  tool: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/20",
};

const categoryLabels: Record<string, string> = {
  prompt: "Prompt",
  account: "Tài khoản",
  tool: "Công cụ",
};

const Marketplace = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [tab, setTab] = useState<"shop" | "purchased">("shop");
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [viewContent, setViewContent] = useState<{ title: string; content: string } | null>(null);
  const [confirmBuy, setConfirmBuy] = useState<Product | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadData = async () => {
    try {
      const { data: prods } = await supabase
        .from("marketplace_products")
        .select("id, title, description, details, price, category, image_url, content, stock, sales_count")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setProducts((prods as Product[]) || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .maybeSingle();
        setBalance(profile?.balance || 0);

        const { data: userPurchases } = await supabase
          .from("user_purchases")
          .select("product_id")
          .eq("user_id", user.id);
        setPurchased(new Set((userPurchases || []).map(p => p.product_id)));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "list-user-purchases" }),
        }
      );
      const data = await res.json();
      if (res.ok) setPurchases(data as Purchase[]);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (tab === "purchased") loadPurchases(); }, [tab]);

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const matchCat = category === "all" || p.category === category;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
    switch (sort) {
      case "best-selling": list = [...list].sort((a, b) => b.sales_count - a.sales_count); break;
      case "price-low": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-high": list = [...list].sort((a, b) => b.price - a.price); break;
      default: break;
    }
    return list;
  }, [products, category, search, sort]);

  const featuredProducts = useMemo(() => {
    return products.filter(p => p.sales_count >= 3).sort((a, b) => b.sales_count - a.sales_count).slice(0, 3);
  }, [products]);

  const handleBuy = async (product: Product) => {
    setConfirmBuy(null);
    setBuying(product.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Chưa đăng nhập");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "purchase-product", product_id: product.id }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPurchased(prev => new Set([...prev, product.id]));
      setBalance(prev => prev - product.price);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, sales_count: p.sales_count + 1, stock: p.stock > 0 ? p.stock - 1 : p.stock } : p));
      toast({ title: "Mua thành công!", description: product.title });

      if (data.content) {
        setViewContent({ title: product.title, content: data.content });
        setViewProduct(null);
      }
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setBuying(null);
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
    <div className="flex flex-col items-center px-4 py-6 gap-5">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Marketplace</h1>
              <p className="text-sm text-muted-foreground">Prompt, tài khoản & công cụ AI chất lượng cao</p>
            </div>
          </div>
          {isLoggedIn && (
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-card to-card/80 border border-border shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">Số dư</p>
                <span className="text-sm font-extrabold text-foreground">{balance.toLocaleString()}đ</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl mb-6 w-fit">
          <button
            onClick={() => setTab("shop")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${tab === "shop" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Store className="w-4 h-4" /> Cửa hàng
          </button>
          {isLoggedIn && (
            <button
              onClick={() => setTab("purchased")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${tab === "purchased" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ShoppingBag className="w-4 h-4" /> Đã mua
              {purchased.size > 0 && (
                <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-extrabold">{purchased.size}</span>
              )}
            </button>
          )}
        </div>

        {/* ===== PURCHASED TAB ===== */}
        {tab === "purchased" ? (
          <div>
            {purchases.length === 0 ? (
              <div className="glass-card rounded-3xl p-16 text-center">
                <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Chưa có sản phẩm nào</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">Khám phá cửa hàng và tìm những sản phẩm phù hợp với bạn</p>
                <Button className="rounded-xl px-6" onClick={() => setTab("shop")}>
                  <Store className="w-4 h-4 mr-2" /> Khám phá cửa hàng
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">{purchases.length} sản phẩm đã mua</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {purchases.map((p) => {
                    const prod = p.marketplace_products;
                    if (!prod) return null;
                    return (
                      <div key={p.id} className="glass-card rounded-2xl overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                        <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 overflow-hidden relative">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-muted-foreground/20" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/90 backdrop-blur-sm text-white text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã mua
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{prod.title}</h3>
                            <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-lg bg-gradient-to-r font-semibold border ${categoryColors[prod.category] || "from-muted to-muted text-muted-foreground border-border"}`}>
                              {categoryLabels[prod.category] || prod.category}
                            </span>
                          </div>
                          {prod.description && <p className="text-xs text-muted-foreground line-clamp-2">{prod.description}</p>}
                          <p className="text-[10px] text-muted-foreground mt-auto pt-2">
                            {new Date(p.purchased_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {(p.item_content) && (
                            <div className="flex gap-2 pt-2 border-t border-border/50">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl text-xs h-9 flex-1"
                                onClick={() => setViewContent({ title: prod.title, content: p.item_content! })}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" /> Xem nội dung
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-xl text-xs h-9 w-9 p-0"
                                onClick={() => { navigator.clipboard.writeText(p.item_content!); toast({ title: "Đã copy!" }); }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Featured Banner */}
            {featuredProducts.length > 0 && !search && category === "all" && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-bold text-foreground">Sản phẩm nổi bật</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {featuredProducts.map((p, i) => {
                    const owned = purchased.has(p.id);
                    return (
                      <div
                        key={p.id}
                        className="relative overflow-hidden rounded-2xl cursor-pointer group"
                        onClick={() => setViewProduct(p)}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${i === 0 ? "from-primary/30 via-primary/10 to-accent/20" : i === 1 ? "from-violet-500/20 via-purple-500/10 to-pink-500/20" : "from-amber-500/20 via-orange-500/10 to-red-500/20"}`} />
                        <div className="relative p-4 flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted/50 border border-border/50">
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{p.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-foreground">{p.price === 0 ? "Miễn phí" : `${p.price.toLocaleString()}đ`}</span>
                              <span className="text-[10px] text-muted-foreground">{p.sales_count} đã bán</span>
                            </div>
                          </div>
                          {owned ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
              <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
                {CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${category === c.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <c.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & count */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs text-muted-foreground font-medium">{filtered.length} sản phẩm</span>
              <div className="flex gap-0.5 items-center">
                <ArrowDownUp className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
                {SORT_OPTIONS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSort(s.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${sort === s.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {filtered.length === 0 ? (
              <div className="glass-card rounded-3xl p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-2">Không tìm thấy sản phẩm</h2>
                <p className="text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p) => {
                  const owned = purchased.has(p.id);
                  const outOfStock = p.stock === 0;
                  const isHot = p.sales_count >= 5;
                  return (
                    <div
                      key={p.id}
                      className="group glass-card rounded-2xl overflow-hidden flex flex-col hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                      onClick={() => setViewProduct(p)}
                    >
                      {/* Image */}
                      <div className="aspect-[16/10] bg-gradient-to-br from-muted to-muted/50 overflow-hidden relative">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/30">
                            <Package className="w-10 h-10 text-muted-foreground/20" />
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg bg-gradient-to-r font-semibold border backdrop-blur-sm ${categoryColors[p.category] || "from-muted to-muted text-muted-foreground border-border"}`}>
                            {categoryLabels[p.category] || p.category}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {isHot && !owned && !outOfStock && (
                            <span className="text-[10px] px-2 py-1 rounded-lg bg-orange-500/90 text-white font-bold flex items-center gap-1">
                              <Flame className="w-3 h-3" /> HOT
                            </span>
                          )}
                          {owned && (
                            <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/90 text-white font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Đã mua
                            </span>
                          )}
                          {outOfStock && !owned && (
                            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-destructive/90 text-destructive-foreground font-bold">
                              Hết hàng
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1 flex flex-col gap-1.5">
                        <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">{p.title}</h3>
                        {p.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>}
                        
                        <div className="mt-auto pt-3 flex items-end justify-between border-t border-border/40">
                          <div>
                            <span className="text-lg font-extrabold text-foreground">
                              {p.price === 0 ? "Miễn phí" : `${p.price.toLocaleString()}đ`}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{p.sales_count} đã bán</span>
                              {p.stock > 0 && <span className="text-[10px] text-muted-foreground">· còn {p.stock}</span>}
                              {p.stock === -1 && <span className="text-[10px] text-muted-foreground">· vô hạn</span>}
                            </div>
                          </div>
                          {owned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs h-9"
                              onClick={(e) => { e.stopPropagation(); p.content && setViewContent({ title: p.title, content: p.content }); }}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Xem
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="rounded-xl text-xs h-9 px-4"
                              onClick={(e) => { e.stopPropagation(); setConfirmBuy(p); }}
                              disabled={buying === p.id || outOfStock}
                            >
                              {buying === p.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <><ShoppingCart className="w-3.5 h-3.5 mr-1" /> Mua</>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== MODALS ===== */}

      {/* Product Detail Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setViewProduct(null)}>
          <div className="glass-card rounded-3xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header Image */}
            {viewProduct.image_url ? (
              <div className="aspect-video bg-muted overflow-hidden rounded-t-3xl relative">
                <img src={viewProduct.image_url} alt={viewProduct.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-t-3xl flex items-center justify-center relative">
                <Package className="w-16 h-16 text-muted-foreground/15" />
              </div>
            )}

            <div className="p-6 space-y-5">
              {/* Title & Category */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <span className={`inline-flex text-[11px] px-3 py-1 rounded-lg bg-gradient-to-r font-semibold border ${categoryColors[viewProduct.category] || "from-muted to-muted text-muted-foreground border-border"}`}>
                    {categoryLabels[viewProduct.category] || viewProduct.category}
                  </span>
                  <h2 className="text-xl font-extrabold text-foreground leading-tight">{viewProduct.title}</h2>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 rounded-xl" onClick={() => setViewProduct(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Description */}
              {viewProduct.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{viewProduct.description}</p>
              )}

              {/* Details */}
              {viewProduct.details && (
                <div className="bg-muted/30 rounded-2xl p-4 border border-border/30">
                  <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Chi tiết sản phẩm
                  </p>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{viewProduct.details}</pre>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShoppingCart className="w-3.5 h-3.5" /> {viewProduct.sales_count} lượt mua
                </div>
                {viewProduct.stock > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" /> Còn {viewProduct.stock} sản phẩm
                  </div>
                )}
                {viewProduct.stock === -1 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" /> Không giới hạn
                  </div>
                )}
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div>
                  <span className="text-2xl font-extrabold text-foreground">
                    {viewProduct.price === 0 ? "Miễn phí" : `${viewProduct.price.toLocaleString()}đ`}
                  </span>
                </div>
                {purchased.has(viewProduct.id) ? (
                  <Button variant="outline" className="rounded-xl h-11 px-6" onClick={() => { viewProduct.content && setViewContent({ title: viewProduct.title, content: viewProduct.content }); setViewProduct(null); }}>
                    <Eye className="w-4 h-4 mr-2" /> Xem nội dung
                  </Button>
                ) : (
                  <Button className="rounded-xl h-11 px-6 font-bold" onClick={() => setConfirmBuy(viewProduct)} disabled={buying === viewProduct.id || viewProduct.stock === 0}>
                    {viewProduct.stock === 0 ? "Hết hàng" : (<><ShoppingCart className="w-4 h-4 mr-2" /> Mua ngay</>)}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Purchase Modal */}
      {confirmBuy && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={() => setConfirmBuy(null)}>
          <div className="glass-card rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-extrabold text-foreground">Xác nhận mua hàng</h3>
              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{confirmBuy.title}</p>
            </div>

            <div className="bg-muted/30 rounded-2xl p-4 space-y-3 border border-border/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Giá sản phẩm</span>
                <span className="font-bold text-foreground">{confirmBuy.price === 0 ? "Miễn phí" : `${confirmBuy.price.toLocaleString()}đ`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số dư hiện tại</span>
                <span className="font-bold text-foreground">{balance.toLocaleString()}đ</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between text-sm">
                <span className="text-muted-foreground">Sau khi mua</span>
                <span className={`font-extrabold ${balance >= confirmBuy.price ? "text-emerald-400" : "text-destructive"}`}>
                  {(balance - confirmBuy.price).toLocaleString()}đ
                </span>
              </div>
            </div>

            {balance < confirmBuy.price && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <Wallet className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive font-semibold">Số dư không đủ. Vui lòng nạp thêm tiền.</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setConfirmBuy(null)}>Hủy</Button>
              <Button className="flex-1 rounded-xl h-11 font-bold" onClick={() => handleBuy(confirmBuy)} disabled={buying === confirmBuy.id || balance < confirmBuy.price}>
                {buying === confirmBuy.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Xác nhận</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Viewer Modal */}
      {viewContent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[70] flex items-center justify-center p-4" onClick={() => setViewContent(null)}>
          <div className="glass-card rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Nội dung sản phẩm</p>
                  <h3 className="text-base font-bold text-foreground">{viewContent.title}</h3>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setViewContent(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-2xl p-5 border border-border/30 leading-relaxed">{viewContent.content}</pre>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                className="rounded-xl text-xs h-9 px-4"
                onClick={() => { navigator.clipboard.writeText(viewContent.content); toast({ title: "Đã copy nội dung!" }); }}
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy nội dung
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
