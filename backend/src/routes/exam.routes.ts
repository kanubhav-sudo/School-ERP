/**
 * Exam Routes
 *
 * @module routes/exam
 */

import { Router } from 'express'
import { ExamController } from '../controllers/exam.controller'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'

const router = Router()

router.use(authenticate)

// List & view exams (Admin, Teacher, Student)
router.get('/', ExamController.listExams)
router.get('/admit-card/students', authorize('SUPERADMIN', 'ADMIN', 'TEACHER'), ExamController.getAdmitCardStudents)
router.post('/admit-card/status', authorize('SUPERADMIN', 'ADMIN', 'TEACHER'), ExamController.updateAdmitCardStatus)
router.get('/result/students', authorize('SUPERADMIN', 'ADMIN'), ExamController.getResultStudents)
router.post('/result/status', authorize('SUPERADMIN', 'ADMIN'), ExamController.updateResultStatus)

// Templates (Admin)
router.get('/templates/:type', authorize('SUPERADMIN', 'ADMIN'), ExamController.getExamTemplate)
router.post('/templates/:type', authorize('SUPERADMIN', 'ADMIN'), ExamController.saveExamTemplate)

// Exam CRUD & Timetables
router.get('/:id', ExamController.getExamById)
router.post('/', authorize('SUPERADMIN', 'ADMIN'), ExamController.createExam)
router.patch('/:id', authorize('SUPERADMIN', 'ADMIN'), ExamController.updateExam)
router.delete('/:id', authorize('SUPERADMIN', 'ADMIN'), ExamController.deleteExam)
router.post('/:id/schedules', authorize('SUPERADMIN', 'ADMIN'), ExamController.saveSchedules)

// Teacher & Admin Marks Management
router.get('/:examId/marks/subject/:subjectId', authorize('SUPERADMIN', 'ADMIN', 'TEACHER'), ExamController.getSubjectMarks)
router.post('/:examId/marks/subject/:subjectId', authorize('SUPERADMIN', 'ADMIN', 'TEACHER'), ExamController.saveSubjectMarks)
router.get('/:examId/marks/student/:studentId', authorize('SUPERADMIN', 'ADMIN', 'TEACHER'), ExamController.getStudentMarks)
router.post('/:examId/marks/student/:studentId', authorize('SUPERADMIN', 'ADMIN', 'TEACHER'), ExamController.saveStudentMarks)

export default router
