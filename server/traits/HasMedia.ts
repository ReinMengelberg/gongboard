export interface MediaCollection {
    field: string;
    accept: string[];
    maxSize: number;
    singleFile?: boolean; // If true, only one file allowed
}

// Simplified mixin approach that works with abstract classes
export function HasMedia<T extends abstract new (...args: any[]) => any>(Base: T) {
    abstract class MediaMixin extends Base {
        // Override this in your model to define media fields
        static mediaCollections(): MediaCollection[] {
            return [];
        }

        // Get the model name for storage paths
        static getModelName(): string {
            return this.name.toLowerCase();
        }

        static getMediaUrls(record: any, field: string): string[] {
            const collection = this.mediaCollections().find(f => f.field === field);
            if (!collection) {
                throw new Error(`Media collection '${field}' not configured`);
            }

            const value = record[field];
            if (!value) return [];

            // Handle both string arrays and single strings (legacy support)
            return Array.isArray(value) ? value : [value];
        }

        static getMediaUrl(record: any, field: string): string | null {
            const urls = this.getMediaUrls(record, field);
            return urls.length > 0 ? urls[0] : null;
        }

        static getStorageKey(id: number | string, field: string, filename: string): string {
            const modelName = this.getModelName();
            return `media/${modelName}/${id}/${field}/${filename}`;
        }

        static async saveMedia(
            id: number | string,
            field: string,
            fileBuffer: Buffer,
            filename: string
        ): Promise<string> {
            const collection = this.mediaCollections().find(f => f.field === field);
            if (!collection) {
                throw new Error(`Media collection '${field}' not configured`);
            }

            // @ts-ignore - static methods from BaseModel
            const record = await this.find(id);
            if (!record) {
                throw new Error(`Record with id ${id} not found`);
            }

            // Generate unique filename
            const timestamp = Date.now();
            const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '';
            const basename = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
            const uniqueFilename = `${basename}-${timestamp}${ext}`;

            const storageKey = this.getStorageKey(id, field, uniqueFilename);

            // Save to storage
            const storage = useStorage('assets');
            await storage.setItemRaw(storageKey, fileBuffer);

            const relativePath = `/${storageKey}`;

            // Get existing media
            const existingMedia = this.getMediaUrls(record, field);

            let updatedMedia: string[];
            if (collection.singleFile) {
                // If single file, delete the old one and replace
                if (existingMedia.length > 0) {
                    await this.deleteMediaFile(existingMedia[0]);
                }
                updatedMedia = [relativePath];
            } else {
                // Add to collection
                updatedMedia = [...existingMedia, relativePath];
            }

            // Update database
            // @ts-ignore - static methods from BaseModel
            await this.update(id, { [field]: updatedMedia });

            return relativePath;
        }

        static async deleteMediaFile(mediaPath: string): Promise<void> {
            const storageKey = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
            const storage = useStorage('assets');

            try {
                await storage.removeItem(storageKey);
            } catch (error) {
                console.warn(`Failed to delete file: ${storageKey}`, error);
            }
        }

        static async deleteMedia(id: number | string, field: string, mediaPath?: string): Promise<void> {
            // @ts-ignore - static methods from BaseModel
            const record = await this.find(id);
            if (!record) {
                throw new Error(`Record with id ${id} not found`);
            }

            const collection = this.mediaCollections().find(f => f.field === field);
            if (!collection) {
                throw new Error(`Media collection '${field}' not configured`);
            }

            const existingMedia = this.getMediaUrls(record, field);

            if (mediaPath) {
                // Delete specific file from collection
                await this.deleteMediaFile(mediaPath);

                const updatedMedia = existingMedia.filter(path => path !== mediaPath);

                // @ts-ignore - static methods from BaseModel
                await this.update(id, { [field]: updatedMedia });
            } else {
                // Delete all files in collection
                for (const path of existingMedia) {
                    await this.deleteMediaFile(path);
                }

                // Clear database field
                // @ts-ignore - static methods from BaseModel
                await this.update(id, { [field]: [] });
            }
        }

        static async replaceMedia(
            id: number | string,
            field: string,
            fileBuffer: Buffer,
            filename: string
        ): Promise<string> {
            // Delete all media in field first
            await this.deleteMedia(id, field);
            // Save new media
            return await this.saveMedia(id, field, fileBuffer, filename);
        }

        static async getMediaBuffer(mediaPath: string): Promise<Buffer | null> {
            if (!mediaPath) {
                return null;
            }

            const storageKey = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
            const storage = useStorage('assets');

            try {
                const data = await storage.getItemRaw(storageKey);
                return data as Buffer;
            } catch (error) {
                console.warn(`Failed to get file: ${storageKey}`, error);
                return null;
            }
        }
    }

    return MediaMixin;
}