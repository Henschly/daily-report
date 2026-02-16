import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async sendEmail({ to, subject, html, text }: SendEmailOptions) {
    if (!config.email.user || !config.email.password) {
      console.log('Email not configured, skipping send:', { to, subject });
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"Daily Report System" <${config.email.user}>`,
        to,
        subject,
        html,
        text,
      });
      console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error('Email send error:', error);
    }
  }

  async sendDailyReminder(email: string, name: string, date: string) {
    await this.sendEmail({
      to: email,
      subject: 'Daily Report Reminder',
      html: `
        <h2>Daily Report Reminder</h2>
        <p>Hi ${name},</p>
        <p>This is a reminder to submit your daily report for <strong>${date}</strong>.</p>
        <p>Please log in to the system to submit your report.</p>
        <p>Best regards,<br/>Daily Report System</p>
      `,
    });
  }

  async sendFeedbackNotification(email: string, name: string, reportDate: string) {
    await this.sendEmail({
      to: email,
      subject: 'New Feedback on Your Report',
      html: `
        <h2>New Feedback</h2>
        <p>Hi ${name},</p>
        <p>You have received new feedback on your report for <strong>${reportDate}</strong>.</p>
        <p>Please log in to the system to view the feedback.</p>
        <p>Best regards,<br/>Daily Report System</p>
      `,
    });
  }

  async sendLockNotification(email: string, name: string, reportDate: string) {
    await this.sendEmail({
      to: email,
      subject: 'Report Locked',
      html: `
        <h2>Report Locked</h2>
        <p>Hi ${name},</p>
        <p>Your report for <strong>${reportDate}</strong> has been locked by HR.</p>
        <p>Please log in to the system for more details.</p>
        <p>Best regards,<br/>Daily Report System</p>
      `,
    });
  }

  async sendUnlockNotification(email: string, name: string, reportDate: string) {
    await this.sendEmail({
      to: email,
      subject: 'Report Unlocked',
      html: `
        <h2>Report Unlocked</h2>
        <p>Hi ${name},</p>
        <p>Your report for <strong>${reportDate}</strong> has been unlocked.</p>
        <p>You can now edit your report if needed.</p>
        <p>Best regards,<br/>Daily Report System</p>
      `,
    });
  }

  async sendDeadlineWarning(email: string, name: string, deadline: string) {
    await this.sendEmail({
      to: email,
      subject: 'Report Deadline Approaching',
      html: `
        <h2>Deadline Warning</h2>
        <p>Hi ${name},</p>
        <p>Your report deadline is approaching: <strong>${deadline}</strong>.</p>
        <p>Please submit your report before the deadline.</p>
        <p>Best regards,<br/>Daily Report System</p>
      `,
    });
  }
}

export const emailService = new EmailService();
