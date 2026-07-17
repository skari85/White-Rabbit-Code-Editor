'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Globe2, LinkIcon } from 'lucide-react';
import { FileContent } from '@/hooks/use-code-builder';
import { VercelIntegration } from '@/lib/vercel-integration';
import { NetlifyIntegration } from '@/lib/netlify-integration';
import { buildDeployableFiles } from '@/lib/space-engine';

type Platform = 'vercel' | 'netlify';

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileContent[];
}

const PLATFORM_COPY: Record<
  Platform,
  { label: string; tokenLabel: string; tokenPlaceholder: string }
> = {
  vercel: {
    label: 'Vercel',
    tokenLabel: 'Vercel API Token',
    tokenPlaceholder: 'VERCEL_API_TOKEN',
  },
  netlify: {
    label: 'Netlify',
    tokenLabel: 'Netlify Personal Access Token',
    tokenPlaceholder: 'NETLIFY_ACCESS_TOKEN',
  },
};

export default function PublishModal({
  open,
  onOpenChange,
  files,
}: PublishModalProps) {
  const [platform, setPlatform] = useState<Platform>('vercel');
  const [projectName, setProjectName] = useState('my-app');
  const [apiToken, setApiToken] = useState('');
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeployVercel = async () => {
    const deployableFiles = await buildDeployableFiles(files, projectName);
    const vercel = new VercelIntegration(apiToken);
    const deployment = await vercel.deployProject(
      projectName,
      deployableFiles,
      'production'
    );
    setDeployUrl(`https://${deployment.url}`);
  };

  const handleDeployNetlify = async () => {
    const deployableFiles = await buildDeployableFiles(files, projectName);
    const netlify = new NetlifyIntegration(apiToken);
    const deployment = await netlify.deployProject(
      projectName,
      deployableFiles
    );
    setDeployUrl(`https://${NetlifyIntegration.getDeploymentUrl(deployment)}`);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    setDeployUrl(null);
    try {
      if (!apiToken) {
        setError(
          `Enter your ${PLATFORM_COPY[platform].label} token to deploy.`
        );
        setIsDeploying(false);
        return;
      }
      if (platform === 'vercel') {
        await handleDeployVercel();
      } else {
        await handleDeployNetlify();
      }
    } catch (e: any) {
      setError(e?.message || 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const handlePlatformChange = (next: Platform) => {
    setPlatform(next);
    setApiToken('');
    setDeployUrl(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='text-base sm:text-lg'>
            Publish to {PLATFORM_COPY[platform].label}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 max-h-[60vh] overflow-y-auto'>
          <div className='flex gap-2'>
            {(Object.keys(PLATFORM_COPY) as Platform[]).map(p => (
              <Button
                key={p}
                type='button'
                variant={platform === p ? 'default' : 'outline'}
                onClick={() => handlePlatformChange(p)}
                className='flex-1 text-sm'
              >
                {PLATFORM_COPY[p].label}
              </Button>
            ))}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='project-name' className='text-sm'>
              Project Name
            </Label>
            <Input
              id='project-name'
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className='text-sm'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='deploy-token' className='text-sm'>
              {PLATFORM_COPY[platform].tokenLabel}
            </Label>
            <Input
              id='deploy-token'
              value={apiToken}
              onChange={e => setApiToken(e.target.value)}
              placeholder={PLATFORM_COPY[platform].tokenPlaceholder}
              className='text-sm'
            />
            <div className='text-xs text-muted-foreground'>
              Token is used client-side for demo purposes. For production, proxy
              through a server.
            </div>
          </div>

          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            className='w-full text-sm'
          >
            {isDeploying ? 'Deploying…' : 'Deploy'}
          </Button>

          {error && <div className='text-xs text-red-500'>{error}</div>}

          {deployUrl && (
            <div className='rounded border p-3 space-y-3'>
              <div className='flex items-center gap-2 text-sm'>
                <Globe2 className='w-4 h-4' />
                <span>Your app is live</span>
              </div>
              <div className='space-y-2'>
                <Input readOnly value={deployUrl} className='text-xs' />
                <Button variant='outline' asChild className='w-full text-xs'>
                  <a href={deployUrl} target='_blank' rel='noopener noreferrer'>
                    <ExternalLink className='w-4 h-4 mr-2' />
                    Open Live Site
                  </a>
                </Button>
              </div>
              <div className='text-xs text-muted-foreground'>
                You can connect a custom domain later in{' '}
                {PLATFORM_COPY[platform].label}. A shareable preview URL is
                available immediately.
              </div>
              <div className='text-xs text-muted-foreground'>
                Open this link on your phone and tap{' '}
                <strong>Add to Home Screen</strong> (iPhone) or{' '}
                <strong>Install app</strong> (Android) to add it like a real
                app.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
