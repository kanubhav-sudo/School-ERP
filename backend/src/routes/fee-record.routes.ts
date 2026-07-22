import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as FeeRecordController from '../controllers/fee-record.controller'

const router = Router()

router.use(authenticate)
// Only ADMIN can view fee records for now (can be expanded later)
router.use(authorize('ADMIN', 'SUPERADMIN'))

router.get('/', FeeRecordController.listFeeRecords)
router.get('/students', FeeRecordController.getStudentFeeList)
router.get('/summary', FeeRecordController.getFeeSummary)
router.get('/student/:studentId', FeeRecordController.getStudentFeeProfile)
router.post('/student/:studentId/pay', FeeRecordController.processPayment)

export default router

