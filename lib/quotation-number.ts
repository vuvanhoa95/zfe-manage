import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';

/**
 * Generate quotation number in format: QT-YYMMDD-XXX
 * Example: QT-260203-001
 */
export async function generateQuotationNumber(): Promise<string> {
  const today = new Date();
  const datePrefix = format(today, 'yyMMdd'); // Format: YYMMDD
  const quotationPrefix = `QT-${datePrefix}`;

  // Find the latest quotation number for today
  const latestQuotation = await prisma.quotation.findFirst({
    where: {
      quotationNo: {
        startsWith: quotationPrefix,
      },
    },
    orderBy: {
      quotationNo: 'desc',
    },
    select: {
      quotationNo: true,
    },
  });

  let sequence = 1;

  if (latestQuotation) {
    // Extract sequence number from quotationNo (last 3 digits)
    const lastSequence = parseInt(latestQuotation.quotationNo.slice(-3), 10);
    sequence = lastSequence + 1;
  }

  // Format sequence with leading zeros (3 digits)
  const sequenceStr = sequence.toString().padStart(3, '0');

  return `${quotationPrefix}-${sequenceStr}`;
}

/**
 * Check if quotation number already exists
 */
export async function quotationNumberExists(quotationNo: string): Promise<boolean> {
  const existing = await prisma.quotation.findUnique({
    where: { quotationNo },
    select: { id: true },
  });

  return !!existing;
}

/**
 * Generate unique quotation number (with retry if collision)
 */
export async function generateUniqueQuotationNumber(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const quotationNo = await generateQuotationNumber();
    const exists = await quotationNumberExists(quotationNo);

    if (!exists) {
      return quotationNo;
    }

    attempts++;
    
    // If collision, wait a bit and retry
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Fallback: add random suffix if still colliding
  const baseNumber = await generateQuotationNumber();
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${baseNumber}-${randomSuffix}`;
}
