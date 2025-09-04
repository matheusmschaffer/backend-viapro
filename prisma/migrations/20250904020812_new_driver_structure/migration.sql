/*
  Warnings:

  - The values [LOW,MEDIUM,HIGH,CRITICAL] on the enum `AlertSeverity` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,PAID,OVERDUE,CANCELED,REFUNDED] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [TRIAL,ACTIVE,PAST_DUE,CANCELED,SUSPENDED] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [MANAGER,OPERATOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `contactPerson` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `account_id` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `cnh` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `drivers` table. All the data in the column will be lost.
  - You are about to alter the column `phone` on the `drivers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `email` on the `drivers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the column `trip_driver_id` on the `trips` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cpf]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpf` to the `drivers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `drivers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driver_id` to the `trips` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `association_type` on the `vehicle_account_associations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."AssociationType" AS ENUM ('FROTA', 'AGREGADO', 'TERCEIRO');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."AlertSeverity_new" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
ALTER TABLE "public"."alerts" ALTER COLUMN "severity" DROP DEFAULT;
ALTER TABLE "public"."alerts" ALTER COLUMN "severity" TYPE "public"."AlertSeverity_new" USING ("severity"::text::"public"."AlertSeverity_new");
ALTER TYPE "public"."AlertSeverity" RENAME TO "AlertSeverity_old";
ALTER TYPE "public"."AlertSeverity_new" RENAME TO "AlertSeverity";
DROP TYPE "public"."AlertSeverity_old";
ALTER TABLE "public"."alerts" ALTER COLUMN "severity" SET DEFAULT 'MEDIA';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."InvoiceStatus_new" AS ENUM ('PENDENTE', 'PAGA', 'VENCIDA', 'CANCELADA', 'ESTORNADA');
ALTER TABLE "public"."invoices" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."invoices" ALTER COLUMN "status" TYPE "public"."InvoiceStatus_new" USING ("status"::text::"public"."InvoiceStatus_new");
ALTER TYPE "public"."InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "public"."InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "public"."InvoiceStatus_old";
ALTER TABLE "public"."invoices" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."SubscriptionStatus_new" AS ENUM ('TESTE', 'ATIVA', 'EM_ATRASO', 'CANCELADA', 'SUSPENSA');
ALTER TABLE "public"."subscriptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."subscriptions" ALTER COLUMN "status" TYPE "public"."SubscriptionStatus_new" USING ("status"::text::"public"."SubscriptionStatus_new");
ALTER TYPE "public"."SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "public"."SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "public"."SubscriptionStatus_old";
ALTER TABLE "public"."subscriptions" ALTER COLUMN "status" SET DEFAULT 'TESTE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('ADMIN', 'GERENTE', 'OPERADOR');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'OPERADOR';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."drivers" DROP CONSTRAINT "drivers_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."trips" DROP CONSTRAINT "trips_trip_driver_id_fkey";

-- DropIndex
DROP INDEX "public"."drivers_cnh_key";

-- DropIndex
DROP INDEX "public"."drivers_email_key";

-- AlterTable
ALTER TABLE "public"."alerts" ALTER COLUMN "severity" SET DEFAULT 'MEDIA';

-- AlterTable
ALTER TABLE "public"."clients" DROP COLUMN "contactPerson",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."drivers" DROP COLUMN "account_id",
DROP COLUMN "cnh",
DROP COLUMN "name",
ADD COLUMN     "cnh_category" VARCHAR(5),
ADD COLUMN     "cnh_expiration" DATE,
ADD COLUMN     "cnh_number" VARCHAR(11),
ADD COLUMN     "cpf" VARCHAR(11) NOT NULL,
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "full_name" VARCHAR(255) NOT NULL,
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."invoices" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';

-- AlterTable
ALTER TABLE "public"."subscriptions" ALTER COLUMN "status" SET DEFAULT 'TESTE';

-- AlterTable
ALTER TABLE "public"."trips" DROP COLUMN "trip_driver_id",
ADD COLUMN     "driver_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'OPERADOR';

-- AlterTable
ALTER TABLE "public"."vehicle_account_associations" DROP COLUMN "association_type",
ADD COLUMN     "association_type" "public"."AssociationType" NOT NULL;

-- DropEnum
DROP TYPE "public"."VehicleClassification";

-- CreateTable
CREATE TABLE "public"."driver_account_associations" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "association_type" "public"."AssociationType" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_account_associations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driver_account_associations_driver_id_account_id_is_active_key" ON "public"."driver_account_associations"("driver_id", "account_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_cpf_key" ON "public"."drivers"("cpf");

-- AddForeignKey
ALTER TABLE "public"."driver_account_associations" ADD CONSTRAINT "driver_account_associations_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_account_associations" ADD CONSTRAINT "driver_account_associations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
