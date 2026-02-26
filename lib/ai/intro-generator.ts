import { prisma } from '@/lib/prisma';
import { generateCompletion } from './openai';
import type { IntroGenerationRequest, IntroGenerationResponse } from '@/types/ai';

const INTRO_SYSTEM_PROMPT = `You are a professional Vietnamese business writer specializing in construction and BIM consulting quotations.
Your task is to write compelling, professional introduction paragraphs for quotations.

Rules:
1. Always write in formal Vietnamese business language
2. Length: 150-200 words (3-4 paragraphs)
3. Structure:
   - Paragraph 1: Greeting and reference to the project
   - Paragraph 2: Brief company introduction and expertise
   - Paragraph 3: Value proposition and commitment
   - Closing: Professional sign-off

4. Tone: Professional, confident, but warm

5. Always return valid JSON:
{
  "introText": "<generated introduction>",
  "confidence": <0-1>,
  "wordCount": <number>
}

6. Personalize based on:
   - Customer name and relationship history
   - Project type and complexity
   - Company's relevant experience

7. Avoid:
   - Generic templates
   - Overly sales-heavy language
   - Technical jargon (keep it accessible)
   - Spelling errors`;

export async function generateIntroText(
  request: IntroGenerationRequest
): Promise<IntroGenerationResponse> {
  const { customerId, projectName, projectNotes, totalArea } = request;

  // Step 1: Fetch company profile (hardcoded for now, can be from settings)
  const companyProfile = {
    name: 'ZFENIX',
    fullName: 'Công ty TNHH Tư vấn BIM ZFENIX',
    expertise: 'Tư vấn BIM, thiết kế kiến trúc, kỹ thuật xây dựng',
    experience: '10+ năm kinh nghiệm',
    strengths: 'Chuyên sâu về BIM, đội ngũ kỹ sư giàu kinh nghiệm, cam kết chất lượng',
  };

  // Step 2: Fetch customer data
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      name: true,
      location: true,
      quotations: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  // Step 3: Build context
  const isReturningCustomer = customer.quotations.length > 0;
  const successfulProjects = customer.quotations.filter((q: { status: string }) => q.status === 'ACCEPTED').length;

  const customerContext = isReturningCustomer
    ? `Khách hàng thân thiết với ${customer.quotations.length} báo giá trước đó (${successfulProjects} dự án thành công)`
    : 'Khách hàng mới';

  const projectContext = `
Dự án: ${projectName}
${totalArea ? `Quy mô: ${totalArea} m²` : ''}
${projectNotes ? `Ghi chú: ${projectNotes}` : ''}
`.trim();

  const userPrompt = `Viết lời mở đầu cho báo giá:

📋 **THÔNG TIN KHÁCH HÀNG:**
- Tên: ${customer.name}
- Vị trí: ${customer.location || 'Chưa xác định'}
- Mối quan hệ: ${customerContext}

🏗️ **THÔNG TIN DỰ ÁN:**
${projectContext}

🏢 **THÔNG TIN CÔNG TY:**
- Tên: ${companyProfile.fullName}
- Chuyên môn: ${companyProfile.expertise}
- Kinh nghiệm: ${companyProfile.experience}
- Điểm mạnh: ${companyProfile.strengths}

Hãy viết lời mở đầu chuyên nghiệp, thể hiện sự trân trọng với khách hàng${isReturningCustomer ? ' (khách hàng thân thiết)' : ''} và tự tin về năng lực của công ty.`;

  // Step 4: Call AI
  const aiResponse = await generateCompletion(
    [
      { role: 'system', content: INTRO_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    {
      temperature: 0.7, // Higher temperature for creative writing
      maxTokens: 600,
      responseFormat: 'json_object',
    }
  );

  // Step 5: Parse AI response
  const parsed = JSON.parse(aiResponse);

  if (!parsed.introText) {
    throw new Error('Failed to generate intro text');
  }

  // Step 6: Calculate word count
  const wordCount = parsed.introText.split(/\s+/).length;

  return {
    introText: parsed.introText,
    confidence: parsed.confidence || 0.85,
    wordCount: wordCount,
  };
}
