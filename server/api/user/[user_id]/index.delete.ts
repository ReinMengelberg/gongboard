import { z } from 'zod'
import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import { User } from "~~/server/models/User";
import { Auth } from "~~/server/utils/Auth";
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

        // Get authenticated user
        const auth = await Auth.user(event)
        if (!auth) {
            return ApiResponse.error(401, 'Unauthorized')
        }

        // Read and validate password
        const { password } = await readValidatedBody(event, bodySchema.parse)

        // Verify password against the authenticated user
        const isValidPassword = await Auth.validatePassword(password)
        if (!isValidPassword) {
            return ApiResponse.error(401, 'Invalid password')
        }

        // Authorization: admin can delete any; non-admin only self
        if (!auth.isAdmin() && !(auth.id === id)) {
            return ApiResponse.error(403, 'Forbidden')
        }

        // Check if user to delete exists
        const userToDelete = await User.find(id)
        if (!userToDelete) {
            return ApiResponse.error(404, 'User not found')
        }

        // Delete user
        await User.delete(id)

        return ApiResponse.success(null, 'User deleted', 200)
    },
})