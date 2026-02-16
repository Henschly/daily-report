import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { commentController } from '../controllers/comment.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { isHRorAdmin, isHODorHR, anyRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/today', reportController.getTodayReport);
router.get('/', anyRole, reportController.getReports);
router.get('/:id', reportController.getReportById);
router.post('/', validate(schemas.createReport), reportController.createReport);
router.put('/:id', validate(schemas.updateReport), reportController.updateReport);
router.delete('/:id', reportController.deleteReport);
router.post('/:id/submit', reportController.submitReport);
router.post('/:id/lock', isHRorAdmin, reportController.lockReport);
router.post('/:id/unlock', isHRorAdmin, reportController.unlockReport);
router.get('/:id/versions', isHODorHR, reportController.getReportVersions);
router.get('/:id/export', optionalAuth, reportController.exportReport);

router.get('/:reportId/comments', commentController.getComments);
router.post('/:reportId/comments', validate(schemas.createComment), commentController.createComment);
router.put('/comments/:id', commentController.updateComment);
router.delete('/comments/:id', commentController.deleteComment);

export default router;
