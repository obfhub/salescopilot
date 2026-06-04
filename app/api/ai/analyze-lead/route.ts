const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface AnalysisRequest {
  leadName: string;
  company: string;
  position: string;
  lastMessage?: string;
  interest?: string;
  temperature?: string;
}

interface AnalysisResponse {
  summary: string;
  opportunity: string;
  replyOptions: {
    professional: string;
    casual: string;
    brief: string;
  };
  confidence: number;
}

async function generateAnalysis(lead: AnalysisRequest): Promise<AnalysisResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a sales analyst. Generate JSON response ONLY.
{
  "summary": "2-3 sentence analysis",
  "opportunity": "Assessment",
  "confidence": 75,
  "replyOptions": {
    "professional": "Professional response (2-3 sentences)",
    "casual": "Casual response (2-3 sentences)",
    "brief": "One sentence response"
  }
}`,
          },
          {
            role: "user",
            content: `Lead: ${lead.leadName} at ${lead.company} (${lead.position}). Interest: ${lead.interest || "General"}. Message: "${lead.lastMessage || "No message}"`. Generate personalized sales analysis and replies.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[AI Analysis] OpenAI error:", response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    let jsonContent = content.trim();
    if (jsonContent.includes("```")) {
      jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }

    const analysis = JSON.parse(jsonContent);

    return {
      summary: analysis.summary || "Lead analysis pending",
      opportunity: analysis.opportunity || "Medium potential",
      replyOptions: {
        professional: analysis.replyOptions?.professional || "Thank you for reaching out.",
        casual: analysis.replyOptions?.casual || "Hey! Thanks for getting in touch.",
        brief: analysis.replyOptions?.brief || "Thanks for your interest."
      },
      confidence: Math.min(100, Math.max(0, analysis.confidence || 70))
    };
  } catch (error) {
    console.error("[AI Analysis] Error:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const lead = await request.json() as AnalysisRequest;

    if (!lead.leadName) {
      return Response.json({ error: "leadName required" }, { status: 400 });
    }

    const analysis = await generateAnalysis(lead);
    return Response.json(analysis);
  } catch (error) {
    console.error("[AI Analysis] Request error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to analyze lead" },
      { status: 500 }
    );
  }
}
