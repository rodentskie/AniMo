-- CreateEnum
CREATE TYPE "Effect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('WET', 'DRY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_policies" (
    "roleId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,

    CONSTRAINT "role_policies_pkey" PRIMARY KEY ("roleId","policyId")
);

-- CreateTable
CREATE TABLE "policy_statements" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "effect" "Effect" NOT NULL DEFAULT 'ALLOW',
    "actions" TEXT[],
    "resources" TEXT[],

    CONSTRAINT "policy_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT,
    "municipality" TEXT,
    "barangay" TEXT,
    "areaHa" DECIMAL(12,2) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yield_records" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "season" "Season" NOT NULL,
    "areaHarvested" DECIMAL(12,2) NOT NULL,
    "production" DECIMAL(14,2) NOT NULL,
    "yieldPerHa" DECIMAL(8,3) NOT NULL,
    "rainfall" DECIMAL(8,2) NOT NULL,
    "temperature" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yield_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arimax_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "p" INTEGER NOT NULL,
    "d" INTEGER NOT NULL,
    "q" INTEGER NOT NULL,
    "P" INTEGER NOT NULL DEFAULT 0,
    "D" INTEGER NOT NULL DEFAULT 0,
    "Q" INTEGER NOT NULL DEFAULT 0,
    "s" INTEGER NOT NULL DEFAULT 2,
    "exogVars" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arimax_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_evaluations" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "trainFrom" INTEGER NOT NULL,
    "trainTo" INTEGER NOT NULL,
    "testSize" INTEGER NOT NULL,
    "mae" DOUBLE PRECISION NOT NULL,
    "rmse" DOUBLE PRECISION NOT NULL,
    "mape" DOUBLE PRECISION NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "season" "Season" NOT NULL,
    "farmArea" DECIMAL(12,2) NOT NULL,
    "rainfall" DECIMAL(8,2) NOT NULL,
    "temperature" DECIMAL(5,2) NOT NULL,
    "estimatedYield" DECIMAL(8,3) NOT NULL,
    "estimatedProd" DECIMAL(14,2) NOT NULL,
    "lowerBound" DECIMAL(8,3),
    "upperBound" DECIMAL(8,3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "changedById" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "login_attempts_email_createdAt_idx" ON "login_attempts"("email", "createdAt");

-- CreateIndex
CREATE INDEX "login_attempts_ip_createdAt_idx" ON "login_attempts"("ip", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "policies_name_key" ON "policies"("name");

-- CreateIndex
CREATE INDEX "policy_statements_policyId_idx" ON "policy_statements"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "fields_code_key" ON "fields"("code");

-- CreateIndex
CREATE UNIQUE INDEX "yield_records_fieldId_year_season_key" ON "yield_records"("fieldId", "year", "season");

-- CreateIndex
CREATE UNIQUE INDEX "arimax_models_name_key" ON "arimax_models"("name");

-- CreateIndex
CREATE INDEX "model_evaluations_modelId_fieldId_idx" ON "model_evaluations"("modelId", "fieldId");

-- CreateIndex
CREATE INDEX "predictions_fieldId_createdAt_idx" ON "predictions"("fieldId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_tableName_recordId_idx" ON "audit_logs"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "audit_logs_changedAt_idx" ON "audit_logs"("changedAt");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_policies" ADD CONSTRAINT "role_policies_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_policies" ADD CONSTRAINT "role_policies_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_statements" ADD CONSTRAINT "policy_statements_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yield_records" ADD CONSTRAINT "yield_records_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_evaluations" ADD CONSTRAINT "model_evaluations_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "arimax_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_evaluations" ADD CONSTRAINT "model_evaluations_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "arimax_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
