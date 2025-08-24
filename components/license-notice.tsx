'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, Copyright } from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'

export function LicenseNotice() {
  const { trackLicenseViewed, trackCommercialInquiry } = useAnalytics()

  const handleLicenseOpen = () => {
    trackLicenseViewed()
  }

  const handleCommercialClick = () => {
    trackCommercialInquiry()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={handleLicenseOpen}
        >
          <Copyright className="w-3 h-3 mr-1" />
          © 2025 White Rabbit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            White Rabbit Code Editor - License Information
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Copyright Notice</h3>
              <p>© 2025 White Rabbit Team. All rights reserved.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Personal Use License</h3>
              <p className="text-muted-foreground">
                This software is licensed for personal, educational, and non-commercial use. 
                You may use, modify, and create derivative works for personal purposes only.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                Commercial Use Restricted
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                Commercial use of this software requires a separate commercial license. 
                This includes use within commercial organizations, integration into commercial products, 
                or any use to generate revenue.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Attribution Required</h3>
              <p className="text-muted-foreground">
                All copies and derivative works must retain the copyright notice and include:
                <br />
                <code className="bg-muted px-2 py-1 rounded text-xs mt-1 block">
                  "Powered by White Rabbit Code Editor"
                </code>
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Trademark Notice</h3>
              <p className="text-muted-foreground">
                "White Rabbit" and associated logos are trademarks of White Rabbit Team. 
                Use of these trademarks requires explicit written permission.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Commercial Licensing</h3>
              <p className="text-muted-foreground mb-2">
                For commercial use, enterprise licenses, or custom licensing arrangements, please contact:
              </p>
              <div className="space-y-1 text-sm">
                <p>
                  📧 Email:
                  <a
                    href="mailto:licensing@whiterabbit.dev"
                    onClick={handleCommercialClick}
                    className="ml-1 text-blue-600 hover:text-blue-800 underline"
                  >
                    licensing@whiterabbit.dev
                  </a>
                </p>
                <p>
                  🌐 Website:
                  <a
                    href="https://www.whiterabbit.onl/licensing"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCommercialClick}
                    className="ml-1 text-blue-600 hover:text-blue-800 underline"
                  >
                    https://www.whiterabbit.onl/licensing
                  </a>
                </p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>
                This software is provided "as is" without warranty of any kind. 
                See the full LICENSE file for complete terms and conditions.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export function CopyrightFooter() {
  return (
    <div className="fixed bottom-2 right-2 z-50">
      <LicenseNotice />
    </div>
  )
}
