// Real-time collaboration service
// Note: This is a simplified implementation. In production, you'd use WebSockets, WebRTC, or services like Yjs

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: CursorPosition;
  selection?: TextSelection;
  lastSeen: Date;
  isOnline: boolean;
}

export interface CursorPosition {
  file: string;
  line: number;
  column: number;
}

export interface TextSelection {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface CollaborationEvent {
  id: string;
  type: 'cursor' | 'selection' | 'edit' | 'comment' | 'join' | 'leave';
  userId: string;
  timestamp: Date;
  data: any;
}

export interface TextEdit {
  id: string;
  userId: string;
  file: string;
  operation: 'insert' | 'delete' | 'replace';
  position: { line: number; column: number };
  content: string;
  length?: number;
  timestamp: Date;
}

export interface Comment {
  id: string;
  userId: string;
  file: string;
  line: number;
  content: string;
  resolved: boolean;
  replies: CommentReply[];
  timestamp: Date;
}

export interface CommentReply {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
}

export interface SharedProject {
  id: string;
  name: string;
  owner: string;
  collaborators: CollaborationUser[];
  permissions: ProjectPermissions;
  files: { [fileName: string]: string };
  comments: Comment[];
  history: TextEdit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPermissions {
  [userId: string]: 'owner' | 'editor' | 'viewer' | 'commenter';
}

export class CollaborationService {
  private currentUser: CollaborationUser | null = null;
  private activeUsers: Map<string, CollaborationUser> = new Map();
  private eventListeners: Map<string, Set<(event: CollaborationEvent) => void>> = new Map();
  private textEdits: TextEdit[] = [];
  private comments: Comment[] = [];
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Initialize collaboration
  async initialize(user: Omit<CollaborationUser, 'isOnline' | 'lastSeen'>): Promise<void> {
    this.currentUser = {
      ...user,
      isOnline: true,
      lastSeen: new Date()
    };

    // Simulate connection (in production, this would establish WebSocket connection)
    await this.connect();
  }

  // Connect to collaboration server
  private async connect(): Promise<void> {
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Announce user joined
      this.broadcastEvent({
        id: this.generateId(),
        type: 'join',
        userId: this.currentUser!.id,
        timestamp: new Date(),
        data: this.currentUser
      });

      console.log('Connected to collaboration service');
    } catch (error) {
      console.error('Failed to connect to collaboration service:', error);
      this.handleConnectionError();
    }
  }

  // Handle connection errors with retry logic
  private async handleConnectionError(): Promise<void> {
    this.isConnected = false;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Update cursor position
  updateCursor(file: string, line: number, column: number): void {
    if (!this.currentUser || !this.isConnected) return;

    this.currentUser.cursor = { file, line, column };
    this.currentUser.lastSeen = new Date();

    this.broadcastEvent({
      id: this.generateId(),
      type: 'cursor',
      userId: this.currentUser.id,
      timestamp: new Date(),
      data: { file, line, column }
    });
  }

  // Update text selection
  updateSelection(file: string, startLine: number, startColumn: number, endLine: number, endColumn: number): void {
    if (!this.currentUser || !this.isConnected) return;

    this.currentUser.selection = { file, startLine, startColumn, endLine, endColumn };
    this.currentUser.lastSeen = new Date();

    this.broadcastEvent({
      id: this.generateId(),
      type: 'selection',
      userId: this.currentUser.id,
      timestamp: new Date(),
      data: { file, startLine, startColumn, endLine, endColumn }
    });
  }

  // Apply text edit
  applyTextEdit(edit: Omit<TextEdit, 'id' | 'userId' | 'timestamp'>): void {
    if (!this.currentUser || !this.isConnected) return;

    const textEdit: TextEdit = {
      ...edit,
      id: this.generateId(),
      userId: this.currentUser.id,
      timestamp: new Date()
    };

    this.textEdits.push(textEdit);

    this.broadcastEvent({
      id: this.generateId(),
      type: 'edit',
      userId: this.currentUser.id,
      timestamp: new Date(),
      data: textEdit
    });
  }

  // Add comment
  addComment(file: string, line: number, content: string): Comment {
    if (!this.currentUser) throw new Error('User not initialized');

    const comment: Comment = {
      id: this.generateId(),
      userId: this.currentUser.id,
      file,
      line,
      content,
      resolved: false,
      replies: [],
      timestamp: new Date()
    };

    this.comments.push(comment);

    this.broadcastEvent({
      id: this.generateId(),
      type: 'comment',
      userId: this.currentUser.id,
      timestamp: new Date(),
      data: comment
    });

    return comment;
  }

  // Reply to comment
  replyToComment(commentId: string, content: string): CommentReply | null {
    if (!this.currentUser) return null;

    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) return null;

    const reply: CommentReply = {
      id: this.generateId(),
      userId: this.currentUser.id,
      content,
      timestamp: new Date()
    };

    comment.replies.push(reply);

    this.broadcastEvent({
      id: this.generateId(),
      type: 'comment',
      userId: this.currentUser.id,
      timestamp: new Date(),
      data: { type: 'reply', commentId, reply }
    });

    return reply;
  }

  // Resolve comment
  resolveComment(commentId: string): boolean {
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) return false;

    comment.resolved = true;

    this.broadcastEvent({
      id: this.generateId(),
      type: 'comment',
      userId: this.currentUser!.id,
      timestamp: new Date(),
      data: { type: 'resolve', commentId }
    });

    return true;
  }

  // Get active users
  getActiveUsers(): CollaborationUser[] {
    return Array.from(this.activeUsers.values()).filter(user => user.isOnline);
  }

  // Get user by ID
  getUser(userId: string): CollaborationUser | null {
    return this.activeUsers.get(userId) || null;
  }

  // Get comments for file
  getCommentsForFile(file: string): Comment[] {
    return this.comments.filter(c => c.file === file && !c.resolved);
  }

  // Get all comments
  getAllComments(): Comment[] {
    return [...this.comments];
  }

  // Get edit history
  getEditHistory(file?: string): TextEdit[] {
    return file 
      ? this.textEdits.filter(edit => edit.file === file)
      : [...this.textEdits];
  }

  // Event listeners
  addEventListener(eventType: string, callback: (event: CollaborationEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  // Broadcast event to all listeners
  private broadcastEvent(event: CollaborationEvent): void {
    // Simulate network delay
    setTimeout(() => {
      this.handleIncomingEvent(event);
    }, Math.random() * 100);
  }

  // Handle incoming events
  private handleIncomingEvent(event: CollaborationEvent): void {
    switch (event.type) {
      case 'join':
        this.handleUserJoin(event);
        break;
      case 'leave':
        this.handleUserLeave(event);
        break;
      case 'cursor':
        this.handleCursorUpdate(event);
        break;
      case 'selection':
        this.handleSelectionUpdate(event);
        break;
      case 'edit':
        this.handleTextEdit(event);
        break;
      case 'comment':
        this.handleComment(event);
        break;
    }

    // Notify listeners
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }

    // Notify all event listeners
    const allListeners = this.eventListeners.get('*');
    if (allListeners) {
      allListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in global event listener:', error);
        }
      });
    }
  }

  private handleUserJoin(event: CollaborationEvent): void {
    const user = event.data as CollaborationUser;
    this.activeUsers.set(user.id, user);
    console.log(`User ${user.name} joined`);
  }

  private handleUserLeave(event: CollaborationEvent): void {
    const user = this.activeUsers.get(event.userId);
    if (user) {
      user.isOnline = false;
      console.log(`User ${user.name} left`);
    }
  }

  private handleCursorUpdate(event: CollaborationEvent): void {
    const user = this.activeUsers.get(event.userId);
    if (user) {
      user.cursor = event.data;
      user.lastSeen = event.timestamp;
    }
  }

  private handleSelectionUpdate(event: CollaborationEvent): void {
    const user = this.activeUsers.get(event.userId);
    if (user) {
      user.selection = event.data;
      user.lastSeen = event.timestamp;
    }
  }

  private handleTextEdit(event: CollaborationEvent): void {
    const edit = event.data as TextEdit;
    
    // Don't apply our own edits
    if (edit.userId === this.currentUser?.id) return;
    
    this.textEdits.push(edit);
  }

  private handleComment(event: CollaborationEvent): void {
    const data = event.data;
    
    if (data.type === 'reply') {
      const comment = this.comments.find(c => c.id === data.commentId);
      if (comment) {
        comment.replies.push(data.reply);
      }
    } else if (data.type === 'resolve') {
      const comment = this.comments.find(c => c.id === data.commentId);
      if (comment) {
        comment.resolved = true;
      }
    } else {
      // New comment
      this.comments.push(data as Comment);
    }
  }

  // Share project
  async shareProject(projectData: any, permissions: ProjectPermissions): Promise<string> {
    const projectId = this.generateId();
    
    // Simulate API call to create shared project
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const sharedProject: SharedProject = {
      id: projectId,
      name: projectData.name || 'Untitled Project',
      owner: this.currentUser!.id,
      collaborators: [this.currentUser!],
      permissions,
      files: projectData.files || {},
      comments: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Project shared:', sharedProject);
    return projectId;
  }

  // Join shared project
  async joinProject(projectId: string): Promise<SharedProject | null> {
    // Simulate API call to join project
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In production, this would fetch the project from the server
    console.log(`Joining project: ${projectId}`);
    return null; // Simplified implementation
  }

  // Disconnect from collaboration
  disconnect(): void {
    if (this.currentUser && this.isConnected) {
      this.broadcastEvent({
        id: this.generateId(),
        type: 'leave',
        userId: this.currentUser.id,
        timestamp: new Date(),
        data: null
      });
    }

    this.isConnected = false;
    this.activeUsers.clear();
    this.eventListeners.clear();
    console.log('Disconnected from collaboration service');
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Get connection status
  isConnectedToCollaboration(): boolean {
    return this.isConnected;
  }

  // Get current user
  getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  // Generate user colors
  static generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

// Global collaboration service instance
export const collaborationService = new CollaborationService();
