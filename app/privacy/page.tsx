'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Code2, Eye, Lock, Shield } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-75 animate-pulse" />
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-300">How we protect your data and privacy</p>
        </div>

        {/* Privacy Content */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Data Collection & Usage</CardTitle>
            <CardDescription className="text-gray-400">
              White Rabbit is committed to protecting your privacy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-purple-400" />
                What We Collect
              </h3>
              <p>We only collect essential data to provide our code editor service: account information, usage analytics, and code snippets you choose to save.</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-green-400" />
                Data Security
              </h3>
              <p>Your code and data are encrypted and stored securely. We never access your private repositories or personal files without permission.</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <Code2 className="w-5 h-5 mr-2 text-blue-400" />
                AI Processing
              </h3>
              <p>AI features process your code locally when possible. Any data sent to AI providers is anonymized and used solely for code completion and suggestions.</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">Third-Party Services</h3>
              <p>We use trusted services for authentication (GitHub) and AI providers. These services have their own privacy policies and security measures.</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">Your Rights</h3>
              <p>You can export, delete, or modify your data at any time. Contact us for any privacy concerns or data requests.</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Updates */}
        <div className="text-center">
          <p className="text-gray-400 mb-6">
            This policy was last updated on January 2025. We may update it to reflect new features or legal requirements.
          </p>
          <p className="text-gray-400 mb-8">
            For privacy questions, contact us at{' '}
            <a href="mailto:privacy@whiterabbit.onl" className="text-purple-400 hover:text-purple-300">
              privacy@whiterabbit.onl
            </a>
          </p>
          
          <Link href="/">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
