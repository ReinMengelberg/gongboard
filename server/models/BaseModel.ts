import {prisma} from '~~/server/db/prisma'

export abstract class Model {
    protected static modelName: string

    protected static getModel() {
        const modelName = this.modelName
        // @ts-ignore - Dynamic model access
        return prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)]
    }

    public static query(): QueryBuilder {
        return new QueryBuilder(this.getModel());
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

    public static async count(where?: any): Promise<number> {
        return await this.getModel().count({where})
    }

    public static where(conditions: any): QueryBuilder {
        return this.query().where(conditions);
    }

    public static with(relations: any): QueryBuilder {
        return this.query().with(relations);
    }

    public static orderBy(order: any): QueryBuilder {
        return this.query().orderBy(order);
    }
}

class QueryBuilder {
    private model: any;
    private whereClause: any = {};
    private orderByClause: any = undefined;
    private includeClause: any = undefined;

    constructor(model: any) {
        this.model = model;
    }

    where(conditions: any) {
        this.whereClause = { ...this.whereClause, ...conditions };
        return this;
    }

    orWhere(conditions: any) {
        if (!this.whereClause.OR) {
            this.whereClause.OR = [];
        }
        this.whereClause.OR.push(conditions);
        return this;
    }

    orderBy(order: any) {
        this.orderByClause = order;
        return this;
    }

    with(relations: any) {
        this.includeClause = relations;
        return this;
    }

    async get<T>(): Promise<T[]> {
        return await this.model.findMany({
            where: this.whereClause,
            orderBy: this.orderByClause,
            include: this.includeClause
        });
    }

    async first<T>(): Promise<T | null> {
        return await this.model.findFirst({
            where: this.whereClause,
            orderBy: this.orderByClause,
            include: this.includeClause
        });
    }

    async count(): Promise<number> {
        return await this.model.count({ where: this.whereClause });
    }

    async paginate<T>(options: {
        page?: number,
        perPage?: number
    } = {}): Promise<{
        data: T[],
        current_page: number,
        last_page: number,
        per_page: number,
        total: number,
        from: number | null,
        to: number | null
    }> {
        const page = Math.max(options.page || 1, 1);
        const perPage = Math.min(Math.max(options.perPage || 25, 1), 100);
        const skip = (page - 1) * perPage;

        const [data, total] = await Promise.all([
            this.model.findMany({
                where: this.whereClause,
                orderBy: this.orderByClause,
                include: this.includeClause,
                skip,
                take: perPage
            }),
            this.count()
        ]);

        const last_page = Math.max(1, Math.ceil(total / perPage));
        const from = total === 0 ? null : skip + 1;
        const to = total === 0 ? null : Math.min(skip + data.length, total);

        return {
            data,
            current_page: page,
            last_page,
            per_page: perPage,
            from,
            to,
            total
        };
    }
}