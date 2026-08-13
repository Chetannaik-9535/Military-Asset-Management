// src/routes/equipmentRoutes.js

import { Router } from 'express';
import { listEquipmentTypes, createEquipmentType } from '../controllers/equipmentController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', listEquipmentTypes); // all roles
router.post('/', authorizeRoles('ADMIN'), createEquipmentType);

export default router;
