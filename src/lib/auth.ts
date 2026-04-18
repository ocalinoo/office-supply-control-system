import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "oscs-secret-key-change-in-production-2024";

export interface JWTPayload {
  userId: string;
  username: string;
  role: "ADMIN" | "USER" | "MANAGER";
  privileges?: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getUserFromCookie(cookie: string): JWTPayload | null {
  const token = cookie.split("oscs_token=")[1]?.split(";")[0];
  if (!token) return null;
  return verifyToken(token);
}
