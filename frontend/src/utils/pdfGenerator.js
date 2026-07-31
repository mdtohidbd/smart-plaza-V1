import html2pdf from 'html2pdf.js';

/**
 * Downloads a crisp, high-resolution PDF document from a DOM element ID.
 * @param {string} elementId - The HTML element ID to convert into a PDF.
 * @param {string} fileName - The desired file name for the downloaded PDF.
 * @returns {Promise<boolean>}
 */
export const downloadPdfFromElement = async (elementId, fileName = 'Document.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id '${elementId}' not found for PDF export.`);
    return false;
  }

  // Ensure file extension ends with .pdf
  const sanitizedFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  const opt = {
    margin: [0, 0, 0, 0],
    filename: sanitizedFileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2.5,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: true,
      windowWidth: 800
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await html2pdf().set(opt).from(element).save();
    return true;
  } catch (error) {
    console.error('Error generating PDF with html2pdf:', error);
    // Fallback using browser print
    window.print();
    return false;
  }
};
