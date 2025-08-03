// Advanced PWA features: Background Sync, Push Notifications, Offline-First Architecture

export interface PWACapabilities {
  serviceWorker: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  offlineStorage: boolean;
  installPrompt: boolean;
  fileSystemAccess: boolean;
  webShare: boolean;
  badgeAPI: boolean;
}

export interface SyncTask {
  id: string;
  type: 'file-save' | 'project-sync' | 'deployment' | 'collaboration';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class AdvancedPWAService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private syncTasks: Map<string, SyncTask> = new Map();
  private pushSubscription: PushSubscription | null = null;
  private installPromptEvent: any = null;
  private isOnline = navigator.onLine;
  private offlineQueue: Array<() => Promise<void>> = [];

  constructor() {
    this.initializePWA();
  }

  // Initialize PWA features
  private async initializePWA(): Promise<void> {
    // Register service worker
    await this.registerServiceWorker();
    
    // Set up offline/online listeners
    this.setupNetworkListeners();
    
    // Set up install prompt
    this.setupInstallPrompt();
    
    // Initialize background sync
    this.initializeBackgroundSync();
    
    // Set up push notifications
    await this.initializePushNotifications();
    
    // Set up offline storage
    this.initializeOfflineStorage();
  }

  // Service Worker Registration
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        
        // Listen for service worker updates
        this.serviceWorkerRegistration.addEventListener('updatefound', () => {
          const newWorker = this.serviceWorkerRegistration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.notifyUpdate();
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Background Sync
  private initializeBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Listen for sync events from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          this.handleSyncComplete(event.data.taskId);
        }
      });
    }
  }

  // Queue task for background sync
  async queueSyncTask(task: Omit<SyncTask, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const syncTask: SyncTask = {
      ...task,
      id: this.generateId(),
      timestamp: new Date(),
      retryCount: 0
    };

    this.syncTasks.set(syncTask.id, syncTask);

    if (this.isOnline) {
      // Execute immediately if online
      await this.executeSyncTask(syncTask);
    } else {
      // Queue for background sync
      await this.registerBackgroundSync(syncTask);
    }

    return syncTask.id;
  }

  private async registerBackgroundSync(task: SyncTask): Promise<void> {
    if (this.serviceWorkerRegistration && 'sync' in this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.sync.register(`sync-${task.id}`);
        console.log('Background sync registered for task:', task.id);
      } catch (error) {
        console.error('Background sync registration failed:', error);
        // Fallback: add to offline queue
        this.addToOfflineQueue(task);
      }
    } else {
      // Fallback: add to offline queue
      this.addToOfflineQueue(task);
    }
  }

  private async executeSyncTask(task: SyncTask): Promise<void> {
    try {
      switch (task.type) {
        case 'file-save':
          await this.syncFileSave(task.data);
          break;
        case 'project-sync':
          await this.syncProject(task.data);
          break;
        case 'deployment':
          await this.syncDeployment(task.data);
          break;
        case 'collaboration':
          await this.syncCollaboration(task.data);
          break;
      }
      
      this.syncTasks.delete(task.id);
      console.log('Sync task completed:', task.id);
    } catch (error) {
      console.error('Sync task failed:', error);
      task.retryCount++;
      
      if (task.retryCount < task.maxRetries) {
        // Retry with exponential backoff
        const delay = Math.pow(2, task.retryCount) * 1000;
        setTimeout(() => this.executeSyncTask(task), delay);
      } else {
        console.error('Sync task failed permanently:', task.id);
        this.syncTasks.delete(task.id);
      }
    }
  }

  // Push Notifications
  private async initializePushNotifications(): Promise<void> {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      // Check if notifications are supported
      if (Notification.permission === 'default') {
        // Don't request permission automatically
        console.log('Push notifications available but not requested');
      }
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      });

      this.pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Send subscription to server
      await this.sendSubscriptionToServer(this.pushSubscription);
      
      return this.pushSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    if (Notification.permission === 'granted') {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        image: payload.image,
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
        actions: payload.actions
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        if (payload.data?.url) {
          window.open(payload.data.url, '_blank');
        }
      };
    }
  }

  // App Installation
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPromptEvent = event;
      console.log('Install prompt available');
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.installPromptEvent = null;
    });
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPromptEvent) {
      console.log('Install prompt not available');
      return false;
    }

    const result = await this.installPromptEvent.prompt();
    const outcome = await result.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      this.installPromptEvent = null;
      return true;
    } else {
      console.log('User dismissed the install prompt');
      return false;
    }
  }

  isInstallPromptAvailable(): boolean {
    return this.installPromptEvent !== null;
  }

  // Offline Storage
  private initializeOfflineStorage(): void {
    // Initialize IndexedDB for offline storage
    this.setupIndexedDB();
  }

  private async setupIndexedDB(): Promise<void> {
    if ('indexedDB' in window) {
      try {
        const db = await this.openIndexedDB();
        console.log('IndexedDB initialized');
      } catch (error) {
        console.error('IndexedDB initialization failed:', error);
      }
    }
  }

  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('HexKexPWA', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'name' });
          filesStore.createIndex('lastModified', 'lastModified');
        }
        
        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectsStore.createIndex('name', 'name');
        }
        
        if (!db.objectStoreNames.contains('syncTasks')) {
          db.createObjectStore('syncTasks', { keyPath: 'id' });
        }
      };
    });
  }

  // Network Status
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('App is online');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App is offline');
    });
  }

  private addToOfflineQueue(task: SyncTask): void {
    this.offlineQueue.push(() => this.executeSyncTask(task));
  }

  private async processOfflineQueue(): Promise<void> {
    console.log(`Processing ${this.offlineQueue.length} offline tasks`);
    
    while (this.offlineQueue.length > 0 && this.isOnline) {
      const task = this.offlineQueue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Offline task failed:', error);
        }
      }
    }
  }

  // Web Share API
  async shareProject(shareData: { title: string; text: string; url: string }): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        console.error('Web Share failed:', error);
        return false;
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        console.log('URL copied to clipboard');
        return true;
      } catch (error) {
        console.error('Clipboard write failed:', error);
        return false;
      }
    }
  }

  // Badge API
  setBadge(count?: number): void {
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(count);
    }
  }

  clearBadge(): void {
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge();
    }
  }

  // File System Access API
  async openFileSystemDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        return dirHandle;
      } catch (error) {
        console.error('Directory picker failed:', error);
        return null;
      }
    }
    return null;
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Sync task implementations
  private async syncFileSave(data: any): Promise<void> {
    // Implement file save sync
    console.log('Syncing file save:', data);
  }

  private async syncProject(data: any): Promise<void> {
    // Implement project sync
    console.log('Syncing project:', data);
  }

  private async syncDeployment(data: any): Promise<void> {
    // Implement deployment sync
    console.log('Syncing deployment:', data);
  }

  private async syncCollaboration(data: any): Promise<void> {
    // Implement collaboration sync
    console.log('Syncing collaboration:', data);
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // Send subscription to your server
    console.log('Sending subscription to server:', subscription);
  }

  private handleSyncComplete(taskId: string): void {
    console.log('Sync completed for task:', taskId);
    this.syncTasks.delete(taskId);
  }

  private notifyUpdate(): void {
    // Notify user about app update
    this.sendNotification({
      title: 'App Update Available',
      body: 'A new version of Hex & Kex is available. Refresh to update.',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        { action: 'refresh', title: 'Refresh Now' },
        { action: 'dismiss', title: 'Later' }
      ]
    });
  }

  // Public API
  getCapabilities(): PWACapabilities {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      pushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
      offlineStorage: 'indexedDB' in window,
      installPrompt: this.installPromptEvent !== null,
      fileSystemAccess: 'showDirectoryPicker' in window,
      webShare: 'share' in navigator,
      badgeAPI: 'setAppBadge' in navigator
    };
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  getPendingSyncTasks(): SyncTask[] {
    return Array.from(this.syncTasks.values());
  }
}

// Global PWA service instance
export const advancedPWAService = new AdvancedPWAService();
