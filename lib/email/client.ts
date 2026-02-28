import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      // Nếu không có RESEND_API_KEY, tạo client giả để tránh crash API routes.
      // Email sẽ không được gửi, nhưng app vẫn chạy bình thường.
      // Các hàm send* trong lib/email/send.ts đã tự log lỗi khi gọi.
      // eslint-disable-next-line no-console
      console.warn(
        '[email] RESEND_API_KEY không được cấu hình. Email sẽ không được gửi trong môi trường hiện tại.',
      );

      const noopClient = {
        emails: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          async send(..._args: any[]) {
            const error = new Error('RESEND_API_KEY is not configured. Email sending is disabled.');
            // eslint-disable-next-line no-console
            console.error('[email] Thử gửi email khi chưa cấu hình RESEND_API_KEY:', error);
            return { data: null, error };
          },
        },
      } as unknown as Resend;

      resendClient = noopClient;
    } else {
      resendClient = new Resend(apiKey);
    }
  }

  return resendClient;
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return getResendClient()[prop as keyof Resend];
  },
});

// Default sender email
export const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'noreply@zfemanage.com';

// Company info for email templates
export const COMPANY_INFO = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'ZfeManage',
  email: DEFAULT_FROM,
  website: process.env.NEXT_PUBLIC_APP_URL || 'https://zfemanage.com',
};
