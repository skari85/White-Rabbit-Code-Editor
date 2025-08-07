'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import SplitControls from './split-controls'

export default function SplitTest() {
  const handleSplitHorizontal = () => {
    console.log('Split Horizontal clicked')
  }

  const handleSplitVertical = () => {
    console.log('Split Vertical clicked')
  }

  const handleResetLayout = () => {
    console.log('Reset Layout clicked')
  }

  const handleSaveLayout = () => {
    console.log('Save Layout clicked')
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Split Controls Test</h2>
      
      <div className="space-y-2">
        <h3 className="text-lg">Toolbar Version:</h3>
        <SplitControls
          onSplitHorizontal={handleSplitHorizontal}
          onSplitVertical={handleSplitVertical}
          onResetLayout={handleResetLayout}
          onSaveLayout={handleSaveLayout}
          showInToolbar={true}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg">Full Version:</h3>
        <SplitControls
          onSplitHorizontal={handleSplitHorizontal}
          onSplitVertical={handleSplitVertical}
          onResetLayout={handleResetLayout}
          onSaveLayout={handleSaveLayout}
          showInToolbar={false}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg">Keyboard Shortcuts:</h3>
        <ul className="text-sm text-gray-600">
          <li>Cmd/Ctrl + \ : Split Vertical</li>
          <li>Cmd/Ctrl + Shift + - : Split Horizontal</li>
          <li>Cmd/Ctrl + Shift + 0 : Reset Layout</li>
        </ul>
      </div>
    </div>
  )
}
