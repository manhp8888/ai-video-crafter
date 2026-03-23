import { useState } from "react";
import { Sparkles } from "lucide-react";
import PromptTemplates from "@/components/PromptTemplates";
import PromptForm from "@/components/PromptForm";
import PromptOutput from "@/components/PromptOutput";
import PromptHistory from "@/components/PromptHistory";
import PremiumBanner from "@/components/PremiumBanner";
import AdPlaceholder from "@/components/AdPlaceholder";
import AISettings from "@/components/AISettings";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateSceneCount, generatePrompt, getRandomIdea, parseDurationSeconds, upsertSceneSection, type PromptData } from "@/lib/prompt";

async function generateAIPrompt(data: PromptData, apiKey: string, aiModel: string, aiProvider: string): Promise<string> {
  const systemPrompt = `Bạn là chuyên gia content video ngắn & prompt engineering cho các công cụ AI video.
Nhiệm vụ: tạo một gói nội dung đầy đủ gồm:
1) Tiêu đề
2) Hashtag
3) Mô tả video chuẩn SEO
4) Prompt tạo ảnh bìa
5) Prompt tổng để tạo video
6) Prompt theo từng cảnh (scene breakdown)

Yêu cầu định dạng:
- Trả về đúng định dạng Markdown với các heading sau:
## Tiêu đề
## Hashtag
## Mô tả video chuẩn SEO
## Prompt tạo ảnh bìa
## Prompt tổng
## Prompt theo cảnh
- Không thêm lời giải thích ngoài các mục trên.`;

  const durationValue = data.duration || "10 giây";
  const durationSeconds = parseDurationSeconds(durationValue);
  const sceneCount = calculateSceneCount(durationValue);

  const userPrompt = `Thông tin người dùng:
- Ngôn ngữ đầu vào: ${data.inputLanguage || "Tiếng Việt"}
- Ngôn ngữ đầu ra: ${data.outputLanguage || "Tiếng Việt"}
- Ý tưởng: ${data.idea || "một khung cảnh thiên nhiên ngoạn mục"}
- Phong cách: ${data.style || "Cinematic"}
- Chuyển động máy quay: ${data.camera || "Slow Zoom"}
- Ánh sáng: ${data.lighting || "Soft Lighting"}
- Tâm trạng: ${data.mood || "Epic"}
- Thời lượng: ${durationValue}
- Mô hình video: ${data.model || "Runway"}

Hãy tạo nội dung theo ngôn ngữ đầu ra đã chọn.
BẮT BUỘC tạo đúng ${sceneCount} cảnh cho video ${durationSeconds} giây.`;

  let apiUrl: string;
  let headers: Record<string, string>;
  let body: Record<string, unknown>;

  if (aiProvider === "gemini") {
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;
    headers = { "Content-Type": "application/json" };
    body = {
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
    };
  } else {
    apiUrl = "https://api.openai.com/v1/chat/completions";
    headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
    body = {
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 900,
      temperature: 0.8,
    };
  }

  const response = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify(body) });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi API: ${response.status}`);
  }

  const result = await response.json();
  let content: string;

  if (aiProvider === "gemini") {
    content = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else {
    content = result.choices?.[0]?.message?.content || "";
  }

  return upsertSceneSection(content, data);
}

const Index = () => {
  const [formData, setFormData] = useState<PromptData>({
    idea: "",
    style: "",
    camera: "",
    lighting: "",
    mood: "",
    model: "",
    duration: "",
    inputLanguage: "Tiếng Việt",
    outputLanguage: "Tiếng Việt",
  });
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("prompt_history");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiApiKey, setAiApiKey] = useState(() => localStorage.getItem("ai_api_key") || "");
  const [aiModel, setAiModel] = useState(() => localStorage.getItem("ai_model") || "gpt-4o");
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem("ai_provider") || "openai");
  const [useAI, setUseAI] = useState(() => localStorage.getItem("use_ai") === "true");
  const { toast } = useToast();

  const pushToHistory = (newPrompt: string) => {
    const updated = [newPrompt, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("prompt_history", JSON.stringify(updated));
  };

  const handleGenerate = async () => {
    if (useAI && aiApiKey) {
      setIsGenerating(true);
      try {
        const result = await generateAIPrompt(formData, aiApiKey, aiModel, aiProvider);
        setPrompt(result);
        pushToHistory(result);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Lỗi không xác định";
        toast({ title: "Lỗi AI", description: msg, variant: "destructive" });
      } finally {
        setIsGenerating(false);
      }
    } else {
      const result = generatePrompt(formData);
      setPrompt(result);
      pushToHistory(result);
    }
  };

  const handleAISuggest = async () => {
    if (!formData.idea.trim()) return;
    setIsSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-suggest", {
        body: { idea: formData.idea },
      });

      if (error) throw error;

      const s = data?.suggestion;
      if (s) {
        setFormData((prev) => ({
          ...prev,
          idea: s.enhancedIdea || prev.idea,
          style: s.style || prev.style,
          camera: s.camera || prev.camera,
          lighting: s.lighting || prev.lighting,
          mood: s.mood || prev.mood,
          model: s.model || prev.model,
          duration: s.duration || prev.duration,
        }));

        // Build preview prompt from suggestion
        const previewParts = [
          s.title && `## Tiêu đề\n${s.title}`,
          s.hashtags && `## Hashtag\n${s.hashtags}`,
          s.description && `## Mô tả video chuẩn SEO\n${s.description}`,
          s.coverPrompt && `## Prompt tạo ảnh bìa\n${s.coverPrompt}`,
        ].filter(Boolean);

        if (previewParts.length > 0) {
          setPrompt(previewParts.join("\n\n"));
        }

        toast({ title: "AI đã gợi ý xong!", description: "Tất cả trường đã được điền. Bạn có thể chỉnh sửa trước khi tạo prompt." });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      toast({ title: "Lỗi gợi ý AI", description: msg, variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleTemplateSelect = (template: PromptData) => {
    setFormData(template);
  };

  const handleRandomIdea = () => {
    setFormData((prev) => ({ ...prev, idea: getRandomIdea() }));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("prompt_history");
  };

  const handleAISettingsChange = (key: string, model: string, enabled: boolean, provider: string) => {
    setAiApiKey(key);
    setAiModel(model);
    setUseAI(enabled);
    setAiProvider(provider);
    localStorage.setItem("ai_api_key", key);
    localStorage.setItem("ai_model", model);
    localStorage.setItem("use_ai", String(enabled));
    localStorage.setItem("ai_provider", provider);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8 gap-6">
      <div className="w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Trình Tạo Prompt AI</h1>
        </div>
        <ThemeToggle />
      </div>

      <p className="text-muted-foreground text-sm text-center max-w-2xl">
        Tạo prompt chuyên nghiệp cho mọi công cụ AI tạo video & hình ảnh — Runway, Pika, Sora, Kling, Hailuo, Jimeng và nhiều hơn nữa
      </p>

      <PremiumBanner />
      <AdPlaceholder position="top" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <PromptTemplates onSelect={handleTemplateSelect} />
          <PromptForm
            data={formData}
            onChange={setFormData}
            onGenerate={handleGenerate}
            onRandomIdea={handleRandomIdea}
            onAISuggest={handleAISuggest}
            isGenerating={isGenerating}
            isSuggesting={isSuggesting}
            useAI={useAI && !!aiApiKey}
          />
          {prompt && <PromptOutput prompt={prompt} />}
        </div>

        <div className="space-y-6">
          <AISettings
            apiKey={aiApiKey}
            model={aiModel}
            useAI={useAI}
            aiProvider={aiProvider}
            onChange={handleAISettingsChange}
          />
          <PromptHistory history={history} onSelect={setPrompt} onClear={handleClearHistory} />
          <AdPlaceholder position="sidebar" />
        </div>
      </div>

      <AdPlaceholder position="bottom" />
    </div>
  );
};

export default Index;
