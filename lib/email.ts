import nodemailer from "nodemailer";
import { Resend } from "resend";

type Transporter = ReturnType<typeof nodemailer.createTransport>;
type ResendClient = InstanceType<typeof Resend>;

declare global {
  // eslint-disable-next-line no-var
  var __mailerTransporter: Transporter | undefined;
  // eslint-disable-next-line no-var
  var __resendClient: ResendClient | undefined;
}

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || "smtp").toLowerCase();

function getTransporter(): Transporter {
  if (global.__mailerTransporter) return global.__mailerTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS)"
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  global.__mailerTransporter = transporter;
  return transporter;
}

function getResend(): ResendClient {
  if (global.__resendClient) return global.__resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY for Resend provider");
  const client = new Resend(key);
  global.__resendClient = client;
  return client;
}

const FROM =
  process.env.SMTP_FROM ||
  process.env.RESEND_FROM ||
  "SIH Organizers <no-reply@sih-internals.local>";

function extractEmailAddress(input: string): string {
  const m = input.match(/<([^>]+)>/);
  return m ? m[1] : input;
}

export async function sendRegistrationEmail(to: string, name?: string) {
  const subject = "SIH Internals (MCAS) - Registration Confirmed";
  const text = `Hi ${name || ""},

Your registration for Smart India Hackathon - Internals (MCAS) is confirmed.

We will share updates and announcements via email.
Thank you and good luck!

— Organizing Team`;
  if (EMAIL_PROVIDER === "resend") {
    const resend = getResend();
    await resend.emails.send({ from: FROM, to: [to], subject, text });
    return;
  }
  const transporter = getTransporter();
  await transporter.sendMail({ from: FROM, to, subject, text });
}

// Helper: split an array into chunks
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export type BroadcastOptions = {
  chunkSize?: number; // recipients per email via BCC
  delayMs?: number; // delay between batches to respect rate limits
  html?: string; // optional HTML version of the message
  fromOverride?: string; // override FROM if needed per broadcast
};

export type BroadcastResult = {
  totalRecipients: number;
  batches: number;
  accepted: number;
  rejected: number;
  failedBatches: number;
  errors: string[];
};

export async function sendBroadcastEmail(
  to: string[],
  subject: string,
  message: string,
  options: BroadcastOptions = {}
): Promise<BroadcastResult> {
  const { chunkSize = 50, delayMs = 0, html, fromOverride } = options;

  const batches = chunk(to, Math.max(1, chunkSize));
  let accepted = 0;
  let rejected = 0;
  let failedBatches = 0;
  const errors: string[] = [];

  for (let i = 0; i < batches.length; i++) {
    const bcc = batches[i];
    try {
      if (EMAIL_PROVIDER === "resend") {
        const resend = getResend();
        // Resend requires a "to" field; send to ourselves and BCC recipients
        const selfTo = extractEmailAddress(fromOverride || FROM);
        await resend.emails.send({
          from: fromOverride || FROM,
          to: [selfTo],
          bcc,
          subject,
          text: message,
          ...(html ? { html } : {}),
        });
        // Resend doesn't return accepted/rejected arrays; assume all attempted
        accepted += bcc.length;
      } else {
        const transporter = getTransporter();
        const info = await transporter.sendMail({
          from: fromOverride || FROM,
          // Intentionally use only BCC to hide addresses from each other
          bcc,
          subject,
          text: message,
          ...(html ? { html } : {}),
        });
        accepted += Array.isArray(info.accepted) ? info.accepted.length : 0;
        rejected += Array.isArray(info.rejected) ? info.rejected.length : 0;
      }
    } catch (err: any) {
      failedBatches += 1;
      errors.push(err?.message || String(err));
    }
    if (delayMs > 0 && i < batches.length - 1) {
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }

  return {
    totalRecipients: to.length,
    batches: batches.length,
    accepted,
    rejected,
    failedBatches,
    errors,
  };
}
