// src/routes/assetRoutes.js

import { Router } from 'express';
import { getDashboardMetrics, getAssetsByBase } from '../controllers/assetController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);

// All three roles can view the dashboard; scope is enforced per-role.
router.get('/dashboard', authorizeRoles('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), enforceBaseScope, getDashboardMetrics);
router.get('/by-base', authorizeRoles('ADMIN', 'BASE_COMMANDER'), getAssetsByBase);

export default router;
