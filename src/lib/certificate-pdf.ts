import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { verificationUrl } from "./certificate";

interface CertData {
  recipientName: string;
  courseTitle: string;
  certificateId: string;
  verificationCode: string;
  issuedAt: Date;
}

/** Generate a professional landscape A4 certificate PDF as bytes. */
export async function generateCertificatePdf(data: CertData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]); // A4 landscape (points)
  const { width, height } = page.getSize();

  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);

  const green = rgb(0.082, 0.502, 0.239);
  const dark = rgb(0.06, 0.09, 0.16);
  const grey = rgb(0.4, 0.45, 0.5);

  // Background + borders
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: green, borderWidth: 3 });
  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: rgb(0.8, 0.9, 0.83), borderWidth: 1 });

  const center = (text: string, y: number, font: typeof serif, size: number, color = dark) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  // Header
  center("KVAI LMS", height - 90, serifBold, 26, green);
  center("CERTIFICATE OF COMPLETION", height - 130, sans, 14, grey);

  // Recipient
  center("This is to certify that", height - 200, serif, 16, grey);
  center(data.recipientName, height - 245, serifBold, 34, dark);

  // Line under name
  const nameW = Math.min(420, serifBold.widthOfTextAtSize(data.recipientName, 34) + 80);
  page.drawLine({ start: { x: (width - nameW) / 2, y: height - 258 }, end: { x: (width + nameW) / 2, y: height - 258 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });

  center("has successfully completed the course", height - 295, serif, 16, grey);
  // Course title (wrap if long)
  const title = data.courseTitle.length > 50 ? data.courseTitle.slice(0, 47) + "…" : data.courseTitle;
  center(title, height - 335, serifBold, 22, green);

  // Footer info
  page.drawText(`Certificate ID: ${data.certificateId}`, { x: 70, y: 90, size: 10, font: sans, color: grey });
  page.drawText(`Issued: ${data.issuedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, { x: 70, y: 74, size: 10, font: sans, color: grey });

  // Signatory
  page.drawText("KVAI Solutions", { x: width - 220, y: 90, size: 12, font: serifBold, color: dark });
  page.drawLine({ start: { x: width - 220, y: 86 }, end: { x: width - 80, y: 86 }, thickness: 0.8, color: rgb(0.8, 0.8, 0.8) });
  page.drawText("Authorised Signatory", { x: width - 220, y: 72, size: 9, font: sans, color: grey });

  // QR code
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl(data.verificationCode), { margin: 1, width: 120 });
    const qrImage = await pdf.embedPng(qrDataUrl);
    page.drawImage(qrImage, { x: (width - 70) / 2, y: 60, width: 70, height: 70 });
    center("Scan to verify", 50, sans, 8, grey);
  } catch {
    // ignore QR errors
  }

  return pdf.save();
}
