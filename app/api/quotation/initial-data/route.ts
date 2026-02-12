import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Batch endpoint to fetch all initial data needed for Quotation Editor
 * Reduces network overhead by combining multiple requests into one
 * 
 * Returns: { customers, projects, outsourceStaff }
 */
export async function GET() {
    try {
        // Fetch all data in parallel for better performance
        const [customers, projects, outsourceStaff] = await Promise.all([
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
            
            // Outsource Staff - only active staff
            prisma.outsourcingStaff.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    discipline: true,
                    hourlyRate: true,
                    dailyRate: true,
                    isActive: true,
                },
            }),
        ]);

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
