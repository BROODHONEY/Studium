const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = async () => {
  // For development: Use Ethereal (fake SMTP) if no email configured
  if (process.env.NODE_ENV !== 'production' && !process.env.EMAIL_USER) {
    const testAccount = await nodemailer.createTestAccount();
    console.log('\n📧 ===== ETHEREAL EMAIL SETUP =====');
    console.log('📧 Using Ethereal Email for testing');
    console.log('📧 View emails at: https://ethereal.email/messages');
    console.log('📧 Login:', testAccount.user);
    console.log('📧 Password:', testAccount.pass);
    console.log('📧 ==================================\n');
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
  
  // For production: Use Gmail or other SMTP
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

let transporter;

// Initialize transporter
(async () => {
  transporter = await createTransporter();
})();

// Email templates
const emailTemplates = {
  demoRequest: (data) => ({
    to: process.env.ADMIN_EMAIL || 'rproshan11@gmail.com',
    subject: `New Demo Request from ${data.institutionName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #A5A6F6;">New Demo Request - Studi+</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Institution Details</h3>
          <p><strong>Institution Name:</strong> ${data.institutionName}</p>
          <p><strong>Contact Name:</strong> ${data.contactName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
          <p><strong>Student Count:</strong> ${data.studentCount || 'Not provided'}</p>
          <p><strong>Message:</strong> ${data.message || 'None'}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Received on: ${new Date().toLocaleString()}
        </p>
        <div style="margin-top: 30px; padding: 20px; background: #A5A6F6; border-radius: 8px; text-align: center;">
          <p style="margin: 0 0 15px 0; color: white;">
            <strong>Review & Approve This Request</strong>
          </p>
          <a href="${process.env.FRONTEND_URL}/admin/review?token=${data.approvalToken}" 
             style="display: inline-block; background: white; color: #A5A6F6; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Review Request
          </a>
        </div>
      </div>
    `
  }),

  packageSelection: (data) => ({
    to: data.email,
    subject: 'Welcome to Studi+ - Choose Your Package',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #A5A6F6;">Welcome to Studi+!</h2>
        <p>Hi ${data.contactName},</p>
        <p>Thank you for your interest in Studi+. We're excited to help transform ${data.institutionName}'s learning experience.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Choose Your Package</h3>
          <p>Click the link below to select your package and complete the setup:</p>
          <a href="${process.env.FRONTEND_URL}/onboarding?token=${data.token}" 
             style="display: inline-block; background: #A5A6F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
            Select Package & Continue
          </a>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <p style="margin: 0; color: #856404;">
            <strong>Note:</strong> This link is valid for 7 days.
          </p>
        </div>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          If you have any questions, feel free to reply to this email.
        </p>

        <p style="color: #666;">
          Best regards,<br>
          The Studi+ Team
        </p>
      </div>
    `
  }),

  institutionCreated: (data) => ({
    to: data.email,
    subject: 'Your Studi+ Institution is Ready!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #A5A6F6;">🎉 Your Institution is Ready!</h2>
        <p>Hi ${data.contactName},</p>
        <p>Great news! Your Studi+ institution has been successfully created.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Institution Details</h3>
          <p><strong>Institution Name:</strong> ${data.institutionName}</p>
          <p><strong>Subdomain:</strong> ${data.subdomain}.studiplus.com</p>
          <p><strong>Plan:</strong> ${data.plan}</p>
          <p><strong>Admin Email:</strong> ${data.email}</p>
        </div>

        <div style="margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL}/login?institution=${data.subdomain}" 
             style="display: inline-block; background: #A5A6F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Access Your Institution
          </a>
        </div>

        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Next Steps:</h4>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li>Create your admin account</li>
            <li>Set up departments</li>
            <li>Invite teachers and students</li>
            <li>Start creating groups and courses</li>
          </ol>
        </div>

        <p style="color: #666;">
          Best regards,<br>
          The Studi+ Team
        </p>
      </div>
    `
  }),

  demoApproved: (data) => ({
    to: data.email,
    subject: 'Your Studi+ Demo Request Has Been Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #A5A6F6;">🎉 Demo Request Approved!</h2>
        <p>Hi ${data.contactName},</p>
        <p>Great news! Your demo request for ${data.institutionName} has been approved.</p>
        
        ${data.adminMessage ? `
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Message from Admin:</h3>
          <p style="color: #333; font-style: italic;">${data.adminMessage}</p>
        </div>
        ` : ''}

        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Next Steps</h3>
          <p>Click the link below to select your package and complete the setup:</p>
          <a href="${process.env.FRONTEND_URL}/onboarding?token=${data.token}" 
             style="display: inline-block; background: #A5A6F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
            Select Package & Continue
          </a>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <p style="margin: 0; color: #856404;">
            <strong>Note:</strong> This link is valid for 7 days.
          </p>
        </div>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          If you have any questions, feel free to reply to this email.
        </p>

        <p style="color: #666;">
          Best regards,<br>
          The Studi+ Team
        </p>
      </div>
    `
  }),

  demoRejected: (data) => ({
    to: data.email,
    subject: 'Update on Your Studi+ Demo Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #A5A6F6;">Demo Request Update</h2>
        <p>Hi ${data.contactName},</p>
        <p>Thank you for your interest in Studi+ for ${data.institutionName}.</p>
        
        ${data.adminMessage ? `
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Message from Our Team:</h3>
          <p style="color: #333;">${data.adminMessage}</p>
        </div>
        ` : `
        <p>After careful review, we're unable to proceed with your demo request at this time.</p>
        `}

        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Have Questions?</h3>
          <p>If you'd like to discuss this further or have any questions, please don't hesitate to reach out to us.</p>
          <p style="margin: 0;">
            <strong>Email:</strong> <a href="mailto:${process.env.ADMIN_EMAIL || 'rproshan11@gmail.com'}" style="color: #A5A6F6;">${process.env.ADMIN_EMAIL || 'rproshan11@gmail.com'}</a>
          </p>
        </div>

        <p style="color: #666;">
          Best regards,<br>
          The Studi+ Team
        </p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (template, data) => {
  try {
    // Ensure transporter is initialized
    if (!transporter) {
      transporter = await createTransporter();
    }
    
    const emailConfig = emailTemplates[template](data);
    const info = await transporter.sendMail({
      from: `"Studi+" <${process.env.EMAIL_USER || 'noreply@studiplus.com'}>`,
      ...emailConfig
    });
    
    console.log('✅ Email sent:', info.messageId);
    
    // For Ethereal, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('\n📧 ===== EMAIL PREVIEW =====');
      console.log('📧 Preview URL:', previewUrl);
      console.log('📧 Copy this URL to view the email in your browser');
      console.log('📧 ==========================\n');
    }
    
    return { 
      success: true, 
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  getTransporter: () => transporter
};
