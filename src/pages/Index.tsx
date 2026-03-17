import { useState } from "react";
import { Sparkles } from "lucide-react";
import PromptTemplates from "@/components/PromptTemplates";
import PromptForm from "@/components/PromptForm";
import PromptOutput from "@/components/PromptOutput";
import PromptHistory from "@/components/PromptHistory";
import PremiumBanner from "@/components/PremiumBanner";
import AdPlaceholder from "@/components/AdPlaceholder";
import AISettings from "@/components/AISettings";
import { useToast } from "@/hooks/use-toast";

export interface PromptData {
  idea: string;
  style: string;
  camera: string;
  lighting: string;
  mood: string;
  model: string;
  duration: string;
}

function generatePrompt(data: PromptData) {
  const style = data.style || "Cinematic";
  const camera = data.camera || "Slow Zoom";
  const lighting = data.lighting || "Soft Lighting";
  const mood = data.mood || "Epic";
  const model = data.model || "Runway";
  const duration = data.duration || "10 giây";
  const idea = data.idea.trim() || "một khung cảnh thiên nhiên ngoạn mục";

  return `[${model} Prompt] Video ${duration} phong cách ${style.toLowerCase()} về ${idea}. Quay bằng ${camera.toLowerCase()}, ${lighting.toLowerCase()}, tạo bầu không khí ${mood.toLowerCase()}. Chất lượng cao, độ phân giải 4K, chỉnh màu điện ảnh, bố cục chuyên nghiệp. --style ${style.toLowerCase().replace(/\s/g, "_")} --mood ${mood.toLowerCase()} --duration ${duration}`;
}
import { calculateSceneCount, generatePrompt, getRandomIdea, parseDurationSeconds, upsertSceneSection, type PromptData } from "@/lib/prompt";

async function generateAIPrompt(data: PromptData, apiKey: string, aiModel: string): Promise<string> {
  const systemPrompt = `Bạn là chuyên gia tạo prompt cho các công cụ tạo video AI (Runway, Pika, Sora, Kling). Hãy tạo prompt chi tiết, chuyên nghiệp bằng tiếng Anh dựa trên thông tin người dùng cung cấp. Prompt phải mô tả cảnh quay điện ảnh, bao gồm chi tiết về ánh sáng, góc quay, chuyển động, bầu không khí, và kỹ thuật hậu kỳ. Chỉ trả về prompt, không giải thích thêm.`;

  const userPrompt = `Tạo prompt video AI với các thông số sau:
  const systemPrompt = `Bạn là chuyên gia content video ngắn & prompt engineering cho các công cụ AI video (Runway, Pika, Sora, Kling).
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
- Thời lượng: ${data.duration || "10 giây"}
- Thời lượng: ${durationValue}
- Mô hình video: ${data.model || "Runway"}

Hãy tạo prompt chi tiết, chuyên nghiệp cho ${data.model || "Runway"}.`;
Hãy tạo nội dung theo ngôn ngữ đầu ra đã chọn.
BẮT BUỘC tạo đúng ${sceneCount} cảnh cho video ${durationSeconds} giây (không hơn, không kém).
Generate ${sceneCount} scenes for a ${durationSeconds} second video.
Each scene should include:
- scene number
- time range
- camera movement
- description
Make sure the total scene timing equals the selected duration.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 500,
      max_tokens: 900,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi API: ${response.status}`);
  }

  const result = await response.json();
  return `[${data.model || "Runway"} Prompt] ${result.choices[0].message.content}`;
  return upsertSceneSection(result.choices[0].message.content || "", data);
}

const Index = () => {
  const [formData, setFormData] = useState<PromptData>({
    idea: "", style: "", camera: "", lighting: "", mood: "", model: "", duration: "",
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
  const [history, setHistory] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("prompt_history");
    if (!saved) {
      return [];
    }

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiApiKey, setAiApiKey] = useState(() => localStorage.getItem("openai_api_key") || "");
  const [aiModel, setAiModel] = useState(() => localStorage.getItem("openai_model") || "gpt-4o");
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
        const result = await generateAIPrompt(formData, aiApiKey, aiModel);
        setPrompt(result);
        setHistory((prev) => [result, ...prev].slice(0, 10));
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
      setHistory((prev) => [result, ...prev].slice(0, 10));
      pushToHistory(result);
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

  const handleAISettingsChange = (key: string, model: string, enabled: boolean) => {
    setAiApiKey(key);
    setAiModel(model);
    setUseAI(enabled);
    localStorage.setItem("openai_api_key", key);
    localStorage.setItem("openai_model", model);
    localStorage.setItem("use_ai", String(enabled));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8 gap-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Trình Tạo Prompt Video AI</h1>
        </div>
        <p className="text-muted-foreground text-sm">Tạo prompt điện ảnh cho Runway, Pika, Sora & Kling</p>
        <p className="text-muted-foreground text-sm">Đa ngôn ngữ đầu vào/đầu ra, gợi ý SEO + cảnh quay cho Runway, Pika, Sora & Kling</p>
      </div>

      <PremiumBanner />
      <AdPlaceholder position="top" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <PromptTemplates onSelect={handleTemplateSelect} />
          <PromptForm data={formData} onChange={setFormData} onGenerate={handleGenerate} isGenerating={isGenerating} useAI={useAI && !!aiApiKey} />
          <PromptForm
            data={formData}
            onChange={setFormData}
            onGenerate={handleGenerate}
            onRandomIdea={handleRandomIdea}
            isGenerating={isGenerating}
            useAI={useAI && !!aiApiKey}
          />
          {prompt && <PromptOutput prompt={prompt} />}
        </div>

        <div className="space-y-6">
          <AISettings
            apiKey={aiApiKey}
            model={aiModel}
            useAI={useAI}
            onChange={handleAISettingsChange}
          />
          <PromptHistory history={history} onSelect={setPrompt} />
          <PromptHistory history={history} onSelect={setPrompt} onClear={handleClearHistory} />
          <AdPlaceholder position="sidebar" />
        </div>
      </div>

      <AdPlaceholder position="bottom" />
    </div>
  );
};

export default Index;
