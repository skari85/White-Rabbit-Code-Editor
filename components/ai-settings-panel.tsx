import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AISettings, AI_PROVIDERS, DEFAULT_SYSTEM_PROMPT } from '@/lib/ai-config';
import { validateApiKey } from '@/lib/ai-service';
import { Eye, EyeOff, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface AISettingsProps {
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  onTestConnection: (settings: AISettings) => Promise<boolean>;
  isConfigured: boolean;
}

export function AISettingsPanel({ settings, onSettingsChange, onTestConnection, isConfigured }: AISettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [localSettings, setLocalSettings] = useState(settings);

  const currentProvider = AI_PROVIDERS.find(p => p.id === localSettings.provider);

  const handleProviderChange = (providerId: string) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      setLocalSettings({
        ...localSettings,
        provider: providerId,
        model: provider.models[0], // Set first model as default
        apiKey: providerId === 'ollama' ? '' : localSettings.apiKey // Clear API key for Ollama
      });
    }
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
  };

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      const success = await onTestConnection(localSettings);
      setTestStatus(success ? 'success' : 'error');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (error) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const isValidConfig = currentProvider ? 
    (!currentProvider.requiresApiKey || validateApiKey(localSettings.provider, localSettings.apiKey || '')) : 
    false;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🤖 AI Assistant Setup
              {isConfigured && <Badge variant="secondary" className="bg-green-100 text-green-800">Configured</Badge>}
            </CardTitle>
            <CardDescription>
              Configure your AI provider to enable the coding assistant in Hex & Kex
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">AI Provider</Label>
          <Select value={localSettings.provider} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select AI provider" />
            </SelectTrigger>
            <SelectContent>
              {AI_PROVIDERS.map(provider => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{provider.name}</span>
                    {!provider.requiresApiKey && (
                      <Badge variant="outline" className="ml-2">Free</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API Key Input */}
        {currentProvider?.requiresApiKey && (
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={localSettings.apiKey || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                placeholder={`Enter your ${currentProvider.name} API key`}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
        )}

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={localSettings.model} onValueChange={(model) => setLocalSettings({ ...localSettings, model })}>
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {currentProvider?.models.map(model => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Temperature Setting */}
        <div className="space-y-2">
          <Label htmlFor="temperature">
            Temperature: {localSettings.temperature}
          </Label>
          <Slider
            id="temperature"
            min={0}
            max={2}
            step={0.1}
            value={[localSettings.temperature]}
            onValueChange={([value]) => setLocalSettings({ ...localSettings, temperature: value })}
            className="w-full"
          />
          <p className="text-sm text-gray-500">
            Lower values make output more focused, higher values more creative.
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <Label htmlFor="maxTokens">Max Tokens</Label>
          <Input
            id="maxTokens"
            type="number"
            min={100}
            max={4000}
            value={localSettings.maxTokens}
            onChange={(e) => setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })}
          />
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="systemPrompt">System Prompt</Label>
          <Textarea
            id="systemPrompt"
            value={localSettings.systemPrompt}
            onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
            className="min-h-[120px]"
            placeholder="System prompt that defines the AI's behavior and role"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLocalSettings({ ...localSettings, systemPrompt: DEFAULT_SYSTEM_PROMPT })}
          >
            Reset to Default
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleTest}
            variant="outline"
            disabled={!isValidConfig || testStatus === 'testing'}
            className="flex items-center gap-2"
          >
            {testStatus === 'testing' && <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />}
            {testStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
            {testStatus === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
            {testStatus === 'idle' && <TestTube className="w-4 h-4" />}
            Test Connection
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!isValidConfig}
            className="flex-1"
          >
            Save Configuration
          </Button>
        </div>

        {/* Status Messages */}
        {testStatus === 'success' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">✅ Connection successful! AI assistant is ready to use.</p>
          </div>
        )}
        
        {testStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">❌ Connection failed. Please check your API key and try again.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
