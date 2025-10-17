import { STORAGE_KEYS } from '@/lib/constants';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface UploadedUrl {
  url: string;
  fileType: 'icon' | 'banner' | 'background';
}

export interface UploadedUrlsContextType {
  uploadedUrls: UploadedUrl[];
  setUploadedUrls: (urls: UploadedUrl[]) => void;
  clearUploadedUrls: () => void;
}

export const UploadedUrlsContext = createContext<
  UploadedUrlsContextType | undefined
>(undefined);

export function UploadedUrlsProvider({ children }: { children: ReactNode }) {
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

  const clearUploadedUrls = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.UPLOADED_URLS_KEY);
      setUploadedUrls([]);
    } catch (error) {
      console.error('Error clearing uploaded URLs from localStorage:', error);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ uploadedUrls, setUploadedUrls, clearUploadedUrls }),
    [uploadedUrls, clearUploadedUrls],
  );

  return (
    <UploadedUrlsContext.Provider value={contextValue}>
      {children}
    </UploadedUrlsContext.Provider>
  );
}

export function useUploadedUrls() {
  const context = useContext(UploadedUrlsContext);
  if (context === undefined) {
    throw new Error(
      'useUploadedUrls must be used within an UploadedUrlsProvider',
    );
  }
  return context;
}
