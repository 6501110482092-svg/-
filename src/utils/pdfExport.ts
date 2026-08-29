import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Cleanly prints the A4 document in an isolated frame without any parent/outer UI or browser headers
 */
export const printDocumentDirectly = async (elementId: string): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return false;
  }

  try {
    // Create an invisible iframe for isolated printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      window.print();
      return false;
    }

    // Collect all stylesheet links and style tags from current document
    let stylesHtml = '';
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleElements.forEach((el) => {
      stylesHtml += el.outerHTML;
    });

    // Write content into iframe
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="utf-8">
          <title>พิมพ์เอกสาร</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background-color: #ffffff !important;
              color: #0f172a;
              height: auto !important;
              min-height: 100% !important;
              overflow: visible !important;
              font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .a4-print-root {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              transform: none !important;
              min-height: auto !important;
              overflow: visible !important;
            }
            .page-break-inside-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="a4-print-root">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for fonts & images to render
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print()', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 400);

    return true;
  } catch (error) {
    console.error('Error during isolated printing:', error);
    window.print();
    return false;
  }
};

/**
 * Exports the document directly as a high-quality A4 PDF file using html2canvas & jsPDF
 */
export const exportDocumentToPdf = async (
  elementId: string,
  filename: string,
  onProgress?: (status: string) => void
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('ไม่พบข้อมูลเอกสารสำหรับการสร้างไฟล์ PDF');
  }

  onProgress?.('กำลังประมวลผลรูปภาพและจัดรูปแบบเอกสาร A4...');

  // Save original styling
  const originalTransform = element.style.transform;
  const originalBoxShadow = element.style.boxShadow;
  const originalBorder = element.style.border;

  // Temporarily reset zoom transform for crisp capture
  element.style.transform = 'none';
  element.style.boxShadow = 'none';
  element.style.border = 'none';

  try {
    onProgress?.('กำลังสร้างรูปภาพความละเอียดสูง (High-Resolution Capture)...');

    const canvas = await html2canvas(element, {
      scale: 2.2, // High resolution for crisp printing text and QR codes
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
    });

    onProgress?.('กำลังจัดทำไฟล์ PDF ขนาดมาตรฐาน A4...');

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Check if it fits on 1 page or needs multi-page
    if (imgHeight <= pdfHeight) {
      // Fits on exactly 1 single A4 page
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
    } else {
      // Multi-page document
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    onProgress?.('กำลังดาวน์โหลดไฟล์ PDF เข้าสู่เครื่องของคุณ...');
    pdf.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw error;
  } finally {
    // Restore styling
    element.style.transform = originalTransform;
    element.style.boxShadow = originalBoxShadow;
    element.style.border = originalBorder;
  }
};
