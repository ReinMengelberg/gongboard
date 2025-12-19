import { z } from 'zod'
import { ApiResponse } from '~~/server/utils/ApiResponse'
import authenticated from '~~/server/utils/middleware/authenticated'
import { saveUploadedFile, validateFileType, allowedAudioTypes, allowedImageTypes } from '~~/server/utils/FileUpload'

const allowedCollections = ['avatar', 'song'] as const
const allowedModels = ['user'] as const

type Collection = typeof allowedCollections[number]
type Model = typeof allowedModels[number]

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
        const model = getRouterParam(event, 'model') as Model
        const modelIdParam = getRouterParam(event, 'model_id')
        const collection = getRouterParam(event, 'collection') as Collection

        // Validate model
        if (!model || !allowedModels.includes(model)) {
            return ApiResponse.error(400, `Invalid model. Allowed: ${allowedModels.join(', ')}`)
        }

        // Validate model_id
        const modelId = Number(modelIdParam)
        if (!modelIdParam || isNaN(modelId)) {
            return ApiResponse.error(400, 'Invalid model ID')
        }

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
            // Check if the record exists
            let record: any
            if (model === 'user') {
                record = await prisma.user.findUnique({ where: { id: modelId } })
            } else if (model === 'song') {
                record = await prisma.song.findUnique({ where: { id: modelId } })
            }

            if (!record) {
                return ApiResponse.error(404, `${model} not found`)
            }

            // Authorization check
            const session = await getUserSession(event)
            const actor = session?.user as { id: number; admin?: boolean } | undefined

            if (!actor?.id) {
                return ApiResponse.error(401, 'Unauthorized')
            }

            const isAdmin = !!actor.admin
            const isSelf = model === 'user' && actor.id === modelId

            if (!isAdmin && !isSelf) {
                return ApiResponse.error(403, 'Forbidden')
            }

            // Save the file
            const uploadedFile = await saveUploadedFile(file, model, modelId, collection)

            // Update the database with the new file path
            let updatedRecord: any
            if (model === 'user') {
                updatedRecord = await prisma.user.update({
                    where: { id: modelId },
                    data: { [collection]: uploadedFile.path },
                })
            } else if (model === 'song') {
                updatedRecord = await prisma.song.update({
                    where: { id: modelId },
                    data: { [collection]: uploadedFile.path },
                })
            }

            return ApiResponse.success({
                path: uploadedFile.path,
                filename: uploadedFile.filename,
                size: uploadedFile.size,
                mimetype: uploadedFile.mimetype,
                collection,
                model,
                modelId,
                record: updatedRecord,
            }, `${collection} uploaded and saved successfully`, 201)
        } catch (e: any) {
            console.error('Upload error:', e)
            return ApiResponse.error(500, `Failed to upload ${collection}`)
        }
    },
})