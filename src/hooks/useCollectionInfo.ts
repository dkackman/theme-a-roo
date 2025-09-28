import { makeValidFileName } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useTheme } from 'theme-o-rama';

export interface CollectionInfo {
  description: string;
  author: string;
  sponsor: string;
  twitterHandle: string;
  website: string;
  licenseUrl: string;
  baseName: string;
}

const defaultCollectionInfo: CollectionInfo = {
  description: '',
  author: '',
  sponsor: '',
  twitterHandle: '',
  website: '',
  licenseUrl: '',
  baseName: '',
};

export function useCollectionInfo() {
  const { currentTheme } = useTheme();
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo>(
    defaultCollectionInfo,
  );

  // Load saved collection info from localStorage on mount
  useEffect(() => {
    const savedInfo = localStorage.getItem('nft-collection-info');
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        setCollectionInfo(parsed);
      } catch (error) {
        console.error('Error parsing saved collection info:', error);
      }
    }
  }, []);

  // Update baseName when theme changes
  useEffect(() => {
    if (currentTheme) {
      setCollectionInfo((prev) => ({
        ...prev,
        baseName: makeValidFileName(currentTheme.displayName),
      }));
    }
  }, [currentTheme]);

  // Save collection info to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nft-collection-info', JSON.stringify(collectionInfo));
  }, [collectionInfo]);

  const updateCollectionInfo = (updates: Partial<CollectionInfo>) => {
    setCollectionInfo((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  return {
    collectionInfo,
    updateCollectionInfo,
    setCollectionInfo,
  };
}
