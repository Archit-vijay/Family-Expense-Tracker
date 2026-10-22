import crypto from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer into a Base32 string (RFC 4648 without padding)
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer
 */
export function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/[\s\-_=]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) {
      continue; // Skip invalid characters
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically secure 20-byte Base32 secret for TOTP
 */
export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  return base32Encode(bytes);
}

/**
 * Generates an RFC 6238 TOTP 6-digit code for a given secret and timestamp
 */
export function generateTotpCode(secret: string, timestampSeconds = Math.floor(Date.now() / 1000)): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(timestampSeconds / 30);

  // 8-byte big-endian counter
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(epoch), 0);

  const hmac = crypto.createHmac("sha1", key).update(timeBuffer).digest();

  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const code = (codeInt % 1000000).toString().padStart(6, "0");
  return code;
}

/**
 * Verifies a 6-digit TOTP code against a secret with window tolerance for clock skew
 */
export function verifyTotpCode(secret: string, code: string, windowSteps = 1): boolean {
  if (!secret || !code) return false;
  const cleanCode = code.trim().replace(/\s+/g, "");
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);

  for (let i = -windowSteps; i <= windowSteps; i++) {
    const stepTime = (currentStep + i) * 30;
    const generated = generateTotpCode(secret, stepTime);
    if (crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(cleanCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates standard otpauth URL for QR codes and authenticator apps
 */
export function generateOtpauthUrl(email: string, secret: string, issuer = "Family Finance"): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
