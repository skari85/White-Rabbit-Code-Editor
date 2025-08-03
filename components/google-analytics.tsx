'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileContent } from '@/hooks/use-code-builder';
import { 
  BarChart3, 
  Check, 
  AlertCircle,
  Copy,
  Code,
  ExternalLink,
  Eye,
  Users,
  TrendingUp,
  Settings
} from 'lucide-react';

interface GoogleAnalyticsProps {
  files: FileContent[];
  onUpdateFile: (fileName: string, content: string) => void;
  className?: string;
}

export default function GoogleAnalytics({ files, onUpdateFile, className }: GoogleAnalyticsProps) {
  const [measurementId, setMeasurementId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('google_analytics_id');
    if (savedId) {
      setMeasurementId(savedId);
      setIsConfigured(true);
      generateTrackingCode(savedId);
    }
  }, []);

  const generateTrackingCode = (id: string) => {
    const code = `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}');
</script>`;
    setTrackingCode(code);
  };

  const handleSaveConfig = () => {
    if (!measurementId.trim() || !measurementId.startsWith('G-')) {
      return;
    }

    localStorage.setItem('google_analytics_id', measurementId);
    setIsConfigured(true);
    generateTrackingCode(measurementId);
  };

  const handleRemoveConfig = () => {
    setMeasurementId('');
    setIsConfigured(false);
    setTrackingCode('');
    localStorage.removeItem('google_analytics_id');
  };

  const copyTrackingCode = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy tracking code:', error);
    }
  };

  const addToHTML = () => {
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    if (!htmlFile || !trackingCode) return;

    let updatedContent = htmlFile.content;
    
    // Check if GA is already added
    if (updatedContent.includes('googletagmanager.com/gtag/js')) {
      // Replace existing GA code
      updatedContent = updatedContent.replace(
        /<!-- Google Analytics -->[\s\S]*?<\/script>/,
        trackingCode
      );
    } else {
      // Add GA code to head section
      if (updatedContent.includes('</head>')) {
        updatedContent = updatedContent.replace('</head>', `  ${trackingCode}\n</head>`);
      } else {
        // If no head tag, add at the beginning
        updatedContent = trackingCode + '\n' + updatedContent;
      }
    }

    onUpdateFile(htmlFile.name, updatedContent);
  };

  const getAnalyticsFeatures = () => [
    {
      icon: Users,
      title: 'User Tracking',
      description: 'Track unique visitors and user behavior'
    },
    {
      icon: Eye,
      title: 'Page Views',
      description: 'Monitor page views and popular content'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Data',
      description: 'See live traffic and user activity'
    },
    {
      icon: BarChart3,
      title: 'Custom Events',
      description: 'Track button clicks and interactions'
    }
  ];

  if (!isConfigured) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            Google Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border">
            <p className="font-medium mb-1">Setup Google Analytics:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Go to <a href="https://analytics.google.com" target="_blank" className="text-blue-600 underline">Google Analytics</a></li>
              <li>Create a new property for your website</li>
              <li>Copy your Measurement ID (G-XXXXXXXXXX)</li>
              <li>Paste it below to generate tracking code</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Measurement ID</Label>
            <Input
              value={measurementId}
              onChange={(e) => setMeasurementId(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="text-xs"
            />
            <p className="text-xs text-gray-500">
              Your GA4 Measurement ID starts with "G-"
            </p>
          </div>

          <Button
            onClick={handleSaveConfig}
            disabled={!measurementId.trim() || !measurementId.startsWith('G-')}
            size="sm"
            className="w-full"
          >
            <Check className="w-3 h-3 mr-1" />
            Configure Analytics
          </Button>

          {/* Features Preview */}
          <div className="space-y-2">
            <Label className="text-xs">What you'll get:</Label>
            <div className="grid grid-cols-2 gap-2">
              {getAnalyticsFeatures().map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
                    <Icon className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{feature.title}</p>
                      <p className="text-gray-600 text-xs">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-500" />
          Google Analytics
          <Badge variant="outline" className="text-xs">
            <Check className="w-3 h-3 mr-1" />
            Configured
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Configuration Info */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div>
            <p className="text-xs font-medium">Measurement ID</p>
            <p className="text-xs text-gray-600 font-mono">{measurementId}</p>
          </div>
          <Button
            onClick={handleRemoveConfig}
            variant="ghost"
            size="sm"
            className="text-xs text-red-600 hover:text-red-700"
          >
            Remove
          </Button>
        </div>

        {/* Tracking Code */}
        <div className="space-y-2">
          <Label className="text-xs">Generated Tracking Code</Label>
          <div className="relative">
            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto max-h-32">
              <code>{trackingCode}</code>
            </pre>
            <Button
              onClick={copyTrackingCode}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 p-1 h-6 w-6"
            >
              {copiedCode ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3 text-gray-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={addToHTML}
            disabled={!files.some(f => f.name.endsWith('.html'))}
            size="sm"
            className="w-full"
          >
            <Code className="w-3 h-3 mr-1" />
            Add to HTML File
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={copyTrackingCode}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy Code
            </Button>
            <Button
              onClick={() => window.open('https://analytics.google.com', '_blank')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="text-xs p-2 bg-green-50 text-green-700 border border-green-200 rounded">
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Analytics tracking is ready!</span>
          </div>
          <p className="mt-1">Deploy your site to start collecting data</p>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <Label className="text-xs">Analytics Features:</Label>
          <div className="grid grid-cols-2 gap-2">
            {getAnalyticsFeatures().map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <Icon className="w-3 h-3 text-orange-500" />
                  <span>{feature.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Events Info */}
        <div className="text-xs text-gray-600 bg-orange-50 p-3 rounded border">
          <p className="font-medium mb-1">💡 Pro Tip:</p>
          <p>Add custom event tracking with:</p>
          <code className="block mt-1 bg-gray-100 p-1 rounded text-xs">
            gtag('event', 'click', {'{'}event_category: 'button'{'}'});
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
