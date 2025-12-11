import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class EmailService {
  private readonly logger = new AppLoggerService(EmailService.name);
  private readonly emailMode: string;
  private readonly emailFrom: string;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.emailMode = process.env.EMAIL_MODE || 'console';
    this.emailFrom = process.env.EMAIL_FROM || 'no-reply@example.com';

    // Initialize SMTP transporter if mode is 'smtp' and config is available
    if (this.emailMode === 'smtp') {
      const smtpHost = process.env.EMAIL_SMTP_HOST;
      const smtpPort = process.env.EMAIL_SMTP_PORT
        ? parseInt(process.env.EMAIL_SMTP_PORT, 10)
        : 587;
      const smtpUser = process.env.EMAIL_SMTP_USER;
      const smtpPass = process.env.EMAIL_SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass) {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        this.logger.log('EmailService initialized with SMTP');
      } else {
        this.logger.warn(
          'EMAIL_MODE=smtp but SMTP config is incomplete. Falling back to console mode.',
        );
        this.transporter = null;
      }
    }
  }

  private buildLoginCodeHtml(to: string, code: string): string {
    const appName = 'BuyPhones';
    const supportEmail = 'support@buyphones.kr';
    const frontendUrl = process.env.APP_URL || '#';

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>로그인 인증 코드</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f3f4f6;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:20px 24px 16px 24px;background:linear-gradient(135deg,#111827,#1f2937);">
              <div style="color:#e5e7eb;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">
                ${appName}
              </div>
              <div style="color:#ffffff;font-size:18px;font-weight:600;">
                로그인 인증 코드
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:24px 24px 8px 24px;color:#111827;font-size:14px;line-height:1.6;">
              <p style="margin:0 0 12px 0;">안녕하세요,</p>
              <p style="margin:0 0 16px 0;">
                ${appName} 계정 로그인을 위한 인증 코드입니다.<br />
                아래 코드를 입력하여 로그인을 계속해 주세요.
              </p>

              <!-- Code box -->
              <div style="margin:24px 0;padding:16px 12px;border-radius:10px;background-color:#f9fafb;border:1px solid #e5e7eb;text-align:center;">
                <div style="font-size:12px;color:#6b7280;margin-bottom:6px;letter-spacing:0.12em;text-transform:uppercase;">
                  인증 코드
                </div>
                <div style="font-size:32px;font-weight:700;letter-spacing:0.3em;color:#111827;">
                  ${code}
                </div>
                <div style="font-size:12px;color:#6b7280;margin-top:8px;">
                  이 코드는 발급 시점부터 10분 동안만 유효합니다.
                </div>
              </div>

              <!-- Optional button -->
              <div style="text-align:center;margin:16px 0 8px 0;">
                <a href="${frontendUrl}" 
                   style="display:inline-block;padding:10px 20px;border-radius:999px;background-color:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;">
                  로그인 페이지로 이동
                </a>
              </div>

              <p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;">
                만약 본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.<br />
                다른 사람이 실수로 이메일 주소를 잘못 입력했을 수 있습니다.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px 20px 24px;background-color:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;line-height:1.5;">
              <p style="margin:0 0 4px 0;">
                이 메일은 ${appName} 서비스 이용과 관련된 중요 안내 메일입니다.
              </p>
              <p style="margin:0 0 4px 0;">
                문의 사항이 있으시면 언제든지 <a href="mailto:${supportEmail}" style="color:#6b7280;text-decoration:underline;">${supportEmail}</a> 로 연락 주세요.
              </p>
              <p style="margin:4px 0 0 0;">© ${new Date().getFullYear()} ${appName}, All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  }

  async sendLoginCodeEmail(to: string, code: string): Promise<void> {
    const subject = '로그인 인증 코드';
    const text = `로그인 인증 코드: ${code}\n\n이 코드는 10분 동안만 유효합니다.\n\n만약 본인이 요청하지 않았다면 이 이메일을 무시하세요.`;
    const html = this.buildLoginCodeHtml(to, code);

    if (this.emailMode === 'console' || !this.transporter) {
      this.logger.log(`[LOGIN CODE] ${to}: ${code}`);
      this.logger.warn(
        'Email sending is in console mode. Code logged above. Set EMAIL_MODE=smtp and configure SMTP to send real emails.',
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.emailFrom,
        to,
        subject,
        text,
        html,
      });

      this.logger.log(
        `Login code email sent to ${to} (MessageId: ${info.messageId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send login code email to ${to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[LOGIN CODE] ${to}: ${code} (Email send failed, code logged for dev)`,
        );
      }
    }
  }
}
