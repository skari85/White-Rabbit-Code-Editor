'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Image as ImageIcon } from 'lucide-react';

export type NewAppTemplate = 'landing' | 'portfolio' | 'saas';

export interface NewAppOptions {
  name: string;
  logoUrl?: string;
  template: NewAppTemplate;
  brandColor: string; // hex
  authEnabled: boolean;
}

interface NewAppWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (opts: NewAppOptions) => void;
}

export default function NewAppWizard({ open, onOpenChange, onCreate }: NewAppWizardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('My App');
  const [logoUrl, setLogoUrl] = useState('');
  const [template, setTemplate] = useState<NewAppTemplate>('landing');
  const [brandColor, setBrandColor] = useState('#6c2fff');
  const [authEnabled, setAuthEnabled] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const create = () => {
    onCreate({ name, logoUrl: logoUrl.trim() || undefined, template, brandColor, authEnabled });
    onOpenChange(false);
    // reset minimal
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">New App Setup</DialogTitle>
          <DialogDescription className="text-sm">
            This wizard will help you create a new app. You can customize it later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6 max-h-[60vh] overflow-y-auto">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">App Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  placeholder="My Awesome App"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Logo URL (optional)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          )}
          
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {['landing', 'dashboard', 'blog', 'ecommerce'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTemplate(t as NewAppTemplate)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        template === t
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm capitalize">{t}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t === 'landing' && 'Landing page with hero, features, and contact'}
                        {t === 'dashboard' && 'Admin dashboard with charts and tables'}
                        {t === 'blog' && 'Blog with articles and categories'}
                        {t === 'ecommerce' && 'Online store with products and cart'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Brand Color</label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-12 h-12 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md text-sm font-mono"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auth"
                  checked={authEnabled}
                  onChange={(e) => setAuthEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="auth" className="text-sm">
                  Enable authentication (login/signup)
                </label>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">App Summary</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div><strong>Name:</strong> {name}</div>
                  <div><strong>Template:</strong> {template}</div>
                  <div><strong>Brand Color:</strong> <span className="inline-block w-4 h-4 rounded border" style={{backgroundColor: brandColor}}></span> {brandColor}</div>
                  <div><strong>Authentication:</strong> {authEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Click "Create App" to generate your new application with these settings.
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={back}
            disabled={step === 0}
            size="sm"
            className="text-xs sm:text-sm"
          >
            Back
          </Button>
          
          <div className="flex gap-2">
            {step < 3 ? (
              <Button onClick={next} size="sm" className="text-xs sm:text-sm">
                Next
              </Button>
            ) : (
              <Button onClick={create} size="sm" className="text-xs sm:text-sm">
                Create App
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

