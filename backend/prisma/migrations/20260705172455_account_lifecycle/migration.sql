/*
  Warnings:

  - You are about to drop the column `is_temporary_password` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountAuditAction" AS ENUM ('ACCOUNT_CREATED', 'CREDENTIALS_ISSUED', 'CREDENTIALS_REISSUED', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'FORCE_PASSWORD_CHANGE', 'ACCOUNT_ACTIVATED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_DISABLED', 'ACCOUNT_UNLOCKED', 'ACCOUNT_DELETED');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_temporary_password",
ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_failed_login_at" TIMESTAMP(3),
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "username_sequences" (
    "prefix" TEXT NOT NULL,
    "last_seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "username_sequences_pkey" PRIMARY KEY ("prefix")
);

-- CreateTable
CREATE TABLE "account_audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "performed_by" UUID,
    "action" "AccountAuditAction" NOT NULL,
    "remarks" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_audit_logs_user_id_idx" ON "account_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "account_audit_logs_action_idx" ON "account_audit_logs"("action");

-- CreateIndex
CREATE INDEX "account_audit_logs_created_at_idx" ON "account_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "account_audit_logs" ADD CONSTRAINT "account_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_audit_logs" ADD CONSTRAINT "account_audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
