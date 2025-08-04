'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { FileContent } from '@/hooks/use-code-builder';
import { 
  Github, 
  Upload, 
  Download, 
  GitBranch, 
  Check, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface GitHubIntegrationProps {
  files: FileContent[];
  projectName: string;
  className?: string;
}

export default function GitHubIntegration({ files, projectName, className }: GitHubIntegrationProps) {
  const { data: session } = useSession();
  const [repoName, setRepoName] = useState(projectName.toLowerCase().replace(/\s+/g, '-'));
  const [description, setDescription] = useState(`Project created with Hex & Kex Code Editor`);
  const [isPrivate, setIsPrivate] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<'success' | 'error' | null>(null);
  const [repoUrl, setRepoUrl] = useState<string>('');

  const handleCreateRepo = async () => {
    if (!session?.accessToken) {
      alert('Please sign in with GitHub first');
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      // Create repository
      const repoResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description,
          private: isPrivate,
          auto_init: true,
        }),
      });

      if (!repoResponse.ok) {
        throw new Error(`Failed to create repository: ${repoResponse.statusText}`);
      }

      const repo = await repoResponse.json();
      setRepoUrl(repo.html_url);

      // Upload files to repository
      for (const file of files) {
        const content = btoa(unescape(encodeURIComponent(file.content))); // Base64 encode
        
        await fetch(`https://api.github.com/repos/${session.user?.name}/${repoName}/contents/${file.name}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Add ${file.name}`,
            content,
          }),
        });
      }

      // Create README.md
      const readmeContent = `# ${projectName}

Project created with [Hex & Kex Code Editor](https://github.com/skari85/pwa-code)

## Files
${files.map(file => `- \`${file.name}\` (${file.type})`).join('\n')}

## Getting Started

1. Clone this repository
2. Open \`index.html\` in your browser
3. Start developing!

## About Hex & Kex

Hex & Kex is an AI-powered code editor that lets developers create applications through intelligent code generation and conversational AI.

---
*Generated on ${new Date().toLocaleDateString()}*
`;

      const readmeBase64 = btoa(unescape(encodeURIComponent(readmeContent)));
      
      await fetch(`https://api.github.com/repos/${session.user?.name}/${repoName}/contents/README.md`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Add README.md',
          content: readmeBase64,
        }),
      });

      setSyncResult('success');
    } catch (error) {
      console.error('GitHub sync error:', error);
      setSyncResult('error');
    } finally {
      setSyncing(false);
    }
  };

  if (!session?.user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-gray-500">
            <Github className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Sign in with GitHub to sync your projects</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Github className="w-4 h-4" />
          GitHub Integration
          <Badge variant="outline" className="text-xs">
            <Check className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-6 h-6 rounded-full"
            />
          )}
          <div>
            <p className="text-xs font-medium">{session.user.name}</p>
            <p className="text-xs text-gray-500">@{session.user.name}</p>
          </div>
        </div>

        {/* Repository Settings */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Repository Name</Label>
            <Input
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-code-project"
              className="text-xs"
            />
          </div>
          
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description..."
              className="text-xs"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-3 h-3"
            />
            <Label htmlFor="private" className="text-xs">
              Private repository
            </Label>
          </div>
        </div>

        {/* Files to Upload */}
        <div className="space-y-2">
          <Label className="text-xs">Files to upload ({files.length})</Label>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {files.map((file) => (
              <div key={file.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{file.name}</span>
                <Badge variant="outline" className="text-xs">
                  {file.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Button */}
        <Button
          onClick={handleCreateRepo}
          disabled={syncing || !repoName.trim()}
          className="w-full"
          size="sm"
        >
          {syncing ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Creating Repository...
            </>
          ) : (
            <>
              <Upload className="w-3 h-3 mr-1" />
              Create GitHub Repository
            </>
          )}
        </Button>

        {/* Result */}
        {syncResult && (
          <div className={`text-xs p-2 rounded flex items-center gap-1 ${
            syncResult === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {syncResult === 'success' ? (
              <>
                <Check className="w-3 h-3" />
                Repository created successfully!
                {repoUrl && (
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 underline flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Failed to create repository. Check console for details.
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
