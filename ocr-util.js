// OCR utility using Tesseract.js (works in both Node.js and browser)
/**
 * Perform OCR on an image URL using Tesseract.js
 * @param {string} imageUrl - The URL or path to the image
 * @returns {Promise<string>} - The recognized text
 */
export async function ocrText(imageUrl) {
  let tesseract;
  if (typeof window === 'undefined') {
    // Node.js (SSR)
    tesseract = require('tesseract.js');
  } else {
    // Browser: use dynamic import
    tesseract = (await import('tesseract.js'));
  }
  return tesseract.recognize(imageUrl, 'eng', {
    logger: m => console.log(m)
  }).then(result => result.data.text);
}
