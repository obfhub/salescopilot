import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createCapturedLead } from "@/lib/lead-ingestion";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON request body." }, { status: 400 });
    }

    const result = await createCapturedLead(body);

    return NextResponse.json({
      ok: true,
      leadId: result.leadId,
      analysis: {
        temperature: result.analysis.temperature,
        score: result.analysis.score,
        intent: result.analysis.intent,
        recommendedStage: result.analysis.recommendedStage,
        nextBestAction: result.analysis.nextBestAction,
        reply: result.analysis.reply
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: error.issues[0]?.message ?? "Invalid lead data." }, { status: 400 });
    }

    console.error("Lead capture failed.", error);
    return NextResponse.json({ ok: false, error: "Could not create lead." }, { status: 500 });
  }
}
