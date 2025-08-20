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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New App Setup</DialogTitle>
          <DialogDescription>
            This wizard will help you create a new app. You can customize it later.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={`step-${step}`} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="step-0">Name & Logo</TabsTrigger>
            <TabsTrigger value="step-1">Template</TabsTrigger>
            <TabsTrigger value="step-2">Theme</TabsTrigger>
            <TabsTrigger value="step-3">Auth</TabsTrigger>
            <TabsTrigger value="step-4">Deploy</TabsTrigger>
          </TabsList>

          {/* Step 0: Name & Logo */}
          <TabsContent value="step-0" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">App Name</Label>
              <Input id="app-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Indie App" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL (optional)</Label>
              <div className="flex gap-2">
                <Input id="logo-url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://...logo.png" />
                <div className="w-10 h-10 border rounded flex items-center justify-center bg-white">
                  {logoUrl ? <img src={logoUrl} alt="logo" className="object-contain w-8 h-8" /> : <ImageIcon className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Step 1: Template */}
          <TabsContent value="step-1" className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: 'landing', name: 'Landing Page', desc: 'Hero, Features, Pricing, FAQ, Contact' },
                { id: 'portfolio', name: 'Portfolio', desc: 'Projects grid, About, Contact' },
                { id: 'saas', name: 'SaaS Shell', desc: 'Dashboard shell, Auth-ready' },
              ] as Array<{id: NewAppTemplate; name: string; desc: string}>).map(t => (
                <Card key={t.id} className={`cursor-pointer ${template === t.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setTemplate(t.id)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                      {template === t.id && <Badge className="text-[10px]" variant="secondary"><Check className="w-3 h-3 mr-1" />Selected</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Step 2: Theme */}
          <TabsContent value="step-2" className="space-y-4">
            <div className="space-y-2">
              <Label>Brand Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-9 w-12 rounded" />
                <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">You can tweak fonts and radius later in Style panel.</div>
          </TabsContent>

          {/* Step 3: Auth */}
          <TabsContent value="step-3" className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={authEnabled} onChange={(e) => setAuthEnabled(e.target.checked)} />
              Enable simple login button (static stub)
            </label>
            <div className="text-xs text-muted-foreground">Adds a Login button in the nav and a simple modal placeholder. You can wire real auth later.</div>
          </TabsContent>

          {/* Step 4: Deploy */}
          <TabsContent value="step-4" className="space-y-2">
            <div className="text-sm text-muted-foreground">Finish to scaffold your app. Use the Publish button to deploy. You can connect a custom domain later.</div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={back} disabled={step === 0}>Back</Button>
          {step < 4 ? (
            <Button onClick={next}>Next</Button>
          ) : (
            <Button onClick={create}>Create App</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

