interface WelcomeEmailProps {
  fullName?: string
  email: string
}

export function renderWelcomeEmail({ fullName, email }: WelcomeEmailProps): string {
  const name = fullName ?? email.split('@')[0]
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #fafafa; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 40px auto; padding: 32px; background: #18181b; border-radius: 12px; border: 1px solid #27272a;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
      <span style="font-size: 22px; font-weight: 800; color: #fafafa;">ResuLift</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #fafafa;">Welcome, ${name}! 👋</h1>
    <p style="color: #a1a1aa; line-height: 1.7; margin: 0 0 16px;">
      Your account is ready. You can now start analyzing your resume against job descriptions to improve your ATS score and land more interviews.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/new"
       style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 8px 0 24px;">
      Analyze My First Resume →
    </a>
    <p style="color: #71717a; font-size: 12px; margin: 0; border-top: 1px solid #27272a; padding-top: 20px;">
      You're receiving this because you signed up for ResuLift with ${email}.<br>
      © ${new Date().getFullYear()} ResuLift. All rights reserved.
    </p>
  </div>
</body>
</html>`
}
