-- CreateEnum
CREATE TYPE "FeePlanType" AS ENUM ('STANDARD_MONTHLY', 'SIBLING_DISCOUNT');

-- CreateEnum
CREATE TYPE "FeeRecordStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'WAIVED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "fee_plan_id" UUID,
ADD COLUMN     "sibling_student_id" UUID;

-- CreateTable
CREATE TABLE "fee_plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FeePlanType" NOT NULL,
    "session_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "monthly_amount" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "discount_percent" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_records" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "fee_plan_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "monthly_amount" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "late_fine" INTEGER NOT NULL DEFAULT 0,
    "net_amount" INTEGER NOT NULL,
    "paid_amount" INTEGER NOT NULL DEFAULT 0,
    "balance_amount" INTEGER NOT NULL,
    "status" "FeeRecordStatus" NOT NULL DEFAULT 'PENDING',
    "due_date" DATE,
    "last_payment_date" DATE,
    "last_payment_mode" "PaymentMode",
    "receipt_number" TEXT,
    "remarks" TEXT,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" UUID NOT NULL,
    "fee_record_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "payment_date" DATE NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL,
    "receipt_number" TEXT,
    "transaction_ref" TEXT,
    "remarks" TEXT,
    "collected_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_reminder_rules" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "days_offset" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_reminder_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_plans_session_id_idx" ON "fee_plans"("session_id");

-- CreateIndex
CREATE INDEX "fee_plans_class_id_idx" ON "fee_plans"("class_id");

-- CreateIndex
CREATE INDEX "fee_plans_type_idx" ON "fee_plans"("type");

-- CreateIndex
CREATE INDEX "fee_plans_is_active_idx" ON "fee_plans"("is_active");

-- CreateIndex
CREATE INDEX "fee_plans_is_deleted_idx" ON "fee_plans"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "fee_plans_name_session_id_class_id_key" ON "fee_plans"("name", "session_id", "class_id");

-- CreateIndex
CREATE INDEX "fee_records_student_id_idx" ON "fee_records"("student_id");

-- CreateIndex
CREATE INDEX "fee_records_session_id_idx" ON "fee_records"("session_id");

-- CreateIndex
CREATE INDEX "fee_records_class_id_idx" ON "fee_records"("class_id");

-- CreateIndex
CREATE INDEX "fee_records_status_idx" ON "fee_records"("status");

-- CreateIndex
CREATE INDEX "fee_records_month_year_idx" ON "fee_records"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "fee_records_student_id_month_year_session_id_key" ON "fee_records"("student_id", "month", "year", "session_id");

-- CreateIndex
CREATE INDEX "fee_payments_fee_record_id_idx" ON "fee_payments"("fee_record_id");

-- CreateIndex
CREATE INDEX "fee_payments_payment_date_idx" ON "fee_payments"("payment_date");

-- CreateIndex
CREATE INDEX "students_fee_plan_id_idx" ON "students"("fee_plan_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_fee_plan_id_fkey" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_sibling_student_id_fkey" FOREIGN KEY ("sibling_student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_plans" ADD CONSTRAINT "fee_plans_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_records" ADD CONSTRAINT "fee_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_records" ADD CONSTRAINT "fee_records_fee_plan_id_fkey" FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_records" ADD CONSTRAINT "fee_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_records" ADD CONSTRAINT "fee_records_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_fee_record_id_fkey" FOREIGN KEY ("fee_record_id") REFERENCES "fee_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
