'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Copy, 
  Check, 
  Search,
  Layout,
  Type,
  MousePointer,
  Grid,
  Box,
  Zap
} from 'lucide-react';

interface TailwindComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  html: string;
  css?: string;
  preview: string;
  tags: string[];
}

interface TailwindComponentsProps {
  onComponentSelect: (html: string, css?: string) => void;
  className?: string;
}

const COMPONENT_CATEGORIES = [
  { id: 'layout', name: 'Layout', icon: Layout },
  { id: 'forms', name: 'Forms', icon: MousePointer },
  { id: 'buttons', name: 'Buttons', icon: Box },
  { id: 'cards', name: 'Cards', icon: Grid },
  { id: 'navigation', name: 'Navigation', icon: Type },
  { id: 'marketing', name: 'Marketing', icon: Zap },
];

const SAMPLE_COMPONENTS: TailwindComponent[] = [
  {
    id: 'hero-section',
    name: 'Hero Section',
    category: 'marketing',
    description: 'Modern hero section with gradient background',
    html: `<div class="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white">
  <div class="container mx-auto px-6 py-24">
    <div class="text-center">
      <h1 class="text-5xl font-bold mb-4">Welcome to the Future</h1>
      <p class="text-xl mb-8 opacity-90">Build amazing web applications with modern tools</p>
      <button class="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition duration-300">
        Get Started
      </button>
    </div>
  </div>
</div>`,
    preview: '🎨 Gradient hero with CTA button',
    tags: ['hero', 'gradient', 'cta', 'marketing']
  },
  {
    id: 'card-grid',
    name: 'Feature Cards',
    category: 'cards',
    description: 'Responsive grid of feature cards',
    html: `<div class="grid md:grid-cols-3 gap-6 p-6">
  <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-300">
    <div class="text-blue-500 text-3xl mb-4">⚡</div>
    <h3 class="text-xl font-semibold mb-2">Fast Performance</h3>
    <p class="text-gray-600">Lightning-fast loading times and optimized performance.</p>
  </div>
  <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-300">
    <div class="text-green-500 text-3xl mb-4">🔒</div>
    <h3 class="text-xl font-semibold mb-2">Secure</h3>
    <p class="text-gray-600">Enterprise-grade security with modern encryption.</p>
  </div>
  <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-300">
    <div class="text-purple-500 text-3xl mb-4">🎨</div>
    <h3 class="text-xl font-semibold mb-2">Beautiful Design</h3>
    <p class="text-gray-600">Stunning UI components with modern aesthetics.</p>
  </div>
</div>`,
    preview: '📱 3-column feature cards with icons',
    tags: ['cards', 'grid', 'features', 'responsive']
  },
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'forms',
    description: 'Modern contact form with validation styles',
    html: `<div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
  <h2 class="text-2xl font-bold mb-6 text-center">Contact Us</h2>
  <form class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
      <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your name">
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
      <input type="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com">
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
      <textarea rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your message"></textarea>
    </div>
    <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300">
      Send Message
    </button>
  </form>
</div>`,
    preview: '📝 Contact form with focus states',
    tags: ['form', 'contact', 'input', 'validation']
  },
  {
    id: 'navbar',
    name: 'Navigation Bar',
    category: 'navigation',
    description: 'Responsive navigation with mobile menu',
    html: `<nav class="bg-white shadow-lg">
  <div class="container mx-auto px-6">
    <div class="flex justify-between items-center py-4">
      <div class="text-xl font-bold text-gray-800">Brand</div>
      <div class="hidden md:flex space-x-6">
        <a href="#" class="text-gray-600 hover:text-blue-600 transition duration-300">Home</a>
        <a href="#" class="text-gray-600 hover:text-blue-600 transition duration-300">About</a>
        <a href="#" class="text-gray-600 hover:text-blue-600 transition duration-300">Services</a>
        <a href="#" class="text-gray-600 hover:text-blue-600 transition duration-300">Contact</a>
      </div>
      <button class="md:hidden text-gray-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </div>
  </div>
</nav>`,
    preview: '🧭 Responsive navbar with brand',
    tags: ['navigation', 'navbar', 'responsive', 'menu']
  },
  {
    id: 'button-group',
    name: 'Button Variants',
    category: 'buttons',
    description: 'Collection of styled button variants',
    html: `<div class="flex flex-wrap gap-4 p-6">
  <button class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300">
    Primary
  </button>
  <button class="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition duration-300">
    Secondary
  </button>
  <button class="border border-blue-600 text-blue-600 px-6 py-2 rounded-md hover:bg-blue-50 transition duration-300">
    Outline
  </button>
  <button class="text-blue-600 px-6 py-2 rounded-md hover:bg-blue-50 transition duration-300">
    Ghost
  </button>
  <button class="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition duration-300">
    Danger
  </button>
  <button class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition duration-300">
    Success
  </button>
</div>`,
    preview: '🔘 Various button styles and states',
    tags: ['buttons', 'variants', 'interactive', 'states']
  },
  {
    id: 'pricing-cards',
    name: 'Pricing Cards',
    category: 'marketing',
    description: 'Pricing table with featured plan',
    html: `<div class="grid md:grid-cols-3 gap-6 p-6">
  <div class="bg-white rounded-lg shadow-lg p-6 text-center">
    <h3 class="text-xl font-semibold mb-4">Basic</h3>
    <div class="text-3xl font-bold mb-4">$9<span class="text-sm text-gray-500">/mo</span></div>
    <ul class="space-y-2 mb-6 text-sm text-gray-600">
      <li>✓ 5 Projects</li>
      <li>✓ 10GB Storage</li>
      <li>✓ Email Support</li>
    </ul>
    <button class="w-full border border-blue-600 text-blue-600 py-2 rounded-md hover:bg-blue-50">
      Choose Plan
    </button>
  </div>
  <div class="bg-blue-600 text-white rounded-lg shadow-lg p-6 text-center transform scale-105">
    <h3 class="text-xl font-semibold mb-4">Pro</h3>
    <div class="text-3xl font-bold mb-4">$29<span class="text-sm opacity-75">/mo</span></div>
    <ul class="space-y-2 mb-6 text-sm">
      <li>✓ Unlimited Projects</li>
      <li>✓ 100GB Storage</li>
      <li>✓ Priority Support</li>
    </ul>
    <button class="w-full bg-white text-blue-600 py-2 rounded-md hover:bg-gray-100">
      Choose Plan
    </button>
  </div>
  <div class="bg-white rounded-lg shadow-lg p-6 text-center">
    <h3 class="text-xl font-semibold mb-4">Enterprise</h3>
    <div class="text-3xl font-bold mb-4">$99<span class="text-sm text-gray-500">/mo</span></div>
    <ul class="space-y-2 mb-6 text-sm text-gray-600">
      <li>✓ Everything in Pro</li>
      <li>✓ Custom Integrations</li>
      <li>✓ 24/7 Support</li>
    </ul>
    <button class="w-full border border-blue-600 text-blue-600 py-2 rounded-md hover:bg-blue-50">
      Choose Plan
    </button>
  </div>
</div>`,
    preview: '💰 Pricing table with featured plan',
    tags: ['pricing', 'cards', 'marketing', 'featured']
  }
];

export default function TailwindComponents({ onComponentSelect, className }: TailwindComponentsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const filteredComponents = SAMPLE_COMPONENTS.filter(component => {
    const matchesSearch = !searchQuery || 
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || component.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = async (text: string, componentId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(componentId);
      setTimeout(() => setCopiedId(''), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleComponentSelect = (component: TailwindComponent) => {
    onComponentSelect(component.html, component.css);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-500" />
          Tailwind Components
          <Badge variant="outline" className="text-xs">
            UI Library
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="pl-8 text-xs"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1">
          <Button
            onClick={() => setSelectedCategory('')}
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-6"
          >
            All
          </Button>
          {COMPONENT_CATEGORIES.map(category => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-6"
              >
                <Icon className="w-3 h-3 mr-1" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Components */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {filteredComponents.map((component) => (
            <div key={component.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium">{component.name}</h4>
                  <p className="text-xs text-gray-600">{component.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={() => copyToClipboard(component.html, component.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6"
                    title="Copy HTML"
                  >
                    {copiedId === component.id ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-2">{component.preview}</div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {component.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {component.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{component.tags.length - 3}
                    </Badge>
                  )}
                </div>
                
                <Button
                  onClick={() => handleComponentSelect(component)}
                  size="sm"
                  className="text-xs h-6"
                >
                  Insert
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Box className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No components found</p>
            <p className="text-xs">Try adjusting your search or category filter</p>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 bg-cyan-50 p-3 rounded border">
          <p className="font-medium mb-1">💡 How to use:</p>
          <ul className="space-y-1">
            <li>• Click "Insert" to add component to your HTML</li>
            <li>• Copy button copies HTML to clipboard</li>
            <li>• Components use Tailwind CSS classes</li>
            <li>• Add Tailwind CDN to your HTML for styling</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
