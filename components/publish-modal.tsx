'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Globe2, LinkIcon } from 'lucide-react';
import { FileContent } from '@/hooks/use-code-builder';
import { VercelIntegration } from '@/lib/vercel-integration';

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileContent[];
}

export default function PublishModal({ open, onOpenChange, files }: PublishModalProps) {
  const [projectName, setProjectName] = useState('my-app');
  const [apiToken, setApiToken] = useState('');
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    setDeployUrl(null);
    try {
      if (!apiToken) {
        setError('Enter your Vercel API token to deploy.');
        setIsDeploying(false);
        return;
      }
      const vercel = new VercelIntegration(apiToken);
      const deployment = await vercel.deployProject(projectName, files, 'production');
      setDeployUrl(`https://${deployment.url}`);
    } catch (e: any) {
      setError(e?.message || 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Publish to Vercel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-sm">Project Name</Label>
            <Input id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="text-sm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vercel-token" className="text-sm">Vercel API Token</Label>
            <Input id="vercel-token" value={apiToken} onChange={(e) => setApiToken(e.target.value)} placeholder="VERCEL_API_TOKEN" className="text-sm" />
            <div className="text-xs text-muted-foreground">Token is used client-side for demo purposes. For production, proxy through a server.</div>
          </div>

          <Button onClick={handleDeploy} disabled={isDeploying} className="w-full text-sm">
            {isDeploying ? 'Deploying…' : 'Deploy'}
          </Button>

          {error && <div className="text-xs text-red-500">{error}</div>}

          {deployUrl && (
            <div className="rounded border p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Globe2 className="w-4 h-4" />
                <span>Your app is live</span>
              </div>
              <div className="space-y-2">
                <Input readOnly value={deployUrl} className="text-xs" />
                <Button variant="outline" asChild className="w-full text-xs">
                  <a href={deployUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Live Site
                  </a>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">You can connect a custom domain later in Vercel. A shareable preview URL is available immediately.</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

