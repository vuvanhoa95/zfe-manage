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

interface UserInvitationEmailProps {
  userName: string;
  adminName: string;
  loginUrl: string;
  role: string;
}

export const UserInvitationEmail = ({
  userName,
  adminName,
  loginUrl,
  role,
}: UserInvitationEmailProps) => {
  const previewText = `Chào mừng ${userName} đến với hệ thống ZFENIX Hub`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>ZFENIX HUB</Heading>
            <Text style={company}>Quản lý báo giá & Dự án</Text>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Xin chào <strong>{userName}</strong>,</Text>
            <Text style={paragraph}>
              Admin <strong>{adminName}</strong> đã thêm bạn vào hệ thống ZFENIX Hub với vai trò <strong>{role}</strong>.
            </Text>
            <Text style={paragraph}>
              Bạn có thể đăng nhập vào hệ thống ngay bây giờ. Khi đăng nhập lần đầu, hệ thống sẽ yêu cầu bạn <strong>đặt mật khẩu mới</strong> để đảm bảo bảo mật.
            </Text>
            
            <Section style={buttonContainer}>
              <Link style={button} href={loginUrl}>
                Đăng nhập & Đặt mật khẩu
              </Link>
            </Section>

            <Hr style={hr} />
            <Text style={footer}>
              Nếu bạn gặp khó khăn khi đăng nhập, vui lòng liên hệ với quản trị viên qua email hỗ trợ.
            </Text>
            <Text style={footer}>© 2026 ZFENIX. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default UserInvitationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const h1 = {
  color: '#178AF3',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '1px',
};

const company = {
  color: '#666',
  fontSize: '14px',
  margin: '4px 0 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
};

const content = {
  padding: '0 20px',
};

const paragraph = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '35px 0',
};

const button = {
  backgroundColor: '#178AF3',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};
