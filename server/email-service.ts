import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const _clLogoPath = path.join(process.cwd(), 'server', 'assets', 'chadlaw-logo.jpg');
const _clLogoB64 = fs.existsSync(_clLogoPath) ? fs.readFileSync(_clLogoPath).toString('base64') : '';
const CL_LOGO_HEADER = _clLogoB64
  ? `<div style="background:#ffffff;padding:18px 40px;text-align:center;border-bottom:1px solid #e8e8f0;"><img src="data:image/jpeg;base64,${_clLogoB64}" alt="Chadwick Lawrence" style="height:64px;width:auto;display:inline-block;" /></div>`
  : '';

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
    caseHandler?: string;
  };
  attachment?: {
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  };
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
    caseHandler?: string;
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
  isAdmin?: boolean;
  portalUrl?: string;
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
    caseHandler?: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // For development, use Ethereal Email (test account)
      if (process.env.NODE_ENV === 'development') {
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.initialized = true;
      } else {
        // Production: Only initialize if SMTP credentials are provided
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            },
          });
          this.initialized = true;
        } else if (process.env.SENDGRID_API_KEY) {
          // Production: Use SendGrid for email sending
          this.transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
              user: 'apikey',
              pass: process.env.SENDGRID_API_KEY,
            },
          });
          this.initialized = true;
        } else {
          // No email service configured - use console logging instead
          this.initialized = false;
          console.log('Email service: No email credentials provided, using console logging for notifications');
        }
      }
      
      if (this.initialized) {
        console.log('Email service initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.initialized = false;
    }
  }

  async sendMessageNotification(data: EmailNotificationData, adminEmail: string): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      // Enhanced console logging for production monitoring
      console.log('\n================== NEW MESSAGE NOTIFICATION ==================');
      console.log(`📧 Email would be sent to: ${adminEmail}`);
      console.log(`👤 From: ${data.userName} (${data.userEmail})`);
      console.log(`🏢 Organisation: ${data.organisationName}`);
      if (data.caseReference) {
        console.log(`📋 Case: ${data.caseReference}`);
      }
      if (data.caseDetails) {
        console.log(`📁 Case Details:`);
        console.log(`   └─ Name: ${data.caseDetails.caseName}`);
        console.log(`   └─ Type: ${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}`);
        console.log(`   └─ Original: £${data.caseDetails.originalAmount}`);
        console.log(`   └─ Outstanding: £${data.caseDetails.outstandingAmount}`);
        console.log(`   └─ Status: ${data.caseDetails.status.toUpperCase()}`);
        console.log(`   └─ Stage: ${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
      }
      console.log(`📝 Subject: ${data.messageSubject || 'New Message'}`);
      console.log(`💬 Message: ${data.messageContent}`);
      console.log(`⏰ Time: ${new Date().toLocaleString('en-GB')}`);
      console.log('===========================================================\n');
      
      // Log to show this was handled by fallback system
      console.log('ℹ️  Note: SMTP not configured, notification logged to console');
      return true;
    }

    try {
      const subject = data.caseReference 
        ? `New Message: ${data.messageSubject || 'User Enquiry'} [${data.caseReference}] - Acclaim Portal`
        : `New Message: ${data.messageSubject || 'User Enquiry'} - Acclaim Portal`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); background-color: #14b8a6; color: #ffffff; padding: 20px; text-align: center;">
            <div style="margin-bottom: 10px;">
              <img src="cid:logo" alt="Acclaim Credit Management & Recovery" style="height: 32px; width: auto;" />
            </div>
            <h2 style="margin: 0; font-size: 18px; color: #ffffff; font-weight: 600;">New Message Received</h2>
            ${data.caseReference ? `<p style="margin: 5px 0 0 0; color: #ffffff; font-size: 14px;">Case: ${data.caseReference}</p>` : ''}
          </div>
          
          <div style="padding: 30px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0;">Message Details</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 120px;">From:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Organisation:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.organisationName}</td>
                </tr>
                ${data.caseReference ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Case Reference:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.caseReference}</td>
                </tr>
                ` : ''}
                ${data.caseDetails ? `
                <tr>
                  <td colspan="2" style="padding: 15px 0 8px 0;">
                    <h3 style="color: #0f172a; margin: 0; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Case Details</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Case Name:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.caseName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Debtor Type:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Original Amount:</td>
                  <td style="padding: 4px 0; color: #1e293b;">£${data.caseDetails.originalAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Outstanding Amount:</td>
                  <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">£${data.caseDetails.outstandingAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Status:</td>
                  <td style="padding: 4px 0; color: #1e293b;">
                    <span style="background: ${data.caseDetails.status === 'active' ? '#dcfce7' : '#fef3c7'}; color: ${data.caseDetails.status === 'active' ? '#166534' : '#a16207'}; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; font-weight: bold;">
                      ${data.caseDetails.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Current Stage:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                </tr>
                ${data.caseDetails.caseHandler ? `
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Case Handler:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.caseHandler}</td>
                </tr>
                ` : ''}
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Subject:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.messageSubject || 'New Message'}</td>
                </tr>
                ${data.attachment ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Attachment:</td>
                  <td style="padding: 8px 0; color: #1e293b;">
                    📎 ${data.attachment.fileName} 
                    <span style="color: #64748b; font-size: 14px;">(${(data.attachment.fileSize / 1024).toFixed(1)}KB)</span>
                  </td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1e293b; margin-top: 0;">Message Content</h3>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #0891b2;">
                <p style="margin: 0; color: #334155; line-height: 1.6;">${data.messageContent.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px;">
                Please log in to the Acclaim Portal to respond to this message.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">Please do not reply to this email — responses sent by email cannot be processed.</p>
            </div>
          </div>
          
          <div style="background: #1e293b; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">This is an automated notification from Acclaim Credit Management & Recovery Portal</p>
          </div>
        </div>
      `;

      const textContent = `
NEW MESSAGE RECEIVED - Acclaim Portal

From: ${data.userName} (${data.userEmail})
Organisation: ${data.organisationName}
${data.caseReference ? `Case Reference: ${data.caseReference}` : ''}
${data.caseDetails ? `
CASE DETAILS:
- Case Name: ${data.caseDetails.caseName}
- Debtor Type: ${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}
- Original Amount: £${data.caseDetails.originalAmount}
- Outstanding Amount: £${data.caseDetails.outstandingAmount}
- Status: ${data.caseDetails.status.toUpperCase()}
- Current Stage: ${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}${data.caseDetails.caseHandler ? `
- Case Handler: ${data.caseDetails.caseHandler}` : ''}
` : ''}
Subject: ${data.messageSubject || 'New Message'}

Message:
${data.messageContent}

Please log in to the Acclaim Portal to respond to this message.
      `;

      const info = await this.transporter.sendMail({
        from: '"Acclaim Credit Management & Recovery" <email@acclaim.law>',
        replyTo: 'noreply@acclaim.law',
        to: adminEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../attached_assets/Acclaim rose.Cur_1752271300769.png'),
            cid: 'logo'
          }
        ]
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      console.log('Message notification email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  async sendAdminToUserNotification(data: AdminToUserNotificationData): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      // Enhanced console logging for admin-to-user notifications
      console.log('\n================ ADMIN TO USER NOTIFICATION ================');
      console.log(`👤 Admin: ${data.adminName} (${data.adminEmail})`);
      console.log(`📧 User to notify: ${data.userName} (${data.userEmail})`);
      console.log(`🏢 Organisation: ${data.organisationName}`);
      if (data.caseReference) {
        console.log(`📋 Case: ${data.caseReference}`);
      }
      if (data.caseDetails) {
        console.log(`📁 Case Details:`);
        console.log(`   └─ Name: ${data.caseDetails.caseName}`);
        console.log(`   └─ Type: ${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}`);
        console.log(`   └─ Original: £${data.caseDetails.originalAmount}`);
        console.log(`   └─ Outstanding: £${data.caseDetails.outstandingAmount}`);
        console.log(`   └─ Status: ${data.caseDetails.status.toUpperCase()}`);
        console.log(`   └─ Stage: ${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
      }
      console.log(`📝 Subject: ${data.messageSubject || 'New Message from Admin'}`);
      console.log(`💬 Message: ${data.messageContent}`);
      console.log(`⏰ Time: ${new Date().toLocaleString('en-GB')}`);
      console.log('===========================================================\n');
      
      // In-app notification fallback
      console.log('ℹ️  Note: SMTP not configured, notification logged to console');
      console.log('💡 Recommendation: User will see message in portal when they next log in');
      return true;
    }

    try {
      const subject = data.caseReference 
        ? `${data.messageSubject || 'New Message'} [${data.caseReference}] - Acclaim Portal`
        : `${data.messageSubject || 'New Message'} - Acclaim Portal`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 30px; text-align: center;">
            <div style="margin-bottom: 10px;">
              <img src="cid:logo" alt="Acclaim Credit Management & Recovery" style="height: 40px; width: auto;" />
            </div>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">New message from administrator</p>
            ${data.caseReference ? `<p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Case: ${data.caseReference}</p>` : ''}
          </div>
          
          <div style="padding: 30px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0;">Message Details</h2>
              <table style="width: 100%; border-spacing: 0;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">From:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.adminName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Organisation:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.organisationName}</td>
                </tr>
                ${data.caseReference ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Case Reference:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.caseReference}</td>
                </tr>
                ` : ''}
                ${data.caseDetails ? `
                <tr>
                  <td colspan="2" style="padding: 15px 0 8px 0;">
                    <h3 style="color: #0f172a; margin: 0; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Case Details</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Case Name:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.caseName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Debtor Type:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Original Amount:</td>
                  <td style="padding: 4px 0; color: #1e293b;">£${data.caseDetails.originalAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Outstanding Amount:</td>
                  <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">£${data.caseDetails.outstandingAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Status:</td>
                  <td style="padding: 4px 0; color: #1e293b;">
                    <span style="background: ${data.caseDetails.status === 'active' ? '#dcfce7' : '#fef3c7'}; color: ${data.caseDetails.status === 'active' ? '#166534' : '#a16207'}; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; font-weight: bold;">
                      ${data.caseDetails.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Current Stage:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Subject:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.messageSubject || 'New Message from Admin'}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1e293b; margin-top: 0;">Message Content</h3>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #0891b2;">
                <p style="margin: 0; color: #334155; line-height: 1.6;">${data.messageContent.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #64748b; font-size: 14px;">
                Please log in to the Acclaim Portal to view and respond to this message.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">Please do not reply to this email — to respond, log in to the portal using the link above.</p>
            </div>
          </div>
          
          <div style="background: #1e293b; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">This is an automated notification from Acclaim Credit Management & Recovery Portal</p>
            <p style="margin: 8px 0 0 0; opacity: 0.7;">To manage your notification preferences, visit your Profile settings in the portal.</p>
          </div>
        </div>
      `;

      const textContent = `
NEW MESSAGE FROM ADMIN - Acclaim Portal

From: ${data.adminName}
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
Subject: ${data.messageSubject || 'New Message from Admin'}

Message:
${data.messageContent}

Please log in to the Acclaim Portal to view and respond to this message.

To manage your notification preferences, visit your Profile settings in the portal.
      `;

      const info = await this.transporter.sendMail({
        from: '"Acclaim Credit Management & Recovery" <email@acclaim.law>',
        replyTo: 'noreply@acclaim.law',
        to: data.userEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../attached_assets/Acclaim rose.Cur_1752271300769.png'),
            cid: 'logo'
          }
        ]
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      console.log('Admin-to-user notification email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send admin-to-user email notification:', error);
      return false;
    }
  }

  async sendExternalMessageNotification(data: ExternalMessageNotificationData): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      // Enhanced console logging for external API messages
      console.log('\n============== EXTERNAL API EMAIL NOTIFICATION ==============');
      console.log(`📧 Email would be sent to: ${data.userEmail}`);
      console.log(`👤 User: ${data.userName}`);
      console.log(`🏢 Organisation: ${data.organisationName}`);
      console.log(`📤 From: ${data.senderName} (External System)`);
      console.log(`📋 Case: ${data.caseReference || 'No case reference'}`);
      if (data.caseDetails) {
        console.log(`📁 Case Details:`);
        console.log(`   └─ Name: ${data.caseDetails.caseName}`);
        console.log(`   └─ Type: ${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}`);
        console.log(`   └─ Original: £${data.caseDetails.originalAmount}`);
        console.log(`   └─ Outstanding: £${data.caseDetails.outstandingAmount}`);
        console.log(`   └─ Status: ${data.caseDetails.status.toUpperCase()}`);
        console.log(`   └─ Stage: ${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
      }
      console.log(`🔖 Type: ${data.messageType}`);
      console.log(`📝 Subject: ${data.messageSubject}`);
      console.log(`💬 Message: ${data.messageContent}`);
      console.log(`⏰ Time: ${new Date().toLocaleString('en-GB')}`);
      console.log('=============================================================\n');
      
      console.log('ℹ️  Note: Email service not configured, notification logged to console');
      return true;
    }

    try {
      const subject = data.caseReference 
        ? `${data.messageType}: ${data.messageSubject} [${data.caseReference}] - Acclaim Portal`
        : `${data.messageType}: ${data.messageSubject} - Acclaim Portal`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 30px; text-align: center;">
            <div style="margin-bottom: 10px;">
              <img src="cid:logo" alt="Acclaim Credit Management & Recovery" style="height: 40px; width: auto;" />
            </div>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">New case update received</p>
            ${data.caseReference ? `<p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Case: ${data.caseReference}</p>` : ''}
          </div>
          
          <div style="padding: 30px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0;">Case Update Details</h2>
              <table style="width: 100%; border-spacing: 0;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 140px;">From:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.senderName} (External System)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Organisation:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.organisationName}</td>
                </tr>
                ${data.caseReference ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Case Reference:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.caseReference}</td>
                </tr>
                ` : ''}
                ${data.caseDetails ? `
                <tr>
                  <td colspan="2" style="padding: 15px 0 8px 0;">
                    <h3 style="color: #0f172a; margin: 0; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Case Details</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Case Name:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.caseName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Debtor Type:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Original Amount:</td>
                  <td style="padding: 4px 0; color: #1e293b;">£${data.caseDetails.originalAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Outstanding Amount:</td>
                  <td style="padding: 4px 0; color: #1e293b; font-weight: bold;">£${data.caseDetails.outstandingAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Status:</td>
                  <td style="padding: 4px 0; color: #1e293b;">
                    <span style="background: ${data.caseDetails.status === 'active' ? '#dcfce7' : '#fef3c7'}; color: ${data.caseDetails.status === 'active' ? '#166534' : '#a16207'}; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; font-weight: bold;">
                      ${data.caseDetails.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Current Stage:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                </tr>
                ${data.caseDetails.caseHandler ? `
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; color: #475569;">Case Handler:</td>
                  <td style="padding: 4px 0; color: #1e293b;">${data.caseDetails.caseHandler}</td>
                </tr>
                ` : ''}
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Update Type:</td>
                  <td style="padding: 8px 0; color: #1e293b;">
                    <span style="background: #e0f2fe; color: #0277bd; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                      ${data.messageType.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #475569;">Subject:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${data.messageSubject}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1e293b; margin-top: 0;">Update Details</h3>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #0891b2;">
                <p style="margin: 0; color: #334155; line-height: 1.6;">${data.messageContent.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #e7f3ff; border-radius: 8px; border: 1px solid #b3d9ff;">
              <p style="color: #0277bd; font-weight: 500; margin: 0 0 8px 0;">Important Notice</p>
              <p style="color: #01579b; font-size: 14px; margin: 0;">
                This is an automated update from your external case management system. 
                Please log in to the Acclaim Portal to view full case details and respond if needed.
              </p>
            </div>
          </div>
          
          <div style="background: #1e293b; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">This is an automated notification from Acclaim Credit Management & Recovery Portal</p>
            <p style="margin: 8px 0 0 0; opacity: 0.7;">To manage your notification preferences, visit your Profile settings in the portal.</p>
          </div>
        </div>
      `;

      const textContent = `
CASE UPDATE NOTIFICATION - Acclaim Portal

From: ${data.senderName} (External System)
Organisation: ${data.organisationName}
${data.caseReference ? `Case Reference: ${data.caseReference}` : ''}
${data.caseDetails ? `
CASE DETAILS:
- Case Name: ${data.caseDetails.caseName}
- Debtor Type: ${data.caseDetails.debtorType.charAt(0).toUpperCase() + data.caseDetails.debtorType.slice(1).replace('_', ' ')}
- Original Amount: £${data.caseDetails.originalAmount}
- Outstanding Amount: £${data.caseDetails.outstandingAmount}
- Status: ${data.caseDetails.status.toUpperCase()}
- Current Stage: ${data.caseDetails.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}${data.caseDetails.caseHandler ? `
- Case Handler: ${data.caseDetails.caseHandler}` : ''}
` : ''}
Update Type: ${data.messageType.toUpperCase()}
Subject: ${data.messageSubject}

Update Details:
${data.messageContent}

This is an automated update from your external case management system.
Please log in to the Acclaim Portal to view full case details and respond if needed.

To manage your notification preferences, visit your Profile settings in the portal.
      `;

      const info = await this.transporter.sendMail({
        from: '"Acclaim Credit Management & Recovery" <email@acclaim.law>',
        to: data.userEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../attached_assets/Acclaim rose.Cur_1752271300769.png'),
            cid: 'logo'
          }
        ]
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      console.log('External message notification email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send external message email notification:', error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      // Enhanced console logging for welcome emails
      console.log('\n================= WELCOME EMAIL NOTIFICATION =================');
      console.log(`📧 Welcome email would be sent to: ${data.userEmail}`);
      console.log(`👤 New User: ${data.firstName} ${data.lastName}`);
      console.log(`🔑 Username: ${data.userEmail}`);
      console.log(`⏰ Time: ${new Date().toLocaleString('en-GB')}`);
      console.log('===========================================================\n');
      
      console.log('ℹ️  Note: SMTP not configured, welcome email logged to console');
      return true;
    }

    try {
      const subject = `Welcome to the Acclaim Credit Management & Recovery Portal!`;
      const portalUrl = data.portalUrl || 'https://acclaim-api-prod-uks-001.azurewebsites.net/auth';
      let signupUrl: string;
      try {
        const u = new URL(portalUrl);
        u.pathname = '/auth/azure/signup';
        u.search = '';
        u.hash = '';
        signupUrl = u.toString();
      } catch {
        signupUrl = 'https://acclaim-api-prod-uks-001.azurewebsites.net/auth/azure/signup';
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 30px; text-align: center;">
            <div style="margin-bottom: 10px;">
              <img src="cid:logo" alt="Acclaim Credit Management & Recovery" style="height: 40px; width: auto;" />
            </div>
            <h1 style="margin: 0; font-size: 24px;">Welcome to the Acclaim Credit Management & Recovery Portal!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your account is ready</p>
          </div>
          
          <div style="padding: 30px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0;">Your Account is Ready</h2>
              <p style="color: #475569; margin-bottom: 20px;">Hello ${data.firstName},</p>
              <p style="color: #475569; margin-bottom: 20px;">Welcome to the Acclaim Credit Management & Recovery Portal! Your account has been created and you can now access the system to view and manage your cases.</p>
            </div>

            <div style="background: #e0f7f6; border: 1px solid #14b8a6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              ${data.isAdmin ? `
              <h3 style="color: #0f766e; margin-top: 0; margin-bottom: 10px;">How to sign in</h3>
              <ol style="color: #0f766e; line-height: 1.8; padding-left: 20px; margin: 0; font-size: 14px;">
                <li>Click <strong>Access the Portal</strong> below.</li>
                <li>Click <strong>"Sign in with Microsoft"</strong> and sign in with your usual Microsoft password (and MFA if required).</li>
              </ol>
              ` : `
              <h3 style="color: #0f766e; margin-top: 0; margin-bottom: 10px;">Getting started — it only takes a minute</h3>
              <ol style="color: #0f766e; line-height: 1.8; padding-left: 20px; margin: 0; font-size: 14px;">
                <li>Click <strong>Register your account</strong> below — this takes you straight to Microsoft's sign-up screen.</li>
                <li>Register using this email address and follow the on-screen steps.</li>
                <li>Once registered, return to the portal and sign in with your Microsoft account.</li>
              </ol>
              `}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              ${data.isAdmin ? `
              <a href="${portalUrl}" style="background: #14b8a6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                Access the Portal
              </a>
              ` : `
              <a href="${signupUrl}" style="background: #14b8a6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                Register your account
              </a>
              <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 13px;">Already registered? <a href="${portalUrl}" style="color: #0f766e;">Sign in here</a></p>
              `}
            </div>

            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #64748b; margin: 0; font-size: 12px;">
                If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
          
          <div style="background: #1e293b; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">This is an automated notification from Acclaim Credit Management & Recovery Portal</p>
          </div>
        </div>
      `;

      const textContent = `
Welcome to the Acclaim Credit Management & Recovery Portal!

Hello ${data.firstName},

Your account has been created and you can now access the system to view and manage your cases.

${data.isAdmin ? `How to sign in:
1. Visit ${portalUrl}
2. Click "Sign in with Microsoft" and sign in with your usual Microsoft password (and MFA if required).` : `Getting started — it only takes a minute:
1. Register your account here: ${signupUrl}
   (This takes you straight to Microsoft's sign-up screen.)
2. Register using this email address and follow the on-screen steps.
3. Once registered, sign in to the portal here: ${portalUrl}`}

If you have any questions, please contact our support team.
      `;

      const info = await this.transporter.sendMail({
        from: '"Acclaim Credit Management & Recovery" <email@acclaim.law>',
        to: data.userEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../attached_assets/Acclaim rose.Cur_1752271300769.png'),
            cid: 'logo'
          },
          ...(data.isAdmin ? [] : [{
            filename: 'Acclaim Portal User Guide.pdf',
            path: path.join(__dirname, '../attached_assets/Acclaim Portal User Guide.pdf'),
            contentType: 'application/pdf'
          }])
        ]
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      console.log('Welcome email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async sendSeminarBooking(data: {
    name: string;
    email: string;
    organisation: string;
    jobTitle?: string;
    phone?: string;
    notes?: string;
    seminar: { name: string; category: string; date?: string; time?: string; location?: string; description?: string; infoUrl?: string | null };
  }): Promise<boolean> {
    const s = data.seminar;
    const category = s.category === 'social-housing' ? 'Social Housing' : 'Employment Law';

    if (!this.initialized || !this.transporter) {
      console.log(`\n[CL BOOKING] ${data.name} <${data.email}> requested booking for: ${s.name}`);
      return true;
    }

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${CL_LOGO_HEADER}
        <div style="background:linear-gradient(135deg,#2e3192 0%,#ba1b6e 100%);background-color:#2e3192;padding:28px 40px;text-align:center;">
          <h1 style="color:white;margin:0 0 14px;font-size:22px;font-weight:800;letter-spacing:2px;">CHADWICK LAWRENCE</h1>
          <p style="color:white;margin:0;font-size:17px;font-weight:600;">Seminar Booking Request</p>
        </div>
        <div style="padding:30px 40px;background:#f8f8fc;border:1px solid #e8e8f0;">
          <div style="background:#f0f1fb;border-left:4px solid #2e3192;padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
            <p style="color:#2e3192;margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${category}</p>
            <h3 style="color:#1a1a3e;margin:0 0 10px;font-size:16px;">${s.name}</h3>
            ${s.date && s.date !== 'TBC' && s.date !== 'N/A' ? `<p style="color:#555;margin:3px 0;font-size:13px;">📅 <strong>${s.date}</strong>${s.time && s.time !== 'TBC' ? ` at ${s.time}` : ''}</p>` : ''}
            ${s.location && s.location !== 'TBC' ? `<p style="color:#555;margin:3px 0;font-size:13px;">📍 ${s.location}</p>` : ''}
          </div>
          <div style="background:white;padding:20px;border-radius:8px;border:1px solid #e8e8f0;">
            <h2 style="color:#2e3192;margin:0 0 16px;font-size:15px;border-bottom:2px solid #e8e8f0;padding-bottom:8px;">Booking Details</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr><td style="padding:6px 0;font-weight:bold;color:#555;width:130px;">Name:</td><td style="padding:6px 0;color:#1a1a3e;">${data.name}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;color:#555;">Email:</td><td style="padding:6px 0;color:#1a1a3e;">${data.email}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;color:#555;">Organisation:</td><td style="padding:6px 0;color:#1a1a3e;">${data.organisation}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;color:#555;">Telephone:</td><td style="padding:6px 0;color:#1a1a3e;">${data.phone}</td></tr>
              ${data.notes ? `<tr><td colspan="2" style="padding:12px 0 6px;font-weight:bold;color:#555;">Additional Information:</td></tr><tr><td colspan="2"><div style="background:#f8f8fc;padding:12px;border-radius:6px;border-left:3px solid #ba1b6e;color:#1a1a3e;line-height:1.6;">${data.notes.replace(/\n/g, '<br>')}</div></td></tr>` : ''}
            </table>
          </div>
          <p style="color:#777;font-size:12px;margin:20px 0 0;text-align:center;">Please respond directly to the requester at <a href="mailto:${data.email}" style="color:#2e3192;">${data.email}</a></p>
        </div>
        <div style="background:#1a1a3e;color:white;padding:16px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;">Chadwick Lawrence LLP · Yorkshire's Legal People</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.55);">Submitted via Acclaim Credit Management &amp; Recovery Portal</p>
        </div>
      </div>`;

    const textContent = `SEMINAR BOOKING REQUEST\n\nSeminar: ${s.name}\nCategory: ${category}\n${s.date && s.date !== 'TBC' ? `Date: ${s.date}${s.time && s.time !== 'TBC' ? ' at ' + s.time : ''}\n` : ''}${s.location && s.location !== 'TBC' ? `Location: ${s.location}\n` : ''}\nBooking Details:\nName: ${data.name}\nEmail: ${data.email}\nOrganisation: ${data.organisation}\n${data.jobTitle ? `Job Title: ${data.jobTitle}\n` : ''}${data.phone ? `Telephone: ${data.phone}\n` : ''}${data.notes ? `\nAdditional Information:\n${data.notes}\n` : ''}\nSubmitted via Acclaim Credit Management & Recovery Portal`;

    try {
      await this.transporter.sendMail({
        from: '"Acclaim Credit Management & Recovery" <email@acclaim.law>',
        to: 'mattperry@chadlaw.co.uk',
        replyTo: data.email,
        subject: `Seminar Booking Request – ${s.name} | Acclaim Portal`,
        text: textContent,
        html: htmlContent,
      });
      console.log('Seminar booking request email sent');
      return true;
    } catch (error) {
      console.error('Failed to send seminar booking email:', error);
      return false;
    }
  }

  async sendSeminarShare(data: {
    recipientName: string;
    recipientEmail: string;
    recipientPhone?: string;
    recipientOrganisation?: string;
    recipientJobTitle?: string;
    seminar: { name: string; category: string; date?: string; time?: string; location?: string; description?: string; infoUrl?: string | null };
    senderName: string;
    senderEmail: string;
    senderOrganisation?: string;
  }): Promise<boolean> {
    const s = data.seminar;
    const category = s.category === 'social-housing' ? 'Social Housing' : 'Employment Law';

    if (!this.initialized || !this.transporter) {
      console.log(`\n[CL SHARE] ${data.senderName} sharing "${s.name}" with ${data.recipientName} <${data.recipientEmail}>`);
      return true;
    }

    const seminarBlock = `
      <div style="background:#f0f1fb;border-left:4px solid #2e3192;padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;">
        <p style="color:#2e3192;margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${category}</p>
        <h3 style="color:#1a1a3e;margin:0 0 10px;font-size:16px;">${s.name}</h3>
        ${s.date && s.date !== 'TBC' && s.date !== 'N/A' ? `<p style="color:#555;margin:3px 0;font-size:13px;">📅 <strong>${s.date}</strong>${s.time && s.time !== 'TBC' ? ` at ${s.time}` : ''}</p>` : ''}
        ${s.location && s.location !== 'TBC' ? `<p style="color:#555;margin:3px 0;font-size:13px;">📍 ${s.location}</p>` : ''}
        ${s.description ? `<p style="color:#555;margin:10px 0 0;font-size:13px;line-height:1.5;">${s.description}</p>` : ''}
      </div>`;

    const clHeader = (title: string) => `
      ${CL_LOGO_HEADER}
      <div style="background:linear-gradient(135deg,#2e3192 0%,#ba1b6e 100%);background-color:#2e3192;padding:28px 40px;text-align:center;">
        <h1 style="color:white;margin:0 0 14px;font-size:22px;font-weight:800;letter-spacing:2px;">CHADWICK LAWRENCE</h1>
        <p style="color:white;margin:0;font-size:17px;font-weight:600;">${title}</p>
      </div>`;

    const clFooter = (sub: string) => `
      <div style="background:#1a1a3e;color:white;padding:16px 40px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;">Chadwick Lawrence LLP · Yorkshire's Legal People</p>
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.55);">${sub}</p>
      </div>`;

    const recipientHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${clHeader('A Training Session Has Been Shared With You')}
        <div style="padding:30px 40px;background:#f8f8fc;border:1px solid #e8e8f0;">
          <p style="color:#1a1a3e;font-size:15px;margin:0 0 8px;">Dear ${data.recipientName},</p>
          <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 24px;"><strong>${data.senderName}</strong>${data.senderOrganisation ? ` from <strong>${data.senderOrganisation}</strong>` : ''} thought you might be interested in the following free training session from Chadwick Lawrence, and has shared it with you through the Acclaim Client Portal.</p>
          ${seminarBlock}
          ${s.infoUrl ? `<div style="text-align:center;margin:0 0 28px;"><a href="${s.infoUrl}" style="background:linear-gradient(135deg,#2e3192,#ba1b6e);background-color:#2e3192;color:white;padding:13px 30px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">Find Out More &amp; Book →</a></div>` : ''}
          <div style="background:#e8eaf8;border-radius:8px;padding:16px 20px;">
            <p style="margin:0 0 6px;font-weight:600;color:#2e3192;font-size:12px;font-family:Arial,sans-serif;">About Acclaim</p>
            <p style="margin:0;font-size:12px;color:#555;line-height:1.6;font-family:Arial,sans-serif;">Acclaim Credit Management &amp; Recovery is part of <strong>Chadwick Lawrence LLP</strong>, Yorkshire's Legal People. The Acclaim portal is a client management platform through which Chadwick Lawrence clients manage their credit recovery and legal cases. This session was shared with you by a portal user who believed it might be of interest.</p>
          </div>
        </div>
        ${clFooter('0800 015 0340 · <a href="https://www.chadwicklawrence.co.uk" style="color:rgba(255,255,255,0.6);">chadwicklawrence.co.uk</a>')}
      </div>`;

    const notifHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${clHeader('Seminar Shared via Acclaim Portal')}
        <div style="padding:30px 40px;background:#f8f8fc;border:1px solid #e8e8f0;">
          ${seminarBlock}
          <div style="display:flex;gap:16px;">
            <div style="flex:1;background:white;padding:18px 20px;border-radius:8px;border:1px solid #e8e8f0;margin-right:8px;">
              <h3 style="color:#2e3192;margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Shared By</h3>
              <p style="margin:3px 0;font-size:13px;color:#1a1a3e;"><strong>${data.senderName}</strong></p>
              <p style="margin:3px 0;font-size:13px;color:#555;">${data.senderEmail}</p>
              ${data.senderOrganisation ? `<p style="margin:3px 0;font-size:13px;color:#555;">${data.senderOrganisation}</p>` : ''}
            </div>
            <div style="flex:1;background:white;padding:18px 20px;border-radius:8px;border:1px solid #e8e8f0;">
              <h3 style="color:#ba1b6e;margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Shared With</h3>
              <p style="margin:3px 0;font-size:13px;color:#1a1a3e;"><strong>${data.recipientName}</strong></p>
              <p style="margin:3px 0;font-size:13px;color:#555;">${data.recipientEmail}</p>
              ${data.recipientPhone ? `<p style="margin:3px 0;font-size:13px;color:#555;">${data.recipientPhone}</p>` : ''}
              ${data.recipientOrganisation ? `<p style="margin:3px 0;font-size:13px;color:#555;">${data.recipientOrganisation}</p>` : ''}
              ${data.recipientJobTitle ? `<p style="margin:3px 0;font-size:13px;color:#555;font-style:italic;">${data.recipientJobTitle}</p>` : ''}
            </div>
          </div>
        </div>
        ${clFooter('Acclaim Credit Management &amp; Recovery · Part of Chadwick Lawrence LLP')}
      </div>`;

    try {
      await Promise.all([
        this.transporter.sendMail({
          from: '"Chadwick Lawrence via Acclaim Portal" <email@acclaim.law>',
          to: data.recipientEmail,
          replyTo: data.senderEmail,
          subject: `${data.senderName} has shared a Chadwick Lawrence training session with you`,
          text: `Dear ${data.recipientName},\n\n${data.senderName} thought you might be interested in this Chadwick Lawrence training session:\n\n${s.name}\n${s.date && s.date !== 'TBC' ? `Date: ${s.date}\n` : ''}${s.location && s.location !== 'TBC' ? `Location: ${s.location}\n` : ''}${s.description ? `\n${s.description}\n` : ''}${s.infoUrl ? `\nMore information & booking: ${s.infoUrl}\n` : ''}\nAbout Acclaim: Acclaim Credit Management & Recovery is part of Chadwick Lawrence LLP, Yorkshire's Legal People.\n\n0800 015 0340 | chadwicklawrence.co.uk`,
          html: recipientHtml,
        }),
        this.transporter.sendMail({
          from: '"Acclaim Credit Management & Recovery" <email@acclaim.law>',
          to: 'mattperry@chadlaw.co.uk',
          subject: `Seminar Shared – ${s.name} | Acclaim Portal`,
          text: `Seminar shared via Acclaim Portal\n\nSeminar: ${s.name}\nShared by: ${data.senderName} (${data.senderEmail})${data.senderOrganisation ? ` · ${data.senderOrganisation}` : ''}\nShared with: ${data.recipientName} (${data.recipientEmail})`,
          html: notifHtml,
        }),
      ]);
      console.log('Seminar share emails sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send seminar share emails:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();