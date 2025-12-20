import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import admin from "~~/server/http/middleware/admin";
import { User } from "~~/server/models/User";

export default eventHandler({
  onRequest: [admin],
  handler: async (event) => {
    const idParam = getRouterParam(event, 'user_id')
    const id = idParam ? Number(idParam) : NaN

    if (!idParam || Number.isNaN(id)) {
      return ApiResponse.error(400, 'Invalid user id')
    }

    // Find user using Laravel-style method
    const user = await User.find(id)
    if (!user) {
      return ApiResponse.error(404, 'User not found')
    }

    return ApiResponse.success(user)
  },
})