export type IPFSProvider = 'pinata' | 'filebase';

export interface IPFSUploadResult {
    success: boolean;
    hash?: string;
    url?: string;
    error?: string;
}

export interface IPFSFile {
    name: string;
    content: string | File | Blob; // data URL, File object, or Blob
    type: string;
}

export interface IPFSUploadOptions {
    pinToIPFS?: boolean;
    metadata?: Record<string, unknown>;
}

export interface IPFSProviderConfig {
    apiKey: string;
    gatewayUrl?: string;
}

export interface IPFSProviderService {
    uploadFile(file: IPFSFile, options?: IPFSUploadOptions): Promise<IPFSUploadResult>;
    uploadFiles(files: IPFSFile[], options?: IPFSUploadOptions): Promise<IPFSUploadResult[]>;
}
