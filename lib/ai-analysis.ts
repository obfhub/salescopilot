import { analyzeMessage } from "@/lib/analyze-message";
import type { AiAnalysis, PipelineStage, Temperature } from "@/types";

type AnalysisResult = AiAnalysis & {
  score: number;
  temperature: Temperature;
  objections: string[];
  provider: "mock" | "openai";
};

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const validStages: PipelineStage[] = ["New Lead", "Qualification", "Presentation", "Proposal", "Negotiation", "Payment", "Closed", "Lost"];
const validTemperatures: Temperature[] = ["Hot", "Warm", "Cold"];

function normalizeAnalysis(raw: Partial<AnalysisResult>, fallback: AnalysisResult): AnalysisResult {
  const rawScore = Number(raw.score ?? fallback.score);
  const scoreBasis = Number.isFinite(rawScore) && rawScore > 0 && rawScore <= 10 ? rawScore * 10 : rawScore;
  const score = Math.round(Math.max(0, Math.min(100, Number.isFinite(scoreBasis) ? scoreBasis : fallback.score)));
  const rawConfidence = Number(raw.confidence ?? fallback.confidence);
  const confidenceBasis = Number.isFinite(rawConfidence) && rawConfidence > 0 && rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
  const confidence = Math.round(Math.max(0, Math.min(100, Number.isFinite(confidenceBasis) ? confidenceBasis : fallback.confidence)));
  const temperature = validTemperatures.includes(raw.temperature as Temperature) ? (raw.temperature as Temperature) : fallback.temperature;
  const recommendedStage = validStages.includes(raw.recommendedStage as PipelineStage) ? (raw.recommendedStage as PipelineStage) : fallback.recommendedStage;
  const replyOptions = raw.replyOptions && typeof raw.replyOptions === "object" ? raw.replyOptions : fallback.replyOptions;
  const textOrFallback = (value: unknown, fallbackValue: string) => (typeof value === "string" && value.trim() ? value : fallbackValue);

  return {
    ...fallback,
    ...raw,
    customerType: textOrFallback(raw.customerType, fallback.customerType),
    intent: textOrFallback(raw.intent, fallback.intent),
    score,
    temperature,
    interestLevel: textOrFallback(raw.interestLevel, temperature),
    recommendedStage,
    urgency: raw.urgency === "High" || raw.urgency === "Medium" || raw.urgency === "Low" ? raw.urgency : fallback.urgency,
    budgetReadiness: textOrFallback(raw.budgetReadiness, fallback.budgetReadiness),
    mainNeed: textOrFallback(raw.mainNeed, fallback.mainNeed),
    painPoint: textOrFallback(raw.painPoint, fallback.painPoint),
    objection: textOrFallback(raw.objection, fallback.objection),
    lossRisk: textOrFallback(raw.lossRisk, fallback.lossRisk),
    nextBestAction: textOrFallback(raw.nextBestAction, fallback.nextBestAction),
    confidence,
    summary: textOrFallback(raw.summary, fallback.summary),
    reply: textOrFallback(raw.reply, fallback.reply),
    objections: Array.isArray(raw.objections) ? raw.objections : fallback.objections,
    replyOptions: {
      short: textOrFallback(replyOptions?.short, fallback.replyOptions.short ?? ""),
      professional: textOrFallback(replyOptions?.professional, fallback.replyOptions.professional ?? ""),
      sales: textOrFallback(replyOptions?.sales, fallback.replyOptions.sales ?? ""),
      closing: textOrFallback(replyOptions?.closing, fallback.replyOptions.closing ?? "")
    },
    provider: raw.provider ?? fallback.provider
  };
}

function getAnalysisMessages(message: string, context: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You analyze inbound sales leads for a B2B sales copilot. Return only compact JSON with these keys: customerType, intent, interestLevel, urgency, budgetReadiness, mainNeed, painPoint, objection, lossRisk, recommendedStage, nextBestAction, confidence, summary, reply, score, temperature, objections, replyOptions. recommendedStage must be one of: New Lead, Qualification, Presentation, Proposal, Negotiation, Payment, Closed, Lost. temperature must be Hot, Warm, or Cold. urgency must be Low, Medium, or High."
    },
    {
      role: "user",
      content: `Context: ${context}\n\nCustomer message: ${message}`
    }
  ];
}

function getApiUrl() {
  const baseUrl = process.env.OPENAI_BASE_URL?.trim();
  if (!baseUrl) return "https://api.openai.com/v1/responses";
  if (baseUrl.endsWith("/chat/completions") || baseUrl.endsWith("/responses")) return baseUrl;
  return `${baseUrl.replace(/\/$/, "")}/responses`;
}

function parseJsonText(text: string): Partial<AnalysisResult> | null {
  const trimmed = text.trim();
  const json = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)?.[1] ?? trimmed;
  return JSON.parse(json) as Partial<AnalysisResult>;
}

async function analyzeWithChatCompletions(apiUrl: string, messages: ChatMessage[]) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages,
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible chat analysis failed with ${response.status}`);
  }

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (!text) return null;
  return parseJsonText(text);
}

async function analyzeWithResponses(apiUrl: string, messages: ChatMessage[]) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: messages,
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
  return parseJsonText(text);
}

async function analyzeWithOpenAI(message: string, context: string): Promise<Partial<AnalysisResult> | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const apiUrl = getApiUrl();
  const messages = getAnalysisMessages(message, context);

  if (apiUrl.endsWith("/chat/completions")) {
    return analyzeWithChatCompletions(apiUrl, messages);
  }

  return analyzeWithResponses(apiUrl, messages);
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
