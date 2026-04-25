import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/lib/db";
import { user, session, account, verification } from "@/db/schema";
import { Resend } from "resend";
import crypto from "crypto";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Types for email sending functions
interface EmailUser {
  email: string;
  name?: string;
  id?: string;
}

interface EmailParams {
  user: EmailUser;
  url: string;
  token?: string;
}

// Better Auth configuration
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Password policy enforcement
    passwordPolicy: {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    sendResetPasswordEmail: async ({ user, url }: EmailParams) => {
      if (!resend) return;
      try {
        await resend.emails.send({
          from: "BookGuard <noreply@bookguard.tech>",
          to: user.email,
          subject: "Reset Your Password",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #22c55e;">Reset Your Password</h2>
              <p>Click the link below to reset your password:</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
              <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send reset password email:", error);
      }
    },
    sendVerificationEmail: async ({ user, url }: EmailParams) => {
      if (!resend) return;
      try {
        await resend.emails.send({
          from: "BookGuard <noreply@bookguard.tech>",
          to: user.email,
          subject: "Verify Your Email",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #22c55e;">Verify Your Email</h2>
              <p>Thank you for signing up for BookGuard! Please verify your email address by clicking the button below:</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Verify Email</a>
              <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
              <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }
    },
  },

  // Social providers (optional - only if env vars are set)
  socialProviders: {
    google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    } : undefined,
    github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    } : undefined,
  },

  // Session configuration with configurable timeouts
  session: {
    // Session expires after this duration (default: 8 hours for security)
    expiresIn: (parseInt(process.env.SESSION_MAX_AGE || '28800') * 1000),
    // Update session token after this duration (default: 1 hour)
    updateAge: (parseInt(process.env.SESSION_UPDATE_AGE || '3600') * 1000),
    // Enable cookie security
    cookieCache: {
      enabled: true,
      maxAge: (parseInt(process.env.SESSION_MAX_AGE || '28800') * 1000),
    },
  },
  
  // Advanced session security
  advanced: {
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === 'production',
    // Cross-subdomain cookie sharing
    crossSubDomainCookies: {
      enabled: false, // Disable for security
    },
    // Generate session ID with additional entropy
    generateId: () => crypto.randomUUID(),
  },
  
  // Two-factor authentication (2FA/MFA)
  plugins: [
    twoFactor({
      // Require 2FA for admin users only
      totpOptions: {
        issuer: 'BookGuard CRM',
        algorithm: 'SHA256',
        digits: 6,
        period: 30,
      },
      // Send 2FA codes via email as backup
      sendTwoFactorCode: async ({ user, code }: { user: EmailUser; code: string }) => {
        if (!resend) return;
        try {
          await resend.emails.send({
            from: "BookGuard <noreply@bookguard.tech>",
            to: user.email,
            subject: "Your 2FA Verification Code",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #22c55e;">Two-Factor Authentication Code</h2>
                <p>Your verification code is:</p>
                <div style="background: #f0fdf4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #16a34a; border-radius: 8px; margin: 20px 0;">
                  ${code}
                </div>
                <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
              </div>
            `,
          });
        } catch (error) {
          console.error("Failed to send 2FA email:", error);
        }
      },
    }),
  ],
});

// Export types
export type Auth = typeof auth;
