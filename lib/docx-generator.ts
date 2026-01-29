import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { readFileSync } from 'fs';
import { join } from 'path';
import { QuotationPreviewData } from '@/types/quotation';

/**
 * Generate DOCX from quotation data
 * Uses docxtemplater with a template file
 */
export async function generateDocx(data: QuotationPreviewData): Promise<Buffer> {
    try {
        // Load template
        const templatePath = join(process.cwd(), 'templates', 'quotation-template.docx');
        const content = readFileSync(templatePath, 'binary');

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Prepare data for template
        const templateData = {
            // Header
            location: data.location,
            day: data.date.day,
            month: data.date.month,
            year: data.date.year,
            title: data.title,
            intro: data.introText || '',
            companyLogoUrl: data.company.logoUrl || '',
            projectSlogan: data.company.projectSlogan || '',

            // Customer
            customerName: data.customer.name,
            customerAddress: data.customer.address || '',
            customerTaxCode: data.customer.taxCode || '',

            // Project
            projectName: data.projectName,
            projectItem: data.projectItem || '',
            projectNotes: data.projectNotes || '',

            // Scope
            scope: data.scopeText || '',
            deliverables: data.deliverablesHtml.replace(/<[^>]*>/g, ''), // Strip HTML for Word

            // Pricing lines
            lines: data.lines.map(line => ({
                itemNo: line.itemNo || '',
                title: line.title,
                qty: line.qty !== undefined && line.qty !== null ? line.qty.toString() : '',
                unit: line.unit || '',
                unitPrice: line.unitPrice !== undefined ? line.unitPrice.toLocaleString('vi-VN') : '',
                total: line.total !== undefined ? line.total.toLocaleString('vi-VN') : '',
                note: line.note || '',
                isGroupHeader: line.isGroupHeader,
            })),

            // Totals
            totalBeforeVat: data.totalBeforeVatFormatted,
            vatRate: (data.vatRate * 100).toFixed(0),
            vatAmount: data.vatAmountFormatted,
            totalAfterVat: data.totalAfterVatFormatted,
            totalInWords: data.totalInWords,

            // Schedule
            schedule: data.scheduleText || '',

            // Payment milestones
            paymentMilestones: data.paymentMilestones.map(m => ({
                no: m.no.toString(),
                title: m.title,
                percent: m.percent.toString(),
                description: m.description || '',
            })),

            // Company & Signature
            companyName: data.company.name,
            companyAddress: data.company.address,
            companyTaxCode: data.company.taxCode,
            companyEmail: data.company.email,
            companyWebsite: data.company.website || '',
            companyPhone: data.company.phone,
            signerName: data.company.signerName,
            signerTitle: data.company.signerTitle,

            // Quotation number
            quotationNo: data.quotationNo,
        };

        // Render template
        doc.render(templateData);

        // Generate buffer
        const buffer = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        return buffer;
    } catch (error) {
        console.error('Error generating DOCX:', error);
        throw new Error('Failed to generate DOCX');
    }
}

/**
 * Create a basic template structure
 * This is a helper function to understand what tags to use in the Word template
 */
export function getTemplateStructure() {
    return `
Template Tags for quotation-template.docx:

HEADER SECTION:
{companyLogoUrl}
{projectSlogan}
{location}, ngày {day} tháng {month} năm {year}
{title}
{intro}

CUSTOMER & PROJECT:
Dự án: {projectName}
Khách hàng: {customerName}
Địa chỉ: {customerAddress}
MST: {customerTaxCode}
Hạng mục: {projectItem}
{projectNotes}

SCOPE:
{scope}

DELIVERABLES:
{deliverables}

PRICING TABLE (loop):
{#lines}
{itemNo} | {title} | {qty} | {unit} | {unitPrice} | {total} | {note}
{/lines}

TOTALS:
Tổng trước VAT: {totalBeforeVat}
VAT ({vatRate}%): {vatAmount}
Tổng sau VAT: {totalAfterVat}
Bằng chữ: {totalInWords}

SCHEDULE:
{schedule}

PAYMENT MILESTONES (loop):
{#paymentMilestones}
{no}. {title}: {percent}%
{/paymentMilestones}

COMPANY & SIGNATURE:
{companyName}
Địa chỉ: {companyAddress}
MST: {companyTaxCode}
Email: {companyEmail}
Website: {companyWebsite}
Điện thoại: {companyPhone}

Người đại diện:
{signerName}
{signerTitle}

QUOTATION NUMBER: {quotationNo}
  `;
}
