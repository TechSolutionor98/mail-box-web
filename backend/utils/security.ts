import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import { Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-hostinger-panel";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "super-secret-refresh-key-hostinger-panel";

export interface TokenPayload {
  userId: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "USER" | "MAILBOX_USER";
  mailboxId?: string;
  domainId?: string;
}

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password against a hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token (1 hour expiry)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

/**
 * Generate JWT refresh token (7 days expiry)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Generate 2FA TOTP secret key for admin login
 */
export function generateTotpSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `HostingControlPanel (${email})`,
    length: 20,
  });
  return {
    base32: secret.base32,
    otpauth_url: secret.otpauth_url || "",
  };
}

/**
 * Verify 2FA TOTP token against base32 secret
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 2,
  });
}

/**
 * Uniform error response helper
 */
export function errorResponse(res: Response, statusCode: number, message: string) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}
