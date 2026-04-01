import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Link, Loader2, Upload, X, Sparkles, Copy, Check, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ReferenceResult {
  visual_prompt: string;
  motion_prompt: string;
  cinematic_style: string;
  negative_prompt: string;
  title: string;
  hashtags: string[];
  camera_settings?: { angle: string; lens: string; fps: string; motion: string };
  lighting_settings?: { type: string; time_of_day: string; color_temperature: string };
}

export interface PromptVariant {
  label: string;
  visual_prompt: string;
  motion_prompt: string;
  cinematic_style: string;
  negative_prompt: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      variant="ghost" size="sm" className="h-7 text-xs shrink-0 rounded-lg"
    >
      {copied ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied ? "Đã chép" : "Sao chép"}
    </Button>
  );
}

function PromptBlock({ icon, label, content }: { icon: string; label: string; content: string }) {
  if (!content) return null;
  return (
    <div className="bg-background/50 border border-border/50 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <span>{icon}</span> {label}
        </span>
        <CopyBtn text={content} />
      </div>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

const ReferencePrompt = () => {
  const [tab, setTab] = useState("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [additionalIdea, setAdditionalIdea] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ReferenceResult | null>(null);
  const [variants, setVariants] = useState<PromptVariant[]>([]);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File quá lớn", description: "Tối đa 10MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (tab === "upload" && !imagePreview) {
      toast({ title: "Chưa có ảnh", description: "Vui lòng upload ảnh reference", variant: "destructive" });
      return;
    }
    if (tab === "youtube" && !youtubeUrl.trim()) {
      toast({ title: "Chưa có link", description: "Vui lòng dán link YouTube", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setVariants([]);
    try {
      const body: Record<string, string> = { idea: additionalIdea, outputLanguage: "Tiếng Việt" };
      if (tab === "upload") body.referenceImage = imagePreview!;
      else body.youtubeUrl = youtubeUrl;

      const { data, error } = await supabase.functions.invoke("ai-reference-prompt", { body });
      if (error) throw error;
      if (data?.prompt) {
        setResult(data.prompt);
        toast({ title: "Phân tích thành công!", description: "AI đã tạo prompt từ reference." });
      }
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi không xác định", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateVariants = async () => {
    if (!result) return;
    setIsGeneratingVariants(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-variants", {
        body: {
          visual_prompt: result.visual_prompt,
          motion_prompt: result.motion_prompt,
          cinematic_style: result.cinematic_style,
          outputLanguage: "Tiếng Việt",
        },
      });
      if (error) throw error;
      if (data?.variants) {
        setVariants(data.variants);
        toast({ title: "Đã tạo 3 biến thể!" });
      }
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Input Section */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Tạo Prompt từ Reference</h3>
            <p className="text-xs text-muted-foreground">Upload ảnh hoặc dán link YouTube để AI phân tích</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1 text-xs gap-1.5">
              <Image className="w-3.5 h-3.5" /> Upload Ảnh/Video
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex-1 text-xs gap-1.5">
              <Link className="w-3.5 h-3.5" /> Link YouTube
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-3 space-y-3">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Reference" className="w-full max-h-64 object-contain rounded-xl border border-border" />
                <Button
                  onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  variant="destructive" size="sm" className="absolute top-2 right-2 h-7 w-7 p-0 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Nhấn để chọn ảnh hoặc kéo thả</span>
                <span className="text-xs text-muted-foreground/60">PNG, JPG, WebP (tối đa 10MB)</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          </TabsContent>

          <TabsContent value="youtube" className="mt-3">
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="rounded-xl"
            />
          </TabsContent>
        </Tabs>

        <Textarea
          placeholder="Mô tả thêm ý tưởng (tùy chọn)... VD: 'Muốn phong cách cyberpunk, thêm hiệu ứng neon'"
          value={additionalIdea}
          onChange={(e) => setAdditionalIdea(e.target.value)}
          className="min-h-[60px] rounded-xl resize-none bg-background/50"
        />

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full h-11 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-[hsl(280,80%,55%)] hover:opacity-90 shadow-lg shadow-primary/20"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {isAnalyzing ? "Đang phân tích reference..." : "Phân tích & Tạo Prompt"}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="glass-card rounded-2xl p-5 space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center text-xs text-primary-foreground">🎬</span>
              {result.title || "Kết quả Reference Prompt"}
            </span>
            <Button
              onClick={handleGenerateVariants}
              disabled={isGeneratingVariants}
              variant="outline" size="sm" className="h-8 text-xs rounded-lg"
            >
              {isGeneratingVariants ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Layers className="w-3.5 h-3.5 mr-1" />}
              Tạo biến thể (3)
            </Button>
          </div>

          <div className="space-y-3">
            <PromptBlock icon="👁️" label="Visual Prompt" content={result.visual_prompt} />
            <PromptBlock icon="🎬" label="Motion Prompt" content={result.motion_prompt} />
            <PromptBlock icon="🎨" label="Cinematic Style" content={result.cinematic_style} />
            <PromptBlock icon="🚫" label="Negative Prompt" content={result.negative_prompt} />

            {(result.camera_settings || result.lighting_settings) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.camera_settings && (
                  <div className="bg-background/50 border border-border/50 rounded-xl p-3.5">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">📷 Camera</span>
                    <p className="text-xs text-foreground leading-relaxed">
                      {result.camera_settings.lens} · {result.camera_settings.angle} · {result.camera_settings.motion} · {result.camera_settings.fps}
                    </p>
                  </div>
                )}
                {result.lighting_settings && (
                  <div className="bg-background/50 border border-border/50 rounded-xl p-3.5">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">💡 Ánh sáng</span>
                    <p className="text-xs text-foreground leading-relaxed">
                      {result.lighting_settings.type} · {result.lighting_settings.time_of_day} · {result.lighting_settings.color_temperature}
                    </p>
                  </div>
                )}
              </div>
            )}

            {result.hashtags && result.hashtags.length > 0 && (
              <PromptBlock icon="#️⃣" label="Hashtag" content={result.hashtags.join(" ")} />
            )}
          </div>
        </div>
      )}

      {/* Variants */}
      {variants.length > 0 && (
        <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> 3 Biến thể
          </h4>
          {variants.map((v, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-primary">#{i + 1} — {v.label}</span>
              <PromptBlock icon="👁️" label="Visual" content={v.visual_prompt} />
              <PromptBlock icon="🎬" label="Motion" content={v.motion_prompt} />
              <PromptBlock icon="🎨" label="Style" content={v.cinematic_style} />
              <PromptBlock icon="🚫" label="Negative" content={v.negative_prompt} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferencePrompt;
