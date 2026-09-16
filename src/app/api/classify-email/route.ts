import { NextResponse } from "next/server";

function classifyByKeywords(text: string): string {
  const content = text.toLowerCase();

  if (
    content.includes("pleased to offer") ||
    content.includes("job offer") ||
    content.includes("offer of employment") ||
    content.includes("offer letter") ||
    content.includes("congratulations on your offer")
  ) {
    return "offer";
  }

  if (
    content.includes("interview") ||
    content.includes("phone screen") ||
    content.includes("invitation to speak") ||
    content.includes("schedule a call") ||
    content.includes("next steps in the process") ||
    content.includes("video call") ||
    content.includes("zoom meeting") ||
    content.includes("google meet") ||
    content.includes("first round") ||
    content.includes("technical screen")
  ) {
    return "interviewing";
  }

  if (
    content.includes("unfortunately") ||
    content.includes("regret to inform") ||
    content.includes("not moving forward") ||
    content.includes("other candidates") ||
    content.includes("will not be pursuing") ||
    content.includes("position has been filled") ||
    content.includes("decided to move forward with") ||
    content.includes("not selected")
  ) {
    return "rejected";
  }

  return "unclear";
}

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

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Use rule-based keyword classifier
    const keywordResult = classifyByKeywords(emailText);

    if (keywordResult !== "unclear" || !apiKey) {
      return NextResponse.json({
        classification: keywordResult,
      });
    }

    // If key is present and keyword was unclear, query Claude
    try {
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

      if (response.ok) {
        const data = await response.json();
        const text =
          data?.content?.[0]?.text
            ?.toLowerCase()
            ?.trim() || "unclear";

        const valid = [
          "applied",
          "interviewing",
          "offer",
          "rejected",
        ];

        const match = valid.find((v) =>
          text.includes(v)
        );

        return NextResponse.json({
          classification: match || keywordResult,
        });
      }
    } catch {
      // Fallback to keywordResult
    }

    return NextResponse.json({
      classification: keywordResult,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to classify email.",
      },
      { status: 500 }
    );
  }
}
