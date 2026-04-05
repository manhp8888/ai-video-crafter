import { useState, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  content: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  adminCall: (action: string, params?: Record<string, unknown>) => Promise<unknown>;
}

export default function AdminProducts({ adminCall }: Props) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "0", category: "prompt", image_url: "", content: "" });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await adminCall("list-products");
      setProducts(data as Product[]);
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await adminCall("create-product", {
        title: form.title,
        description: form.description || null,
        price: parseInt(form.price) || 0,
        category: form.category || "prompt",
        image_url: form.image_url || null,
        content: form.content || null,
      });
      toast({ title: "Tạo sản phẩm thành công!" });
      setForm({ title: "", description: "", price: "0", category: "prompt", image_url: "", content: "" });
      setShowForm(false);
      loadProducts();
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await adminCall("toggle-product", { product_id: id, is_active: !active });
      loadProducts();
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminCall("delete-product", { product_id: id });
      toast({ title: "Đã xóa sản phẩm." });
      loadProducts();
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Sản phẩm ({products.length})</span>
        <Button size="sm" className="rounded-xl text-xs" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Thêm sản phẩm
        </Button>
      </div>

      {showForm && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <span className="text-sm font-semibold text-foreground">Thêm sản phẩm mới</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tên sản phẩm" className="rounded-xl h-10" />
            <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Giá (VNĐ)" type="number" className="rounded-xl h-10" />
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Danh mục" className="rounded-xl h-10" />
            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="URL ảnh (tùy chọn)" className="rounded-xl h-10" />
          </div>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn" className="rounded-xl h-10" />
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Nội dung sản phẩm (prompt, tài liệu...)"
            className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={handleCreate} disabled={creating || !form.title.trim()} className="rounded-xl h-10">
            {creating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
            Tạo sản phẩm
          </Button>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5 gap-3 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{p.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {p.is_active ? "Hiển thị" : "Ẩn"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.price === 0 ? "Miễn phí" : `${p.price.toLocaleString()}đ`} · {p.category} · {new Date(p.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleToggle(p.id, p.is_active)}>
                    {p.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
