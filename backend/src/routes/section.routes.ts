/**
 * Section Routes
 *
 * All routes protected by authenticate + ADMIN authorize.
 *
 * @module routes/sections
 */

import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.middleware'
import { authorize } from '../middlewares/authorize.middleware'
import * as SectionController from '../controllers/section.controller'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

// GET /api/v1/sections
router.get('/', SectionController.listSections)

// GET /api/v1/sections/:id
router.get('/:id', SectionController.getSection)

// POST /api/v1/sections
router.post('/', SectionController.createSection)

// PATCH /api/v1/sections/:id
router.patch('/:id', SectionController.updateSection)

// DELETE /api/v1/sections/:id
router.delete('/:id', SectionController.deleteSection)

export default router
