/**
 * AES-256-GCM Encryption Middleware
 *
 * Replaces the previous Base64+reverse obfuscation with real authenticated
 * encryption using Node.js built-in `crypto`.
 *
 * Wire format (base64url of concatenated bytes):
 *   [12-byte IV][16-byte GCM auth-tag][ciphertext]
 *
 * The key is derived from ENCRYPTION_KEY via HKDF-SHA256 so the env var
 * can be any string (no need for exactly 32 bytes).
 */

import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// ── Key derivation ─────────────────────────────────────────────────────────────
const RAW_KEY = process.env.ENCRYPTION_KEY;
if (!RAW_KEY || RAW_KEY.length < 16) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL: ENCRYPTION_KEY must be set and at least 16 characters long");
  }
  console.warn("⚠️  ENCRYPTION_KEY not set — request/response encryption disabled (dev only)");
}

const AES_KEY = RAW_KEY ? crypto.hkdfSync(
  "sha256",
  Buffer.from(RAW_KEY),
  Buffer.alloc(32),                        // zero salt is fine when deriving from a secret
  Buffer.from("finsieve-api-v1"),          // context label
  32,                                      // 256-bit output
) : null;

// ── Crypto helpers ─────────────────────────────────────────────────────────────

/**
 * Encrypt any JSON-serialisable value with AES-256-GCM.
 * Returns base64url string: IV(12) || AuthTag(16) || Ciphertext
 */
export const encryptData = (data) => {
  if (!AES_KEY) return JSON.stringify(data);  // dev fallback — no key configured
  const iv         = crypto.randomBytes(12);
  const cipher     = crypto.createCipheriv("aes-256-gcm", AES_KEY, iv);
  const plaintext  = Buffer.from(JSON.stringify(data));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag        = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
};

/**
 * Decrypt a base64url string produced by `encryptData`.
 * Throws on auth-tag mismatch (tampered/wrong-key payload).
 */
export const decryptData = (encoded) => {
  if (!AES_KEY) return JSON.parse(encoded);   // dev fallback — no key configured
  const buf        = Buffer.from(encoded, "base64url");
  if (buf.length < 29) throw new Error("Ciphertext too short");
  const iv         = buf.subarray(0, 12);
  const tag        = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", AES_KEY, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8"));
};

// ── Express middleware ─────────────────────────────────────────────────────────

/**
 * Decrypt incoming request body.
 * Expects header `x-encrypted: true` + body `{ encrypted: "<base64url>" }`
 */
export const decryptRequest = (req, res, next) => {
  if (req.headers["x-encrypted"] === "true" && req.body?.encrypted) {
    try {
      const decrypted = decryptData(req.body.encrypted);
      if (!decrypted || typeof decrypted !== "object") {
        return res.status(400).json({ success: false, message: "Invalid encrypted payload" });
      }
      req.body = decrypted;
    } catch (_err) {
      return res.status(400).json({ success: false, message: "Encrypted data could not be verified" });
    }
  }
  next();
};

/**
 * Encrypt outgoing response when client sent `x-encrypted: true`.
 */
export const encryptResponse = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (req.headers["x-encrypted"] === "true") {
      try {
        const encrypted = encryptData(data);
        res.setHeader("X-Encrypted", "true");
        return originalJson({ encrypted });
      } catch (_err) {
        // Should never happen; fall through to plain JSON
      }
    }
    return originalJson(data);
  };

  next();
};
