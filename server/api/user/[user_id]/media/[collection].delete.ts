
import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import { User } from "~~/server/models/User";
import authenticated from "~~/server/http/middleware/authenticated";

export default eventHandler({
    onRequest: [authenticated],
    handler: async (event) => {
        try {
            const idParam = getRouterParam(event, 'user_id')
            const collectionParam = getRouterParam(event, 'collection')
            const id = idParam ? Number(idParam) : NaN

            if (!idParam || Number.isNaN(id)) {
                return ApiResponse.error(400, 'Invalid user id')
            }

            if (!collectionParam) {
                return ApiResponse.error(400, 'Missing collection parameter')
            }

            // Check if user exists
            const targetUser: User | null = await User.find(id)
            if (!targetUser) {
                return ApiResponse.error(404, 'User not found')
            }

            // Authorization check
            const auth = await Auth.user(event)
            if (!auth?.can('update', targetUser)) {
                return ApiResponse.error(403, 'Forbidden')
            }

            // Validate field is configured
            const collection = User.mediaCollections().find(f => f.field === collectionParam)
            if (!collection) {
                return ApiResponse.error(400, `Invalid media collection: ${collectionParam}`)
            }

            // Check if media exists
            const existingMedia = User.getMediaPath(targetUser, collectionParam)
            if (!existingMedia) {
                return ApiResponse.error(404, 'No media found for this collection')
            }

            // Delete media
            await User.deleteMedia(id, collectionParam)

            // Get updated user
            const updatedUser = await User.find(id)

            return ApiResponse.success({
                user: updatedUser
            }, 'Media deleted successfully')

        } catch (e: any) {
            console.error('Failed to delete media:', e)
            return ApiResponse.error(500, e.message || 'Failed to delete media')
        }
    },
})