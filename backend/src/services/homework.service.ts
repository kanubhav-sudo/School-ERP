import { NotFoundError, AppError } from '../core/errors'
import { PublishStatus } from '../generated/prisma'
import { deleteFile } from '../utils/file.util'
import path from 'path'

export interface CreateHomeworkInput {
  title: string
  description?: string
  dueDate: string
  attachmentUrl?: string
  marks?: number
  status: PublishStatus
  sessionId: string
  classId: string
  sectionId: string
  subjectId: string
  teacherId: string
}

export interface UpdateHomeworkInput {
  title?: string
  description?: string
  dueDate?: string
  attachmentUrl?: string | null
  marks?: number
  status?: PublishStatus
}

export class HomeworkService {
  static async resolveTeacherIds(db: any, idOrUserId: string): Promise<string[]> {
    const teacher = await db.teacher.findFirst({
      where: {
        OR: [{ id: idOrUserId }, { userId: idOrUserId }],
      },
      select: { id: true, userId: true },
    })
    if (teacher) {
      return Array.from(
        new Set([teacher.id, teacher.userId, idOrUserId].filter((x): x is string => Boolean(x)))
      )
    }
    return [idOrUserId]
  }

  static async createHomework(db: any, data: CreateHomeworkInput) {
    const section = await db.section.findFirst({ where: { id: data.sectionId } })
    if (!section) throw new NotFoundError('Section not found')

    const teacherIds = await HomeworkService.resolveTeacherIds(db, data.teacherId)
    const teacherId = teacherIds[0]

    return await db.homework.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        attachmentUrl: data.attachmentUrl,
        marks: data.marks,
        status: data.status,
        sessionId: data.sessionId,
        classId: data.classId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        teacherId: teacherId,
      },
      include: {
        class: true,
        section: true,
        subject: true,
      },
    })
  }

  static async updateHomework(db: any, id: string, data: UpdateHomeworkInput, teacherId?: string) {
    const homework = await db.homework.findFirst({ where: { id } })
    if (!homework) throw new NotFoundError('Homework not found')

    if (teacherId) {
      const allowedIds = await HomeworkService.resolveTeacherIds(db, teacherId)
      if (!allowedIds.includes(homework.teacherId)) {
        throw new AppError('You do not have permission to edit this homework', 403)
      }
    }

    // Delete old attachment if it's being replaced or deleted
    if (
      data.attachmentUrl !== undefined &&
      homework.attachmentUrl &&
      data.attachmentUrl !== homework.attachmentUrl
    ) {
      const fileName = homework.attachmentUrl.split('/').pop()
      if (fileName) {
        deleteFile(path.join(process.cwd(), 'uploads', fileName))
      }
    }

    return await db.homework.update({
      where: { id },
      data: {
        ...data,
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      },
      include: {
        class: true,
        section: true,
        subject: true,
      },
    })
  }

  static async deleteHomework(db: any, id: string, teacherId?: string) {
    const homework = await db.homework.findFirst({ where: { id } })
    if (!homework) throw new NotFoundError('Homework not found')

    if (teacherId) {
      const allowedIds = await HomeworkService.resolveTeacherIds(db, teacherId)
      if (!allowedIds.includes(homework.teacherId)) {
        throw new AppError('You do not have permission to delete this homework', 403)
      }
    }

    if (homework.attachmentUrl) {
      const fileName = homework.attachmentUrl.split('/').pop()
      if (fileName) {
        deleteFile(path.join(process.cwd(), 'uploads', fileName))
      }
    }

    await db.homeworkSubmission.deleteMany({ where: { homeworkId: id } })
    await db.homework.delete({ where: { id } })
    return { message: 'Homework deleted successfully' }
  }

  static async getHomeworkForTeacher(
    db: any,
    teacherId: string,
    filters?: { classId?: string; sectionId?: string; subjectId?: string; status?: PublishStatus }
  ) {
    const allowedIds = await HomeworkService.resolveTeacherIds(db, teacherId)
    return await db.homework.findMany({
      where: {
        teacherId: { in: allowedIds },
        ...(filters?.classId && { classId: filters.classId }),
        ...(filters?.sectionId && { sectionId: filters.sectionId }),
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getAllHomework(
    db: any,
    filters?: {
      teacherId?: string
      classId?: string
      sectionId?: string
      subjectId?: string
      status?: PublishStatus
    }
  ) {
    const allowedIds = filters?.teacherId
      ? await HomeworkService.resolveTeacherIds(db, filters.teacherId)
      : undefined
    return await db.homework.findMany({
      where: {
        ...(allowedIds && { teacherId: { in: allowedIds } }),
        ...(filters?.classId && { classId: filters.classId }),
        ...(filters?.sectionId && { sectionId: filters.sectionId }),
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
