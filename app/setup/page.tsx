'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Github, Settings } from 'lucide-react';
import GitHubSetupGuide from '@/components/github-setup-guide';
import Link from 'next/link';

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Editor
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <img 
                  src="/hexkexlogo.png" 
                  alt="Hex & Kex Logo" 
                  className="w-8 h-8 object-contain"
                />
                <h1 className="text-xl font-semibold">Hex & Kex Setup</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Welcome to Hex & Kex Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Configure your Hex & Kex Code Editor with GitHub authentication to unlock
                powerful features like repository sync, collaboration, and deployment.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">What you'll get:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Sign in with your GitHub account</li>
                  <li>• Sync projects to GitHub repositories</li>
                  <li>• Collaborate with team members</li>
                  <li>• Deploy to Vercel with one click</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* GitHub Setup */}
          <GitHubSetupGuide 
            onComplete={() => {
              // Redirect to main app after setup
              window.location.href = '/';
            }}
          />

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Common Issues</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Make sure you're signed in to GitHub</li>
                    <li>• Use the exact URLs provided in the setup</li>
                    <li>• Restart your dev server after updating .env.local</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Resources</h4>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app', '_blank')}
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub OAuth Docs
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
