/**
 * White Rabbit Code Editor - Analytics Dashboard
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Users, 
  FileCode, 
  Eye, 
  MessageSquare, 
  Palette,
  Shield,
  TrendingUp,
  Activity,
  Globe
} from 'lucide-react'

export function AnalyticsDashboard() {
  const analyticsFeatures = [
    {
      icon: <Users className="w-5 h-5" />,
      title: "User Sessions",
      description: "Track user engagement and session duration",
      metrics: ["Session starts/ends", "Average session time", "User retention"]
    },
    {
      icon: <FileCode className="w-5 h-5" />,
      title: "Code Editor Usage",
      description: "Monitor file creation, editing, and code execution",
      metrics: ["Files created/deleted", "Code execution", "Language usage"]
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Preview Interactions",
      description: "Track live preview and new tab openings",
      metrics: ["Live preview opens", "New tab previews", "Preview duration"]
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "AI Interactions",
      description: "Monitor AI assistant usage and effectiveness",
      metrics: ["Messages sent", "Responses received", "Code applications"]
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: "Theme Preferences",
      description: "Track dark/light mode usage patterns",
      metrics: ["Theme toggles", "Preferred themes", "Usage patterns"]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "License Interactions",
      description: "Monitor license views and commercial inquiries",
      metrics: ["License views", "Commercial inquiries", "Attribution compliance"]
    }
  ]

  const handleViewAnalytics = () => {
    window.open('https://vercel.com/analytics', '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor White Rabbit Code Editor usage and performance
          </p>
        </div>
        <Button onClick={handleViewAnalytics} className="gap-2">
          <Globe className="w-4 h-4" />
          View Vercel Analytics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsFeatures.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {feature.description}
              </p>
              <div className="space-y-2">
                {feature.metrics.map((metric, metricIndex) => (
                  <Badge key={metricIndex} variant="secondary" className="text-xs">
                    {metric}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Analytics Implementation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-600">✅ Implemented</h4>
              <ul className="space-y-2 text-sm">
                <li>• Vercel Analytics integration</li>
                <li>• Speed Insights monitoring</li>
                <li>• Custom event tracking</li>
                <li>• User session tracking</li>
                <li>• Theme toggle tracking</li>
                <li>• License interaction tracking</li>
                <li>• File creation/deletion tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-blue-600">🔄 Available Events</h4>
              <ul className="space-y-2 text-sm">
                <li>• <code>user_session</code> - Session start/end</li>
                <li>• <code>theme_toggle</code> - Theme changes</li>
                <li>• <code>license_viewed</code> - License dialog opens</li>
                <li>• <code>commercial_inquiry</code> - Commercial contact</li>
                <li>• <code>file_created</code> - New file creation</li>
                <li>• <code>file_deleted</code> - File deletion</li>
                <li>• <code>feature_used</code> - Feature usage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Analytics Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold">Performance Insights</h4>
              <p className="text-sm text-muted-foreground">
                Monitor app performance and user experience
              </p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold">User Behavior</h4>
              <p className="text-sm text-muted-foreground">
                Understand how users interact with your editor
              </p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold">License Compliance</h4>
              <p className="text-sm text-muted-foreground">
                Track license views and commercial interest
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
