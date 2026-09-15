import { NextResponse } from "next/server";
import Imap from "imap";
import { simpleParser } from "mailparser";

type InboxEmail = {
  id: string;
  from: string;
  subject: string;
  date: string;
  text: string;
  company: string;
};

type InboxClassification =
  | "rejected"
  | "interviewing"
  | "offer"
  | "unclear";

interface InboxMatch {
  company: string;
  subject: string;
  from: string;
  classification: InboxClassification;
}

const JOB_KEYWORDS = [
  "application",
  "applied",
  "interview",
  "position",
  "role",
  "hiring",
  "recruiter",
  "recruitment",
  "candidate",
  "offer",
  "unfortunately",
  "regret",
  "next steps",
  "moving forward",
  "thank you for your interest",
  "thanks for applying",
];

function extractCompany(from: string, subject: string) {
  const emailMatch = from.match(/@([a-zA-Z0-9.-]+)/i);

  if (emailMatch) {
    const domain = emailMatch[1]
      .replace(/^www\./, "")
      .split(".")[0];

    if (
      ![
        "gmail",
        "googlemail",
        "outlook",
        "hotmail",
        "yahoo",
        "icloud",
        "protonmail",
      ].includes(domain.toLowerCase())
    ) {
      return domain
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }

  const subjectMatch = subject.match(
    /(?:from|at|with)\s+([A-Za-z0-9& .'-]{2,50})/i
  );

  return subjectMatch?.[1]?.trim() || "Unknown company";
}

function fetchRecentEmails(): Promise<InboxEmail[]> {
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;

  if (!user || !password) {
    return Promise.reject(
      new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env.local")
    );
  }

  return new Promise<InboxEmail[]>((resolve, reject) => {
    const imap = new Imap({
      user,
      password,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const results: InboxEmail[] = [];

    imap.once("ready", () => {
      imap.openBox("INBOX", true, (err) => {
        if (err) {
          reject(err);
          return;
        }

        imap.search(["ALL"], (searchErr, ids) => {
          if (searchErr) {
            reject(searchErr);
            return;
          }

          if (!ids.length) {
            imap.end();
            resolve([]);
            return;
          }

          const recentIds = ids.slice(-20);

          const fetcher = imap.fetch(recentIds, {
            bodies: "",
            struct: true,
          });

          fetcher.on("message", (message) => {
            let buffer = "";

            message.on("body", (stream) => {
              stream.on("data", (chunk) => {
                buffer += chunk.toString("utf8");
              });
            });

            message.once("end", async () => {
              try {
                const parsed = await simpleParser(buffer);

                const from = parsed.from?.text || "";
                const subject = parsed.subject || "";
                const text =
                  parsed.text ||
                  (typeof parsed.html === "string"
                    ? parsed.html.replace(/<[^>]+>/g, " ")
                    : "") ||
                  "";

                results.push({
                  id: parsed.messageId || `${Date.now()}-${Math.random()}`,
                  from,
                  subject,
                  date:
                    parsed.date?.toISOString() ||
                    new Date().toISOString(),
                  text: text.slice(0, 5000),
                  company: extractCompany(from, subject),
                });
              } catch {
                // Ignore malformed emails.
              }
            });
          });

          fetcher.once("error", reject);

          fetcher.once("end", () => {
            setTimeout(() => {
              imap.end();
              resolve(
                results.sort(
                  (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime()
                )
              );
            }, 100);
          });
        });
      });
    });

    imap.once("error", reject);

    imap.connect();
  });
}

function isRelevant(email: InboxEmail, companyNames: string[]) {
  const haystack = `${email.subject} ${email.text}`.toLowerCase();
  const company = email.company.toLowerCase();

  const matchesTrackedCompany = companyNames.some((name) => {
    const normalized = name.trim().toLowerCase();
    return (
      normalized.length > 0 &&
      (company.includes(normalized) || normalized.includes(company))
    );
  });

  const hasJobKeyword = JOB_KEYWORDS.some((keyword) =>
    haystack.includes(keyword)
  );

  return matchesTrackedCompany || hasJobKeyword;
}

async function classifyEmail(
  email: InboxEmail,
  apiKey: string
): Promise<InboxClassification> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 20,
        system:
          "Classify job application emails. Return exactly one word: interviewing, offer, rejected, or unclear.",
        messages: [
          {
            role: "user",
            content: `Subject: ${email.subject}\n\n${email.text.slice(
              0,
              2000
            )}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return "unclear";
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text?.toLowerCase()?.trim() || "";

    const allowed: InboxClassification[] = [
      "interviewing",
      "offer",
      "rejected",
    ];

    return allowed.find((item) => text.includes(item)) || "unclear";
  } catch {
    return "unclear";
  }
}

export async function POST(req: Request) {
  let companyNames: string[] = [];

  try {
    const body = await req.json();
    if (Array.isArray(body?.companyNames)) {
      companyNames = body.companyNames.filter(
        (item: unknown) => typeof item === "string"
      );
    }
  } catch {
    // No body or invalid JSON is fine - just treat as no known companies.
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  try {
    const emails = await fetchRecentEmails();
    const relevant = emails.filter((email) => isRelevant(email, companyNames)).slice(0, 15);

    const matches: InboxMatch[] = [];

    for (const email of relevant) {
      const classification = await classifyEmail(email, apiKey);

      matches.push({
        company: email.company,
        subject: email.subject,
        from: email.from,
        classification,
      });
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Unable to connect to Gmail. Check your Gmail credentials and IMAP settings.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const emails = await fetchRecentEmails();
    return NextResponse.json({ emails });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Unable to connect to Gmail. Check your Gmail credentials and IMAP settings.",
      },
      { status: 500 }
    );
  }
}
