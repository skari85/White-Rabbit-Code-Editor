'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Eye, EyeOff, Check, AlertTriangle, Info } from 'lucide-react';
import { AISettings } from '@/types/ai';

interface BYOKAISettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AISettings;
  onSaveSettings: (settings: AISettings) => void;
}

export default function BYOKAISettings({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onSaveSettings 
}: BYOKAISettingsProps) {
  const [settings, setSettings] = useState<AISettings>(currentSettings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = () => {
    // Save to localStorage for persistence
    localStorage.setItem('byok-ai-settings', JSON.stringify(settings));
    onSaveSettings(settings);
    onClose();
  };

  const testConnection = async () => {
    if (!settings.apiKey) {
      setConnectionStatus('error');
      setErrorMessage('Please enter an API key');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      // Simple test request based on provider
      let testUrl = '';
      let testHeaders: Record<string, string> = {};
      let testBody: any = {};

      switch (settings.provider) {
        case 'openai':
          testUrl = 'https://api.openai.com/v1/models';
          testHeaders = {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json'
          };
          break;
        case 'anthropic':
          testUrl = 'https://api.anthropic.com/v1/messages';
          testHeaders = {
            'x-api-key': settings.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          };
          testBody = {
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          };
          break;
        case 'groq':
          testUrl = 'https://api.groq.com/openai/v1/models';
          testHeaders = {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json'
          };
          break;
      }

      const response = await fetch(testUrl, {
        method: settings.provider === 'anthropic' ? 'POST' : 'GET',
        headers: testHeaders,
        ...(settings.provider === 'anthropic' && { body: JSON.stringify(testBody) })
      });

      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setErrorMessage(`API returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'openai':
        return {
          name: 'OpenAI',
          description: 'GPT-4, GPT-3.5-turbo models',
          keyFormat: 'sk-...',
          website: 'https://platform.openai.com/api-keys'
        };
      case 'anthropic':
        return {
          name: 'Anthropic',
          description: 'Claude 3 models (Opus, Sonnet, Haiku)',
          keyFormat: 'sk-ant-...',
          website: 'https://console.anthropic.com/'
        };
      case 'groq':
        return {
          name: 'Groq',
          description: 'Fast inference for Llama, Mixtral models',
          keyFormat: 'gsk_...',
          website: 'https://console.groq.com/keys'
        };
      default:
        return {
          name: 'Unknown',
          description: '',
          keyFormat: '',
          website: ''
        };
    }
  };

  const providerInfo = getProviderInfo(settings.provider);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Settings - Bring Your Own Key (BYOK)</CardTitle>
              <CardDescription>
                Configure your own AI provider API keys for enhanced privacy and control
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select
              value={settings.provider}
              onValueChange={(value: 'openai' | 'anthropic' | 'groq') => 
                setSettings({ ...settings, provider: value, apiKey: '' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4, GPT-3.5)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude 3)</SelectItem>
                <SelectItem value="groq">Groq (Fast Inference)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Provider Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{providerInfo.name}:</strong> {providerInfo.description}
              <br />
              <strong>Key format:</strong> {providerInfo.keyFormat}
              <br />
              <a 
                href={providerInfo.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Get your API key →
              </a>
            </AlertDescription>
          </Alert>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder={`Enter your ${providerInfo.name} API key`}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={settings.model}
              onValueChange={(value) => setSettings({ ...settings, model: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {settings.provider === 'openai' && (
                  <>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </>
                )}
                {settings.provider === 'anthropic' && (
                  <>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                  </>
                )}
                {settings.provider === 'groq' && (
                  <>
                    <SelectItem value="llama2-70b-4096">Llama 2 70B</SelectItem>
                    <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                    <SelectItem value="gemma-7b-it">Gemma 7B</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Connection Test */}
          <div className="space-y-2">
            <Button
              onClick={testConnection}
              disabled={!settings.apiKey || testingConnection}
              className="w-full"
            >
              {testingConnection ? 'Testing Connection...' : 'Test Connection'}
            </Button>
            
            {connectionStatus === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Connection successful! Your API key is working correctly.
                </AlertDescription>
              </Alert>
            )}
            
            {connectionStatus === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Connection failed: {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Privacy Notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy:</strong> Your API keys are stored locally in your browser and never sent to our servers. 
              All AI requests go directly from your browser to your chosen provider.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Settings
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
