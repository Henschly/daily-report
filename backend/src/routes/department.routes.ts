import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { isHRorAdmin } from '../middleware/rbac.middleware.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        units: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/units', async (req, res, next) => {
  try {
    const { id } = req.params;

    const units = await prisma.unit.findMany({
      where: { departmentId: id },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: units,
    });
  } catch (error) {
    next(error);
  }
});

router.use(authenticate);

router.post('/', isHRorAdmin, async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const department = await prisma.department.create({
      data: { name, description },
    });

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', isHRorAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: { name, description },
    });

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', isHRorAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.department.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/units', isHRorAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const unit = await prisma.unit.create({
      data: { name, departmentId: id },
    });

    res.status(201).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
