import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function hashOtp(otp: string): string {
  return createHash("sha256")
    .update(otp, "utf8")
    .digest("hex");
}

function getEncryptionKey(): Buffer {
  const key = process.env.OTP_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("OTP_ENCRYPTION_KEY is not configured");
  }

  const buffer = Buffer.from(key, "base64");

  if (buffer.length !== 32) {
    throw new Error("OTP_ENCRYPTION_KEY must decode to 32 bytes");
  }

  return buffer;
}

export function encryptOtp(otp: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(otp, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptOtp(encryptedOtp: string): string {
  const key = getEncryptionKey();

  const [ivBase64, authTagBase64, encryptedBase64] = encryptedOtp.split(".");

  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Invalid encrypted OTP format");
  }

  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted OTP");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
