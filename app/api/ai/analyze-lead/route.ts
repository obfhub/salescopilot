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
    return {
      summary: "AI analysis unavailable - configure OPENAI_API_KEY",
      opportunity: "High potential opportunity",
      replyOptions: {
        professional: "Thank you for your interest. I'd like to discuss how our solution can help.",
        casual: "Hey! Great to hear from you. Let's chat about how we can help.",
        brief: "Interested. Let's talk soon."
      },
      confidence: 50
    };
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
            content: `You are a sales analysis expert. Analyze the given lead information and provide insights.
            
Respond in JSON format:
{
  "summary": "2-3 sentence summary of the lead's profile and potential",
  "opportunity": "Assessment of the opportunity (High/Medium/Low potential)",
  "replyOptions": {
    "professional": "Professional tone reply (2-3 sentences)",
    "casual": "Casual tone reply (2-3 sentences)",
    "brief": "Brief reply (1 sentence)"
  },
  "confidence": "Confidence score 0-100 based on lead quality"
}`,
          },
          {
            role: "user",
            content: `Analyze this lead:
Name: ${lead.leadName}
Company: ${lead.company}
Position: ${lead.position}
Interest: ${lead.interest || "Unknown"}
Temperature: ${lead.temperature || "Warm"}
Last Message: ${lead.lastMessage || "No messages yet"}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const analysis = JSON.parse(content);

    return {
      summary: analysis.summary || "Lead analysis pending",
      opportunity: analysis.opportunity || "Medium potential",
      replyOptions: {
        professional: analysis.replyOptions?.professional || "Thank you for reaching out.",
        casual: analysis.replyOptions?.casual || "Hey! Thanks for getting in touch.",
        brief: analysis.replyOptions?.brief || "Thanks for your interest."
      },
      confidence: Math.min(100, Math.max(0, analysis.confidence || 60))
    };
  } catch (error) {
    console.error("[AI Analysis] Error:", error);
    return {
      summary: "Analysis pending - please try again",
      opportunity: "High potential opportunity",
      replyOptions: {
        professional: "Thank you for your interest. I'd like to discuss how we can help you achieve your goals.",
        casual: "Hey! Great to hear from you. Would love to chat about how we can work together.",
        brief: "Thanks for reaching out!"
      },
      confidence: 70
    };
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
