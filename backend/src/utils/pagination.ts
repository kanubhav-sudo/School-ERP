export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function getPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}

export function getPaginationSkip(page: number | undefined, limit: number | undefined): number {
  const safePage = page && !isNaN(page) && page > 0 ? page : 1
  const safeLimit = limit && !isNaN(limit) && limit > 0 ? limit : 20
  return (safePage - 1) * safeLimit
}
