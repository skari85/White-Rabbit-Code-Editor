import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  User, 
  UserPlus, 
  UserMinus, 
  Wifi, 
  WifiOff,
  Settings,
  Copy,
  Check
} from 'lucide-react';
import { CollaborationService, CollaborationUser } from '@/lib/collaboration-service';

interface CollaborationPanelProps {
  collaborationService: CollaborationService;
  className?: string;
}

export function CollaborationPanel({ collaborationService, className = '' }: CollaborationPanelProps) {
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setUsers(collaborationService.getUsers());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setUsers([]);
    };

    const handleUserJoined = (user: CollaborationUser) => {
      setUsers(prev => [...prev, user]);
    };

    const handleUserLeft = (userId: string) => {
      setUsers(prev => prev.filter(user => user.id !== userId));
    };

    const handleSync = (data: any) => {
      setUsers(Object.values(data.users));
    };

    // Set up event listeners
    collaborationService.on('connected', handleConnected);
    collaborationService.on('disconnected', handleDisconnected);
    collaborationService.on('userJoined', handleUserJoined);
    collaborationService.on('userLeft', handleUserLeft);
    collaborationService.on('sync', handleSync);

    // Generate invite link
    const link = `${window.location.origin}${window.location.pathname}?collab=true`;
    setInviteLink(link);

    return () => {
      collaborationService.off('connected', handleConnected);
      collaborationService.off('disconnected', handleDisconnected);
      collaborationService.off('userJoined', handleUserJoined);
      collaborationService.off('userLeft', handleUserLeft);
      collaborationService.off('sync', handleSync);
    };
  }, [collaborationService]);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite link:', err);
    }
  };

  const currentUser = collaborationService.getCurrentUser();

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4" />
          Collaboration
          <Badge 
            variant={isConnected ? "default" : "secondary"} 
            className="ml-auto"
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current User */}
        {currentUser && (
          <div className="flex items-center gap-2 p-2 bg-blue-600/20 rounded border border-blue-600/30">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentUser.color }}
            />
            <span className="text-sm font-medium">{currentUser.name}</span>
            <Badge variant="outline" className="text-xs ml-auto">
              You
            </Badge>
          </div>
        )}

        {/* Active Users */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Active Users ({users.length})
          </h4>
          
          {users.length === 0 ? (
            <p className="text-xs text-gray-500">No other users connected</p>
          ) : (
            users.map(user => (
              <div key={user.id} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: user.color }}
                />
                <span className="text-sm">{user.name}</span>
                {user.cursor && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    L{user.cursor.line}:C{user.cursor.column}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>

        {/* Invite Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Invite Others
          </h4>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyInviteLink}
              className="h-6 px-2 text-xs"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Connection Status
          </h4>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={isConnected ? "text-green-400" : "text-red-400"}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Users:</span>
              <span>{users.length + (currentUser ? 1 : 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Server:</span>
              <span>ws://localhost:3001</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="flex-1 text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            Settings
          </Button>
          
          {isConnected ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => collaborationService.disconnect()}
              className="text-xs"
            >
              <UserMinus className="w-3 h-3 mr-1" />
              Leave
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                // Auto-connect with random user
                const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
                const userName = `User ${Math.floor(Math.random() * 1000)}`;
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                const userColor = colors[Math.floor(Math.random() * colors.length)];
                
                collaborationService.connect(userId, userName, userColor);
              }}
              className="text-xs"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Join
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 