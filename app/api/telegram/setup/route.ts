const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET(request: Request) {
  console.log("[Telegram Setup] Setup endpoint called");

  if (!BOT_TOKEN) {
    return Response.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" },
      { status: 500 }
    );
  }

  try {
    // Get the origin from the request
    const origin = new URL(request.url).origin;
    const webhookUrl = `${origin}/api/telegram/webhook`;
    console.log(`[Telegram Setup] Setting webhook URL: ${webhookUrl}`);

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["message"],
        }),
      }
    );

    const result = await response.json();
    console.log("[Telegram Setup] Telegram API response:", result);

    if (!result.ok) {
      return Response.json(
        { ok: false, error: result.description || "Failed to set webhook" },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      message: "Webhook configured successfully",
      url: webhookUrl,
      result,
    });
  } catch (error) {
    console.error("[Telegram Setup] Error:", error);
    return Response.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Same as GET for flexibility
  return GET(request);
}
