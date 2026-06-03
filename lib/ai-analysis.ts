import { analyzeMessage } from "@/lib/analyze-message";
import type { AiAnalysis, PipelineStage, Temperature } from "@/types";

type AnalysisResult = AiAnalysis & {
  score: number;
  temperature: Temperature;
  objections: string[];
  provider: "mock" | "openai";
};

const validStages: PipelineStage[] = ["New Lead", "Qualification", "Presentation", "Proposal", "Negotiation", "Payment", "Closed", "Lost"];
const validTemperatures: Temperature[] = ["Hot", "Warm", "Cold"];

function normalizeAnalysis(raw: Partial<AnalysisResult>, fallback: AnalysisResult): AnalysisResult {
  const score = Math.max(0, Math.min(100, Number(raw.score ?? fallback.score)));
  const temperature = validTemperatures.includes(raw.temperature as Temperature) ? (raw.temperature as Temperature) : fallback.temperature;
  const recommendedStage = validStages.includes(raw.recommendedStage as PipelineStage) ? (raw.recommendedStage as PipelineStage) : fallback.recommendedStage;

  return {
    ...fallback,
    ...raw,
    score,
    temperature,
    interestLevel: raw.interestLevel ?? temperature,
    recommendedStage,
    urgency: raw.urgency === "High" || raw.urgency === "Medium" || raw.urgency === "Low" ? raw.urgency : fallback.urgency,
    confidence: Math.max(0, Math.min(100, Number(raw.confidence ?? fallback.confidence))),
    objections: Array.isArray(raw.objections) ? raw.objections : fallback.objections,
    replyOptions: {
      short: raw.replyOptions?.short ?? fallback.replyOptions.short,
      professional: raw.replyOptions?.professional ?? fallback.replyOptions.professional,
      sales: raw.replyOptions?.sales ?? fallback.replyOptions.sales,
      closing: raw.replyOptions?.closing ?? fallback.replyOptions.closing
    },
    provider: raw.provider ?? fallback.provider
  };
}

async function analyzeWithOpenAI(message: string, context: string): Promise<Partial<AnalysisResult> | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You analyze inbound sales leads for a B2B sales copilot. Return only compact JSON with these keys: customerType, intent, interestLevel, urgency, budgetReadiness, mainNeed, painPoint, objection, lossRisk, recommendedStage, nextBestAction, confidence, summary, reply, score, temperature, objections, replyOptions. recommendedStage must be one of: New Lead, Qualification, Presentation, Proposal, Negotiation, Payment, Closed, Lost. temperature must be Hot, Warm, or Cold. urgency must be Low, Medium, or High."
        },
        {
          role: "user",
          content: `Context: ${context}\n\nCustomer message: ${message}`
        }
      ],
      text: {
        format: { type: "json_object" }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI analysis failed with ${response.status}`);
  }

  const payload = await response.json();
  const text = payload.output_text || payload.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((item: { text?: string }) => item.text).join("");
  if (!text) return null;
  return JSON.parse(text) as Partial<AnalysisResult>;
}

export async function analyzeLeadMessage(message: string, context = ""): Promise<AnalysisResult> {
  const fallback = { ...analyzeMessage(message), provider: "mock" as const };

  try {
    const openAiResult = await analyzeWithOpenAI(message, context);
    if (!openAiResult) return fallback;
    return normalizeAnalysis({ ...openAiResult, provider: "openai" }, fallback);
  } catch (error) {
    console.error("OpenAI lead analysis failed. Falling back to mock analysis.", error);
    return fallback;
  }
}
