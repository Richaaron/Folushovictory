import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

export function generateRandomPassword(length = 8) {
  const bytes = crypto.randomBytes(Math.ceil(length));
  return bytes
    .toString("base64")
    .replaceAll("+", "A")
    .replaceAll("/", "B")
    .replaceAll("=", "C")
    .slice(0, length);
}

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

export function signJwt(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyJwt(token) {
  return jwt.verify(token, config.jwtSecret);
}

