// src/routes/auditRoutes.js

import { Router } from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/', listAuditLogs);

export default router;
