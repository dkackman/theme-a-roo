import { FilebaseService } from './filebaseService';
import { PinataService } from './pinataService';
import { IPFSFile, IPFSProvider, IPFSProviderConfig, IPFSProviderService, IPFSUploadOptions, IPFSUploadResult } from './types';

export class IPFSManager {
    private provider: IPFSProvider;
    private service: IPFSProviderService;
    private config: IPFSProviderConfig;

    constructor(provider: IPFSProvider, config: IPFSProviderConfig) {
        this.provider = provider;
        this.config = config;
        this.service = this.createService();
    }

    private createService(): IPFSProviderService {
        switch (this.provider) {
            case 'pinata':
                return new PinataService(this.config);
            case 'filebase':
                return new FilebaseService(this.config);
            default:
                throw new Error(`Unsupported IPFS provider: ${this.provider}`);
        }
    }

    async uploadFile(file: IPFSFile, options?: IPFSUploadOptions): Promise<IPFSUploadResult> {
        if (!this.config.apiKey) {
            return {
                success: false,
                error: 'API key is required',
            };
        }

        return this.service.uploadFile(file, options);
    }

    async uploadFiles(files: IPFSFile[], options?: IPFSUploadOptions): Promise<IPFSUploadResult[]> {
        if (!this.config.apiKey) {
            return files.map(() => ({
                success: false,
                error: 'API key is required',
            }));
        }

        return this.service.uploadFiles(files, options);
    }

    getProvider(): IPFSProvider {
        return this.provider;
    }

    getGatewayUrl(): string {
        switch (this.provider) {
            case 'pinata':
                return this.config.gatewayUrl || 'https://gateway.pinata.cloud/ipfs/';
            case 'filebase':
                return this.config.gatewayUrl || 'https://gateway.filebase.io/ipfs/';
            default:
                return '';
        }
    }

    // Helper method to create IPFSFile from data URL
    static createFileFromDataUrl(dataUrl: string, name: string, type: string): IPFSFile {
        return {
            name,
            content: dataUrl,
            type,
        };
    }

    // Helper method to create IPFSFile from File object
    static createFileFromFile(file: File): IPFSFile {
        return {
            name: file.name,
            content: file,
            type: file.type,
        };
    }

    // Helper method to create IPFSFile from Blob
    static createFileFromBlob(blob: Blob, name: string, type: string): IPFSFile {
        return {
            name,
            content: blob,
            type,
        };
    }
}
