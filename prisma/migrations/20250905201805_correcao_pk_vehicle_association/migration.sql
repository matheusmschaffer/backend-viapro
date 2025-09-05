/*
  Warnings:

  - The primary key for the `vehicle_account_associations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[vehicle_id,account_id]` on the table `vehicle_account_associations` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `vehicle_account_associations` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "public"."vehicle_account_associations" DROP CONSTRAINT "vehicle_account_associations_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "vehicle_account_associations_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_account_associations_vehicle_id_account_id_key" ON "public"."vehicle_account_associations"("vehicle_id", "account_id");
