import { createHmac, timingSafeEqual } from "node:crypto";
import type { InboundEvent } from "./types.ts";

/** Verify HMAC over the unmodified payload before JSON parsing. */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature.startsWith("sha256=")) return false;
  const candidate = Buffer.from(signature.slice(7), "hex");
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function parseInboundEvent(rawBody: string): InboundEvent {
  const input: unknown = JSON.parse(rawBody);
  if (!input || typeof input !== "object") throw new Error("Invalid event");
  const obj = input as Record<string, unknown>;
  if (typeof obj.id !== "string" || !obj.id || typeof obj.customerId !== "string" || !obj.customerId || typeof obj.text !== "string") {
    throw new Error("Missing event fields");
  }
  if (obj.channel !== "messaging" && obj.channel !== "voice" && obj.channel !== "web") {
    throw new Error("Invalid channel");
  }
  return { id: obj.id, channel: obj.channel, customerId: obj.customerId, text: obj.text.slice(0, 2000) };
}
