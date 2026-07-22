import { prisma } from '../database'
import { NotFoundError } from '../core/errors'
import {
  CreateNoticeInput,
  UpdateNoticeInput,
  NoticeQueryInput,
} from '../validators/notice.validator'

export class NoticeService {
  /**
   * Create a new notice
   */
  static async createNotice(data: CreateNoticeInput, authorId: string) {
    const notice = await prisma.notice.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority,
        targetRoles: data.targetRoles || [],
        targetClassIds: data.targetClassIds || [],
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        attachments: data.attachments || [],
        authorId,
        createdById: authorId,
      },
    })
    return notice
  }

  /**
   * Get notices with optional filtering
   */
  static async getNotices(query: NoticeQueryInput) {
    const now = new Date()
    const andConditions: object[] = [{ isDeleted: false }]

    // Active only filter
    if (query.activeOnly === 'true') {
      andConditions.push({ publishedAt: { lte: now } })
      andConditions.push({
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      })
    }

    // Target role filter
    if (query.role) {
      andConditions.push({
        OR: [{ targetRoles: { isEmpty: true } }, { targetRoles: { has: query.role } }],
      })
    }

    // Target class filter
    if (query.classId) {
      andConditions.push({
        OR: [{ targetClassIds: { isEmpty: true } }, { targetClassIds: { has: query.classId } }],
      })
    }

    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const [notices, total] = await Promise.all([
      prisma.notice.findMany({
        where: { AND: andConditions },
        orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, username: true, email: true },
          },
        },
      }),
      prisma.notice.count({ where: { AND: andConditions } }),
    ])

    return {
      notices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }
  }

  /**
   * Get a specific notice by ID
   */
  static async getNoticeById(id: string) {
    const notice = await prisma.notice.findUnique({
      where: { id, isDeleted: false },
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
      },
    })

    if (!notice) {
      throw new NotFoundError('Notice not found')
    }

    return notice
  }

  /**
   * Update a notice
   */
  static async updateNotice(id: string, data: UpdateNoticeInput, updatedById: string) {
    // Check if notice exists
    await this.getNoticeById(id)

    const notice = await prisma.notice.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority,
        targetRoles: data.targetRoles,
        targetClassIds: data.targetClassIds,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
        expiresAt:
          data.expiresAt !== undefined
            ? data.expiresAt
              ? new Date(data.expiresAt)
              : null
            : undefined,
        attachments: data.attachments,
        updatedById,
      },
    })
    return notice
  }

  /**
   * Soft delete a notice
   */
  static async deleteNotice(id: string, deletedById: string) {
    // Check if notice exists
    await this.getNoticeById(id)

    await prisma.notice.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById,
      },
    })
  }
}
