// src/routes/userRoutes.js

import { Router } from 'express';
import { listUsers, createUser } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/', listUsers);
router.post('/', createUser);

export default router;
