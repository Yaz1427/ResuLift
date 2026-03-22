interface AnalysisCompleteEmailProps {
  email: string
  fullName?: string
  analysisId: string
  atsScore: number
  jobTitle?: string
  analysisType: 'basic' | 'premium'
}

export function renderAnalysisCompleteEmail({
  email,
  fullName,
  analysisId,
  atsScore,
  jobTitle,
  analysisType,
}: AnalysisCompleteEmailProps): string {
  const name = fullName ?? email.split('@')[0]
  const scoreColor = atsScore >= 80 ? '#22c55e' : atsScore >= 60 ? '#eab308' : atsScore >= 40 ? '#f97316' : '#ef4444'
  const scoreLabel = atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : atsScore >= 40 ? 'Fair' : 'Needs Work'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #fafafa; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 40px auto; padding: 32px; background: #18181b; border-radius: 12px; border: 1px solid #27272a;">
    <span style="font-size: 22px; font-weight: 800; color: #fafafa; display: block; margin-bottom: 32px;">ResuLift</span>
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #fafafa;">Your analysis is ready, ${name}!</h1>
    <p style="color: #a1a1aa; margin: 0 0 32px;">${jobTitle ? `Analysis for: ${jobTitle}` : 'Your resume analysis is complete.'}</p>

    <div style="background: #09090b; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 56px; font-weight: 800; color: ${scoreColor};">${atsScore}</div>
      <div style="color: #a1a1aa; font-size: 14px; margin-top: 4px;">ATS Score — ${scoreLabel}</div>
    </div>

    <p style="color: #a1a1aa; line-height: 1.7; margin: 0 0 24px;">
      ${analysisType === 'premium'
        ? 'Your premium analysis includes keyword recommendations, AI-rewritten bullet points, and a full gap analysis.'
        : 'Your analysis includes keyword recommendations, format feedback, and prioritized improvements.'
      }
    </p>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/analysis/${analysisId}"
       style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-bottom: 32px;">
      View Full Report →
    </a>

    <p style="color: #71717a; font-size: 12px; margin: 0; border-top: 1px solid #27272a; padding-top: 20px;">
      © ${new Date().getFullYear()} ResuLift. All rights reserved.
    </p>
  </div>
</body>
</html>`
}
