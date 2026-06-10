import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export const isRazorpayConfigured = !!(keyId && keySecret);

let instance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!isRazorpayConfigured) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  if (!instance) {
    instance = new Razorpay({ key_id: keyId!, key_secret: keySecret! });
  }
  return instance;
}

/**
 * Verify the payment signature returned by Razorpay checkout.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!keySecret) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

/**
 * Verify a Razorpay webhook signature.
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;
  if (!webhookSecret) return false;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");
  return expected === signature;
}
