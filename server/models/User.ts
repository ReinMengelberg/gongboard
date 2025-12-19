import { Model } from "~~/server/models/BaseModel";
import { HasMedia } from "~~/server/traits/HasMedia";
import type { MediaCollection } from "~~/server/traits/HasMedia";
import type { User as PrismaUser } from "@prisma/client";
import bcrypt from 'bcryptjs';
import {Lost} from "~~/types/models/tracking/Lost";
import {Lead} from "~~/types/models/tracking/Lead";
import {Meeting} from "~~/types/models/tracking/Meeting";
import {Sale} from "~~/types/models/tracking/Sale";

const ModelWithTraits = HasMedia(Model);

export interface User {
    id: number;
    name: string;
    email: string;
    admin: boolean;
    avatar: string | string[];
    sound: string | string[];
    drop: number;
    verified_at: string;

    // Relations
    lost: Lost[];
    leads: Lead[];
    meetings: Meeting[];
    sales: Sale[];

    created_at: string;
    updated_at: string;
}

export class User extends ModelWithTraits {
    protected static modelName = "User";

    /**
     * Functions
     */


    public static async findByEmail(email: string): Promise<PrismaUser | null> {
        return await this.first<PrismaUser>({ email });
    }

    public static async withPosts() {
        return this.with({ posts: true });
    }

    /**
     * Relations
     */
    public async getLost() {
        return this.with({ lost: true }).first({ id: this.id });
    }

    public async getLeads() {
        return this.with({ leads: true }).first({ id: this.id });
    }

    public async getMeetings() {
        return this.with({ meetings: true }).first({ id: this.id });
    }

    public async getSales() {
        return this.with({ meetings: true }).first({ id: this.id });
    }


    /**
     * Media
     */
    static override mediaCollections(): MediaCollection[] {
        return [
            {
                field: 'avatar',
                accept: ['image/*'],
                maxSize: 10, // 10MB
                singleFile: true
            },
            {
                field: 'sound',
                accept: ['mp3'],
                maxSize: 10, // 10MB
                singleFile: false
            }
        ];
    }

    /**
     * Authentication Methods
     */
    // Authentication methods
    public static async authenticate(email: string, password: string): Promise<PrismaUser | null> {
        const user = await this.findByEmail(email);

        if (!user || !await bcrypt.compare(password, user.password)) {
            return null;
        }

        return user;
    }

    public static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    public static async verifyUser(userId: number): Promise<void> {
        await this.update(userId, { verified_at: new Date().toISOString() });
    }
}

/**
 * Authentication Registration
 */

declare module '#auth-utils' {
    interface User extends User {}

    interface UserSession {
        extendedAt: number
    }
}