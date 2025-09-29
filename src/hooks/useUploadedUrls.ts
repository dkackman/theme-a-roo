import { STORAGE_KEYS } from '@/lib/constants';
import { useEffect, useState } from 'react';
export interface UploadedUrl {
  url: string;
  fileType: 'icon' | 'banner' | 'background';
}

export function useUploadedUrls() {
  const [uploadedUrls, setUploadedUrls] = useState<UploadedUrl[]>([]);

  // Load saved uploaded URLs from localStorage on mount
  useEffect(() => {
    const loadUploadedUrls = () => {
      try {
        const storedUrls = localStorage.getItem(STORAGE_KEYS.UPLOADED_URLS_KEY);
        if (storedUrls) {
          const parsedUrls: UploadedUrl[] = JSON.parse(storedUrls);
          setUploadedUrls(parsedUrls);
        }
      } catch (error) {
        console.error('Error loading uploaded URLs from localStorage:', error);
      }
    };

    loadUploadedUrls();
  }, []);

  // Save uploaded URLs to localStorage whenever they change
  useEffect(() => {
    const saveUploadedUrls = () => {
      try {
        localStorage.setItem(
          STORAGE_KEYS.UPLOADED_URLS_KEY,
          JSON.stringify(uploadedUrls),
        );
      } catch (error) {
        console.error('Error saving uploaded URLs to localStorage:', error);
      }
    };

    saveUploadedUrls();
  }, [uploadedUrls]);

  const clearUploadedUrls = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.UPLOADED_URLS_KEY);
      setUploadedUrls([]);
    } catch (error) {
      console.error('Error clearing uploaded URLs from localStorage:', error);
    }
  };

  return {
    uploadedUrls,
    setUploadedUrls,
    clearUploadedUrls,
  };
}
