import {prisma} from '~~/server/db/prisma'
import type {PrismaClient} from '@prisma/client'

export abstract class Model {
    protected static modelName: string

    protected static getModel() {
        const modelName = this.modelName
        // @ts-ignore - Dynamic model access
        return prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)]
    }

    public static async create<T>(data: any): Promise<T> {
        return await this.getModel().create({data})
    }

    public static async find<T>(id: number | string): Promise<T | null> {
        return await this.getModel().findUnique({where: {id}})
    }

    public static async findMany<T>(where?: any, include?: any): Promise<T[]> {
        return await this.getModel().findMany({where, include})
    }

    public static async update<T>(id: number | string, data: any): Promise<T> {
        return await this.getModel().update({where: {id}, data})
    }

    public static async delete(id: number | string): Promise<void> {
        await this.getModel().delete({where: {id}})
    }

    public static async first<T>(where?: any): Promise<T | null> {
        return await this.getModel().findFirst({where})
    }

    public static where(conditions: any) {
        const model = this.getModel();
        return {
            findMany: (options?: any) => model.findMany({where: conditions, ...options}),
            first: () => model.findFirst({where: conditions}),
            orderBy: (order: any) => ({
                findMany: (options?: any) => model.findMany({where: conditions, orderBy: order, ...options}),
                first: () => model.findFirst({where: conditions, orderBy: order})
            }),
            limit: (limit: number) => ({
                findMany: (options?: any) => model.findMany({where: conditions, take: limit, ...options})
            })
        };
    }

    public static with(relations: any) {
        return {
            findMany: (where?: any) => this.getModel().findMany({where, include: relations}),
            first: (where?: any) => this.getModel().findFirst({where, include: relations})
        }
    }
}