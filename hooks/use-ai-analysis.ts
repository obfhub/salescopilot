"use client";

import { useState, useEffect } from "react";
import type { AiAnalysis } from "@/types";
import { useDemoMode } from "@/contexts/demo-mode-context";

interface AnalysisInput {
  leadName: string;
  company: string;
  position: string;
  lastMessage?: string;
  interest?: string;
  temperature?: string;
}

const DEMO_ANALYSIS: AiAnalysis = {
  summary: "Strong prospect with clear interest in sales automation. Multiple incoming requests indicate active pipeline. Warm temperature suggests receptiveness.",
  opportunity: "High-value B2B SaaS opportunity - enterprise sales workflow optimization",
  replyOptions: {
    professional: "Thank you for reaching out. I'd love to schedule a brief call to understand your specific workflow challenges and discuss how our platform can streamline your sales process.",
    casual: "Hey! Thanks for getting in touch. Would be great to chat about your sales automation needs and show you what we're building.",
    brief: "Definitely! Let's set up a quick call this week."
  },
  confidence: 85,
  customerType: "Enterprise",
  intent: "Sales automation",
  interestLevel: "High",
  urgency: "High",
  budgetReadiness: "Yes",
  mainNeed: "Coordinate sales team workflow",
  painPoint: "Response speed is becoming a business risk",
  objection: "No clear objection detected",
  lossRisk: "Low",
  recommendedStage: "Qualification",
  nextBestAction: "Schedule discovery call",
  reply: "Thank you for reaching out. I'd love to schedule a brief call to understand your specific workflow challenges and discuss how our platform can streamline your sales process."
};

export function useAiAnalysis(lead: AnalysisInput | undefined) {
  const { isDemoMode } = useDemoMode();
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lead) return;

    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use demo mode if enabled
        if (isDemoMode) {
          console.log("[AI Analysis] Using demo mode for:", lead.leadName);
          setAnalysis(DEMO_ANALYSIS);
          setIsLoading(false);
          return;
        }

        console.log("[AI Analysis] Fetching real analysis for:", lead.leadName);
        const response = await fetch("/api/ai/analyze-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        setAnalysis({
          summary: data.summary,
          opportunity: data.opportunity,
          replyOptions: data.replyOptions,
          confidence: data.confidence,
          customerType: "prospect",
          intent: data.opportunity || "Unknown",
          interestLevel: "Medium",
          urgency: "Medium",
          budgetReadiness: "Unknown",
          mainNeed: data.summary,
          painPoint: "Unknown",
          objection: "Unknown",
          lossRisk: "Low",
          recommendedStage: "New Lead",
          nextBestAction: "Follow up",
          reply: data.replyOptions?.professional || "",
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[AI Analysis] Error:", errorMessage);
        setError(errorMessage);
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [lead?.leadName, lead?.company, lead?.position, isDemoMode]);

  return { analysis, isLoading, error };
}
