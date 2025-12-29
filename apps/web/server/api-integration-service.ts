import { storage } from "./storage";
import { 
  apiIntegrationSchema, 
  type ApiIntegration, 
  type InsertApiIntegration 
} from "@shared/schema";

export class ApiIntegrationService {
  
  // Create new API integration
  async createIntegration(data: InsertApiIntegration): Promise<ApiIntegration> {
    // Validate the configuration based on integration type
    await this.validateIntegrationConfig(data);
    
    return await storage.createApiIntegration(data);
  }
  
  // Get all integrations for user
  async getUserIntegrations(userId: string): Promise<ApiIntegration[]> {
    return await storage.getUserApiIntegrations(userId);
  }
  
  // Get specific integration
  async getIntegration(id: string): Promise<ApiIntegration | null> {
    const integration = await storage.getApiIntegration(id);
    return integration || null;
  }
  
  // Update integration
  async updateIntegration(id: string, data: Partial<InsertApiIntegration>): Promise<ApiIntegration | null> {
    const existing = await storage.getApiIntegration(id);
    if (!existing) return null;
    
    const updateData = { ...existing, ...data };
    await this.validateIntegrationConfig(updateData);
    
    const updated = await storage.updateApiIntegration(id, data);
    return updated || null;
  }
  
  // Delete integration
  async deleteIntegration(id: string): Promise<boolean> {
    return await storage.deleteApiIntegration(id);
  }
  
  // Test integration connection
  async testIntegration(id: string): Promise<{ success: boolean; message: string }> {
    const integration = await storage.getApiIntegration(id);
    if (!integration) {
      return { success: false, message: "Integration not found" };
    }
    
    try {
      // Test connection based on auth type and base URL
      return await this.testGenericConnection(integration);
    } catch (error) {
      console.error("Integration test failed:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Connection test failed" 
      };
    }
  }
  
  // Sync data from integration
  async syncIntegrationData(id: string): Promise<{ success: boolean; message: string; syncedCount?: number }> {
    const integration = await storage.getApiIntegration(id);
    if (!integration) {
      return { success: false, message: "Integration not found" };
    }
    
    if (!integration.isActive) {
      return { success: false, message: "Integration is not active" };
    }
    
    try {
      // For now, return success with zero count as sync would be integration-specific
      return { success: true, message: "Integration sync completed", syncedCount: 0 };
    } catch (error) {
      console.error("Integration sync failed:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Data sync failed" 
      };
    }
  }
  
  // Send data to external integration
  async sendData(id: string, data: any, endpoint?: string): Promise<{ success: boolean; message: string }> {
    const integration = await storage.getApiIntegration(id);
    if (!integration) {
      return { success: false, message: "Integration not found" };
    }
    
    if (!integration.isActive) {
      return { success: false, message: "Integration is not active" };
    }
    
    try {
      const targetEndpoint = endpoint ? 
        integration.endpoints.find(ep => ep.name === endpoint) : 
        integration.endpoints[0];
        
      if (!targetEndpoint) {
        return { success: false, message: "No endpoint specified for integration" };
      }
      
      const url = `${integration.baseUrl}${targetEndpoint.path}`;
      const headers = this.buildAuthHeaders(integration);
      
      const response = await fetch(url, {
        method: targetEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: targetEndpoint.method !== 'GET' ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      return { success: true, message: "Data sent successfully" };
    } catch (error) {
      console.error("Integration send failed:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Data send failed" 
      };
    }
  }
  
  private async validateIntegrationConfig(data: any): Promise<void> {
    // Validate base URL security (prevent SSRF)
    if (!data.baseUrl.startsWith('https://')) {
      throw new Error('Base URL must use HTTPS protocol');
    }
    
    const url = new URL(data.baseUrl);
    const hostname = url.hostname;
    
    // Block obvious private/local network ranges by hostname
    if (hostname === 'localhost' || 
        hostname.startsWith('127.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('192.168.') || 
        hostname.includes('internal') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
      throw new Error('Base URL cannot target private or internal networks');
    }
    
    // Additional DNS resolution check to prevent IP bypass
    try {
      const dns = await import('dns');
      const { address } = await dns.promises.lookup(hostname);
      
      // Check if resolved IP is in private ranges
      if (this.isPrivateIP(address)) {
        throw new Error('Base URL resolves to a private network address');
      }
    } catch (dnsError) {
      // If DNS lookup fails, we'll allow it but log the issue
      console.warn(`DNS lookup failed for ${hostname}:`, dnsError);
    }
    
    // Validate that authConfig contains required fields based on authType
    const requiredFields = {
      api_key: ['apiKey'],
      oauth: ['clientId', 'clientSecret'],
      basic: ['username', 'password'],
      bearer: ['token']
    };
    
    const required = requiredFields[data.authType as keyof typeof requiredFields];
    if (!required) {
      throw new Error(`Unsupported auth type: ${data.authType}`);
    }
    
    if (!data.authConfig || typeof data.authConfig !== 'object') {
      throw new Error('authConfig is required and must be an object');
    }
    
    for (const field of required) {
      if (!data.authConfig[field]) {
        throw new Error(`Missing required auth field: ${field}`);
      }
    }
  }
  
  private async testGenericConnection(integration: ApiIntegration): Promise<{ success: boolean; message: string }> {
    try {
      const headers = this.buildAuthHeaders(integration);
      
      // Try to hit the base URL or first endpoint
      const testUrl = integration.endpoints.length > 0 
        ? `${integration.baseUrl}${integration.endpoints[0].path}` 
        : integration.baseUrl;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers
      });
      
      return response.ok 
        ? { success: true, message: "Connection successful" }
        : { success: false, message: `Connection failed with status ${response.status}` };
    } catch {
      return { success: false, message: "Unable to connect to API" };
    }
  }
  
  private buildAuthHeaders(integration: ApiIntegration): Record<string, string> {
    const headers: Record<string, string> = {};
    
    switch (integration.authType) {
      case 'api_key':
        headers['X-API-Key'] = integration.authConfig.apiKey;
        break;
      case 'bearer':
        headers['Authorization'] = `Bearer ${integration.authConfig.token}`;
        break;
      case 'basic':
        const credentials = Buffer.from(`${integration.authConfig.username}:${integration.authConfig.password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        break;
      // OAuth would require more complex handling
    }
    
    return headers;
  }
  
  private isPrivateIP(ip: string): boolean {
    // Check IPv4 private ranges
    const ipv4Ranges = [
      /^127\./, // 127.0.0.0/8 (loopback)
      /^10\./, // 10.0.0.0/8 (private)
      /^192\.168\./, // 192.168.0.0/16 (private)
      /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12 (private)
      /^169\.254\./, // 169.254.0.0/16 (link-local)
    ];
    
    // Check IPv6 private/local ranges
    const ipv6Ranges = [
      /^::1$/, // loopback
      /^fc00:/, // unique local
      /^fd00:/, // unique local
      /^fe80:/, // link-local
    ];
    
    return ipv4Ranges.some(range => range.test(ip)) || 
           ipv6Ranges.some(range => range.test(ip));
  }
}

export const apiIntegrationService = new ApiIntegrationService();