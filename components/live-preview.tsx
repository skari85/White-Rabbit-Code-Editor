'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { FileContent } from '@/hooks/use-code-builder';
import { ErrorBoundary } from './error-boundary';

interface LivePreviewProps {
  files: FileContent[];
  selectedFile?: string;
  className?: string;
}

export default function LivePreview({ files, className }: LivePreviewProps) {
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate preview HTML with all files bundled
  const generatePreviewHTML = () => {
    try {
      const htmlFile = files.find(f => f.name === 'index.html') || files.find(f => f.type === 'html');
      const cssFiles = files.filter(f => f.type === 'css');
      const jsFiles = files.filter(f => f.type === 'js');

    if (!htmlFile) {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - No HTML File</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            padding: 40px;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .message {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            max-width: 500px;
            width: 100%;
        }
        .message h2 {
            color: #1f2937;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        .message p {
            color: #6b7280;
            margin-bottom: 1rem;
            line-height: 1.6;
        }
        .files-list {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 8px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
            color: #374151;
        }
        .icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="message">
        <div class="icon">📄</div>
        <h2>No HTML File Found</h2>
        <p>Create an <strong>index.html</strong> file or any HTML file to see the live preview.</p>
        ${files.length > 0 ? `
        <p>Available files:</p>
        <div class="files-list">${files.map(f => f.name).join(', ')}</div>
        ` : '<p>No files created yet. Start by adding some files!</p>'}
    </div>
</body>
</html>`;
    }

    // Start with the HTML content
    let htmlContent = htmlFile.content;

    // Inject CSS files into the head
    const cssInjection = cssFiles.map(file => 
      `<style data-file="${file.name}">\n${file.content}\n</style>`
    ).join('\n');

    // Inject JS files before closing body tag
    const jsInjection = jsFiles.map(file => 
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

    // Add meta tags and error handling for better preview
    const metaInjection = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="UTF-8">
    <style>
      /* Preview frame styles - ensure white background */
      html, body {
        margin: 0;
        padding: 0;
        background-color: #ffffff !important;
        color: #000000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }
      * {
        box-sizing: border-box;
      }
      /* Ensure iframe content is visible */
      body:empty::before {
        content: "Loading preview...";
        display: block;
        text-align: center;
        padding: 2rem;
        color: #666;
      }
    </style>
    <script>
      // Override localStorage for sandboxed environment
      (function() {
        try {
          // Test if localStorage is accessible
          window.localStorage.getItem('test');
        } catch (e) {
          // Create a mock localStorage for sandboxed environment
          window.localStorage = {
            getItem: function(key) { return null; },
            setItem: function(key, value) { console.warn('localStorage not available in preview'); },
            removeItem: function(key) { console.warn('localStorage not available in preview'); },
            clear: function() { console.warn('localStorage not available in preview'); },
            length: 0,
            key: function(index) { return null; }
          };
        }

        // Handle module errors
        window.addEventListener('error', function(e) {
          if (e.message.includes('import') || e.message.includes('export')) {
            console.warn('Module syntax detected - this is a preview limitation');
          }
          if (e.message.includes('localStorage')) {
            console.warn('localStorage access blocked in sandboxed preview');
          }
        });

        // Handle module errors and localStorage access
        window.addEventListener('error', function(e) {
          if (e.message && e.message.includes('localStorage') && e.message.includes('sandboxed')) {
            console.warn('localStorage access blocked in preview - using mock implementation');
            e.preventDefault();
            return false;
          }
        });
      })();
    </script>`;

    if (htmlContent.includes('<head>')) {
      htmlContent = htmlContent.replace('<head>', `<head>\n${metaInjection}`);
    } else {
      htmlContent = `<head>${metaInjection}</head>\n${htmlContent}`;
    }

    return htmlContent;
    } catch (error) {
      console.error('Error generating preview HTML:', error);
      return `
        <html>
          <head>
            <title>Preview Error</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 2rem;
                text-align: center;
                background: #f5f5f5;
              }
              .error {
                background: #fee;
                border: 1px solid #fcc;
                padding: 1rem;
                border-radius: 8px;
                color: #c33;
              }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>Preview Error</h2>
              <p>There was an error generating the preview. Please check your code and try again.</p>
            </div>
          </body>
        </html>
      `;
    }
  };

  // Update preview when files change
  useEffect(() => {
    const updatePreview = () => {
      setIsLoading(true);
      const htmlContent = generatePreviewHTML();
      setPreviewContent(htmlContent);
      setIsLoading(false);
    };

    updatePreview();
  }, [files]);

  const refreshPreview = () => {
    const htmlContent = generatePreviewHTML();
    setPreviewContent(htmlContent);
  };

  const openInNewTab = () => {
    try {
      const htmlContent = generatePreviewHTML();
      if (!htmlContent) {
        console.warn('No preview content available');
        return;
      }
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Failed to open preview in new tab:', error);
      // Fallback: show error message to user
      alert('Failed to open preview. Please try refreshing the preview first.');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPreview}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              disabled={!previewContent}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-96 bg-white'}`}>
          <ErrorBoundary
            fallback={
              <div className="flex items-center justify-center h-full bg-red-50 border border-red-200 rounded">
                <div className="text-center">
                  <p className="text-red-600 font-medium">Preview Error</p>
                  <p className="text-red-500 text-sm mt-1">There was an error loading the preview</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshPreview}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            }
          >
            {previewContent ? (
              <iframe
                ref={iframeRef}
                srcDoc={previewContent}
                className="w-full h-full border-0 bg-white"
                // Security: Using srcDoc instead of blob URLs to avoid sandbox issues
                // while maintaining proper security isolation.
                sandbox="allow-scripts allow-forms allow-popups allow-modals"
                title="Live Preview"
                style={{ backgroundColor: '#ffffff' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-white border border-gray-200 rounded">
                <p className="text-gray-500">Loading preview...</p>
              </div>
            )}
          </ErrorBoundary>
          {isFullscreen && (
            <Button
              className="absolute top-4 right-4 z-10"
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
