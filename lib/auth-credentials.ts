import crypto from "crypto";

const SALT_BYTES = 16;
const KEY_LEN = 64;

export function hashPassword(password: string, salt?: string) {
  const resolvedSalt = salt ?? crypto.randomBytes(SALT_BYTES).toString("hex");
  const hash = crypto
    .scryptSync(password, resolvedSalt, KEY_LEN)
    .toString("hex");
  return { salt: resolvedSalt, hash };
}

export function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): boolean {
  const hashBuffer = Buffer.from(
    crypto.scryptSync(password, salt, KEY_LEN).toString("hex"),
    "hex"
  );
  const storedBuffer = Buffer.from(storedHash, "hex");
  if (hashBuffer.length !== storedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, storedBuffer);
}
