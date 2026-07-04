/**
 * Class Routes
 *
 * All routes protected by authenticate + ADMIN authorize.
 *
 * @module routes/classes
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as ClassController from '../controllers/class.controller'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

// GET /api/v1/classes
router.get('/', ClassController.listClasses)

// GET /api/v1/classes/:id
router.get('/:id', ClassController.getClass)

// POST /api/v1/classes
router.post('/', ClassController.createClass)

// PATCH /api/v1/classes/:id
router.patch('/:id', ClassController.updateClass)

// DELETE /api/v1/classes/:id
router.delete('/:id', ClassController.deleteClass)

export default router
