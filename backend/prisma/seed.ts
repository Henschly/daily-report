import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Engineering',
        description: 'Software Engineering Department',
      },
    }),
    prisma.department.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Human Resources',
        description: 'Human Resources Department',
      },
    }),
    prisma.department.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Marketing',
        description: 'Marketing Department',
      },
    }),
  ]);

  console.log('Departments created');

  const units = await Promise.all([
    prisma.unit.upsert({
      where: { id: '00000000-0000-0000-0000-000000000010' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'Frontend Team',
        departmentId: departments[0].id,
      },
    }),
    prisma.unit.upsert({
      where: { id: '00000000-0000-0000-0000-000000000011' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000011',
        name: 'Backend Team',
        departmentId: departments[0].id,
      },
    }),
    prisma.unit.upsert({
      where: { id: '00000000-0000-0000-0000-000000000012' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000012',
        name: 'Recruitment',
        departmentId: departments[1].id,
      },
    }),
  ]);

  console.log('Units created');

  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        departmentId: departments[1].id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'hr@example.com' },
      update: {},
      create: {
        email: 'hr@example.com',
        password: hashedPassword,
        firstName: 'HR',
        lastName: 'Manager',
        role: 'hr',
        departmentId: departments[1].id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'hod@example.com' },
      update: {},
      create: {
        email: 'hod@example.com',
        password: hashedPassword,
        firstName: 'Head',
        lastName: 'Department',
        role: 'hod',
        departmentId: departments[0].id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'staff@example.com' },
      update: {},
      create: {
        email: 'staff@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'staff',
        departmentId: departments[0].id,
        unitId: units[0].id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: {
        email: 'jane@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'staff',
        departmentId: departments[0].id,
        unitId: units[1].id,
      },
    }),
  ]);

  console.log('Users created');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const reportContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Today I worked on implementing new features for the dashboard.',
          },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Fixed bug in user authentication' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Reviewed pull requests from team members' }],
              },
            ],
          },
        ],
      },
    ],
  };

  await prisma.report.upsert({
    where: { id: '00000000-0000-0000-0000-000000000100' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000100',
      userId: users[3].id,
      type: 'daily',
      title: `Daily Report - ${today.toISOString().split('T')[0]}`,
      content: reportContent,
      status: 'submitted',
      date: today,
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    },
  });

  await prisma.report.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      userId: users[3].id,
      type: 'daily',
      title: `Daily Report - ${yesterday.toISOString().split('T')[0]}`,
      content: reportContent,
      status: 'draft',
      date: yesterday,
      year: yesterday.getFullYear(),
      month: yesterday.getMonth() + 1,
    },
  });

  console.log('Reports created');

  await prisma.deadline.upsert({
    where: { id: '00000000-0000-0000-0000-000000000200' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000200',
      departmentId: departments[0].id,
      type: 'daily',
      deadlineTime: '18:00',
      isActive: true,
    },
  });

  console.log('Deadlines created');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
