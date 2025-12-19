import { z } from 'zod'
import { ApiResponse } from '~~/server/utils/ApiResponse'
import authenticated from '~~/server/utils/middleware/authenticated'
import { unlink } from 'fs/promises'
import { join } from 'path'
import prisma from "~~/server/db/prisma";

const allowedCollections = ['avatar', 'music'] as const
const allowedModels = ['user', 'song'] as const

type Collection = typeof allowedCollections[number]
type Model = typeof allowedModels[number]

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

        try {
            // Get the record to find the file path
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

            const filePath = record[collection]

            if (!filePath) {
                return ApiResponse.error(404, `No ${collection} file found for this ${model}`)
            }

            // Security: Ensure the path matches expected pattern
            const expectedPrefix = `/uploads/${model}/${modelId}/${collection}/`
            if (!filePath.startsWith(expectedPrefix)) {
                return ApiResponse.error(400, `Invalid file path for ${model} ${collection}`)
            }

            // Delete the file from disk
            const fullPath = join(process.cwd(), 'public', filePath)
            await unlink(fullPath)

            // Update the database to remove the file path
            let updatedRecord: any
            if (model === 'user') {
                updatedRecord = await prisma.user.update({
                    where: { id: modelId },
                    data: { [collection]: null },
                })
            } else if (model === 'song') {
                updatedRecord = await prisma.song.update({
                    where: { id: modelId },
                    data: { [collection]: null },
                })
            }

            return ApiResponse.success({
                path: filePath,
                collection,
                model,
                modelId,
                record: updatedRecord,
            }, `${collection} deleted successfully`)
        } catch (e: any) {
            console.error('Delete error:', e)

            if (e.code === 'ENOENT') {
                return ApiResponse.error(404, 'File not found on disk')
            }

            return ApiResponse.error(500, `Failed to delete ${collection}`)
        }
    },
})