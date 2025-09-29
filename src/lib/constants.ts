// IndexedDB Configuration
export const IMAGE_STORAGE_KEYS = {
  BACKGROUND_IMAGE: 'background-image',
  NFT_ICON_IMAGE: 'nft-icon-image',
  NFT_BANNER_IMAGE: 'nft-banner-image',
} as const;

// Local Storage Keys (for non-image data)
export const STORAGE_KEYS = {
  // UI state
  ACTIONS_PANEL_MINIMIZED: 'theme-a-roo-actions-panel-minimized',
  SIDEBAR_COLLAPSED: 'theme-a-roo-sidebar-collapsed',

  // Image generation
  IMAGE_MODEL: 'theme-a-roo-image-model',
  DESIGN_PROMPT: 'theme-a-roo-design-prompt',

  // Pinata configuration (non-image)
  PINATA_GATEWAY: 'pinata-gateway',
  PINATA_GROUP_NAME: 'pinata-group-name',

  UPLOADED_URLS_KEY: 'uploaded-urls',
} as const;
