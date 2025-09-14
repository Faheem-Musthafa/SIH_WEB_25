# Production Deployment Guide

## Environment Variables Setup

When deploying to Vercel, configure these environment variables in your Vercel dashboard:

### Required Variables

```bash
# MongoDB Connection
MONGODB_URI=your-mongodb-connection-string

# Google OAuth (Get from Google Cloud Console)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# NextAuth Configuration
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=https://your-vercel-app.vercel.app

# Admin Settings
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,admin2@example.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password

# Email Configuration (Required for registration and broadcast emails)
# Choose one of the following email providers:

# Option 1: Gmail (Easy for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=SIH Organizers <your-email@gmail.com>

# Option 2: SendGrid (Recommended for production)
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=your-sendgrid-api-key
# SMTP_FROM=SIH Organizers <noreply@yourdomain.com>

# Option 3: Mailtrap (For testing)
# SMTP_HOST=smtp.mailtrap.io
# SMTP_PORT=2525
# SMTP_USER=your-mailtrap-username
# SMTP_PASS=your-mailtrap-password
# SMTP_FROM=SIH Organizers <test@sih.com>
```

## Setup Steps

### 1. Configure Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add each variable above with your actual values
5. Set **NEXTAUTH_URL** to your exact Vercel deployment URL

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for development)

### 3. Email Provider Setup

#### Option A: Gmail Setup (Development)
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to Security → 2-Step Verification
3. Enable 2-Step Verification if not already enabled
4. Go to Security → App passwords
5. Generate a new app password for "Mail"
6. Use this app password (not your Gmail password) for `SMTP_PASS`

#### Option B: SendGrid Setup (Production - Recommended)
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Go to Settings → API Keys
3. Create a new API key with "Full Access"
4. Use `apikey` as `SMTP_USER` and your API key as `SMTP_PASS`
5. Verify your sender domain/email in SendGrid

#### Option C: Mailtrap Setup (Testing)
1. Sign up at [Mailtrap](https://mailtrap.io/)
2. Go to Email Testing → Inboxes
3. Copy SMTP credentials from your inbox settings
4. Use for testing without sending real emails

### 4. Generate NextAuth Secret
```bash
# Run this command to generate a secure secret
openssl rand -base64 32
```

## Post-Deployment Testing

### 1. Test Email Configuration
Visit: `https://your-app.vercel.app/api/debug/test-email`
Send a POST request with admin authentication:
```json
{
  "testEmail": "your-test-email@example.com"
}
```

### 2. Test Admin Access
1. Visit `https://your-app.vercel.app/dashboard`
2. Sign in with Google using an admin email
3. You should see admin dashboard features

### 3. Test Registration Flow
1. Register a new participant
2. Check if registration confirmation email is received
3. Test broadcast email functionality from admin dashboard

## Email Features

### Automatic Registration Emails
- **Trigger**: When users complete registration
- **Content**: Welcome message with next steps
- **Styling**: Professional HTML template with SIH branding

### Admin Broadcast Emails
- **Access**: Admin dashboard → Broadcast section
- **Features**: Send announcements to all registered participants
- **Styling**: Branded HTML template with proper formatting

### Email Templates Include:
- 🎨 Professional HTML design with SIH branding
- 📱 Mobile-responsive layouts
- ✅ Success confirmation styling
- 📧 Automatic plain text fallback
- 🔒 BCC protection for recipient privacy

## Troubleshooting

### Email Issues
- **Authentication Failed**: Check SMTP username and password
- **Connection Timeout**: Verify SMTP host and port settings
- **Emails Not Sending**: Check spam folders, verify SMTP configuration
- **Gmail Issues**: Ensure app password is used, not regular password

### General Issues
- Check Vercel function logs for detailed errors
- Verify all environment variables are set correctly
- Ensure Google OAuth redirect URIs match exactly
- Confirm admin emails are properly configured

## Security Notes
- Never commit actual secrets to git
- Use strong passwords for admin accounts
- Regularly rotate NextAuth secret and API keys
- Restrict Google OAuth to specific domains if needed
- Use app passwords for Gmail, not regular passwords