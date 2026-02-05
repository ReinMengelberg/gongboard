import {Model, parseSort, sortToPrismaOrderBy} from "~~/server/models/utils/BaseModel";

class QueryBuilder<T> {
    private model: any
    private modelClass: typeof Model
    private whereClause: any = {}
    private orderByClause: any = undefined
    private includeClause: any = undefined
    private selectClause: any = undefined

    constructor(model: any, modelClass: typeof Model) {
        this.model = model
        this.modelClass = modelClass
    }

    where(conditions: any): this {
        this.whereClause = {...this.whereClause, ...conditions}
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

    /**
     * Apply sort from query parameter string
     * Format: ?sort=field for ascending, ?sort=-field for descending
     * Multiple sorts: ?sort=field1,-field2
     *
     * @param sortParam - The raw sort query parameter string (e.g., "-published_at,title")
     * @param defaultSort - Required default sort if sortParam is empty (e.g., "-published_at")
     *
     * Usage: .applySorts(query.sort as string, '-published_at')
     */
    applySorts(sortParam: string | undefined | null, defaultSort: string): this {
        const sortString = sortParam?.trim() || defaultSort
        const sorts = parseSort(sortString)
        const prismaOrder = sortToPrismaOrderBy(sorts)
        if (prismaOrder) {
            this.orderByClause = prismaOrder
        }
        return this
    }

    /**
     * Apply filter for a field with "in" condition
     * Usage: .whereIn('location_id', ['1', '2', '3'])
     */
    whereIn(field: string, values: (string | number)[]): this {
        if (values.length === 0) return this

        // Convert to numbers if they look like numbers
        const processedValues = values.map(v => {
            const num = Number(v)
            return isNaN(num) ? v : num
        })

        this.whereClause = {
            ...this.whereClause,
            [field]: {in: processedValues}
        }
        return this
    }

    /**
     * Apply filters from parsed filter object
     * Usage: .applyFilters(parseFilters(query), { location: 'location_id', department: 'department_id' })
     * The fieldMapping maps filter names to actual database field names
     */
    applyFilters(filters: Record<string, string[]>, fieldMapping: Record<string, string> = {}): this {
        for (const [filterName, values] of Object.entries(filters)) {
            if (values.length === 0) continue

            // Use mapped field name or the filter name itself
            const fieldName = fieldMapping[filterName] || filterName

            // Convert to numbers if they look like numbers
            const processedValues = values.map(v => {
                const num = Number(v)
                return isNaN(num) ? v : num
            })

            // If single value, use equals; otherwise use 'in'
            if (processedValues.length === 1) {
                this.whereClause = {
                    ...this.whereClause,
                    [fieldName]: processedValues[0]
                }
            } else {
                this.whereClause = {
                    ...this.whereClause,
                    [fieldName]: {in: processedValues}
                }
            }
        }
        return this
    }

    with(relations: any): this {
        this.includeClause = relations
        return this
    }

    select(fields: any): this {
        this.selectClause = fields
        return this
    }

    async get(): Promise<T[]> {
        const result = await this.model.findMany({
            where: this.whereClause,
            orderBy: this.orderByClause,
            include: this.includeClause,
            select: this.selectClause
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
            include: this.includeClause,
            select: this.selectClause
        })
        if (!result) return null
        // @ts-ignore
        const processed = this.modelClass.removeHidden(result)
        // @ts-ignore
        return this.modelClass.hydrate(processed)
    }

    async count(): Promise<number> {
        return await this.model.count({where: this.whereClause})
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

export default QueryBuilder;