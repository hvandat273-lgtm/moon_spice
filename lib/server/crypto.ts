import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hmacSha256(secret: string | Buffer, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function safeHexEqual(left: string, right: string): boolean {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right) || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function idempotencyKeyHash(rawKey: string): string {
  return sha256(`moon-spice/idempotency-key/v1\0${rawKey.toLowerCase()}`);
}

export function orderRequestFingerprint(rawKey: string, canonicalPayload: string): string {
  const keyBytes = Buffer.from(rawKey.replaceAll("-", ""), "hex");
  return hmacSha256(keyBytes, `moon-spice/order-payload/v1\0${canonicalPayload}`);
}

export function advisoryLockKey(hash: string): bigint {
  return BigInt.asIntN(64, BigInt(`0x${hash.slice(0, 16)}`));
}
