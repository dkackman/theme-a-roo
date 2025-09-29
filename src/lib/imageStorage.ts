/**
 * IndexedDB service for storing and retrieving images
 * Replaces localStorage usage for image storage throughout the app
 */

export interface StoredImage {
  id: string;
  data: string; // base64 data URI
}

class ImageStorageService {
  private dbName = 'theme-a-roo-images';
  private dbVersion = 1;
  private storeName = 'images';
  private db: IDBDatabase | null = null;

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

  async storeImage(id: string, data: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const imageData: StoredImage = {
        id,
        data,
      };

      const request = store.put(imageData);

      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('❌ IndexedDB put operation failed:', event);
        console.error('❌ Request error:', request.error);
        reject(
          new Error(
            `Failed to store image: ${request.error?.message || 'Unknown error'}`,
          ),
        );
      };
    });
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
}

// Export singleton instance
export const imageStorage = new ImageStorageService();

// Initialize on module load
imageStorage.init().catch(console.error);
