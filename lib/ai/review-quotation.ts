import { QuotationFormData } from '@/types/quotation';
import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      // Return a dummy client for build time
      return new OpenAI({
        apiKey: 'dummy-key-for-build',
      });
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface ReviewSuggestion {
  type: 'grammar' | 'pricing' | 'missing' | 'improvement';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  suggestion: string;
  location: string;
}

export async function reviewQuotationContent(data: QuotationFormData): Promise<{
    score: number;
    suggestions: ReviewSuggestion[];
}> {
  const prompt = `
    Bạn là một chuyên gia tư vấn BIM và kiểm soát chất lượng báo giá.
    Hãy phân tích nội dung báo giá dưới đây và đưa ra các gợi ý cải thiện.
    
    DỮ LIỆU BÁO GIÁ:
    - Tiêu đề: ${data.title}
    - Dự án: ${data.projectName}
    - Lời mở đầu: ${data.introText}
    - Phạm vi: ${data.scopeText}
    - Sản phẩm: ${data.deliverablesText}
    - Đơn giá: ${JSON.stringify(data.lines.map(l => ({ title: l.title, price: l.unitPrice })))}
    
    YÊU CẦU PHÂN TÍCH:
    1. Kiểm tra chính tả và ngữ pháp tiếng Việt.
    2. Kiểm tra tính nhất quán giữa tên dự án và nội dung mô tả.
    3. Phát hiện thông tin còn thiếu (ví dụ: chưa có tiến độ, chưa có sản phẩm bàn giao cụ thể).
    4. Gợi ý về mức giá nếu có vẻ quá thấp hoặc quá cao so với thị trường BIM (nếu có thể nhận định).
    
    TRẢ VỀ JSON:
    {
      "score": 0-100,
      "suggestions": [
        {
          "type": "grammar|pricing|missing|improvement",
          "severity": "high|medium|low",
          "title": "Tiêu đề ngắn gọn",
          "message": "Mô tả vấn đề",
          "suggestion": "Cách sửa cụ thể",
          "location": "Phần nào trong báo giá"
        }
      ]
    }
  `;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        score: 0,
        suggestions: [],
      };
    }
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Bạn là chuyên gia thẩm định báo giá chuyên nghiệp." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      score: result.score || 0,
      suggestions: result.suggestions || []
    };
  } catch (error) {
    console.error('AI Review error:', error);
    throw new Error('Không thể thực hiện AI Review lúc này.');
  }
}
