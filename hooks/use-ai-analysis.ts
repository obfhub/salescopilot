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
        console.log("[AI Analysis] Fetching analysis for:", lead.leadName);
        const response = await fetch("/api/ai/analyze-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead),
        });

        console.log("[AI Analysis] Response status:", response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[AI Analysis] Response error:", errorText);
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("[AI Analysis] Analysis received:", data);
        
        // Verify we have real reply options (not the fallback ones)
        const hasRealReplies = data.replyOptions?.professional && 
                               !data.replyOptions.professional.includes("Thank you for your interest. I'd like to discuss how we can help");
        
        if (hasRealReplies) {
          console.log("[AI Analysis] Using AI-generated replies");
        } else {
          console.warn("[AI Analysis] Using fallback replies - API may have failed");
        }

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
          customerType: "prospect",
          intent: "Unknown",
          interestLevel: "Medium",
          urgency: "Medium",
          budgetReadiness: "Unknown",
          mainNeed: "Unknown",
          painPoint: "Unknown",
          objection: "Unknown",
          lossRisk: "Low",
          recommendedStage: "New Lead",
          nextBestAction: "Follow up",
          reply: "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [lead?.leadName, lead?.company, lead?.position]);

  return { analysis, isLoading, error };
}
