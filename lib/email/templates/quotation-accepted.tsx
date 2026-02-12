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
} from '@react-email/components';
import * as React from 'react';

interface QuotationAcceptedEmailProps {
  quotationNo: string;
  projectName: string;
  customerName: string;
  totalAfterVat: number;
  quotationUrl: string;
}

export const QuotationAcceptedEmail = ({
  quotationNo = 'QT-260203-001',
  projectName = 'Dự án mẫu',
  customerName = 'Công ty ABC',
  totalAfterVat = 100000000,
  quotationUrl = 'https://zfemanage.com/quotations/123',
}: QuotationAcceptedEmailProps) => {
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(totalAfterVat);

  return (
    <Html>
      <Head />
      <Preview>🎉 Báo giá {quotationNo} đã được chấp nhận!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Báo giá đã được chấp nhận!</Heading>
          
          <Text style={text}>
            Xin chào,
          </Text>
          
          <Text style={text}>
            Chúc mừng! Báo giá <strong>{quotationNo}</strong> đã được khách hàng chấp nhận.
          </Text>
          
          <Section style={detailsBox}>
            <Text style={detailRow}>
              <strong>Số báo giá:</strong> {quotationNo}
            </Text>
            <Text style={detailRow}>
              <strong>Khách hàng:</strong> {customerName}
            </Text>
            <Text style={detailRow}>
              <strong>Dự án:</strong> {projectName}
            </Text>
            <Text style={detailRow}>
              <strong>Giá trị hợp đồng:</strong> {formattedAmount}
            </Text>
          </Section>
          
          <Section style={actionBox}>
            <Text style={actionTitle}>📌 Các bước tiếp theo:</Text>
            <Text style={actionItem}>1. Tạo dự án từ báo giá này</Text>
            <Text style={actionItem}>2. Lập kế hoạch thanh toán</Text>
            <Text style={actionItem}>3. Bắt đầu triển khai</Text>
          </Section>
          
          <Section style={buttonContainer}>
            <Link href={quotationUrl} style={button}>
              Xem chi tiết
            </Link>
          </Section>
          
          <Text style={footer}>
            Email này được gửi tự động từ hệ thống ZfeManage.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default QuotationAcceptedEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#16a34a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const detailsBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
  borderLeft: '4px solid #16a34a',
};

const detailRow = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 8px 0',
};

const actionBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
};

const actionTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const actionItem = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 4px 0',
};

const buttonContainer = {
  padding: '0 40px',
  marginTop: '32px',
};

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  marginTop: '32px',
};
