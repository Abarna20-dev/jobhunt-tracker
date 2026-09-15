import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const emailText =
      typeof body.emailText === "string"
        ? body.emailText.trim()
        : "";

    if (!emailText) {
      return NextResponse.json(
        {
          error: "Email text is required.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing ANTHROPIC_API_KEY in .env.local",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 100,
          system:
            "Classify job application emails. Return exactly one word: applied, interviewing, offer, rejected, or unclear.",
          messages: [
            {
              role: "user",
              content: emailText,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "AI classification failed.",
        },
        { status: response.status }
      );
    }

    const text =
      data?.content?.[0]?.text
        ?.toLowerCase()
        ?.trim() || "unclear";

    const allowed = [
      "applied",
      "interviewing",
      "offer",
      "rejected",
      "unclear",
    ];

    const classification =
      allowed.find((item) =>
        text.includes(item)
      ) || "unclear";

    return NextResponse.json({
      classification,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to classify the email.",
      },
      { status: 500 }
    );
  }
}
