import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get current user session with role
 */
export async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return null;
    }

    return {
        id: (session.user as any).id as string,
        email: session.user.email as string,
        name: session.user.name as string,
        role: (session.user as any).role as string | null,
    };
}

/**
 * Get user's role in a specific project
 */
export async function getProjectMemberRole(userId: string, projectId: string): Promise<string | null> {
    try {
        const membership = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId,
                },
            },
            select: {
                role: true,
            },
        });

        return membership?.role || null;
    } catch (error) {
        console.error('Failed to get project member role', error);
        return null;
    }
}

/**
 * Check if user has access to a project
 */
export async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    // Check if user is project creator
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdById: true },
    });

    if (project?.createdById === userId) {
        return true;
    }

    // Check if user is project member
    const membership = await prisma.projectMember.findUnique({
        where: {
            projectId_userId: {
                projectId,
                userId,
            },
        },
    });

    return !!membership;
}
