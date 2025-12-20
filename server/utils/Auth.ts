import type { H3Event } from 'h3'
import { User } from '~~/server/models/User'
import type {User as PrismaUser} from "@prisma/client";
import bcrypt from "bcryptjs";

export class Auth {

    static async challenge(email: string, password: string): Promise<PrismaUser | null> {
        const user = await User.makeVisible('password').where({ email }).first() as (PrismaUser & { password: string }) | null;
        if (!user || !user.password || !await bcrypt.compare(password, user.password)) {
            return null;
        }
        return user;
    }

    /**
     * Get the authenticated user from the session
     */
    static async user(event: H3Event): Promise<User | null> {
        const session = await getUserSession(event)
        const sessionUser = session?.user as { id: number } | undefined
        if (!sessionUser?.id) {
            return null
        }
        return await User.find<User>(sessionUser.id)
    }

    /**
     * Validate a password against the authenticated users hashed password'
     */
    static async validatePassword(password: string): Promise<boolean> {
        const session = await getUserSession(event)
        const sessionUser = session?.user as { id: number } | undefined
        const user = await User.makeVisible('password').where({ id: sessionUser?.id }).first() as (PrismaUser & { password: string }) | null;
        if (!user || !user.password) {
            return false;
        }
        return await Hash.compare(password, userWithPassword.password);
    }

    /**
     * Check if the user is authenticated
     */
    static async check(event: H3Event): Promise<boolean> {
        const user = await this.user(event)
        return user !== null
    }
}