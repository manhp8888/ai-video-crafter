import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Scissors, Loader2, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UsageLimitBanner, useUsageLimit } from "@/components/UsageLimitBanner";

const ImageSegment = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [instruction, setInstruction] = useState("Tách quần áo của người mẫu ra nền trắng sạch, giữ nguyên chi tiết vải và màu sắc");
  const [resultImage, setResultImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { canUse, recordUsage } = useUsageLimit("image_segment", 2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setResultImage("");
  };

  const handleProcess = async () => {
    if (!imagePreview) {
      toast({ title: "Vui lòng chọn ảnh", variant: "destructive" });
      return;
    }
    if (!canUse) {
      toast({ title: "Hết lượt miễn phí", description: "Nâng cấp Premium để tiếp tục", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-image-process", {
        body: { image: imagePreview, instruction },
      });
      if (error) throw error;
      if (data?.resultImage) {
        setResultImage(data.resultImage);
        toast({ title: "Xử lý thành công!" });
      } else {
        throw new Error("Không nhận được kết quả từ AI");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      toast({ title: "Lỗi xử lý ảnh", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = "segmented-image.png";
    link.click();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary" />
          Tách ảnh AI
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tách quần áo, phụ kiện từ ảnh người mẫu ra nền mới bằng AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <label className="text-sm font-medium text-foreground">Ảnh gốc</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg object-contain" />
              ) : (
                <div className="text-center space-y-2">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Nhấn để chọn ảnh</p>
                  <p className="text-xs text-muted-foreground/60">PNG, JPG, WEBP</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <label className="text-sm font-medium text-foreground">Hướng dẫn AI</label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="VD: Tách chiếc áo sơ mi ra nền trắng..."
              className="min-h-[80px] rounded-xl resize-none"
            />
            <Button onClick={handleProcess} disabled={loading || !imagePreview} className="w-full rounded-xl">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scissors className="w-4 h-4 mr-2" />}
              {loading ? "Đang xử lý..." : "Tách ảnh"}
            </Button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <label className="text-sm font-medium text-foreground">Kết quả</label>
          {resultImage ? (
            <div className="space-y-3">
              <img src={resultImage} alt="Result" className="w-full rounded-xl object-contain bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]" />
              <Button onClick={handleDownload} variant="secondary" className="w-full rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Tải ảnh về
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

export default ImageSegment;
