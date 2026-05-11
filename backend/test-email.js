import { sendResultReleasedEmail } from './src/services/email.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
  console.log('🚀 Starting Email Test...');
  try {
    const result = await sendResultReleasedEmail({
      parentEmail: 'folushovictoryschool@gmail.com',
      parentName: 'Victory Admin',
      studentName: 'Test Student (Oluwaseun)',
      session: '2026/2027',
      term: '2nd'
    });
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error(error);
  }
}

runTest();
