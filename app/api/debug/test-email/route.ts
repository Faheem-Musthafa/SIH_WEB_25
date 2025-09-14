import { type NextRequest, NextResponse } from "next/server"
import { sendRegistrationEmail } from "@/lib/email"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const sessionRaw = await getServerSession(authOptions);
  const session = sessionRaw as { user?: { isAdmin?: boolean } };
  
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { testEmail } = await req.json().catch(() => ({}))
  
  if (!testEmail) {
    return NextResponse.json({ error: "Test email address required" }, { status: 400 })
  }

  try {
    // Test the email configuration
    await sendRegistrationEmail(testEmail, "Test User")
    
    return NextResponse.json({ 
      success: true, 
      message: `Test email sent successfully to ${testEmail}`,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("Email test failed:", error)
    
    return NextResponse.json({ 
      error: "Failed to send test email", 
      detail: error?.message,
      suggestion: "Check your SMTP configuration in environment variables"
    }, { status: 500 })
  }
}