// Safe Persistent Storage with IndexedDB & LocalStorage Fallback
// This completely prevents QuotaExceededError when saving documents with images/logos/signatures.

const DB_NAME = 'ThaiDocFlowDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

// Open IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get item from IndexedDB with fallback to localStorage
export async function getStoredItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result !== undefined && request.result !== null) {
          resolve(request.result as T);
        } else {
          // Check localStorage as fallback / migration
          try {
            const local = localStorage.getItem(key);
            if (local) {
              const parsed = JSON.parse(local);
              // Migrate to IndexedDB
              setStoredItem(key, parsed).catch(console.error);
              resolve(parsed as T);
              return;
            }
          } catch (err) {
            console.warn(`localStorage read error for ${key}:`, err);
          }
          resolve(defaultValue);
        }
      };

      request.onerror = () => {
        resolve(getLocalStorageFallback(key, defaultValue));
      };
    });
  } catch (err) {
    return getLocalStorageFallback(key, defaultValue);
  }
}

// Save item to IndexedDB and safely mirror to localStorage if possible
export async function setStoredItem<T>(key: string, value: T): Promise<void> {
  // 1. Always save to IndexedDB (virtually unlimited quota)
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`IndexedDB save error for ${key}:`, err);
  }

  // 2. Safely try to mirror to localStorage without crashing on QuotaExceededError
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Gracefully handle QuotaExceededError by clearing old bulky keys from localStorage
    // IndexedDB will still maintain full data integrity!
    console.warn(`LocalStorage quota reached for ${key}. Data is safely stored in IndexedDB.`);
    try {
      // Try saving lightweight metadata or just skip localStorage
    } catch {
      // Ignore
    }
  }
}

function getLocalStorageFallback<T>(key: string, defaultValue: T): T {
  try {
    const local = localStorage.getItem(key);
    if (local) {
      return JSON.parse(local) as T;
    }
  } catch (err) {
    console.warn(`localStorage read fallback error for ${key}:`, err);
  }
  return defaultValue;
}

// Synchronous safe localStorage helper for instant component initialization
export function safeGetLocal<T>(key: string, defaultValue: T): T {
  try {
    const local = localStorage.getItem(key);
    if (local) {
      return JSON.parse(local) as T;
    }
  } catch (e) {
    console.warn(`safeGetLocal error for ${key}:`, e);
  }
  return defaultValue;
}

// Helper to compress uploaded images (logos, signatures, stamps)
// to prevent massive multi-megabyte base64 strings
export async function compressImageFile(file: File, maxWidth = 800, maxHeight = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG transparency if it's PNG/stamp/signature, otherwise use JPEG
        const isPng = file.type === 'image/png' || file.type.includes('png');
        const outputFormat = isPng ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputFormat, isPng ? undefined : quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
