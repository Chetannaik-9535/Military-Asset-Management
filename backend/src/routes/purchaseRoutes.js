// src/routes/purchaseRoutes.js

import { Router } from 'express';
import { listPurchases, createPurchase } from '../controllers/purchaseController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'));
router.use(enforceBaseScope);

router.get('/', listPurchases);
router.post('/', createPurchase);

export default router;
