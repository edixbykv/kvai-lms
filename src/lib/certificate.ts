import QRCode from "qrcode";
import { customAlphabet } from "nanoid";

const idGen = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
const codeGen = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  return `KVAI-${year}-${idGen()}`;
}

export function generateVerificationCode(): string {
  return codeGen();
}

export function verificationUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://learn.kvai.in";
  return `${base}/verify/${code}`;
}

export async function generateQrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(verificationUrl(code), {
    width: 240,
    margin: 1,
    color: { dark: "#14532d", light: "#ffffff" },
  });
}
