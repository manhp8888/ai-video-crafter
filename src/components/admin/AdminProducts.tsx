import { useState, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Package, Pencil, X, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  is_active: boolean;
  created_at: string;
}

interface Props {
  adminCall: (action: string, params?: Record<string, unknown>) => Promise<unknown>;
}

const CATEGORIES = ["prompt", "account", "tool"];

const defaultForm = { title: "", description: "", details: "", price: "0", category: "prompt", image_url: "", content: "", stock: "-1" };

export default function AdminProducts({ adminCall }: Props) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [searchTerm, setSearchTerm] = useState("");

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

  const openCreate = () => {
    setForm(defaultForm);
    setEditId(null);
    setMode("create");
  };

  const openEdit = (p: Product) => {
    setForm({
      title: p.title,
      description: p.description || "",
      details: p.details || "",
      price: String(p.price),
      category: p.category,
      image_url: p.image_url || "",
      content: p.content || "",
      stock: String(p.stock),
    });
    setEditId(p.id);
    setMode("edit");
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        details: form.details || null,
        price: parseInt(form.price) || 0,
        category: form.category || "prompt",
        image_url: form.image_url || null,
        content: form.content || null,
        stock: parseInt(form.stock),
      };

      if (mode === "edit" && editId) {
        await adminCall("update-product", { product_id: editId, ...payload });
        toast({ title: "Cập nhật thành công!" });
      } else {
        await adminCall("create-product", payload);
        toast({ title: "Tạo sản phẩm thành công!" });
      }
      setMode("list");
      setForm(defaultForm);
      loadProducts();
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setSaving(false);
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

  const filteredProducts = products.filter(p =>
    !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSales = products.reduce((s, p) => s + p.sales_count, 0);
  const totalRevenue = products.reduce((s, p) => s + p.sales_count * p.price, 0);

  if (mode !== "list") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{mode === "create" ? "Thêm sản phẩm mới" : "Sửa sản phẩm"}</span>
          <Button variant="ghost" size="sm" onClick={() => setMode("list")}><X className="w-4 h-4" /></Button>
        </div>
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Tên sản phẩm *" className="rounded-xl h-10" />
            <Input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Giá (VNĐ)" type="number" className="rounded-xl h-10" />
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="Tồn kho (-1 = vô hạn)" type="number" className="rounded-xl h-10" />
          </div>
          <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="URL ảnh sản phẩm" className="rounded-xl h-10" />
          <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn" className="rounded-xl h-10" />
          <textarea
            value={form.details}
            onChange={e => setForm({ ...form, details: e.target.value })}
            placeholder="Mô tả chi tiết sản phẩm (hiển thị khi xem chi tiết)"
            className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="Nội dung ẩn (giao cho khách sau khi mua: tài khoản, prompt...)"
            className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setMode("list")}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()} className="rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
              {mode === "edit" ? "Lưu thay đổi" : "Tạo sản phẩm"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-foreground">{products.length}</p>
          <p className="text-[10px] text-muted-foreground">Sản phẩm</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-foreground">{totalSales}</p>
          <p className="text-[10px] text-muted-foreground">Đã bán</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-primary">{totalRevenue.toLocaleString()}đ</p>
          <p className="text-[10px] text-muted-foreground">Doanh thu</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Tìm sản phẩm..."
          className="flex-1 rounded-xl h-9 text-xs"
        />
        <Button size="sm" className="rounded-xl text-xs shrink-0" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
        </Button>
      </div>

      {/* Product list */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate">{p.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${p.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {p.is_active ? "ON" : "OFF"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {p.price === 0 ? "Miễn phí" : `${p.price.toLocaleString()}đ`} · {p.category} · {p.sales_count} bán · kho: {p.stock === -1 ? "∞" : p.stock}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(p)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleToggle(p.id, p.is_active)}>
                    {p.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
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
