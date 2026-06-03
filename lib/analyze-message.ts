import type { AiAnalysis, PipelineStage, Temperature } from "@/types";

const hasAny = (message: string, terms: string[]) => terms.some((term) => message.includes(term));

const clamp = (value: number) => Math.max(0, Math.min(100, value));

const temperatureFromScore = (score: number): Temperature => {
  if (score >= 75) return "Hot";
  if (score >= 45) return "Warm";
  return "Cold";
};

const stageFromScore = (score: number, readyToBuy: boolean, comparing: boolean): PipelineStage => {
  if (readyToBuy) return "Payment";
  if (score >= 82) return "Proposal";
  if (comparing) return "Negotiation";
  if (score >= 62) return "Presentation";
  if (score >= 38) return "Qualification";
  return "New Lead";
};

export function analyzeMessage(rawMessage: string): AiAnalysis & { score: number; temperature: Temperature; objections: string[] } {
  const message = rawMessage.toLowerCase();
  const pricing = hasAny(message, ["price", "cost", "how much", "pricing", "budget"]);
  const urgent = hasAny(message, ["urgent", "today", "quickly", "asap", "right now"]);
  const integration = hasAny(message, ["telegram", "bot", "integration", "crm", "webhook", "api"]);
  const expensive = hasAny(message, ["expensive", "too much", "discount", "cheaper"]);
  const comparing = hasAny(message, ["competitors", "compare", "alternative", "options", "another vendor"]);
  const demo = hasAny(message, ["demo", "show me", "call", "meeting", "presentation"]);
  const unsure = hasAny(message, ["thinking", "later", "not sure", "maybe", "next month"]);
  const readyToBuy = hasAny(message, ["pay", "contract", "invoice", "start now", "purchase"]);
  const scale = hasAny(message, ["team", "managers", "multiple", "department", "pipeline"]);
  const analytics = hasAny(message, ["analytics", "report", "conversion", "forecast", "dashboard"]);

  let score = 34;
  if (urgent) score += 20;
  if (pricing) score += 10;
  if (integration) score += 12;
  if (demo) score += 25;
  if (expensive) score -= 15;
  if (comparing) score -= 4;
  if (unsure) score -= 18;
  if (readyToBuy) score += 35;
  if (scale) score += 10;
  if (analytics) score += 8;
  score = clamp(score);

  const temperature = temperatureFromScore(score);
  const urgency = urgent ? "High" : score > 58 ? "Medium" : "Low";
  const objections = [expensive && "Price sensitivity", comparing && "Vendor comparison", unsure && "Delayed decision"].filter(Boolean) as string[];
  const intent = readyToBuy
    ? "Ready to buy"
    : demo
      ? "Demo request"
      : pricing
        ? "Pricing interest"
        : integration
          ? "Integration evaluation"
          : comparing
            ? "Comparing options"
            : "Discovery";
  const mainNeed = integration
    ? "Connect incoming messages and sales tools into one assisted workflow"
    : analytics
      ? "Understand sales performance and prioritize high-value leads"
      : scale
        ? "Coordinate a sales team across many incoming requests"
        : "Reduce manual follow-up and respond faster to leads";
  const painPoint = urgent
    ? "Response speed is becoming a business risk"
    : expensive
      ? "The buyer is cautious about ROI and total cost"
      : comparing
        ? "They need proof that this product beats alternatives"
        : "Manual lead handling is slowing the team down";
  const recommendedStage = stageFromScore(score, readyToBuy, comparing);
  const nextBestAction = readyToBuy
    ? "Send invoice details and confirm the implementation kickoff date."
    : demo
      ? "Offer two demo times and tailor the walkthrough around their use case."
      : pricing
        ? "Send a concise pricing overview with ROI framing and ask about team size."
        : "Ask one qualifying question and share a short value-focused example.";
  const summary = `The customer shows ${temperature.toLowerCase()} intent around ${intent.toLowerCase()}. ${mainNeed}. Recommended action: ${nextBestAction}`;
  const reply = `Thanks for the context. Based on what you shared, AI Sales Copilot can help your team handle requests faster and prioritize the best opportunities. ${nextBestAction}`;

  return {
    customerType: readyToBuy ? "Decision-ready buyer" : comparing ? "Evaluation-stage buyer" : "Operational sales manager",
    intent,
    interestLevel: temperature,
    urgency,
    budgetReadiness: readyToBuy ? "Ready" : pricing || expensive ? "Evaluating budget" : "Not confirmed",
    mainNeed,
    painPoint,
    objection: objections[0] ?? "No clear objection detected",
    lossRisk: unsure || expensive ? "Elevated" : comparing ? "Medium" : "Low",
    recommendedStage,
    nextBestAction,
    confidence: clamp(score + 7),
    summary,
    reply,
    score,
    temperature,
    objections,
    replyOptions: {
      short: `Thanks. ${nextBestAction}`,
      professional: `Thank you for reaching out. ${mainNeed}. I recommend we schedule a short call to confirm your workflow and show the most relevant setup.`,
      sales: `Your team can likely save hours each week by automating lead triage and follow-up. ${nextBestAction}`,
      closing: `This sounds like a strong fit. If everything looks good, I can prepare the next step today and help you move forward quickly.`
    }
  };
}
