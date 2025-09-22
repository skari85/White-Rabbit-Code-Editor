'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompileVibes } from '@/components/compile-vibes';
import { useCompileVibes } from '@/hooks/use-compile-vibes';
import { 
  Coffee, 
  Flower, 
  Heart, 
  Play, 
  Sparkles, 
  Terminal, 
  Zap 
} from 'lucide-react';
import { useCallback, useState } from 'react';

export interface CompileVibesDemoProps {
  className?: string;
}

export function CompileVibesDemo({ className = '' }: CompileVibesDemoProps) {
  const [demoState, setDemoState] = useState<'idle' | 'building' | 'progress' | 'success' | 'failure'>('idle');
  const [demoProgress, setDemoProgress] = useState(0);
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  const { startCommand, updateProgress, completeSuccess, completeFailure } = useCompileVibes();

  // Run a simulated build process
  const runBuildDemo = useCallback(async () => {
    if (isRunningDemo) return;
    
    setIsRunningDemo(true);
    setDemoState('building');
    
    // Start tracking
    const eventId = startCommand('npm run build');
    
    // Simulate building phase
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Switch to progress
    setDemoState('progress');
    setDemoProgress(0);
    
    // Simulate progress updates
    for (let i = 0; i <= 100; i += 10) {
      setDemoProgress(i);
      if (eventId) updateProgress(eventId, i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Random success or failure
    const success = Math.random() > 0.3; // 70% success rate
    
    if (success) {
      setDemoState('success');
      if (eventId) completeSuccess(eventId, 'Build completed successfully!');
    } else {
      setDemoState('failure');
      if (eventId) completeFailure(eventId, 1, 'Build failed with errors');
    }
    
    // Reset after animation
    setTimeout(() => {
      setDemoState('idle');
      setDemoProgress(0);
      setIsRunningDemo(false);
    }, 3000);
  }, [isRunningDemo, startCommand, updateProgress, completeSuccess, completeFailure]);

  // Run test demo
  const runTestDemo = useCallback(async () => {
    if (isRunningDemo) return;
    
    setIsRunningDemo(true);
    setDemoState('progress');
    setDemoProgress(0);
    
    const eventId = startCommand('npm test');
    
    // Simulate test progress
    for (let i = 0; i <= 100; i += 5) {
      setDemoProgress(i);
      if (eventId) updateProgress(eventId, i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Tests usually succeed
    setDemoState('success');
    if (eventId) completeSuccess(eventId, 'All tests passed!');
    
    setTimeout(() => {
      setDemoState('idle');
      setDemoProgress(0);
      setIsRunningDemo(false);
    }, 2000);
  }, [isRunningDemo, startCommand, updateProgress, completeSuccess]);

  // Run deploy demo
  const runDeployDemo = useCallback(async () => {
    if (isRunningDemo) return;
    
    setIsRunningDemo(true);
    setDemoState('building');
    
    const eventId = startCommand('vercel deploy');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Deploy usually succeeds but takes longer
    setDemoState('success');
    if (eventId) completeSuccess(eventId, 'Deployed to production!');
    
    setTimeout(() => {
      setDemoState('idle');
      setIsRunningDemo(false);
    }, 3000);
  }, [isRunningDemo, startCommand, completeSuccess]);

  // Quick animation previews
  const previewAnimation = useCallback((state: typeof demoState) => {
    if (isRunningDemo) return;
    
    setDemoState(state);
    setTimeout(() => setDemoState('idle'), 2000);
  }, [isRunningDemo]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Compile Vibes Demo
          </CardTitle>
          <CardDescription>
            Experience organic feedback animations for your development workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live Animation Display */}
          <div className="border rounded-lg p-8 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center min-h-[200px]">
            {demoState !== 'idle' ? (
              <div className="text-center">
                <CompileVibes
                  state={demoState}
                  progress={demoProgress}
                  size="large"
                  duration={2000}
                  onAnimationComplete={() => {
                    if (!isRunningDemo) setDemoState('idle');
                  }}
                />
                <div className="mt-4 text-sm text-gray-600">
                  {demoState === 'building' && 'Building your project...'}
                  {demoState === 'progress' && `Progress: ${Math.round(demoProgress)}%`}
                  {demoState === 'success' && '✨ Success! Your build completed beautifully'}
                  {demoState === 'failure' && '🥀 Build failed, but we\'ll get it next time'}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Flower className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Ready for Organic Feedback</h3>
                <p>Click a button below to see compile vibes in action</p>
              </div>
            )}
          </div>

          {/* Demo Controls */}
          <div className="space-y-4">
            <h4 className="font-medium">Realistic Build Scenarios:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={runBuildDemo}
                disabled={isRunningDemo}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Terminal className="w-4 h-4" />
                {isRunningDemo ? 'Building...' : 'npm run build'}
              </Button>
              
              <Button
                onClick={runTestDemo}
                disabled={isRunningDemo}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Zap className="w-4 h-4" />
                {isRunningDemo ? 'Testing...' : 'npm test'}
              </Button>
              
              <Button
                onClick={runDeployDemo}
                disabled={isRunningDemo}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Sparkles className="w-4 h-4" />
                {isRunningDemo ? 'Deploying...' : 'vercel deploy'}
              </Button>
            </div>

            <h4 className="font-medium">Quick Animation Previews:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                onClick={() => previewAnimation('building')}
                disabled={isRunningDemo}
                size="sm"
                variant="ghost"
                className="flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                Building
              </Button>
              
              <Button
                onClick={() => previewAnimation('progress')}
                disabled={isRunningDemo}
                size="sm"
                variant="ghost"
                className="flex items-center gap-1"
              >
                <Coffee className="w-3 h-3" />
                Progress
              </Button>
              
              <Button
                onClick={() => previewAnimation('success')}
                disabled={isRunningDemo}
                size="sm"
                variant="ghost"
                className="flex items-center gap-1"
              >
                <Flower className="w-3 h-3" />
                Success
              </Button>
              
              <Button
                onClick={() => previewAnimation('failure')}
                disabled={isRunningDemo}
                size="sm"
                variant="ghost"
                className="flex items-center gap-1"
              >
                <Heart className="w-3 h-3" />
                Failure
              </Button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <h5 className="font-medium text-green-600">🌸 Success Animations</h5>
              <p className="text-sm text-gray-600">
                Beautiful blooming flowers celebrate successful builds with vibrant colors and organic growth patterns.
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-red-600">🥀 Failure Animations</h5>
              <p className="text-sm text-gray-600">
                Gentle wilting animations provide empathetic feedback for failed builds without being harsh or stressful.
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-blue-600">🌿 Progress Ripples</h5>
              <p className="text-sm text-gray-600">
                Expanding ripple effects and growing elements show build progress in a calming, natural way.
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-purple-600">🌱 Building Growth</h5>
              <p className="text-sm text-gray-600">
                Watch your code grow like a plant with gentle swaying stems and emerging leaves during compilation.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
            <h5 className="font-medium mb-2">Why Organic Feedback?</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Reduces stress:</strong> Natural animations are more calming than harsh loading spinners</li>
              <li>• <strong>Intuitive feedback:</strong> Blooming = success, wilting = failure - no learning required</li>
              <li>• <strong>Pleasant waiting:</strong> Makes build times feel shorter and more enjoyable</li>
              <li>• <strong>Emotional connection:</strong> Creates a more human relationship with your development tools</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
