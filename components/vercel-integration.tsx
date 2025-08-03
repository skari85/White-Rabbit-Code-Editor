'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileContent } from '@/hooks/use-code-builder';
import { VercelIntegration, VercelDeployment } from '@/lib/vercel-integration';
import {
  Zap,
  Upload,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Globe,
  Rocket,
  Clock,
  X,
  Shield
} from 'lucide-react';

interface VercelIntegrationProps {
  files: FileContent[];
  projectName: string;
  className?: string;
}

export default function VercelIntegrationComponent({ files, projectName, className }: VercelIntegrationProps) {
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployment, setDeployment] = useState<VercelDeployment | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [usingEnvToken, setUsingEnvToken] = useState(false);

  // Load saved token from localStorage or environment
  useEffect(() => {
    const savedToken = localStorage.getItem('vercel_api_token');
    const envToken = process.env.NEXT_PUBLIC_VERCEL_API_TOKEN;

    const tokenToUse = savedToken || envToken;
    if (tokenToUse) {
      setApiToken(tokenToUse);
      setIsConfigured(true);
      setUsingEnvToken(!savedToken && !!envToken);
      verifyToken(tokenToUse);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const vercel = new VercelIntegration(token);
      const userData = await vercel.getUser();
      setUser(userData);
      setIsConfigured(true);
      setError('');
    } catch (err) {
      setIsConfigured(false);
      setUser(null);
      setError('Invalid API token');
    }
  };

  const handleTokenSave = async () => {
    if (!VercelIntegration.isValidToken(apiToken)) {
      setError('Invalid token format');
      return;
    }

    await verifyToken(apiToken);
    if (isConfigured) {
      localStorage.setItem('vercel_api_token', apiToken);
    }
  };

  const handleTokenRemove = () => {
    setApiToken('');
    setIsConfigured(false);
    setUser(null);
    localStorage.removeItem('vercel_api_token');
  };

  const handleDeploy = async () => {
    if (!isConfigured || !apiToken) {
      setError('Please configure your Vercel API token first');
      return;
    }

    if (files.length === 0) {
      setError('No files to deploy');
      return;
    }

    setDeploying(true);
    setDeploymentStatus('deploying');
    setError('');

    try {
      const vercel = new VercelIntegration(apiToken);
      const sanitizedName = VercelIntegration.sanitizeProjectName(projectName);
      
      const deploymentResult = await vercel.deployProject(sanitizedName, files, 'production');
      setDeployment(deploymentResult);
      
      // Poll for deployment status
      pollDeploymentStatus(deploymentResult.id);
      
    } catch (err) {
      console.error('Deployment error:', err);
      setError(err instanceof Error ? err.message : 'Deployment failed');
      setDeploymentStatus('error');
    } finally {
      setDeploying(false);
    }
  };

  const pollDeploymentStatus = async (deploymentId: string) => {
    const vercel = new VercelIntegration(apiToken);
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const deploymentData = await vercel.getDeployment(deploymentId);
        setDeployment(deploymentData);

        if (VercelIntegration.isDeploymentReady(deploymentData)) {
          setDeploymentStatus('success');
          return;
        }

        if (VercelIntegration.isDeploymentFailed(deploymentData)) {
          setDeploymentStatus('error');
          setError('Deployment failed on Vercel');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setError('Deployment timeout - check Vercel dashboard');
          setDeploymentStatus('error');
        }
      } catch (err) {
        setError('Failed to check deployment status');
        setDeploymentStatus('error');
      }
    };

    poll();
  };

  const getStatusIcon = () => {
    switch (deploymentStatus) {
      case 'deploying':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Rocket className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (deploymentStatus) {
      case 'deploying':
        return 'Deploying to Vercel...';
      case 'success':
        return 'Deployed successfully!';
      case 'error':
        return 'Deployment failed';
      default:
        return 'Ready to deploy';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-black" />
          Vercel Deployment
          {isConfigured && (
            <Badge variant="outline" className="text-xs">
              <Check className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isConfigured ? (
          // Configuration Section
          <div className="space-y-3">
            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border">
              <p className="font-medium mb-1">Get your Vercel API Token:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to <a href="https://vercel.com/account/tokens" target="_blank" className="text-blue-600 underline">Vercel Account Settings</a></li>
                <li>Click "Create Token"</li>
                <li>Give it a name (e.g., "Hex & Kex")</li>
                <li>Copy and paste the token below</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Vercel API Token</Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="vercel_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="text-xs pr-8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                >
                  {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleTokenSave}
              disabled={!apiToken.trim()}
              size="sm"
              className="w-full"
            >
              <Check className="w-3 h-3 mr-1" />
              Connect to Vercel
            </Button>
          </div>
        ) : (
          // Deployment Section
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium">{user?.name || user?.username}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">@{user?.username}</p>
                    {usingEnvToken && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-2 h-2 mr-1" />
                        Auto-configured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {!usingEnvToken && (
                <Button
                  onClick={handleTokenRemove}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Disconnect
                </Button>
              )}
            </div>

            {/* Project Info */}
            <div className="space-y-2">
              <Label className="text-xs">Project: {projectName}</Label>
              <div className="text-xs text-gray-600">
                <p>Files to deploy: {files.length}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {files.slice(0, 3).map((file) => (
                    <Badge key={file.name} variant="outline" className="text-xs">
                      {file.name}
                    </Badge>
                  ))}
                  {files.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{files.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Deployment Status */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              {getStatusIcon()}
              <span className="text-xs font-medium">{getStatusText()}</span>
            </div>

            {/* Deploy Button */}
            <Button
              onClick={handleDeploy}
              disabled={deploying || files.length === 0}
              className="w-full bg-black hover:bg-gray-800"
              size="sm"
            >
              {deploying ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 mr-1" />
                  Deploy to Vercel
                </>
              )}
            </Button>

            {/* Deployment Result */}
            {deployment && deploymentStatus === 'success' && (
              <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Deployment Successful!</span>
                </div>
                <div className="space-y-2">
                  <a
                    href={VercelIntegration.getDeploymentUrl(deployment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Globe className="w-3 h-3" />
                    {deployment.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-gray-600">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Deployed {new Date(deployment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-xs p-2 bg-red-50 text-red-700 border border-red-200 rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
