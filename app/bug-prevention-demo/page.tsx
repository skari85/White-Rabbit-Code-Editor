'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Target, 
  Zap, 
  Code, 
  AlertTriangle, 
  CheckCircle,
  Lightbulb,
  Play,
  Eye,
  Settings,
  Info
} from 'lucide-react';
import NullSafetyRefactorer from '@/components/null-safety-refactorer';
import FocusField from '@/components/focus-field';

export default function BugPreventionDemo() {
  const [activeTab, setActiveTab] = useState('null-safety');
  const [demoCode, setDemoCode] = useState(`// Example code with potential null-safety issues
function processUserData(response) {
  // This could cause runtime errors
  const userName = response.data.user.name;
  const userEmail = response.data.user.email;
  const userAge = response.data.user.profile.age;
  
  // Method calls that could fail
  const formattedName = userName.toUpperCase();
  const emailDomain = userEmail.split('@')[1];
  
  // Array access that could fail
  const firstFriend = response.data.user.friends[0];
  const friendName = firstFriend.name;
  
  return {
    name: formattedName,
    email: userEmail,
    age: userAge,
    friend: friendName
  };
}

// More examples
class UserManager {
  constructor(users) {
    this.users = users;
  }
  
  getUserById(id) {
    const user = this.users.find(u => u.id === id);
    return user.profile.name; // Could fail if user is undefined
  }
  
  updateUser(id, data) {
    const user = this.users.find(u => u.id === id);
    user.profile.email = data.email; // Could fail
    user.profile.settings.theme = data.theme; // Could fail
  }
}

// API response handling
async function fetchUserData() {
  try {
    const response = await fetch('/api/users');
    const data = await response.json();
    
    // These could all fail
    const users = data.results.users;
    const firstUser = users[0];
    const userName = firstUser.profile.name;
    
    return userName;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
  }
}`);

  const [focusFieldCode, setFocusFieldCode] = useState(`// Example code for Focus Field demonstration
import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  profile: UserProfile;
}

interface UserProfile {
  age: number;
  bio: string;
  preferences: UserPreferences;
}

interface UserPreferences {
  theme: string;
  language: string;
  notifications: boolean;
}

class UserService {
  private users: User[] = [];
  
  constructor() {
    this.users = [];
  }
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }
  
  updateUser(id: string, updates: Partial<User>): boolean {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return true;
  }
  
  deleteUser(id: string): boolean {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    this.users.splice(userIndex, 1);
    return true;
  }
  
  getAllUsers(): User[] {
    return [...this.users];
  }
}

function UserComponent() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userService] = useState(() => new UserService());
  
  useEffect(() => {
    // Load initial users
    const initialUsers = userService.getAllUsers();
    setUsers(initialUsers);
  }, [userService]);
  
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };
  
  const handleUserUpdate = (id: string, updates: Partial<User>) => {
    const success = userService.updateUser(id, updates);
    if (success) {
      setUsers(userService.getAllUsers());
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser({ ...selectedUser, ...updates });
      }
    }
  };
  
  return (
    <div className="user-component">
      <h2>User Management</h2>
      <div className="user-list">
        {users.map(user => (
          <div key={user.id} onClick={() => handleUserSelect(user)}>
            {user.name} - {user.email}
          </div>
        ))}
      </div>
      {selectedUser && (
        <div className="user-details">
          <h3>{selectedUser.name}</h3>
          <p>Email: {selectedUser.email}</p>
          <p>Age: {selectedUser.profile.age}</p>
          <p>Bio: {selectedUser.profile.bio}</p>
          <p>Theme: {selectedUser.profile.preferences.theme}</p>
        </div>
      )}
    </div>
  );
}

export { UserService, UserComponent };
export type { User, UserProfile, UserPreferences };`);

  const handleCodeChange = useCallback((newCode: string) => {
    setDemoCode(newCode);
  }, []);

  const handleFocusFieldCodeChange = useCallback((newCode: string) => {
    setFocusFieldCode(newCode);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Bug Prevention & Focus Field Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience the future of code safety with our intelligent null-safety refactorer and 
          cognitive load-reducing focus field system.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="null-safety" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Null-Safety Guardian
          </TabsTrigger>
          <TabsTrigger value="focus-field" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Focus Field
          </TabsTrigger>
        </TabsList>

        <TabsContent value="null-safety" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-500" />
                  Code with Potential Issues
                </CardTitle>
                <p className="text-sm text-gray-600">
                  This code contains several potential null-safety issues that our system can detect and fix.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
                    <pre>{demoCode}</pre>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span>Hover over the code to see potential issues highlighted</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Null-Safety Refactorer */}
            <div>
              <NullSafetyRefactorer
                code={demoCode}
                file="demo.js"
                onCodeChange={handleCodeChange}
              />
            </div>
          </div>

          {/* Features Overview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Null-Safety Guardian Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium">Smart Detection</h4>
                  <p className="text-sm text-gray-600">
                    Automatically detects property chains, method calls, and array access that could cause runtime errors.
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <h4 className="font-medium">One-Click Fixes</h4>
                  <p className="text-sm text-gray-600">
                    Instantly apply optional chaining (?.) to prevent "Cannot read properties of undefined" errors.
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <h4 className="font-medium">Preview Changes</h4>
                  <p className="text-sm text-gray-600">
                    See exactly what will change before applying fixes, with before/after comparisons.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="focus-field" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-green-500" />
                  Code for Focus Field Demo
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Click on any variable, function, or class to create a focus field and reduce cognitive load.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
                    <pre>{focusFieldCode}</pre>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span>Click on code elements to create focus fields</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Focus Field Component */}
            <div>
              <FocusField
                code={focusFieldCode}
                file="demo.tsx"
                onFocusChange={handleFocusFieldCodeChange}
              />
            </div>
          </div>

          {/* Features Overview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Focus Field Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium">Intelligent Focus</h4>
                  <p className="text-sm text-gray-600">
                    Automatically identifies all related code elements when you click on a variable, function, or class.
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <h4 className="font-medium">Visual Clarity</h4>
                  <p className="text-sm text-gray-600">
                    Related lines stay bright while unrelated code fades into the background, reducing cognitive load.
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Settings className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <h4 className="font-medium">Customizable Intensity</h4>
                  <p className="text-sm text-gray-600">
                    Adjust focus intensity from subtle to strong dimming based on your preference.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-blue-600">Null-Safety Guardian</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Analyzes your code in real-time using advanced regex patterns</li>
                <li>Detects property chains, method calls, and array access without null checks</li>
                <li>Highlights potential runtime errors with severity levels</li>
                <li>Provides one-click fixes using optional chaining (?.)</li>
                <li>Shows before/after previews for all changes</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-green-600">Focus Field System</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Click on any code element to create a focus field</li>
                <li>Automatically identifies all related definitions, usages, and modifications</li>
                <li>Creates a visual focus area with related lines highlighted</li>
                <li>Dims unrelated code to reduce cognitive load</li>
                <li>Provides navigation and filtering for complex relationships</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Why These Features Matter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-blue-600">Bug Prevention Benefits</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Prevents the most common JavaScript runtime error</li>
                <li>• Catches issues before they reach production</li>
                <li>• Reduces debugging time and user-reported bugs</li>
                <li>• Improves code quality and maintainability</li>
                <li>• Works with existing codebases</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-green-600">Focus Field Benefits</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Reduces cognitive load in large files</li>
                <li>• Helps developers focus on specific tasks</li>
                <li>• Improves code understanding and navigation</li>
                <li>• Makes complex codebases more manageable</li>
                <li>• Enhances developer productivity and flow</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
