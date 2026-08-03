-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_plan_id_fkey";

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "current_plan" TEXT NOT NULL DEFAULT 'BASE',
ADD COLUMN     "monthly_price" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "yearly_price" INTEGER NOT NULL DEFAULT 10000,
ALTER COLUMN "plan_id" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "end_date" DROP NOT NULL;

-- CreateTable
CREATE TABLE "upgrade_requests" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "current_plan" TEXT NOT NULL,
    "requested_plan" TEXT NOT NULL DEFAULT 'PREMIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upgrade_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upgrade_requests_school_id_idx" ON "upgrade_requests"("school_id");

-- CreateIndex
CREATE INDEX "upgrade_requests_status_idx" ON "upgrade_requests"("status");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upgrade_requests" ADD CONSTRAINT "upgrade_requests_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

