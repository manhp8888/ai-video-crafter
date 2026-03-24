import { Sparkles, Bot } from "lucide-react";
import PromptTemplates from "@/components/PromptTemplates";
import PromptForm from "@/components/PromptForm";
import PromptOutput from "@/components/PromptOutput";
import PromptHistory from "@/components/PromptHistory";
import PremiumBanner from "@/components/PremiumBanner";
import AdPlaceholder from "@/components/AdPlaceholder";
import { Switch } from "@/components/ui/switch";
import { usePromptGenerator } from "@/hooks/use-prompt-generator";

const Index = () => {
  const {
    formData,
    setFormData,
    generatedPrompt,
    rawPrompt,
    history,
    isGenerating,
    isSuggesting,
    useAI,
    setUseAI,
    handleGenerate,
    handleAISuggest,
    handleRandomIdea,
    handleTemplateSelect,
    handleHistorySelect,
    handleClearHistory,
  } = usePromptGenerator();

  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Tạo Prompt AI
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tạo prompt chuyên nghiệp cho mọi công cụ AI tạo video & hình ảnh
        </p>
      </div>

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
            useAI={useAI}
          />
          {rawPrompt && <PromptOutput prompt={rawPrompt} structured={generatedPrompt} />}
        </div>

        <div className="space-y-6">
          {/* AI Toggle Card */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Chế độ AI</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {useAI ? "AI tạo prompt thông minh" : "Tạo prompt từ mẫu có sẵn"}
              </span>
              <Switch checked={useAI} onCheckedChange={setUseAI} />
            </div>
            <p className="text-xs text-muted-foreground/70">
              {useAI
                ? "Sử dụng Lovable AI để tạo prompt sáng tạo, chi tiết và tối ưu hơn."
                : "Dùng công thức có sẵn để tạo prompt nhanh, không cần AI."}
            </p>
          </div>

          <PromptHistory history={history} onSelect={handleHistorySelect} onClear={handleClearHistory} />
          <AdPlaceholder position="sidebar" />
        </div>
      </div>

      <AdPlaceholder position="bottom" />
    </div>
  );
};

export default Index;
