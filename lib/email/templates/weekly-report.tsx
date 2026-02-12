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

interface WeeklyReportEmailProps {
  weekStart: string;
  weekEnd: string;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  quotationsCreated: number;
  quotationsAccepted: number;
  projectsActive: number;
  dashboardUrl: string;
}

export const WeeklyReportEmail = ({
  weekStart = '30/01/2026',
  weekEnd = '05/02/2026',
  totalRevenue = 250000000,
  totalProfit = 50000000,
  profitMargin = 20,
  quotationsCreated = 5,
  quotationsAccepted = 2,
  projectsActive = 8,
  dashboardUrl = 'https://zfemanage.com/dashboard',
}: WeeklyReportEmailProps) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);

  return (
    <Html>
      <Head />
      <Preview>📊 Báo cáo tuần {weekStart} - {weekEnd}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📊 Báo cáo tuần</Heading>
          
          <Text style={subtitle}>
            {weekStart} - {weekEnd}
          </Text>
          
          <Text style={text}>
            Xin chào,
          </Text>
          
          <Text style={text}>
            Dưới đây là tóm tắt hoạt động kinh doanh trong tuần vừa qua:
          </Text>
          
          {/* Revenue & Profit */}
          <Section style={statsSection}>
            <Heading style={sectionTitle}>💰 Doanh thu & Lợi nhuận</Heading>
            
            <Section style={statCard}>
              <Text style={statLabel}>Tổng doanh thu</Text>
              <Text style={statValue}>{formatCurrency(totalRevenue)}</Text>
            </Section>
            
            <Section style={statCard}>
              <Text style={statLabel}>Lợi nhuận</Text>
              <Text style={statValue}>{formatCurrency(totalProfit)}</Text>
            </Section>
            
            <Section style={statCard}>
              <Text style={statLabel}>Tỷ suất lợi nhuận</Text>
              <Text style={statValue}>{profitMargin}%</Text>
            </Section>
          </Section>
          
          {/* Quotations */}
          <Section style={statsSection}>
            <Heading style={sectionTitle}>📋 Báo giá</Heading>
            
            <Section style={statRow}>
              <Text style={statRowLabel}>Báo giá tạo mới:</Text>
              <Text style={statRowValue}>{quotationsCreated}</Text>
            </Section>
            
            <Section style={statRow}>
              <Text style={statRowLabel}>Báo giá được chấp nhận:</Text>
              <Text style={statRowValue}>{quotationsAccepted}</Text>
            </Section>
            
            <Section style={statRow}>
              <Text style={statRowLabel}>Tỷ lệ chốt deal:</Text>
              <Text style={statRowValue}>
                {quotationsCreated > 0 ? Math.round((quotationsAccepted / quotationsCreated) * 100) : 0}%
              </Text>
            </Section>
          </Section>
          
          {/* Projects */}
          <Section style={statsSection}>
            <Heading style={sectionTitle}>🚀 Dự án</Heading>
            
            <Section style={statRow}>
              <Text style={statRowLabel}>Dự án đang triển khai:</Text>
              <Text style={statRowValue}>{projectsActive}</Text>
            </Section>
          </Section>
          
          <Section style={buttonContainer}>
            <Link href={dashboardUrl} style={button}>
              Xem Dashboard
            </Link>
          </Section>
          
          <Text style={footer}>
            Email này được gửi tự động vào mỗi thứ Hai hàng tuần từ hệ thống ZfeManage.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WeeklyReportEmail;

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
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 0 0',
  padding: '0 40px',
};

const subtitle = {
  color: '#64748b',
  fontSize: '16px',
  margin: '8px 0 24px 0',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const statsSection = {
  margin: '32px 40px',
};

const sectionTitle = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const statCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
  borderLeft: '4px solid #2563eb',
};

const statLabel = {
  color: '#64748b',
  fontSize: '13px',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const statValue = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: 0,
};

const statRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid #e2e8f0',
};

const statRowLabel = {
  color: '#475569',
  fontSize: '14px',
  margin: 0,
};

const statRowValue = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: 0,
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
