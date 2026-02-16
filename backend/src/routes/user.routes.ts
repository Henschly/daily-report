import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { isHRorAdmin, isAdmin } from '../middleware/rbac.middleware.js';
import { validate, validateParams } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', isHRorAdmin, userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', validate(schemas.updateUser), userController.updateUser);
router.delete('/:id', isAdmin, userController.deleteUser);
router.get('/:id/reports', userController.getUserReports);

export default router;
