/**
 * Email service — Resend for transactional emails.
 * Fallback: logs to console when RESEND_API_KEY is not set.
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'RenewFlow <noreply@renewflow.io>';
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

function resetEmailHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:'DM Sans','Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;border:1px solid #E3E8F0;padding:40px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 20c2.5-3 5-5 8-5s5 2 8 2 5.5-2 8-5" stroke="#2563EB" stroke-width="2.8" stroke-linecap="round"/>
            <path d="M4 15c2.5-3 5-5 8-5s5 2 8 2 5.5-2 8-5" stroke="#2563EB" stroke-width="2.8" stroke-linecap="round" opacity="0.6"/>
            <path d="M4 25c2.5-3 5-5 8-5s5 2 8 2 5.5-2 8-5" stroke="#2563EB" stroke-width="2.8" stroke-linecap="round" opacity="0.35"/>
          </svg>
          <span style="font-size:22px;font-weight:700;color:#1E293B;letter-spacing:-0.02em;vertical-align:middle;margin-left:10px;">RenewFlow</span>
        </td></tr>
        <tr><td>
          <h2 style="font-size:18px;font-weight:600;color:#1E293B;margin:0 0 8px;">Reset your password</h2>
          <p style="font-size:14px;color:#64748B;line-height:1.6;margin:0 0 24px;">
            We received a request to reset your password. Click the button below to choose a new one. This link expires in 30 minutes.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
            <a href="${resetLink}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;box-shadow:0 2px 10px rgba(37,99,235,0.25);">
              Reset Password
            </a>
          </td></tr></table>
          <p style="font-size:12px;color:#94A3B8;line-height:1.5;margin:0 0 8px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="font-size:11px;color:#94A3B8;line-height:1.5;margin:0;word-break:break-all;">
            Or copy this link: ${resetLink}
          </p>
        </td></tr>
        <tr><td style="padding-top:24px;border-top:1px solid #E3E8F0;">
          <p style="font-size:11px;color:#94A3B8;text-align:center;margin:0;">
            Warranty renewal management for LATAM IT channel partners
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Quote Email ───

export interface QuoteEmailData {
  quoteId: string;
  date: string;
  clientName: string;
  coverageType: string;
  deviceCount: number;
  totalAmount: number;
  savings: number;
  savingsPct: number;
  items: { brand: string; model: string; coverage: string; price: number }[];
  senderName: string;
  senderEmail: string;
}

function quoteEmailHtml(data: QuoteEmailData): string {
  const rows = data.items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #E3E8F0;font-size:13px;color:#1E293B;">${i.brand} ${i.model}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E3E8F0;font-size:13px;color:#64748B;text-transform:uppercase;">${i.coverage}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E3E8F0;font-size:13px;color:#2563EB;font-weight:600;text-align:right;">$${i.price.toLocaleString()}</td>
    </tr>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:'DM Sans','Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;border:1px solid #E3E8F0;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2563EB,#1D4ED8);border-radius:16px 16px 0 0;padding:28px 32px;">
          <table width="100%"><tr>
            <td>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20c2.5-3 5-5 8-5s5 2 8 2 5.5-2 8-5" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>
                <path d="M4 15c2.5-3 5-5 8-5s5 2 8 2 5.5-2 8-5" stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity="0.6"/>
                <path d="M4 25c2.5-3 5-5 8-5s5 2 8 2 5.5-2 8-5" stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity="0.35"/>
              </svg>
              <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em;vertical-align:middle;margin-left:10px;">RenewFlow</span>
            </td>
            <td style="text-align:right;">
              <div style="font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.05em;">Quote</div>
              <div style="font-size:16px;font-weight:700;color:#fff;">${data.quoteId}</div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px;">
          <p style="font-size:14px;color:#64748B;margin:0 0 6px;">Prepared for</p>
          <h2 style="font-size:20px;font-weight:700;color:#1E293B;margin:0 0 20px;">${data.clientName}</h2>

          <!-- Summary cards -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#F8F9FC;border-radius:10px;padding:14px 16px;width:33%;">
                <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;">Total</div>
                <div style="font-size:22px;font-weight:700;color:#2563EB;">$${data.totalAmount.toLocaleString()}</div>
              </td>
              <td style="width:8px;"></td>
              <td style="background:#F8F9FC;border-radius:10px;padding:14px 16px;width:33%;">
                <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;">Savings</div>
                <div style="font-size:22px;font-weight:700;color:#10B981;">$${data.savings.toLocaleString()}</div>
              </td>
              <td style="width:8px;"></td>
              <td style="background:#F8F9FC;border-radius:10px;padding:14px 16px;width:33%;">
                <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;">Devices</div>
                <div style="font-size:22px;font-weight:700;color:#1E293B;">${data.deviceCount}</div>
              </td>
            </tr>
          </table>

          <!-- Items table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E3E8F0;border-radius:10px;overflow:hidden;">
            <tr style="background:#F1F5F9;">
              <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">Device</th>
              <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">Coverage</th>
              <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">Price</th>
            </tr>
            ${rows}
            <tr style="background:#F1F5F9;">
              <td colspan="2" style="padding:12px;font-size:13px;font-weight:600;color:#1E293B;text-align:right;">Total (${data.coverageType.toUpperCase()})</td>
              <td style="padding:12px;font-size:16px;font-weight:700;color:#2563EB;text-align:right;">$${data.totalAmount.toLocaleString()}</td>
            </tr>
          </table>

          <p style="font-size:12px;color:#94A3B8;margin:20px 0 0;line-height:1.5;">
            This quote is valid for 30 days from ${data.date}. Pricing is subject to vendor availability.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #E3E8F0;background:#F8F9FC;border-radius:0 0 16px 16px;">
          <p style="font-size:12px;color:#64748B;margin:0 0 4px;">
            Sent by <strong>${data.senderName}</strong> via RenewFlow
          </p>
          <p style="font-size:11px;color:#94A3B8;margin:0;">
            Questions? Reply to ${data.senderEmail} &middot; Warranty renewal management for LATAM IT channel partners
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendQuoteEmail(
  recipients: string[],
  data: QuoteEmailData,
): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = [];
  const failed: string[] = [];

  for (const to of recipients) {
    if (!resend) {
      console.log(`[kitz-gateway] 📧 Quote email (no RESEND_API_KEY — console only)`);
      console.log(`  To: ${to}`);
      console.log(`  Quote: ${data.quoteId} for ${data.clientName} — $${data.totalAmount.toLocaleString()}`);
      sent.push(to);
      continue;
    }

    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        replyTo: data.senderEmail,
        subject: `RenewFlow Quote ${data.quoteId} — ${data.clientName} ($${data.totalAmount.toLocaleString()})`,
        html: quoteEmailHtml(data),
      });

      if (error) {
        console.error(`[kitz-gateway] quote_email_failed to=${to}`, error);
        failed.push(to);
      } else {
        console.log(`[kitz-gateway] ✅ Quote email sent to ${to}`);
        sent.push(to);
      }
    } catch (err) {
      console.error(`[kitz-gateway] quote_email_error to=${to}`, (err as Error).message);
      failed.push(to);
    }
  }

  return { sent, failed };
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  const resetLink = `${APP_URL}?reset-token=${token}`;

  if (!resend) {
    console.log(`[kitz-gateway] 📧 Password reset email (no RESEND_API_KEY — console only)`);
    console.log(`  To: ${to}`);
    console.log(`  Reset link: ${resetLink}`);
    console.log(`  Token: ${token}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset your RenewFlow password',
      html: resetEmailHtml(resetLink),
    });

    if (error) {
      console.error('[kitz-gateway] resend_send_failed', error);
      return false;
    }

    console.log(`[kitz-gateway] ✅ Password reset email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('[kitz-gateway] resend_send_error', (err as Error).message);
    return false;
  }
}
