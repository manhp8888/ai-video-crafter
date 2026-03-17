import { useState } from "react";
import { Sparkles } from "lucide-react";
import PromptTemplates from "@/components/PromptTemplates";
import PromptForm from "@/components/PromptForm";
import PromptOutput from "@/components/PromptOutput";
import PromptHistory from "@/components/PromptHistory";
import PremiumBanner from "@/components/PremiumBanner";
import AdPlaceholder from "@/components/AdPlaceholder";

export interface PromptData {
  idea: string;
  style: string;
  camera: string;
  lighting: string;
  mood: string;
  model: string;
}

function generatePrompt(data: PromptData) {
  const style = data.style || "Cinematic";
  const camera = data.camera || "Slow Zoom";
  const lighting = data.lighting || "Soft Lighting";
  const mood = data.mood || "Epic";
  const model = data.model || "Runway";
  const idea = data.idea.trim() || "một khung cảnh thiên nhiên ngoạn mục";

  return `[${model} Prompt] Video phong cách ${style.toLowerCase()} về ${idea}. Quay bằng ${camera.toLowerCase()}, ${lighting.toLowerCase()}, tạo bầu không khí ${mood.toLowerCase()}. Chất lượng cao, độ phân giải 4K, chỉnh màu điện ảnh, bố cục chuyên nghiệp. --style ${style.toLowerCase().replace(/\s/g, "_")} --mood ${mood.toLowerCase()}`;
}

const Index = () => {
  const [formData, setFormData] = useState<PromptData>({
    idea: "", style: "", camera: "", lighting: "", mood: "", model: "",
  });
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const handleGenerate = () => {
    const result = generatePrompt(formData);
    setPrompt(result);
    setHistory((prev) => [result, ...prev].slice(0, 10));
  };

  const handleTemplateSelect = (template: PromptData) => {
    setFormData(template);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8 gap-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Trình Tạo Prompt Video AI</h1>
        </div>
        <p className="text-muted-foreground text-sm">Tạo prompt điện ảnh cho Runway, Pika, Sora & Kling</p>
      </div>

      {/* Premium Banner */}
      <PremiumBanner />

      {/* Ad Slot Top */}
      <AdPlaceholder position="top" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          {/* Templates */}
          <PromptTemplates onSelect={handleTemplateSelect} />

          {/* Main Form */}
          <PromptForm data={formData} onChange={setFormData} onGenerate={handleGenerate} />

          {/* Output */}
          {prompt && <PromptOutput prompt={prompt} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PromptHistory history={history} onSelect={setPrompt} />
          <AdPlaceholder position="sidebar" />
        </div>
      </div>

      {/* Ad Slot Bottom */}
      <AdPlaceholder position="bottom" />
    </div>
  );
};

export default Index;
