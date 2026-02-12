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

interface QuotationCreatedEmailProps {
  quotationNo: string;
  projectName: string;
  customerName: string;
  totalAfterVat: number;
  quotationUrl: string;
  createdByName: string;
}

export const QuotationCreatedEmail = ({
  quotationNo = 'QT-260203-001',
  projectName = 'Dự án mẫu',
  customerName = 'Công ty ABC',
  totalAfterVat = 100000000,
  quotationUrl = 'https://zfemanage.com/quotations/123',
  createdByName = 'Admin',
}: QuotationCreatedEmailProps) => {
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(totalAfterVat);

  return (
    <Html>
      <Head />
      <Preview>Báo giá {quotationNo} đã được tạo cho {customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📋 Báo giá mới đã được tạo</Heading>
          
          <Text style={text}>
            Xin chào,
          </Text>
          
          <Text style={text}>
            Báo giá <strong>{quotationNo}</strong> đã được tạo bởi <strong>{createdByName}</strong>.
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
              <strong>Tổng giá trị:</strong> {formattedAmount}
            </Text>
          </Section>
          
          <Section style={buttonContainer}>
            <Link href={quotationUrl} style={button}>
              Xem báo giá
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

export default QuotationCreatedEmail;

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
  color: '#333',
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
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
};

const detailRow = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 8px 0',
};

const buttonContainer = {
  padding: '0 40px',
  marginTop: '32px',
};

const button = {
  backgroundColor: '#2563eb',
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
