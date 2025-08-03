'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Share2, 
  MessageCircle, 
  UserPlus, 
  Settings, 
  Eye, 
  Edit3, 
  Crown,
  Circle,
  MessageSquare,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  collaborationService, 
  CollaborationUser, 
  Comment, 
  CollaborationEvent 
} from '@/lib/collaboration-service';

interface CollaborationPanelProps {
  currentFile?: string;
  onUserClick?: (user: CollaborationUser) => void;
  onCommentClick?: (comment: Comment) => void;
  className?: string;
}

export default function CollaborationPanel({
  currentFile,
  onUserClick,
  onCommentClick,
  className = ''
}: CollaborationPanelProps) {
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

  useEffect(() => {
    // Initialize collaboration if not already done
    const initCollaboration = async () => {
      if (!collaborationService.getCurrentUser()) {
        const user = {
          id: `user_${Date.now()}`,
          name: 'Anonymous User',
          email: 'user@example.com',
          color: collaborationService.constructor.generateUserColor()
        };
        
        await collaborationService.initialize(user);
      }
      
      setCurrentUser(collaborationService.getCurrentUser());
      setIsConnected(collaborationService.isConnectedToCollaboration());
      updateActiveUsers();
      updateComments();
    };

    initCollaboration();

    // Set up event listeners
    const unsubscribeJoin = collaborationService.addEventListener('join', handleUserJoin);
    const unsubscribeLeave = collaborationService.addEventListener('leave', handleUserLeave);
    const unsubscribeCursor = collaborationService.addEventListener('cursor', handleCursorUpdate);
    const unsubscribeComment = collaborationService.addEventListener('comment', handleCommentUpdate);

    return () => {
      unsubscribeJoin();
      unsubscribeLeave();
      unsubscribeCursor();
      unsubscribeComment();
    };
  }, []);

  const handleUserJoin = (event: CollaborationEvent) => {
    updateActiveUsers();
  };

  const handleUserLeave = (event: CollaborationEvent) => {
    updateActiveUsers();
  };

  const handleCursorUpdate = (event: CollaborationEvent) => {
    updateActiveUsers();
  };

  const handleCommentUpdate = (event: CollaborationEvent) => {
    updateComments();
  };

  const updateActiveUsers = () => {
    setActiveUsers(collaborationService.getActiveUsers());
  };

  const updateComments = () => {
    const allComments = currentFile 
      ? collaborationService.getCommentsForFile(currentFile)
      : collaborationService.getAllComments();
    setComments(allComments);
  };

  const addComment = () => {
    if (!newComment.trim() || !currentFile || selectedLine === null) return;

    collaborationService.addComment(currentFile, selectedLine, newComment);
    setNewComment('');
    setSelectedLine(null);
    updateComments();
  };

  const resolveComment = (commentId: string) => {
    collaborationService.resolveComment(commentId);
    updateComments();
  };

  const shareProject = async () => {
    if (!shareEmail.trim()) return;

    try {
      const permissions = {
        [shareEmail]: 'editor' as const
      };
      
      const projectId = await collaborationService.shareProject(
        { name: 'Current Project', files: {} },
        permissions
      );
      
      console.log('Project shared with ID:', projectId);
      setShareEmail('');
      setShowShareDialog(false);
    } catch (error) {
      console.error('Failed to share project:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'owner': return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'editor': return <Edit3 className="w-3 h-3 text-blue-500" />;
      case 'viewer': return <Eye className="w-3 h-3 text-gray-500" />;
      default: return <Circle className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-sm">Collaboration</span>
            <div className="flex items-center gap-1">
              <Circle className={`w-2 h-2 ${isConnected ? 'text-green-500 fill-current' : 'text-red-500 fill-current'}`} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <Button
            onClick={() => setShowShareDialog(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Share2 className="w-3 h-3" />
            Share
          </Button>
        </div>
      </div>

      {/* Active Users */}
      <div className="p-3 border-b">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Active Users ({activeUsers.length})
        </h4>
        <div className="space-y-2">
          {activeUsers.map(user => (
            <div
              key={user.id}
              onClick={() => onUserClick?.(user)}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={user.avatar} />
                <AvatarFallback 
                  className="text-xs"
                  style={{ backgroundColor: user.color + '20', color: user.color }}
                >
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">{user.name}</span>
                  {user.id === currentUser?.id && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {getPermissionIcon('editor')}
                  <span>Editor</span>
                  {user.cursor && (
                    <>
                      <span>•</span>
                      <span>{user.cursor.file}:{user.cursor.line}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(user.lastSeen)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="p-3">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Comments ({comments.length})
          {currentFile && (
            <Badge variant="outline" className="text-xs">
              {currentFile}
            </Badge>
          )}
        </h4>

        {/* Add Comment */}
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <div className="flex items-center gap-2 mb-2">
            <Input
              type="number"
              placeholder="Line #"
              value={selectedLine || ''}
              onChange={(e) => setSelectedLine(parseInt(e.target.value) || null)}
              className="w-20 h-8 text-xs"
            />
            <span className="text-xs text-gray-500">Add comment to line</span>
          </div>
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="text-sm mb-2"
            rows={2}
          />
          <Button
            onClick={addComment}
            disabled={!newComment.trim() || !currentFile || selectedLine === null}
            size="sm"
            className="w-full"
          >
            Add Comment
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map(comment => {
            const user = activeUsers.find(u => u.id === comment.userId);
            return (
              <div
                key={comment.id}
                onClick={() => onCommentClick?.(comment)}
                className="p-2 border rounded cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-start gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback 
                      className="text-xs"
                      style={{ backgroundColor: user?.color + '20', color: user?.color }}
                    >
                      {user ? getUserInitials(user.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {user?.name || 'Unknown User'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Line {comment.line}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatTime(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                    
                    {comment.replies.length > 0 && (
                      <div className="space-y-1 ml-4 border-l-2 border-gray-200 pl-2">
                        {comment.replies.map(reply => {
                          const replyUser = activeUsers.find(u => u.id === reply.userId);
                          return (
                            <div key={reply.id} className="text-xs">
                              <span className="font-medium">{replyUser?.name || 'Unknown'}:</span>
                              <span className="ml-1">{reply.content}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveComment(comment.id);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6"
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {comments.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-4">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No comments yet
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Share Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={shareProject} className="flex-1">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Share as Editor
                </Button>
                <Button 
                  onClick={() => setShowShareDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
