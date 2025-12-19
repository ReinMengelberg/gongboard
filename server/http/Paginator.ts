import type { PaginatedData } from '~~/src/types/api/PaginatedData'

/**
 * Generic in-memory paginator for arrays.
 * Intended for situations where you already have a full array and want to
 * present it in a paginated shape compatible with PaginatedData<T[]>.
 */
export default class Paginator<T> {
  private readonly items: T[]

  constructor(items: T[] = []) {
    this.items = Array.isArray(items) ? items : []
  }

  /**
   * Paginate the provided items.
   * - per_page is clamped to [1, 100]
   * - page is clamped to [1, last_page] (falls back to 1 when there are no items)
   */
  paginate(page: number = 1, per_page: number = 10): PaginatedData<T[]> {
    const total = this.items.length
    const perPage = clampInt(per_page, 1, 100, 10)

    const last_page = Math.max(1, Math.ceil(total / perPage))
    const current_page = clampInt(page, 1, last_page, 1)

    const startIndex = (current_page - 1) * perPage
    const data = total === 0 ? [] : this.items.slice(startIndex, startIndex + perPage)

    const from = total === 0 ? null : startIndex + 1
    const to = total === 0 ? null : startIndex + data.length

    return {
      current_page,
      data,
      last_page,
      per_page: perPage,
      from,
      to,
      total,
    }
  }

  /**
   * Convenience static method to paginate without creating an instance explicitly.
   */
  static paginate<U>(items: U[], page: number = 1, per_page: number = 10): PaginatedData<U[]> {
    return new Paginator(items).paginate(page, per_page)
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.floor(n), min), max)
}
