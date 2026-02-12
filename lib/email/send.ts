import { resend, DEFAULT_FROM } from './client';
import { QuotationCreatedEmail } from './templates/quotation-created';
import { QuotationAcceptedEmail } from './templates/quotation-accepted';
import { DeadlineReminderEmail } from './templates/deadline-reminder';
import { WeeklyReportEmail } from './templates/weekly-report';
import { render } from '@react-email/components';

// Email sending functions

export async function sendQuotationCreatedEmail({
  to,
  quotationNo,
  projectName,
  customerName,
  totalAfterVat,
  quotationUrl,
  createdByName,
}: {
  to: string | string[];
  quotationNo: string;
  projectName: string;
  customerName: string;
  totalAfterVat: number;
  quotationUrl: string;
  createdByName: string;
}) {
  try {
    const emailHtml = await render(
      QuotationCreatedEmail({
        quotationNo,
        projectName,
        customerName,
        totalAfterVat,
        quotationUrl,
        createdByName,
      })
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject: `📋 Báo giá ${quotationNo} đã được tạo`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending quotation created email:', error);
      throw error;
    }

    console.log('Quotation created email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send quotation created email:', error);
    return { success: false, error };
  }
}

export async function sendQuotationAcceptedEmail({
  to,
  quotationNo,
  projectName,
  customerName,
  totalAfterVat,
  quotationUrl,
}: {
  to: string | string[];
  quotationNo: string;
  projectName: string;
  customerName: string;
  totalAfterVat: number;
  quotationUrl: string;
}) {
  try {
    const emailHtml = await render(
      QuotationAcceptedEmail({
        quotationNo,
        projectName,
        customerName,
        totalAfterVat,
        quotationUrl,
      })
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject: `🎉 Báo giá ${quotationNo} đã được chấp nhận!`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending quotation accepted email:', error);
      throw error;
    }

    console.log('Quotation accepted email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send quotation accepted email:', error);
    return { success: false, error };
  }
}

export async function sendDeadlineReminderEmail({
  to,
  projectName,
  projectNo,
  deadline,
  daysRemaining,
  projectUrl,
}: {
  to: string | string[];
  projectName: string;
  projectNo: string;
  deadline: Date;
  daysRemaining: number;
  projectUrl: string;
}) {
  try {
    const emailHtml = await render(
      DeadlineReminderEmail({
        projectName,
        projectNo,
        deadline,
        daysRemaining,
        projectUrl,
      })
    );

    const urgencyEmoji = daysRemaining <= 3 ? '🚨' : daysRemaining <= 7 ? '⚠️' : '📅';

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject: `${urgencyEmoji} Nhắc nhở: Dự án ${projectNo} còn ${daysRemaining} ngày`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending deadline reminder email:', error);
      throw error;
    }

    console.log('Deadline reminder email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send deadline reminder email:', error);
    return { success: false, error };
  }
}

export async function sendWeeklyReportEmail({
  to,
  weekStart,
  weekEnd,
  totalRevenue,
  totalProfit,
  profitMargin,
  quotationsCreated,
  quotationsAccepted,
  projectsActive,
  dashboardUrl,
}: {
  to: string | string[];
  weekStart: string;
  weekEnd: string;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  quotationsCreated: number;
  quotationsAccepted: number;
  projectsActive: number;
  dashboardUrl: string;
}) {
  try {
    const emailHtml = await render(
      WeeklyReportEmail({
        weekStart,
        weekEnd,
        totalRevenue,
        totalProfit,
        profitMargin,
        quotationsCreated,
        quotationsAccepted,
        projectsActive,
        dashboardUrl,
      })
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject: `📊 Báo cáo tuần ${weekStart} - ${weekEnd}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending weekly report email:', error);
      throw error;
    }

    console.log('Weekly report email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send weekly report email:', error);
    return { success: false, error };
  }
}

// Helper function to get admin emails
export async function getAdminEmails(): Promise<string[]> {
  // TODO: Query database for admin users
  // For now, return from environment variable
  const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;
  return adminEmail ? [adminEmail] : [];
}

// Helper function to build URLs
export function buildQuotationUrl(quotationId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/quotations/${quotationId}`;
}

export function buildProjectUrl(projectId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/projects/${projectId}`;
}

export function buildDashboardUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/dashboard`;
}
