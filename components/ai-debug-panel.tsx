import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AISettings } from '@/lib/ai-config';
import { AIService, validateApiKey } from '@/lib/ai-service';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface AIDebugPanelProps {
  settings: AISettings;
  isConfigured: boolean;
}

export function AIDebugPanel({ settings, isConfigured }: AIDebugPanelProps) {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const aiService = new AIService(settings);
      
      console.log('Testing AI connection with settings:', {
        provider: settings.provider,
        model: settings.model,
        hasApiKey: !!settings.apiKey,
        apiKeyLength: settings.apiKey?.length || 0
      });

      const testMessage = {
        id: 'test',
        role: 'user' as const,
        content: 'Hello, this is a test message. Please respond with "Test successful".',
        timestamp: new Date()
      };

      const response = await aiService.sendMessage([testMessage]);
      
      console.log('AI Response received:', response);
      setTestResult(response.content);
      
    } catch (err: any) {
      console.error('AI Test Error:', err);
      setError(err.message || 'Unknown error occurred');
      
      // Check if this is the Chrome ToS issue
      if (err.message?.includes('Google Chrome') || err.message?.includes('ChromeOS')) {
        setError('Chrome Terms of Service detected in response - this indicates a network/CORS issue');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const validateCurrentSettings = () => {
    const issues = [];
    
    if (!settings.apiKey) {
      issues.push('No API key provided');
    } else if (!validateApiKey(settings.provider, settings.apiKey)) {
      issues.push('API key format invalid');
    }
    
    if (!settings.provider) {
      issues.push('No provider selected');
    }
    
    if (!settings.model) {
      issues.push('No model selected');
    }

    return issues;
  };

  const issues = validateCurrentSettings();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          AI Connection Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Status */}
        <div className="space-y-2">
          <h3 className="font-medium">Configuration Status</h3>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm">
              {isConfigured ? 'AI Service Configured' : 'AI Service Not Configured'}
            </span>
          </div>
        </div>

        {/* Settings Overview */}
        <div className="space-y-2">
          <h3 className="font-medium">Current Settings</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Provider:</span>
              <Badge variant="outline" className="ml-2">{settings.provider}</Badge>
            </div>
            <div>
              <span className="text-gray-500">Model:</span>
              <Badge variant="outline" className="ml-2">{settings.model}</Badge>
            </div>
            <div>
              <span className="text-gray-500">API Key:</span>
              <Badge variant={settings.apiKey ? "default" : "destructive"} className="ml-2">
                {settings.apiKey ? `Set (${settings.apiKey.length} chars)` : 'Not Set'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-red-600">Configuration Issues</h3>
            <ul className="text-sm space-y-1">
              {issues.map((issue, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Test Connection */}
        <div className="space-y-2">
          <h3 className="font-medium">Connection Test</h3>
          <Button 
            onClick={testConnection} 
            disabled={!isConfigured || isTesting || issues.length > 0}
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Test AI Connection'
            )}
          </Button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="space-y-2">
            <h3 className="font-medium text-green-600">Test Successful ✓</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
              <strong>AI Response:</strong><br />
              {testResult}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="space-y-2">
            <h3 className="font-medium text-red-600">Test Failed ✗</h3>
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
              <strong>Error:</strong><br />
              {error}
            </div>
            
            {/* Troubleshooting Tips */}
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <strong>Troubleshooting Tips:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Check if your API key is valid and has credits</li>
                <li>• Try a different AI provider (OpenAI, Anthropic, Groq)</li>
                <li>• Disable browser extensions that might block requests</li>
                <li>• Check browser console for additional error details</li>
                <li>• Try opening the app in an incognito window</li>
              </ul>
            </div>
          </div>
        )}

        {/* Network Info */}
        <div className="space-y-2">
          <h3 className="font-medium">Network Information</h3>
          <div className="text-sm space-y-1">
            <div>User Agent: {navigator.userAgent.slice(0, 100)}...</div>
            <div>Online Status: {navigator.onLine ? 'Online' : 'Offline'}</div>
            <div>Location: {window.location.origin}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
