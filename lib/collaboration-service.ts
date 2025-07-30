import { EventEmitter } from 'events';

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface CollaborationMessage {
  type: 'cursor' | 'selection' | 'edit' | 'join' | 'leave' | 'sync';
  userId: string;
  timestamp: number;
  data: any;
}

export interface EditOperation {
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  text: string;
}

export class CollaborationService extends EventEmitter {
  private ws: WebSocket | null = null;
  private users: Map<string, CollaborationUser> = new Map();
  private currentUser: CollaborationUser | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;

  constructor(private serverUrl: string = 'ws://localhost:3001') {
    super();
  }

  connect(userId: string, userName: string, userColor: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.currentUser = {
          id: userId,
          name: userName,
          color: userColor
        };

        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          
          // Send join message
          this.sendMessage({
            type: 'join',
            userId: this.currentUser!.id,
            timestamp: Date.now(),
            data: {
              name: this.currentUser!.name,
              color: this.currentUser!.color
            }
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: CollaborationMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse collaboration message:', error);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.sendMessage({
        type: 'leave',
        userId: this.currentUser!.id,
        timestamp: Date.now(),
        data: {}
      });
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.users.clear();
    this.emit('disconnected');
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(this.currentUser!.id, this.currentUser!.name, this.currentUser!.color);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.emit('reconnectFailed');
    }
  }

  private sendMessage(message: CollaborationMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: CollaborationMessage): void {
    switch (message.type) {
      case 'join':
        this.users.set(message.userId, message.data);
        this.emit('userJoined', message.data);
        break;
      
      case 'leave':
        this.users.delete(message.userId);
        this.emit('userLeft', message.userId);
        break;
      
      case 'cursor':
        const user = this.users.get(message.userId);
        if (user) {
          user.cursor = message.data;
          this.emit('cursorUpdated', message.userId, message.data);
        }
        break;
      
      case 'selection':
        const userWithSelection = this.users.get(message.userId);
        if (userWithSelection) {
          userWithSelection.selection = message.data;
          this.emit('selectionUpdated', message.userId, message.data);
        }
        break;
      
      case 'edit':
        this.emit('editReceived', message.userId, message.data);
        break;
      
      case 'sync':
        this.users = new Map(Object.entries(message.data.users));
        this.emit('sync', message.data);
        break;
    }
  }

  // Public methods for sending updates
  updateCursor(line: number, column: number): void {
    if (!this.currentUser) return;
    
    this.sendMessage({
      type: 'cursor',
      userId: this.currentUser.id,
      timestamp: Date.now(),
      data: { line, column }
    });
  }

  updateSelection(startLine: number, startColumn: number, endLine: number, endColumn: number): void {
    if (!this.currentUser) return;
    
    this.sendMessage({
      type: 'selection',
      userId: this.currentUser.id,
      timestamp: Date.now(),
      data: { startLine, startColumn, endLine, endColumn }
    });
  }

  sendEdit(operation: EditOperation): void {
    if (!this.currentUser) return;
    
    this.sendMessage({
      type: 'edit',
      userId: this.currentUser.id,
      timestamp: Date.now(),
      data: operation
    });
  }

  // Getters
  getUsers(): CollaborationUser[] {
    return Array.from(this.users.values());
  }

  getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  isUserConnected(): boolean {
    return this.isConnected;
  }
} 