import { z } from 'zod'
import { ApiResponse } from "~~/server/http/ApiResponse";
import { User } from "~~/server/models/User";
import bcrypt from 'bcryptjs'
import authenticated from "~~/server/http/middleware/authenticated";

const bodySchema = z.object({
    password: z.string(),
})

export default eventHandler({
    onRequest: [authenticated],
    handler: async (event) => {
        const idParam = getRouterParam(event, 'user_id')
        const id = idParam ? Number(idParam) : NaN

        if (!idParam || Number.isNaN(id)) {
            return ApiResponse.error(400, 'Invalid user id')
        }

        // Auth: must be logged in
        const session = await getUserSession(event)
        const actor = session?.user as { id: number; admin?: boolean } | undefined
        if (!actor?.id) {
            return ApiResponse.error(401, 'Unauthorized')
        }

        // Read and validate password
        const { password } = await readValidatedBody(event, bodySchema.parse)

        // Verify password against the authenticated user (actor)
        const actorRecord = await User.find(actor.id)
        if (!actorRecord) {
            return ApiResponse.error(401, 'Unauthorized')
        }
        const okPw = await bcrypt.compare(password, (actorRecord as any).password)
        if (!okPw) {
            return ApiResponse.error(401, 'Invalid password')
        }

        // Authorization: admin can delete any; non-admin only self
        const isAdmin = !!actor.admin
        const isSelf = actor.id === id
        if (!isAdmin && !isSelf) {
            return ApiResponse.error(403, 'Forbidden')
        }

        // Check if user to delete exists
        const userToDelete = await User.find(id)
        if (!userToDelete) {
            return ApiResponse.error(404, 'User not found')
        }

        // Delete user using Laravel-style method
        await User.delete(id)

        return ApiResponse.success(null, 'User deleted', 200)
    },
})

