import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// APIM endpoint for SendGrid
const APIM_ENDPOINT = 'https://acclaim-api-apim.azure-api.net/sendgrid/v3/mail/send';

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLogoAttachment(): { filename: string; path: string; cid: string } | null {
  const possiblePaths = [
    path.join(__dirname, '../attached_assets/Acclaim rose.Cur_1752271300769.png'),
    path.join(__dirname, '../../attached_assets/Acclaim rose.Cur_1752271300769.png'),
    path.join(process.cwd(), 'attached_assets/Acclaim rose.Cur_1752271300769.png'),
  ];
  
  for (const logoPath of possiblePaths) {
    if (fs.existsSync(logoPath)) {
      return {
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo'
      };
    }
  }
  
  console.log('[Email] Logo file not found, sending email without logo attachment');
  return null;
}

// Get logo as base64 for HTTP API
function getLogoBase64(): { content: string; filename: string; type: string; content_id: string; disposition: string } | null {
  const possiblePaths = [
    path.join(__dirname, '../attached_assets/Acclaim rose.Cur_1752271300769.png'),
    path.join(__dirname, '../../attached_assets/Acclaim rose.Cur_1752271300769.png'),
    path.join(process.cwd(), 'attached_assets/Acclaim rose.Cur_1752271300769.png'),
  ];
  
  for (const logoPath of possiblePaths) {
    if (fs.existsSync(logoPath)) {
      try {
        const fileContent = fs.readFileSync(logoPath);
        return {
          content: fileContent.toString('base64'),
          filename: 'logo.png',
          type: 'image/png',
          content_id: 'logo',
          disposition: 'inline'
        };
      } catch (error) {
        console.log('[Email] Failed to read logo file:', error);
      }
    }
  }
  
  console.log('[Email] Logo file not found for base64 encoding');
  return null;
}

// Get the Portal User Guide PDF as base64 for attaching to welcome emails
function getUserGuideBase64(): { content: string; filename: string; type: string; disposition: string } | null {
  const possiblePaths = [
    path.join(__dirname, '../attached_assets/Acclaim Portal User Guide.pdf'),
    path.join(__dirname, '../../attached_assets/Acclaim Portal User Guide.pdf'),
    path.join(process.cwd(), 'attached_assets/Acclaim Portal User Guide.pdf'),
  ];

  for (const guidePath of possiblePaths) {
    if (fs.existsSync(guidePath)) {
      try {
        const fileContent = fs.readFileSync(guidePath);
        return {
          content: fileContent.toString('base64'),
          filename: 'Acclaim Portal User Guide.pdf',
          type: 'application/pdf',
          disposition: 'attachment'
        };
      } catch (error) {
        console.log('[Email] Failed to read Portal User Guide file:', error);
      }
    }
  }

  console.log('[Email] Portal User Guide file not found for base64 encoding');
  return null;
}

// Helper function to detect video/movie files that should not be attached to emails
function isVideoFile(fileName: string, mimeType?: string): boolean {
  // Check MIME type first if available
  if (mimeType) {
    if (mimeType.startsWith('video/')) {
      return true;
    }
  }
  
  // Check file extension
  const videoExtensions = [
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', 
    '.m4v', '.mpg', '.mpeg', '.3gp', '.3g2', '.ogv', '.ts', 
    '.mts', '.m2ts', '.vob', '.divx', '.xvid', '.rm', '.rmvb',
    '.asf', '.swf', '.f4v'
  ];
  
  const lowerFileName = fileName.toLowerCase();
  return videoExtensions.some(ext => lowerFileName.endsWith(ext));
}

interface EmailNotificationData {
  userEmail: string;
  userName: string;
  messageSubject?: string;
  messageContent: string;
  caseReference?: string;
  organisationName: string;
  caseDetails?: {
    caseName: string;
    debtorType: string;
    originalAmount: string;
    outstandingAmount: string;
    status: string;
    stage: string;
    assignedTo?: string | null;
  };
  attachment?: {
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  };
  copyRecipients?: Array<{ name: string; reason: 'reply' | 'name-mention' }>;
}

interface AdminToUserNotificationData {
  adminName: string;
  adminEmail: string;
  userEmail: string;
  userName: string;
  messageSubject?: string;
  messageContent: string;
  caseReference?: string;
  organisationName: string;
  caseDetails?: {
    caseName: string;
    debtorType: string;
    originalAmount: string;
    outstandingAmount: string;
    status: string;
    stage: string;
  };
  attachment?: {
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  };
}

interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  firstName: string;
  lastName: string;
  username: string;
  temporaryPassword?: string;
  organisationName: string;
  adminName: string;
  portalUrl?: string;
  isAdmin?: boolean;
}

interface TemporaryPasswordEmailData {
  userEmail: string;
  firstName: string;
  temporaryPassword: string;
}

interface ExternalMessageNotificationData {
  userEmail: string;
  userName: string;
  messageSubject: string;
  messageContent: string;
  caseReference?: string;
  organisationName: string;
  senderName: string;
  messageType: string;
  caseDetails?: {
    caseName: string;
    debtorType: string;
    originalAmount: string;
    outstandingAmount: string;
    status: string;
    stage: string;
  };
}

interface CaseSubmissionNotificationData {
  userEmail: string;
  userName: string;
  firstName: string;
  lastName: string;
  organisationName: string;
  submissionId: number;
  caseSubmission: {
    caseName: string;
    debtorType: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    creditorName?: string;
    
    // Organisation specific fields
    organisationName?: string;
    organisationTradingName?: string;
    companyNumber?: string;
    
    // Individual/Sole Trader specific fields
    individualType?: string;
    tradingName?: string;
    principalSalutation?: string;
    principalFirstName?: string;
    principalLastName?: string;
    
    // Address
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    county?: string;
    postcode?: string;
    
    // Contact details
    mainPhone?: string;
    altPhone?: string;
    mainEmail?: string;
    altEmail?: string;
    
    // Debt details
    totalDebtAmount: string;
    currency: string;
    debtDetails?: string;
    
    // Payment terms
    paymentTermsType?: string;
    paymentTermsDays?: number;
    paymentTermsOther?: string;
    
    // Invoice details
    singleInvoice?: string;
    firstOverdueDate?: string;
    lastOverdueDate?: string;
    
    additionalInfo?: string;
    submittedAt: Date;
  };
  uploadedFiles?: Array<{
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  }>;
}

interface DocumentUploadNotificationData {
  uploaderName: string;
  uploaderEmail: string;
  organisationName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath?: string;
  caseReference?: string;
  caseName?: string;
  uploadedAt: Date;
}

interface LoginNotificationData {
  userEmail: string;
  userName: string;
  loginTime: Date;
  ipAddress: string;
  userAgent: string;
  loginMethod: 'password' | 'azure_sso' | 'otp';
}

class SendGridEmailService {
  private initialized = false;

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    if (process.env.APIM_SUBSCRIPTION_KEY || process.env.SENDGRID_API_KEY) {
      this.initialized = true;
      if (process.env.APIM_SUBSCRIPTION_KEY) {
        console.log('✅ SendGrid Email Service: REAL email delivery enabled via Azure APIM');
        console.log('📧 Emails will be delivered to actual inboxes through APIM');
      } else {
        console.log('✅ SendGrid Email Service: REAL email delivery enabled via SendGrid API directly');
        console.log('📧 Emails will be delivered to actual inboxes through SendGrid');
      }
    } else {
      this.initialized = false;
      console.log('❌ Neither APIM_SUBSCRIPTION_KEY nor SENDGRID_API_KEY found - emails will not be sent');
    }
  }

  // Send email via Azure APIM to SendGrid HTTP API
  private async sendViaAPIM(payload: {
    to: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    subject: string;
    textContent?: string;
    htmlContent?: string;
    text?: string;
    html?: string;
    attachLogo?: boolean;
    attachments?: Array<{
      content: string;
      filename: string;
      type: string;
      disposition?: string;
      content_id?: string;
    }>;
  }): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - email not sent');
      return false;
    }

    if (!payload.to || !payload.to.includes('@')) {
      console.error(`❌ Invalid recipient email address: "${payload.to}" — email not sent`);
      return false;
    }

    try {
      const textContent = payload.textContent || payload.text || '';
      const htmlContent = payload.htmlContent || payload.html || '';
      
      const personalization: any = {
        to: [{ email: payload.to }]
      };
      
      // Add CC recipients if provided
      if (payload.cc && payload.cc.length > 0) {
        personalization.cc = payload.cc.map(email => ({ email }));
      }

      // Add BCC recipients if provided
      if (payload.bcc && payload.bcc.length > 0) {
        personalization.bcc = payload.bcc.map(email => ({ email }));
      }
      
      const emailPayload: any = {
        personalizations: [personalization],
        from: {
          email: 'email@acclaim.law',
          name: 'Acclaim Credit Management & Recovery'
        },
        subject: payload.subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent }
        ]
      };

      if (payload.replyTo) {
        emailPayload.reply_to = { email: payload.replyTo };
      }

      // Add attachments if present
      const attachments = [...(payload.attachments || [])];
      
      // Add logo if requested
      if (payload.attachLogo) {
        const logoBase64 = getLogoBase64();
        if (logoBase64) {
          attachments.push(logoBase64);
        }
      }
      
      if (attachments.length > 0) {
        emailPayload.attachments = attachments;
      }
      
      // Log BCC info for debugging
      if (payload.bcc && payload.bcc.length > 0) {
        console.log(`📧 Sending email with ${payload.bcc.length} BCC recipient(s)`);
      }

      // Try APIM first (Azure-hosted environments)
      if (process.env.APIM_SUBSCRIPTION_KEY) {
        try {
          console.log(`📤 Sending email via APIM to: ${payload.to} | Subject: ${payload.subject}`);
          const apimResponse = await fetch(APIM_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY
            },
            body: JSON.stringify(emailPayload)
          });

          const apimResponseText = await apimResponse.text();
          console.log(`📬 APIM response: status=${apimResponse.status} ok=${apimResponse.ok} body=${apimResponseText.substring(0, 200)}`);

          if (apimResponse.ok || apimResponse.status === 202) {
            console.log(`✅ EMAIL SENT via Azure APIM to: ${payload.to}`);
            return true;
          }
          console.warn(`⚠️ APIM returned ${apimResponse.status} — falling back to direct SendGrid API`);
        } catch (apimError) {
          console.warn(`⚠️ APIM unreachable (${(apimError as any)?.cause?.code || apimError}) — falling back to direct SendGrid API`);
        }
      }

      // Fall back to direct SendGrid API (Replit dev environment or APIM unavailable)
      if (process.env.SENDGRID_API_KEY) {
        console.log(`📤 Sending email via SendGrid API directly to: ${payload.to} | Subject: ${payload.subject}`);
        const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
          },
          body: JSON.stringify(emailPayload)
        });

        const sgResponseText = await sgResponse.text();
        console.log(`📬 SendGrid API response: status=${sgResponse.status} ok=${sgResponse.ok} body=${sgResponseText.substring(0, 200)}`);

        if (sgResponse.ok || sgResponse.status === 202) {
          console.log(`✅ EMAIL SENT via SendGrid API directly to: ${payload.to}`);
          return true;
        } else {
          console.error(`❌ SendGrid API failed with status ${sgResponse.status}: ${sgResponseText}`);
          return false;
        }
      }

      console.error('❌ No working email transport available (APIM unreachable, no SENDGRID_API_KEY)');
      return false;
    } catch (error) {
      console.error('❌ Email sending failed (unhandled exception):', error);
      return false;
    }
  }

  async sendExternalMessageNotification(data: ExternalMessageNotificationData): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - email not sent');
      return false;
    }

    try {
      const caseName = data.caseDetails?.caseName;
      const caseLabel = caseName
        ? (data.caseReference ? `${caseName} (${data.caseReference})` : caseName)
        : (data.caseReference || '');

      const subject = caseLabel
        ? `${caseLabel} – ${data.messageType}: ${data.messageSubject}`
        : `${data.messageType}: ${data.messageSubject} - Acclaim Portal`;

      const caseHeaderHtml = (caseName || data.caseReference)
        ? `<div style="margin: 18px auto 0 auto; display: inline-block; background: rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 22px;">
                        <p style="margin: 0; color: rgba(255,255,255,0.75); font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px;">Case</p>
                        <p style="margin: 4px 0 0 0; color: #ffffff; font-size: 18px; font-weight: 700;">${caseName ? caseName : data.caseReference}${caseName && data.caseReference ? ` <span style="font-weight: 400; font-size: 14px; color: rgba(255,255,255,0.8);">(${data.caseReference})</span>` : ''}</p>
                      </div>`
        : '';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Case Update</h1>
                      ${caseHeaderHtml}
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Update Type Badge -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="display: inline-block; background-color: #e0f2f1; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); color: #00695c; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          ${data.messageType}
                        </span>
                      </div>
                      
                      <!-- Info Card -->
                      <div style="background: #f8fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #008b8b;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 120px;">Organisation</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.organisationName}</td>
                          </tr>
                          ${data.caseReference ? `
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Case Ref</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.caseReference}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Subject</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.messageSubject}</td>
                          </tr>
                        </table>
                      </div>
                      
                      ${data.caseDetails ? `
                      <!-- Case Details Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600; display: flex; align-items: center;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px;"></span>
                          Case Details
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 140px;">Case Name</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${data.caseDetails.caseName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Debtor Type</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Original Amount</td>
                            <td style="padding: 8px 0; color: #1e293b;">£${data.caseDetails.originalAmount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Outstanding</td>
                            <td style="padding: 8px 0; color: #008b8b; font-weight: 700; font-size: 16px;">£${data.caseDetails.outstandingAmount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Status</td>
                            <td style="padding: 8px 0;">
                              <span style="display: inline-block; background: ${data.caseDetails.status === 'active' ? '#dcfce7' : '#fef3c7'}; color: ${data.caseDetails.status === 'active' ? '#166534' : '#a16207'}; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 600;">
                                ${data.caseDetails.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Stage</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                          </tr>
                        </table>
                      </div>
                      ` : ''}
                      
                      <!-- Message Content -->
                      <div style="background: #fafbfc; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 600;">Message</h3>
                        <div style="color: #475569; line-height: 1.7; font-size: 14px; white-space: pre-wrap;">${data.messageContent.replace(/\r\n/g, '\n').replace(/\n/g, '<br>')}</div>
                      </div>
                      
                      <!-- CTA Button -->
                      <div style="text-align: center;">
                        <a href="https://acclaim-api-prod-uks-001.azurewebsites.net/auth" style="display: inline-block; background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(0,139,139,0.3);">
                          View in Portal →
                        </a>
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; margin-bottom: 0;">Please do not reply to this email — to respond, log in to the portal using the button above.</p>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated notification from the Acclaim Client Portal</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
New case update from Acclaim

Organisation: ${data.organisationName}
${data.caseReference ? `Case Reference: ${data.caseReference}` : ''}
${data.caseDetails ? `
CASE DETAILS:
- Case Name: ${data.caseDetails.caseName}
- Debtor Type: ${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}
- Original Amount: £${data.caseDetails.originalAmount}
- Outstanding Amount: £${data.caseDetails.outstandingAmount}
- Status: ${data.caseDetails.status.toUpperCase()}
- Current Stage: ${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
` : ''}
Update Type: ${data.messageType.toUpperCase()}
Subject: ${data.messageSubject}

Message:
${data.messageContent}

Please log in to the Acclaim Portal to view and respond to this message.
Portal: https://acclaim-api-prod-uks-001.azurewebsites.net/auth
      `;

      // Prepare attachments for APIM
      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      return await this.sendViaAPIM({
        to: data.userEmail,
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
    } catch (error) {
      console.error('❌ SendGrid email sending failed:', error);
      return false;
    }
  }

  async sendMessageNotification(data: EmailNotificationData, adminEmail: string): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - email not sent');
      return false;
    }

    try {
      const subject = data.caseReference 
        ? data.messageSubject 
          ? `New Message: ${data.messageSubject} [${data.caseReference}] - Acclaim Portal`
          : `New Message Received [${data.caseReference}] - Acclaim Portal`
        : data.messageSubject 
          ? `New Message: ${data.messageSubject} - Acclaim Portal`
          : 'New Message Received - Acclaim Portal';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">New Message</h1>
                      ${data.caseReference ? `<p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Case: ${data.caseReference}</p>` : ''}
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Email Type Badge -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="display: inline-block; background-color: #e0f2f1; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); color: #00695c; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          User Message
                        </span>
                      </div>

                      ${data.caseDetails?.assignedTo && data.caseDetails.assignedTo !== 'Not assigned' ? `
                      <!-- Case Handler Responsibility Notice -->
                      <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
                        <p style="margin: 0 0 8px 0; font-weight: 700; color: #92400e; font-size: 14px;">⚠️ Case Handler Responsibility Notice</p>
                        <p style="margin: 0 0 6px 0; color: #78350f; font-size: 13px; line-height: 1.6;"><strong>${data.caseDetails.assignedTo}</strong> is recorded as the Case Handler for this matter and is primarily responsible for actioning this message.</p>
                        ${(data.copyRecipients && data.copyRecipients.length > 0) ? data.copyRecipients.map(r => {
                          const reasonText = r.reason === 'reply'
                            ? `because the client replied to a message previously sent by <strong>${r.name}</strong>`
                            : `because the client addressed <strong>${r.name}</strong> by name in the opening of their message`;
                          return `<p style="margin: 6px 0 0 0; color: #78350f; font-size: 13px; line-height: 1.6;">A copy of this notification has also been sent to <strong>${r.name}</strong> ${reasonText}. It remains your responsibility as Case Handler to ensure this message is actioned — please liaise with <strong>${r.name}</strong> accordingly.</p>`;
                        }).join('') : `<p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.6;">No other team members have directly received this notification — it is your responsibility to either action this message yourself or distribute it accordingly if necessary.</p>`}
                      </div>
                      ` : ''}

                      <!-- Sender Info Card -->
                      <div style="background: #f8fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #008b8b;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 120px;">From</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.userName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Email</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${data.userEmail}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Organisation</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.organisationName}</td>
                          </tr>
                          ${data.caseReference ? `
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Case Ref</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.caseReference}</td>
                          </tr>
                          ` : ''}
                          ${data.messageSubject ? `
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Subject</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.messageSubject}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>
                      
                      ${data.caseDetails ? `
                      <!-- Case Details Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Case Details
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 140px;">Case Name</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${data.caseDetails.caseName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Debtor Type</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Original Amount</td>
                            <td style="padding: 8px 0; color: #1e293b;">£${data.caseDetails.originalAmount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Outstanding</td>
                            <td style="padding: 8px 0; color: #008b8b; font-weight: 700; font-size: 16px;">£${data.caseDetails.outstandingAmount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Status</td>
                            <td style="padding: 8px 0;">
                              <span style="display: inline-block; background: ${data.caseDetails.status === 'active' ? '#dcfce7' : '#fef3c7'}; color: ${data.caseDetails.status === 'active' ? '#166534' : '#a16207'}; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 600;">
                                ${data.caseDetails.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Stage</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                          </tr>
                          ${data.caseDetails.assignedTo ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Case Handler</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseDetails.assignedTo}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>
                      ` : ''}
                      
                      <!-- Message Content -->
                      <div style="background: #fafbfc; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 600;">Message</h3>
                        <div style="color: #475569; line-height: 1.7; font-size: 14px; white-space: pre-wrap;">${data.messageContent.replace(/\r\n/g, '\n').replace(/\n/g, '<br>')}</div>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated notification from the Acclaim Client Portal</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
New message from ${data.userName} (${data.userEmail})
Organisation: ${data.organisationName}
${data.caseReference ? `Case Reference: ${data.caseReference}` : ''}
${data.caseDetails ? `
CASE DETAILS:
- Case Name: ${data.caseDetails.caseName}
- Debtor Type: ${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}
- Original Amount: £${data.caseDetails.originalAmount}
- Outstanding Amount: £${data.caseDetails.outstandingAmount}
- Status: ${data.caseDetails.status.toUpperCase()}
- Current Stage: ${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}${data.caseDetails.assignedTo ? `
- Case Handler: ${data.caseDetails.assignedTo}` : ''}
` : ''}
${data.messageSubject ? `Subject: ${data.messageSubject}` : ''}

Message:
${data.messageContent}

Please log in to the Acclaim Portal to view and respond to this message.
      `;

      // Prepare attachments for APIM
      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      // Add user attachment if present (convert to base64) - skip video files
      if (data.attachment && data.attachment.filePath) {
        if (isVideoFile(data.attachment.fileName, data.attachment.fileType)) {
          console.log(`📎 Skipping video attachment in email (too large): ${data.attachment.fileName}`);
        } else {
          try {
            const fileContent = fs.readFileSync(data.attachment.filePath);
            attachments.push({
              content: fileContent.toString('base64'),
              filename: data.attachment.fileName,
              type: data.attachment.fileType || 'application/octet-stream',
              disposition: 'attachment'
            });
          } catch (error) {
            console.error('Failed to read attachment file:', error);
          }
        }
      }

      // Always CC email@acclaim.law so the whole team's shared inbox is visibly
      // copied on every user message, even when the primary recipient is a
      // specific case handler. This guards against a case handler being off or a
      // colleague having quietly taken over without the assignment being updated.
      const DEFAULT_INBOX = 'email@acclaim.law';
      const ccList = adminEmail.toLowerCase() !== DEFAULT_INBOX ? [DEFAULT_INBOX] : [];
      console.log(`[sendMessageNotification] TO=${adminEmail} CC=${ccList.join(',') || '(none — primary IS default)'}`);

      return await this.sendViaAPIM({
        to: adminEmail,
        cc: ccList.length > 0 ? ccList : undefined,
        replyTo: 'noreply@acclaim.law',
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
    } catch (error) {
      console.error('❌ Failed to send user-to-admin email via SendGrid:', error);
      return false;
    }
  }

  async sendCopyNotification(data: {
    type: 'reply' | 'name-mention';
    recipientName: string;
    caseHandlerName: string;
    userEmail: string;
    userName: string;
    messageContent: string;
    caseReference?: string;
    organisationName: string;
    caseDetails?: {
      caseName: string;
      debtorType: string;
      originalAmount: string;
      outstandingAmount: string;
      status: string;
      stage: string;
      assignedTo?: string | null;
    };
    mentionedAs?: string;
  }, recipientEmail: string): Promise<boolean> {
    if (!this.initialized) return false;
    try {
      const isReply = data.type === 'reply';
      const reasonText = isReply
        ? `A client replied directly to a message you sent, but <strong>${data.caseHandlerName}</strong> is recorded as the Case Handler for this matter — not you.`
        : `A client has addressed you by name (<em>"${data.mentionedAs || data.recipientName}"</em>) in a message, but <strong>${data.caseHandlerName}</strong> is recorded as the Case Handler for this matter — not you.`;

      const actionText = `Please liaise with the Case Handler (<strong>${data.caseHandlerName}</strong>) to ensure this message is properly actioned. Do not assume the Case Handler is already aware.`;

      const subject = data.caseReference
        ? `⚠️ Copy: User Message [${data.caseReference}] — Action Required`
        : `⚠️ Copy: User Message — Action Required`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#d97706 0%,#b45309 100%);padding:32px 40px;text-align:center;">
                      <img src="cid:logo" alt="Acclaim" style="height:32px;width:auto;margin-bottom:12px;" />
                      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Copy Notification — Action Required</h1>
                      ${data.caseReference ? `<p style="margin:6px 0 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Case: ${data.caseReference}</p>` : ''}
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:32px 40px;">
                      <p style="margin:0 0 4px 0;color:#1e293b;font-size:15px;">Dear ${data.recipientName},</p>

                      <!-- Why you're receiving this -->
                      <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:10px;padding:16px 20px;margin:20px 0;">
                        <p style="margin:0 0 8px 0;font-weight:700;color:#92400e;font-size:13px;">Why you have received this copy</p>
                        <p style="margin:0 0 8px 0;color:#78350f;font-size:13px;line-height:1.7;">${reasonText}</p>
                        <p style="margin:0;color:#78350f;font-size:13px;line-height:1.7;">${actionText}</p>
                      </div>

                      <!-- Sender Info -->
                      <div style="background:#f8fafb;border-radius:10px;padding:20px;margin-bottom:20px;border-left:4px solid #d97706;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;">
                          <tr><td style="padding:5px 0;color:#64748b;width:120px;">From (client)</td><td style="padding:5px 0;color:#1e293b;font-weight:500;">${data.userName}</td></tr>
                          <tr><td style="padding:5px 0;color:#64748b;">Email</td><td style="padding:5px 0;color:#1e293b;">${data.userEmail}</td></tr>
                          <tr><td style="padding:5px 0;color:#64748b;">Organisation</td><td style="padding:5px 0;color:#1e293b;">${data.organisationName}</td></tr>
                          ${data.caseReference ? `<tr><td style="padding:5px 0;color:#64748b;">Case Ref</td><td style="padding:5px 0;color:#1e293b;font-weight:500;">${data.caseReference}</td></tr>` : ''}
                          <tr><td style="padding:5px 0;color:#64748b;">Case Handler</td><td style="padding:5px 0;color:#1e293b;font-weight:600;">${data.caseHandlerName}</td></tr>
                        </table>
                      </div>

                      ${data.caseDetails ? `
                      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:20px;">
                        <p style="margin:0 0 12px 0;color:#0f172a;font-size:13px;font-weight:700;">Case Details</p>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;">
                          <tr><td style="padding:5px 0;color:#64748b;width:120px;">Case Name</td><td style="padding:5px 0;color:#1e293b;font-weight:500;">${data.caseDetails.caseName}</td></tr>
                          <tr><td style="padding:5px 0;color:#64748b;">Outstanding</td><td style="padding:5px 0;color:#008b8b;font-weight:700;">£${data.caseDetails.outstandingAmount}</td></tr>
                          <tr><td style="padding:5px 0;color:#64748b;">Status / Stage</td><td style="padding:5px 0;color:#1e293b;">${data.caseDetails.status.toUpperCase()} — ${data.caseDetails.stage.replace('_',' ')}</td></tr>
                        </table>
                      </div>
                      ` : ''}

                      <!-- Message Content -->
                      <div style="background:#fafbfc;border-radius:10px;padding:20px;">
                        <p style="margin:0 0 10px 0;color:#0f172a;font-size:13px;font-weight:700;">Message Content</p>
                        <div style="color:#475569;line-height:1.7;font-size:13px;white-space:pre-wrap;">${data.messageContent.replace(/\r\n/g,'\n').replace(/\n/g,'<br>')}</div>
                      </div>

                      <p style="margin:20px 0 0 0;color:#94a3b8;font-size:12px;">You are receiving this copy automatically as a safeguard. Please do not reply to this email — log in to the Acclaim Portal to respond.</p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#1f2937;padding:20px 40px;text-align:center;border-radius:0 0 12px 12px;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">Automated safeguard notification — Acclaim Client Portal</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>`;

      const textContent = `Copy Notification — Action Required\n\nDear ${data.recipientName},\n\n${isReply ? `A client replied to a message you sent, but ${data.caseHandlerName} is the Case Handler — not you.` : `A client addressed you by name ("${data.mentionedAs || data.recipientName}") but ${data.caseHandlerName} is the Case Handler.`}\n\nPlease liaise with ${data.caseHandlerName} to ensure this message is actioned.\n\nFrom: ${data.userName} (${data.userEmail})\nOrganisation: ${data.organisationName}\n${data.caseReference ? `Case Ref: ${data.caseReference}\n` : ''}Case Handler: ${data.caseHandlerName}\n\nMessage:\n${data.messageContent}`;

      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) attachments.push(logoBase64);

      return await this.sendViaAPIM({ to: recipientEmail, subject, textContent, htmlContent, attachments });
    } catch (error) {
      console.error('❌ Failed to send copy notification email:', error);
      return false;
    }
  }

  async sendSuperAdminGrantedNotification(data: {
    firstName: string;
    userName: string;
    userEmail: string;
    grantedByName: string;
  }): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - email not sent');
      return false;
    }

    try {
      const subject = 'You have been granted Super Admin access - Acclaim Portal';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color: #7c3aed; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 40px 40px 32px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 32px; width: auto; margin-bottom: 20px;" />
                      <!-- Purple shield badge -->
                      <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 16px auto;">
                        <tr>
                          <td style="width: 72px; height: 72px; background: rgba(255,255,255,0.15); border-radius: 50%; text-align: center; vertical-align: middle;">
                            <span style="font-size: 36px; line-height: 72px;">&#128737;</span>
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Super Admin Access Granted</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Acclaim Client Portal</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">

                      <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">Hi ${escapeHtml(data.firstName)},</p>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.7;">
                        Your account has been upgraded to <strong style="color: #6d28d9;">Super Admin</strong> on the Acclaim Client Portal by ${escapeHtml(data.grantedByName)}. This is the highest level of access in the portal, so we wanted to let you know exactly what it gives you &mdash; and which actions to treat with care.
                      </p>

                      <!-- What you can now do -->
                      <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #5b21b6; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #7c3aed; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          What you can now do
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #475569; line-height: 1.6;">
                          <tr><td style="padding: 6px 0;">&#10003;&nbsp; Delete users, organisations, case submissions, messages and documents</td></tr>
                          <tr><td style="padding: 6px 0;">&#10003;&nbsp; Change the organisation a case is linked to</td></tr>
                          <tr><td style="padding: 6px 0;">&#10003;&nbsp; Manage scheduled email reports (create, edit, delete and test-send)</td></tr>
                          <tr><td style="padding: 6px 0;">&#10003;&nbsp; Access Audit Management and the full system audit logs</td></tr>
                          <tr><td style="padding: 6px 0;">&#10003;&nbsp; Grant or remove super admin access for other &#64;chadlaw.co.uk colleagues</td></tr>
                        </table>
                      </div>

                      <!-- Use with care -->
                      <div style="background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px 0; color: #b91c1c; font-size: 15px; font-weight: 600;">
                          &#9888;&nbsp; Please use with care &mdash; some actions cannot be undone
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #7f1d1d; line-height: 1.6;">
                          <tr><td style="padding: 6px 0;">&bull;&nbsp; Deleting a user, organisation, case, message or document is <strong>permanent</strong> and cannot be reversed.</td></tr>
                          <tr><td style="padding: 6px 0;">&bull;&nbsp; Moving a case to another organisation changes who can see that case and all of its documents and payments.</td></tr>
                          <tr><td style="padding: 6px 0;">&bull;&nbsp; Removing someone's access takes effect immediately.</td></tr>
                        </table>
                        <p style="margin: 14px 0 0 0; color: #7f1d1d; font-size: 13px; line-height: 1.6;">When in doubt, pause before deleting &mdash; there is no &ldquo;undo&rdquo; for these actions.</p>
                      </div>

                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.7;">
                        If you weren&rsquo;t expecting this change, please contact your administrator straight away.
                      </p>

                      <!-- CTA -->
                      <div style="text-align: center;">
                        <a href="https://acclaim-api-prod-uks-001.azurewebsites.net/auth" style="display: inline-block; background-color: #7c3aed; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(124,58,237,0.3);">Open the Portal</a>
                      </div>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated notification from the Acclaim Client Portal</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
Hi ${data.firstName},

Your account has been upgraded to SUPER ADMIN on the Acclaim Client Portal by ${data.grantedByName}. This is the highest level of access in the portal.

WHAT YOU CAN NOW DO:
- Delete users, organisations, case submissions, messages and documents
- Change the organisation a case is linked to
- Manage scheduled email reports (create, edit, delete and test-send)
- Access Audit Management and the full system audit logs
- Grant or remove super admin access for other @chadlaw.co.uk colleagues

PLEASE USE WITH CARE - SOME ACTIONS CANNOT BE UNDONE:
- Deleting a user, organisation, case, message or document is permanent and cannot be reversed.
- Moving a case to another organisation changes who can see that case and all of its documents and payments.
- Removing someone's access takes effect immediately.

When in doubt, pause before deleting - there is no "undo" for these actions.

If you weren't expecting this change, please contact your administrator straight away.

Open the portal: https://acclaim-api-prod-uks-001.azurewebsites.net/auth
      `;

      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      return await this.sendViaAPIM({
        to: data.userEmail,
        subject,
        textContent,
        htmlContent,
        attachments,
      });
    } catch (error) {
      console.error('❌ Failed to send super admin granted email via SendGrid:', error);
      return false;
    }
  }

  async sendAdminToUserNotification(data: AdminToUserNotificationData): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - email not sent');
      return false;
    }

    try {
      const caseName = data.caseDetails?.caseName;
      const caseLabel = caseName
        ? (data.caseReference ? `${caseName} (${data.caseReference})` : caseName)
        : (data.caseReference || '');

      const subject = caseLabel
        ? (data.messageSubject
            ? `${caseLabel} – Message from Acclaim: ${data.messageSubject}`
            : `${caseLabel} – New Message from Acclaim`)
        : (data.messageSubject
            ? `Message from Acclaim: ${data.messageSubject} - Acclaim Portal`
            : 'New Message from Acclaim - Acclaim Portal');

      const caseHeaderHtml = (caseName || data.caseReference)
        ? `<div style="margin: 18px auto 0 auto; display: inline-block; background: rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 22px;">
                        <p style="margin: 0; color: rgba(255,255,255,0.75); font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px;">Case</p>
                        <p style="margin: 4px 0 0 0; color: #ffffff; font-size: 18px; font-weight: 700;">${caseName ? caseName : data.caseReference}${caseName && data.caseReference ? ` <span style="font-weight: 400; font-size: 14px; color: rgba(255,255,255,0.8);">(${data.caseReference})</span>` : ''}</p>
                      </div>`
        : '';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Message from Acclaim</h1>
                      ${caseHeaderHtml}
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Email Type Badge -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="display: inline-block; background-color: #e0f2f1; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); color: #00695c; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Admin Message
                        </span>
                      </div>
                      
                      <!-- Info Card -->
                      <div style="background: #f8fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #008b8b;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          ${data.caseReference ? `
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 120px;">Case</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.caseDetails?.caseName ? `${data.caseDetails.caseName} (${data.caseReference})` : data.caseReference}</td>
                          </tr>
                          ` : ''}
                          ${data.messageSubject ? `
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Subject</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.messageSubject}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>
                      
                      ${data.caseDetails ? `
                      <!-- Case Details Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Case Details
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 140px;">Case Name</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${data.caseDetails.caseName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Outstanding</td>
                            <td style="padding: 8px 0; color: #008b8b; font-weight: 700; font-size: 16px;">£${data.caseDetails.outstandingAmount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Status</td>
                            <td style="padding: 8px 0;">
                              <span style="display: inline-block; background: ${data.caseDetails.status === 'active' ? '#dcfce7' : '#fef3c7'}; color: ${data.caseDetails.status === 'active' ? '#166534' : '#a16207'}; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 600;">
                                ${data.caseDetails.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </div>
                      ` : ''}
                      
                      <!-- Message Content -->
                      <div style="background: #fafbfc; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 600;">Message</h3>
                        <div style="color: #475569; line-height: 1.7; font-size: 14px; white-space: pre-wrap;">${data.messageContent.replace(/\r\n/g, '\n').replace(/\n/g, '<br>')}</div>
                      </div>
                      
                      <!-- CTA Button -->
                      <div style="text-align: center;">
                        <a href="https://acclaim-api-prod-uks-001.azurewebsites.net/auth" style="display: inline-block; background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(0,139,139,0.3);">
                          View in Portal →
                        </a>
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; margin-bottom: 0;">Please do not reply to this email — to respond, log in to the portal using the button above.</p>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated notification from the Acclaim Client Portal</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
Message from Acclaim
${data.caseReference ? `Case: ${data.caseDetails?.caseName ? `${data.caseDetails.caseName} (${data.caseReference})` : data.caseReference}` : ''}
${data.messageSubject ? `Subject: ${data.messageSubject}` : ''}

Message:
${data.messageContent}

Please log in to the Acclaim Portal to view this message and respond if needed.
Portal: https://acclaim-api-prod-uks-001.azurewebsites.net/auth
      `;

      // Prepare attachments for APIM
      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      // Add user attachment if present (convert to base64) - skip video files
      if (data.attachment && data.attachment.filePath) {
        if (isVideoFile(data.attachment.fileName, data.attachment.fileType)) {
          console.log(`📎 Skipping video attachment in admin-to-user email (too large): ${data.attachment.fileName}`);
        } else {
          try {
            const fileContent = fs.readFileSync(data.attachment.filePath);
            attachments.push({
              content: fileContent.toString('base64'),
              filename: data.attachment.fileName,
              type: data.attachment.fileType || 'application/octet-stream',
              disposition: 'attachment'
            });
            console.log(`📎 Including attachment in admin-to-user email: ${data.attachment.fileName}`);
          } catch (error) {
            console.error('Failed to read attachment file for admin-to-user email:', error);
          }
        }
      }

      return await this.sendViaAPIM({
        to: data.userEmail,
        replyTo: 'noreply@acclaim.law',
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
    } catch (error) {
      console.error('❌ Failed to send admin-to-user email via SendGrid:', error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - welcome email not sent');
      return false;
    }

    try {
      const portalUrl = data.portalUrl || 'https://acclaim-api-prod-uks-001.azurewebsites.net/auth';
      const subject = `Welcome to the Acclaim Credit Management & Recovery Portal!`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Welcome to Acclaim</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Your account is ready</p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Email Type Badge -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="display: inline-block; background-color: #e0f2f1; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); color: #00695c; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          New Account
                        </span>
                      </div>
                      
                      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Hello ${data.firstName},</p>
                      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Welcome to the Acclaim Credit Management & Recovery Portal! Your account has been created and you can now access the system to view and manage your cases.</p>
                      
                      <!-- Username Card -->
                      <div style="background: #f8fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #008b8b;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 100px;">Username</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500; font-family: monospace;">${data.userEmail}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- CTA Button -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        ${data.isAdmin ? `
                        <a href="${portalUrl}" style="display: inline-block; background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(0,139,139,0.3);">
                          Access the Portal →
                        </a>
                        ` : `
                        <a href="${portalUrl}" style="display: inline-block; background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(0,139,139,0.3);">
                          Access the Portal →
                        </a>
                        `}
                      </div>
                      
                      <!-- Features Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          What you can do
                        </h3>
                        <ul style="color: #475569; line-height: 2; padding-left: 20px; margin: 0; font-size: 14px;">
                          <li>View and track your cases</li>
                          <li>Send and receive messages with our team</li>
                          <li>Access and download case documents</li>
                          <li>Track payment history</li>
                        </ul>
                      </div>

                      <!-- Sign-in steps -->
                      <div style="background: #e0f7f6; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                        ${data.isAdmin ? `
                        <p style="color: #00695c; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">How to sign in:</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                          <tr>
                            <td style="padding: 6px 0; vertical-align: top;">
                              <span style="display: inline-block; width: 22px; height: 22px; background: #008b8b; color: #fff; border-radius: 50%; text-align: center; font-size: 12px; font-weight: 700; line-height: 22px; margin-right: 10px;">1</span>
                              <span style="color: #00695c; font-size: 13px;">Click <strong>Access the Portal</strong> above.</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; vertical-align: top;">
                              <span style="display: inline-block; width: 22px; height: 22px; background: #008b8b; color: #fff; border-radius: 50%; text-align: center; font-size: 12px; font-weight: 700; line-height: 22px; margin-right: 10px;">2</span>
                              <span style="color: #00695c; font-size: 13px;">Click <strong>"Sign in with Microsoft"</strong> and sign in with your usual Microsoft password (and MFA if required).</span>
                            </td>
                          </tr>
                        </table>
                        ` : `
                        <p style="color: #00695c; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">How to access the portal:</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                          <tr>
                            <td style="padding: 6px 0; vertical-align: top;">
                              <span style="display: inline-block; width: 22px; height: 22px; background: #008b8b; color: #fff; border-radius: 50%; text-align: center; font-size: 12px; font-weight: 700; line-height: 22px; margin-right: 10px;">1</span>
                              <span style="color: #00695c; font-size: 13px;">Look out for a separate email from <strong>Microsoft</strong> (invitations@microsoft.com) — this is your invitation to access the portal.</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; vertical-align: top;">
                              <span style="display: inline-block; width: 22px; height: 22px; background: #008b8b; color: #fff; border-radius: 50%; text-align: center; font-size: 12px; font-weight: 700; line-height: 22px; margin-right: 10px;">2</span>
                              <span style="color: #00695c; font-size: 13px;">Open the Microsoft email and click <strong>Accept invitation</strong>. You will not be able to sign in until this step is completed.</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; vertical-align: top;">
                              <span style="display: inline-block; width: 22px; height: 22px; background: #008b8b; color: #fff; border-radius: 50%; text-align: center; font-size: 12px; font-weight: 700; line-height: 22px; margin-right: 10px;">3</span>
                              <span style="color: #00695c; font-size: 13px;">Once accepted, click <strong>Access the Portal</strong> above and sign in using the <strong>Sign in with Microsoft</strong> button.</span>
                            </td>
                          </tr>
                        </table>
                        `}
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated notification from the Acclaim Client Portal</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
Welcome to the Acclaim Credit Management & Recovery Portal!

Hello ${data.firstName},

Welcome to the Acclaim Credit Management & Recovery Portal! Your account has been created and you can now access the system to view and manage your cases.

${data.isAdmin ? `Access the portal here: ${portalUrl}

How to sign in:

1. Click the link above to visit the portal.
2. Click "Sign in with Microsoft" and sign in with your usual Microsoft password (and MFA if required).` : `Getting started — it only takes a minute:

1. Look out for a separate email from Microsoft (invitations@microsoft.com) — this is your invitation to access the portal.
2. Open the Microsoft email and click Accept invitation. You will not be able to sign in until this step is completed.
3. Once accepted, visit the portal here: ${portalUrl} and sign in using the Sign in with Microsoft button.`}

What you can do in the portal:
- View and track your cases
- Send and receive messages with our team
- Access and download case documents
- Track payment history

If you have any questions, please contact our support team.
      `;

      // Prepare attachments for APIM
      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      // Attach the Portal User Guide PDF so new users receive it with their welcome email
      // (not included for admin users)
      if (!data.isAdmin) {
        const userGuideBase64 = getUserGuideBase64();
        if (userGuideBase64) {
          attachments.push(userGuideBase64);
        }
      }

      return await this.sendViaAPIM({
        to: data.userEmail,
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
    } catch (error) {
      console.error('❌ Failed to send welcome email via SendGrid:', error);
      return false;
    }
  }

  async sendTemporaryPasswordEmail(data: TemporaryPasswordEmailData): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - temporary password email not sent');
      return false;
    }

    try {
      const subject = `Your Temporary Password - Acclaim Portal`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Your Temporary Password</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Email Type Badge -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="display: inline-block; background-color: #e0f2f1; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); color: #00695c; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Account Setup
                        </span>
                      </div>
                      
                      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Hello ${data.firstName},</p>
                      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Here is your temporary password to access the Acclaim Portal:</p>
                      
                      <!-- Password Display -->
                      <div style="background: #f8fafb; border-radius: 12px; padding: 30px; margin-bottom: 24px; text-align: center;">
                        <p style="color: #64748b; margin: 0 0 12px 0; font-size: 13px;">Your temporary password:</p>
                        <div style="font-size: 28px; font-weight: bold; color: #008b8b; font-family: monospace; letter-spacing: 3px; background: white; padding: 20px; border-radius: 8px; border: 2px solid #008b8b;">${data.temporaryPassword}</div>
                      </div>

                      <!-- Warning Card -->
                      <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                          <strong>Important:</strong> This is a temporary password. You will be required to change it when you first log in.
                        </p>
                      </div>
                      
                      <!-- Steps Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Getting Started
                        </h3>
                        <ol style="color: #475569; line-height: 2; padding-left: 20px; margin: 0; font-size: 14px;">
                          <li>Go to the Acclaim Portal login page</li>
                          <li>Enter your email address as your username</li>
                          <li>Enter this temporary password</li>
                          <li>You will be prompted to create a new secure password</li>
                        </ol>
                      </div>

                      <!-- Security Tip -->
                      <div style="background: #fef2f2; border-radius: 12px; padding: 20px;">
                        <p style="color: #dc2626; margin: 0; font-size: 14px; line-height: 1.6;">
                          <strong>Security Tip:</strong> Please delete this email after you have logged in and changed your password.
                        </p>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated notification from the Acclaim Client Portal</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
Your Temporary Password - Acclaim Portal

Hello ${data.firstName},

Here is your temporary password to access the Acclaim Credit Management & Recovery Portal:

Temporary Password: ${data.temporaryPassword}

IMPORTANT SECURITY NOTICE:
This is a temporary password. You will be required to change it when you first log in for security purposes.

Getting Started:
1. Go to the Acclaim Portal login page
2. Enter your email address as your username
3. Enter this temporary password
4. You will be prompted to create a new secure password

Security Tip: Please delete this email after you have logged in and changed your password.

If you have any questions, please contact our support team.
      `;

      // Prepare attachments for APIM
      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      return await this.sendViaAPIM({
        to: data.userEmail,
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
    } catch (error) {
      console.error('❌ Failed to send temporary password email via SendGrid:', error);
      return false;
    }
  }

  async sendPasswordResetOTP(data: { userEmail: string; userName: string; otp: string; expiresInMinutes: number }): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - password reset email not sent');
      return false;
    }

    try {
      const subject = `Your Password Reset Code - Acclaim Portal`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Password Reset</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Email Type Badge -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="display: inline-block; background-color: #e0f2f1; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); color: #00695c; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Security
                        </span>
                      </div>
                      
                      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Hello ${data.userName},</p>
                      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">We received a request to reset your password. Use the code below to complete the process:</p>
                      
                      <!-- OTP Code Display -->
                      <div style="background: #f8fafb; border-radius: 12px; padding: 30px; margin-bottom: 24px; text-align: center;">
                        <p style="color: #64748b; margin: 0 0 12px 0; font-size: 13px;">Your one-time code:</p>
                        <div style="font-size: 36px; font-weight: bold; color: #008b8b; font-family: monospace; letter-spacing: 8px; background: white; padding: 20px; border-radius: 8px; border: 2px solid #008b8b;">${data.otp}</div>
                        <p style="color: #94a3b8; margin: 16px 0 0 0; font-size: 13px;">
                          Expires in ${data.expiresInMinutes} minutes
                        </p>
                      </div>

                      <!-- Warning Card -->
                      <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                          <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
                        </p>
                      </div>
                      
                      <!-- Steps Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          How to Reset
                        </h3>
                        <ol style="color: #475569; line-height: 2; padding-left: 20px; margin: 0; font-size: 14px;">
                          <li>Enter this one-time code on the reset page</li>
                          <li>Click "Login with Code"</li>
                          <li>Create your new password</li>
                        </ol>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated notification from the Acclaim Client Portal</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
Password Reset Request - Acclaim Portal

Hello ${data.userName},

We received a request to reset your password for the Acclaim Credit Management & Recovery Portal.

Your one-time password is: ${data.otp}

This code expires in ${data.expiresInMinutes} minutes.

How to Reset Your Password:
1. Go to the login page
2. Click "Forgot Password"
3. Enter your email and click "Send Code" (already done)
4. Enter this one-time code and click "Login with Code"
5. You'll be prompted to create a new password

Security Notice: If you didn't request this password reset, please ignore this email. Your account remains secure.

Need help? Contact us at email@acclaim.law
      `;

      // Prepare attachments for APIM
      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      return await this.sendViaAPIM({
        to: data.userEmail,
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
    } catch (error) {
      console.error('❌ Failed to send password reset OTP email via SendGrid:', error);
      return false;
    }
  }

  private async generateCaseSubmissionExcel(data: CaseSubmissionNotificationData): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Case Submission Details');

    // Set up headers with styling
    worksheet.columns = [
      { header: 'Field', key: 'field', width: 30 },
      { header: 'Value', key: 'value', width: 50 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF14b8a6' }
    };

    // Build submission data array with all populated fields
    const submissionData: Array<{ field: string; value: string }> = [];
    
    // Basic Information
    submissionData.push(
      { field: 'Submission ID', value: data.submissionId.toString() },
      { field: 'Submitted At', value: data.caseSubmission.submittedAt.toLocaleString('en-GB') }
    );
    
    // Submitter Information
    submissionData.push(
      { field: '', value: '' },
      { field: '=== SUBMITTER INFORMATION ===', value: '' }
    );
    if (data.userName) submissionData.push({ field: 'Submitted By', value: data.userName });
    if (data.userEmail) submissionData.push({ field: 'Submitted By Email', value: data.userEmail });
    if (data.organisationName) submissionData.push({ field: 'Organisation', value: data.organisationName });
    
    // Client Details
    submissionData.push(
      { field: '', value: '' },
      { field: '=== CLIENT DETAILS ===', value: '' }
    );
    if (data.caseSubmission.clientName) submissionData.push({ field: 'Client Name', value: data.caseSubmission.clientName });
    if (data.caseSubmission.clientEmail) submissionData.push({ field: 'Client Email', value: data.caseSubmission.clientEmail });
    if (data.caseSubmission.clientPhone) submissionData.push({ field: 'Client Phone', value: data.caseSubmission.clientPhone });
    if (data.caseSubmission.creditorName) submissionData.push({ field: 'Creditor Name', value: data.caseSubmission.creditorName });
    
    // Debtor Information
    submissionData.push(
      { field: '', value: '' },
      { field: '=== DEBTOR INFORMATION ===', value: '' }
    );
    submissionData.push({ field: 'Case Name', value: data.caseSubmission.caseName });
    submissionData.push({ field: 'Debtor Type', value: data.caseSubmission.debtorType });
    
    if (data.caseSubmission.debtorType === 'organisation') {
      if (data.caseSubmission.organisationName) submissionData.push({ field: 'Organisation Name', value: data.caseSubmission.organisationName });
      if (data.caseSubmission.organisationTradingName) submissionData.push({ field: 'Trading Name', value: data.caseSubmission.organisationTradingName });
      if (data.caseSubmission.companyNumber) submissionData.push({ field: 'Company Number', value: data.caseSubmission.companyNumber });
    } else {
      if (data.caseSubmission.individualType) submissionData.push({ field: 'Individual Type', value: data.caseSubmission.individualType });
      if (data.caseSubmission.tradingName) submissionData.push({ field: 'Trading Name', value: data.caseSubmission.tradingName });
      if (data.caseSubmission.principalSalutation) submissionData.push({ field: 'Principal Salutation', value: data.caseSubmission.principalSalutation });
      if (data.caseSubmission.principalFirstName) submissionData.push({ field: 'Principal First Name', value: data.caseSubmission.principalFirstName });
      if (data.caseSubmission.principalLastName) submissionData.push({ field: 'Principal Last Name', value: data.caseSubmission.principalLastName });
    }
    
    // Address
    if (data.caseSubmission.addressLine1) {
      submissionData.push(
        { field: '', value: '' },
        { field: '=== ADDRESS ===', value: '' }
      );
      if (data.caseSubmission.addressLine1) submissionData.push({ field: 'Address Line 1', value: data.caseSubmission.addressLine1 });
      if (data.caseSubmission.addressLine2) submissionData.push({ field: 'Address Line 2', value: data.caseSubmission.addressLine2 });
      if (data.caseSubmission.city) submissionData.push({ field: 'City', value: data.caseSubmission.city });
      if (data.caseSubmission.county) submissionData.push({ field: 'County', value: data.caseSubmission.county });
      if (data.caseSubmission.postcode) submissionData.push({ field: 'Postcode', value: data.caseSubmission.postcode });
    }
    
    // Contact Details
    const hasContact = data.caseSubmission.mainPhone || data.caseSubmission.altPhone || 
                      data.caseSubmission.mainEmail || data.caseSubmission.altEmail;
    if (hasContact) {
      submissionData.push(
        { field: '', value: '' },
        { field: '=== CONTACT DETAILS ===', value: '' }
      );
      if (data.caseSubmission.mainPhone) submissionData.push({ field: 'Main Phone', value: data.caseSubmission.mainPhone });
      if (data.caseSubmission.altPhone) submissionData.push({ field: 'Alternative Phone', value: data.caseSubmission.altPhone });
      if (data.caseSubmission.mainEmail) submissionData.push({ field: 'Main Email', value: data.caseSubmission.mainEmail });
      if (data.caseSubmission.altEmail) submissionData.push({ field: 'Alternative Email', value: data.caseSubmission.altEmail });
    }
    
    // Debt Details
    submissionData.push(
      { field: '', value: '' },
      { field: '=== DEBT DETAILS ===', value: '' }
    );
    submissionData.push({ field: 'Total Debt Amount', value: `${data.caseSubmission.currency || 'GBP'} ${data.caseSubmission.totalDebtAmount}` });
    if (data.caseSubmission.debtDetails) submissionData.push({ field: 'Debt Description', value: data.caseSubmission.debtDetails });
    
    // Payment Terms
    if (data.caseSubmission.paymentTermsType) {
      submissionData.push(
        { field: '', value: '' },
        { field: '=== PAYMENT TERMS ===', value: '' }
      );
      submissionData.push({ field: 'Payment Terms Type', value: data.caseSubmission.paymentTermsType });
      if (data.caseSubmission.paymentTermsDays) submissionData.push({ field: 'Payment Terms Days', value: data.caseSubmission.paymentTermsDays.toString() });
      if (data.caseSubmission.paymentTermsOther) submissionData.push({ field: 'Other Payment Terms', value: data.caseSubmission.paymentTermsOther });
    }
    
    // Invoice Details
    if (data.caseSubmission.singleInvoice || data.caseSubmission.firstOverdueDate || data.caseSubmission.lastOverdueDate) {
      submissionData.push(
        { field: '', value: '' },
        { field: '=== INVOICE DETAILS ===', value: '' }
      );
      if (data.caseSubmission.singleInvoice) submissionData.push({ field: 'Single Invoice', value: data.caseSubmission.singleInvoice === 'yes' ? 'Yes' : 'No' });
      if (data.caseSubmission.firstOverdueDate) submissionData.push({ field: 'First Overdue Date', value: data.caseSubmission.firstOverdueDate });
      if (data.caseSubmission.lastOverdueDate) submissionData.push({ field: 'Last Overdue Date', value: data.caseSubmission.lastOverdueDate });
    }
    
    // Additional Information
    if (data.caseSubmission.additionalInfo) {
      submissionData.push(
        { field: '', value: '' },
        { field: '=== ADDITIONAL INFORMATION ===', value: '' }
      );
      submissionData.push({ field: 'Additional Notes', value: data.caseSubmission.additionalInfo });
    }

    worksheet.addRows(submissionData);

    // Add uploaded files section if there are any
    if (data.uploadedFiles && data.uploadedFiles.length > 0) {
      worksheet.addRow({ field: '', value: '' });
      worksheet.addRow({ field: '=== UPLOADED FILES ===', value: '' });
      worksheet.getRow(worksheet.rowCount).font = { bold: true };
      
      data.uploadedFiles.forEach((file, index) => {
        worksheet.addRow({ field: `File ${index + 1}`, value: file.fileName });
        worksheet.addRow({ field: `  Size`, value: `${(file.fileSize / 1024).toFixed(2)} KB` });
        worksheet.addRow({ field: `  Type`, value: file.fileType });
      });
    }

    // Save to OS temp directory — guaranteed writable on every platform (Azure, Replit, etc.)
    const fileName = `case-submission-${data.submissionId}-${Date.now()}.xlsx`;
    const filePath = path.join(os.tmpdir(), fileName);
    
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  async sendCaseSubmissionNotification(data: CaseSubmissionNotificationData): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - case submission email not sent');
      return false;
    }

    try {
      // Build the debtor label for the subject line
      let debtorLabel = '';
      const cs = data.caseSubmission;
      if (cs.debtorType === 'organisation') {
        const orgName = cs.organisationName || 'Unknown';
        debtorLabel = cs.organisationTradingName
          ? `${orgName} t/a ${cs.organisationTradingName}`
          : orgName;
      } else {
        // individual or sole trader
        const fullName = [cs.principalFirstName, cs.principalLastName].filter(Boolean).join(' ') || 'Unknown';
        debtorLabel = cs.individualType === 'business' && cs.tradingName
          ? `${fullName} t/a ${cs.tradingName}`
          : fullName;
      }
      const subject = `New Case Submission #${data.submissionId} - ${data.organisationName} -v- ${debtorLabel}`;

      // Generate Excel file
      const excelFilePath = await this.generateCaseSubmissionExcel(data);

      // Build dynamic HTML sections based on populated fields
      let debtorDetailsHtml = '';
      if (data.caseSubmission.debtorType === 'organisation') {
        debtorDetailsHtml = `
          ${data.caseSubmission.organisationName ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 180px;">Organisation Name:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.organisationName}</td>
          </tr>` : ''}
          ${data.caseSubmission.organisationTradingName ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Trading Name:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.organisationTradingName}</td>
          </tr>` : ''}
          ${data.caseSubmission.companyNumber ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company Number:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.companyNumber}</td>
          </tr>` : ''}
        `;
      } else {
        debtorDetailsHtml = `
          ${data.caseSubmission.individualType ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 180px;">Individual Type:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.individualType === 'individual' ? 'Individual' : 'Sole Trader/Business'}</td>
          </tr>` : ''}
          ${data.caseSubmission.tradingName ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Trading Name:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.tradingName}</td>
          </tr>` : ''}
          ${data.caseSubmission.principalSalutation || data.caseSubmission.principalFirstName || data.caseSubmission.principalLastName ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Principal Name:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.principalSalutation || ''} ${data.caseSubmission.principalFirstName || ''} ${data.caseSubmission.principalLastName || ''}`.trim() + `</td>
          </tr>` : ''}
        `;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">New Case Submission</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Submission ID: #${data.submissionId}</p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Email Type Badge -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="display: inline-block; background-color: #e0f2f1; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); color: #00695c; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          New Case
                        </span>
                      </div>
                      
                      <!-- Submitter Info Card -->
                      <div style="background: #f8fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #008b8b;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 120px;">Submitted By</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.firstName} ${data.lastName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Email</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${data.userEmail}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Organisation</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.organisationName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Submitted</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${data.caseSubmission.submittedAt.toLocaleString('en-GB')}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- Client Details Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Client Details
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 140px;">Client Name</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${data.caseSubmission.clientName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Client Email</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.clientEmail}</td>
                          </tr>
                          ${data.caseSubmission.clientPhone ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Client Phone</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.clientPhone}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.creditorName ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Creditor Name</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.creditorName}</td>
                          </tr>` : ''}
                        </table>
                      </div>

                      <!-- Debtor Information Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Debtor Information
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 140px;">Case Name</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${data.caseSubmission.caseName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Debtor Type</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.debtorType === 'individual' ? 'Individual/Sole Trader' : 'Organisation'}</td>
                          </tr>
                          ${debtorDetailsHtml}
                        </table>
                      </div>

                      <!-- Address Card -->
                      ${data.caseSubmission.addressLine1 ? `
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Address
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          ${data.caseSubmission.addressLine1 ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 140px;">Address Line 1</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.addressLine1}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.addressLine2 ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Address Line 2</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.addressLine2}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.city ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">City</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.city}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.county ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">County</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.county}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.postcode ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Postcode</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.postcode}</td>
                          </tr>` : ''}
                        </table>
                      </div>` : ''}

                      <!-- Contact Details Card -->
                      ${data.caseSubmission.mainPhone || data.caseSubmission.altPhone || data.caseSubmission.mainEmail || data.caseSubmission.altEmail ? `
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Contact Details
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          ${data.caseSubmission.mainPhone ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 140px;">Main Phone</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.mainPhone}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.altPhone ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Alt Phone</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.altPhone}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.mainEmail ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Main Email</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.mainEmail}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.altEmail ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Alt Email</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.altEmail}</td>
                          </tr>` : ''}
                        </table>
                      </div>` : ''}

                      <!-- Debt Details Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Debt Details
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 140px;">Total Amount</td>
                            <td style="padding: 8px 0; color: #008b8b; font-weight: 700; font-size: 18px;">${data.caseSubmission.currency || 'GBP'} ${data.caseSubmission.totalDebtAmount}</td>
                          </tr>
                        </table>
                        ${data.caseSubmission.debtDetails ? `
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                          <p style="color: #64748b; margin: 0 0 8px 0; font-size: 13px;">Debt Description:</p>
                          <p style="color: #1e293b; margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${data.caseSubmission.debtDetails}</p>
                        </div>` : ''}
                      </div>

                      <!-- Payment Terms Card -->
                      ${data.caseSubmission.paymentTermsType ? `
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Payment Terms
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 140px;">Terms Type</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.paymentTermsType.replace(/_/g, ' ')}</td>
                          </tr>
                          ${data.caseSubmission.paymentTermsDays ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Terms Days</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.paymentTermsDays}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.paymentTermsOther ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Other Terms</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.paymentTermsOther}</td>
                          </tr>` : ''}
                        </table>
                      </div>` : ''}

                      <!-- Invoice Details Card -->
                      ${data.caseSubmission.singleInvoice || data.caseSubmission.firstOverdueDate || data.caseSubmission.lastOverdueDate ? `
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Invoice Details
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          ${data.caseSubmission.singleInvoice ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 140px;">Single Invoice</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.singleInvoice === 'yes' ? 'Yes' : 'No'}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.firstOverdueDate ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">First Overdue</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.firstOverdueDate}</td>
                          </tr>` : ''}
                          ${data.caseSubmission.lastOverdueDate ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Last Overdue</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.caseSubmission.lastOverdueDate}</td>
                          </tr>` : ''}
                        </table>
                      </div>` : ''}

                      <!-- Additional Information Card -->
                      ${data.caseSubmission.additionalInfo ? `
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Additional Information
                        </h3>
                        <p style="color: #475569; margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${data.caseSubmission.additionalInfo}</p>
                      </div>` : ''}

                      <!-- Uploaded Files Card -->
                      ${data.uploadedFiles && data.uploadedFiles.length > 0 ? `
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Uploaded Files (${data.uploadedFiles.length})
                        </h3>
                        <ul style="color: #475569; margin: 0; padding-left: 20px; font-size: 14px;">
                          ${data.uploadedFiles.map(file => `
                            <li style="margin-bottom: 8px;">
                              <strong style="color: #1e293b;">${file.fileName}</strong> 
                              <span style="color: #64748b;">(${(file.fileSize / 1024).toFixed(2)} KB)</span>
                            </li>
                          `).join('')}
                        </ul>
                        <p style="color: #64748b; font-size: 13px; margin: 16px 0 0 0;">All uploaded files are attached to this email.</p>
                      </div>` : ''}

                      <!-- Attachments Note -->
                      <div style="background: #e0f7f6; border-radius: 12px; padding: 20px;">
                        <p style="color: #00695c; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Attachments included with this email:</p>
                        <ul style="color: #00695c; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                          <li><strong>Excel spreadsheet</strong> — all case fields in a structured workbook</li>
                          <li><strong>HTML summary</strong> — a printable, styled case details page you can open in any browser</li>
                          ${data.uploadedFiles && data.uploadedFiles.length > 0 ? `<li><strong>Uploaded documents</strong> — ${data.uploadedFiles.length} file${data.uploadedFiles.length !== 1 ? 's' : ''} submitted with the case</li>` : ''}
                        </ul>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated notification from the Acclaim Client Portal</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
New Case Submission #${data.submissionId}

Case Details:
- Case Name: ${data.caseSubmission.caseName}
- Debtor Type: ${data.caseSubmission.debtorType}
- Total Amount: ${data.caseSubmission.currency || 'GBP'} ${data.caseSubmission.totalDebtAmount}
- Client Name: ${data.caseSubmission.clientName}
- Client Email: ${data.caseSubmission.clientEmail}
${data.caseSubmission.clientPhone ? `- Client Phone: ${data.caseSubmission.clientPhone}` : ''}

Submitted By:
- Name: ${data.firstName} ${data.lastName} (${data.userName})
- Email: ${data.userEmail}
- Organisation: ${data.organisationName}
- Submitted: ${data.caseSubmission.submittedAt.toLocaleString('en-GB')}

${data.caseSubmission.debtDetails ? `Debt Details:\n${data.caseSubmission.debtDetails}\n\n` : ''}
${data.caseSubmission.additionalInfo ? `Additional Information:\n${data.caseSubmission.additionalInfo}\n\n` : ''}
${data.uploadedFiles && data.uploadedFiles.length > 0 ? `Uploaded Files:\n${data.uploadedFiles.map(f => `- ${f.fileName} (${(f.fileSize / 1024).toFixed(2)} KB)`).join('\n')}\n\n` : ''}

A detailed Excel spreadsheet and all uploaded files are attached to this email.
      `;

      // Prepare attachments for APIM (convert to base64)
      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      
      // Add logo
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }
      
      // Add Excel file then clean up the temp file
      try {
        const excelContent = fs.readFileSync(excelFilePath);
        attachments.push({
          content: excelContent.toString('base64'),
          filename: `case-submission-${data.submissionId}.xlsx`,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          disposition: 'attachment'
        });
        try { fs.unlinkSync(excelFilePath); } catch { /* best-effort cleanup */ }
      } catch (error) {
        console.error('Failed to read Excel file:', error);
      }

      // Add HTML summary attachment (printable case details view)
      try {
        attachments.push({
          content: Buffer.from(htmlContent.trim()).toString('base64'),
          filename: `case-submission-${data.submissionId}-details.html`,
          type: 'text/html',
          disposition: 'attachment'
        });
      } catch (error) {
        console.error('Failed to attach HTML summary:', error);
      }

      // Add uploaded files to attachments - skip video files
      if (data.uploadedFiles && data.uploadedFiles.length > 0) {
        data.uploadedFiles.forEach(file => {
          if (isVideoFile(file.fileName, file.fileType)) {
            console.log(`📎 Skipping video attachment in case submission email (too large): ${file.fileName}`);
          } else {
            try {
              const fileContent = fs.readFileSync(file.filePath);
              attachments.push({
                content: fileContent.toString('base64'),
                filename: file.fileName,
                type: file.fileType || 'application/octet-stream',
                disposition: 'attachment'
              });
            } catch (error) {
              console.error(`Failed to read attachment file ${file.fileName}:`, error);
            }
          }
        });
      }

      const result = await this.sendViaAPIM({
        to: 'email@acclaim.law',
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
      
      // Clean up the temporary Excel file
      try {
        fs.unlinkSync(excelFilePath);
      } catch (error) {
        console.error('Warning: Failed to delete temporary Excel file:', error);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to send case submission notification via SendGrid:', error);
      return false;
    }
  }

  // Send document upload notification to admin (when user uploads)
  async sendDocumentUploadNotificationToAdmin(data: DocumentUploadNotificationData, adminEmail: string): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - document upload notification not sent');
      return false;
    }

    try {
      const subject = data.caseReference 
        ? `New Document Uploaded [${data.caseReference}] - Acclaim Portal`
        : `New Document Uploaded - ${data.organisationName} - Acclaim Portal`;

      const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Document Uploaded</h1>
                      ${data.caseReference ? `<p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Case: ${data.caseReference}</p>` : ''}
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Email Type Badge -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="display: inline-block; background-color: #e0f2f1; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); color: #00695c; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Document
                        </span>
                      </div>
                      
                      <!-- Uploader Info Card -->
                      <div style="background: #f8fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #008b8b;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 120px;">Uploaded By</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.uploaderName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Email</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${data.uploaderEmail}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Organisation</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.organisationName}</td>
                          </tr>
                          ${data.caseName ? `
                          <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Case Name</td>
                            <td style="padding: 6px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${data.caseName}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>
                      
                      <!-- Document Details Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Document Details
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 100px;">File Name</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${data.fileName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">File Size</td>
                            <td style="padding: 8px 0; color: #1e293b;">${formatFileSize(data.fileSize)}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">File Type</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.fileType}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Uploaded</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.uploadedAt.toLocaleString('en-GB')}</td>
                          </tr>
                        </table>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated notification from the Acclaim Client Portal</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
New Document Uploaded

Uploaded By: ${data.uploaderName} (${data.uploaderEmail})
Organisation: ${data.organisationName}
${data.caseReference ? `Case Reference: ${data.caseReference}` : ''}
${data.caseName ? `Case Name: ${data.caseName}` : ''}
File Name: ${data.fileName}
File Size: ${formatFileSize(data.fileSize)}
File Type: ${data.fileType}
Uploaded: ${data.uploadedAt.toLocaleString('en-GB')}

Please log in to the Acclaim Portal to view this document.
      `;

      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      // Attach the uploaded document if file path is provided - skip video files
      if (data.filePath && fs.existsSync(data.filePath)) {
        if (isVideoFile(data.fileName, data.fileType)) {
          console.log(`[Email] Skipping video attachment (too large): ${data.fileName}`);
        } else {
          try {
            const fileContent = fs.readFileSync(data.filePath);
            const base64Content = fileContent.toString('base64');
            attachments.push({
              content: base64Content,
              filename: data.fileName,
              type: data.fileType || 'application/octet-stream',
              disposition: 'attachment'
            });
            console.log(`[Email] Attached document: ${data.fileName}`);
          } catch (attachError) {
            console.error(`[Email] Failed to attach document: ${attachError}`);
          }
        }
      }

      return await this.sendViaAPIM({
        to: adminEmail,
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
    } catch (error) {
      console.error('❌ Failed to send document upload notification to admin:', error);
      return false;
    }
  }

  // Send document upload notification to user (when admin uploads)
  async sendDocumentUploadNotificationToUser(data: DocumentUploadNotificationData, userEmail: string): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - document upload notification not sent');
      return false;
    }

    try {
      const caseLabel = data.caseName
        ? (data.caseReference ? `${data.caseName} (${data.caseReference})` : data.caseName)
        : (data.caseReference || '');

      const subject = caseLabel
        ? `${caseLabel} – New Document Available`
        : `New Document Available - Acclaim Portal`;

      const caseHeaderHtml = (data.caseName || data.caseReference)
        ? `<div style="margin: 18px auto 0 auto; display: inline-block; background: rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 22px;">
                        <p style="margin: 0; color: rgba(255,255,255,0.75); font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px;">Case</p>
                        <p style="margin: 4px 0 0 0; color: #ffffff; font-size: 18px; font-weight: 700;">${data.caseName ? data.caseName : data.caseReference}${data.caseName && data.caseReference ? ` <span style="font-weight: 400; font-size: 14px; color: rgba(255,255,255,0.8);">(${data.caseReference})</span>` : ''}</p>
                      </div>`
        : '';

      const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">New Document Available</h1>
                      ${caseHeaderHtml}
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      
                      <!-- Email Type Badge -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="display: inline-block; background-color: #e0f2f1; background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%); color: #00695c; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Document
                        </span>
                      </div>
                      
                      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">A new document has been added to your portal and is ready for you to view.</p>
                      
                      <!-- Document Details Card -->
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                          <span style="display: inline-block; width: 4px; height: 16px; background: #008b8b; border-radius: 2px; margin-right: 10px; vertical-align: middle;"></span>
                          Document Details
                        </h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                          ${data.caseName ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 100px;">Case Name</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${data.caseName}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 100px;">File Name</td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${data.fileName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">File Size</td>
                            <td style="padding: 8px 0; color: #1e293b;">${formatFileSize(data.fileSize)}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Uploaded</td>
                            <td style="padding: 8px 0; color: #1e293b;">${data.uploadedAt.toLocaleString('en-GB')}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- CTA Button -->
                      <div style="text-align: center;">
                        <a href="https://acclaim-api-prod-uks-001.azurewebsites.net/auth" style="display: inline-block; background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(0,139,139,0.3);">
                          View in Portal →
                        </a>
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; margin-bottom: 0;">Please do not reply to this email — to respond, log in to the portal using the button above.</p>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated notification from the Acclaim Client Portal</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
New Document Available

A new document has been uploaded to your portal.

${data.caseReference ? `Case: ${data.caseName ? `${data.caseName} (${data.caseReference})` : data.caseReference}` : ''}
File Name: ${data.fileName}
File Size: ${formatFileSize(data.fileSize)}
Uploaded: ${data.uploadedAt.toLocaleString('en-GB')}

Please log in to the Acclaim Portal to view and download this document.
Portal: https://acclaim-api-prod-uks-001.azurewebsites.net/auth
      `;

      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      // Attach the uploaded document if file path is provided - skip video files
      if (data.filePath && fs.existsSync(data.filePath)) {
        if (isVideoFile(data.fileName, data.fileType)) {
          console.log(`[Email] Skipping video attachment for user (too large): ${data.fileName}`);
        } else {
          try {
            const fileContent = fs.readFileSync(data.filePath);
            const base64Content = fileContent.toString('base64');
            attachments.push({
              content: base64Content,
              filename: data.fileName,
              type: data.fileType || 'application/octet-stream',
              disposition: 'attachment'
            });
            console.log(`[Email] Attached document for user: ${data.fileName}`);
          } catch (attachError) {
            console.error(`[Email] Failed to attach document for user: ${attachError}`);
          }
        }
      }

      return await this.sendViaAPIM({
        to: userEmail,
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
    } catch (error) {
      console.error('❌ Failed to send document upload notification to user:', error);
      return false;
    }
  }

  // Send member request notification to admin
  async sendMemberRequestNotification(data: {
    orgId: number;
    orgName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    memberType: 'member' | 'owner';
    requestedBy: string;
    requestedByEmail: string;
  }): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - member request email not sent');
      return false;
    }

    try {
      const subject = `New Member Request: ${data.firstName} ${data.lastName} for ${data.orgName}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">New Member Request</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Organisation: ${data.orgName}</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">First Name</span>
                            <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px;">${data.firstName}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Surname</span>
                            <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px;">${data.lastName}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Email</span>
                            <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px;"><a href="mailto:${data.email}" style="color: #008b8b;">${data.email}</a></p>
                          </td>
                        </tr>
                        ${data.phone ? `
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Phone</span>
                            <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px;">${data.phone}</p>
                          </td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Member Type</span>
                            <p style="margin: 4px 0 0 0;">
                              <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; ${data.memberType === 'owner' ? 'background-color: #fef3c7; color: #92400e;' : 'background-color: #d1fae5; color: #065f46;'}">
                                ${data.memberType === 'owner' ? 'Owner' : 'Member'}
                              </span>
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Requested By -->
                      <div style="margin-top: 24px; padding: 16px; background-color: #e0f2f1; border-radius: 8px;">
                        <p style="margin: 0; color: #008b8b; font-size: 14px;">
                          <strong>Requested by:</strong> ${data.requestedBy} (${data.requestedByEmail})
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px; text-align: center;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This request was submitted via the Acclaim Client Portal</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
New Member Request

Organisation: ${data.orgName}

Member Details:
- First Name: ${data.firstName}
- Surname: ${data.lastName}
- Email: ${data.email}
${data.phone ? `- Phone: ${data.phone}` : ''}
- Member Type: ${data.memberType === 'owner' ? 'Owner' : 'Member'}

Requested by: ${data.requestedBy} (${data.requestedByEmail})

This request was submitted via the Acclaim Client Portal.
      `;

      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      return await this.sendViaAPIM({
        to: 'email@acclaim.law',
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
    } catch (error) {
      console.error('❌ Failed to send member request notification:', error);
      return false;
    }
  }

  // Send org owner request (member removal, owner delegation, or ownership removal)
  async sendOrgOwnerRequest(data: {
    type: 'member-removal' | 'owner-delegation' | 'ownership-removal';
    orgName: string;
    targetUserName: string;
    targetUserEmail: string;
    reason: string;
    requestedBy: string;
    requestedByEmail: string;
  }): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - org owner request email not sent');
      return false;
    }

    try {
      const isRemoval = data.type === 'member-removal';
      const isOwnershipRemoval = data.type === 'ownership-removal';
      
      let subject: string;
      let headerTitle: string;
      let actionDescription: string;
      
      if (isRemoval) {
        subject = `Member Removal Request: ${data.targetUserName} from ${data.orgName}`;
        headerTitle = 'Member Removal Request';
        actionDescription = 'has requested to remove the following member from their organisation';
      } else if (isOwnershipRemoval) {
        subject = `Ownership Removal Request: ${data.targetUserName} from ${data.orgName}`;
        headerTitle = 'Ownership Removal Request';
        actionDescription = 'has requested to remove Owner status from the following member';
      } else {
        subject = `Owner Delegation Request: ${data.targetUserName} for ${data.orgName}`;
        headerTitle = 'Owner Delegation Request';
        actionDescription = 'has requested to grant Owner status to the following member';
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: ${isRemoval ? '#dc2626' : isOwnershipRemoval ? '#ea580c' : '#f59e0b'}; background: linear-gradient(135deg, ${isRemoval ? '#dc2626' : isOwnershipRemoval ? '#ea580c' : '#f59e0b'} 0%, ${isRemoval ? '#b91c1c' : isOwnershipRemoval ? '#c2410c' : '#d97706'} 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 36px; width: auto; margin-bottom: 16px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">${headerTitle}</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Organisation: ${data.orgName}</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px;">
                        <strong>${data.requestedBy}</strong> (${data.requestedByEmail}) ${actionDescription}:
                      </p>
                      
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Name</span>
                            <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px;">${data.targetUserName}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Email</span>
                            <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px;"><a href="mailto:${data.targetUserEmail}" style="color: #008b8b;">${data.targetUserEmail}</a></p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Request Type</span>
                            <p style="margin: 4px 0 0 0;">
                              <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; ${isRemoval ? 'background-color: #fef2f2; color: #dc2626;' : isOwnershipRemoval ? 'background-color: #fff7ed; color: #c2410c;' : 'background-color: #fef3c7; color: #92400e;'}">
                                ${isRemoval ? 'Remove from Organisation' : isOwnershipRemoval ? 'Remove Owner Status' : 'Grant Owner Status'}
                              </span>
                            </p>
                          </td>
                        </tr>
                        ${data.reason && data.reason !== 'No reason provided' ? `
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Reason</span>
                            <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 14px;">${data.reason}</p>
                          </td>
                        </tr>
                        ` : ''}
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px; text-align: center;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">This request was submitted via the Acclaim Client Portal</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
${headerTitle}

Organisation: ${data.orgName}

${data.requestedBy} (${data.requestedByEmail}) ${actionDescription}:

Member Details:
- Name: ${data.targetUserName}
- Email: ${data.targetUserEmail}
- Request Type: ${isRemoval ? 'Remove from Organisation' : 'Grant Owner Status'}
${data.reason && data.reason !== 'No reason provided' ? `- Reason: ${data.reason}` : ''}

This request was submitted via the Acclaim Client Portal.
      `;

      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      return await this.sendViaAPIM({
        to: 'email@acclaim.law',
        subject: subject,
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });
    } catch (error) {
      console.error('❌ Failed to send org owner request:', error);
      return false;
    }
  }

  async sendLoginNotification(data: LoginNotificationData): Promise<boolean> {
    if (!this.initialized) {
      console.log('[Email] Login notification not sent - service not initialized');
      return false;
    }

    try {
      const loginTime = new Date(data.loginTime).toLocaleString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      // Parse user agent for friendly display
      const browserInfo = this.parseUserAgent(data.userAgent);
      
      const loginMethodDisplay = {
        'password': 'Password',
        'azure_sso': 'Microsoft Account (Azure SSO)',
        'otp': 'One-Time Password'
      }[data.loginMethod] || data.loginMethod;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0d9488; background: linear-gradient(135deg, #0d9488 0%, #115e59 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
                      <img src="cid:logo" alt="Acclaim" style="height: 50px; margin-bottom: 16px;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Login to Your Account</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 24px;">
                        Dear ${data.userName},
                      </p>
                      
                      <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 24px;">
                        We detected a new login to your Acclaim Portal account. If this was you, no action is required.
                      </p>
                      
                      <!-- Login Details Box -->
                      <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Login Details</h3>
                            <table width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px; vertical-align: top;">Time:</td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${loginTime}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Method:</td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${loginMethodDisplay}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">Browser:</td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${browserInfo}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">IP Address:</td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${data.ipAddress}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Warning Box -->
                      <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 16px;">
                            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 20px;">
                              <strong>Wasn't you?</strong><br>
                              If you didn't log in at this time, please contact Acclaim immediately to secure your account.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        Kind regards,<br>
                        The Acclaim Team
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px; text-align: center; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                        This is a security notification from the Acclaim Client Portal.
                      </p>
                      <p style="margin: 0; color: #6b7280; font-size: 11px;">
                        You can disable these login notifications in your Profile Settings.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textContent = `
Dear ${data.userName},

We detected a new login to your Acclaim Portal account.

Login Details:
- Time: ${loginTime}
- Method: ${loginMethodDisplay}
- Browser: ${browserInfo}
- IP Address: ${data.ipAddress}

If this was you, no action is required.

Wasn't you?
If you didn't log in at this time, please contact Acclaim immediately to secure your account.

Kind regards,
The Acclaim Team

---
This is a security notification from the Acclaim Client Portal.
You can disable these login notifications in your Profile Settings.
      `;

      const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
      const logoBase64 = getLogoBase64();
      if (logoBase64) {
        attachments.push(logoBase64);
      }

      const result = await this.sendViaAPIM({
        to: data.userEmail,
        subject: 'New Login to Your Acclaim Portal Account',
        textContent: textContent,
        htmlContent: htmlContent,
        attachments: attachments
      });

      if (result) {
        console.log(`[Email] Login notification sent to ${data.userEmail}`);
      }
      return result;
    } catch (error) {
      console.error('❌ Failed to send login notification:', error);
      return false;
    }
  }

  private parseUserAgent(userAgent: string): string {
    if (!userAgent || userAgent === 'unknown') {
      return 'Unknown browser';
    }
    
    // Extract browser and OS info
    let browser = 'Unknown browser';
    let os = '';
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      browser = match ? `Chrome ${match[1]}` : 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      browser = match ? `Firefox ${match[1]}` : 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      browser = match ? `Safari ${match[1]}` : 'Safari';
    } else if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      browser = match ? `Microsoft Edge ${match[1]}` : 'Microsoft Edge';
    }
    
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    }
    
    return os ? `${browser} on ${os}` : browser;
  }

  async sendBroadcastEmail(data: {
    toEmail: string;
    bccEmails: string[];
    subject: string;
    body: string;
    senderName: string;
  }): Promise<boolean> {
    if (!this.initialized) {
      console.log('❌ SendGrid not configured - broadcast email not sent');
      return false;
    }

    try {
      const plainTextBody = data.body;
      const htmlBody = data.body.split('\n').map(line => {
        if (line.trim() === '') return '<br/>';
        if (line.startsWith('•')) return `<li style="margin-left: 20px;">${line.substring(1).trim()}</li>`;
        return `<p style="margin: 0 0 8px 0; color: #1f2937; font-size: 15px; line-height: 1.6;">${line}</p>`;
      }).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #008b8b; background: linear-gradient(135deg, #008b8b 0%, #006666 100%); padding: 40px 40px 30px 40px; text-align: center;">
                      <img src="cid:logo" alt="Acclaim" style="height: 48px; width: auto; margin-bottom: 12px;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;">Acclaim Portal</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #008b8b; font-size: 20px; font-weight: 600;">${data.subject}</h2>
                      <div style="margin-top: 16px;">
                        ${htmlBody}
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 24px; text-align: center;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        Chadwick Lawrence LLP | &copy; ${new Date().getFullYear()}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const success = await this.sendViaAPIM({
        to: data.toEmail,
        bcc: data.bccEmails,
        subject: data.subject,
        html: htmlContent,
        text: plainTextBody,
        attachLogo: true
      });

      if (success) {
        console.log(`✅ Broadcast email sent to ${data.bccEmails.length} recipients (via BCC)`);
      }

      return success;
    } catch (error) {
      console.error('Error sending broadcast email:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sendGridEmailService = new SendGridEmailService();

// Standalone function for sending scheduled reports with Excel and HTML attachments
export async function sendScheduledReportEmailWithAttachments(
  recipientEmail: string,
  recipientName: string,
  frequencyText: string,
  excelBuffer: Buffer,
  htmlBuffer: Buffer,
  baseFileName: string,
  includeCaseSummary: boolean = true,
  includeActivityReport: boolean = true
): Promise<boolean> {
  try {
    const APIM_KEY = process.env.APIM_SUBSCRIPTION_KEY;
    if (!APIM_KEY) {
      console.error('[ScheduledReport] APIM subscription key not configured');
      return false;
    }

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const reportItemsHtml = [
      includeCaseSummary ? '<li><strong>Case Summary</strong> - Overview of your cases including status and amounts</li>' : '',
      includeActivityReport ? '<li><strong>Messages Report</strong> - Recent messages and document activity</li>' : '',
    ].filter(Boolean).join('\n                      ');

    const reportItemsText = [
      includeCaseSummary ? '- Case Summary: Overview of your cases including status and amounts' : '',
      includeActivityReport ? '- Messages Report: Recent messages and document activity' : '',
    ].filter(Boolean).join('\n');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #0d9488; background: linear-gradient(135deg, #0d9488 0%, #115e59 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
                    <img src="cid:logo" alt="Acclaim" style="height: 50px; margin-bottom: 16px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${frequencyText} Report - ${today}</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 24px;">
                      Dear ${recipientName},
                    </p>
                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 24px;">
                      Please find attached your ${frequencyText.toLowerCase()} report from the Acclaim Client Portal. This report contains:
                    </p>
                    
                    <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #374151; font-size: 16px; line-height: 28px;">
                      ${reportItemsHtml}
                    </ul>
                    
                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 24px;">
                      <strong>Two files are attached:</strong><br>
                      - <strong>HTML</strong> for quick viewing in any browser<br>
                      - <strong>Excel</strong> for detailed analysis with separate tabs
                    </p>
                    
                    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 24px;">
                      You can adjust your report preferences in your Profile settings.
                    </p>
                    
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Kind regards,<br>
                      The Acclaim Team
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #1f2937; padding: 24px; text-align: center; border-radius: 0 0 12px 12px;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      This is an automated message from the Acclaim Client Portal
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textContent = `
Dear ${recipientName},

Please find attached your ${frequencyText.toLowerCase()} report from the Acclaim Client Portal.

This report contains:
${reportItemsText}

Two files are attached:
- HTML for quick viewing in any browser
- Excel for detailed analysis with separate tabs

Kind regards,
The Acclaim Team
    `;

    const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
    
    // Add logo
    const logoBase64 = getLogoBase64();
    if (logoBase64) {
      attachments.push(logoBase64);
    }

    // Add HTML report first (easy to view in any browser)
    attachments.push({
      content: htmlBuffer.toString('base64'),
      filename: baseFileName + '.html',
      type: 'text/html',
      disposition: 'attachment'
    });

    // Add Excel report
    attachments.push({
      content: excelBuffer.toString('base64'),
      filename: baseFileName + '.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment'
    });

    // Support multiple recipients separated by semicolons (or commas)
    const recipientList = recipientEmail
      .split(/[;,]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (recipientList.length === 0) {
      console.error('[ScheduledReport] No valid recipient email addresses provided');
      return false;
    }

    const emailPayload = {
      personalizations: [{
        to: recipientList.map((email) => ({ email }))
      }],
      from: { email: 'email@acclaim.law', name: 'Acclaim Credit Management' },
      subject: `Your ${frequencyText} Report from Acclaim`,
      content: [
        { type: 'text/plain', value: textContent },
        { type: 'text/html', value: htmlContent }
      ],
      attachments: attachments
    };

    try {
      console.log(`[ScheduledReport] Sending ${frequencyText} report via APIM to: ${recipientEmail}`);
      const apimResponse = await fetch(APIM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': APIM_KEY
        },
        body: JSON.stringify(emailPayload)
      });

      const apimResponseText = await apimResponse.text();
      console.log(`[ScheduledReport] APIM response: status=${apimResponse.status} body=${apimResponseText.substring(0, 200)}`);

      if (apimResponse.ok || apimResponse.status === 202) {
        console.log(`[ScheduledReport] Successfully sent ${frequencyText} report via APIM to: ${recipientEmail}`);
        return true;
      }
      console.warn(`[ScheduledReport] APIM returned ${apimResponse.status} — falling back to direct SendGrid`);
    } catch (apimError) {
      console.warn(`[ScheduledReport] APIM unreachable (${(apimError as any)?.cause?.code || apimError}) — falling back to direct SendGrid`);
    }

    // Fallback to direct SendGrid API
    if (process.env.SENDGRID_API_KEY) {
      console.log(`[ScheduledReport] Sending ${frequencyText} report via SendGrid directly to: ${recipientEmail}`);
      const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
        },
        body: JSON.stringify(emailPayload)
      });

      const sgResponseText = await sgResponse.text();
      console.log(`[ScheduledReport] SendGrid response: status=${sgResponse.status} body=${sgResponseText.substring(0, 200)}`);

      if (sgResponse.ok || sgResponse.status === 202) {
        console.log(`[ScheduledReport] Successfully sent ${frequencyText} report via SendGrid to: ${recipientEmail}`);
        return true;
      }
      console.error(`[ScheduledReport] SendGrid also failed: ${sgResponse.status} - ${sgResponseText}`);
      return false;
    }

    console.error('[ScheduledReport] No working email transport — APIM failed and no SENDGRID_API_KEY set');
    return false;
  } catch (error) {
    console.error('[ScheduledReport] Error sending scheduled report email:', error);
    return false;
  }
}

// ── Escalation report email ──────────────────────────────────────────────────

export async function sendEscalationReportEmail(
  msgs: Array<{
    caseId: number; caseName: string; accountNumber: string; caseHandler: string | null;
    messageId: number; messageContent: string; messageSubject: string | null;
    messageCreatedAt: Date; senderName: string; senderEmail: string; daysOverdue: number;
  }>,
  excelBuffer: Buffer,
  fileName: string,
  htmlReportContent?: string,
  htmlReportFileName?: string,
  recipientEmail?: string,
): Promise<boolean> {
  try {
    const APIM_KEY = process.env.APIM_SUBSCRIPTION_KEY;
    if (!APIM_KEY && !process.env.SENDGRID_API_KEY) {
      console.error('[Escalation] No email transport configured');
      return false;
    }

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const totalCases = new Set(msgs.map(m => m.caseId)).size;
    const totalMsgs = msgs.length;

    // Age breakdown
    const bands = [
      { label: '7–14 days', min: 7,  max: 14 },
      { label: '14–21 days', min: 14, max: 21 },
      { label: '21–28 days', min: 21, max: 28 },
      { label: '28+ days',   min: 28, max: Infinity },
    ];

    // Handler breakdown
    const handlerMap = new Map<string, number>();
    for (const m of msgs) {
      const key = m.caseHandler || 'Unassigned';
      handlerMap.set(key, (handlerMap.get(key) ?? 0) + 1);
    }
    const handlerRows = [...handlerMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([h, c]) => `<tr><td style="padding:5px 12px;color:#374151;">${h}</td><td style="padding:5px 12px;color:#374151;font-weight:600;">${c}</td></tr>`)
      .join('');

    const ageBandRows = bands
      .map(b => {
        const count = msgs.filter(m => m.daysOverdue >= b.min && m.daysOverdue < b.max).length;
        const bgColor = b.min >= 28 ? '#FEE2E2' : b.min >= 21 ? '#FEF3C7' : b.min >= 14 ? '#FFFBEB' : '#F9FAFB';
        return `<tr style="background:${bgColor};"><td style="padding:5px 12px;color:#374151;">${b.label}</td><td style="padding:5px 12px;color:#374151;font-weight:600;">${count}</td></tr>`;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#B45309 0%,#92400E 100%);padding:36px 40px;text-align:center;">
                    <img src="cid:logo" alt="Acclaim" style="height:36px;width:auto;margin-bottom:14px;" />
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Daily Escalation Report</h1>
                    <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${today}</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">

                    <!-- Summary cards -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="width:50%;padding-right:8px;">
                          <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:10px;padding:16px;text-align:center;">
                            <p style="margin:0;font-size:32px;font-weight:800;color:#92400E;">${totalMsgs}</p>
                            <p style="margin:4px 0 0 0;font-size:13px;color:#78350F;">Total Messages Awaiting Response</p>
                          </div>
                        </td>
                        <td style="width:50%;padding-left:8px;">
                          <div style="background:#FEE2E2;border:1px solid #EF4444;border-radius:10px;padding:16px;text-align:center;">
                            <p style="margin:0;font-size:32px;font-weight:800;color:#991B1B;">${totalCases}</p>
                            <p style="margin:4px 0 0 0;font-size:13px;color:#7F1D1D;">Cases Affected</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Age breakdown -->
                    <h3 style="margin:0 0 10px 0;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">By Age</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;margin-bottom:24px;font-size:13px;">
                      <tr style="background:#F9FAFB;"><th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;">Age Band</th><th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;">Messages</th></tr>
                      ${ageBandRows}
                    </table>

                    <!-- Handler breakdown -->
                    <h3 style="margin:0 0 10px 0;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">By Case Handler</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;margin-bottom:28px;font-size:13px;">
                      <tr style="background:#F9FAFB;"><th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;">Case Handler</th><th style="padding:8px 12px;text-align:left;color:#6B7280;font-weight:600;">Messages</th></tr>
                      ${handlerRows}
                    </table>

                    <p style="margin:0 0 6px 0;color:#374151;font-size:13px;line-height:1.6;">The attached Excel report contains the full list, grouped by case (oldest first). Messages flagged as <em>"Likely Acknowledgement"</em> are shown in grey and may not require a reply — please use your judgement.</p>
                    <p style="margin:0;color:#94a3b8;font-size:12px;">This report is generated automatically each weekday at 8am and covers messages received after 25 June 2026 with no response for 7 or more days.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#1f2937;padding:20px 40px;text-align:center;border-radius:0 0 16px 16px;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">Automated escalation report — Acclaim Client Portal</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`;

    const textContent = `Daily Escalation Report — ${today}\n\n${totalMsgs} messages across ${totalCases} cases are awaiting a response.\n\nThe full breakdown is in the attached Excel report.\n\nThis report covers messages received after 25 June 2026 with no response for 7+ days.`;

    const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
    const logoBase64 = getLogoBase64();
    if (logoBase64) attachments.push(logoBase64);
    attachments.push({
      content: excelBuffer.toString('base64'),
      filename: fileName,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment',
    });
    if (htmlReportContent && htmlReportFileName) {
      attachments.push({
        content: Buffer.from(htmlReportContent, 'utf8').toString('base64'),
        filename: htmlReportFileName,
        type: 'text/html',
        disposition: 'attachment',
      });
    }

    const RECIPIENT = recipientEmail || 'email@acclaim.law';
    const subject = `⚠️ Escalation Report — ${totalMsgs} message${totalMsgs !== 1 ? 's' : ''} across ${totalCases} case${totalCases !== 1 ? 's' : ''} — ${today}`;

    const emailPayload = {
      personalizations: [{ to: [{ email: RECIPIENT }] }],
      from: { email: 'email@acclaim.law', name: 'Acclaim Credit Management' },
      subject,
      content: [
        { type: 'text/plain', value: textContent },
        { type: 'text/html', value: htmlContent },
      ],
      attachments,
    };

    if (APIM_KEY) {
      try {
        const resp = await fetch(APIM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': APIM_KEY },
          body: JSON.stringify(emailPayload),
        });
        if (resp.ok || resp.status === 202) {
          console.log(`[Escalation] Report sent via APIM to ${RECIPIENT}`);
          return true;
        }
        console.warn(`[Escalation] APIM returned ${resp.status}`);
      } catch (e) {
        console.warn(`[Escalation] APIM unreachable — ${e}`);
      }
    }

    if (process.env.SENDGRID_API_KEY) {
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}` },
        body: JSON.stringify(emailPayload),
      });
      if (resp.ok || resp.status === 202) {
        console.log(`[Escalation] Report sent via SendGrid to ${RECIPIENT}`);
        return true;
      }
      console.error(`[Escalation] SendGrid failed: ${resp.status}`);
      return false;
    }

    console.error('[Escalation] No working email transport');
    return false;
  } catch (error) {
    console.error('[Escalation] Error sending escalation report email:', error);
    return false;
  }
}

// ── Inactive Cases Weekly Report email ───────────────────────────────────────

export async function sendInactiveCasesReportEmail(
  cases: Array<{
    caseId: number; caseName: string; accountNumber: string;
    assignedTo: string | null; outstandingAmount: string;
    status: string; stage: string; lastActivityDate: Date; daysInactive: number;
  }>,
  excelBuffer: Buffer,
  excelFileName: string,
  htmlContent: string,
  htmlFileName: string,
  recipientEmail?: string,
): Promise<boolean> {
  try {
    const APIM_KEY = process.env.APIM_SUBSCRIPTION_KEY;
    if (!APIM_KEY && !process.env.SENDGRID_API_KEY) {
      console.error('[InactiveCases] No email transport configured');
      return false;
    }

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const totalCases = cases.length;
    const longestCase = [...cases].sort((a, b) => b.daysInactive - a.daysInactive)[0];
    const avgDays = totalCases > 0
      ? Math.round(cases.reduce((s, c) => s + c.daysInactive, 0) / totalCases)
      : 0;

    const band30_60 = cases.filter(c => c.daysInactive >= 30 && c.daysInactive < 60).length;
    const band60_90 = cases.filter(c => c.daysInactive >= 60 && c.daysInactive < 90).length;
    const band90p   = cases.filter(c => c.daysInactive >= 90).length;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#B45309 0%,#78350F 100%);padding:36px 40px;text-align:center;">
                    <img src="cid:logo" alt="Acclaim" style="height:36px;width:auto;margin-bottom:14px;" />
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">&#x1F550; Inactive Cases Report</h1>
                    <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${today}</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <!-- Summary cards -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="width:33%;padding-right:6px;">
                          <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:10px;padding:16px;text-align:center;">
                            <p style="margin:0;font-size:32px;font-weight:800;color:#92400E;">${totalCases}</p>
                            <p style="margin:4px 0 0 0;font-size:12px;color:#78350F;">Inactive Cases</p>
                          </div>
                        </td>
                        <td style="width:33%;padding:0 3px;">
                          <div style="background:#FEE2E2;border:1px solid #EF4444;border-radius:10px;padding:16px;text-align:center;">
                            <p style="margin:0;font-size:32px;font-weight:800;color:#991B1B;">${longestCase ? longestCase.daysInactive : 0}d</p>
                            <p style="margin:4px 0 0 0;font-size:12px;color:#7F1D1D;">Longest Gap</p>
                          </div>
                        </td>
                        <td style="width:33%;padding-left:6px;">
                          <div style="background:#FFEDD5;border:1px solid #F97316;border-radius:10px;padding:16px;text-align:center;">
                            <p style="margin:0;font-size:32px;font-weight:800;color:#9A3412;">${avgDays}d</p>
                            <p style="margin:4px 0 0 0;font-size:12px;color:#7C2D12;">Average</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Age breakdown -->
                    <h3 style="margin:0 0 10px 0;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">By Inactivity Period</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;margin-bottom:24px;font-size:13px;">
                      <tr style="background:#FFFBEB;"><td style="padding:7px 12px;color:#374151;">30–60 days</td><td style="padding:7px 12px;color:#92400E;font-weight:600;">${band30_60} case${band30_60 !== 1 ? 's' : ''}</td></tr>
                      <tr style="background:#FFF7ED;"><td style="padding:7px 12px;color:#374151;">60–90 days</td><td style="padding:7px 12px;color:#9A3412;font-weight:600;">${band60_90} case${band60_90 !== 1 ? 's' : ''}</td></tr>
                      <tr style="background:#FEF2F2;"><td style="padding:7px 12px;color:#374151;">90+ days</td><td style="padding:7px 12px;color:#991B1B;font-weight:600;">${band90p} case${band90p !== 1 ? 's' : ''}</td></tr>
                    </table>

                    <p style="margin:0 0 8px 0;color:#374151;font-size:13px;line-height:1.6;">Two attachments are included:</p>
                    <ul style="margin:0 0 20px 0;padding-left:20px;color:#374151;font-size:13px;line-height:1.8;">
                      <li><strong>Excel workbook</strong> — full case list with age-band colour coding and handler summary</li>
                      <li><strong>HTML report</strong> — open in any browser for a formatted view including latest activity and recent messages per case</li>
                    </ul>
                    <p style="margin:0;color:#94a3b8;font-size:12px;">This report is generated automatically every Thursday at 8am and covers active cases with no activity for 30 or more days since 20 May 2026.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#1f2937;padding:20px 40px;text-align:center;border-radius:0 0 16px 16px;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">Automated weekly report — Acclaim Client Portal</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`;

    const textBody = `Inactive Cases Report — ${today}\n\n${totalCases} case${totalCases !== 1 ? 's' : ''} have had no activity for 30+ days.\n\nLongest gap: ${longestCase ? longestCase.daysInactive + ' days (' + longestCase.caseName + ')' : 'N/A'}\nAverage inactivity: ${avgDays} days\n\nAge breakdown:\n  30–60 days: ${band30_60}\n  60–90 days: ${band60_90}\n  90+ days:   ${band90p}\n\nFull details in the attached Excel and HTML report.`;

    const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
    const logoBase64 = getLogoBase64();
    if (logoBase64) attachments.push(logoBase64);
    attachments.push({
      content: excelBuffer.toString('base64'),
      filename: excelFileName,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment',
    });
    attachments.push({
      content: Buffer.from(htmlContent).toString('base64'),
      filename: htmlFileName,
      type: 'text/html',
      disposition: 'attachment',
    });

    const RECIPIENT = recipientEmail || 'email@acclaim.law';
    const subject = `\u{1F550} Inactive Cases Report \u2014 ${totalCases} case${totalCases !== 1 ? 's' : ''} \u2014 ${today}`;

    const emailPayload = {
      personalizations: [{ to: [{ email: RECIPIENT }] }],
      from: { email: 'email@acclaim.law', name: 'Acclaim Credit Management' },
      subject,
      content: [
        { type: 'text/plain', value: textBody },
        { type: 'text/html',  value: htmlBody },
      ],
      attachments,
    };

    if (APIM_KEY) {
      try {
        const resp = await fetch(APIM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': APIM_KEY },
          body: JSON.stringify(emailPayload),
        });
        if (resp.ok || resp.status === 202) {
          console.log(`[InactiveCases] Report sent via APIM to ${RECIPIENT}`);
          return true;
        }
        console.warn(`[InactiveCases] APIM returned ${resp.status}`);
      } catch (e) {
        console.warn(`[InactiveCases] APIM unreachable — ${e}`);
      }
    }

    if (process.env.SENDGRID_API_KEY) {
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}` },
        body: JSON.stringify(emailPayload),
      });
      if (resp.ok || resp.status === 202) {
        console.log(`[InactiveCases] Report sent via SendGrid to ${RECIPIENT}`);
        return true;
      }
      console.error(`[InactiveCases] SendGrid failed: ${resp.status}`);
      return false;
    }

    console.error('[InactiveCases] No working email transport');
    return false;
  } catch (error) {
    console.error('[InactiveCases] Error sending inactive cases report email:', error);
    return false;
  }
}

// ── Pending submissions escalation report email ───────────────────────────────

export async function sendPendingSubmissionsReportEmail(
  submissions: Array<{
    id: number; caseName: string; debtorType: string; individualType: string | null;
    organisationName: string | null; organisationTradingName: string | null;
    tradingName: string | null; principalSalutation: string | null;
    principalFirstName: string | null; principalLastName: string | null;
    clientOrganisationName: string | null; submittedByName: string | null;
    totalDebtAmount: string; currency: string | null;
    mainEmail: string | null; mainPhone: string | null;
    submittedAt: Date; daysPending: number;
  }>,
  excelBuffer: Buffer,
  htmlContent: string,
  dateStr: string,
): Promise<boolean> {
  const APIM_KEY = process.env.APIM_SUBSCRIPTION_KEY;
  const RECIPIENT = 'email@acclaim.law';

  if (!APIM_KEY && !process.env.SENDGRID_API_KEY) {
    console.error('[PendingSubmissions] No email transport configured');
    return false;
  }

  try {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const totalCases = submissions.length;
    const totalDebt = submissions.reduce((acc, s) => acc + Number(s.totalDebtAmount), 0)
      .toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
    const longestPending = submissions.length > 0 ? submissions[0].daysPending : 0;

    const subject = `⚠️ Pending Submissions — ${totalCases} case${totalCases !== 1 ? 's' : ''} awaiting action — ${today}`;

    const caseListHtml = submissions.map(s => {
      const debtorName = s.debtorType === 'organisation'
        ? (s.organisationTradingName || s.organisationName || '—')
        : [[s.principalSalutation, s.principalFirstName, s.principalLastName].filter(Boolean).join(' ') || '—', s.tradingName].filter(Boolean).join(' / ');
      const ageBg = s.daysPending >= 14 ? '#FEE2E2' : s.daysPending >= 7 ? '#FEF9C3' : '#F0FDF4';
      const ageColor = s.daysPending >= 14 ? '#B91C1C' : s.daysPending >= 7 ? '#92400E' : '#166534';
      const amount = (() => {
        const sym = (s.currency || 'GBP') === 'GBP' ? '£' : (s.currency || '');
        try { return sym + Number(s.totalDebtAmount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
        catch { return `${sym}${s.totalDebtAmount}`; }
      })();
      return `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 8px;font-size:13px;font-weight:600;color:#1e293b;">${s.caseName}</td>
          <td style="padding:10px 8px;font-size:13px;color:#475569;">${debtorName}</td>
          <td style="padding:10px 8px;font-size:13px;color:#1e293b;font-weight:600;">${amount}</td>
          <td style="padding:10px 8px;font-size:13px;color:#475569;">${s.submittedAt.toLocaleDateString('en-GB')}</td>
          <td style="padding:10px 8px;text-align:center;">
            <span style="display:inline-block;background:${ageBg};color:${ageColor};font-weight:700;font-size:13px;padding:3px 10px;border-radius:99px;">${s.daysPending}d</span>
          </td>
          <td style="padding:10px 8px;font-size:12px;color:#475569;">${s.clientOrganisationName || '—'}</td>
        </tr>`;
    }).join('');

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f4f8;">
  <tr><td align="center" style="padding:40px 20px;">
    <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#008b8b 0%,#006666 100%);padding:40px 40px 30px;text-align:center;">
        <img src="cid:logo" alt="Acclaim" style="height:36px;width:auto;margin-bottom:16px;" />
        <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">⚠️ Pending Submissions Escalation</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${today}</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:40px;">

        <!-- Summary cards -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:18px;text-align:center;border-right:1px solid #e2e8f0;width:33%;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Cases Pending</p>
              <p style="margin:0;font-size:30px;font-weight:800;color:#008b8b;">${totalCases}</p>
            </td>
            <td style="padding:18px;text-align:center;border-right:1px solid #e2e8f0;width:33%;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Total Debt</p>
              <p style="margin:0;font-size:22px;font-weight:800;color:#1e293b;">${totalDebt}</p>
            </td>
            <td style="padding:18px;text-align:center;width:33%;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;">Longest Pending</p>
              <p style="margin:0;font-size:30px;font-weight:800;color:#B91C1C;">${longestPending}d</p>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
          The following ${totalCases} case${totalCases !== 1 ? 's have' : ' has'} been submitted and remain${totalCases === 1 ? 's' : ''} in <strong>Pending</strong> status for more than 3 days. These cases require attention — please review and action accordingly.
        </p>

        <!-- Case table -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:9px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#475569;text-align:left;">Case</th>
              <th style="padding:9px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#475569;text-align:left;">Debtor</th>
              <th style="padding:9px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#475569;text-align:left;">Amount</th>
              <th style="padding:9px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#475569;text-align:left;">Submitted</th>
              <th style="padding:9px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#475569;text-align:center;">Age</th>
              <th style="padding:9px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#475569;text-align:left;">Client Org</th>
            </tr>
          </thead>
          <tbody>${caseListHtml}</tbody>
        </table>

        <!-- Attachments note -->
        <div style="background:#e0f7f6;border-radius:12px;padding:18px;">
          <p style="color:#00695c;margin:0 0 8px;font-size:14px;font-weight:600;">Attachments included:</p>
          <ul style="color:#00695c;margin:0;padding-left:20px;font-size:14px;line-height:1.8;">
            <li><strong>Excel workbook</strong> — all cases with full details, age banding, and summary tab</li>
            <li><strong>HTML report</strong> — styled printable version, open in any browser</li>
          </ul>
        </div>

      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#1f2937;padding:24px 40px;text-align:center;border-radius:0 0 16px 16px;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">Automated daily escalation — Acclaim Client Portal · Cases remain in this report until their status is changed</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

    const textContent = `Pending Submissions Escalation — ${today}\n\n${totalCases} case${totalCases !== 1 ? 's' : ''} pending for more than 3 days.\nTotal debt value: ${totalDebt}\nLongest pending: ${longestPending} days\n\nFull breakdown in attached Excel and HTML report.`;

    const logoBase64 = getLogoBase64();
    const attachments: Array<{ content: string; filename: string; type: string; disposition?: string; content_id?: string }> = [];
    if (logoBase64) attachments.push(logoBase64);

    attachments.push({
      content: excelBuffer.toString('base64'),
      filename: `Acclaim_Pending_Submissions_${dateStr}.xlsx`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment',
    });

    attachments.push({
      content: Buffer.from(htmlContent.trim()).toString('base64'),
      filename: `Acclaim_Pending_Submissions_${dateStr}.html`,
      type: 'text/html',
      disposition: 'attachment',
    });

    const emailPayload = {
      to: RECIPIENT,
      subject,
      textContent,
      htmlContent: emailHtml,
      attachments,
    };

    if (APIM_KEY) {
      try {
        const resp = await fetch(APIM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': APIM_KEY },
          body: JSON.stringify(emailPayload),
        });
        if (resp.ok || resp.status === 202) {
          console.log(`[PendingSubmissions] Report sent via APIM to ${RECIPIENT}`);
          return true;
        }
        console.warn(`[PendingSubmissions] APIM returned ${resp.status}`);
      } catch (e) {
        console.warn(`[PendingSubmissions] APIM unreachable — ${e}`);
      }
    }

    if (process.env.SENDGRID_API_KEY) {
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}` },
        body: JSON.stringify(emailPayload),
      });
      if (resp.ok || resp.status === 202) {
        console.log(`[PendingSubmissions] Report sent via SendGrid to ${RECIPIENT}`);
        return true;
      }
      console.error(`[PendingSubmissions] SendGrid failed: ${resp.status}`);
      return false;
    }

    console.error('[PendingSubmissions] No working email transport');
    return false;
  } catch (error) {
    console.error('[PendingSubmissions] Error sending pending submissions report email:', error);
    return false;
  }
}

// ── Stuck-at-Activity report email ────────────────────────────────────────────

export async function sendStuckActivityReportEmail(
  cases: Array<{
    caseId: number; caseName: string; accountNumber: string;
    assignedTo: string | null; outstandingAmount: string;
    status: string; stage: string;
    lastActivityDescription: string; lastActivityDate: Date; daysSinceActivity: number;
  }>,
  selectedDescriptions: string[],
  minDays: number,
  excelBuffer: Buffer,
  excelFileName: string,
  htmlContent: string,
  htmlFileName: string,
  recipientEmail?: string,
): Promise<boolean> {
  const APIM_KEY = process.env.APIM_SUBSCRIPTION_KEY;
  const RECIPIENT = recipientEmail || 'email@acclaim.law';

  if (!APIM_KEY && !process.env.SENDGRID_API_KEY) {
    console.error('[StuckActivity] No email transport configured');
    return false;
  }

  try {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const totalCases = cases.length;
    const longestCase = [...cases].sort((a, b) => b.daysSinceActivity - a.daysSinceActivity)[0];

    const logoPath = path.join(process.cwd(), 'attached_assets', 'acclaim_rose_transparent_1768474381340.png');
    let logoBase64 = '';
    try {
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    } catch { /* logo optional */ }

    const attachments: any[] = [];

    if (logoBase64) {
      attachments.push({
        content: logoBase64,
        type: 'image/png',
        filename: 'logo.png',
        disposition: 'inline',
        content_id: 'logo',
      });
    }

    attachments.push({
      content: excelBuffer.toString('base64'),
      filename: excelFileName,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment',
    });

    attachments.push({
      content: Buffer.from(htmlContent).toString('base64'),
      filename: htmlFileName,
      type: 'text/html',
      disposition: 'attachment',
    });

    const descList = selectedDescriptions.map(d => `<li style="margin-bottom:4px;">${d}</li>`).join('');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#6D28D9 0%,#4C1D95 100%);padding:36px 40px;text-align:center;">
                    <img src="cid:logo" alt="Acclaim" style="height:36px;width:auto;margin-bottom:14px;" />
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">&#x23F3; Stuck Cases Report</h1>
                    <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${today}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:#F5F3FF;border-radius:12px;padding:20px 24px;border-top:4px solid #7C3AED;text-align:center;">
                          <div style="font-size:36px;font-weight:800;color:#4C1D95;line-height:1;">${totalCases}</div>
                          <div style="font-size:13px;color:#6D28D9;font-weight:500;margin-top:4px;">Cases matching criteria</div>
                          ${longestCase ? `<div style="font-size:12px;color:#8B5CF6;margin-top:4px;">Longest gap: ${longestCase.daysSinceActivity} days (${longestCase.caseName})</div>` : ''}
                        </td>
                      </tr>
                    </table>
                    <p style="font-size:14px;color:#374151;margin:0 0 12px 0;font-weight:600;">Activities searched (no follow-up for ${minDays}+ days):</p>
                    <ul style="margin:0 0 24px 0;padding:0 0 0 20px;font-size:14px;color:#374151;">
                      ${descList}
                    </ul>
                    <p style="font-size:14px;color:#374151;margin:0 0 20px 0;">
                      Please find attached the full report as an Excel spreadsheet and a detailed HTML file showing each case with its last activity and recent messages.
                    </p>
                    <p style="font-size:12px;color:#9CA3AF;margin:0;">
                      This is an on-demand report triggered manually. It does not affect any automatic report schedules.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#F9FAFB;padding:20px 40px;text-align:center;border-top:1px solid #E5E7EB;">
                    <p style="margin:0;font-size:12px;color:#9CA3AF;">Acclaim Credit Management &bull; ${today}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`;

    const subject = `⏳ Stuck Cases Report — ${totalCases} case${totalCases !== 1 ? 's' : ''} — ${today}`;

    const emailPayload = {
      personalizations: [{ to: [{ email: RECIPIENT }] }],
      from: { email: 'email@acclaim.law', name: 'Acclaim Credit Management' },
      subject,
      content: [{ type: 'text/html', value: htmlBody }],
      attachments,
    };

    if (APIM_KEY) {
      try {
        const resp = await fetch('https://acclaimlaw.azure-api.net/send-email/v1/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': APIM_KEY },
          body: JSON.stringify(emailPayload),
        });
        if (resp.ok || resp.status === 202) {
          console.log(`[StuckActivity] Report sent via APIM to ${RECIPIENT}`);
          return true;
        }
        console.warn(`[StuckActivity] APIM returned ${resp.status}`);
      } catch (e) {
        console.warn(`[StuckActivity] APIM unreachable — ${e}`);
      }
    }

    if (process.env.SENDGRID_API_KEY) {
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}` },
        body: JSON.stringify(emailPayload),
      });
      if (resp.ok || resp.status === 202) {
        console.log(`[StuckActivity] Report sent via SendGrid to ${RECIPIENT}`);
        return true;
      }
      console.error(`[StuckActivity] SendGrid failed: ${resp.status}`);
      return false;
    }

    console.error('[StuckActivity] No working email transport');
    return false;
  } catch (error) {
    console.error('[StuckActivity] Error sending report email:', error);
    return false;
  }
}
