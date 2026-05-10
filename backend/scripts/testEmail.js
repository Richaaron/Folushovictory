import { sendEmail } from "../src/services/email.js";
import dotenv from "dotenv";
dotenv.config();

async function runTest() {
  console.log("Sending test email to: " + process.env.SMTP_USER);
  try {
    await sendEmail({
      to: process.env.SMTP_USER,
      subject: "Test Notification - Folusho Victory Schools",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0B6E4F;">Email System Check</h2>
          <p>This is a test email to confirm that your school portal notification system is correctly configured.</p>
          <p>If you received this, your <b>SMTP settings</b> are correct!</p>
          <hr/>
          <p style="font-size: 12px; color: #666;">Folusho Victory Schools Portal</p>
        </div>
      `
    });
    console.log("✅ Test email sent successfully!");
  } catch (err) {
    console.error("❌ Failed to send test email:");
    console.error(err);
  }
}

runTest();
