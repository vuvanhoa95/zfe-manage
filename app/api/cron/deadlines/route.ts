import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  sendDeadlineReminderEmail, 
  getAdminEmails, 
  buildProjectUrl 
} from '@/lib/email/send';
import { addDays, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Check for CRON_SECRET to secure the endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    const twoWeeksLater = addDays(today, 14);

    // Fetch projects with upcoming deadlines (within 14 days)
    const upcomingProjects = await prisma.project.findMany({
      where: {
        status: 'IN_PROGRESS',
        endDate: {
          gte: today,
          lte: twoWeeksLater,
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        endDate: true,
      },
    });

    const results = [];
    const admins = await getAdminEmails();

    if (admins.length > 0) {
      for (const project of upcomingProjects) {
        if (!project.endDate) continue;

        const daysRemaining = differenceInDays(project.endDate, today);
        
        // Only send reminders at specific thresholds: 1, 3, 7, 14 days
        const thresholds = [1, 3, 7, 14];
        
        if (thresholds.includes(daysRemaining)) {
          await sendDeadlineReminderEmail({
            to: admins,
            projectName: project.name,
            projectNo: project.code || 'N/A',
            deadline: project.endDate,
            daysRemaining,
            projectUrl: buildProjectUrl(project.id),
          });
          
          results.push({ id: project.id, name: project.name, daysRemaining, status: 'sent' });
        } else {
          results.push({ id: project.id, name: project.name, daysRemaining, status: 'skipped' });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deadline reminder cron executed. Processed ${upcomingProjects.length} projects.`,
      details: results
    });
  } catch (error: any) {
    console.error('Deadline reminder cron failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute deadline reminder cron',
      details: error.message
    }, { status: 500 });
  }
}
