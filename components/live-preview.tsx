'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { FileContent } from '@/hooks/use-code-builder';

interface LivePreviewProps {
  files: FileContent[];
  selectedFile: string;
  className?: string;
}

export default function LivePreview({ files, selectedFile, className }: LivePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentBlobUrl = useRef<string>('');

  // Generate preview HTML with all files bundled
  const generatePreviewHTML = () => {
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

    // Add meta tags for better preview
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
    </style>`;

    if (htmlContent.includes('<head>')) {
      htmlContent = htmlContent.replace('<head>', `<head>\n${metaInjection}`);
    } else {
      htmlContent = `<head>${metaInjection}</head>\n${htmlContent}`;
    }

    return htmlContent;
  };

  // Update preview when files change
  useEffect(() => {
    const updatePreview = () => {
      setIsLoading(true);
      
      // Clean up previous blob URL
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
      }

      const htmlContent = generatePreviewHTML();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      currentBlobUrl.current = url;
      setPreviewUrl(url);
      setIsLoading(false);
    };

    updatePreview();

    // Cleanup on unmount
    return () => {
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
      }
    };
  }, [files]);

  const refreshPreview = () => {
    const htmlContent = generatePreviewHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    if (currentBlobUrl.current) {
      URL.revokeObjectURL(currentBlobUrl.current);
    }
    
    currentBlobUrl.current = url;
    setPreviewUrl(url);
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
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
              disabled={!previewUrl}
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
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0 bg-white"
              // Security: Removed 'allow-same-origin' to prevent sandbox escape
              // when combined with 'allow-scripts'. This maintains functionality
              // while ensuring proper security isolation.
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
              title="Live Preview"
              style={{ backgroundColor: '#ffffff' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-white border border-gray-200 rounded">
              <p className="text-gray-500">Loading preview...</p>
            </div>
          )}
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
