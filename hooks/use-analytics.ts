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
import { useCallback } from 'react'

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, string | number | boolean>
}

export function useAnalytics() {
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    try {
      track(event.name, event.properties)
    } catch (error) {
      console.warn('Analytics tracking failed:', error)
    }
  }, [])

  // Code Editor Events
  const trackCodeExecution = useCallback((language: string, success: boolean) => {
    trackEvent({
      name: 'code_execution',
      properties: {
        language,
        success,
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackFileCreated = useCallback((fileType: string, fileName: string) => {
    trackEvent({
      name: 'file_created',
      properties: {
        file_type: fileType,
        file_name: fileName,
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackFileDeleted = useCallback((fileType: string) => {
    trackEvent({
      name: 'file_deleted',
      properties: {
        file_type: fileType,
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackPreviewOpened = useCallback((previewType: 'live' | 'new_tab') => {
    trackEvent({
      name: 'preview_opened',
      properties: {
        preview_type: previewType,
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackAIInteraction = useCallback((action: 'message_sent' | 'response_received' | 'code_applied') => {
    trackEvent({
      name: 'ai_interaction',
      properties: {
        action,
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackThemeToggle = useCallback((theme: string) => {
    trackEvent({
      name: 'theme_toggle',
      properties: {
        theme,
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackLicenseViewed = useCallback(() => {
    trackEvent({
      name: 'license_viewed',
      properties: {
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackCommercialInquiry = useCallback(() => {
    trackEvent({
      name: 'commercial_inquiry',
      properties: {
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackFeatureUsed = useCallback((feature: string, details?: Record<string, any>) => {
    trackEvent({
      name: 'feature_used',
      properties: {
        feature,
        ...details,
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackError = useCallback((errorType: string, errorMessage: string) => {
    trackEvent({
      name: 'error_occurred',
      properties: {
        error_type: errorType,
        error_message: errorMessage.substring(0, 100), // Limit message length
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackUserSession = useCallback((action: 'session_start' | 'session_end', duration?: number) => {
    trackEvent({
      name: 'user_session',
      properties: {
        action,
        duration: duration || 0,
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

  const trackLiveCoding = useCallback((action: string, properties?: Record<string, any>) => {
    trackEvent({
      name: 'live_coding',
      properties: {
        action,
        ...properties,
        timestamp: Date.now()
      }
    })
  }, [trackEvent])

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
    trackUserSession,
    trackLiveCoding
  }
}
