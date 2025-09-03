/*
  Warnings:

  - You are about to drop the column `driver_id` on the `trips` table. All the data in the column will be lost.
  - The `status` column on the `trips` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[currentTripId]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `client_id` to the `trips` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."OperationalStatus" AS ENUM ('CARREGADO', 'OCIOSO', 'EM_MANUTENCAO', 'EM_VIAGEM', 'PARADO', 'DESCONHECIDO');

-- CreateEnum
CREATE TYPE "public"."LogisticStatus" AS ENUM ('NO_PRAZO', 'ATENCAO', 'ATRASADO', 'CONCLUIDO', 'PLANEJADO', 'CANCELADO');

-- DropForeignKey
ALTER TABLE "public"."trips" DROP CONSTRAINT "trips_driver_id_fkey";

-- AlterTable
ALTER TABLE "public"."drivers" ALTER COLUMN "cnh" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."trips" DROP COLUMN "driver_id",
ADD COLUMN     "client_id" TEXT NOT NULL,
ADD COLUMN     "trip_driver_id" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."LogisticStatus" NOT NULL DEFAULT 'PLANEJADO';

-- AlterTable
ALTER TABLE "public"."vehicles" ADD COLUMN     "currentLocationAddress" TEXT,
ADD COLUMN     "currentLocationLat" DOUBLE PRECISION,
ADD COLUMN     "currentLocationLon" DOUBLE PRECISION,
ADD COLUMN     "currentTripId" TEXT,
ADD COLUMN     "distanceToDestinationKm" DOUBLE PRECISION,
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "efficiencyKmH" DOUBLE PRECISION,
ADD COLUMN     "idleTimeMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inMaintenance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kmToday" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lastLocationUpdateAt" TIMESTAMP(3),
ADD COLUMN     "logisticStatus" "public"."LogisticStatus" NOT NULL DEFAULT 'PLANEJADO',
ADD COLUMN     "operationalStatus" "public"."OperationalStatus" NOT NULL DEFAULT 'DESCONHECIDO';

-- DropEnum
DROP TYPE "public"."TripStatus";

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "public"."clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_account_id_name_key" ON "public"."clients"("account_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_email_key" ON "public"."drivers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_currentTripId_key" ON "public"."vehicles"("currentTripId");

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_currentTripId_fkey" FOREIGN KEY ("currentTripId") REFERENCES "public"."trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trips" ADD CONSTRAINT "trips_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trips" ADD CONSTRAINT "trips_trip_driver_id_fkey" FOREIGN KEY ("trip_driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

