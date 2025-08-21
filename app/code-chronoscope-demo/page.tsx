'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  GitCommit, 
  History, 
  Lightbulb, 
  Info, 
  CheckCircle,
  Thermometer,
  Ghost,
  Zap,
  Eye,
  Timer,
  Flame,
  Snowflake
} from 'lucide-react';
import CodeChronoscope from '@/components/code-chronoscope';

const DEMO_FILES = {
  'components/UserManager.tsx': `import React, { useState, useEffect } from 'react';

interface UserManagerProps {
  users: User[];
  onUserUpdate: (user: User) => void;
}

export default function UserManager({ users, onUserUpdate }: UserManagerProps) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (users.length > 0) {
      setSelectedUser(users[0]);
    }
  }, [users]);

  const handleUserSelect = async (user) => {
    setIsLoading(true);
    try {
      setSelectedUser(user);
      onUserUpdate(user);
    } catch (err) {
      console.error('Failed to select user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-manager">
      <div className="user-list">
        {users.map(user => (
          <div 
            key={user.id}
            className={'user-item ' + (selectedUser?.id === user.id ? 'selected' : '')}
            onClick={() => handleUserSelect(user)}
          >
            <div className="user-info">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,

  'utils/api.ts': `const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = API_BASE + endpoint;
    
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id) {
    return this.request('/users/' + id);
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return this.request('/users/' + id, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
}

export const apiService = new ApiService();`,

  'hooks/useUserData.ts': `import { useState, useEffect } from 'react';

export function useUserData(options = {}) {
  const { autoFetch = true } = options;
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await fetch('/api/users').then(r => r.json());
      setUsers(userData);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchUsers();
    }
  }, [autoFetch]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    refresh: fetchUsers
  };
}`
};

export default function CodeChronoscopeDemo() {
  const [selectedFile, setSelectedFile] = useState('components/UserManager.tsx');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Code Chronoscope Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Travel through time with your code! See how files evolved with heat maps, ghost lines, and intelligent timeline navigation.
        </p>
      </div>

      <Tabs defaultValue="chronoscope" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chronoscope" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Interactive Chronoscope
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Features & Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chronoscope" className="mt-6">
          <div className="space-y-6">
            {/* File Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-blue-500" />
                  Select a File to Explore
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.keys(DEMO_FILES).map((filePath) => (
                    <Card
                      key={filePath}
                      className={`cursor-pointer transition-colors hover:border-blue-300 ${
                        selectedFile === filePath ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedFile(filePath)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <GitCommit className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{filePath}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {filePath.includes('components') ? 'React Component' : 
                           filePath.includes('utils') ? 'Utility Module' : 
                           'Custom Hook'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chronoscope Component */}
            <CodeChronoscope
              filePath={selectedFile}
              initialContent={DEMO_FILES[selectedFile as keyof typeof DEMO_FILES]}
            />
          </div>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <div className="space-y-6">
            {/* Feature Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Code Chronoscope Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <Thermometer className="w-8 h-8 mx-auto mb-3 text-red-500" />
                    <h4 className="font-medium mb-2">Heat Map Visualization</h4>
                    <p className="text-sm text-gray-600">
                      See which lines of code have been changed recently with a color-coded heat map. Hot lines glow red, cold lines fade to blue.
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Ghost className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                    <h4 className="font-medium mb-2">Ghost Line Effects</h4>
                    <p className="text-sm text-gray-600">
                      Deleted code appears as faded "ghost" lines, while added code has an ink-bleed effect for intuitive diff visualization.
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Timer className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                    <h4 className="font-medium mb-2">Timeline Navigation</h4>
                    <p className="text-sm text-gray-600">
                      Scrub through Git history with an interactive timeline. Play, pause, and step through commits to see code evolution.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  How to Use the Chronoscope
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 text-blue-600">Timeline Controls</h4>
                      <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                        <li>Use the slider to scrub through commit history</li>
                        <li>Click play/pause to auto-advance through commits</li>
                        <li>Step forward/backward one commit at a time</li>
                        <li>Jump to the first or latest commit instantly</li>
                        <li>Adjust playback speed for different viewing experiences</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 text-purple-600">Visual Effects</h4>
                      <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                        <li>Toggle heat map to see line modification recency</li>
                        <li>Enable ghost lines to see added/removed code</li>
                        <li>Adjust heat intensity for better visibility</li>
                        <li>Watch ink-bleed effects for newly added lines</li>
                        <li>See strike-through effects for removed code</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Pro Tips
                    </h5>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p>• Use the search function to quickly find commits by author or message</p>
                      <p>• Check the heat analysis tab to see which lines change most frequently</p>
                      <p>• Watch for patterns in the statistics to understand code stability</p>
                      <p>• Use slower playback speeds to carefully analyze complex changes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Why Use Code Chronoscope?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-green-600">Debugging Superpowers</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Instantly pinpoint when bugs were introduced</li>
                      <li>• See the evolution of problematic code sections</li>
                      <li>• Track down regression sources with timeline scrubbing</li>
                      <li>• Understand the context of historical changes</li>
                      <li>• Identify unstable code patterns through heat maps</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-600">Code Understanding</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Visualize how features were built over time</li>
                      <li>• Learn from past development decisions</li>
                      <li>• See which team members worked on specific areas</li>
                      <li>• Understand code stability and maintenance needs</li>
                      <li>• Get intuitive visual feedback on code changes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Visual Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Hot (recent changes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Cold (stable code)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-green-500"></div>
                    <span className="text-sm">Added lines</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-red-500"></div>
                    <span className="text-sm">Removed lines</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}