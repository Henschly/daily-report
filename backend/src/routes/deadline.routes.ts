import { Router } from 'express';
import { deadlineController } from '../controllers/deadline.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { isHRorAdmin } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', isHRorAdmin, deadlineController.getDeadlines);
router.get('/:id', isHRorAdmin, deadlineController.getDeadlineById);
router.post('/', isHRorAdmin, validate(schemas.createDeadline), deadlineController.createDeadline);
router.put('/:id', isHRorAdmin, deadlineController.updateDeadline);
router.delete('/:id', isHRorAdmin, deadlineController.deleteDeadline);

export default router;
