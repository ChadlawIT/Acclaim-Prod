import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
              <h3 style="color: #0f766e; margin-top: 0; margin-bottom: 10px;">How to sign in for the first time</h3>
              <ol style="color: #0f766e; line-height: 1.8; padding-left: 20px; margin: 0; font-size: 14px;">
                <li>Click <strong>Access the Portal</strong> below.</li>
                <li>Click <strong>"Sign in with Microsoft"</strong> on the login page.</li>
                <li>On the Microsoft page, click <strong>"No account? Create one!"</strong> and register using this email address.</li>
                <li>Once registered, return to the portal and sign in with your Microsoft account.</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://acclaim-api-prod-uks-001.azurewebsites.net/auth" style="background: #14b8a6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                Access the Portal
              </a>
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

How to sign in for the first time:
1. Visit https://acclaim-api-prod-uks-001.azurewebsites.net/auth
2. Click "Sign in with Microsoft" on the login page.
3. On the Microsoft page, click "No account? Create one!" and register using this email address.
4. Once registered, return to the portal and sign in with your Microsoft account.

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
          {
            filename: 'Acclaim Portal User Guide.pdf',
            path: path.join(__dirname, '../attached_assets/Acclaim Portal User Guide.pdf'),
            contentType: 'application/pdf'
          }
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
}

export const emailService = new EmailService();