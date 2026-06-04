import { useState, useEffect } from "react";
import type { AiAnalysis } from "@/types";

interface AnalysisInput {
  leadName: string;
  company: string;
  position: string;
  lastMessage?: string;
  interest?: string;
  temperature?: string;
}

export function useAiAnalysis(lead: AnalysisInput | undefined) {
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lead) return;

    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/analyze-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze lead");
        }

        const data = await response.json();
        setAnalysis({
          summary: data.summary,
          opportunity: data.opportunity,
          replyOptions: data.replyOptions,
          confidence: data.confidence,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        // Return mock data on error
        setAnalysis({
          summary: "Unable to generate analysis at this time.",
          opportunity: "High potential opportunity",
          replyOptions: {
            professional: "Thank you for your interest. I'd like to discuss how we can help.",
            casual: "Hey! Great to hear from you. Let's chat about how we can help.",
            brief: "Interested. Let's talk soon."
          },
          confidence: 50,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [lead?.leadName, lead?.company, lead?.position]);

  return { analysis, isLoading, error };
}
