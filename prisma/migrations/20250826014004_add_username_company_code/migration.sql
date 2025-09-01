/*
  Warnings:

  - A unique constraint covering the columns `[company_code]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[account_id,username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company_code` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."users_account_id_email_key";

-- AlterTable
ALTER TABLE "public"."accounts" ADD COLUMN     "company_code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_company_code_key" ON "public"."accounts"("company_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_account_id_username_key" ON "public"."users"("account_id", "username");
