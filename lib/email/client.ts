import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      // For build time, create a dummy client that won't throw
      // This allows the build to succeed even without API key
      resendClient = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build');
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
