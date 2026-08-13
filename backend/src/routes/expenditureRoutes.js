// src/routes/expenditureRoutes.js

import { Router } from 'express';
import { listExpenditures, createExpenditure } from '../controllers/expenditureController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'BASE_COMMANDER'));
router.use(enforceBaseScope);

router.get('/', listExpenditures);
router.post('/', createExpenditure);

export default router;
