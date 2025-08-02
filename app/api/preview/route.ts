import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json();
    
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Invalid files data' }, { status: 400 });
    }

    // Find HTML file
    const htmlFile = files.find((f: any) => f.name === 'index.html') || 
                    files.find((f: any) => f.type === 'html');
    
    if (!htmlFile) {
      const fallbackHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - No HTML File</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            text-align: center; 
            background: #f5f5f5; 
        }
        .message { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
    </style>
</head>
<body>
    <div class="message">
        <h2>No HTML File Found</h2>
        <p>Create an HTML file to see the preview.</p>
        <p>Available files: ${files.map((f: any) => f.name).join(', ')}</p>
    </div>
</body>
</html>`;
      
      return new NextResponse(fallbackHTML, {
        headers: {
          'Content-Type': 'text/html',
          'X-Frame-Options': 'SAMEORIGIN',
          'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;"
        }
      });
    }

    // Bundle all files
    const cssFiles = files.filter((f: any) => f.type === 'css');
    const jsFiles = files.filter((f: any) => f.type === 'js');
    
    let htmlContent = htmlFile.content;

    // Inject CSS
    const cssInjection = cssFiles.map((file: any) => 
      `<style data-file="${file.name}">\n${file.content}\n</style>`
    ).join('\n');

    // Inject JS
    const jsInjection = jsFiles.map((file: any) => 
      `<script data-file="${file.name}">\n${file.content}\n</script>`
    ).join('\n');

    // Insert CSS in head
    if (cssInjection) {
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${cssInjection}\n</head>`);
      } else {
        htmlContent = `<head>\n${cssInjection}\n</head>\n${htmlContent}`;
      }
    }

    // Insert JS before closing body tag
    if (jsInjection) {
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${jsInjection}\n</body>`);
      } else {
        htmlContent = `${htmlContent}\n${jsInjection}`;
      }
    }

    // Add security and preview meta tags
    const metaInjection = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="UTF-8">
    <style>
      /* Preview frame styles */
      body { margin: 0; }
      * { box-sizing: border-box; }
    </style>`;

    if (htmlContent.includes('<head>')) {
      htmlContent = htmlContent.replace('<head>', `<head>\n${metaInjection}`);
    } else {
      htmlContent = `<head>${metaInjection}</head>\n${htmlContent}`;
    }

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;"
      }
    });

  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Preview API - Use POST with files data to generate preview' 
  });
}
