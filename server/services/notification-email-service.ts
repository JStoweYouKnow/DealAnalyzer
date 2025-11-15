import { Resend } from 'resend';

// Lazy initialization of Resend client to avoid errors during build
let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  
  return resendInstance;
}

export interface EmailData {
  to: string;
  subject: string;
  type: 'new_deal' | 'analysis_complete' | 'criteria_match' | 'weekly_summary';
  data: any;
}

export async function sendNotificationEmail(emailData: EmailData) {
  const resend = getResendClient();
  
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email send');
    return;
  }

  const template = getTemplate(emailData.type, emailData.data);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const senderEmail = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'The Comfort Finder <onboarding@resend.dev>';

  if (!senderEmail || senderEmail.trim() === '') {
    console.error('RESEND_FROM (or EMAIL_FROM) not configured, skipping email send');
    return;
  }

  try {
    await resend.emails.send({
      from: senderEmail.trim(),
      to: emailData.to,
      subject: emailData.subject,
      html: template.replace(/\$\{APP_URL\}/g, appUrl),
    });
    console.log(`Email sent successfully to ${emailData.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

function getTemplate(type: EmailData['type'], data: any): string {
  switch (type) {
    case 'new_deal':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            ul { list-style: none; padding: 0; }
            li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Deal Alert</h2>
            </div>
            <div class="content">
              <p>A new property deal has been added to your inbox:</p>
              <ul>
                <li><span class="label">Address:</span> ${data.address || 'N/A'}</li>
                <li><span class="label">Price:</span> $${(data.price || 0).toLocaleString()}</li>
              </ul>
              <a href="\${APP_URL}/deals" class="button">View Deal</a>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'criteria_match':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            ul { list-style: none; padding: 0; }
            li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #6b7280; }
            .highlight { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎉 Property Meets Your Criteria!</h2>
            </div>
            <div class="content">
              <p>Great news! A property matches your investment criteria:</p>
              <ul>
                <li><span class="label">Address:</span> ${data.address || 'N/A'}</li>
                <li><span class="label">COC Return:</span> <span class="highlight">${((data.cocReturn || 0) * 100).toFixed(1)}%</span></li>
                <li><span class="label">Cap Rate:</span> <span class="highlight">${((data.capRate || 0) * 100).toFixed(1)}%</span></li>
              </ul>
              <a href="\${APP_URL}/deals/${data.id || ''}" class="button">View Analysis</a>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'analysis_complete':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            ul { list-style: none; padding: 0; }
            li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Analysis Complete</h2>
            </div>
            <div class="content">
              <p>Your property analysis has been completed:</p>
              <ul>
                <li><span class="label">Address:</span> ${data.address || 'N/A'}</li>
                <li><span class="label">Status:</span> ${data.meetsCriteria ? '✅ Meets Criteria' : '❌ Does Not Meet Criteria'}</li>
              </ul>
              <a href="\${APP_URL}/deals/${data.id || ''}" class="button">View Results</a>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'weekly_summary':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8b5cf6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .stat { display: inline-block; padding: 10px 20px; margin: 10px; background-color: white; border-radius: 6px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #8b5cf6; }
            .stat-label { font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Weekly Summary</h2>
            </div>
            <div class="content">
              <p>Here's your weekly activity summary:</p>
              <div class="stat">
                <div class="stat-value">${data.totalAnalyses || 0}</div>
                <div class="stat-label">Analyses</div>
              </div>
              <div class="stat">
                <div class="stat-value">${data.criteriaMatches || 0}</div>
                <div class="stat-label">Matches</div>
              </div>
              <div class="stat">
                <div class="stat-value">${data.newDeals || 0}</div>
                <div class="stat-label">New Deals</div>
              </div>
              <a href="\${APP_URL}/account" class="button">View Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `;

    default:
      return '';
  }
}

