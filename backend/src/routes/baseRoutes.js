// src/routes/baseRoutes.js

import { Router } from 'express';
import { listBases, createBase, updateBase, deleteBase } from '../controllers/baseController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', listBases); // all roles (Base Commander sees only their own)
router.post('/', authorizeRoles('ADMIN'), createBase);
router.put('/:id', authorizeRoles('ADMIN'), updateBase);
router.delete('/:id', authorizeRoles('ADMIN'), deleteBase);

export default router;
