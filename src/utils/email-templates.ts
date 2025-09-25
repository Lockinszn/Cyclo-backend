import { Resend } from "resend";
import {
  EmailTemplate,
  EmailVerificationData,
  PasswordResetData,
} from "../types/auth-types";

/**
 * Email templates and utilities for sending authentication-related emails
 */
export class EmailTemplates {
  private static resend: Resend;

  /**
   * Initialize Resend client
   */
  static initialize(): void {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    this.resend = new Resend(apiKey);
  }

  /**
   * Get Resend client instance
   */
  private static getResendClient(): Resend {
    if (!this.resend) {
      this.initialize();
    }
    return this.resend;
  }

  /**
   * Base email template with consistent styling
   */
  private static getBaseTemplate(content: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cyclo</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8fafc;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
            }
            
            .header h1 {
                color: #ffffff;
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            
            .header p {
                color: #e2e8f0;
                font-size: 16px;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .content h2 {
                color: #1a202c;
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 20px;
            }
            
            .content p {
                color: #4a5568;
                font-size: 16px;
                margin-bottom: 20px;
            }
            
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                text-decoration: none;
                padding: 14px 28px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s ease;
            }
            
            .button:hover {
                transform: translateY(-2px);
            }
            
            .code-box {
                background-color: #f7fafc;
                border: 2px dashed #cbd5e0;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
            }
            
            .code {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 24px;
                font-weight: 700;
                color: #2d3748;
                letter-spacing: 4px;
            }
            
            .footer {
                background-color: #f7fafc;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer p {
                color: #718096;
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            .footer a {
                color: #667eea;
                text-decoration: none;
            }
            
            .security-notice {
                background-color: #fef5e7;
                border-left: 4px solid #f6ad55;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
            }
            
            .security-notice p {
                color: #744210;
                font-size: 14px;
                margin: 0;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 0 10px;
                }
                
                .header, .content, .footer {
                    padding: 20px;
                }
                
                .header h1 {
                    font-size: 24px;
                }
                
                .content h2 {
                    font-size: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Cyclo</h1>
                <p>Your Blog Platform</p>
            </div>
            ${content}
            <div class="footer">
                <p>This email was sent from Cyclo. If you didn't request this, please ignore this email.</p>
                <p>Need help? <a href="mailto:support@cyclo.com">Contact Support</a></p>
                <p>&copy; 2024 Cyclo. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Email verification template
   */
  static getEmailVerificationTemplate(
    data: EmailVerificationData
  ): EmailTemplate {
    const content = `
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi${data.firstName ? ` ${data.firstName}` : ""},</p>
            <p>Welcome to Cyclo! To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="${
                  data.verificationUrl
                }" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 14px;">${
              data.verificationUrl
            }</p>
            
            <div class="security-notice">
                <p><strong>Security Notice:</strong> This verification link will expire in 24 hours for your security. If you didn't create an account with Cyclo, please ignore this email.</p>
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul style="color: #4a5568; margin-left: 20px; margin-bottom: 20px;">
                <li>Create and publish blog posts</li>
                <li>Customize your profile</li>
                <li>Connect with other writers</li>
                <li>Access all platform features</li>
            </ul>
            
            <p>Thank you for joining Cyclo!</p>
        </div>
    `;

    return {
      subject: "Verify Your Email Address - Cyclo",
      html: this.getBaseTemplate(content),
      text: `Hi${data.firstName ? ` ${data.firstName}` : ""},

Welcome to Cyclo! To complete your registration, please verify your email address by visiting this link:

${data.verificationUrl}

This verification link will expire in 24 hours for your security.

If you didn't create an account with Cyclo, please ignore this email.

Thank you for joining Cyclo!

---
Cyclo Team
Need help? Contact us at support@cyclo.com`,
    };
  }

  /**
   * Password reset template
   */
  static getPasswordResetTemplate(data: PasswordResetData): EmailTemplate {
    const content = `
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi${data.firstName ? ` ${data.firstName}` : ""},</p>
            <p>We received a request to reset the password for your Cyclo account (${
              data.email
            }). If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 14px;">${
              data.resetUrl
            }</p>
            
            <div class="security-notice">
                <p><strong>Security Notice:</strong> This password reset link will expire in ${
                  data.expiresIn
                } for your security. If you didn't request a password reset, please ignore this email - your password will remain unchanged.</p>
            </div>
            
            <p><strong>Tips for a strong password:</strong></p>
            <ul style="color: #4a5568; margin-left: 20px; margin-bottom: 20px;">
                <li>Use at least 8 characters</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Add numbers and special characters</li>
                <li>Avoid common words or personal information</li>
            </ul>
            
            <p>If you continue to have problems, please contact our support team.</p>
        </div>
    `;

    return {
      subject: "Reset Your Password - Cyclo",
      html: this.getBaseTemplate(content),
      text: `Hi${data.firstName ? ` ${data.firstName}` : ""},

We received a request to reset the password for your Cyclo account (${
        data.email
      }).

If you made this request, visit this link to reset your password:
${data.resetUrl}

This password reset link will expire in ${data.expiresIn} for your security.

If you didn't request a password reset, please ignore this email - your password will remain unchanged.

Tips for a strong password:
- Use at least 8 characters
- Include uppercase and lowercase letters
- Add numbers and special characters
- Avoid common words or personal information

If you continue to have problems, please contact our support team.

---
Cyclo Team
Need help? Contact us at support@cyclo.com`,
    };
  }

  /**
   * Welcome email template (sent after email verification)
   */
  static getWelcomeTemplate(firstName?: string): EmailTemplate {
    const content = `
        <div class="content">
            <h2>Welcome to Cyclo! 🎉</h2>
            <p>Hi${firstName ? ` ${firstName}` : ""},</p>
            <p>Congratulations! Your email has been verified and your Cyclo account is now active. We're excited to have you join our community of writers and readers.</p>
            
            <div style="text-align: center;">
                <a href="${
                  process.env.FRONTEND_URL || "https://cyclo.com"
                }/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <p><strong>Here's what you can do now:</strong></p>
            <ul style="color: #4a5568; margin-left: 20px; margin-bottom: 20px;">
                <li>📝 Write your first blog post</li>
                <li>🎨 Customize your profile</li>
                <li>📚 Explore posts from other writers</li>
                <li>💬 Engage with the community</li>
            </ul>
            
            <p><strong>Getting Started Tips:</strong></p>
            <ul style="color: #4a5568; margin-left: 20px; margin-bottom: 20px;">
                <li>Complete your profile to help others discover your content</li>
                <li>Write an engaging bio that reflects your personality</li>
                <li>Use relevant tags to reach the right audience</li>
                <li>Engage with other writers to build your network</li>
            </ul>
            
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            
            <p>Happy writing!</p>
        </div>
    `;

    return {
      subject: "Welcome to Cyclo! Your account is ready 🎉",
      html: this.getBaseTemplate(content),
      text: `Hi${firstName ? ` ${firstName}` : ""},

Congratulations! Your email has been verified and your Cyclo account is now active. We're excited to have you join our community of writers and readers.

Here's what you can do now:
- Write your first blog post
- Customize your profile
- Explore posts from other writers
- Engage with the community

Getting Started Tips:
- Complete your profile to help others discover your content
- Write an engaging bio that reflects your personality
- Use relevant tags to reach the right audience
- Engage with other writers to build your network

Visit your dashboard: ${
        process.env.FRONTEND_URL || "https://cyclo.com"
      }/dashboard

If you have any questions or need help getting started, don't hesitate to reach out to our support team.

Happy writing!

---
Cyclo Team
Need help? Contact us at support@cyclo.com`,
    };
  }

  /**
   * Password changed confirmation template
   */
  static getPasswordChangedTemplate(firstName?: string): EmailTemplate {
    const content = `
        <div class="content">
            <h2>Password Changed Successfully</h2>
            <p>Hi${firstName ? ` ${firstName}` : ""},</p>
            <p>This email confirms that your Cyclo account password has been successfully changed.</p>
            
            <div class="security-notice">
                <p><strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately and consider the following steps:</p>
                <ul style="margin-top: 10px; margin-left: 20px;">
                    <li>Change your password immediately</li>
                    <li>Review your account activity</li>
                    <li>Enable two-factor authentication if available</li>
                </ul>
            </div>
            
            <p><strong>Account Security Tips:</strong></p>
            <ul style="color: #4a5568; margin-left: 20px; margin-bottom: 20px;">
                <li>Use a unique password for your Cyclo account</li>
                <li>Don't share your login credentials with anyone</li>
                <li>Log out from shared or public computers</li>
                <li>Regularly update your password</li>
            </ul>
            
            <p>If you have any concerns about your account security, please don't hesitate to contact our support team.</p>
        </div>
    `;

    return {
      subject: "Password Changed - Cyclo",
      html: this.getBaseTemplate(content),
      text: `Hi${firstName ? ` ${firstName}` : ""},

This email confirms that your Cyclo account password has been successfully changed.

Security Notice: If you didn't make this change, please contact our support team immediately and consider the following steps:
- Change your password immediately
- Review your account activity
- Enable two-factor authentication if available

Account Security Tips:
- Use a unique password for your Cyclo account
- Don't share your login credentials with anyone
- Log out from shared or public computers
- Regularly update your password

If you have any concerns about your account security, please don't hesitate to contact our support team.

---
Cyclo Team
Need help? Contact us at support@cyclo.com`,
    };
  }

  /**
   * Send email verification
   */
  static async sendEmailVerification(
    to: string,
    data: EmailVerificationData
  ): Promise<void> {
    try {
      const template = this.getEmailVerificationTemplate(data);
      const resend = this.getResendClient();

      await resend.emails.send({
        from: process.env.FROM_EMAIL || "noreply@cyclo.com",
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      throw new Error(
        `Failed to send email verification: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(
    to: string,
    data: PasswordResetData
  ): Promise<void> {
    try {
      const template = this.getPasswordResetTemplate(data);
      const resend = this.getResendClient();

      await resend.emails.send({
        from: process.env.FROM_EMAIL || "noreply@cyclo.com",
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      throw new Error(
        `Failed to send password reset email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(to: string, firstName?: string): Promise<void> {
    try {
      const template = this.getWelcomeTemplate(firstName);
      const resend = this.getResendClient();

      await resend.emails.send({
        from: process.env.FROM_EMAIL || "noreply@cyclo.com",
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      throw new Error(
        `Failed to send welcome email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Send password changed confirmation
   */
  static async sendPasswordChangedConfirmation(
    to: string,
    firstName?: string
  ): Promise<void> {
    try {
      const template = this.getPasswordChangedTemplate(firstName);
      const resend = this.getResendClient();

      await resend.emails.send({
        from: process.env.FROM_EMAIL || "noreply@cyclo.com",
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      throw new Error(
        `Failed to send password changed confirmation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
