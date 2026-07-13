/*
  Warnings:

  - You are about to drop the column `discount_amount` on the `fee_plans` table. All the data in the column will be lost.
  - You are about to drop the column `discount_percent` on the `fee_plans` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `fee_plans` table. All the data in the column will be lost.
  - You are about to drop the column `discount_amount` on the `fee_records` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FeeCategory" AS ENUM ('STANDARD', 'SIBLING');

-- DropForeignKey
ALTER TABLE "fee_records" DROP CONSTRAINT "fee_records_fee_plan_id_fkey";

-- DropIndex
DROP INDEX "fee_plans_type_idx";

-- AlterTable
ALTER TABLE "fee_plans" DROP COLUMN "discount_amount",
DROP COLUMN "discount_percent",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "fee_records" DROP COLUMN "discount_amount",
ALTER COLUMN "fee_plan_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "fee_category" "FeeCategory" DEFAULT 'STANDARD',
ADD COLUMN     "sibling_fee_amount" INTEGER;

-- DropEnum
DROP TYPE "FeePlanType";

-- AddForeignKey
ALTER TABLE "fee_records" ADD CONSTRAINT "fee_records_fee_plan_id_fkey" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
