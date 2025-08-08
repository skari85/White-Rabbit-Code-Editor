'use client';

/**
 * White Rabbit Code Editor - Universal Data Connector
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 */

export interface DataConnection {
  id: string;
  name: string;
  type: 'csv' | 'json' | 'api' | 'database' | 'stream' | 'sample';
  source: string;
  data?: any[];
  schema?: Record<string, string>;
  lastUpdated: Date;
  isActive: boolean;
}

export interface DataConnectorConfig {
  maxConnections: number;
  cacheTimeout: number;
  enableStreaming: boolean;
}

export class DataConnectorService {
  private connections: Map<string, DataConnection> = new Map();
  private config: DataConnectorConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config?: Partial<DataConnectorConfig>) {
    this.config = {
      maxConnections: parseInt(process.env.NEXT_PUBLIC_MAX_DATA_CONNECTIONS || '10'),
      cacheTimeout: parseInt(process.env.NEXT_PUBLIC_DATA_CACHE_DURATION || '300000'),
      enableStreaming: process.env.NEXT_PUBLIC_ENABLE_STREAMING_DATA === 'true',
      ...config
    };
  }

  /**
   * Connect to CSV data source
   */
  async connectCSV(file: File, name?: string): Promise<DataConnection> {
    const Papa = await import('papaparse');
    
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const connection: DataConnection = {
            id: `csv_${Date.now()}`,
            name: name || file.name,
            type: 'csv',
            source: file.name,
            data: results.data,
            schema: this.inferSchema(results.data),
            lastUpdated: new Date(),
            isActive: true
          };

          this.connections.set(connection.id, connection);
          resolve(connection);
        },
        error: (error) => reject(error)
      });
    });
  }

  /**
   * Connect to JSON data source
   */
  async connectJSON(data: any, name: string, source?: string): Promise<DataConnection> {
    const connection: DataConnection = {
      id: `json_${Date.now()}`,
      name,
      type: 'json',
      source: source || 'manual',
      data: Array.isArray(data) ? data : [data],
      schema: this.inferSchema(Array.isArray(data) ? data : [data]),
      lastUpdated: new Date(),
      isActive: true
    };

    this.connections.set(connection.id, connection);
    return connection;
  }

  /**
   * Connect to REST API
   */
  async connectAPI(url: string, name: string, headers?: Record<string, string>): Promise<DataConnection> {
    try {
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      const connection: DataConnection = {
        id: `api_${Date.now()}`,
        name,
        type: 'api',
        source: url,
        data: Array.isArray(data) ? data : [data],
        schema: this.inferSchema(Array.isArray(data) ? data : [data]),
        lastUpdated: new Date(),
        isActive: true
      };

      this.connections.set(connection.id, connection);
      return connection;
    } catch (error) {
      throw new Error(`Failed to connect to API: ${error}`);
    }
  }

  /**
   * Create sample dataset for testing
   */
  createSampleDataset(type: 'sales' | 'users' | 'analytics' = 'sales'): DataConnection {
    let data: any[] = [];
    let name = '';

    switch (type) {
      case 'sales':
        name = 'Sample Sales Data';
        data = this.generateSalesData();
        break;
      case 'users':
        name = 'Sample User Data';
        data = this.generateUserData();
        break;
      case 'analytics':
        name = 'Sample Analytics Data';
        data = this.generateAnalyticsData();
        break;
    }

    const connection: DataConnection = {
      id: `sample_${type}_${Date.now()}`,
      name,
      type: 'sample',
      source: 'generated',
      data,
      schema: this.inferSchema(data),
      lastUpdated: new Date(),
      isActive: true
    };

    this.connections.set(connection.id, connection);
    return connection;
  }

  /**
   * Get connection by ID
   */
  getConnection(id: string): DataConnection | undefined {
    return this.connections.get(id);
  }

  /**
   * List all connections
   */
  listConnections(): DataConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Remove connection
   */
  removeConnection(id: string): boolean {
    return this.connections.delete(id);
  }

  /**
   * Get data from connection with caching
   */
  getData(connectionId: string, useCache = true): any[] | null {
    const connection = this.connections.get(connectionId);
    if (!connection) return null;

    if (useCache) {
      const cached = this.cache.get(connectionId);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }
    }

    const data = connection.data || [];
    this.cache.set(connectionId, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Infer schema from data
   */
  private inferSchema(data: any[]): Record<string, string> {
    if (!data || data.length === 0) return {};

    const schema: Record<string, string> = {};
    const sample = data[0];

    for (const [key, value] of Object.entries(sample)) {
      if (typeof value === 'number') {
        schema[key] = 'number';
      } else if (typeof value === 'boolean') {
        schema[key] = 'boolean';
      } else if (value instanceof Date) {
        schema[key] = 'date';
      } else if (typeof value === 'string') {
        // Try to detect if it's a date string
        if (!isNaN(Date.parse(value))) {
          schema[key] = 'date';
        } else {
          schema[key] = 'string';
        }
      } else {
        schema[key] = 'string';
      }
    }

    return schema;
  }

  /**
   * Generate sample sales data
   */
  private generateSalesData(): any[] {
    const regions = ['North', 'South', 'East', 'West'];
    const products = ['Product A', 'Product B', 'Product C', 'Product D'];
    const data = [];

    for (let i = 0; i < 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      
      data.push({
        id: i + 1,
        date: date.toISOString().split('T')[0],
        region: regions[Math.floor(Math.random() * regions.length)],
        product: products[Math.floor(Math.random() * products.length)],
        sales: Math.floor(Math.random() * 10000) + 1000,
        quantity: Math.floor(Math.random() * 100) + 1,
        profit: Math.floor(Math.random() * 2000) + 200
      });
    }

    return data;
  }

  /**
   * Generate sample user data
   */
  private generateUserData(): any[] {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];
    const data = [];

    for (let i = 0; i < 50; i++) {
      data.push({
        id: i + 1,
        name: names[Math.floor(Math.random() * names.length)],
        email: `user${i + 1}@company.com`,
        department: departments[Math.floor(Math.random() * departments.length)],
        age: Math.floor(Math.random() * 40) + 22,
        salary: Math.floor(Math.random() * 80000) + 40000,
        joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
      });
    }

    return data;
  }

  /**
   * Generate sample analytics data
   */
  private generateAnalyticsData(): any[] {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        pageViews: Math.floor(Math.random() * 5000) + 1000,
        uniqueVisitors: Math.floor(Math.random() * 2000) + 500,
        bounceRate: Math.random() * 0.5 + 0.2,
        avgSessionDuration: Math.floor(Math.random() * 300) + 60,
        conversions: Math.floor(Math.random() * 100) + 10
      });
    }

    return data;
  }
}

// Export singleton instance
export const dataConnector = new DataConnectorService();
