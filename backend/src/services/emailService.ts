/**
 * Transactional Email Service via Resend REST API
 * Uses native fetch (Node.js 18+) with zero external dependencies.
 */

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Send password reset email via Resend
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string,
  userName?: string,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY is not configured.",
    };
  }

  const fromEmail = process.env.EMAIL_FROM || "Family Finance <onboarding@resend.dev>";
  const greeting = userName ? `Hi ${userName},` : "Hello,";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2a234f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f7fb; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e8e5ef; box-shadow: 0 4px 20px rgba(42, 35, 79, 0.05); overflow: hidden;">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: left; background: linear-gradient(135deg, #17132f 0%, #2a234f 100%);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: rgba(255, 255, 255, 0.12); border-radius: 12px; width: 40px; height: 40px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 20px; line-height: 40px;">🔑</span>
                  </td>
                  <td style="padding-left: 14px;">
                    <span style="display: block; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Family Finance</span>
                    <span style="display: block; font-size: 11px; font-weight: 600; color: #ffb3c3; text-transform: uppercase; letter-spacing: 0.1em;">Security Center</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 32px 36px 36px 36px;">
              <h1 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 800; color: #2a234f; letter-spacing: -0.02em;">
                Password Reset Request
              </h1>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #555068;">
                ${greeting}
              </p>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555068;">
                We received a request to reset the password associated with your account (<strong style="color: #2a234f;">${toEmail}</strong>). Click the button below to choose a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 32px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background-color: #2a234f; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(42, 35, 79, 0.25);">
                      Reset My Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f7fb; border: 1px solid #e8e5ef; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #2a234f;">
                      ⏱️ Security Notice
                    </p>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #77738a;">
                      This link will expire in <strong>60 minutes</strong> and can only be used once. If you did not request this password reset, please ignore this email—your account remains safe and no changes will be made.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #9a96a8;">
                If the button above does not work, copy and paste this URL into your browser:<br>
                <a href="${resetUrl}" style="color: #2a234f; text-decoration: underline; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #faf9fd; border-top: 1px solid #e8e5ef; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9a96a8;">
                &copy; 2026 Family Finance. Manage money together.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Family Finance - Password Reset Request

${greeting}

We received a request to reset the password for your account (${toEmail}).

To reset your password, visit the link below:
${resetUrl}

This link is valid for 60 minutes and can only be used once.

If you did not request this, you can safely ignore this email.

---
© 2026 Family Finance
  `.trim();

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: "Reset your Family Finance password",
        html,
        text,
      }),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      const errorMessage = data?.message || data?.error?.message || "Failed to send email via Resend.";
      console.error("Resend API error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    console.log(`✉️ Password reset email successfully dispatched to ${toEmail} (ID: ${data.id})`);
    return {
      success: true,
      id: data.id,
    };
  } catch (error: any) {
    console.error("Network error sending email via Resend:", error);
    return {
      success: false,
      error: error.message || "Network error while connecting to Resend.",
    };
  }
}
