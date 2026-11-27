/*
  Warnings:

  - You are about to drop the column `fieldId` on the `model_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedProd` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedYield` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `farmArea` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `fieldId` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `lowerBound` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `rainfall` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `season` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `upperBound` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the `arimax_models` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fields` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `yield_records` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `irrigation` to the `model_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `model_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `historicalAvg` to the `predictions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `horizon` to the `predictions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `irrigation` to the `predictions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastActualYear` to the `predictions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `predictions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outlook` to the `predictions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IrrigationStatus" AS ENUM ('IRRIGATED', 'NON_IRRIGATED');

-- CreateEnum
CREATE TYPE "ProductionOutlook" AS ENUM ('HIGH', 'MODERATE', 'LOW');

-- DropForeignKey
ALTER TABLE "model_evaluations" DROP CONSTRAINT "model_evaluations_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "model_evaluations" DROP CONSTRAINT "model_evaluations_modelId_fkey";

-- DropForeignKey
ALTER TABLE "predictions" DROP CONSTRAINT "predictions_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "predictions" DROP CONSTRAINT "predictions_modelId_fkey";

-- DropForeignKey
ALTER TABLE "yield_records" DROP CONSTRAINT "yield_records_fieldId_fkey";

-- DropIndex
DROP INDEX "model_evaluations_modelId_fieldId_idx";

-- DropIndex
DROP INDEX "predictions_fieldId_createdAt_idx";

-- AlterTable
ALTER TABLE "model_evaluations" DROP COLUMN "fieldId",
ADD COLUMN     "irrigation" "IrrigationStatus" NOT NULL,
ADD COLUMN     "locationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "predictions" DROP COLUMN "estimatedProd",
DROP COLUMN "estimatedYield",
DROP COLUMN "farmArea",
DROP COLUMN "fieldId",
DROP COLUMN "lowerBound",
DROP COLUMN "rainfall",
DROP COLUMN "season",
DROP COLUMN "temperature",
DROP COLUMN "upperBound",
DROP COLUMN "year",
ADD COLUMN     "historicalAvg" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "horizon" INTEGER NOT NULL,
ADD COLUMN     "irrigation" "IrrigationStatus" NOT NULL,
ADD COLUMN     "lastActualYear" INTEGER NOT NULL,
ADD COLUMN     "locationId" TEXT NOT NULL,
ADD COLUMN     "outlook" "ProductionOutlook" NOT NULL;

-- DropTable
DROP TABLE "arimax_models";

-- DropTable
DROP TABLE "fields";

-- DropTable
DROP TABLE "yield_records";

-- DropEnum
DROP TYPE "Season";

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "municipality" TEXT,
    "barangay" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_records" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "irrigation" "IrrigationStatus" NOT NULL,
    "production" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arima_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "p" INTEGER NOT NULL,
    "d" INTEGER NOT NULL,
    "q" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arima_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_points" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "production" DECIMAL(14,2) NOT NULL,
    "lowerBound" DECIMAL(14,2),
    "upperBound" DECIMAL(14,2),

    CONSTRAINT "prediction_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usability" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "functionality" INTEGER NOT NULL,
    "practicalUsefulness" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_province_municipality_barangay_key" ON "locations"("province", "municipality", "barangay");

-- CreateIndex
CREATE UNIQUE INDEX "production_records_locationId_irrigation_year_key" ON "production_records"("locationId", "irrigation", "year");

-- CreateIndex
CREATE UNIQUE INDEX "arima_models_name_key" ON "arima_models"("name");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_points_predictionId_year_key" ON "prediction_points"("predictionId", "year");

-- CreateIndex
CREATE INDEX "feedback_createdAt_idx" ON "feedback"("createdAt");

-- CreateIndex
CREATE INDEX "model_evaluations_modelId_locationId_irrigation_idx" ON "model_evaluations"("modelId", "locationId", "irrigation");

-- CreateIndex
CREATE INDEX "predictions_locationId_irrigation_createdAt_idx" ON "predictions"("locationId", "irrigation", "createdAt");

-- AddForeignKey
ALTER TABLE "production_records" ADD CONSTRAINT "production_records_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_evaluations" ADD CONSTRAINT "model_evaluations_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "arima_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_evaluations" ADD CONSTRAINT "model_evaluations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "arima_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_points" ADD CONSTRAINT "prediction_points_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Audit triggers (reuse audit_log_trigger() from the audit_triggers migration).
-- Triggers on fields, yield_records and arimax_models were dropped with those tables.
CREATE TRIGGER audit_location
AFTER INSERT OR UPDATE OR DELETE ON "locations"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_production_record
AFTER INSERT OR UPDATE OR DELETE ON "production_records"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_arima_model
AFTER INSERT OR UPDATE OR DELETE ON "arima_models"
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
