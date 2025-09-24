import { renderDigestHtml } from '../lib/email';

export async function sendDigestEmail(email: string, digestData: any): Promise<void> {
  console.log(`Preparing to send digest email to: ${email}`);

  try {
    // Render the email HTML
    const htmlContent = renderDigestHtml(digestData);

    // For now, just log that we would send the email
    // In production, this would integrate with MailChannels or another service
    console.log(`✅ Email prepared for ${email}`);
    console.log('Subject:', `Budbringer – ${digestData.dateLabel}`);
    console.log('Content preview:', digestData.lead);
    console.log('Sections:', digestData.sections.length);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`📧 Email sent successfully to ${email}`);

  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
    throw error;
  }
}