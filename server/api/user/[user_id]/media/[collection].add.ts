import { z } from 'zod'
import { ApiResponse } from '~~/server/utils/ApiResponse'
import authenticated from '~~/server/utils/middleware/authenticated'
import { saveUploadedFile, validateFileType, allowedAudioTypes, allowedImageTypes } from '~~/server/utils/FileUpload'

const allowedCollections = ['avatar', 'music'] as const
type Collection = typeof allowedCollections[number]

const collectionConfig = {
    avatar: {
        allowedTypes: allowedImageTypes,
        errorMessage: 'Invalid avatar file type. Allowed: JPEG, PNG, WebP, GIF',
        maxSize: 5 * 1024 * 1024, // 5MB
    },
    music: {
        allowedTypes: allowedAudioTypes,
        errorMessage: 'Invalid music file type. Allowed: MP3, WAV, OGG',
        maxSize: 50 * 1024 * 1024, // 50MB
    },
} as const

export default eventHandler({
    onRequest: [authenticated],
    handler: async (event) => {
        const collection = getRouterParam(event, 'collection') as Collection

        // Validate collection
        if (!collection || !allowedCollections.includes(collection)) {
            return ApiResponse.error(400, `Invalid collection. Allowed: ${allowedCollections.join(', ')}`)
        }

        const config = collectionConfig[collection]
        const form = await readMultipartFormData(event)

        if (!form) {
            return ApiResponse.error(400, 'No file provided')
        }

        // Get the file from form data
        const file = form.find(item => item.name === 'file')

        if (!file) {
            return ApiResponse.error(400, 'No file field found in form data')
        }

        // Validate file type
        if (!validateFileType(file, config.allowedTypes)) {
            return ApiResponse.error(400, config.errorMessage)
        }

        // Validate file size
        if (file.data.length > config.maxSize) {
            return ApiResponse.error(400, `File too large. Max size: ${config.maxSize / 1024 / 1024}MB`)
        }

        try {
            // Save the file
            const uploadedFile = await saveUploadedFile(
                file,
                collection === 'avatar' ? 'avatars' : 'music'
            )

            return ApiResponse.success({
                path: uploadedFile.path,
                filename: uploadedFile.filename,
                size: uploadedFile.size,
                mimetype: uploadedFile.mimetype,
                collection,
            }, `${collection} uploaded successfully`, 201)
        } catch (e: any) {
            console.error('Upload error:', e)
            return ApiResponse.error(500, `Failed to upload ${collection}`)
        }
    },
})

export type MediaUploadResponse = {
    path: string
    filename: string
    size: number
    mimetype: string
    collection: Collection
}