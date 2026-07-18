import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure the worker using Vite's ?url import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Extracts text from a PDF File object.
 * @param {File} file 
 * @returns {Promise<string>}
 */
export async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw error;
  }
}
