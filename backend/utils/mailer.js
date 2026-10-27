import nodemailer from "nodemailer";

const APP_NAME = "CanvasGuard";

// Created on first use so it never reads env vars before dotenv has loaded them
let transporter;
const getTransporter = () => {
  transporter ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
};

const escapeHtml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&#39;", '"': "&quot;" })[c]);

// What each OTP is for, so the email says exactly why it was sent
const OTP_PURPOSES = {
  signup: {
    subject: `Verify your email for ${APP_NAME}`,
    heading: "Verify your email address",
    reason: `You're creating a ${APP_NAME} account with this email address. Enter the code below to confirm it's yours and finish signing up.`,
    ignore: "If you didn't request this, you can safely ignore this email; no account will be created.",
  },
  login: {
    subject: `Verify your email to sign in to ${APP_NAME}`,
    heading: "Finish verifying your account",
    reason: `Someone (hopefully you) tried to sign in to a ${APP_NAME} account whose email address hasn't been verified yet. Enter the code below to verify it and sign in.`,
    ignore: "If this wasn't you, you can ignore this email; nobody can sign in without this code.",
  },
};

const buildOtpEmail = ({ name, otp, purpose, expiresInMinutes }) => {
  const { subject, heading, reason, ignore } = OTP_PURPOSES[purpose];
  const firstName = escapeHtml((name || "").trim().split(/\s+/)[0] || "there");
  const safeName = escapeHtml(name || "there");

  const text = [
    `Hi ${name || "there"},`,
    "",
    reason,
    "",
    `Your verification code: ${otp}`,
    "",
    `This code expires in ${expiresInMinutes} minutes. Never share it with anyone; ${APP_NAME} will never ask you for it.`,
    "",
    ignore,
    "",
    `— The ${APP_NAME} team`,
  ].join("\n");

  // Table layout + inline styles: the only thing email clients render reliably
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <span style="display:none;max-height:0;overflow:hidden;">Your ${APP_NAME} verification code is ${otp}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;">
          <tr><td style="padding:28px 32px 0;">
            <div style="font-size:20px;font-weight:700;color:#0284c7;">${APP_NAME}</div>
          </td></tr>
          <tr><td style="padding:24px 32px 0;">
            <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;">${heading}</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:22px;">Hi ${firstName},</p>
            <p style="margin:0;font-size:15px;line-height:22px;color:#3f3f46;">${reason}</p>
          </td></tr>
          <tr><td align="center" style="padding:24px 32px;">
            <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#71717a;margin-bottom:8px;">Your verification code</div>
            <div style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:10px;padding:14px 22px 14px 32px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;color:#0c4a6e;font-family:'SFMono-Regular',Consolas,monospace;">${otp}</div>
            <div style="font-size:13px;color:#71717a;margin-top:12px;">Expires in ${expiresInMinutes} minutes</div>
          </td></tr>
          <tr><td style="padding:0 32px 28px;">
            <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#52525b;">Never share this code with anyone. ${APP_NAME} will never ask you for it.</p>
            <p style="margin:0;font-size:13px;line-height:20px;color:#52525b;">${ignore}</p>
          </td></tr>
          <tr><td style="padding:16px 32px;border-top:1px solid #e4e4e7;font-size:12px;color:#a1a1aa;">
            Sent to ${safeName} by ${APP_NAME} · Protecting artists and their work
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
};

export const sendOtpEmail = async ({ to, name, otp, purpose = "signup", expiresInMinutes }) => {
  const { subject, text, html } = buildOtpEmail({ name, otp, purpose, expiresInMinutes });
  await getTransporter().sendMail({
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

export { buildOtpEmail };
