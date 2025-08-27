'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Code2, FileText, Users } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-75 animate-pulse" />
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-300">Rules and guidelines for using White Rabbit</p>
        </div>

        {/* Terms Content */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Acceptance & Usage</CardTitle>
            <CardDescription className="text-gray-400">
              By using White Rabbit, you agree to these terms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <Code2 className="w-5 h-5 mr-2 text-purple-400" />
                Code Editor Service
              </h3>
              <p>White Rabbit provides an AI-powered code editor. You&apos;re responsible for the code you write and any third-party code you use. We don&apos;t guarantee code quality or functionality.</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-400" />
                User Conduct
              </h3>
              <p>Use White Rabbit responsibly. Don&apos;t create harmful code, violate intellectual property rights, or use the service for illegal activities. Be respectful of other users.</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                AI Features &amp; Limitations
              </h3>
              <p>AI suggestions are for assistance only. Always review and test AI-generated code. We&apos;re not liable for any issues caused by AI suggestions or generated code.</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">Data &amp; Privacy</h3>
              <p>Your code and data belong to you. We process data as outlined in our Privacy Policy. You retain ownership of your intellectual property.</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">Service Availability</h3>
              <p>We strive for 99.9% uptime but don&apos;t guarantee uninterrupted service. We may perform maintenance or updates that temporarily affect availability.</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-2">Limitation of Liability</h3>
              <p>White Rabbit is provided &quot;as is.&quot; We&apos;re not liable for any damages, data loss, or issues arising from using our service or AI features.</p>
            </div>
          </CardContent>
        </Card>

        {/* Updates & Contact */}
        <div className="text-center">
          <p className="text-gray-400 mb-6">
            These terms were last updated on January 2025. Continued use of White Rabbit constitutes acceptance of any changes.
          </p>
          <p className="text-gray-400 mb-8">
            For questions about these terms, contact us at{' '}
            <a href="mailto:legal@whiterabbit.onl" className="text-purple-400 hover:text-purple-300">
              legal@whiterabbit.onl
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
