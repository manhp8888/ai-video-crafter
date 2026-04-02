import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generatePrompt, getRandomIdea, type PromptData, type GeneratedPrompt, type PromptMode } from "@/lib/prompt";

const INITIAL_FORM: PromptData = {
  idea: "",
  style: "",
  camera: "",
  lighting: "",
  mood: "",
  model: "",
  duration: "",
  inputLanguage: "Tiếng Việt",
  outputLanguage: "Tiếng Việt",
  mode: "basic",
};

export function usePromptGenerator() {
  const [formData, setFormData] = useState<PromptData>(INITIAL_FORM);
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [rawPrompt, setRawPrompt] = useState("");
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("prompt_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const { toast } = useToast();

  const pushToHistory = useCallback((text: string) => {
    setHistory((prev) => {
      const updated = [text, ...prev].slice(0, 20);
      localStorage.setItem("prompt_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const formatPromptText = (p: GeneratedPrompt): string => {
    const scenesText = p.scenes
      .map((s) => `Cảnh ${s.scene}: ${s.camera} | ${s.lighting} | ${s.motion}\n${s.description}`)
      .join("\n\n");
    const hashtagsStr = Array.isArray(p.hashtags) ? p.hashtags.join(" ") : p.hashtags;
    return `## Tiêu đề\n${p.title}\n\n## Hashtag\n${hashtagsStr}\n\n## Mô tả SEO\n${p.description}\n\n## Prompt ảnh bìa\n${p.thumbnail_prompt}\n\n## Camera\n${p.camera_settings.lens} | ${p.camera_settings.angle} | ${p.camera_settings.motion} | ${p.camera_settings.fps}\n\n## Ánh sáng\n${p.lighting_settings.type} | ${p.lighting_settings.time_of_day} | ${p.lighting_settings.color_temperature}\n\n## Master Prompt\n${p.master_prompt}\n\n## Cảnh\n${scenesText}`;
  };

  const handleGenerate = useCallback(async () => {
    if (useAI) {
      setIsGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-generate-prompt", {
          body: formData,
        });
        if (error) throw error;
        const p = data?.prompt as GeneratedPrompt | null;
        if (p) {
          setGeneratedPrompt(p);
          const text = formatPromptText(p);
          setRawPrompt(text);
          pushToHistory(text);
          toast({ title: "Tạo prompt thành công!", description: "AI đã tạo prompt cinematic chuyên nghiệp." });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Lỗi không xác định";
        toast({ title: "Lỗi AI", description: msg, variant: "destructive" });
        const result = generatePrompt(formData);
        setGeneratedPrompt(null);
        setRawPrompt(result);
        pushToHistory(result);
      } finally {
        setIsGenerating(false);
      }
    } else {
      const result = generatePrompt(formData);
      setGeneratedPrompt(null);
      setRawPrompt(result);
      pushToHistory(result);
    }
  }, [formData, useAI, pushToHistory, toast]);

  const handleAISuggest = useCallback(async () => {
    if (!formData.idea.trim()) return;
    setIsSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-suggest", {
        body: { idea: formData.idea, mode: formData.mode },
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
          // Advanced fields
          cameraAngle: s.cameraAngle || prev.cameraAngle,
          cameraLens: s.cameraLens || prev.cameraLens,
          cameraMotion: s.cameraMotion || prev.cameraMotion,
          // Pro fields
          lightingType: s.lightingType || prev.lightingType,
          timeOfDay: s.timeOfDay || prev.timeOfDay,
          colorTemperature: s.colorTemperature || prev.colorTemperature,
          realism: s.realism || prev.realism,
        }));
        toast({ title: "AI đã gợi ý xong!", description: "Tất cả trường đã được điền đầy đủ." });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      toast({ title: "Lỗi gợi ý AI", description: msg, variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  }, [formData.idea, formData.mode, toast]);

  const handleEnhance = useCallback(async () => {
    if (!rawPrompt) return;
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-enhance-prompt", {
        body: { prompt: rawPrompt, action: "enhance" },
      });
      if (error) throw error;
      if (data?.enhanced_prompt) {
        setRawPrompt(data.enhanced_prompt);
        setGeneratedPrompt(null);
        pushToHistory(data.enhanced_prompt);
        toast({ title: "Đã nâng cấp prompt!", description: data.changes_summary || "Prompt đã được tối ưu cinematic." });
      }
    } catch (e: unknown) {
      toast({ title: "Lỗi enhance", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setIsEnhancing(false);
    }
  }, [rawPrompt, pushToHistory, toast]);

  const handleRemix = useCallback(async () => {
    if (!rawPrompt) return;
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-enhance-prompt", {
        body: { prompt: rawPrompt, action: "remix" },
      });
      if (error) throw error;
      if (data?.enhanced_prompt) {
        setRawPrompt(data.enhanced_prompt);
        setGeneratedPrompt(null);
        pushToHistory(data.enhanced_prompt);
        toast({ title: "Đã remix prompt!", description: data.changes_summary || "Prompt mới với phong cách khác." });
      }
    } catch (e: unknown) {
      toast({ title: "Lỗi remix", description: e instanceof Error ? e.message : "Lỗi", variant: "destructive" });
    } finally {
      setIsEnhancing(false);
    }
  }, [rawPrompt, pushToHistory, toast]);

  const handleRandomIdea = useCallback(() => {
    setFormData((prev) => ({ ...prev, idea: getRandomIdea() }));
  }, []);

  const handleTemplateSelect = useCallback((template: PromptData) => {
    setFormData(template);
  }, []);

  const handleHistorySelect = useCallback((text: string) => {
    setRawPrompt(text);
    setGeneratedPrompt(null);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("prompt_history");
  }, []);

  return {
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
  };
}
