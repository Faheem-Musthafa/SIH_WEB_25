import { type NextRequest, NextResponse } from "next/server"
import { sendBroadcastEmail, validateEmailConfig } from "@/lib/email"
import { connectMongoose } from "@/lib/mongoose"
import Participant from "@/models/participant"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const sessionRaw = await getServerSession(authOptions);
  const session = sessionRaw as { user?: { isAdmin?: boolean } };
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, message } = await req.json().catch(() => ({}))
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message required" }, { status: 400 })
  }

  // Validate email configuration before attempting to send
  const emailValidation = await validateEmailConfig();
  if (!emailValidation.success) {
    return NextResponse.json({ 
      error: "Email service not configured", 
      detail: emailValidation.error,
      suggestion: "Please configure SMTP settings in environment variables"
    }, { status: 500 });
  }

  try {
    await connectMongoose()
    const emails = await Participant.find({}, { email: 1, _id: 0 }).lean()
    const to = emails.map((e: any) => e.email).filter(Boolean)

    if (to.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        info: "No recipients found. Please ensure participants have registered first." 
      })
    }

    await sendBroadcastEmail(to, subject, message)
    
    return NextResponse.json({ 
      ok: true, 
      count: to.length,
      message: `Broadcast sent successfully to ${to.length} participants`
    })
  } catch (e: any) {
    console.error("Broadcast email failed:", e);
    
    // Provide more specific error messages
    let errorDetail = e?.message || "Unknown error occurred";
    let suggestion = "Please check your SMTP configuration and try again.";
    
    if (errorDetail.includes("authentication")) {
      suggestion = "SMTP authentication failed. Please check your username and password.";
    } else if (errorDetail.includes("connection")) {
      suggestion = "Could not connect to SMTP server. Please check your host and port settings.";
    } else if (errorDetail.includes("timeout")) {
      suggestion = "SMTP connection timed out. Please check your network connection and SMTP settings.";
    }
    
    return NextResponse.json({ 
      error: "Failed to send broadcast emails", 
      detail: errorDetail,
      suggestion: suggestion
    }, { status: 500 })
  }
}
