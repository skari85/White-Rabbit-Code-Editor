export interface APIPaletteRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
}

export interface APIPaletteResponse {
  id: string;
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  timestamp: number;
  duration: number;
  size: number;
}

export interface APIPaletteData {
  id: string;
  name: string;
  data: any;
  schema: APIPaletteSchema;
  timestamp: number;
  lastUsed: number;
  usageCount: number;
}

export interface APIPaletteSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, APIPaletteSchema>;
  items?: APIPaletteSchema;
  required?: string[];
  examples?: any[];
}

export interface APIPaletteAutocomplete {
  path: string;
  value: any;
  type: string;
  description?: string;
  examples?: any[];
}

export class APIPaletteService {
  private static instance: APIPaletteService;
  private paletteData: Map<string, APIPaletteData> = new Map();
  private requestHistory: APIPaletteRequest[] = [];
  private responseHistory: APIPaletteResponse[] = [];
  private baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  private constructor() {}

  static getInstance(): APIPaletteService {
    if (!APIPaletteService.instance) {
      APIPaletteService.instance = new APIPaletteService();
    }
    return APIPaletteService.instance;
  }

  /**
   * Makes an API request and stores the response in the palette
   */
  async makeRequest(request: Omit<APIPaletteRequest, 'id' | 'timestamp' | 'status'>): Promise<APIPaletteResponse> {
    const fullRequest: APIPaletteRequest = {
      ...request,
      id: this.generateId(),
      timestamp: Date.now(),
      status: 'pending'
    };

    this.requestHistory.push(fullRequest);

    try {
      const startTime = Date.now();
      
      const response = await fetch(request.url, {
        method: request.method,
        headers: { ...this.baseHeaders, ...request.headers },
        body: request.body
      });

      const duration = Date.now() - startTime;
      const responseData = await this.parseResponse(response);
      
      const apiResponse: APIPaletteResponse = {
        id: this.generateId(),
        requestId: fullRequest.id,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
        data: responseData,
        timestamp: Date.now(),
        duration,
        size: JSON.stringify(responseData).length
      };

      this.responseHistory.push(apiResponse);
      
      // Store in palette for autocomplete
      const paletteData: APIPaletteData = {
        id: this.generateId(),
        name: request.name,
        data: responseData,
        schema: this.generateSchema(responseData),
        timestamp: Date.now(),
        lastUsed: Date.now(),
        usageCount: 1
      };

      this.paletteData.set(paletteData.id, paletteData);
      
      // Update request status
      fullRequest.status = 'success';
      
      return apiResponse;
    } catch (error) {
      fullRequest.status = 'error';
      throw error;
    }
  }

  /**
   * Gets autocomplete suggestions for palette data
   */
  getAutocompleteSuggestions(query: string): APIPaletteAutocomplete[] {
    const suggestions: APIPaletteAutocomplete[] = [];
    
    // Handle $palette queries
    if (query.startsWith('$palette.')) {
      const path = query.substring(9); // Remove '$palette.'
      
      this.paletteData.forEach((paletteItem) => {
        const matches = this.findAutocompleteMatches(paletteItem.data, path, paletteItem.name);
        suggestions.push(...matches);
      });
    }
    
    // Handle specific palette item queries
    const paletteMatch = query.match(/\\$palette\.([^.]+)\.(.+)?/);
    if (paletteMatch) {
      const paletteName = paletteMatch[1];
      const subPath = paletteMatch[2] || '';
      
      const paletteItem = Array.from(this.paletteData.values())
        .find(item => item.name.toLowerCase().includes(paletteName.toLowerCase()));
      
      if (paletteItem) {
        const matches = this.findAutocompleteMatches(paletteItem.data, subPath, paletteItem.name);
        suggestions.push(...matches);
      }
    }
    
    return suggestions.slice(0, 20); // Limit suggestions
  }

  /**
   * Gets the actual data for a palette reference
   */
  getPaletteData(reference: string): any {
    // Handle $palette references
    if (reference.startsWith('$palette.')) {
      const path = reference.substring(9);
      const parts = path.split('.');
      
      if (parts.length >= 1) {
        const paletteName = parts[0];
        const dataPath = parts.slice(1);
        
        const paletteItem = Array.from(this.paletteData.values())
          .find(item => item.name.toLowerCase().includes(paletteName.toLowerCase()));
        
        if (paletteItem) {
          return this.getNestedValue(paletteItem.data, dataPath);
        }
      }
    }
    
    return null;
  }

  /**
   * Gets all palette data for display
   */
  getAllPaletteData(): APIPaletteData[] {
    return Array.from(this.paletteData.values())
      .sort((a, b) => b.lastUsed - a.lastUsed);
  }

  /**
   * Gets request history
   */
  getRequestHistory(): APIPaletteRequest[] {
    return [...this.requestHistory].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Gets response history
   */
  getResponseHistory(): APIPaletteResponse[] {
    return [...this.responseHistory].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clears palette data
   */
  clearPalette(): void {
    this.paletteData.clear();
  }

  /**
   * Removes specific palette item
   */
  removePaletteItem(id: string): boolean {
    return this.paletteData.delete(id);
  }

  /**
   * Updates palette item usage
   */
  updatePaletteUsage(id: string): void {
    const item = this.paletteData.get(id);
    if (item) {
      item.lastUsed = Date.now();
      item.usageCount++;
    }
  }

  /**
   * Exports palette data
   */
  exportPalette(): string {
    const exportData = {
      palette: Array.from(this.paletteData.values()),
      requests: this.requestHistory,
      responses: this.responseHistory,
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Imports palette data
   */
  importPalette(data: string): void {
    try {
      const importData = JSON.parse(data);
      
      if (importData.palette) {
        importData.palette.forEach((item: APIPaletteData) => {
          this.paletteData.set(item.id, item);
        });
      }
      
      if (importData.requests) {
        this.requestHistory = importData.requests;
      }
      
      if (importData.responses) {
        this.responseHistory = importData.responses;
      }
    } catch (error) {
      console.error('Failed to import palette data:', error);
      throw new Error('Invalid palette data format');
    }
  }

  /**
   * Generates TypeScript interfaces from palette data
   */
  generateTypeScriptInterfaces(paletteId: string): string {
    const paletteItem = this.paletteData.get(paletteId);
    if (!paletteItem) return '';
    
    return this.generateInterfaceFromSchema(paletteItem.schema, paletteItem.name);
  }

  /**
   * Generates sample code for palette usage
   */
  generateSampleCode(paletteId: string): string {
    const paletteItem = this.paletteData.get(paletteId);
    if (!paletteItem) return '';
    
    const interfaceName = this.capitalizeFirst(paletteItem.name);
    
    return `// Generated from API Palette: ${paletteItem.name}
interface ${interfaceName} {
  // Auto-generated interface based on live API response
  // Use $palette.${paletteItem.name} to access live data
  
  // Example usage:
  const data = $palette.${paletteItem.name};
  console.log('Live data:', data);
}

// Type-safe access to palette data
const typedData: ${interfaceName} = $palette.${paletteItem.name};`;
  }

  // Private helper methods

  private generateId(): string {
    return `palette_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else if (contentType?.includes('text/')) {
      return await response.text();
    } else {
      return await response.arrayBuffer();
    }
  }

  private parseHeaders(headers: Headers): Record<string, string> {
    const parsed: Record<string, string> = {};
    headers.forEach((value, key) => {
      parsed[key] = value;
    });
    return parsed;
  }

  private generateSchema(data: any): APIPaletteSchema {
    if (data === null) return { type: 'null' };
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? this.generateSchema(data[0]) : { type: 'object' }
      };
    }
    if (typeof data === 'object') {
      const properties: Record<string, APIPaletteSchema> = {};
      const required: string[] = [];
      
      Object.entries(data).forEach(([key, value]) => {
        properties[key] = this.generateSchema(value);
        if (value !== null && value !== undefined) {
          required.push(key);
        }
      });
      
      return {
        type: 'object',
        properties,
        required
      };
    }
    
    return { type: typeof data as any };
  }

  private findAutocompleteMatches(data: any, path: string, paletteName: string): APIPaletteAutocomplete[] {
    const suggestions: APIPaletteAutocomplete[] = [];
    
    if (path === '') {
      // Root level suggestions
      if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          suggestions.push({
            path: `$palette.${paletteName}.${key}`,
            value,
            type: typeof value,
            description: `Access ${key} from ${paletteName}`,
            examples: this.generateExamples(value)
          });
        });
      }
    } else {
      // Nested path suggestions
      const nestedValue = this.getNestedValue(data, path.split('.'));
      if (nestedValue && typeof nestedValue === 'object' && nestedValue !== null) {
        Object.entries(nestedValue).forEach(([key, value]) => {
          suggestions.push({
            path: `$palette.${paletteName}.${path}.${key}`,
            value,
            type: typeof value,
            description: `Access ${key} from ${paletteName}.${path}`,
            examples: this.generateExamples(value)
          });
        });
      }
    }
    
    return suggestions;
  }

  private getNestedValue(obj: any, path: string[]): any {
    let current = obj;
    
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private generateExamples(value: any): any[] {
    if (Array.isArray(value)) {
      return value.slice(0, 3);
    } else if (typeof value === 'object' && value !== null) {
      return [Object.keys(value).slice(0, 5)];
    } else {
      return [value];
    }
  }

  private generateInterfaceFromSchema(schema: APIPaletteSchema, name: string): string {
    if (schema.type === 'object' && schema.properties) {
      const properties = Object.entries(schema.properties)
        .map(([key, propSchema]) => {
          const isRequired = schema.required?.includes(key);
          const optional = isRequired ? '' : '?';
          return `  ${key}${optional}: ${this.schemaTypeToTypeScript(propSchema)};`;
        })
        .join('\n');
      
      return `interface ${this.capitalizeFirst(name)} {\n${properties}\n}`;
    }
    
    return `type ${this.capitalizeFirst(name)} = ${this.schemaTypeToTypeScript(schema)};`;
  }

  private schemaTypeToTypeScript(schema: APIPaletteSchema): string {
    switch (schema.type) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'null': return 'null';
      case 'array': return schema.items ? `${this.schemaTypeToTypeScript(schema.items)}[]` : 'any[]';
      case 'object': return 'Record<string, any>';
      default: return 'any';
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
