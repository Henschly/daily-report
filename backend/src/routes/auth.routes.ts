import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { schemas } from '../middleware/validation.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post('/refresh', authController.refreshToken);

export default router;
