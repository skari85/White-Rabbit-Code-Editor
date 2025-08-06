/**
 * White Rabbit Code Editor - Analytics Hook
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import { track } from '@vercel/analytics'

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, string | number | boolean>
}

export function useAnalytics() {
  const trackEvent = (event: AnalyticsEvent) => {
    try {
      track(event.name, event.properties)
    } catch (error) {
      console.warn('Analytics tracking failed:', error)
    }
  }

  // Code Editor Events
  const trackCodeExecution = (language: string, success: boolean) => {
    trackEvent({
      name: 'code_execution',
      properties: {
        language,
        success,
        timestamp: Date.now()
      }
    })
  }

  const trackFileCreated = (fileType: string, fileName: string) => {
    trackEvent({
      name: 'file_created',
      properties: {
        file_type: fileType,
        file_name: fileName,
        timestamp: Date.now()
      }
    })
  }

  const trackFileDeleted = (fileType: string) => {
    trackEvent({
      name: 'file_deleted',
      properties: {
        file_type: fileType,
        timestamp: Date.now()
      }
    })
  }

  const trackPreviewOpened = (previewType: 'live' | 'new_tab') => {
    trackEvent({
      name: 'preview_opened',
      properties: {
        preview_type: previewType,
        timestamp: Date.now()
      }
    })
  }

  const trackAIInteraction = (action: 'message_sent' | 'response_received' | 'code_applied') => {
    trackEvent({
      name: 'ai_interaction',
      properties: {
        action,
        timestamp: Date.now()
      }
    })
  }

  const trackThemeToggle = (theme: string) => {
    trackEvent({
      name: 'theme_toggle',
      properties: {
        theme,
        timestamp: Date.now()
      }
    })
  }

  const trackLicenseViewed = () => {
    trackEvent({
      name: 'license_viewed',
      properties: {
        timestamp: Date.now()
      }
    })
  }

  const trackCommercialInquiry = () => {
    trackEvent({
      name: 'commercial_inquiry',
      properties: {
        timestamp: Date.now()
      }
    })
  }

  const trackFeatureUsed = (feature: string, details?: Record<string, any>) => {
    trackEvent({
      name: 'feature_used',
      properties: {
        feature,
        ...details,
        timestamp: Date.now()
      }
    })
  }

  const trackError = (errorType: string, errorMessage: string) => {
    trackEvent({
      name: 'error_occurred',
      properties: {
        error_type: errorType,
        error_message: errorMessage.substring(0, 100), // Limit message length
        timestamp: Date.now()
      }
    })
  }

  const trackUserSession = (action: 'session_start' | 'session_end', duration?: number) => {
    trackEvent({
      name: 'user_session',
      properties: {
        action,
        duration: duration || 0,
        timestamp: Date.now()
      }
    })
  }

  return {
    trackEvent,
    trackCodeExecution,
    trackFileCreated,
    trackFileDeleted,
    trackPreviewOpened,
    trackAIInteraction,
    trackThemeToggle,
    trackLicenseViewed,
    trackCommercialInquiry,
    trackFeatureUsed,
    trackError,
    trackUserSession
  }
}
