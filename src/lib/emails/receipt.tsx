interface ReceiptEmailProps {
  email: string
  amount: number
  analysisType: 'basic' | 'premium'
  analysisId: string
  paymentDate: string
}

export function renderReceiptEmail({
  email,
  amount,
  analysisType,
  analysisId,
  paymentDate,
}: ReceiptEmailProps): string {
  const formattedAmount = (amount / 100).toFixed(2)

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #fafafa; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 40px auto; padding: 32px; background: #18181b; border-radius: 12px; border: 1px solid #27272a;">
    <span style="font-size: 22px; font-weight: 800; color: #fafafa; display: block; margin-bottom: 32px;">ResuLift</span>
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #fafafa;">Payment Receipt</h1>
    <p style="color: #a1a1aa; margin: 0 0 32px;">Thank you for your purchase!</p>

    <div style="background: #09090b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #a1a1aa; padding: 8px 0; font-size: 14px;">Service</td>
          <td style="color: #fafafa; padding: 8px 0; font-size: 14px; text-align: right; text-transform: capitalize;">${analysisType} Analysis</td>
        </tr>
        <tr>
          <td style="color: #a1a1aa; padding: 8px 0; font-size: 14px;">Date</td>
          <td style="color: #fafafa; padding: 8px 0; font-size: 14px; text-align: right;">${paymentDate}</td>
        </tr>
        <tr style="border-top: 1px solid #27272a;">
          <td style="color: #fafafa; padding: 12px 0 0; font-weight: 700;">Total</td>
          <td style="color: #7c3aed; padding: 12px 0 0; font-weight: 700; text-align: right; font-size: 18px;">$${formattedAmount}</td>
        </tr>
      </table>
    </div>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/analysis/${analysisId}"
       style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-bottom: 32px;">
      View Analysis →
    </a>

    <p style="color: #71717a; font-size: 12px; margin: 0; border-top: 1px solid #27272a; padding-top: 20px;">
      Receipt sent to: ${email}<br>
      © ${new Date().getFullYear()} ResuLift. All rights reserved.
    </p>
  </div>
</body>
</html>`
}
