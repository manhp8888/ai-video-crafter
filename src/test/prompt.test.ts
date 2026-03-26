import { buildSceneLines, calculateSceneCount, generatePrompt, getRandomIdea, parseDurationSeconds } from "@/lib/prompt";
import { describe, expect, it } from "vitest";

function countScenes(output: string) {
  return output.split("\n").filter((line) => line.startsWith("Cảnh ") || line.startsWith("Scene ")).length;
}

const baseData = {
  idea: "",
  style: "",
  camera: "",
  lighting: "",
  mood: "",
  model: "",
  duration: "",
  inputLanguage: "Tiếng Việt",
  outputLanguage: "Tiếng Việt",
  mode: "basic" as const,
};

describe("generatePrompt", () => {
  it("returns structured output sections", () => {
    const result = generatePrompt(baseData);
    expect(result).toContain("## Tiêu đề");
    expect(result).toContain("## Hashtag");
    expect(result).toContain("## Prompt tổng");
  });

  it("supports english output", () => {
    const result = generatePrompt({
      ...baseData,
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
  });

  it("calculates scene count from duration with ceil(duration/8)", () => {
    expect(calculateSceneCount("15 giây")).toBe(2);
    expect(calculateSceneCount("30 giây")).toBe(4);
    expect(calculateSceneCount("60 giây")).toBe(8);
    expect(calculateSceneCount("90 giây")).toBe(12);
  });

  it("builds scene lines matching computed scene count", () => {
    const lines = buildSceneLines({
      ...baseData,
      idea: "review sản phẩm",
      style: "Realistic",
      camera: "Handheld",
      lighting: "Studio Lighting",
      mood: "Emotional",
      model: "Sora",
      duration: "90 giây",
    });
    expect(lines).toHaveLength(12);
    expect(lines[0]).toContain("Cảnh 1");
    expect(lines[11]).toContain("Cảnh 12");
  });

  it("includes same number of scenes in generated output", () => {
    const result = generatePrompt({
      ...baseData,
      idea: "test",
      style: "Cinematic",
      camera: "Slow Zoom",
      lighting: "Soft Lighting",
      mood: "Epic",
      model: "Runway",
      duration: "90 giây",
    });
    expect(countScenes(result)).toBe(12);
  });
});

describe("parseDurationSeconds", () => {
  it("extracts integer duration from label", () => {
    expect(parseDurationSeconds("90 giây")).toBe(90);
    expect(parseDurationSeconds("60 seconds")).toBe(60);
    expect(parseDurationSeconds("")).toBe(10);
  });
});

describe("getRandomIdea", () => {
  it("returns a non-empty suggestion", () => {
    const idea = getRandomIdea();
    expect(idea.length).toBeGreaterThan(10);
  });
});
