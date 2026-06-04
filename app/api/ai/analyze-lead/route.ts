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
            content: `You are a professional AI sales assistant. Analyze leads and generate personalized sales responses.

IMPORTANT: Respond ONLY with valid JSON. Do NOT include markdown formatting or explanations.

JSON format:
{
  "summary": "2-3 sentence analysis of lead potential and key factors",
  "opportunity": "Opportunity assessment (e.g., 'High-value enterprise lead' or 'Warm mid-market prospect')",
  "confidence": 75,
  "replyOptions": {
    "professional": "Formal professional response (2-3 sentences, appropriate for executive audience)",
    "casual": "Friendly conversational response (2-3 sentences, relationship-building tone)",
    "brief": "Single sentence concise response"
  }
}

Make replies specific to their company, role, and needs. Reference details from their profile.`,
          },
          {
            role: "user",
            content: `Analyze this lead and generate personalized responses:

Name: ${lead.leadName}
Company: ${lead.company}
Position: ${lead.position}
Interest: ${lead.interest || "General inquiry"}
Temperature: ${lead.temperature || "Warm"}
Recent Message: "${lead.lastMessage || "No message yet"}"

Generate analysis and three reply options in the specified JSON format.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 700,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Clean up potential markdown formatting
    let jsonContent = content.trim();
    if (jsonContent.includes("```")) {
      jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }

    const analysis = JSON.parse(jsonContent);

    return {
      summary: analysis.summary || "Lead shows strong engagement potential",
      opportunity: analysis.opportunity || "High potential opportunity",
      replyOptions: {
        professional: analysis.replyOptions?.professional || "Thank you for your interest. I'd like to discuss how we can help you achieve your goals.",
        casual: analysis.replyOptions?.casual || "Hey! Great to hear from you. Let's chat about how we can work together.",
        brief: analysis.replyOptions?.brief || "Thanks for reaching out!"
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
      { error: "Failed to analyze lead" },
      { status: 500 }
    );
  }
}
