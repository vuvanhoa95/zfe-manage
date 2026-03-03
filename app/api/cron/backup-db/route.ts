import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// ============================================================
// AUTO BACKUP DATABASE → GOOGLE DRIVE
// Runs via Vercel Cron: every day at 2:00 AM UTC (9:00 AM VN)
// ============================================================

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1exJsqnYg4Qp_JJQVTbO54GCvlXDaBjC9';
const CRON_SECRET = process.env.CRON_SECRET || '';

/**
 * POST /api/cron/backup-db
 * Called by Vercel Cron or manually by admin
 */
export async function POST(request: NextRequest) {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { prisma } = await import('@/lib/prisma');

        // ─── 1. Export all data from database ───────────────────
        const [
            users,
            customers,
            projects,
            quotations,
            quotationLines,
            tasks,
            cashFlows,
            paymentMilestones,
            catalogItems,
            companyProfile,
        ] = await Promise.all([
            prisma.user.findMany({
                select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
            }),
            prisma.customer.findMany(),
            prisma.project.findMany(),
            prisma.quotation.findMany(),
            prisma.quotationLine.findMany(),
            prisma.task.findMany(),
            prisma.cashFlow.findMany(),
            prisma.paymentMilestone.findMany(),
            prisma.catalogItem.findMany(),
            prisma.companyProfile.findMany(),
        ]);

        const backupData = {
            meta: {
                exportedAt: new Date().toISOString(),
                version: '1.0',
                project: 'ZfeManage',
                environment: process.env.NODE_ENV || 'production',
            },
            data: {
                users,
                customers,
                projects,
                quotations,
                quotationLines,
                tasks,
                cashFlows,
                paymentMilestones,
                catalogItems,
                companyProfile,
            },
            summary: {
                users: users.length,
                customers: customers.length,
                projects: projects.length,
                quotations: quotations.length,
                quotationLines: quotationLines.length,
                tasks: tasks.length,
                cashFlows: cashFlows.length,
                paymentMilestones: paymentMilestones.length,
                catalogItems: catalogItems.length,
            },
        };

        const jsonContent = JSON.stringify(backupData, null, 2);

        // ─── 2. Upload to Google Drive ───────────────────────────
        // Parse service account credentials
        const serviceAccountKey = JSON.parse(
            process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'
        );

        const auth = new google.auth.GoogleAuth({
            credentials: serviceAccountKey,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // Generate filename: backup_2026-03-03_09-00.json
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10); // 2026-03-03
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-'); // 09-00
        const fileName = `backup_${dateStr}_${timeStr}.json`;

        // Upload file to Google Drive
        const { Readable } = await import('stream');
        const stream = Readable.from([Buffer.from(jsonContent, 'utf-8')]);

        const driveResponse = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [DRIVE_FOLDER_ID],
                mimeType: 'application/json',
            },
            media: {
                mimeType: 'application/json',
                body: stream,
            },
        });

        // ─── 3. Cleanup old backups (keep last 30 days) ──────────
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const oldFiles = await drive.files.list({
            q: `'${DRIVE_FOLDER_ID}' in parents and createdTime < '${thirtyDaysAgo.toISOString()}' and name contains 'backup_'`,
            fields: 'files(id, name, createdTime)',
        });

        let deletedCount = 0;
        if (oldFiles.data.files && oldFiles.data.files.length > 0) {
            await Promise.all(
                oldFiles.data.files.map(async (file) => {
                    if (file.id) {
                        await drive.files.delete({ fileId: file.id });
                        deletedCount++;
                    }
                })
            );
        }

        return NextResponse.json({
            success: true,
            message: `✅ Backup thành công`,
            details: {
                fileName,
                fileId: driveResponse.data.id,
                driveFolder: `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`,
                summary: backupData.summary,
                oldFilesDeleted: deletedCount,
                backupTime: now.toISOString(),
            },
        });
    } catch (error: any) {
        console.error('[CRON] Backup failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Backup thất bại',
                details: error.stack,
            },
            { status: 500 }
        );
    }
}

// Also allow GET for manual testing in browser
export async function GET(request: NextRequest) {
    return POST(request);
}
