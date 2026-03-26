import { Sparkles, Bot, AlertTriangle } from "lucide-react";
import PromptTemplates from "@/components/PromptTemplates";
import PromptForm from "@/components/PromptForm";
import PromptOutput from "@/components/PromptOutput";
import PromptHistory from "@/components/PromptHistory";
import PremiumBanner from "@/components/PremiumBanner";
import AdPlaceholder from "@/components/AdPlaceholder";
import { Switch } from "@/components/ui/switch";
import { usePromptGenerator } from "@/hooks/use-prompt-generator";
import { useUsageLimit } from "@/hooks/use-usage-limit";

const Index = () => {
  const {
    formData,
    setFormData,
    generatedPrompt,
    rawPrompt,
    history,
    isGenerating,
    isSuggesting,
    isEnhancing,
    useAI,
    setUseAI,
    handleGenerate,
    handleAISuggest,
    handleEnhance,
    handleRemix,
    handleRandomIdea,
    handleTemplateSelect,
    handleHistorySelect,
    handleClearHistory,
  } = usePromptGenerator();

  const { canUse, remaining, isPremium, recordUsage } = useUsageLimit("prompt", 5);
  const enhanceLimit = useUsageLimit("enhance", 2);

  const handleGenerateWithLimit = async () => {
    if (!canUse) return;
    await handleGenerate();
    await recordUsage();
  };

  const handleEnhanceWithLimit = async () => {
    if (!isPremium && !enhanceLimit.canUse) return;
    await handleEnhance();
    if (!isPremium) await enhanceLimit.recordUsage();
  };

  const handleRemixWithLimit = async () => {
    if (!isPremium && !enhanceLimit.canUse) return;
    await handleRemix();
    if (!isPremium) await enhanceLimit.recordUsage();
  };

  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6">
      <div className="w-full max-w-5xl">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Tạo Prompt AI Cinematic
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tạo prompt chuyên nghiệp cấp độ production cho AI video & hình ảnh
        </p>
      </div>

      <PremiumBanner />
      <AdPlaceholder position="top" />

      {!isPremium && !canUse && (
        <div className="w-full max-w-5xl bg-destructive/10 border border-destructive/30 rounded-2xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Đã hết lượt miễn phí hôm nay</p>
            <p className="text-xs text-muted-foreground">Nâng cấp Premium để sử dụng không giới hạn</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <PromptTemplates onSelect={handleTemplateSelect} />
          <PromptForm
            data={formData}
            onChange={setFormData}
            onGenerate={handleGenerateWithLimit}
            onRandomIdea={handleRandomIdea}
            onAISuggest={handleAISuggest}
            isGenerating={isGenerating}
            isSuggesting={isSuggesting}
            useAI={useAI}
            disabled={!canUse}
          />
          {rawPrompt && (
            <PromptOutput
              prompt={rawPrompt}
              structured={generatedPrompt}
              onEnhance={handleEnhanceWithLimit}
              onRemix={handleRemixWithLimit}
              isEnhancing={isEnhancing}
              isPremium={isPremium}
            />
          )}
        </div>

        <div className="space-y-6">
          {/* AI Toggle + Usage Card */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Chế độ AI</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {useAI ? "AI tạo prompt cinematic" : "Tạo prompt từ mẫu có sẵn"}
              </span>
              <Switch checked={useAI} onCheckedChange={setUseAI} />
            </div>
            <p className="text-xs text-muted-foreground/70">
              {useAI
                ? "AI tạo prompt chuyên nghiệp với camera, lighting, physics chi tiết."
                : "Dùng công thức có sẵn để tạo prompt nhanh, không cần AI."}
            </p>
            {!isPremium && (
              <div className="border-t border-border pt-2 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Prompt: <span className="font-semibold text-foreground">{remaining}/5</span> lượt
                </p>
                <p className="text-xs text-muted-foreground">
                  Enhance/Remix: <span className="font-semibold text-foreground">{enhanceLimit.remaining}/2</span> lượt
                </p>
              </div>
            )}
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
