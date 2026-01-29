import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const activeOnly = searchParams.get('activeOnly') === 'true';

        const items = await prisma.unit.findMany({
            where: {
                ...(activeOnly ? { isActive: true } : {}),
                ...(category ? { category } : {}),
            },
            orderBy: {
                order: 'asc',
            },
        });

        return NextResponse.json({ success: true, data: items });
    } catch (error: any) {
        console.error('Failed to fetch units:', error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Internal Server Error',
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const item = await prisma.unit.create({
            data: {
                name: body.name,
                symbol: body.symbol,
                description: body.description,
                category: body.category,
                order: body.order || 0,
                isActive: body.isActive !== undefined ? body.isActive : true,
            },
        });

        return NextResponse.json({ success: true, data: item });
    } catch (error: any) {
        console.error('Failed to create unit:', error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Internal Server Error',
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        const item = await prisma.unit.update({
            where: { id },
            data,
        });

        return NextResponse.json({ success: true, data: item });
    } catch (error: any) {
        console.error('Failed to update unit:', error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Internal Server Error',
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    try {
        await prisma.unit.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to delete unit:', error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message || 'Internal Server Error',
            },
            { status: 500 }
        );
    }
}
