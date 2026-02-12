declare module 'html-docx-js/dist/html-docx' {
  /**
   * Convert HTML string to Word document blob
   * @param html - HTML string to convert
   * @returns Promise<Blob> - Word document blob
   */
  export default function asBlob(html: string): Promise<Blob>;
}
