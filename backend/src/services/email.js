import nodemailer from "nodemailer";
import admin from "firebase-admin";
import { getDb } from "../firebase.js";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  const db = getDb();
  const logRef = db.collection("logs").doc();
  const logData = {
    to,
    subject,
    type: "EMAIL",
    status: "PENDING",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const error = "SMTP is not fully configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.";
    await logRef.set({ ...logData, status: "FAILED", error });
    throw new Error(error);
  }

  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: `"Folusho Victory Schools" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    await logRef.set({ ...logData, status: "SENT", messageId: info.messageId });
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    await logRef.set({ ...logData, status: "FAILED", error: error?.message || String(error) });
    throw error;
  }
};

export const sendResultReleasedEmail = async ({ parentEmail, parentName, studentName, session, term }) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0B6E4F; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Folusho Victory Schools</h1>
      </div>
      <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin-top: 0;">Hello ${parentName || 'Parent'},</h2>
        <p>We are pleased to inform you that the academic result for <strong>${studentName}</strong> for the <strong>${term} Term (${session})</strong> has been released.</p>
        <p>You can now view and download the digital report card from our parent portal.</p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/parent" 
             style="background-color: #D4AF37; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
             View Result Now
          </a>
        </div>
        <p style="font-size: 14px; color: #64748b;">If you have any issues accessing the portal, please contact the school administration.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          © ${new Date().getFullYear()} Folusho Victory Schools. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: parentEmail,
    subject: `Result Released: ${studentName} - ${term} Term`,
    html
  });
};
