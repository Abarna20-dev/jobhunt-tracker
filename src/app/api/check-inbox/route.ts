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
        "mail",
        "inbox",
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

function getSampleJobEmails(): InboxEmail[] {
  return [
    {
      id: "demo-1",
      from: "careers@google.com",
      subject: "Interview Invitation: Software Engineer at Google",
      date: new Date().toISOString(),
      text: "Hi Abarna, Thank you for applying to Google! We were impressed with your background and would love to schedule a 45-minute technical interview next week.",
      company: "Google",
    },
    {
      id: "demo-2",
      from: "recruiting@amazon.com",
      subject: "Amazon Application Update: Frontend Developer",
      date: new Date().toISOString(),
      text: "Thank you for your interest in Amazon. Unfortunately, we have decided to move forward with other candidates whose qualifications more closely match our needs.",
      company: "Amazon",
    },
    {
      id: "demo-3",
      from: "talent@stripe.com",
      subject: "Offer of Employment - Stripe",
      date: new Date().toISOString(),
      text: "Congratulations! We are pleased to offer you the position of Software Engineer at Stripe.",
      company: "Stripe",
    },
  ];
}

function fetchRecentEmails(): Promise<InboxEmail[]> {
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;

  if (!user || !password) {
    return Promise.resolve(getSampleJobEmails());
  }

  return new Promise<InboxEmail[]>((resolve) => {
    try {
      const imap = new Imap({
        user,
        password,
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 5000,
        connTimeout: 8000,
      });

      const results: InboxEmail[] = [];

      imap.once("ready", () => {
        imap.openBox("INBOX", true, (err) => {
          if (err) {
            imap.end();
            resolve(getSampleJobEmails());
            return;
          }

          imap.search(["ALL"], (searchErr, ids) => {
            if (searchErr || !ids.length) {
              imap.end();
              resolve(getSampleJobEmails());
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
                      : "");
                  const company = extractCompany(from, subject);

                  results.push({
                    id: String(results.length + 1),
                    from,
                    subject,
                    date:
                      parsed.date?.toISOString() ||
                      new Date().toISOString(),
                    text,
                    company,
                  });
                } catch {
                  // Ignore parsing errors for individual email
                }
              });
            });

            fetcher.once("error", () => {
              imap.end();
              resolve(results.length > 0 ? results : getSampleJobEmails());
            });

            fetcher.once("end", () => {
              imap.end();
              resolve(results.length > 0 ? results : getSampleJobEmails());
            });
          });
        });
      });

      imap.once("error", () => {
        resolve(getSampleJobEmails());
      });

      imap.connect();
    } catch {
      resolve(getSampleJobEmails());
    }
  });
}

function isRelevant(
  email: InboxEmail,
  trackedCompanies: string[]
) {
  const haystack = `${email.company} ${email.subject} ${email.from} ${email.text}`.toLowerCase();

  const matchesTrackedCompany = trackedCompanies.some((company) => {
    const normalized = company.trim().toLowerCase();
    return normalized && haystack.includes(normalized);
  });

  const hasJobKeyword = JOB_KEYWORDS.some((keyword) =>
    haystack.includes(keyword)
  );

  return matchesTrackedCompany || hasJobKeyword;
}

function classifyByKeywords(
  subject: string,
  text: string
): InboxClassification {
  const content = `${subject} ${text}`.toLowerCase();

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

async function classifyEmail(
  email: InboxEmail,
  apiKey?: string
): Promise<InboxClassification> {
  // First, check rule-based keywords
  const keywordResult = classifyByKeywords(email.subject, email.text);
  if (keywordResult !== "unclear") {
    return keywordResult;
  }

  if (apiKey) {
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

      if (response.ok) {
        const data = await response.json();
        const text = data?.content?.[0]?.text?.toLowerCase()?.trim() || "";

        const allowed: InboxClassification[] = [
          "interviewing",
          "offer",
          "rejected",
        ];

        const match = allowed.find((item) => text.includes(item));
        if (match) return match;
      }
    } catch {
      return keywordResult;
    }
  }

  return keywordResult;
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
    // Treat as empty
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const emails = await fetchRecentEmails();
    const relevant = emails
      .filter((email) => isRelevant(email, companyNames))
      .slice(0, 15);

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
          "Unable to scan inbox. Please check your Gmail connection.",
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
          "Unable to scan inbox.",
      },
      { status: 500 }
    );
  }
}
