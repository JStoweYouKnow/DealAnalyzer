// Vercel Blob Storage for Reports and Files
// Replaces filesystem operations for serverless compatibility

import { put, del, list } from '@vercel/blob';

export class BlobStorageService {
  /**
   * Upload a file to Vercel Blob Storage
   */
  static async uploadFile(
    filename: string,
    content: Buffer | string,
    contentType: string = 'application/octet-stream'
  ): Promise<{ url: string; pathname: string }> {
    try {
      console.log(`[Blob Storage] Uploading: ${filename}`);

      const blob = await put(filename, content, {
        access: 'public',
        contentType,
        addRandomSuffix: true, // Prevents collisions
      });

      console.log(`[Blob Storage] ✅ Uploaded to: ${blob.url}`);

      return {
        url: blob.url,
        pathname: blob.pathname,
      };
    } catch (error) {
      console.error('[Blob Storage] Upload error:', error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Delete a file from Blob Storage
   */
  static async deleteFile(url: string): Promise<void> {
    try {
      console.log(`[Blob Storage] Deleting: ${url}`);
      await del(url);
      console.log(`[Blob Storage] ✅ Deleted: ${url}`);
    } catch (error) {
      console.error('[Blob Storage] Delete error:', error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * List all files in Blob Storage
   */
  static async listFiles(options?: { prefix?: string; limit?: number }) {
    try {
      const { blobs } = await list({
        prefix: options?.prefix,
        limit: options?.limit || 1000,
      });

      console.log(`[Blob Storage] Found ${blobs.length} files`);
      return blobs;
    } catch (error) {
      console.error('[Blob Storage] List error:', error);
      throw new Error(`Failed to list files: ${error}`);
    }
  }

  /**
   * Clean up old reports (older than X days)
   */
  static async cleanupOldReports(daysOld: number = 7): Promise<number> {
    try {
      const files = await this.listFiles({ prefix: 'reports/' });
      const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        const uploadedAt = new Date(file.uploadedAt).getTime();
        if (uploadedAt < cutoffDate) {
          await this.deleteFile(file.url);
          deletedCount++;
        }
      }

      console.log(`[Blob Storage] Cleaned up ${deletedCount} old reports`);
      return deletedCount;
    } catch (error) {
      console.error('[Blob Storage] Cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get file statistics
   */
  static async getStats() {
    try {
      const files = await this.listFiles();

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);

      return {
        totalFiles: files.length,
        totalSize: `${sizeInMB} MB`,
        files: files.map((f) => ({
          pathname: f.pathname,
          size: `${(f.size / 1024).toFixed(2)} KB`,
          uploadedAt: new Date(f.uploadedAt).toLocaleString(),
        })),
      };
    } catch (error) {
      console.error('[Blob Storage] Stats error:', error);
      return {
        totalFiles: 0,
        totalSize: '0 MB',
        files: [],
      };
    }
  }
}

// Fallback implementation for when Blob Storage is not configured
export class BlobStorageFallback {
  private static storage = new Map<string, { content: Buffer | string; contentType: string; uploadedAt: Date }>();

  static async uploadFile(
    filename: string,
    content: Buffer | string,
    contentType: string = 'application/octet-stream'
  ) {
    console.log(`[Blob Storage Fallback] Storing in memory: ${filename}`);

    const key = `${filename}-${Date.now()}`;
    this.storage.set(key, { content, contentType, uploadedAt: new Date() });

    // Return a fake URL
    return {
      url: `/api/blob/${key}`,
      pathname: filename,
    };
  }

  static async deleteFile(url: string): Promise<void> {
    const key = url.split('/').pop() || '';
    this.storage.delete(key);
    console.log(`[Blob Storage Fallback] Deleted from memory: ${key}`);
  }

  static async listFiles(options?: { prefix?: string; limit?: number }) {
    const entries = Array.from(this.storage.entries());
    return entries
      .filter(([key]) => !options?.prefix || key.startsWith(options.prefix))
      .slice(0, options?.limit || 1000)
      .map(([key, value]) => ({
        url: `/api/blob/${key}`,
        pathname: key,
        size: typeof value.content === 'string' ? value.content.length : value.content.byteLength,
        uploadedAt: value.uploadedAt.toISOString(),
      }));
  }

  static async cleanupOldReports(daysOld: number = 7): Promise<number> {
    const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const entries = Array.from(this.storage.entries());

    let deletedCount = 0;
    for (const [key, value] of entries) {
      if (value.uploadedAt.getTime() < cutoffDate) {
        this.storage.delete(key);
        deletedCount++;
      }
    }

    console.log(`[Blob Storage Fallback] Cleaned up ${deletedCount} old items`);
    return deletedCount;
  }

  static async getStats() {
    const entries = Array.from(this.storage.values());
    const totalSize = entries.reduce(
      (sum, item) => sum + (typeof item.content === 'string' ? item.content.length : item.content.byteLength),
      0
    );

    return {
      totalFiles: this.storage.size,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      files: Array.from(this.storage.entries()).map(([key, value]) => ({
        pathname: key,
        size: `${((typeof value.content === 'string' ? value.content.length : value.content.byteLength) / 1024).toFixed(2)} KB`,
        uploadedAt: value.uploadedAt.toLocaleString(),
      })),
    };
  }
}

// Export the appropriate storage based on environment
export const blobStorage =
  process.env.BLOB_READ_WRITE_TOKEN ? BlobStorageService : BlobStorageFallback;
