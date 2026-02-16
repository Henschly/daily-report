import { Router } from 'express';
import { compiledReportController } from '../controllers/compiled-report.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { anyRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', anyRole, compiledReportController.getCompiledReports);
router.get('/:id', compiledReportController.getCompiledReportById);
router.post('/weekly', compiledReportController.generateWeeklyReport);
router.post('/monthly', compiledReportController.generateMonthlyReport);
router.post('/annual', compiledReportController.generateAnnualReport);
router.get('/:id/export', optionalAuth, compiledReportController.exportCompiledReport);

export default router;
