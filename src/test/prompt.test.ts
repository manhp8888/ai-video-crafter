import { describe, expect, it } from "vitest";
import { generatePrompt, getRandomIdea } from "@/lib/prompt";

describe("generatePrompt", () => {
  it("returns structured output sections", () => {
    const result = generatePrompt({
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

    expect(result).toContain("## Tiêu đề");
    expect(result).toContain("## Hashtag");
    expect(result).toContain("## Mô tả video chuẩn SEO");
    expect(result).toContain("## Prompt tạo ảnh bìa");
    expect(result).toContain("## Prompt tổng");
    expect(result).toContain("## Prompt theo cảnh");
  });

  it("supports english output", () => {
    const result = generatePrompt({
      idea: "product review with hook",
      style: "Realistic",
      camera: "Handheld",
      lighting: "Studio Lighting",
      mood: "Emotional",
      model: "Sora",
      duration: "30 giây",
      inputLanguage: "English",
      outputLanguage: "English",
    });

    expect(result).toContain("product review with hook");
    expect(result).toContain("#AIVideo");
    expect(result).toContain("[Sora Prompt");
  });
});

describe("getRandomIdea", () => {
  it("returns a non-empty suggestion", () => {
    const idea = getRandomIdea();
    expect(idea.length).toBeGreaterThan(10);
  });
});
