import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const items = await prisma.catalogItem.findMany({
            where: {
                isActive: true,
                ...(category ? { category } : {}),
            },
            orderBy: {
                order: 'asc',
            },
        });

        return NextResponse.json({ success: true, data: items });
    } catch (error: any) {
        console.error('Failed to fetch catalog items:', error);
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
        const item = await prisma.catalogItem.create({
            data: {
                category: body.category,
                title: body.title,
                unit: body.unit,
                defaultPrice: body.defaultPrice,
                description: body.description,
                order: body.order || 0,
            },
        });

        return NextResponse.json({ success: true, data: item });
    } catch (error: any) {
        console.error('Failed to create catalog item:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error?.message || 'Internal Server Error' 
            }, 
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        const item = await prisma.catalogItem.update({
            where: { id },
            data,
        });

        return NextResponse.json({ success: true, data: item });
    } catch (error) {
        console.error('Failed to update catalog item:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    try {
        await prisma.catalogItem.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete catalog item:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
