import { Sparkles, Bot, AlertTriangle, ImagePlus } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PromptTemplates from "@/components/PromptTemplates";
import PromptForm from "@/components/PromptForm";
import PromptOutput from "@/components/PromptOutput";
import PromptHistory from "@/components/PromptHistory";
import PremiumBanner from "@/components/PremiumBanner";
import AdPlaceholder from "@/components/AdPlaceholder";
import ReferencePrompt from "@/components/ReferencePrompt";
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Tạo Prompt AI Cinematic</h1>
            <p className="text-muted-foreground text-sm">Prompt chuyên nghiệp cấp production cho AI video & hình ảnh</p>
          </div>
        </div>
      </div>

      <PremiumBanner />
      <AdPlaceholder position="top" />

      {!isPremium && !canUse && (
        <div className="w-full max-w-5xl glass-card rounded-2xl px-5 py-4 flex items-center gap-3 border-destructive/30">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Đã hết lượt miễn phí hôm nay</p>
            <p className="text-xs text-muted-foreground">Nâng cấp Premium để sử dụng không giới hạn</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
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

        <div className="space-y-5">
          {/* AI Toggle + Usage Card */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Chế độ AI</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {useAI ? "AI tạo prompt cinematic" : "Tạo prompt từ mẫu có sẵn"}
              </span>
              <Switch checked={useAI} onCheckedChange={setUseAI} />
            </div>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              {useAI
                ? "AI tạo prompt chuyên nghiệp với camera, lighting, physics chi tiết."
                : "Dùng công thức có sẵn để tạo prompt nhanh, không cần AI."}
            </p>
            {!isPremium && (
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Prompt</span>
                  <span className="text-xs font-bold text-foreground">{remaining}/5</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${(remaining / 5) * 100}%` }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Enhance/Remix</span>
                  <span className="text-xs font-bold text-foreground">{enhanceLimit.remaining}/2</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-accent-foreground/50 rounded-full h-1.5 transition-all" style={{ width: `${(enhanceLimit.remaining / 2) * 100}%` }} />
                </div>
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
