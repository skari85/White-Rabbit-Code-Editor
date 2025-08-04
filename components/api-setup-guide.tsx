'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  ExternalLink, 
  Copy, 
  Check,
  AlertCircle,
  Cloud,
  Camera,
  BarChart3,
  Github,
  Bot,
  Zap
} from 'lucide-react';

interface APISetupGuideProps {
  className?: string;
}

const API_SERVICES = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: Cloud,
    color: 'text-blue-500',
    description: 'Save and sync your projects to Google Drive',
    envVars: ['NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    steps: [
      'Go to Google Cloud Console: https://console.cloud.google.com/',
      'Create a new project or select existing one',
      'Enable the Google Drive API',
      'Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"',
      'Set Application type to "Web application"',
      'Add authorized redirect URI: http://localhost:3015',
      'Copy Client ID and Client Secret'
    ],
    helpUrl: 'https://console.cloud.google.com/apis/credentials'
  },
  {
    id: 'unsplash',
    name: 'Unsplash Images',
    icon: Camera,
    color: 'text-pink-500',
    description: 'Access millions of free stock photos',
    envVars: ['NEXT_PUBLIC_UNSPLASH_ACCESS_KEY'],
    steps: [
      'Go to Unsplash Developers: https://unsplash.com/developers',
      'Sign up or log in to your Unsplash account',
      'Click "New Application"',
      'Fill in application details (name: "Hex & Kex PWA Builder")',
      'Accept the API terms',
      'Copy your "Access Key" from the application page'
    ],
    helpUrl: 'https://unsplash.com/developers'
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    icon: BarChart3,
    color: 'text-orange-500',
    description: 'Track website analytics and user behavior',
    envVars: ['NEXT_PUBLIC_GA_MEASUREMENT_ID'],
    steps: [
      'Go to Google Analytics: https://analytics.google.com/',
      'Sign in with your Google account',
      'Click "Start measuring" or create new property',
      'Set up your property (name: "Hex & Kex Projects")',
      'Choose "Web" as platform',
      'Enter your website URL (http://localhost:3015 for testing)',
      'Copy the Measurement ID (starts with G-)'
    ],
    helpUrl: 'https://analytics.google.com/'
  },
  {
    id: 'github',
    name: 'GitHub OAuth',
    icon: Github,
    color: 'text-gray-800',
    description: 'Enable GitHub login and repository sync',
    envVars: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
    steps: [
      'Go to GitHub Settings: https://github.com/settings/applications/new',
      'Create a new OAuth App',
      'Application name: "Hex & Kex Code Editor"',
      'Homepage URL: http://localhost:3012',
      'Authorization callback URL: http://localhost:3012/api/auth/callback/github',
      'Click "Register application"',
      'Copy Client ID and generate Client Secret'
    ],
    helpUrl: 'https://github.com/settings/applications/new'
  },
  {
    id: 'ai-providers',
    name: 'AI Providers',
    icon: Bot,
    color: 'text-purple-500',
    description: 'Configure AI chat with various providers',
    envVars: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GROQ_API_KEY', 'GOOGLE_AI_API_KEY'],
    steps: [
      'OpenAI: https://platform.openai.com/api-keys',
      'Anthropic: https://console.anthropic.com/',
      'Groq: https://console.groq.com/keys',
      'Google AI: https://makersuite.google.com/app/apikey',
      'Mistral: https://console.mistral.ai/',
      'Create API keys from each provider you want to use'
    ],
    helpUrl: 'https://platform.openai.com/api-keys'
  }
];

export default function APISetupGuide({ className }: APISetupGuideProps) {
  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const generateEnvTemplate = () => {
    return `# Hex & Kex PWA Builder - API Configuration
# Copy this to your .env.local file and fill in your actual API keys

# GitHub OAuth Integration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Google Services Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id-here
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret-here

# Unsplash Integration
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your-unsplash-access-key-here

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# AI Provider API Keys
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
GROQ_API_KEY=gsk-your-groq-api-key-here
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
MISTRAL_API_KEY=your-mistral-api-key-here

# Vercel Integration (Already configured)
VERCEL_API_TOKEN=frwdRhsmuJZniOWPCvkEQinO
NEXT_PUBLIC_VERCEL_API_TOKEN=frwdRhsmuJZniOWPCvkEQinO

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3015
NEXTAUTH_SECRET=hex-kex-development-secret-key-2024-make-it-very-long-and-random`;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-500" />
            API Setup Guide
            <Badge variant="outline">Configuration Required</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded border">
                <h3 className="font-semibold mb-2">🚀 Quick Setup Overview</h3>
                <p className="mb-3">To unlock all features, you'll need API keys from these services:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {API_SERVICES.map(service => {
                    const Icon = service.icon;
                    return (
                      <div key={service.id} className="flex items-center gap-2 p-2 bg-white rounded">
                        <Icon className={`w-4 h-4 ${service.color}`} />
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-gray-500">{service.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="text-sm">
                <h3 className="font-semibold mb-2">📋 Setup Priority:</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li><strong>Google Drive</strong> - For project backup and sync</li>
                  <li><strong>Unsplash</strong> - For free stock images</li>
                  <li><strong>AI Providers</strong> - For AI chat assistance</li>
                  <li><strong>Google Analytics</strong> - For website tracking</li>
                  <li><strong>GitHub OAuth</strong> - For GitHub integration</li>
                </ol>
              </div>
            </TabsContent>
            
            <TabsContent value="services" className="space-y-4">
              {API_SERVICES.map(service => {
                const Icon = service.icon;
                return (
                  <Card key={service.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${service.color}`} />
                        {service.name}
                        <Button
                          onClick={() => window.open(service.helpUrl, '_blank')}
                          variant="ghost"
                          size="sm"
                          className="ml-auto p-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-gray-600">{service.description}</p>
                      
                      <div>
                        <p className="text-xs font-medium mb-1">Environment Variables:</p>
                        <div className="flex flex-wrap gap-1">
                          {service.envVars.map(envVar => (
                            <Badge key={envVar} variant="outline" className="text-xs font-mono">
                              {envVar}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium mb-2">Setup Steps:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600">
                          {service.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
            
            <TabsContent value="template" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Environment Variables Template</h3>
                  <Button
                    onClick={() => copyToClipboard(generateEnvTemplate())}
                    variant="outline"
                    size="sm"
                  >
                    {copiedText === generateEnvTemplate() ? (
                      <Check className="w-3 h-3 mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    Copy Template
                  </Button>
                </div>
                
                <div className="relative">
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-96">
                    <code>{generateEnvTemplate()}</code>
                  </pre>
                </div>
                
                <div className="text-xs text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Important:</p>
                      <ul className="space-y-1">
                        <li>• Copy this template to your <code>.env.local</code> file</li>
                        <li>• Replace placeholder values with your actual API keys</li>
                        <li>• Restart your development server after adding keys</li>
                        <li>• Never commit API keys to version control</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
