import { useState, useEffect, useMemo } from "react";
import { Store, ShoppingCart, Loader2, Eye, Wallet, Search, Tag, Package, Star, ShieldCheck, ArrowDownUp, Clock, TrendingUp, DollarSign, Copy, X, ShoppingBag } from "lucide-react";
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
  marketplace_products: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    content: string | null;
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
      toast({ title: "🎉 Mua thành công!", description: product.title });

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
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Chợ sản phẩm</h1>
              <p className="text-sm text-muted-foreground">Mua prompt, tài khoản & công cụ AI</p>
            </div>
          </div>
          {isLoggedIn && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{balance.toLocaleString()}đ</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/60 rounded-xl mb-5 w-fit">
          <button
            onClick={() => setTab("shop")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "shop" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Store className="w-4 h-4" /> Cửa hàng
          </button>
          {isLoggedIn && (
            <button
              onClick={() => setTab("purchased")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "purchased" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ShoppingBag className="w-4 h-4" /> Đã mua
              {purchased.size > 0 && (
                <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{purchased.size}</span>
              )}
            </button>
          )}
        </div>

        {/* ===== PURCHASED TAB ===== */}
        {tab === "purchased" ? (
          <div>
            {purchases.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-bold text-foreground mb-2">Chưa có sản phẩm nào</h2>
                <p className="text-sm text-muted-foreground mb-4">Hãy khám phá cửa hàng và mua sản phẩm đầu tiên</p>
                <Button className="rounded-xl" onClick={() => setTab("shop")}>
                  <Store className="w-4 h-4 mr-2" /> Đến cửa hàng
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchases.map((p) => {
                  const prod = p.marketplace_products;
                  if (!prod) return null;
                  return (
                    <div key={p.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                      <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden relative">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-muted-foreground/30" />
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 text-[10px] px-2.5 py-1 rounded-lg bg-success/90 text-success-foreground font-bold">
                          Đã mua
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-foreground">{prod.title}</h3>
                        {prod.description && <p className="text-xs text-muted-foreground line-clamp-2">{prod.description}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Mua ngày {new Date(p.purchased_at).toLocaleDateString("vi-VN")}
                        </p>
                        <div className="mt-auto pt-3 flex gap-2">
                          {prod.content && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl text-xs h-8 flex-1"
                                onClick={() => setViewContent({ title: prod.title, content: prod.content! })}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> Xem
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-xl text-xs h-8"
                                onClick={() => { navigator.clipboard.writeText(prod.content!); toast({ title: "Đã copy!" }); }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
              <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl">
                {CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${category === c.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <c.icon className="w-3.5 h-3.5" />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & stats */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs text-muted-foreground">{filtered.length} sản phẩm</span>
              <div className="flex gap-1 items-center">
                <ArrowDownUp className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                {SORT_OPTIONS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSort(s.key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${sort === s.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-bold text-foreground mb-2">Không tìm thấy sản phẩm</h2>
                <p className="text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa</p>
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
                      className="group glass-card rounded-2xl overflow-hidden flex flex-col hover:shadow-md hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                      onClick={() => setViewProduct(p)}
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden relative">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-muted-foreground/30" />
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 text-[10px] px-2.5 py-1 rounded-lg bg-background/80 backdrop-blur-sm text-foreground font-semibold">
                          {p.category}
                        </span>
                        {isHot && !owned && !outOfStock && (
                          <span className="absolute top-2.5 right-2.5 text-[10px] px-2 py-0.5 rounded-lg bg-orange-500/90 text-white font-bold animate-pulse">
                            HOT
                          </span>
                        )}
                        {owned && (
                          <span className="absolute top-2.5 right-2.5 text-[10px] px-2.5 py-1 rounded-lg bg-success/90 text-success-foreground font-bold">
                            Đã mua
                          </span>
                        )}
                        {outOfStock && !owned && (
                          <span className="absolute top-2.5 right-2.5 text-[10px] px-2.5 py-1 rounded-lg bg-destructive/90 text-destructive-foreground font-bold">
                            Hết hàng
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h3>
                        {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                        <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/50">
                          <div>
                            <span className="text-base font-bold text-foreground">
                              {p.price === 0 ? "Miễn phí" : `${p.price.toLocaleString()}đ`}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{p.sales_count} đã bán</span>
                              {p.stock > 0 && <span className="text-[10px] text-muted-foreground">· còn {p.stock}</span>}
                            </div>
                          </div>
                          {owned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs h-8"
                              onClick={(e) => { e.stopPropagation(); p.content && setViewContent({ title: p.title, content: p.content }); }}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Xem
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="rounded-xl text-xs h-8"
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

      {/* Product Detail Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewProduct(null)}>
          <div className="glass-card rounded-2xl max-w-lg w-full max-h-[85vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {viewProduct.image_url ? (
              <div className="aspect-video bg-muted overflow-hidden rounded-t-2xl">
                <img src={viewProduct.image_url} alt={viewProduct.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-t-2xl flex items-center justify-center">
                <Package className="w-14 h-14 text-muted-foreground/20" />
              </div>
            )}
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{viewProduct.category}</span>
                  <h2 className="text-lg font-bold text-foreground mt-2">{viewProduct.title}</h2>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setViewProduct(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {viewProduct.description && <p className="text-sm text-muted-foreground">{viewProduct.description}</p>}
              {viewProduct.details && (
                <div className="bg-muted/40 rounded-xl p-4">
                  <p className="text-xs font-semibold text-foreground mb-2">Chi tiết sản phẩm</p>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{viewProduct.details}</pre>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{viewProduct.sales_count} lượt mua</span>
                {viewProduct.stock > 0 && <span>Còn {viewProduct.stock} sản phẩm</span>}
                {viewProduct.stock === -1 && <span>Không giới hạn</span>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xl font-bold text-foreground">
                  {viewProduct.price === 0 ? "Miễn phí" : `${viewProduct.price.toLocaleString()}đ`}
                </span>
                {purchased.has(viewProduct.id) ? (
                  <Button variant="outline" className="rounded-xl" onClick={() => { viewProduct.content && setViewContent({ title: viewProduct.title, content: viewProduct.content }); setViewProduct(null); }}>
                    <Eye className="w-4 h-4 mr-2" /> Xem nội dung
                  </Button>
                ) : (
                  <Button className="rounded-xl" onClick={() => setConfirmBuy(viewProduct)} disabled={buying === viewProduct.id || viewProduct.stock === 0}>
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setConfirmBuy(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Xác nhận mua</h3>
              <p className="text-sm text-muted-foreground mt-1">{confirmBuy.title}</p>
            </div>

            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Giá</span>
                <span className="font-bold text-foreground">{confirmBuy.price === 0 ? "Miễn phí" : `${confirmBuy.price.toLocaleString()}đ`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số dư hiện tại</span>
                <span className="font-bold text-foreground">{balance.toLocaleString()}đ</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Số dư sau mua</span>
                <span className={`font-bold ${balance >= confirmBuy.price ? "text-success" : "text-destructive"}`}>
                  {(balance - confirmBuy.price).toLocaleString()}đ
                </span>
              </div>
            </div>

            {balance < confirmBuy.price && (
              <p className="text-xs text-destructive text-center font-semibold">Số dư không đủ. Vui lòng nạp thêm tiền.</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmBuy(null)}>Hủy</Button>
              <Button className="flex-1 rounded-xl" onClick={() => handleBuy(confirmBuy)} disabled={buying === confirmBuy.id || balance < confirmBuy.price}>
                {buying === confirmBuy.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Viewer Modal */}
      {viewContent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setViewContent(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{viewContent.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewContent(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 rounded-xl p-4">{viewContent.content}</pre>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => { navigator.clipboard.writeText(viewContent.content); toast({ title: "Đã copy!" }); }}
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
