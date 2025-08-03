'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Search, 
  Download, 
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Heart,
  User
} from 'lucide-react';

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
    profile_image: {
      small: string;
    };
  };
  likes: number;
  width: number;
  height: number;
  color: string;
}

interface UnsplashImagesProps {
  onImageSelect: (imageUrl: string, alt: string) => void;
  className?: string;
}

export default function UnsplashImages({ onImageSelect, className }: UnsplashImagesProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedUrl, setCopiedUrl] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('unsplash_api_key');
    const envKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

    const keyToUse = savedKey || envKey;
    if (keyToUse) {
      setApiKey(keyToUse);
      setIsConfigured(true);
      // Load some default images
      searchImages('nature');
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }

    localStorage.setItem('unsplash_api_key', apiKey);
    setIsConfigured(true);
    setError('');
    // Load featured images
    searchImages('nature');
  };

  const handleRemoveApiKey = () => {
    setApiKey('');
    setIsConfigured(false);
    setImages([]);
    localStorage.removeItem('unsplash_api_key');
  };

  const searchImages = async (query: string = searchQuery) => {
    if (!apiKey || !query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();
      setImages(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search images');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchImages();
  };

  const copyImageUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(''), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageSelect = (image: UnsplashImage) => {
    const alt = image.alt_description || image.description || `Photo by ${image.user.name}`;
    onImageSelect(image.urls.regular, alt);
  };

  if (!isConfigured) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Camera className="w-4 h-4 text-pink-500" />
            Unsplash Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border">
            <p className="font-medium mb-1">Get your Unsplash API Key:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Go to <a href="https://unsplash.com/developers" target="_blank" className="text-blue-600 underline">Unsplash Developers</a></li>
              <li>Create a new application</li>
              <li>Copy your "Access Key"</li>
              <li>Paste it below</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Unsplash Access Key"
              className="text-xs"
            />
            <Button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
              size="sm"
              className="w-full"
            >
              <Check className="w-3 h-3 mr-1" />
              Connect to Unsplash
            </Button>
          </div>

          {error && (
            <div className="text-xs p-2 bg-red-50 text-red-700 border border-red-200 rounded flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Camera className="w-4 h-4 text-pink-500" />
          Unsplash Images
          <Badge variant="outline" className="text-xs">
            <Check className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for images..."
              className="pl-8 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !searchQuery.trim()} size="sm" className="flex-1">
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
            </Button>
            <Button
              type="button"
              onClick={handleRemoveApiKey}
              variant="ghost"
              size="sm"
              className="text-red-600"
            >
              Disconnect
            </Button>
          </div>
        </form>

        {/* Quick Search Tags */}
        <div className="flex flex-wrap gap-1">
          {['nature', 'technology', 'business', 'abstract', 'minimal'].map(tag => (
            <Button
              key={tag}
              onClick={() => {
                setSearchQuery(tag);
                searchImages(tag);
              }}
              variant="outline"
              size="sm"
              className="text-xs h-6"
            >
              {tag}
            </Button>
          ))}
        </div>

        {/* Images Grid */}
        <div className="space-y-2">
          {loading && (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-xs text-gray-500 mt-2">Searching images...</p>
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.urls.small}
                    alt={image.alt_description || 'Unsplash image'}
                    className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleImageSelect(image)}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyImageUrl(image.urls.regular);
                        }}
                        size="sm"
                        variant="secondary"
                        className="p-1 h-6 w-6"
                      >
                        {copiedUrl === image.urls.regular ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image.urls.regular, `unsplash-${image.id}.jpg`);
                        }}
                        size="sm"
                        variant="secondary"
                        className="p-1 h-6 w-6"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Image Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 rounded-b opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-1">
                        <User className="w-2 h-2" />
                        <span className="truncate">{image.user.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-2 h-2" />
                        <span>{image.likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && !loading && searchQuery && (
            <div className="text-center py-4 text-xs text-gray-500">
              No images found for "{searchQuery}"
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs p-2 bg-red-50 text-red-700 border border-red-200 rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}

        {/* Attribution */}
        <div className="text-xs text-gray-500 text-center">
          <p>Photos from <a href="https://unsplash.com" target="_blank" className="underline">Unsplash</a></p>
          <p>Click image to insert into your project</p>
        </div>
      </CardContent>
    </Card>
  );
}
