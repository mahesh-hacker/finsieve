import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

/**
 * Email utility — Brevo (Sendinblue) REST API.
 * Railway blocks SMTP ports; HTTP API is required.
 * Free tier: 300 emails/day to any address.
 * Required env vars: BREVO_API_KEY, EMAIL_FROM (verified sender email)
 */

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.BREVO_API_KEY) {
    console.log("\n--- EMAIL (BREVO_API_KEY not set) ---");
    console.log(`To: ${to} | Subject: ${subject}`);
    console.log("--------------------------------------\n");
    return { success: true, messageId: "no-provider" };
  }

  const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Finsieve", email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Email sent successfully:", response.data.messageId);
    console.log(`   To: ${to} | Subject: ${subject}`);

    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.error("Email sending failed:", JSON.stringify(detail));
    throw new Error(`Failed to send email: ${JSON.stringify(detail)}`);
  }
};

const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Finsieve</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">360° Investment Intelligence</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 Finsieve. All rights reserved.</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">This email was sent to you because you have an account on Finsieve.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const ctaButton = (url, label) => `
  <div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.3px;">${label}</a>
  </div>`;

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email, firstName) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const subject = "Welcome to Finsieve!";
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Welcome aboard, ${firstName}!</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">Thank you for joining Finsieve — your 360° Investment Intelligence Platform. Your account is ready to go.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      ${[
        ["📊", "Real-time Market Data", "Live prices across NSE, BSE, MCX and global markets"],
        ["🔍", "Advanced Screening", "Filter stocks with 50+ parameters"],
        ["📈", "Multi-Asset Coverage", "Equities, Mutual Funds, Crypto & more"],
        ["🎯", "Personalized Watchlists", "Track the assets that matter to you"],
      ].map(([icon, title, desc]) => `
      <tr>
        <td width="44" valign="top" style="padding:0 0 16px;">
          <div style="width:36px;height:36px;background:#eff6ff;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">${icon}</div>
        </td>
        <td valign="top" style="padding:0 0 16px 12px;">
          <p style="margin:0;color:#1e293b;font-weight:600;font-size:14px;">${title}</p>
          <p style="margin:2px 0 0;color:#64748b;font-size:13px;">${desc}</p>
        </td>
      </tr>`).join("")}
    </table>
    ${ctaButton(frontendUrl, "Start Exploring")}
    <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;text-align:center;">Happy Investing!<br>The Finsieve Team</p>
  `);

  const text = `Welcome to Finsieve, ${firstName}!\n\nYour account is ready. Start exploring: ${frontendUrl}\n\nHappy Investing!\n- The Finsieve Team`;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const subject = "Reset Your Finsieve Password";
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Reset Your Password</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">Hi ${firstName}, we received a request to reset the password for your Finsieve account.</p>
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px 18px;margin:0 0 24px;">
      <p style="margin:0;color:#854d0e;font-size:13px;"><strong>This link expires in 1 hour.</strong> If you didn't request a reset, you can safely ignore this email.</p>
    </div>
    ${ctaButton(resetUrl, "Reset Password")}
    <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;text-align:center;">The Finsieve Team</p>
  `);

  const text = `Reset Your Finsieve Password\n\nHi ${firstName},\n\nClick the link below to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.\n\n- The Finsieve Team`;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Send email verification email
 */
export const sendEmailVerificationEmail = async (
  email,
  firstName,
  verificationToken,
) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const subject = "Verify Your Finsieve Email";
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Verify Your Email</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">Hi ${firstName}, thanks for signing up! Click the button below to verify your email address and activate your account.</p>
    ${ctaButton(verificationUrl, "Verify Email Address")}
    <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;text-align:center;">This link expires in 24 hours.<br>The Finsieve Team</p>
  `);

  const text = `Verify Your Finsieve Email\n\nHi ${firstName},\n\nClick the link below to verify your email (expires in 24 hours):\n${verificationUrl}\n\n- The Finsieve Team`;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Send account deletion confirmation email
 */
export const sendAccountDeletionEmail = async (email, firstName) => {
  const subject = "We're Sorry to See You Go";
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Account Deleted</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
      Hi ${firstName}, we're truly sorry to see you leave. Your Finsieve account has been
      <strong>permanently deleted</strong> as per your request.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;">
        <strong>What was removed:</strong><br>
        • Your profile and personal data<br>
        • All watchlists and saved preferences<br>
        • Any active subscription has been cancelled<br>
        • All session tokens have been invalidated
      </p>
    </div>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
      If this was a mistake or you change your mind, you're always welcome to create a new account.
      We'll be here to welcome you back.
    </p>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;text-align:center;">
      Warm regards,<br>The Finsieve Team
    </p>
  `);

  const text = `Hi ${firstName},\n\nYour Finsieve account has been permanently deleted.\n\nIf this was a mistake, you can always create a new account at any time.\n\nWarm regards,\nThe Finsieve Team`;

  return sendEmail({ to: email, subject, html, text });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  sendAccountDeletionEmail,
};
