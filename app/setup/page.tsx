'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/enter" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Editor
        </Link>

        <h1 className="text-2xl font-semibold mb-4">Setup</h1>
        <p className="text-zinc-400 mb-8">
          GitHub authentication has been removed. The editor works without any external accounts.
        </p>

        <div className="space-y-4">
          <div className="border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-2">AI API Keys (BYOK)</h2>
            <p className="text-zinc-400 text-sm mb-4">
              To use AI features, configure your own API key in the editor settings.
              Supported providers: OpenAI, Anthropic, Groq.
            </p>
            <Link href="/enter">
              <Button className="bg-purple-600 hover:bg-purple-500 text-white">
                Open Editor &amp; Configure
              </Button>
            </Link>
          </div>

          <div className="border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-2">Workspace Mode</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Organize your work into Workspaces and Categories with the new multi-panel layout.
            </p>
            <Link href="/w">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Open Workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
