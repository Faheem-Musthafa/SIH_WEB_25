import nodemailer from "nodemailer";

type Transporter = ReturnType<typeof nodemailer.createTransport>;

declare global {
  // eslint-disable-next-line no-var
  var __mailerTransporter: Transporter | undefined;
}

function getTransporter(): Transporter {
  if (global.__mailerTransporter) return global.__mailerTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP configuration. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in your environment variables. Check your .env.local file."
    );
  }

  try {
    const transporter = nodemailer.createTransporter({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 10000,     // 10 seconds
    });

    global.__mailerTransporter = transporter;
    return transporter;
  } catch (error) {
    throw new Error(`Failed to create email transporter: ${(error as Error).message}`);
  }
}

const FROM =
  process.env.SMTP_FROM || "SIH Organizers <no-reply@sih-internals.local>";

// Helper function to validate email configuration
export async function validateEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true };
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Email configuration validation failed:", errorMessage);
    return { 
      success: false, 
      error: `Email configuration invalid: ${errorMessage}` 
    };
  }
}

export async function sendRegistrationEmail(to: string, name?: string) {
  const transporter = getTransporter();
  const subject = "SIH Internals (MCAS) - Registration Confirmed ✅";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Confirmed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Smart India Hackathon</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Internals (MCAS)</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Hi ${name || 'Participant'}! 👋</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #28a745;">✅ Registration Confirmed!</p>
        </div>
        
        <p style="font-size: 16px; margin: 20px 0;">
          Your registration for <strong>Smart India Hackathon - Internals (MCAS)</strong> has been successfully confirmed.
        </p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1976d2; font-size: 18px;">📋 What's Next?</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Check your email regularly for updates and announcements</li>
            <li>Join the team discovery phase when it opens</li>
            <li>Prepare for an exciting hackathon experience!</li>
          </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
          <p style="margin: 0; color: #856404;">
            <strong>📧 Important:</strong> We'll share all updates, team formation details, and event announcements via email. Make sure to check your inbox regularly!
          </p>
        </div>
        
        <p style="font-size: 16px; margin: 20px 0;">
          Get ready to innovate, collaborate, and create amazing solutions! 🌟
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            Best wishes for the hackathon!<br>
            <strong>— SIH Organizing Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 15px; color: #666; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from Smart India Hackathon - Internals (MCAS)</p>
      </div>
    </body>
    </html>
  `;

  const text = `Hi ${name || "Participant"}!

Your registration for Smart India Hackathon - Internals (MCAS) is confirmed.

What's Next?
- Check your email regularly for updates and announcements
- Join the team discovery phase when it opens  
- Prepare for an exciting hackathon experience!

We'll share all updates, team formation details, and event announcements via email.
Thank you and good luck!

— SIH Organizing Team`;

  await transporter.sendMail({ 
    from: FROM, 
    to, 
    subject, 
    text,
    html 
  });
}

export async function sendBroadcastEmail(
  to: string[],
  subject: string,
  message: string
) {
  const transporter = getTransporter();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📢 SIH Announcement</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Smart India Hackathon - Internals (MCAS)</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2c3e50; margin-top: 0;">${subject}</h2>
        
        <div style="font-size: 16px; line-height: 1.8; margin: 20px 0;">
          ${message.split('\n').map(line => 
            line.trim() ? `<p style="margin: 15px 0;">${line}</p>` : '<br>'
          ).join('')}
        </div>
        
        <div style="text-align: center; margin: 30px 0; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            <strong>— SIH Organizing Team</strong><br>
            Smart India Hackathon - Internals (MCAS)
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 15px; color: #666; font-size: 12px;">
        <p style="margin: 0;">This message was sent to all registered participants</p>
      </div>
    </body>
    </html>
  `;

  // Use BCC to avoid exposing recipient emails to each other
  await transporter.sendMail({ 
    from: FROM, 
    bcc: to, 
    subject, 
    text: message,
    html 
  });
}
