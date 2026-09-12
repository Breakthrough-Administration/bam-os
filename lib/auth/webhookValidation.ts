/**
 * Breakthrough Manager OS - Cryptographic Webhook Validation
 * Protects webhook entrypoints (e.g. 17hats, NDIS Portal, Xero Webhooks) against
 * unauthorized tampering, spoofing, and prompt injection attacks.
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Validates incoming webhook payload using HMAC-SHA256 with constant-time equality check.
 * Prevents timing attacks and payload spoofing.
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) {
    return false;
  }

  try {
    const cleanSignature = signature.replace(/^sha256=/, '').trim();
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const calculatedDigest = hmac.digest('hex');

    const expectedBuffer = Buffer.from(calculatedDigest, 'utf8');
    const providedBuffer = Buffer.from(cleanSignature, 'utf8');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch (err) {
    console.error('[WebhookValidation] Signature verification error:', err);
    return false;
  }
}
