import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

export const isMailConfigured = () => Boolean(config.smtp.host && config.smtp.user);

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.password },
    });
  }
  return transporter;
}

/**
 * Gửi email. Nếu chưa cấu hình SMTP -> in nội dung ra console (chế độ phát triển).
 * @returns {Promise<boolean>} true nếu đã gửi qua SMTP
 */
export async function sendMail({ to, subject, text, html }) {
  if (!isMailConfigured()) {
    console.info(`\n[mail] (SMTP chưa cấu hình) Email tới ${to}\n  Tiêu đề: ${subject}\n  ${text}\n`);
    return false;
  }
  await getTransporter().sendMail({ from: config.smtp.from, to, subject, text, html });
  return true;
}
