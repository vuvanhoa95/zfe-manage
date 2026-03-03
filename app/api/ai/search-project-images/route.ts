import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCompletion } from '@/lib/ai/openai';

export interface ImageResult {
    url: string;
    thumbnailUrl: string;
    title: string;
    source: string;
    width?: number;
    height?: number;
}

/**
 * POST /api/ai/search-project-images
 * Body: { projectName, description, location }
 * Returns: { keywords, images: ImageResult[] }
 *
 * Strategy 2-query:
 * 1. Query 1 (Primary): Giữ NGUYÊN tên dự án + vị trí → tìm đúng công trình đó
 * 2. Query 2 (Context): AI phân tích loại công trình → tìm ảnh tương tự bổ sung
 * 3. Merge: ưu tiên ảnh từ query 1, bổ sung từ query 2
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { projectName, description, location } = body as {
            projectName?: string;
            description?: string;
            location?: string;
        };

        if (!projectName && !description) {
            return NextResponse.json(
                { success: false, error: 'Cần nhập tên dự án hoặc mô tả để tìm kiếm ảnh' },
                { status: 400 }
            );
        }

        const serperApiKey = process.env.SERPER_API_KEY;
        if (!serperApiKey) {
            return NextResponse.json(
                { success: false, error: 'Chưa cấu hình SERPER_API_KEY. Vui lòng thêm vào biến môi trường Vercel.' },
                { status: 503 }
            );
        }

        // ── Step 1: Tạo 2 queries ─────────────────────────────────────────

        // Query 1: TÊN DỰ ÁN CHÍNH XÁC — không để AI tóm tắt lại
        // Giữ nguyên tên để search đúng công trình đó
        const primaryQuery = [projectName, location].filter(Boolean).join(' ');

        // Query 2: AI phân tích loại công trình để bổ sung ảnh tương tự
        const aiContextPrompt = `Analyze this Vietnamese BIM/construction project and output ONLY 3-5 English keywords describing the building type, style, and location for Google image search.

Project name: ${projectName || ''}
Description: ${description || ''}
Location: ${location || ''}

Rules:
- Output ONLY the keywords, nothing else, no quotes
- Keep location name in English (e.g. "Ho Chi Minh City", "Hanoi", "Da Nang")
- Focus on building TYPE (apartment, office, villa, school, hospital, etc.)
- Add "Vietnam" if location not clear

Examples:
- "Landmark 81 Sài Gòn" → office tower Ho Chi Minh City Vietnam
- "Vinhomes Ocean Park Hưng Yên" → luxury villa resort Hung Yen Vietnam  
- "Nhà phố Bình Thạnh" → shophouse Binh Thanh district Vietnam`;

        // Chạy song song: AI lấy context + search query 1
        const searchSerper = async (query: string, num: number) => {
            const res = await fetch('https://google.serper.dev/images', {
                method: 'POST',
                headers: {
                    'X-API-KEY': serperApiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ q: query, num, gl: 'vn' }),
            });
            if (!res.ok) return [];
            const data = await res.json();
            return (data.images || []).filter(
                (img: any) => img.imageUrl && img.imageUrl.startsWith('http')
            );
        };

        const [aiContext, primaryResults] = await Promise.all([
            generateCompletion(
                [{ role: 'user', content: aiContextPrompt }],
                { temperature: 0.1, maxTokens: 30, model: 'gpt-4o-mini' }
            ).then(r => r.trim().replace(/^["']|["']$/g, '')),
            searchSerper(primaryQuery, 8),
        ]);

        // ── Step 2: Search query 2 (loại công trình) để bổ sung ─────────
        const contextResults = aiContext
            ? await searchSerper(`${aiContext} architecture`, 6)
            : [];

        // ── Step 3: Merge — ưu tiên ảnh tên dự án cụ thể ─────────────────
        const seenUrls = new Set<string>();
        const dedup = (arr: any[]) => arr.filter(img => {
            if (seenUrls.has(img.imageUrl)) return false;
            seenUrls.add(img.imageUrl);
            return true;
        });

        const merged = [
            ...dedup(primaryResults),   // ưu tiên query tên dự án
            ...dedup(contextResults),   // bổ sung loại công trình
        ].slice(0, 10);

        const images: ImageResult[] = merged.map((img: any) => ({
            url: img.imageUrl as string,
            thumbnailUrl: img.thumbnailUrl || img.imageUrl,
            title: img.title || '',
            source: img.source || '',
            width: img.imageWidth,
            height: img.imageHeight,
        }));

        return NextResponse.json({
            success: true,
            // Hiển thị cả 2 keyword để user biết AI đang tìm gì
            keywords: primaryQuery + (aiContext ? ` | ${aiContext}` : ''),
            images,
        });

    } catch (error: any) {
        console.error('[ImageSearch] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Không thể tìm kiếm ảnh' },
            { status: 500 }
        );
    }
}
