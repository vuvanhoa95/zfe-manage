# Email Setup Instructions

## 1. Create Resend Account

1. Go to https://resend.com
2. Sign up for free account (100 emails/day free tier)
3. Verify your email
4. Get your API key from: https://resend.com/api-keys

## 2. Add Domain (Optional - for production)

For development, you can use Resend's test domain.

For production:
1. Go to https://resend.com/domains
2. Add your domain
3. Add DNS records (SPF, DKIM, DMARC)
4. Verify domain

## 3. Configure Environment Variables

Add to your `.env` file:

```bash
# Email (Resend)
RESEND_API_KEY="re_your_actual_api_key_here"
RESEND_FROM_EMAIL="noreply@yourdomain.com"  # or use test: onboarding@resend.dev
ADMIN_EMAIL="your-email@example.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # or your production URL
```

## 4. Test Email Sending

You can test email templates at: http://localhost:3000/api/email/test

## 5. Email Templates

Available templates:
- `quotation-created.tsx` - Sent when new quotation is created
- `quotation-accepted.tsx` - Sent when quotation is accepted
- `deadline-reminder.tsx` - Sent for project deadline reminders
- `weekly-report.tsx` - Sent every Monday with weekly stats

## 6. Sending Emails

```typescript
import { sendQuotationCreatedEmail } from '@/lib/email/send';

await sendQuotationCreatedEmail({
  to: 'customer@example.com',
  quotationNo: 'QT-260203-001',
  projectName: 'Sample Project',
  customerName: 'ABC Company',
  totalAfterVat: 100000000,
  quotationUrl: 'https://yourapp.com/quotations/123',
  createdByName: 'Admin',
});
```

## 7. Cron Jobs (Vercel)

For weekly reports and deadline reminders, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 8 * * 1"
    },
    {
      "path": "/api/cron/deadline-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## 8. Cost Estimation

- Free tier: 100 emails/day, 3,000/month
- Pro plan: $20/month for 50,000 emails
- For typical usage: ~$20/month should be sufficient

## Troubleshooting

### Email not sending
1. Check RESEND_API_KEY is correct
2. Check FROM email is verified
3. Check Resend dashboard for errors

### Email in spam
1. Setup SPF, DKIM, DMARC records
2. Use verified domain
3. Avoid spam trigger words

### Rate limiting
1. Free tier: 100/day limit
2. Upgrade to Pro if needed
3. Implement queue for bulk emails
