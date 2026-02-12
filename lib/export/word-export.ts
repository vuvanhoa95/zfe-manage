import { saveAs } from 'file-saver';
import asBlob from 'html-docx-js/dist/html-docx';

/**
 * Export HTML content to Microsoft Word (.docx) format
 * @param htmlContent - HTML string to convert
 * @param filename - Desired filename (without extension)
 * @throws Error if conversion or download fails
 */
export async function exportToWord(
  htmlContent: string,
  filename: string
): Promise<void> {
  try {
    // Clean HTML - remove scripts, unwanted elements
    const cleanedHtml = cleanHtmlForWord(htmlContent);
    
    // Wrap in proper HTML document structure
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>${filename}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            margin: 1in;
          }
          h1 {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            margin: 20pt 0;
          }
          h2, h3 {
            font-size: 14pt;
            font-weight: bold;
            margin: 12pt 0 6pt 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12pt 0;
          }
          table td, table th {
            border: 1px solid #000;
            padding: 6pt;
          }
          table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .text-center {
            text-align: center;
          }
          .font-bold {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${cleanedHtml}
      </body>
      </html>
    `;
    
    // Convert HTML to Word document blob
    const blob = await asBlob(fullHtml);
    
    // Download file
    saveAs(blob, `${sanitizeFilename(filename)}.docx`);
  } catch (error) {
    console.error('Word export error:', error);
    throw new Error('Không thể xuất file Word. Vui lòng thử lại.');
  }
}

/**
 * Clean HTML content for Word export
 * Removes interactive elements, scripts, and simplifies styling
 */
function cleanHtmlForWord(html: string): string {
  // Create temporary div to parse HTML
  if (typeof document === 'undefined') {
    // Server-side: basic string cleaning
    return html
     .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
      .replace(/<input[^>]*>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  }
  
  // Client-side: proper DOM parsing
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Remove script tags
  div.querySelectorAll('script').forEach(el => el.remove());
  
  // Remove interactive buttons (Export PDF, AI buttons, etc.)
  div.querySelectorAll('button').forEach(el => el.remove());
  
  // Remove input fields
  div.querySelectorAll('input, textarea').forEach(el => el.remove());
  
  // Remove SVG icons (Word doesn't handle them well)
  div.querySelectorAll('svg').forEach(el => el.remove());
  
  // Remove elements with specific classes
  div.querySelectorAll('.no-print, .hidden').forEach(el => el.remove());
  
  return div.innerHTML;
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 200); // Limit length
}

/**
 * Export quotation preview to Word
 * Helper function specifically for quotation exports
 */
export async function exportQuotationToWord(
  quotationNo: string,
  date: Date = new Date()
): Promise<void> {
  // Get the printArea element (same as PDF export)
  const printArea = document.getElementById('printArea');
  
  if (!printArea) {
    throw new Error('Không tìm thấy nội dung để xuất');
  }
  
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const filename = `BaoGia_${quotationNo}_${dateStr}`;
  
  await exportToWord(printArea.innerHTML, filename);
}
