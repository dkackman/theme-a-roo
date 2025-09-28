import { useEffect, useState } from 'react';

export interface UploadedUrl {
  url: string;
  fileType: 'icon' | 'banner' | 'background';
}

export function useUploadedUrls() {
  const [uploadedUrls, setUploadedUrls] = useState<UploadedUrl[]>([]);

  // Load saved uploaded URLs from localStorage on mount
  useEffect(() => {
    const savedUrls = localStorage.getItem('uploaded-urls');
    if (savedUrls) {
      try {
        const parsed = JSON.parse(savedUrls);
        setUploadedUrls(parsed);
      } catch (error) {
        console.error('Error parsing saved uploaded URLs:', error);
      }
    }
  }, []);

  // Save uploaded URLs to localStorage whenever they change
  useEffect(() => {
    if (uploadedUrls.length > 0) {
      localStorage.setItem('uploaded-urls', JSON.stringify(uploadedUrls));
    } else {
      localStorage.removeItem('uploaded-urls');
    }
  }, [uploadedUrls]);

  const clearUploadedUrls = () => {
    setUploadedUrls([]);
    localStorage.removeItem('uploaded-urls');
  };

  return {
    uploadedUrls,
    setUploadedUrls,
    clearUploadedUrls,
  };
}
