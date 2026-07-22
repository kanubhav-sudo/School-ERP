/**
 * Exam Controller
 *
 * @module controllers/exam
 */

import { Request, Response, NextFunction } from 'express'
import { ExamService } from '../services/exam.service'
import { ApiResponse } from '../core'
import { PublishStatus } from '../generated/prisma'

export class ExamController {
  static async listExams(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.query.sessionId as string | undefined
      const classId = req.query.classId as string | undefined
      const status = req.query.status as PublishStatus | undefined

      const data = await ExamService.listExams({ sessionId, classId, status })
      ApiResponse.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async getExamById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = await ExamService.getExamById(id as string)
      ApiResponse.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async createExam(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ExamService.createExam(req.body)
      ApiResponse.created(res, data, 'Exam created successfully')
    } catch (err) {
      next(err)
    }
  }

  static async updateExam(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = await ExamService.updateExam(id as string, req.body)
      ApiResponse.success(res, data, 'Exam updated successfully')
    } catch (err) {
      next(err)
    }
  }

  static async deleteExam(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await ExamService.deleteExam(id as string)
      ApiResponse.success(res, null, 'Exam deleted successfully')
    } catch (err) {
      next(err)
    }
  }

  static async saveSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = await ExamService.saveSchedules(id as string, req.body.schedules)
      ApiResponse.success(res, data, 'Exam timetable schedules saved')
    } catch (err) {
      next(err)
    }
  }

  static async getAdmitCardStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.query.sessionId as string
      const classId = req.query.classId as string
      const examId = req.query.examId as string | undefined

      const data = await ExamService.getAdmitCardStudents(sessionId, classId, examId)
      ApiResponse.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async updateAdmitCardStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const role = (req.user?.role === 'TEACHER' ? 'TEACHER' : 'ADMIN') as 'ADMIN' | 'TEACHER'
      const data = await ExamService.updateAdmitCardStatus({
        ...req.body,
        role,
      })
      ApiResponse.success(res, data, 'Admit card status updated')
    } catch (err) {
      next(err)
    }
  }

  static async getSubjectMarks(req: Request, res: Response, next: NextFunction) {
    try {
      const { examId, subjectId } = req.params
      const data = await ExamService.getSubjectMarks(examId as string, subjectId as string)
      ApiResponse.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async saveSubjectMarks(req: Request, res: Response, next: NextFunction) {
    try {
      const { examId, subjectId } = req.params
      const { maxMarks, marks } = req.body
      const data = await ExamService.saveSubjectMarks({
        examId: examId as string,
        subjectId: subjectId as string,
        maxMarks,
        marks,
      })
      ApiResponse.success(res, data, 'Subject marks saved')
    } catch (err) {
      next(err)
    }
  }

  static async getStudentMarks(req: Request, res: Response, next: NextFunction) {
    try {
      const { examId, studentId } = req.params
      const data = await ExamService.getStudentMarks(examId as string, studentId as string)
      ApiResponse.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async saveStudentMarks(req: Request, res: Response, next: NextFunction) {
    try {
      const { examId, studentId } = req.params
      const { marks } = req.body
      const data = await ExamService.saveStudentMarks({
        examId: examId as string,
        studentId: studentId as string,
        marks,
      })
      ApiResponse.success(res, data, 'Student marks saved')
    } catch (err) {
      next(err)
    }
  }

  static async getResultStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.query.sessionId as string
      const classId = req.query.classId as string
      const examId = req.query.examId as string

      const data = await ExamService.getResultStudents(sessionId, classId, examId)
      ApiResponse.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async updateResultStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ExamService.updateResultStatus(req.body)
      ApiResponse.success(res, data, 'Result release status updated')
    } catch (err) {
      next(err)
    }
  }

  static async getExamTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params as { type: 'ADMIT_CARD' | 'RESULT' }
      const data = await ExamService.getExamTemplate(type)
      ApiResponse.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async saveExamTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params as { type: 'ADMIT_CARD' | 'RESULT' }
      const data = await ExamService.saveExamTemplate(type, req.body)
      ApiResponse.success(res, data, 'Template saved successfully')
    } catch (err) {
      next(err)
    }
  }
}
