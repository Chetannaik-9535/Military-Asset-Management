// src/routes/transferRoutes.js

import { Router } from 'express';
import { listTransfers, createTransfer, updateTransferStatus } from '../controllers/transferController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'));
router.use(enforceBaseScope);

router.get('/', listTransfers);
router.post('/', createTransfer);
router.patch('/:id/status', authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'), updateTransferStatus);

export default router;
