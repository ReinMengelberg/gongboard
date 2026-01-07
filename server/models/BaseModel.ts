import { prisma } from '~~/server/db/prisma'

export abstract class Model {
    protected static modelName: string
    protected static policy?: new () => any
    protected static fillable: string[] = []
    protected static hidden: string[] = []
    private static visibleFields: string[] = []

    // Remove the [key: string]: any from here
    protected _attributes: Record<string, any> = {}
    protected _original: Record<string, any> = {}

    constructor(attributes: Record<string, any> = {}) {
        this._attributes = { ...attributes }
        this._original = { ...attributes }
        this.syncAttributes()
    }


    /**
     * Sync attributes to instance properties
     */
    private syncAttributes(): void {
        Object.keys(this._attributes).forEach(key => {
            if (key !== '_attributes' && key !== '_original') {
                (this as any)[key] = this._attributes[key]
            }
        })
    }

    /**
     * Fill instance with attributes
     */
    public fill(attributes: Record<string, any>): this {
        Object.assign(this._attributes, attributes)
        this.syncAttributes()
        return this
    }

    /**
     * Get all attributes
     */
    public getAttributes(): Record<string, any> {
        return { ...this._attributes }
    }

    /**
     * Convert to plain object
     */
    public toJSON(): Record<string, any> {
        const ctor = this.constructor as typeof Model
        return ctor.removeHidden(this._attributes) as Record<string, any>
    }

    /**
     * Check if attribute has changed
     */
    public isDirty(key?: string): boolean {
        if (key) {
            return this._attributes[key] !== this._original[key]
        }
        return JSON.stringify(this._attributes) !== JSON.stringify(this._original)
    }

    /**
     * Get changed attributes
     */
    public getDirty(): Record<string, any> {
        const dirty: Record<string, any> = {}
        Object.keys(this._attributes).forEach(key => {
            if (this._attributes[key] !== this._original[key]) {
                dirty[key] = this._attributes[key]
            }
        })
        return dirty
    }

    /**
     * Save instance to database
     */
    public async save(): Promise<this> {
        const ctor = this.constructor as typeof Model

        // Sync properties back to _attributes before saving
        Object.keys(this).forEach(key => {
            if (key !== '_attributes' && key !== '_original' && typeof (this as any)[key] !== 'function') {
                this._attributes[key] = (this as any)[key]
            }
        })

        if (this._attributes.id) {
            const data = ctor.filterFillable(this._attributes)
            const result = await ctor.getModel().update({
                where: { id: this._attributes.id },
                data
            })
            this._attributes = { ...result }
            this._original = { ...result }
            this.syncAttributes()
        } else {
            const data = ctor.filterFillable(this._attributes)
            const result = await ctor.getModel().create({ data })
            this._attributes = { ...result }
            this._original = { ...result }
            this.syncAttributes()
        }

        return this
    }

    /**
     * Delete this instance
     */
    public async delete(): Promise<void> {
        const ctor = this.constructor as typeof Model
        if (this._attributes.id) {
            await ctor.getModel().delete({ where: { id: this._attributes.id } })
        }
    }

    /**
     * Refresh from database
     */
    public async refresh(): Promise<this> {
        const ctor = this.constructor as typeof Model
        if (this._attributes.id) {
            const result = await ctor.getModel().findUnique({
                where: { id: this._attributes.id }
            })
            if (result) {
                this._attributes = { ...result }
                this._original = { ...result }
                this.syncAttributes()
            }
        }
        return this
    }

    // ============ Static Methods ============

    protected static getModel() {
        const modelName = this.modelName
        // @ts-ignore
        return prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)]
    }

    public static getPolicy(): (new () => any) | null {
        return this.policy || null
    }

    /**
     * Create instance without saving
     */
    public static make<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, attributes: Record<string, any> = {}): T {
        // @ts-ignore
        return new this(attributes)
    }

    /**
     * Hydrate plain object into model instance
     */
    protected static hydrate<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, data: Record<string, any>): T {
        // @ts-ignore
        return new this(data)
    }

    /**
     * Hydrate array of objects
     */
    protected static hydrateMany<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, data: Record<string, any>[]): T[] {
        // @ts-ignore
        return data.map(item => this.hydrate(item))
    }

    protected static filterFillable<T extends Record<string, any>>(data: T): Partial<T> {
        if (this.fillable.length === 0) {
            return data
        }
        const result: Partial<T> = {}
        this.fillable.forEach(field => {
            if (field in data) {
                result[field as keyof T] = data[field]
            }
        })
        return result
    }

    protected static removeHidden<T extends Record<string, any>>(data: T): Partial<T> {
        if (this.hidden.length === 0) return data
        const fieldsToHide = this.visibleFields.length > 0
            ? this.hidden.filter(field => !this.visibleFields.includes(field))
            : this.hidden
        if (fieldsToHide.length === 0) return data
        const result = { ...data }
        fieldsToHide.forEach(field => {
            delete result[field]
        })
        return result
    }

    protected static removeHiddenFromArray<T extends Record<string, any>>(data: T[]): Partial<T>[] {
        return data.map(item => this.removeHidden(item))
    }

    private static resetVisible(): void {
        this.visibleFields = []
    }

    public static makeVisible(fields: string | string[]): typeof Model {
        this.visibleFields = Array.isArray(fields) ? fields : [fields]
        return this
    }

    public static query<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model): QueryBuilder<T> {
        return new QueryBuilder(this.getModel(), this)
    }

    public static async create<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, data: any): Promise<T> {
        const filteredData = this.filterFillable(data)
        const result = await this.getModel().create({ data: filteredData })
        const processed = this.removeHidden(result)
        this.resetVisible()
        // @ts-ignore
        return this.hydrate(processed as Record<string, any>)
    }

    public static async forceCreate<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, data: any): Promise<T> {
        const result = await this.getModel().create({ data })
        const processed = this.removeHidden(result)
        this.resetVisible()
        // @ts-ignore
        return this.hydrate(processed as Record<string, any>)
    }

    public static async find<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, id: number | string): Promise<T | null> {
        const result = await this.getModel().findUnique({ where: { id } })
        if (!result) {
            this.resetVisible()
            return null
        }
        const processed = this.removeHidden(result)
        this.resetVisible()
        // @ts-ignore
        return this.hydrate(processed as Record<string, any>)
    }

    public static async findOrFail<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, id: number | string): Promise<T> {
        const result = await this.find(id)
        if (!result) {
            throw new Error(`${this.modelName} not found with id ${id}`)
        }
        // @ts-ignore
        return result
    }

    public static async findMany<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, where?: any, include?: any): Promise<T[]> {
        const result = await this.getModel().findMany({ where, include })
        const processed = this.removeHiddenFromArray(result)
        this.resetVisible()
        // @ts-ignore
        return this.hydrateMany(processed as Record<string, any>[])
    }

    public static async update<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, id: number | string, data: any): Promise<T> {
        const filteredData = this.filterFillable(data)
        const result = await this.getModel().update({ where: { id }, data: filteredData })
        const processed = this.removeHidden(result)
        this.resetVisible()
        // @ts-ignore
        return this.hydrate(processed as Record<string, any>)
    }

    public static async forceUpdate<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, id: number | string, data: any): Promise<T> {
        const result = await this.getModel().update({ where: { id }, data })
        const processed = this.removeHidden(result)
        this.resetVisible()
        // @ts-ignore
        return this.hydrate(processed as Record<string, any>)
    }

    public static async deleteById(id: number | string): Promise<void> {
        await this.getModel().delete({ where: { id } })
    }

    // Keep the old delete method name for backwards compatibility
    public static async delete(id: number | string): Promise<void> {
        await this.deleteById(id)
    }

    public static async first<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, where?: any): Promise<T | null> {
        const result = await this.getModel().findFirst({ where })
        if (!result) {
            this.resetVisible()
            return null
        }
        const processed = this.removeHidden(result)
        this.resetVisible()
        // @ts-ignore
        return this.hydrate(processed as Record<string, any>)
    }

    public static async all<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model): Promise<T[]> {
        // @ts-ignore
        return this.findMany()
    }

    public static async count(where?: any): Promise<number> {
        return await this.getModel().count({ where })
    }

    public static where<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, conditions: any): QueryBuilder<T> {
        // @ts-ignore
        return this.query().where(conditions)
    }

    public static with<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, relations: any): QueryBuilder<T> {
        // @ts-ignore
        return this.query().with(relations)
    }

    public static orderBy<T extends Model>(this: { new(attributes?: Record<string, any>): T } & typeof Model, order: any): QueryBuilder<T> {
        // @ts-ignore
        return this.query().orderBy(order)
    }
}

class QueryBuilder<T> {
    private model: any
    private modelClass: typeof Model
    private whereClause: any = {}
    private orderByClause: any = undefined
    private includeClause: any = undefined

    constructor(model: any, modelClass: typeof Model) {
        this.model = model
        this.modelClass = modelClass
    }

    where(conditions: any): this {
        this.whereClause = { ...this.whereClause, ...conditions }
        return this
    }

    orWhere(conditions: any): this {
        if (!this.whereClause.OR) {
            this.whereClause.OR = []
        }
        this.whereClause.OR.push(conditions)
        return this
    }

    orderBy(order: any): this {
        this.orderByClause = order
        return this
    }

    with(relations: any): this {
        this.includeClause = relations
        return this
    }

    async get(): Promise<T[]> {
        const result = await this.model.findMany({
            where: this.whereClause,
            orderBy: this.orderByClause,
            include: this.includeClause
        })
        // @ts-ignore
        const processed = this.modelClass.removeHiddenFromArray(result)
        // @ts-ignore
        return this.modelClass.hydrateMany(processed)
    }

    async first(): Promise<T | null> {
        const result = await this.model.findFirst({
            where: this.whereClause,
            orderBy: this.orderByClause,
            include: this.includeClause
        })
        if (!result) return null
        // @ts-ignore
        const processed = this.modelClass.removeHidden(result)
        // @ts-ignore
        return this.modelClass.hydrate(processed)
    }

    async count(): Promise<number> {
        return await this.model.count({ where: this.whereClause })
    }

    async update(data: any): Promise<void> {
        // @ts-ignore
        const filteredData = this.modelClass.filterFillable(data)
        await this.model.updateMany({
            where: this.whereClause,
            data: filteredData
        })
    }

    async forceUpdate(data: any): Promise<void> {
        await this.model.updateMany({
            where: this.whereClause,
            data
        })
    }

    async delete(): Promise<void> {
        await this.model.deleteMany({
            where: this.whereClause
        })
    }

    async paginate(options: {
        page?: number
        perPage?: number
    } = {}): Promise<{
        data: T[]
        current_page: number
        last_page: number
        per_page: number
        total: number
        from: number | null
        to: number | null
    }> {
        const page = Math.max(options.page || 1, 1)
        const perPage = Math.min(Math.max(options.perPage || 25, 1), 100)
        const skip = (page - 1) * perPage

        const [data, total] = await Promise.all([
            this.model.findMany({
                where: this.whereClause,
                orderBy: this.orderByClause,
                include: this.includeClause,
                skip,
                take: perPage
            }),
            this.count()
        ])

        const lastPage = Math.max(1, Math.ceil(total / perPage))
        const from = total === 0 ? null : skip + 1
        const to = total === 0 ? null : Math.min(skip + data.length, total)

        // @ts-ignore
        const processed = this.modelClass.removeHiddenFromArray(data)

        return {
            // @ts-ignore
            data: this.modelClass.hydrateMany(processed),
            current_page: page,
            last_page: lastPage,
            per_page: perPage,
            from,
            to,
            total
        }
    }
}