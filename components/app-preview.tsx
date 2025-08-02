"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppPreviewProps {
  files: { name: string; content: string; type: string }[];
  onClose: () => void;
}

export function AppPreview({ files, onClose }: AppPreviewProps) {
  const srcDoc = useMemo(() => {
    const htmlFile = files.find(f => f.type === 'html');
    const cssFiles = files.filter(f => f.type === 'css');
    const jsFiles = files.filter(f => f.type === 'js' || f.type === 'javascript');

    if (!htmlFile) {
      return '<p>No HTML file found to preview.</p>';
    }

    let html = htmlFile.content;

    // Inject CSS
    const cssLinks = cssFiles.map(file => `<style>${file.content}</style>`).join('\n');
    html = html.replace('</head>', `${cssLinks}</head>`);

    // Inject JavaScript
    const jsScripts = jsFiles.map(file => `<script>${file.content}</script>`).join('\n');
    html = html.replace('</body>', `${jsScripts}</body>`);

    return html;
  }, [files]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <Card className="w-full h-full max-w-4xl max-h-[80vh] bg-gray-900 border-gray-700 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>App Preview</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <iframe
            srcDoc={srcDoc}
            title="App Preview"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
          />
        </CardContent>
      </Card>
    </div>
  );
}
