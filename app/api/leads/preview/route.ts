import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { previewCapturedLead } from "@/lib/lead-ingestion";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON request body." }, { status: 400 });
    }

    const result = await previewCapturedLead(body);

    return NextResponse.json({
      ok: true,
      analysis: {
        provider: result.analysis.provider,
        temperature: result.analysis.temperature,
        score: result.analysis.score,
        summary: result.analysis.summary,
        intent: result.analysis.intent,
        urgency: result.analysis.urgency,
        interestLevel: result.analysis.interestLevel,
        budgetReadiness: result.analysis.budgetReadiness,
        mainNeed: result.analysis.mainNeed,
        painPoint: result.analysis.painPoint,
        objection: result.analysis.objection,
        lossRisk: result.analysis.lossRisk,
        recommendedStage: result.analysis.recommendedStage,
        nextBestAction: result.analysis.nextBestAction,
        confidence: result.analysis.confidence,
        reply: result.analysis.reply,
        replyOptions: result.analysis.replyOptions
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid lead data." }, { status: 400 });
    }

    console.error("Lead preview failed.", error);
    return NextResponse.json({ ok: false, error: "Could not analyze this conversation." }, { status: 500 });
  }
}
