/**
 * AES-256-GCM encryption utilities using the Web Crypto API (SubtleCrypto).
 *
 * The raw key material comes from VITE_ENCRYPTION_KEY (same value as the
 * backend ENCRYPTION_KEY env var).  Both sides derive the actual 256-bit AES
 * key using HKDF-SHA256 with the same info label so they stay in sync.
 *
 * Wire format (Uint8Array concatenated, then base64url encoded):
 *   IV(12) || AuthTag(16) || Ciphertext
 *
 * Note: The frontend key is visible in the build, so this layer provides
 * transport-layer defence-in-depth, not a substitute for HTTPS.
 */

const RAW_KEY_STRING =
  import.meta.env.VITE_ENCRYPTION_KEY as string | undefined;

// ── Key derivation (cached promise) ───────────────────────────────────────────

let _keyPromise: Promise<CryptoKey> | null = null;

async function getAesKey(): Promise<CryptoKey> {
  if (_keyPromise) return _keyPromise;

  _keyPromise = (async () => {
    if (!RAW_KEY_STRING) {
      throw new Error("VITE_ENCRYPTION_KEY is not set");
    }

    const encoder   = new TextEncoder();
    const rawKeyBuf = encoder.encode(RAW_KEY_STRING);

    // Import the raw string as HKDF key material
    const hkdfKey = await crypto.subtle.importKey(
      "raw", rawKeyBuf, "HKDF", false, ["deriveKey"]
    );

    // Derive a 256-bit AES-GCM key (matches backend HKDF derivation)
    return crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: new Uint8Array(32),                    // zero salt — same as backend
        info: encoder.encode("finsieve-api-v1"),     // same context label as backend
      },
      hkdfKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  })();

  return _keyPromise;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function toBase64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Encrypt any JSON-serialisable value with AES-256-GCM.
 * Returns a base64url string: IV(12) || AuthTag(16) || Ciphertext
 */
export async function encryptData(data: unknown): Promise<string> {
  const key       = await getAesKey();
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));

  // AES-GCM returns ciphertext+tag concatenated; tag is the last 16 bytes
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, plaintext)
  );

  const ciphertext = encrypted.subarray(0, encrypted.length - 16);
  const tag        = encrypted.subarray(encrypted.length - 16);

  const combined = new Uint8Array(12 + 16 + ciphertext.length);
  combined.set(iv,         0);
  combined.set(tag,        12);
  combined.set(ciphertext, 28);

  return toBase64url(combined);
}

/**
 * Decrypt a base64url string produced by `encryptData`.
 * Returns the original value, or null on failure.
 */
export async function decryptData(encoded: string): Promise<unknown> {
  try {
    const key = await getAesKey();
    const buf = fromBase64url(encoded);
    if (buf.length < 29) throw new Error("Ciphertext too short");

    const iv         = new Uint8Array(buf.subarray(0, 12));
    const tag        = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);

    // WebCrypto expects ciphertext+tag (use ArrayBuffer-backed views for strict TS)
    const combined = new Uint8Array(ciphertext.length + 16);
    combined.set(ciphertext, 0);
    combined.set(tag, ciphertext.length);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, tagLength: 128 },
      key,
      combined.buffer.slice(combined.byteOffset, combined.byteOffset + combined.byteLength),
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}

// ── Non-cryptographic display helpers ─────────────────────────────────────────

export function maskEmail(email: string): string {
  const [username, domain] = email.split("@");
  if (!username || !domain) return email;
  const masked = username[0] + "***" + (username.length > 1 ? username[username.length - 1] : "");
  return `${masked}@${domain}`;
}

export function maskPassword(password: string): string {
  return "*".repeat(password.length);
}
