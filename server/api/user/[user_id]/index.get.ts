import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import authenticated from "~~/server/http/middleware/authenticated";
import { User } from "~~/server/models/User";

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
      if (!auth?.can('view', targetUser)) {
        return ApiResponse.error(403, 'Forbidden')
      }

      return ApiResponse.success(targetUser)
    } catch (e: any) {
      console.error('Failed to fetch user:', e)
      return ApiResponse.error(500, 'Failed to fetch user')
    }
  },
})