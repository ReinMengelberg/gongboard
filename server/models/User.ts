import { BaseModel } from "~~/server/models/BaseModel";
import type { User as PrismaUser } from "@prisma/client";

export class User extends BaseModel {
    protected static modelName = "User";

    // Example of model-specific methods
    public static async findByEmail(email: string): Promise<PrismaUser | null> {
        return await this.first<PrismaUser>({ email });
    }

    public static async withPosts() {
        return this.with({ posts: true });
    }
}