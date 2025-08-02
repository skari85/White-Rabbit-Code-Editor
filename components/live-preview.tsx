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
        <p>Available files: ${files.map(f => f.name).join(', ')}</p>
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
      /* Preview frame styles */
      body { margin: 0; }
      * { box-sizing: border-box; }
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
        <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-96'}`}>
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="Live Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
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
