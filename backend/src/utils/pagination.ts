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

export function getPaginationSkip(page: number, limit: number): number {
  return (page - 1) * limit
}
