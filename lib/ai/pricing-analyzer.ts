import { prisma } from '@/lib/prisma';
import { generateCompletion, parseAIJSON } from './openai';
import type { PricingSuggestion, PricingSuggestionRequest } from '@/types/ai';

const PRICING_SYSTEM_PROMPT = `You are an expert pricing analyst for BIM consulting services in Vietnam.
Your task is to analyze historical pricing data and suggest optimal pricing ranges.

Rules:
1. Always return valid JSON in this exact format:
{
  "min": <number>,
  "avg": <number>,
  "max": <number>,
  "confidence": <0-1>,
  "reasoning": "<explanation in Vietnamese>"
}

2. Consider:
   - Customer segment (new vs. returning)
   - Project size/complexity
   - Regional pricing differences
   - Market trends

3. Confidence score:
   - 0.9-1.0: High confidence (5+ similar items)
   - 0.7-0.9: Medium confidence (2-4 similar items)
   - 0.5-0.7: Low confidence (1 item or extrapolated)
   - <0.5: Very uncertain (no data)

4. Always respond in Vietnamese for reasoning.`;

export async function analyzePricing(
  request: PricingSuggestionRequest
): Promise<PricingSuggestion> {
  const { itemTitle, customerId, projectSize, location } = request;

  // Step 1: Query similar items from database
  const similarItems = await findSimilarItems(itemTitle);

  // Step 2: Get customer history (if provided)
  let customerInfo = null;
  if (customerId) {
    customerInfo = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        name: true,
        location: true,
        quotations: {
          select: {
            totalBeforeVat: true,
            totalAfterVat: true,
            status: true,
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Step 3: Build context for AI
  const historicalContext = similarItems.map((item, idx) => 
    `${idx + 1}. "${item.title}" - ${item.unitPrice?.toLocaleString('vi-VN')} VNĐ/${item.unit || 'm²'} (Khách: ${item.customerName}, Ngày: ${item.date})`
  ).join('\n');

  const customerContext = customerInfo 
    ? `Khách hàng: ${customerInfo.name}
Vị trí: ${customerInfo.location || 'N/A'}
Lịch sử: ${customerInfo.quotations.length} báo giá (${customerInfo.quotations.filter(q => q.status === 'ACCEPTED').length} thành công)`
    : 'Khách hàng mới (chưa có lịch sử)';

  const userPrompt = `Phân tích và gợi ý giá cho hạng mục: "${itemTitle}"

📊 DỮ LIỆU LỊCH SỬ (${similarItems.length} hạng mục tương tự):
${historicalContext || 'Không có dữ liệu lịch sử'}

👤 THÔNG TIN KHÁCH HÀNG:
${customerContext}

🏗️ THÔNG TIN DỰ ÁN:
- Quy mô: ${projectSize ? `${projectSize} m²` : 'Chưa xác định'}
- Vị trí: ${location || 'Chưa xác định'}

Hãy gợi ý mức giá tối ưu (Min/Avg/Max) và giải thích lý do.`;

  // Step 4: Call AI
  const aiResponse = await generateCompletion(
    [
      { role: 'system', content: PRICING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      temperature: 0.3, // Low temperature for consistent pricing
      maxTokens: 500,
      responseFormat: 'json_object',
    }
  );

  const parsed = parseAIJSON<{
    min: number;
    avg: number;
    max: number;
    confidence: number;
    reasoning: string;
  }>(aiResponse);

  if (!parsed) {
    throw new Error('Failed to parse AI pricing response');
  }

  // Step 5: Return structured response
  return {
    min: parsed.min,
    avg: parsed.avg,
    max: parsed.max,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
    sampleCount: similarItems.length,
    historicalItems: similarItems.slice(0, 5).map(item => ({
      title: item.title,
      price: item.unitPrice || 0,
      customer: item.customerName,
      date: item.date,
    })),
  };
}

// Helper: Find similar items in database (fuzzy match)
async function findSimilarItems(itemTitle: string): Promise<Array<{
  title: string;
  unitPrice: number | null;
  unit: string | null;
  customerName: string;
  date: Date;
}>> {
  // Search for similar items using fuzzy matching
  const quotations = await prisma.quotation.findMany({
    where: {
      status: { in: ['SENT', 'ACCEPTED'] }, // Only use real quotations
    },
    include: {
      lines: {
        where: {
          isChargeable: true,
          unitPrice: { not: null },
        },
      },
      customer: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50, // Analyze last 50 quotations
  });

  const allItems: Array<{
    title: string;
    unitPrice: number | null;
    unit: string | null;
    customerName: string;
    date: Date;
  }> = [];

  for (const quotation of quotations) {
    for (const line of quotation.lines) {
      // Simple fuzzy match - can be improved with Levenshtein distance
      const similarity = calculateSimilarity(
        itemTitle.toLowerCase(),
        line.title.toLowerCase()
      );

      if (similarity > 0.5) { // 50% similarity threshold
        allItems.push({
          title: line.title,
          unitPrice: line.unitPrice,
          unit: line.unit,
          customerName: quotation.customer.name,
          date: quotation.date,
        });
      }
    }
  }

  // Sort by most recent and return top 10
  return allItems
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);
}

// Simple similarity calculation (can use more advanced algorithms)
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      matchCount++;
    }
  }
  
  return matchCount / Math.max(words1.length, words2.length);
}
