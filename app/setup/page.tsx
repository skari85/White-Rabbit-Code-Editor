'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Copy, ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SetupPage() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const setupSteps = [
    {
      id: 1,
      title: "Create GitHub OAuth App",
      description: "Set up a new OAuth application in your GitHub settings",
      action: "Go to GitHub Developer Settings",
      url: "https://github.com/settings/developers",
      details: [
        "Click 'New OAuth App'",
        "Fill in the application details",
        "Copy the generated credentials"
      ]
    },
    {
      id: 2,
      title: "Configure Application Details",
      description: "Use these exact values for your OAuth app configuration",
      copyItems: [
        { label: "Application Name", value: "White Rabbit Code Editor (Local)" },
        { label: "Homepage URL", value: "http://localhost:3012" },
        { label: "Authorization Callback URL", value: "http://localhost:3012/api/auth/callback/github" }
      ]
    },
    {
      id: 3,
      title: "Update Environment Variables",
      description: "Add your GitHub OAuth credentials to the environment file",
      envExample: `# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_actual_client_id_here
GITHUB_CLIENT_SECRET=your_actual_client_secret_here`
    },
    {
      id: 4,
      title: "Restart Development Server",
      description: "Restart the server to apply the new configuration",
      command: "npm run dev"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/enter">
            <Button variant="ghost" className="text-gray-400 hover:text-gray-200 font-mono">
              <ArrowLeft className="w-4 h-4 mr-2" />
              back to editor
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Github className="w-8 h-8 text-gray-400" />
            <h1 className="text-3xl font-mono font-light">GitHub OAuth Setup</h1>
          </div>
          <p className="text-gray-400 font-mono">
            Configure GitHub authentication for White Rabbit Code Editor
          </p>
        </div>
        {/* Setup Steps */}
        <div className="space-y-6">
          {setupSteps.map((step) => (
            <Card key={step.id} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-zinc-700 text-gray-400 font-mono">
                    {step.id}
                  </Badge>
                  <CardTitle className="text-gray-100 font-mono">{step.title}</CardTitle>
                </div>
                <CardDescription className="text-gray-400 font-mono text-sm">
                  {step.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* External Link */}
                {step.url && (
                  <Button
                    asChild
                    className="bg-zinc-800 hover:bg-zinc-700 text-gray-100 border border-zinc-700 font-mono"
                  >
                    <a href={step.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {step.action}
                    </a>
                  </Button>
                )}

                {/* Copy Items */}
                {step.copyItems && (
                  <div className="space-y-3">
                    {step.copyItems.map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                        <div>
                          <div className="text-sm font-mono text-gray-300">{item.label}</div>
                          <div className="text-xs font-mono text-gray-500">{item.value}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(item.value, item.label)}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          {copiedItem === item.label ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Environment Example */}
                {step.envExample && (
                  <div className="space-y-2">
                    <div className="text-sm font-mono text-gray-400">Add to .env.local:</div>
                    <div className="relative">
                      <pre className="bg-zinc-800 p-4 rounded-lg text-sm font-mono text-gray-300 overflow-x-auto">
                        {step.envExample}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(step.envExample!, 'env')}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                      >
                        {copiedItem === 'env' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Command */}
                {step.command && (
                  <div className="space-y-2">
                    <div className="text-sm font-mono text-gray-400">Run this command:</div>
                    <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                      <code className="flex-1 font-mono text-gray-300">{step.command}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(step.command!, 'command')}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        {copiedItem === 'command' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Details */}
                {step.details && (
                  <div className="space-y-1">
                    {step.details.map((detail, index) => (
                      <div key={index} className="text-sm font-mono text-gray-500">
                        • {detail}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-zinc-800 hover:bg-zinc-700 text-gray-100 border border-zinc-700 font-mono">
            <Link href="/auth/signin">
              <Github className="w-4 h-4 mr-2" />
              Test GitHub Sign In
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-zinc-700 text-gray-400 hover:bg-zinc-800 font-mono">
            <Link href="/enter">
              Continue to Editor
            </Link>
          </Button>
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-gray-100 font-mono text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm font-mono text-gray-400">
              If you encounter issues during setup:
            </div>
            <ul className="space-y-1 text-sm font-mono text-gray-500">
              <li>• Make sure the callback URL exactly matches: <code className="text-green-400">http://localhost:3012/api/auth/callback/github</code></li>
              <li>• Restart the development server after updating environment variables</li>
              <li>• Check the browser console for error messages</li>
              <li>• Ensure your GitHub OAuth app is not suspended</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
