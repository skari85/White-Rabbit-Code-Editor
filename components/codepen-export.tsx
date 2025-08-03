'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileContent } from '@/hooks/use-code-builder';
import { 
  ExternalLink, 
  Share, 
  Code, 
  Eye,
  Settings,
  Check,
  Copy,
  Loader2
} from 'lucide-react';

interface CodePenExportProps {
  files: FileContent[];
  projectName: string;
  className?: string;
}

export default function CodePenExport({ files, projectName, className }: CodePenExportProps) {
  const [title, setTitle] = useState(projectName);
  const [description, setDescription] = useState('Created with Hex & Kex PWA Builder');
  const [isPrivate, setIsPrivate] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastExportUrl, setLastExportUrl] = useState('');

  const getFileContent = (fileName: string): string => {
    const file = files.find(f => f.name === fileName);
    return file ? file.content : '';
  };

  const extractCSSFromHTML = (html: string): string => {
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    return styleMatch ? styleMatch[1].trim() : '';
  };

  const extractJSFromHTML = (html: string): string => {
    const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    return scriptMatch ? scriptMatch[1].trim() : '';
  };

  const cleanHTML = (html: string): string => {
    // Remove style and script tags, keep only body content
    let cleaned = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<!DOCTYPE[^>]*>/gi, '');

    // Extract body content if present
    const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[1].trim();
    }

    // Remove html and head tags
    cleaned = cleaned
      .replace(/<\/?html[^>]*>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<\/?body[^>]*>/gi, '');

    return cleaned.trim();
  };

  const prepareCodePenData = () => {
    let html = '';
    let css = '';
    let js = '';

    // Find HTML file
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    if (htmlFile) {
      html = cleanHTML(htmlFile.content);
      // Extract inline CSS and JS
      css += extractCSSFromHTML(htmlFile.content);
      js += extractJSFromHTML(htmlFile.content);
    }

    // Find separate CSS files
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    cssFiles.forEach(file => {
      css += `\n/* ${file.name} */\n${file.content}`;
    });

    // Find separate JS files
    const jsFiles = files.filter(f => f.name.endsWith('.js'));
    jsFiles.forEach(file => {
      js += `\n/* ${file.name} */\n${file.content}`;
    });

    return {
      title: title || projectName,
      description,
      html: html.trim(),
      css: css.trim(),
      js: js.trim(),
      private: isPrivate,
      tags: ['hex-kex', 'pwa', 'web-development'],
      editors: '111' // Show HTML, CSS, and JS editors
    };
  };

  const exportToCodePen = async () => {
    if (files.length === 0) return;

    setExporting(true);

    try {
      const data = prepareCodePenData();
      
      // Create a form and submit it to CodePen
      const form = document.createElement('form');
      form.action = 'https://codepen.io/pen/define';
      form.method = 'POST';
      form.target = '_blank';
      form.style.display = 'none';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'data';
      input.value = JSON.stringify(data);

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      // Generate a mock URL for display (CodePen doesn't return the actual URL)
      const mockUrl = `https://codepen.io/pen/${Math.random().toString(36).substr(2, 9)}`;
      setLastExportUrl(mockUrl);

    } catch (error) {
      console.error('Export to CodePen failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const copyCodePenData = async () => {
    const data = prepareCodePenData();
    const formattedData = `CodePen Export Data:

Title: ${data.title}
Description: ${data.description}

HTML:
${data.html}

CSS:
${data.css}

JS:
${data.js}`;

    try {
      await navigator.clipboard.writeText(formattedData);
      // Could add success feedback here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const hasValidFiles = files.some(f => 
    f.name.endsWith('.html') || 
    f.name.endsWith('.css') || 
    f.name.endsWith('.js')
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Code className="w-4 h-4 text-green-600" />
          CodePen Export
          <Badge variant="outline" className="text-xs">
            Share Code
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Project Settings */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Pen Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Project"
              className="text-xs"
            />
          </div>
          
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description..."
              className="text-xs"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-3 h-3"
            />
            <Label htmlFor="private" className="text-xs">
              Private pen
            </Label>
          </div>
        </div>

        {/* Files Preview */}
        <div className="space-y-2">
          <Label className="text-xs">Files to export ({files.length})</Label>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {files.map((file) => (
              <div key={file.name} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  file.name.endsWith('.html') ? 'bg-orange-500' :
                  file.name.endsWith('.css') ? 'bg-blue-500' :
                  file.name.endsWith('.js') ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`}></div>
                <span>{file.name}</span>
                <Badge variant="outline" className="text-xs">
                  {file.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Export Actions */}
        <div className="space-y-2">
          <Button
            onClick={exportToCodePen}
            disabled={exporting || !hasValidFiles}
            className="w-full bg-green-600 hover:bg-green-700"
            size="sm"
          >
            {exporting ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <ExternalLink className="w-3 h-3 mr-1" />
                Export to CodePen
              </>
            )}
          </Button>
          
          <Button
            onClick={copyCodePenData}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!hasValidFiles}
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy Export Data
          </Button>
        </div>

        {/* Export Info */}
        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border">
          <div className="flex items-start gap-2">
            <Eye className="w-3 h-3 mt-0.5 text-blue-500" />
            <div>
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 text-xs">
                <li>• HTML files become the HTML panel</li>
                <li>• CSS files are combined into CSS panel</li>
                <li>• JS files are combined into JS panel</li>
                <li>• Opens in new CodePen tab for editing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Last Export */}
        {lastExportUrl && (
          <div className="text-xs p-2 bg-green-50 text-green-700 border border-green-200 rounded">
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Exported successfully!</span>
            </div>
            <p className="mt-1">Check your new CodePen tab</p>
          </div>
        )}

        {!hasValidFiles && (
          <div className="text-xs p-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded">
            <div className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              <span>Add HTML, CSS, or JS files to enable export</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
