import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import authenticated from "~~/server/http/middleware/authenticated"

export default eventHandler({
    onRequest: [authenticated],
    handler: async (event) => {
        await clearUserSession(event)
        return ApiResponse.success('Logged out successfully')
    },
})
