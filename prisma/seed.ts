import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BCRYPT_COST = 12;

interface SystemPolicy {
  name: string;
  description: string;
  actions: string[];
}

interface SystemRole {
  name: string;
  description: string;
  policy: string;
}

const SYSTEM_POLICIES: SystemPolicy[] = [
  {
    name: "AdministratorAccess",
    description: "Full access to every resource",
    actions: ["*"],
  },
  {
    name: "AnalystAccess",
    description: "Manage fields, datasets, models and evaluations; run predictions",
    actions: [
      "field:*",
      "dataset:*",
      "model:*",
      "evaluation:*",
      "prediction:Read",
      "prediction:Run",
      "dashboard:Read",
    ],
  },
  {
    name: "ViewerAccess",
    description: "Read-only access; can run predictions",
    actions: [
      "field:Read",
      "dataset:Read",
      "model:Read",
      "evaluation:Read",
      "prediction:Read",
      "prediction:Run",
      "dashboard:Read",
    ],
  },
];

const SYSTEM_ROLES: SystemRole[] = [
  { name: "Admin", description: "Full access", policy: "AdministratorAccess" },
  { name: "Analyst", description: "Manages data and models", policy: "AnalystAccess" },
  { name: "Viewer", description: "Views data and runs predictions", policy: "ViewerAccess" },
];

const ADMIN_USER = {
  firstName: "System",
  lastName: "Admin",
  email: "admin@animo.local",
  password: "ChangeMe123!",
  role: "Admin",
};

async function seedPolicies() {
  for (const { name, description, actions } of SYSTEM_POLICIES) {
    await prisma.policy.upsert({
      where: { name },
      update: {
        description,
        isSystem: true,
        statements: {
          deleteMany: {},
          create: { effect: "ALLOW", actions, resources: ["*"] },
        },
      },
      create: {
        name,
        description,
        isSystem: true,
        statements: { create: { effect: "ALLOW", actions, resources: ["*"] } },
      },
    });
  }
}

async function seedRoles() {
  for (const { name, description, policy } of SYSTEM_ROLES) {
    const { id: policyId } = await prisma.policy.findUniqueOrThrow({
      where: { name: policy },
    });
    const role = await prisma.role.upsert({
      where: { name },
      update: { description, isSystem: true },
      create: { name, description, isSystem: true },
    });
    await prisma.rolePolicy.upsert({
      where: { roleId_policyId: { roleId: role.id, policyId } },
      update: {},
      create: { roleId: role.id, policyId },
    });
  }
}

async function seedAdmin() {
  const email = ADMIN_USER.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  const user =
    existing ??
    (await prisma.user.create({
      data: {
        firstName: ADMIN_USER.firstName,
        lastName: ADMIN_USER.lastName,
        email,
        passwordHash: await bcrypt.hash(ADMIN_USER.password, BCRYPT_COST),
      },
    }));
  const { id: roleId } = await prisma.role.findUniqueOrThrow({
    where: { name: ADMIN_USER.role },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId } },
    update: {},
    create: { userId: user.id, roleId },
  });
}

async function main() {
  await seedPolicies();
  await seedRoles();
  await seedAdmin();
  console.log("Seeded system policies, roles and admin user");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
