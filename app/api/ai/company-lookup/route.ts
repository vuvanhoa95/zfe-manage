import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCompletion } from '@/lib/ai/openai';

export interface CompanyInfo {
    name: string;
    shortName?: string;
    taxCode?: string;
    address?: string;
    province?: string;
    phone?: string;
    email?: string;
    website?: string;
    confidence: number;
    source?: string;
}

/**
 * POST /api/ai/company-lookup
 * Body: { query: string } — tên công ty user đang gõ
 * Returns: { companies: CompanyInfo[] }
 *
 * Strategy:
 * 1. Serper.dev search Google: "[query] mã số thuế địa chỉ Vietnam"
 * 2. GPT bóc tách thông tin từ search results
 * 3. Trả về 2-5 gợi ý công ty để user chọn
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query } = await req.json() as { query?: string };

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ success: true, companies: [] });
        }

        const serperApiKey = process.env.SERPER_API_KEY;
        if (!serperApiKey) {
            return NextResponse.json({ success: false, error: 'Chưa cấu hình SERPER_API_KEY', companies: [] });
        }

        // ── Step 1: Tìm kiếm thông tin công ty trên Google ────────────────
        const searchQuery = `"${query.trim()}" mã số thuế địa chỉ công ty Vietnam`;

        const serperRes = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': serperApiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: searchQuery, num: 8, gl: 'vn', hl: 'vi' }),
        });

        if (!serperRes.ok) {
            return NextResponse.json({ success: false, error: 'Lỗi tìm kiếm', companies: [] });
        }

        const serperData = await serperRes.json();

        // Gộp organic results + knowledge graph thành text
        const snippets = [
            serperData.knowledgeGraph
                ? `${serperData.knowledgeGraph.title || ''} - ${serperData.knowledgeGraph.description || ''}`
                : '',
            ...(serperData.organic || []).slice(0, 6).map((item: any) =>
                `[${item.title}] ${item.snippet || ''} URL: ${item.link || ''}`
            ),
        ].filter(Boolean).join('\n\n');

        if (!snippets.trim()) {
            return NextResponse.json({ success: true, companies: [] });
        }

        // ── Step 2: GPT bóc tách thông tin từ search snippets ────────────
        const extractPrompt = `Từ kết quả tìm kiếm Google dưới đây về công ty "${query}", hãy bóc tách thông tin và trả về JSON array.

Kết quả tìm kiếm:
${snippets}

Yêu cầu:
- Tìm TỐI ĐA 4 công ty khác nhau có liên quan đến "${query}"
- Mỗi công ty phải có ít nhất tên đầy đủ
- Ưu tiên các công ty Việt Nam
- Chỉ lấy thông tin CÓ TRONG kết quả, không được đoán
- Trường "confidence": 0.9 nếu chắc chắn, 0.6 nếu không chắc

Trả về JSON array (KHÔNG có markdown):
[
  {
    "name": "Tên đầy đủ theo đăng ký kinh doanh",
    "shortName": "Tên ngắn/thương hiệu (nếu có)",
    "taxCode": "Mã số thuế 10 hoặc 13 số (nếu có)",
    "address": "Địa chỉ đăng ký (nếu có)",
    "province": "Tỉnh/TP (Hà Nội, TP HCM, Đà Nẵng...)",
    "phone": "Số điện thoại (nếu có)",
    "email": "Email công ty (nếu có)",
    "website": "Website (nếu có)",
    "confidence": 0.9,
    "source": "google"
  }
]

Nếu không tìm thấy công ty nào, trả về: []`;

        const aiResponse = await generateCompletion(
            [{ role: 'user', content: extractPrompt }],
            { temperature: 0.1, maxTokens: 800, model: 'gpt-4o-mini' }
        );

        // Parse JSON từ response AI
        let companies: CompanyInfo[] = [];
        try {
            const cleaned = aiResponse.trim()
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '');
            companies = JSON.parse(cleaned);
            if (!Array.isArray(companies)) companies = [];
            // Lọc bỏ entries không có tên
            companies = companies.filter(c => c.name?.trim());
        } catch {
            companies = [];
        }

        return NextResponse.json({ success: true, companies });

    } catch (error: any) {
        console.error('[CompanyLookup] Error:', error);
        return NextResponse.json({ success: false, error: error.message, companies: [] });
    }
}
