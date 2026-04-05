import { useState, useEffect } from "react";
import { Store, ShoppingCart, Loader2, Check, Eye, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  content: string | null;
}

const Marketplace = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [buying, setBuying] = useState<string | null>(null);
  const [viewContent, setViewContent] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: prods } = await supabase
          .from("marketplace_products")
          .select("id, title, description, price, category, image_url, content")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        setProducts((prods as Product[]) || []);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("balance")
            .eq("id", user.id)
            .maybeSingle();
          setBalance(profile?.balance || 0);

          const { data: purchases } = await supabase
            .from("user_purchases")
            .select("product_id")
            .eq("user_id", user.id);
          setPurchased(new Set((purchases || []).map(p => p.product_id)));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleBuy = async (product: Product) => {
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
      toast({ title: "🎉 Mua thành công!", description: product.title });

      if (data.content) {
        setViewContent({ title: product.title, content: data.content });
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
    <div className="flex flex-col items-center px-4 py-6 gap-6">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Chợ Prompt</h1>
              <p className="text-sm text-muted-foreground">Mua prompt chất lượng cao</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{balance.toLocaleString()}đ</span>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">Chưa có sản phẩm</h2>
            <p className="text-sm text-muted-foreground">Sản phẩm sẽ được cập nhật sớm.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const owned = purchased.has(p.id);
              return (
                <div key={p.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                  {p.image_url && (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground line-clamp-2">{p.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                        {p.category}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">{p.description}</p>
                    )}
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="text-base font-bold text-foreground">
                        {p.price === 0 ? "Miễn phí" : `${p.price.toLocaleString()}đ`}
                      </span>
                      {owned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs"
                          onClick={() => p.content && setViewContent({ title: p.title, content: p.content })}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Xem
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="rounded-xl text-xs"
                          onClick={() => handleBuy(p)}
                          disabled={buying === p.id}
                        >
                          {buying === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : (
                            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                          )}
                          Mua
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content viewer modal */}
      {viewContent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewContent(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{viewContent.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewContent(null)}>✕</Button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 rounded-xl p-4">{viewContent.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
