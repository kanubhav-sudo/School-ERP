import prisma from '../database/prisma'
import { NotFoundError, AppError } from '../core/errors'
import { PublishStatus } from '../generated/prisma'

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
  attachmentUrl?: string
  marks?: number
  status?: PublishStatus
}

export class HomeworkService {
  static async createHomework(data: CreateHomeworkInput) {
    const section = await prisma.section.findUnique({ where: { id: data.sectionId } })
    if (!section) throw new NotFoundError('Section not found')

    return await prisma.homework.create({
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
        teacherId: data.teacherId
      },
      include: {
        class: true,
        section: true,
        subject: true
      }
    })
  }

  static async updateHomework(id: string, data: UpdateHomeworkInput, teacherId?: string) {
    const homework = await prisma.homework.findUnique({ where: { id } })
    if (!homework) throw new NotFoundError('Homework not found')
    
    if (teacherId && homework.teacherId !== teacherId) {
      throw new AppError('You do not have permission to edit this homework', 403)
    }

    return await prisma.homework.update({
      where: { id },
      data: {
        ...data,
        ...(data.dueDate && { dueDate: new Date(data.dueDate) })
      },
      include: {
        class: true,
        section: true,
        subject: true
      }
    })
  }

  static async deleteHomework(id: string, teacherId?: string) {
    const homework = await prisma.homework.findUnique({ where: { id } })
    if (!homework) throw new NotFoundError('Homework not found')

    if (teacherId && homework.teacherId !== teacherId) {
      throw new AppError('You do not have permission to delete this homework', 403)
    }

    await prisma.$transaction([
      prisma.homeworkSubmission.deleteMany({ where: { homeworkId: id } }),
      prisma.homework.delete({ where: { id } })
    ])
    return { message: 'Homework deleted successfully' }
  }

  static async getHomeworkForTeacher(teacherId: string, filters?: { classId?: string, sectionId?: string, subjectId?: string, status?: PublishStatus }) {
    return await prisma.homework.findMany({
      where: {
        teacherId,
        ...(filters?.classId && { classId: filters.classId }),
        ...(filters?.sectionId && { sectionId: filters.sectionId }),
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        class: true,
        section: true,
        subject: true,
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getAllHomework(filters?: { teacherId?: string, classId?: string, sectionId?: string, subjectId?: string, status?: PublishStatus }) {
    return await prisma.homework.findMany({
      where: {
        ...(filters?.teacherId && { teacherId: filters.teacherId }),
        ...(filters?.classId && { classId: filters.classId }),
        ...(filters?.sectionId && { sectionId: filters.sectionId }),
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: true,
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}
