import { useState, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Package, Pencil, X, List } from "lucide-react";
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

interface ProductItem {
  id: string;
  product_id: string;
  content: string;
  is_sold: boolean;
  sold_to: string | null;
  sold_at: string | null;
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
  const [mode, setMode] = useState<"list" | "create" | "edit" | "items">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [searchTerm, setSearchTerm] = useState("");

  // Items management
  const [itemsProduct, setItemsProduct] = useState<Product | null>(null);
  const [items, setItems] = useState<ProductItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [newItemsText, setNewItemsText] = useState("");
  const [addingItems, setAddingItems] = useState(false);

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

  const openCreate = () => { setForm(defaultForm); setEditId(null); setMode("create"); };

  const openEdit = (p: Product) => {
    setForm({
      title: p.title, description: p.description || "", details: p.details || "",
      price: String(p.price), category: p.category, image_url: p.image_url || "",
      content: p.content || "", stock: String(p.stock),
    });
    setEditId(p.id);
    setMode("edit");
  };

  const openItems = async (p: Product) => {
    setItemsProduct(p);
    setMode("items");
    setItemsLoading(true);
    try {
      const data = await adminCall("list-product-items", { product_id: p.id });
      setItems(data as ProductItem[]);
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setItemsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title, description: form.description || null,
        details: form.details || null, price: parseInt(form.price) || 0,
        category: form.category || "prompt", image_url: form.image_url || null,
        content: form.content || null, stock: parseInt(form.stock),
      };
      if (mode === "edit" && editId) {
        await adminCall("update-product", { product_id: editId, ...payload });
        toast({ title: "Cập nhật thành công!" });
      } else {
        await adminCall("create-product", payload);
        toast({ title: "Tạo sản phẩm thành công!" });
      }
      setMode("list"); setForm(defaultForm); loadProducts();
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try { await adminCall("toggle-product", { product_id: id, is_active: !active }); loadProducts(); }
    catch (e) { toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    try { await adminCall("delete-product", { product_id: id }); toast({ title: "Đã xóa." }); loadProducts(); }
    catch (e) { toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" }); }
  };

  const handleAddItems = async () => {
    if (!newItemsText.trim() || !itemsProduct) return;
    const lines = newItemsText.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setAddingItems(true);
    try {
      await adminCall("add-product-items", { product_id: itemsProduct.id, items: lines });
      toast({ title: `Đã thêm ${lines.length} mục!` });
      setNewItemsText("");
      // Reload items and products
      const data = await adminCall("list-product-items", { product_id: itemsProduct.id });
      setItems(data as ProductItem[]);
      loadProducts();
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally { setAddingItems(false); }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!itemsProduct) return;
    try {
      await adminCall("delete-product-item", { item_id: itemId });
      setItems(prev => prev.filter(i => i.id !== itemId));
      loadProducts();
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    }
  };

  const filteredProducts = products.filter(p => !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalSales = products.reduce((s, p) => s + p.sales_count, 0);
  const totalRevenue = products.reduce((s, p) => s + p.sales_count * p.price, 0);

  // ===== ITEMS VIEW =====
  if (mode === "items" && itemsProduct) {
    const available = items.filter(i => !i.is_sold);
    const sold = items.filter(i => i.is_sold);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-foreground">Kho: {itemsProduct.title}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {available.length} còn · {sold.length} đã bán · {items.length} tổng
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMode("list")}><X className="w-4 h-4" /></Button>
        </div>

        {/* Add items */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-foreground">Thêm tài khoản / nội dung</p>
          <p className="text-[11px] text-muted-foreground">Mỗi dòng = 1 tài khoản riêng. Khi khách mua sẽ nhận 1 tài khoản chưa bán.</p>
          <textarea
            value={newItemsText}
            onChange={e => setNewItemsText(e.target.value)}
            placeholder={"user1@email.com | pass123\nuser2@email.com | pass456\nuser3@email.com | pass789"}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring font-mono text-xs"
          />
          <Button onClick={handleAddItems} disabled={addingItems || !newItemsText.trim()} className="rounded-xl text-xs">
            {addingItems ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
            Thêm {newItemsText.split("\n").filter(l => l.trim()).length} mục
          </Button>
        </div>

        {/* Items list */}
        {itemsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Chưa có mục nào. Thêm tài khoản ở trên.</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className={`flex items-center justify-between px-4 py-2.5 gap-3 ${item.is_sold ? "opacity-60 bg-muted/20" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-foreground truncate">{item.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {item.is_sold ? `Đã bán · ${new Date(item.sold_at!).toLocaleDateString("vi")}` : "Chưa bán"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.is_sold ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                    {item.is_sold ? "Đã bán" : "Còn"}
                  </span>
                  {!item.is_sold && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== CREATE/EDIT VIEW =====
  if (mode === "create" || mode === "edit") {
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
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="Tồn kho (-1 = tự động)" type="number" className="rounded-xl h-10" />
          </div>
          <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="URL ảnh sản phẩm" className="rounded-xl h-10" />
          <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn" className="rounded-xl h-10" />
          <textarea value={form.details} onChange={e => setForm({ ...form, details: e.target.value })}
            placeholder="Mô tả chi tiết sản phẩm" className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring" />
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-bold text-foreground mb-1">Nội dung chung (tùy chọn)</p>
            <p className="text-[10px] text-muted-foreground mb-2">Dùng cho sản phẩm không cần kho riêng lẻ (VD: prompt, hướng dẫn). Nếu bán tài khoản, hãy dùng "Quản lý kho" thay vì điền ở đây.</p>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Nội dung giao cho tất cả khách mua (nếu không dùng kho riêng lẻ)" className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
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

  // ===== LIST VIEW =====
  return (
    <div className="space-y-4">
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

      <div className="flex items-center gap-2">
        <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm sản phẩm..." className="flex-1 rounded-xl h-9 text-xs" />
        <Button size="sm" className="rounded-xl text-xs shrink-0" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
        </Button>
      </div>

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
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Quản lý kho" onClick={() => openItems(p)}>
                    <List className="w-3.5 h-3.5" />
                  </Button>
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
