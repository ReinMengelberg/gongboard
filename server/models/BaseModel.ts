import {prisma} from '~~/server/db/prisma'

export abstract class Model {
    protected static modelName: string
    protected static hidden: string[] = []

    protected static getModel() {
        const modelName = this.modelName
        // @ts-ignore - Dynamic model access
        return prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)]
    }

    protected static removeHidden<T extends Record<string, any>>(data: T): Partial<T> {
        if (this.hidden.length === 0) return data;

        const result = { ...data };
        this.hidden.forEach(field => {
            delete result[field];
        });
        return result;
    }

    protected static removeHiddenFromArray<T extends Record<string, any>>(data: T[]): Partial<T>[] {
        return data.map(item => this.removeHidden(item));
    }

    public static query(): QueryBuilder {
        return new QueryBuilder(this.getModel(), this);
    }

    public static async create<T>(data: any): Promise<T> {
        const result = await this.getModel().create({data})
        return this.removeHidden(result) as T
    }

    public static async find<T>(id: number | string): Promise<T | null> {
        const result = await this.getModel().findUnique({where: {id}})
        return result ? this.removeHidden(result) as T : null
    }

    public static async findMany<T>(where?: any, include?: any): Promise<T[]> {
        const result = await this.getModel().findMany({where, include})
        return this.removeHiddenFromArray(result) as T[]
    }

    public static async update<T>(id: number | string, data: any): Promise<T> {
        const result = await this.getModel().update({where: {id}, data})
        return this.removeHidden(result) as T
    }

    public static async delete(id: number | string): Promise<void> {
        await this.getModel().delete({where: {id}})
    }

    public static async first<T>(where?: any): Promise<T | null> {
        const result = await this.getModel().findFirst({where})
        return result ? this.removeHidden(result) as T : null
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
    private modelClass: typeof Model;
    private whereClause: any = {};
    private orderByClause: any = undefined;
    private includeClause: any = undefined;

    constructor(model: any, modelClass: typeof Model) {
        this.model = model;
        this.modelClass = modelClass;
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
        const result = await this.model.findMany({
            where: this.whereClause,
            orderBy: this.orderByClause,
            include: this.includeClause
        });
        // @ts-ignore
        return this.modelClass.removeHiddenFromArray(result) as T[];
    }

    async first<T>(): Promise<T | null> {
        const result = await this.model.findFirst({
            where: this.whereClause,
            orderBy: this.orderByClause,
            include: this.includeClause
        });
        // @ts-ignore
        return result ? this.modelClass.removeHidden(result) as T : null;
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
            // @ts-ignore
            data: this.modelClass.removeHiddenFromArray(data) as T[],
            current_page: page,
            last_page,
            per_page: perPage,
            from,
            to,
            total
        };
    }
}