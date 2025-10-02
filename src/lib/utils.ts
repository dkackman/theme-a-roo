import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function dbg<T>(value: T): T {
  console.log(value);
  return value;
}

export function makeValidFileName(filename: string): string {
  const validFilename = filename
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (validFilename.length === 0) {
    return 'my-custom-theme';
  }
  return validFilename;
}

export function formatTimestamp(
  timestamp: number | null,
  dateStyle = 'medium',
  timeStyle: string = dateStyle,
): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000); // Convert from Unix timestamp to JavaScript timestamp
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: dateStyle as 'full' | 'long' | 'medium' | 'short',
    timeStyle: timeStyle as 'full' | 'long' | 'medium' | 'short',
  }).format(date);
}

export function isValidUrl(str: string) {
  try {
    // only allow http(s) schemes, not file, ftp, wss etc
    const trimmed = str.trimStart().toLowerCase();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(str);
      // since this is used for nft links, we don't want to allow localhost,
      // or 127.0.0.1 to prevent links to local resources
      return (
        url.hostname.toLowerCase() !== 'localhost' &&
        url.hostname !== '127.0.0.1'
      );
    }
  } catch {
    return false;
  }
}

export function isTauriEnvironment() {
  return (
    typeof window !== 'undefined' &&
    (!!(window as unknown as { __TAURI__: boolean }).__TAURI__ ||
      !!(window as unknown as { __TAURI_INTERNALS__: boolean })
        .__TAURI_INTERNALS__ ||
      typeof (window as unknown as { __TAURI_PLUGIN_INTERNALS__: boolean })
        .__TAURI_PLUGIN_INTERNALS__ !== 'undefined' ||
      typeof (window as unknown as { __TAURI_METADATA__: boolean })
        .__TAURI_METADATA__ !== 'undefined')
  );
}

// Helper function to detect MIME type from blob data
export function detectMimeTypeFromBlob(blob: Blob): string {
  // If blob already has a type, use it
  if (blob.type && blob.type !== 'application/octet-stream') {
    return blob.type;
  }

  // Default to PNG if we can't detect the type
  return 'image/png';
}

// Helper function to get file extension from MIME type
export function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/ico': 'ico',
    'application/json': 'json',
  };

  return mimeToExt[mimeType] || 'png';
}

// Helper function to save data URI image to file
export function saveDataUriAsFile(
  dataUri: string,
  filename = 'image.png',
): void {
  try {
    // Extract the base64 data from the data URI
    const base64Data = dataUri.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid data URI format');
    }

    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Determine MIME type from data URI
    const mimeType = dataUri.split(',')[0].split(':')[1].split(';')[0];
    const blob = new Blob([byteArray], { type: mimeType });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error('Failed to save image');
  }
}

// Helper function to save image from URL by extracting data from img element
export function saveImageAsFile(
  imageUrl: string,
  filename = 'image.png',
): void {
  try {
    // Create a new image element to load the image
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for cross-origin images

    img.onload = () => {
      try {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Set canvas dimensions to match the image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Failed to convert canvas to blob');
          }

          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/png'); // Default to PNG format
      } catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Failed to process image');
      }
    };

    img.onerror = () => {
      throw new Error('Failed to load image');
    };

    // Start loading the image
    img.src = imageUrl;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error('Failed to save image');
  }
}
