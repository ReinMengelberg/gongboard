import { z } from 'zod'
import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import { User } from "~~/server/models/User";

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  admin: z.boolean().optional().default(false),
})

export default eventHandler({
  onRequest: [admin],
  handler: async (event) => {
    const { name, email, password, admin: isAdmin } = await readValidatedBody(event, bodySchema.parse)

    try {
      const existingUser = await User.where({ email }).first()
      if (existingUser) {
        return ApiResponse.error(409, 'A user with the provided email already exists.')
      }

      const hashedPassword = await Hash.make(password)
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        admin: isAdmin ?? false,
      })

      return ApiResponse.success(user, 'User created', 201)
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('unique constraint')) {
        return ApiResponse.error(409, 'A user with the provided unique field already exists.')
      }
      return ApiResponse.error(400, 'Failed to create user')
    }
  },
})
