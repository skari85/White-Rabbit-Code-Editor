'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompileVibes } from '@/components/compile-vibes';
import { useCompileVibes } from '@/hooks/use-compile-vibes';
import { CompileVibeConfig } from '@/lib/compile-vibes-service';
import { 
  Flower, 
  Heart, 
  Palette, 
  Settings, 
  Sparkles, 
  Target, 
  Zap 
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export interface CompileVibesSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function CompileVibesSettings({
  isOpen = true,
  onClose,
  className = ''
}: CompileVibesSettingsProps) {
  const { config, updateConfig, getStats } = useCompileVibes();
  const [localConfig, setLocalConfig] = useState<CompileVibeConfig>(config);
  const [previewState, setPreviewState] = useState<'idle' | 'building' | 'success' | 'failure'>('idle');

  // Sync local config with global config
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Update local config
  const updateLocalConfig = useCallback((updates: Partial<CompileVibeConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Save configuration
  const saveConfig = useCallback(() => {
    updateConfig(localConfig);
    onClose?.();
  }, [localConfig, updateConfig, onClose]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaultConfig: CompileVibeConfig = {
      enabled: true,
      showForCommands: [],
      animationDuration: 2000,
      autoHideDelay: 3000,
      position: 'top-right',
      size: 'medium',
      sensitivity: 'medium'
    };
    setLocalConfig(defaultConfig);
  }, []);

  // Preview animation
  const previewAnimation = useCallback((state: typeof previewState) => {
    setPreviewState(state);
    setTimeout(() => setPreviewState('idle'), 3000);
  }, []);

  const stats = getStats();

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Compile Vibes Settings
          </CardTitle>
          <CardDescription>
            Configure organic feedback animations for your build processes
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[70vh]">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="commands" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Commands
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Flower className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enable Compile Vibes</CardTitle>
                  <CardDescription>
                    Turn on organic feedback animations for build and compile processes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={localConfig.enabled}
                      onCheckedChange={(enabled) => updateLocalConfig({ enabled })}
                    />
                    <Label htmlFor="enabled">
                      {localConfig.enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Animation Timing</CardTitle>
                  <CardDescription>
                    Configure how long animations play and when they disappear
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="duration">Animation Duration: {localConfig.animationDuration}ms</Label>
                    <Slider
                      id="duration"
                      min={1000}
                      max={5000}
                      step={100}
                      value={[localConfig.animationDuration]}
                      onValueChange={([value]) => updateLocalConfig({ animationDuration: value })}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="autoHide">Auto-hide Delay: {localConfig.autoHideDelay}ms</Label>
                    <Slider
                      id="autoHide"
                      min={1000}
                      max={10000}
                      step={500}
                      value={[localConfig.autoHideDelay]}
                      onValueChange={([value]) => updateLocalConfig({ autoHideDelay: value })}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detection Sensitivity</CardTitle>
                  <CardDescription>
                    How sensitive the system is to detecting build/compile commands
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localConfig.sensitivity}
                    onValueChange={(sensitivity: 'low' | 'medium' | 'high') => 
                      updateLocalConfig({ sensitivity })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        Low - Only exact command matches
                      </SelectItem>
                      <SelectItem value="medium">
                        Medium - Common build patterns
                      </SelectItem>
                      <SelectItem value="high">
                        High - Any command that looks like building
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Position</CardTitle>
                  <CardDescription>
                    Where animations appear on your screen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localConfig.position}
                    onValueChange={(position: CompileVibeConfig['position']) => 
                      updateLocalConfig({ position })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Size</CardTitle>
                  <CardDescription>
                    How large the animations appear
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localConfig.size}
                    onValueChange={(size: CompileVibeConfig['size']) => 
                      updateLocalConfig({ size })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (60px)</SelectItem>
                      <SelectItem value="medium">Medium (100px)</SelectItem>
                      <SelectItem value="large">Large (140px)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commands" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tracked Commands</CardTitle>
                  <CardDescription>
                    Commands that trigger compile vibes animations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Build Commands:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• npm run build, npm run dev</div>
                      <div>• yarn build, yarn dev</div>
                      <div>• next build, next dev</div>
                      <div>• vite build, vite dev</div>
                      <div>• electron:dev, electron:build</div>
                      <div>• webpack, rollup, tsc</div>
                    </div>
                    
                    <div className="text-sm font-medium mt-4">Test Commands:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• npm test, yarn test</div>
                      <div>• jest, vitest, cypress</div>
                      <div>• playwright</div>
                    </div>
                    
                    <div className="text-sm font-medium mt-4">Deploy Commands:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• npm publish, yarn publish</div>
                      <div>• vercel deploy, netlify deploy</div>
                      <div>• docker build, docker push</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {stats.total > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistics</CardTitle>
                    <CardDescription>
                      Your compile vibes usage statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
                        <div className="text-sm text-gray-600">Successful Builds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                        <div className="text-sm text-gray-600">Failed Builds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                        <div className="text-sm text-gray-600">Active Builds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(stats.successRate)}%
                        </div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Animation Preview</CardTitle>
                  <CardDescription>
                    Test how your compile vibes will look
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewAnimation('building')}
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Building
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewAnimation('success')}
                      >
                        <Flower className="w-4 h-4 mr-1" />
                        Success
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewAnimation('failure')}
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        Failure
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-8 bg-gray-50 flex items-center justify-center min-h-[200px]">
                      {previewState !== 'idle' ? (
                        <CompileVibes
                          state={previewState}
                          size={localConfig.size}
                          duration={localConfig.animationDuration}
                          onAnimationComplete={() => setPreviewState('idle')}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Click a button above to preview animations</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={saveConfig}>
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
