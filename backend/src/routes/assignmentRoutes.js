// src/routes/assignmentRoutes.js

import { Router } from 'express';
import { listAssignments, createAssignment, returnAssignment } from '../controllers/assignmentController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'BASE_COMMANDER'));
router.use(enforceBaseScope);

router.get('/', listAssignments);
router.post('/', createAssignment);
router.patch('/:id/return', returnAssignment);

export default router;
