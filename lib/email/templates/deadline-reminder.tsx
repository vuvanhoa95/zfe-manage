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
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DeadlineReminderEmailProps {
  projectName: string;
  projectNo: string;
  deadline: Date;
  daysRemaining: number;
  projectUrl: string;
}

export const DeadlineReminderEmail = ({
  projectName = 'Dự án mẫu',
  projectNo = 'PRJ-001',
  deadline = new Date(),
  daysRemaining = 7,
  projectUrl = 'https://zfemanage.com/projects/123',
}: DeadlineReminderEmailProps) => {
  const formattedDeadline = format(deadline, 'dd/MM/yyyy', { locale: vi });
  const urgencyLevel = daysRemaining <= 3 ? 'high' : daysRemaining <= 7 ? 'medium' : 'low';
  const urgencyColor = urgencyLevel === 'high' ? '#dc2626' : urgencyLevel === 'medium' ? '#ea580c' : '#2563eb';
  const urgencyEmoji = urgencyLevel === 'high' ? '🚨' : urgencyLevel === 'medium' ? '⚠️' : '📅';

  return (
    <Html>
      <Head />
      <Preview>{urgencyEmoji} Dự án {projectNo} sắp đến deadline ({String(daysRemaining)} ngày)</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={{ ...h1, color: urgencyColor }}>
            {urgencyEmoji} Nhắc nhở deadline
          </Heading>
          
          <Text style={text}>
            Xin chào,
          </Text>
          
          <Text style={text}>
            Dự án <strong>{projectName}</strong> sắp đến deadline.
          </Text>
          
          <Section style={{ ...detailsBox, borderLeftColor: urgencyColor }}>
            <Text style={detailRow}>
              <strong>Mã dự án:</strong> {projectNo}
            </Text>
            <Text style={detailRow}>
              <strong>Tên dự án:</strong> {projectName}
            </Text>
            <Text style={detailRow}>
              <strong>Deadline:</strong> {formattedDeadline}
            </Text>
            <Text style={{ ...detailRow, color: urgencyColor, fontSize: '16px', fontWeight: 'bold' }}>
              <strong>Còn lại:</strong> {String(daysRemaining)} ngày
            </Text>
          </Section>
          
          {urgencyLevel === 'high' && (
            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠️ <strong>Khẩn cấp!</strong> Dự án sắp quá hạn. Vui lòng kiểm tra tiến độ và điều chỉnh kế hoạch nếu cần.
              </Text>
            </Section>
          )}
          
          <Section style={buttonContainer}>
            <Link href={projectUrl} style={{ ...button, backgroundColor: urgencyColor }}>
              Xem dự án
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

export default DeadlineReminderEmail;

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
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
  borderLeft: '4px solid #dc2626',
};

const detailRow = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 8px 0',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
  border: '2px solid #f59e0b',
};

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '22px',
  margin: 0,
};

const buttonContainer = {
  padding: '0 40px',
  marginTop: '32px',
};

const button = {
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
