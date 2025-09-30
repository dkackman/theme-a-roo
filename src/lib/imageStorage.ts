/**
 * IndexedDB service for storing and retrieving images
 * Replaces localStorage usage for image storage throughout the app
 */

export interface StoredImage {
  id: string;
  data: Blob;
}

class ImageStorageService {
  private dbName = 'theme-a-roo-image-blobs';
  private dbVersion = 1;
  private storeName = 'images';
  private db: IDBDatabase | null = null;
  private activeBlobUrls = new Set<string>();

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  async storeImage(id: string, data: string | File | Blob): Promise<void> {
    const db = await this.ensureDB();

    try {
      // Convert various input types to Blob
      let blob: Blob;
      if (typeof data === 'string') {
        if (data.startsWith('data:')) {
          try {
            // Convert data URI to Blob using a more robust method
            blob = await this.dataUriToBlob(data);
          } catch (error) {
            console.error('Failed to convert data URI to blob:', error);
            throw new Error(
              `Failed to convert data URI to blob: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        } else if (data.startsWith('blob:')) {
          const response = await fetch(data);
          blob = await response.blob();
        } else {
          throw new Error('Unsupported data format');
        }
      } else {
        // data is File or Blob
        blob = data;
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const imageData: StoredImage = {
          id,
          data: blob,
        };

        const request = store.put(imageData);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          console.error('IndexedDB put operation failed:', event);
          console.error('Request error:', request.error);
          reject(
            new Error(
              `Failed to store image: ${request.error?.message || 'Unknown error'}`,
            ),
          );
        };
      });
    } catch (error) {
      console.error('Failed to convert data to blob:', error);
      throw error;
    }
  }

  async getImage(id: string): Promise<StoredImage | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to retrieve image'));
    });
  }

  async getImageUrl(id: string): Promise<string | null> {
    const storedImage = await this.getImage(id);
    if (!storedImage) {
      return null;
    }

    // Create object URL from blob
    const blobUrl = URL.createObjectURL(storedImage.data);
    this.activeBlobUrls.add(blobUrl);
    return blobUrl;
  }

  async deleteImage(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete image'));
    });
  }

  async getAllImages(): Promise<StoredImage[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () =>
        reject(new Error('Failed to retrieve all images'));
    });
  }

  async clearAllImages(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear all images'));
    });
  }

  /**
   * Convert data URI to Blob using a more robust method that handles large URIs
   */
  private async dataUriToBlob(dataUri: string): Promise<Blob> {
    try {
      // Try the standard fetch approach first (works for most cases)
      const response = await fetch(dataUri);
      return await response.blob();
    } catch (error) {
      try {
        const [header, base64Data] = dataUri.split(',');
        if (!header || !base64Data) {
          throw new Error('Invalid data URI format');
        }

        // Extract MIME type
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

        // Convert base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        return new Blob([bytes], { type: mimeType });
      } catch (manualError) {
        console.error('Manual conversion also failed:', manualError);
        throw new Error(
          `Both fetch and manual conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  revokeImageUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      this.activeBlobUrls.delete(url);
    }
  }

  // Cleanup all active blob URLs (useful for app shutdown)
  revokeAllActiveUrls(): void {
    this.activeBlobUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.activeBlobUrls.clear();
  }

  // Get count of active blob URLs (useful for debugging)
  getActiveUrlCount(): number {
    return this.activeBlobUrls.size;
  }
}

// Export singleton instance
export const imageStorage = new ImageStorageService();

// Initialize on module load
imageStorage.init().catch(console.error);
