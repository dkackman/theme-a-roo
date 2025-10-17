import { STORAGE_KEYS } from '@/lib/constants';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'theme-o-rama';

export interface CollectionInfo {
  description: string;
  author: string;
  sponsor: string;
  twitterHandle: string;
  website: string;
  licenseUrl: string;
  collectionName: string;
}

const defaultCollectionInfo: CollectionInfo = {
  description: '',
  author: '',
  sponsor: '',
  twitterHandle: '',
  website: '',
  licenseUrl: '',
  collectionName: '',
};

export function useCollectionInfo() {
  const { currentTheme } = useTheme();
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo>(
    defaultCollectionInfo,
  );
  const isInitialMount = useRef(true);

  // Load saved collection info from localStorage on mount
  useEffect(() => {
    const savedInfo = localStorage.getItem(STORAGE_KEYS.NFT_COLLECTION_INFO);
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        setCollectionInfo(parsed);
      } catch (error) {
        console.error('Error parsing saved collection info:', error);
      }
    }
  }, []);

  // Set collectionName when theme changes (only if it's empty)
  useEffect(() => {
    if (currentTheme && !collectionInfo.collectionName) {
      setCollectionInfo((prev) => ({
        ...prev,
        collectionName: currentTheme.name,
      }));
    }
  }, [currentTheme, collectionInfo.collectionName]);

  // Save collection info to localStorage whenever it changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem(
      STORAGE_KEYS.NFT_COLLECTION_INFO,
      JSON.stringify(collectionInfo),
    );
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
