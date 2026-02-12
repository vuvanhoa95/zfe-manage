/**
 * Convert HTML table to Markdown format
 * Useful for copying pricing tables
 */
export function tableToMarkdown(tableHtml: string): string {
  if (typeof document === 'undefined') {
    // Server-side: basic parsing
    return tableHtml;
  }
  
  const div = document.createElement('div');
  div.innerHTML = tableHtml;
  const table = div.querySelector('table');
  
  if (!table) {
    return tableHtml;
  }
  
  let markdown = '';
  
  // Process header
  const thead = table.querySelector('thead');
  if (thead) {
    const headerRow = thead.querySelector('tr');
    if (headerRow) {
      const headers = Array.from(headerRow.querySelectorAll('th, td'));
      const headerTexts = headers.map(th => th.textContent?.trim() || '');
      markdown += '| ' + headerTexts.join(' | ') + ' |\n';
      markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    }
  }
  
  // Process body
  const tbody = table.querySelector('tbody') || table;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td, th'));
    const cellTexts = cells.map(td => td.textContent?.trim() || '');
    markdown += '| ' + cellTexts.join(' | ') + ' |\n';
  }
  
  return markdown;
}

/**
 * Convert pricing table data to Markdown
 * Direct data-to-markdown without HTML parsing
 */
export function pricingDataToMarkdown(lines: Array<{
  itemNo?: string;
  title: string;
  qty?: number;
  unit?: string;
  unitPrice?: number;
  note?: string;
}>): string {
  let markdown = '| STT | Nội dung | KL | ĐVT | Đơn giá | Thành tiền | Ghi chú |\n';
  markdown += '| --- | --- | --- | --- | --- | --- | --- |\n';
  
  for (const line of lines) {
    const total = (line.qty || 0) * (line.unitPrice || 0);
    markdown += `| ${line.itemNo || ''} | ${line.title} | ${line.qty || ''} | ${line.unit || ''} | ${line.unitPrice?.toLocaleString('vi-VN') || ''} | ${total.toLocaleString('vi-VN')} | ${line.note || ''} |\n`;
  }
  
  return markdown;
}
