import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generatePrompt, getRandomIdea, type PromptData } from "@/lib/prompt";

export interface GeneratedPrompt {
  title: string;
  hashtags: string;
  seoDescription: string;
  coverPrompt: string;
  masterPrompt: string;
  scenes: { id: number; timeRange: string; camera: string; description: string }[];
}

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
};

function parseMarkdownToStructured(markdown: string): GeneratedPrompt | null {
  const section = (heading: string) => {
    const regex = new RegExp(`##\\s*${heading}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, "i");
    return regex.exec(markdown)?.[1]?.trim() || "";
  };
  const title = section("Tiêu đề");
  if (!title) return null;
  return {
    title,
    hashtags: section("Hashtag"),
    seoDescription: section("Mô tả video chuẩn SEO"),
    coverPrompt: section("Prompt tạo ảnh bìa"),
    masterPrompt: section("Prompt tổng"),
    scenes: [],
  };
}

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
  const [useAI, setUseAI] = useState(true);
  const { toast } = useToast();

  const pushToHistory = useCallback((text: string) => {
    setHistory((prev) => {
      const updated = [text, ...prev].slice(0, 10);
      localStorage.setItem("prompt_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const formatPromptText = (p: GeneratedPrompt): string => {
    const scenesText = p.scenes
      .map((s) => `Cảnh ${s.id} (${s.timeRange}): ${s.camera} — ${s.description}`)
      .join("\n");
    return `## Tiêu đề\n${p.title}\n\n## Hashtag\n${p.hashtags}\n\n## Mô tả video chuẩn SEO\n${p.seoDescription}\n\n## Prompt tạo ảnh bìa\n${p.coverPrompt}\n\n## Prompt tổng\n${p.masterPrompt}\n\n## Prompt theo cảnh\n${scenesText}`;
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
          toast({ title: "Tạo prompt thành công!", description: "AI đã tạo prompt chuyên nghiệp cho bạn." });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Lỗi không xác định";
        toast({ title: "Lỗi AI", description: msg, variant: "destructive" });
        // Fallback to local generation
        const result = generatePrompt(formData);
        const parsed = parseMarkdownToStructured(result);
        setGeneratedPrompt(parsed);
        setRawPrompt(result);
        pushToHistory(result);
      } finally {
        setIsGenerating(false);
      }
    } else {
      const result = generatePrompt(formData);
      const parsed = parseMarkdownToStructured(result);
      setGeneratedPrompt(parsed);
      setRawPrompt(result);
      pushToHistory(result);
    }
  }, [formData, useAI, pushToHistory, toast]);

  const handleAISuggest = useCallback(async () => {
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
        toast({ title: "AI đã gợi ý xong!", description: "Tất cả trường đã được điền. Nhấn 'Tạo Prompt' để hoàn thành." });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      toast({ title: "Lỗi gợi ý AI", description: msg, variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  }, [formData.idea, toast]);

  const handleRandomIdea = useCallback(() => {
    setFormData((prev) => ({ ...prev, idea: getRandomIdea() }));
  }, []);

  const handleTemplateSelect = useCallback((template: PromptData) => {
    setFormData(template);
  }, []);

  const handleHistorySelect = useCallback((text: string) => {
    setRawPrompt(text);
    const parsed = parseMarkdownToStructured(text);
    setGeneratedPrompt(parsed);
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
    useAI,
    setUseAI,
    handleGenerate,
    handleAISuggest,
    handleRandomIdea,
    handleTemplateSelect,
    handleHistorySelect,
    handleClearHistory,
  };
}
