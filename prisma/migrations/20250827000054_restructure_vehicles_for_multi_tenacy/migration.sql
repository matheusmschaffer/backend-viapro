/*
  Warnings:

  - You are about to drop the column `account_id` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `classification` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `group_id` on the `vehicles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."vehicles" DROP CONSTRAINT "vehicles_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicles" DROP CONSTRAINT "vehicles_group_id_fkey";

-- AlterTable
ALTER TABLE "public"."vehicles" DROP COLUMN "account_id",
DROP COLUMN "classification",
DROP COLUMN "group_id";

-- CreateTable
CREATE TABLE "public"."vehicle_account_associations" (
    "vehicle_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "association_type" "public"."VehicleClassification" NOT NULL,
    "is_active_for_account" BOOLEAN NOT NULL DEFAULT true,
    "group_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_account_associations_pkey" PRIMARY KEY ("vehicle_id","account_id")
);

-- AddForeignKey
ALTER TABLE "public"."vehicle_account_associations" ADD CONSTRAINT "vehicle_account_associations_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_account_associations" ADD CONSTRAINT "vehicle_account_associations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_account_associations" ADD CONSTRAINT "vehicle_account_associations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."vehicle_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
