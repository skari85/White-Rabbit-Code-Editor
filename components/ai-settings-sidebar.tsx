'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AISettings, AI_PROVIDERS } from '@/lib/ai-config';
import {
    AlertCircle,
    Check,
    Eye,
    EyeOff,
    Globe,
    Key,
    Lock,
    Settings,
    Zap
} from 'lucide-react';
import { useState } from 'react';

interface AISettingsSidebarProps {
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  onTestConnection: () => Promise<boolean>;
  isConfigured: boolean;
  className?: string;
}

export default function AISettingsSidebar({ 
  settings, 
  onSettingsChange, 
  onTestConnection, 
  isConfigured,
  className 
}: AISettingsSidebarProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const currentProvider = AI_PROVIDERS.find(p => p.id === (settings?.provider || 'openai'));

  const handleProviderChange = (providerId: string) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      onSettingsChange({
        ...settings,
        provider: providerId,
        model: provider.models[0] || 'gpt-3.5-turbo',
        apiKey: settings?.apiKey || ''
      });
    }
  };

  const handleApiKeyChange = (apiKey: string) => {
    onSettingsChange({
      ...settings,
      apiKey
    });
  };

  const handleModelChange = (model: string) => {
    onSettingsChange({
      ...settings,
      model
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const success = await onTestConnection();
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'google': return '🔍';
      case 'groq': return '⚡';
      case 'mistral': return '🌪️';
      case 'ollama': return '🦙';
      default: return '🤖';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-500" />
          AI Configuration
          {isConfigured && (
            <Badge variant="outline" className="text-xs">
              <Check className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">AI Provider</Label>
          <div className="grid grid-cols-2 gap-1">
            {AI_PROVIDERS.map((provider) => (
              <Button
                key={provider.id}
                variant={settings?.provider === provider.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleProviderChange(provider.id)}
                className="text-xs h-8 justify-start"
              >
                <span className="mr-1">{getProviderIcon(provider.id)}</span>
                {provider.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        {currentProvider && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Model</Label>
            <select
              id="sidebar-model-select"
              value={settings?.model || currentProvider.models[0]}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full text-xs p-2 border rounded-md bg-background"
              aria-label="Select AI model"
            >
              {currentProvider.models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* API Key Input */}
        {currentProvider?.requiresApiKey && (
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Key className="w-3 h-3" />
              API Key
              {currentProvider.id === 'ollama' ? (
                <Globe className="w-3 h-3 text-green-500" />
              ) : (
                <Lock className="w-3 h-3 text-orange-500" />
              )}
            </Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={settings?.apiKey || ''}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={`Enter ${currentProvider.name} API key...`}
                className="text-xs pr-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-1 top-1 h-6 w-6 p-0"
              >
                {showApiKey ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </Button>
            </div>
            
            {/* API Key Help */}
            <div className="text-xs text-muted-foreground">
              {currentProvider.id === 'openai' && (
                <span>Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">OpenAI Platform</a></span>
              )}
              {currentProvider.id === 'anthropic' && (
                <span>Get your key from <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Anthropic Console</a></span>
              )}
              {currentProvider.id === 'google' && (
                <span>Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a></span>
              )}
              {currentProvider.id === 'groq' && (
                <span>Get your key from <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Groq Console</a></span>
              )}
              {currentProvider.id === 'mistral' && (
                <span>Get your key from <a href="https://console.mistral.ai/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Mistral Console</a></span>
              )}
              {currentProvider.id === 'ollama' && (
                <span>Make sure Ollama is running locally on port 11434</span>
              )}
            </div>
          </div>
        )}

        {/* Test Connection */}
        {settings?.apiKey && (
          <div className="space-y-2">
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              size="sm"
              className="w-full"
              variant="outline"
            >
              {testing ? (
                <>
                  <Zap className="w-3 h-3 mr-1 animate-pulse" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 mr-1" />
                  Test Connection
                </>
              )}
            </Button>
            
            {testResult && (
              <div className={`text-xs p-2 rounded flex items-center gap-1 ${
                testResult === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {testResult === 'success' ? (
                  <>
                    <Check className="w-3 h-3" />
                    Connection successful!
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    Connection failed. Check your API key.
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Configuration Status */}
        <div className={`text-xs p-2 rounded border ${
          isConfigured 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
        }`}>
          {isConfigured ? (
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              AI is configured and ready to use
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Please configure your API key to use AI features
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
