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
 * Flow:
 * 1. GPT generates best English search keywords from Vietnamese project info
 * 2. Serper.dev (Google Images API) fetches real image results
 * 3. Returns list of image URLs ready to use
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

        // ── Step 1: AI generates optimal English search keywords ──────────
        const aiKeywordsPrompt = `You are a BIM/construction project image search expert.
Given Vietnamese project info, generate the BEST English search query for Google Images to find a relevant, high-quality photo of this project or similar buildings.

Project name: ${projectName || '(not provided)'}
Description: ${description || '(not provided)'}
Location: ${location || '(not provided)'}

Rules:
- Output ONLY the search query string, nothing else
- Use English keywords for better Google Images results
- Focus on: building type, architectural style, location context
- Include "architecture" or "building" or "construction" for better image quality
- Max 8 words
- Example: "modern high-rise BIM apartment Ho Chi Minh City architecture"`;

        const keywords = (
            await generateCompletion(
                [{ role: 'user', content: aiKeywordsPrompt }],
                { temperature: 0.3, maxTokens: 50, model: 'gpt-4o-mini' }
            )
        ).trim().replace(/^["']|["']$/g, '');

        // ── Step 2: Search Google Images via Serper.dev ───────────────────
        const serperApiKey = process.env.SERPER_API_KEY;
        if (!serperApiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Chưa cấu hình SERPER_API_KEY. Vui lòng thêm vào biến môi trường Vercel.',
                    keywords,
                },
                { status: 503 }
            );
        }

        const serperRes = await fetch('https://google.serper.dev/images', {
            method: 'POST',
            headers: {
                'X-API-KEY': serperApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: keywords,
                num: 12,
                gl: 'vn',   // Vietnam region for more relevant results
            }),
        });

        if (!serperRes.ok) {
            const errorText = await serperRes.text();
            console.error('[ImageSearch] Serper API error:', errorText);
            return NextResponse.json(
                { success: false, error: `Lỗi API tìm kiếm: ${serperRes.status}`, keywords },
                { status: 500 }
            );
        }

        const serperData = await serperRes.json();

        // ── Step 3: Map results to clean format ───────────────────────────
        const images: ImageResult[] = (serperData.images || [])
            .filter((img: any) => img.imageUrl && img.imageUrl.startsWith('http'))
            .slice(0, 10)
            .map((img: any) => ({
                url: img.imageUrl as string,
                thumbnailUrl: img.thumbnailUrl || img.imageUrl,
                title: img.title || '',
                source: img.source || '',
                width: img.imageWidth,
                height: img.imageHeight,
            }));

        return NextResponse.json({
            success: true,
            keywords,
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
