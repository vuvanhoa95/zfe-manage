import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Batch endpoint to fetch all initial data needed for Quotation Editor
 * Reduces network overhead by combining multiple requests into one
 * 
 * Returns: { customers, projects, outsourceStaff (from Users) }
 */
export async function GET() {
    try {
        // Fetch all data in parallel for better performance
        const [customers, projects, users] = await Promise.all([
            // Customers - simple list, no search params needed for initial load
            prisma.customer.findMany({
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    address: true,
                    taxCode: true,
                    email: true,
                    phone: true,
                },
            }),
            
            // Projects - all active projects
            prisma.project.findMany({
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    projectNo: true,
                    name: true,
                    description: true,
                    notes: true,
                    location: true,
                    customerId: true,
                    totalArea: true,
                },
            }),
            
            // Users ACTIVE - thay thế OutsourcingStaff
            prisma.user.findMany({
                where: { status: 'ACTIVE' },
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true,
                },
            }),
        ]);

        // Map users sang outsourceStaff interface để tương thích
        const outsourceStaff = users.map((u) => ({
            id: u.id,
            name: u.name || u.email,
            discipline: u.department || undefined,
            isActive: true,
        }));

        return NextResponse.json({
            success: true,
            data: {
                customers,
                projects,
                outsourceStaff,
            },
        });
    } catch (error) {
        console.error('Failed to fetch initial data:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch initial data',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
