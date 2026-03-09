import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Hr,
    Img,
} from '@react-email/components';

interface PasswordResetRequestEmailProps {
    userName: string;
    resetUrl: string;
}

export const PasswordResetRequestEmail = ({
    userName,
    resetUrl,
}: PasswordResetRequestEmailProps) => {
    const previewText = `Đặt lại mật khẩu tài khoản ZFENIX của bạn`;
    const year = new Date().getFullYear();

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Gradient accent bar */}
                    <Section style={accentBar} />

                    {/* Header */}
                    <Section style={header}>
                        <Img
                            src="https://zfenixmanage.site/logo-trans.png"
                            alt="ZFENIX"
                            width="140"
                            height="auto"
                            style={{ display: 'block', margin: '0 auto', height: 'auto' }}
                        />
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        <Heading style={h1}>Đặt lại mật khẩu</Heading>

                        <Text style={paragraph}>
                            Xin chào <strong>{userName}</strong>,
                        </Text>
                        <Text style={paragraph}>
                            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ZFENIX của bạn.
                            Nhấn nút bên dưới để tạo mật khẩu mới:
                        </Text>

                        <Section style={buttonContainer}>
                            <Link style={button} href={resetUrl}>
                                Đặt lại mật khẩu →
                            </Link>
                        </Section>

                        <Text style={expiryNote}>
                            ⏱️ Link này sẽ hết hạn sau <strong>24 giờ</strong>.
                        </Text>

                        <Hr style={hr} />

                        <Text style={securityNote}>
                            🔒 <strong>Lưu ý bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu,
                            vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.
                        </Text>

                        <Text style={fallbackText}>
                            Nếu nút không hoạt động, copy và dán link sau vào trình duyệt:
                        </Text>
                        <Text style={linkText}>
                            {resetUrl}
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            © {year} ZFENIX. All rights reserved.
                        </Text>
                        <Link href="https://www.zfenix.com" style={footerLink}>
                            WWW.ZFENIX.COM
                        </Link>
                        <Text style={footerSubText}>
                            This is an automated email. Please do not reply directly.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default PasswordResetRequestEmail;

// ── Styles ──────────────────────────────────────────────────────────────────

const main = {
    backgroundColor: '#F8FAFC',
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const container = {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    maxWidth: '580px',
    borderRadius: '16px',
    overflow: 'hidden' as const,
    boxShadow: '0 4px 24px rgba(0,21,41,0.08)',
};

const accentBar = {
    height: '5px',
    background: 'linear-gradient(90deg, #001529, #178AF3, #38BDF8)',
};

const header = {
    padding: '36px 44px 16px',
    textAlign: 'center' as const,
};

const content = {
    padding: '8px 44px 36px',
};

const h1 = {
    color: '#001529',
    fontSize: '26px',
    fontWeight: '700' as const,
    margin: '0 0 20px',
    lineHeight: '1.3',
};

const paragraph = {
    color: '#475569',
    fontSize: '15px',
    lineHeight: '1.7',
    margin: '0 0 16px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '30px 0',
};

const button = {
    display: 'inline-block',
    backgroundColor: '#001529',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '15px 48px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600' as const,
    letterSpacing: '0.3px',
    boxShadow: '0 4px 14px rgba(0,21,41,0.2)',
};

const expiryNote = {
    color: '#94a3b8',
    fontSize: '13px',
    lineHeight: '1.5',
    textAlign: 'center' as const,
    margin: '0 0 24px',
};

const hr = {
    borderColor: '#e2e8f0',
    margin: '24px 0',
};

const securityNote = {
    backgroundColor: '#FFF7ED',
    borderLeft: '4px solid #FB923C',
    borderRadius: '0 8px 8px 0',
    padding: '14px 18px',
    color: '#92400e',
    fontSize: '13px',
    lineHeight: '1.6',
    margin: '0 0 20px',
};

const fallbackText = {
    color: '#94a3b8',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '0 0 6px',
};

const linkText = {
    color: '#178AF3',
    fontSize: '11px',
    lineHeight: '1.5',
    wordBreak: 'break-all' as const,
    margin: '0',
};

const footer = {
    padding: '28px 44px',
    textAlign: 'center' as const,
    borderTop: '1px solid #e2e8f0',
};

const footerText = {
    color: '#94a3b8',
    fontSize: '11px',
    margin: '0 0 10px',
};

const footerLink = {
    display: 'inline-block',
    color: '#178AF3',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600' as const,
    letterSpacing: '1.5px',
};

const footerSubText = {
    color: '#cbd5e1',
    fontSize: '10px',
    margin: '12px 0 0',
};
