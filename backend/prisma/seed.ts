import { PrismaClient, UserRole, WorkflowVersionStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

function loadDotEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch {
        // ignore
      }
    }
  }
}

loadDotEnv();

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // ─── Users ─────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const operatorHash = await bcrypt.hash('Operator@123', 10);
  const reviewerHash = await bcrypt.hash('Reviewer@123', 10);
  const viewerHash = await bcrypt.hash('Viewer@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@flowguard.local' },
    update: {},
    create: {
      email: 'admin@flowguard.local',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      name: 'Admin User',
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@flowguard.local' },
    update: {},
    create: {
      email: 'operator@flowguard.local',
      passwordHash: operatorHash,
      role: UserRole.OPERATOR,
      name: 'Operator User',
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@flowguard.local' },
    update: {},
    create: {
      email: 'reviewer@flowguard.local',
      passwordHash: reviewerHash,
      role: UserRole.REVIEWER,
      name: 'Reviewer User',
    },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@flowguard.local' },
    update: {},
    create: {
      email: 'viewer@flowguard.local',
      passwordHash: viewerHash,
      role: UserRole.VIEWER,
      name: 'Viewer User',
    },
  });

  console.log(`✅ Created users: admin=${admin.id}, operator=${operator.id}, reviewer=${reviewer.id}`);

  // ─── Workflow Definition ────────────────────────────────────────────────────
  const workflowDef = await prisma.workflowDefinition.upsert({
    where: { id: 'wd-application-approval-001' },
    update: {},
    create: {
      id: 'wd-application-approval-001',
      name: 'Application Approval Workflow',
      description: 'Standard application approval workflow with credit score and income checks',
      isActive: true,
    },
  });

  console.log(`✅ Created workflow definition: ${workflowDef.id}`);

  // ─── Workflow Version v1 (PUBLISHED) ────────────────────────────────────────
  const existingVersion = await prisma.workflowVersion.findUnique({
    where: {
      workflowDefinitionId_version: {
        workflowDefinitionId: workflowDef.id,
        version: 1,
      },
    },
  });

  if (!existingVersion) {
    const workflowVersion = await prisma.workflowVersion.create({
      data: {
        workflowDefinitionId: workflowDef.id,
        version: 1,
        status: WorkflowVersionStatus.PUBLISHED,
        publishedAt: new Date(),
        config: {
          inputSchema: {
            applicantName: 'string',
            email: 'string',
            age: 'number',
            creditScore: 'number',
            monthlyIncome: 'number',
            requestedAmount: 'number',
          },
          rules: [
            {
              id: 'RULE_001',
              name: 'Minimum Age',
              field: 'age',
              operator: 'GTE',
              value: 18,
              priority: 1,
              failureAction: 'REJECT',
              isActive: true,
            },
            {
              id: 'RULE_002',
              name: 'Minimum Credit Score (Reject)',
              field: 'creditScore',
              operator: 'GTE',
              value: 600,
              priority: 2,
              failureAction: 'REJECT',
              isActive: true,
            },
            {
              id: 'RULE_003',
              name: 'Credit Score Approval Threshold',
              field: 'creditScore',
              operator: 'GTE',
              value: 750,
              priority: 3,
              failureAction: 'MANUAL_REVIEW',
              isActive: true,
            },
            {
              id: 'RULE_004',
              name: 'Minimum Income',
              field: 'monthlyIncome',
              operator: 'GTE',
              value: 25000,
              priority: 4,
              failureAction: 'MANUAL_REVIEW',
              isActive: true,
            },
          ],
          execution: {
            maxRetries: 3,
          },
        },
      },
    });

    console.log(`✅ Created workflow version: ${workflowVersion.id} (v${workflowVersion.version})`);
  } else {
    console.log(`ℹ️  Workflow version v1 already exists, skipping.`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
