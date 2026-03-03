import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCompletion } from '@/lib/ai/openai';

interface GeneratedSubTask {
    title: string;
    discipline?: string;
    estimatedDays?: number;
}

interface GeneratedTask {
    title: string;
    description?: string;
    phase?: string;
    discipline?: string;
    priority?: string;
    estimatedDays?: number;
    subtasks?: GeneratedSubTask[];
}

/**
 * POST /api/ai/generate-tasks
 * Body: { projectName, description, location, totalArea, chatContext?, customPrompt? }
 * Returns: { tasks: GeneratedTask[] }
 *
 * - chatContext: nội dung user đã nhập trong chat để làm rõ yêu cầu
 * - customPrompt: prompt đầy đủ (override mọi thứ, client tự build)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json() as {
            projectName?: string;
            description?: string;
            location?: string;
            totalArea?: number;
            chatContext?: string;
            customPrompt?: string;
        };

        const { projectName, description, location, totalArea, chatContext, customPrompt } = body;

        if (!projectName?.trim()) {
            return NextResponse.json({ error: 'Cần nhập tên dự án' }, { status: 400 });
        }

        // Nếu client đã build prompt đầy đủ (có chatContext bên trong) → dùng luôn
        // Ngược lại build prompt mặc định + chatContext nếu có
        const prompt = customPrompt || `Bạn là chuyên gia BIM với 15 năm kinh nghiệm tại Việt Nam.
Tạo danh sách công việc BIM chi tiết cho dự án sau:

=== THÔNG TIN DỰ ÁN ===
Tên dự án: ${projectName}
${description ? `Mô tả: ${description}` : ''}
${location ? `Vị trí: ${location}` : ''}
${totalArea ? `Diện tích: ${totalArea.toLocaleString('vi-VN')} m²` : ''}
${chatContext ? `\n=== YÊU CẦU BỔ SUNG TỪ KHÁCH HÀNG ===\n${chatContext}` : ''}

Tạo 5-8 công việc cha (giai đoạn chính), mỗi công việc có 3-5 subtask.
Giai đoạn BIM thường gặp: Khảo sát, Thiết kế kiến trúc, Kết cấu, MEP, Coordination, Shopdrawing, As-built.
Bộ môn: ARC (kiến trúc), STR (kết cấu), MEP (cơ điện), CIV (hạ tầng).

Trả về JSON array (KHÔNG markdown, KHÔNG giải thích):
[
  {
    "title": "Tên giai đoạn",
    "description": "Mô tả ngắn 1 câu",
    "phase": "Khảo sát | Thiết kế | Shopdrawing | ...",
    "discipline": "ARC|STR|MEP|ALL",
    "priority": "HIGH|MEDIUM|LOW",
    "estimatedDays": 14,
    "subtasks": [
      { "title": "Tên subtask", "discipline": "ARC", "estimatedDays": 5 }
    ]
  }
]`;

        const response = await generateCompletion(
            [{ role: 'user', content: prompt }],
            { temperature: 0.35, maxTokens: 2200, model: 'gpt-4o' }
        );

        let tasks: GeneratedTask[] = [];
        try {
            const cleaned = response.trim()
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '');
            tasks = JSON.parse(cleaned);
            if (!Array.isArray(tasks)) tasks = [];
        } catch {
            return NextResponse.json({ error: 'AI trả về dữ liệu không hợp lệ' }, { status: 500 });
        }

        return NextResponse.json({ success: true, tasks });
    } catch (error: any) {
        console.error('[GenerateTasks] Error:', error);
        return NextResponse.json({ error: error.message || 'Không thể tạo tasks' }, { status: 500 });
    }
}
