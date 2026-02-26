import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDocx } from '@/lib/docx-generator';
import { formatVND } from '@/lib/number-to-words-vn';
import { formatVietnameseDate } from '@/lib/utils';
import { QuotationPreviewData } from '@/types/quotation';
import type { PaymentMilestone, QuotationLine } from '@prisma/client';

// POST /api/quotations/[id]/export-docx
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        // Fetch quotation with all relations
        const quotation = await prisma.quotation.findUnique({
            where: { id: resolvedParams.id },
            include: {
                customer: true,
                lines: {
                    orderBy: { order: 'asc' },
                },
                paymentMilestones: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!quotation) {
            return NextResponse.json(
                { success: false, error: 'Quotation not found' },
                { status: 404 }
            );
        }

        // Fetch company profile
        const company = await prisma.companyProfile.findUnique({
            where: { id: 1 },
        });

        if (!company) {
            return NextResponse.json(
                { success: false, error: 'Company profile not found' },
                { status: 404 }
            );
        }

        // Prepare preview data
        const dateInfo = formatVietnameseDate(quotation.date);

        const previewData: QuotationPreviewData = {
            location: quotation.location,
            date: {
                day: dateInfo.day,
                month: dateInfo.month,
                year: dateInfo.year,
            },
            title: quotation.title,
            introText: quotation.introText || undefined,
            customer: {
                name: quotation.customer.name,
                address: quotation.customer.address || undefined,
                taxCode: quotation.customer.taxCode || undefined,
            },
            projectName: quotation.projectName,
            projectItem: quotation.projectItem || undefined,
            projectNotes: quotation.projectNotes || undefined,
            scopeText: quotation.scopeText || undefined,
            deliverablesHtml: quotation.deliverablesText,
            lines: quotation.lines.map((line: QuotationLine) => ({
                section: line.section || undefined,
                itemNo: line.itemNo || undefined,
                title: line.title,
                qty: line.qty || undefined,
                unit: line.unit || undefined,
                unitPrice: line.unitPrice || undefined,
                total: line.total,
                note: line.note || undefined,
                isGroupHeader: line.isGroupHeader,
            })),
            totalBeforeVat: quotation.totalBeforeVat,
            totalBeforeVatFormatted: formatVND(quotation.totalBeforeVat),
            vatRate: quotation.vatRate,
            vatAmount: quotation.vatAmount,
            vatAmountFormatted: formatVND(quotation.vatAmount),
            totalAfterVat: quotation.totalAfterVat,
            totalAfterVatFormatted: formatVND(quotation.totalAfterVat),
            totalInWords: quotation.totalInWords || '',
            scheduleText: quotation.scheduleText || undefined,
            paymentMilestones: quotation.paymentMilestones.map((m: PaymentMilestone) => ({
                no: m.no,
                title: m.title,
                percent: m.percent,
                description: m.description || undefined,
            })),
            company: {
                name: company.name,
                address: company.address,
                taxCode: company.taxCode,
                email: company.email,
                website: company.website || undefined,
                phone: company.phone,
                logoUrl: company.logoUrl || undefined,
                projectSlogan: company.projectSlogan || undefined,
                signerName: company.signerName,
                signerTitle: company.signerTitle,
            },
            quotationNo: quotation.quotationNo,
        };

        // Generate DOCX
        const buffer = await generateDocx(previewData);

        // Return file
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${quotation.quotationNo}.docx"`,
            },
        });
    } catch (error) {
        console.error('Error exporting DOCX:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to export DOCX' },
            { status: 500 }
        );
    }
}
