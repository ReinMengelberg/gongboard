import { z } from 'zod'
import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import { User } from "~~/server/models/User";
import authenticated from "~~/server/http/middleware/authenticated";

const bodySchema = z.object({
    password: z.string(),
})

export default eventHandler({
    onRequest: [authenticated],
    handler: async (event) => {
        try {
            const idParam = getRouterParam(event, 'user_id')
            const id = idParam ? Number(idParam) : NaN

            if (!idParam || Number.isNaN(id)) {
                return ApiResponse.error(400, 'Invalid user id')
            }

            // Check if user exists
            const targetUser = await User.find(id)
            if (!targetUser) {
                return ApiResponse.error(404, 'User not found')
            }

            // Authorization check
            const auth = await Auth.user(event)
            if (!auth?.can('delete', targetUser)) {
                return ApiResponse.error(403, 'Forbidden')
            }

            // Validation
            const { password } = await readValidatedBody(event, bodySchema.parse)

            // Verify password against the authenticated user
            const isValidPassword = await Auth.validatePassword(event, password)
            if (!isValidPassword) {
                return ApiResponse.error(401, 'Invalid password')
            }

            // Delete user
            await User.delete(id)

            return ApiResponse.success(null, 'User deleted', 200)
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                return ApiResponse.error(422, 'Validation failed', e.errors);
            }
            console.error('Failed to delete user:', e)
            return ApiResponse.error(500, 'Failed to delete user')
        }
    },
})