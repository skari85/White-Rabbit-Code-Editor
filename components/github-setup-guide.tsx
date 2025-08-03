'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Github, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle,
  Settings,
  Key,
  Globe
} from 'lucide-react';

interface GitHubSetupGuideProps {
  onComplete?: () => void;
  className?: string;
}

export default function GitHubSetupGuide({ onComplete, className = '' }: GitHubSetupGuideProps) {
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3012';
  const callbackUrl = `${currentUrl}/api/auth/callback/github`;

  useEffect(() => {
    // Check if GitHub is already configured
    checkGitHubConfiguration();
  }, []);

  const checkGitHubConfiguration = async () => {
    try {
      const response = await fetch('/api/auth/providers');
      const providers = await response.json();
      setIsConfigured(providers && Object.keys(providers).length > 0);
    } catch (error) {
      console.error('Error checking GitHub configuration:', error);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSaveCredentials = () => {
    if (!clientId || !clientSecret) {
      alert('Please enter both Client ID and Client Secret');
      return;
    }

    // Show instructions for updating .env.local
    setStep(4);
  };

  const steps = [
    {
      title: "Create GitHub OAuth App",
      description: "Set up a new OAuth application in your GitHub settings"
    },
    {
      title: "Configure Application",
      description: "Set the correct URLs and permissions"
    },
    {
      title: "Get Credentials",
      description: "Copy your Client ID and Client Secret"
    },
    {
      title: "Update Environment",
      description: "Add credentials to your .env.local file"
    }
  ];

  if (isConfigured) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Check className="w-5 h-5" />
            GitHub OAuth Configured
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Github className="w-3 h-3 mr-1" />
              Ready to use
            </Badge>
            <p className="text-sm text-gray-600">
              GitHub authentication is properly configured and ready to use.
            </p>
            <Button 
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full"
            >
              <Github className="w-4 h-4 mr-2" />
              Test GitHub Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="w-5 h-5" />
          GitHub OAuth Setup
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          {steps.map((s, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                index + 1 <= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  index + 1 < step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Step 1: Create GitHub OAuth App</h3>
              <p className="text-sm text-gray-600 mb-4">
                You need to create a new OAuth application in your GitHub settings.
              </p>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure you're signed in to GitHub before proceeding.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => window.open('https://github.com/settings/applications/new', '_blank')}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open GitHub OAuth Apps
            </Button>
            
            <Button 
              onClick={() => setStep(2)}
              variant="outline"
              className="w-full"
            >
              I've opened GitHub settings
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Step 2: Configure Your OAuth App</h3>
              <p className="text-sm text-gray-600 mb-4">
                Fill in the following details in the GitHub OAuth app form:
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <Label className="text-xs font-medium text-gray-700">Application name</Label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-sm">Hex & Kex PWA Builder</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard('Hex & Kex PWA Builder', 'name')}
                  >
                    {copied === 'name' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <Label className="text-xs font-medium text-gray-700">Homepage URL</Label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-sm">{currentUrl}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(currentUrl, 'homepage')}
                  >
                    {copied === 'homepage' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <Label className="text-xs font-medium text-gray-700">Authorization callback URL</Label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-sm break-all">{callbackUrl}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(callbackUrl, 'callback')}
                  >
                    {copied === 'callback' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                App Created
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Step 3: Get Your Credentials</h3>
              <p className="text-sm text-gray-600 mb-4">
                After creating the OAuth app, copy your Client ID and Client Secret:
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Paste your GitHub Client ID here"
                />
              </div>
              
              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Paste your GitHub Client Secret here"
                />
              </div>
            </div>
            
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Keep your Client Secret secure. Never commit it to version control.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={handleSaveCredentials} className="flex-1" disabled={!clientId || !clientSecret}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Step 4: Update Environment File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add these credentials to your <code>.env.local</code> file:
              </p>
            </div>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="space-y-1">
                <div>GITHUB_CLIENT_ID={clientId}</div>
                <div>GITHUB_CLIENT_SECRET={clientSecret}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-green-400 hover:text-green-300"
                onClick={() => copyToClipboard(`GITHUB_CLIENT_ID=${clientId}\nGITHUB_CLIENT_SECRET=${clientSecret}`, 'env')}
              >
                {copied === 'env' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                Copy to clipboard
              </Button>
            </div>
            
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                After updating .env.local, restart your development server for changes to take effect.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => {
                  onComplete?.();
                  window.location.reload();
                }} 
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
