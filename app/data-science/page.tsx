'use client';

/**
 * White Rabbit Code Editor - Data Science Page
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 */

import React from 'react';
import { DataScienceHub } from '@/components/data-science/data-science-hub';

export default function DataSciencePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <DataScienceHub />
      </div>
    </div>
  );
}
