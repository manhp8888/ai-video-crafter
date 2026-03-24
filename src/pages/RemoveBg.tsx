import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Loader2, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const RemoveBg = () => {
  const [imagePreview, setImagePreview] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImagePreview(reader.result as string); setResultImage(""); };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!imagePreview) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-image-process", {
        body: { image: imagePreview, instruction: "Xóa hoàn toàn nền ảnh, giữ lại chủ thể chính với viền sạch sẽ, xuất ảnh nền trong suốt" },
      });
      if (error) throw error;
      if (data?.resultImage) {
        setResultImage(data.resultImage);
        toast({ title: "Xóa nền thành công!" });
      }
    } catch (err: unknown) {
      toast({ title: "Lỗi", description: err instanceof Error ? err.message : "Lỗi không xác định", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Eraser className="w-5 h-5 text-primary" /> Xóa nền ảnh
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Xóa nền ảnh tự động bằng AI, giữ chủ thể sắc nét</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <label className="text-sm font-medium text-foreground">Ảnh gốc</label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg object-contain" />
            ) : (
              <div className="text-center space-y-2">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Nhấn để chọn ảnh</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
          <Button onClick={handleProcess} disabled={loading || !imagePreview} className="w-full rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eraser className="w-4 h-4 mr-2" />}
            {loading ? "Đang xử lý..." : "Xóa nền"}
          </Button>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <label className="text-sm font-medium text-foreground">Kết quả</label>
          {resultImage ? (
            <div className="space-y-3">
              <img src={resultImage} alt="Result" className="w-full rounded-xl object-contain bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]" />
              <Button onClick={() => { const a = document.createElement("a"); a.href = resultImage; a.download = "no-bg.png"; a.click(); }} variant="secondary" className="w-full rounded-xl">
                <Download className="w-4 h-4 mr-2" /> Tải ảnh về
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground">Kết quả sẽ hiển thị ở đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoveBg;
