import {prisma} from '~~/server/db/prisma'

export abstract class Model {
    protected static modelName: string
    protected static fillable: string[] = []
    protected static hidden: string[] = []
    private static visibleFields: string[] = []

    protected static getModel() {
        const modelName = this.modelName
        // @ts-ignore - Dynamic model access
        return prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)]
    }

    /**
     * Filter data to only include fillable fields
     */
    protected static filterFillable<T extends Record<string, any>>(data: T): Partial<T> {
        if (this.fillable.length === 0) {
            return data;
        }
        const result: Partial<T> = {};
        this.fillable.forEach(field => {
            if (field in data) {
                result[field as keyof T] = data[field];
            }
        });
        return result;
    }

    /**
     * Remove hidden fields from data
     */
    protected static removeHidden<T extends Record<string, any>>(data: T): Partial<T> {
        if (this.hidden.length === 0) return data;

        // Check if there are fields that should be made visible
        const fieldsToHide = this.visibleFields.length > 0
            ? this.hidden.filter(field => !this.visibleFields.includes(field))
            : this.hidden;

        if (fieldsToHide.length === 0) return data;

        const result = { ...data };
        fieldsToHide.forEach(field => {
            delete result[field];
        });
        return result;
    }

    protected static removeHiddenFromArray<T extends Record<string, any>>(data: T[]): Partial<T>[] {
        return data.map(item => this.removeHidden(item));
    }

    private static resetVisible() {
        this.visibleFields = [];
    }

    public static makeVisible(fields: string | string[]): typeof Model {
        this.visibleFields = Array.isArray(fields) ? fields : [fields];
        return this;
    }

    public static query(): QueryBuilder {
        return new QueryBuilder(this.getModel(), this);
    }

    /**
     * Create a new record with mass assignment protection
     */
    public static async create<T>(data: any): Promise<T> {
        const filteredData = this.filterFillable(data);
        const result = await this.getModel().create({data: filteredData})
        const processed = this.removeHidden(result) as T;
        this.resetVisible();
        return processed;
    }

    /**
     * Create a new record without mass assignment protection
     */
    public static async forceCreate<T>(data: any): Promise<T> {
        const result = await this.getModel().create({data})
        const processed = this.removeHidden(result) as T;
        this.resetVisible();
        return processed;
    }

    /**
     * Fill the model with data (returns filtered data, doesn't save)
     */
    public static fill<T extends Record<string, any>>(data: T): Partial<T> {
        return this.filterFillable(data);
    }

    public static async find<T>(id: number | string): Promise<T | null> {
        const result = await this.getModel().findUnique({where: {id}})
        const processed = result ? this.removeHidden(result) as T : null;
        this.resetVisible();
        return processed;
    }

    public static async findMany<T>(where?: any, include?: any): Promise<T[]> {
        const result = await this.getModel().findMany({where, include})
        const processed = this.removeHiddenFromArray(result) as T[];
        this.resetVisible();
        return processed;
    }

    /**
     * Update a record with mass assignment protection
     */
    public static async update<T>(id: number | string, data: any): Promise<T> {
        const filteredData = this.filterFillable(data);
        const result = await this.getModel().update({where: {id}, data: filteredData})
        const processed = this.removeHidden(result) as T;
        this.resetVisible();
        return processed;
    }

    /**
     * Update a record without mass assignment protection
     */
    public static async forceUpdate<T>(id: number | string, data: any): Promise<T> {
        const result = await this.getModel().update({where: {id}, data})
        const processed = this.removeHidden(result) as T;
        this.resetVisible();
        return processed;
    }

    public static async delete(id: number | string): Promise<void> {
        await this.getModel().delete({where: {id}})
    }

    public static async first<T>(where?: any): Promise<T | null> {
        const result = await this.getModel().findFirst({where})
        const processed = result ? this.removeHidden(result) as T : null;
        this.resetVisible();
        return processed;
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

    /**
     * Update all matching records with mass assignment protection
     */
    async update(data: any): Promise<void> {
        // @ts-ignore
        const filteredData = this.modelClass.filterFillable(data);
        await this.model.updateMany({
            where: this.whereClause,
            data: filteredData
        });
    }

    /**
     * Update all matching records without mass assignment protection
     */
    async forceUpdate(data: any): Promise<void> {
        await this.model.updateMany({
            where: this.whereClause,
            data: data
        });
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