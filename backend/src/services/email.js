import { Resend } from "resend";
import { SafeDatabase } from "../firestore-utils/index.js";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  const logId = Math.random().toString(36).substring(2, 15);
  const logData = {
    to,
    subject,
    type: "EMAIL",
    status: "PENDING"
  };

  if (!process.env.RESEND_API_KEY) {
    const error = "Resend is not fully configured. Set RESEND_API_KEY environment variable.";
    await SafeDatabase.upsert("logs", logId, { ...logData, status: "FAILED", error });
    throw new Error(error);
  }

  try {
    const emailResponse = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@folushovictory.com",
      to,
      subject,
      html,
    });

    if (emailResponse.error) {
      const error = emailResponse.error.message || "Failed to send email";
      console.error("Error sending email:", error);
      await SafeDatabase.upsert("logs", logId, { ...logData, status: "FAILED", error });
      throw new Error(error);
    }

    console.log("Message sent: %s", emailResponse.data.id);
    await SafeDatabase.upsert("logs", logId, { ...logData, status: "SENT", messageId: emailResponse.data.id });
    return emailResponse.data;
  } catch (error) {
    console.error("Error sending email:", error);
    await SafeDatabase.upsert("logs", logId, { ...logData, status: "FAILED", error: error?.message || String(error) });
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
          <a href="${process.env.FRONTEND_ORIGIN || 'https://folushovictory.netlify.app'}/login" 
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

export const sendTeacherWelcomeEmail = async ({ teacherEmail, teacherName, username, subjectCount = 0, hasFormClass = false }) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #5D3FD3; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Folusho Victory Schools</h1>
      </div>
      <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin-top: 0; color: #5D3FD3;">Welcome to the FVS Teacher Portal, ${teacherName}!</h2>
        <p>Your teacher account has been successfully created. You can now access the academic staff portal to manage your classes, subjects, and results digitally.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase;">Your Login Credentials</p>
          <p style="margin: 10px 0 0; font-size: 16px;"><strong>Username:</strong> <span style="color: #0B6E4F; font-family: monospace;">${username}</span></p>
          <p style="margin: 5px 0; font-size: 14px; color: #64748b;">Your password is the one you created during registration.</p>
        </div>

        <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;">
            <strong>📚 Your Allocations:</strong><br />
            ${subjectCount > 0 ? `✓ <strong>${subjectCount}</strong> subject(s) assigned` : "No subjects assigned"}<br />
            ${hasFormClass ? "✓ Form class assigned" : "No form class assigned"}
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_ORIGIN || 'https://folushovictory.netlify.app'}/login/teacher" 
             style="background-color: #D4AF37; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Access Staff Portal</a>
        </div>

        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #166534;">
            <strong>✓ Quick Setup:</strong> Your subjects and class allocation have been automatically configured. You can start entering results immediately!
          </p>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          💡 <strong>Tip:</strong> You can update your profile and change your password anytime after logging in.
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 12px; text-align: center;">
          If you have any issues accessing the portal or need assistance, please contact the school administration.
        </p>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px;">
          © ${new Date().getFullYear()} Folusho Victory Schools. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: teacherEmail,
    subject: "Welcome to FVS Teacher Portal - Your Account is Ready",
    html
  });
};
