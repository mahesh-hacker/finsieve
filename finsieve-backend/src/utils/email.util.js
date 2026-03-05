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

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email, firstName) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const subject = "Welcome to Finsieve! 🎉";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Welcome to Finsieve!</h1>
      <p>Hi ${firstName},</p>
      <p>Thank you for joining Finsieve - your 360° Investment Intelligence Platform!</p>
      <p>You now have access to:</p>
      <ul>
        <li>🌍 8+ Asset Classes (Equities, Mutual Funds, Crypto & more)</li>
        <li>🔍 Advanced Screening with 50+ parameters</li>
        <li>📊 Real-time Market Data</li>
        <li>📈 Comparison Tools</li>
        <li>🎯 Personalized Watchlists</li>
      </ul>
      <p>Start exploring now: <a href="${frontendUrl}">Login to Finsieve</a></p>
      <p>Happy Investing!</p>
      <p>- The Finsieve Team</p>
    </div>
  `;

  const text = `
Welcome to Finsieve!

Hi ${firstName},

Thank you for joining Finsieve - your 360° Investment Intelligence Platform!

You now have access to 8+ Asset Classes, Advanced Screening, Real-time Market Data, and more.

Start exploring now: ${frontendUrl}

Happy Investing!
- The Finsieve Team
  `;

  return sendEmail({ to: email, subject, html, text });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const subject = "Reset Your Finsieve Password";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Reset Your Password</h1>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password for your Finsieve account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                  color: white;
                  padding: 12px 30px;
                  text-decoration: none;
                  border-radius: 8px;
                  display: inline-block;
                  font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
        ${resetUrl}
      </p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
      <p>- The Finsieve Team</p>
    </div>
  `;

  const text = `
Reset Your Password

Hi ${firstName},

We received a request to reset your password for your Finsieve account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

- The Finsieve Team
  `;

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
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Verify Your Email</h1>
      <p>Hi ${firstName},</p>
      <p>Thanks for signing up for Finsieve! Please verify your email address to get started.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                  color: white;
                  padding: 12px 30px;
                  text-decoration: none;
                  border-radius: 8px;
                  display: inline-block;
                  font-weight: bold;">
          Verify Email
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
        ${verificationUrl}
      </p>
      <p><strong>This link will expire in 24 hours.</strong></p>
      <p>- The Finsieve Team</p>
    </div>
  `;

  const text = `
Verify Your Email

Hi ${firstName},

Thanks for signing up for Finsieve! Please verify your email address to get started.

Click this link to verify:
${verificationUrl}

This link will expire in 24 hours.

- The Finsieve Team
  `;

  return sendEmail({ to: email, subject, html, text });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
};
