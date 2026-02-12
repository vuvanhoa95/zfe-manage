import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not defined. Email sending will fail at runtime.');
      // Create a dummy client that will fail when actually used
      resendClient = new Resend('dummy_key');
    } else {
      resendClient = new Resend(process.env.RESEND_API_KEY);
    }
  }
  return resendClient;
}

export const resend = new Proxy({} as Resend, {
  get(target, prop) {
    return getResendClient()[prop as keyof Resend];
  }
});

// Default sender email
export const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'noreply@zfemanage.com';

// Company info for email templates
export const COMPANY_INFO = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'ZfeManage',
  email: DEFAULT_FROM,
  website: process.env.NEXT_PUBLIC_APP_URL || 'https://zfemanage.com',
};
