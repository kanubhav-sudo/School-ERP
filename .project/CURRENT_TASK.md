# Current Task

**Milestone:** 5 (Finance & Fee Management)
**Current Micro-Checkpoint:** MC-4
**Status:** In Progress

## Just Completed
- **MC-1**: Prisma schema, enums, migration `add_finance_module`, models (`FeePlan`, `FeeRecord`, `FeePayment`, `FeeReminderRule`), updated `Student`, generated Prisma Client, and pushed to `main`.
- **MC-2**: Fee Plan CRUD Backend (`fee-plan.validator.ts`, `fee-plan.service.ts`, `fee-plan.controller.ts`, `fee-plan.routes.ts`, registered in `index.ts`), built and linted.
- **Visibility Fix**: Added minimal frontend routing and pages for `FeePlansPage` and `FeeRecordsPage` to make the Finance sidebar link visible and working.
- **MC-3**: Student Model Modifications - Backend (`student.validator.ts`, `student.service.ts`). Added `feePlanId` and `siblingStudentId` to validators, data mapping, and select statements. Included sibling self-reference validation.

## Next Up (MC-4: Fee Record Backend)
Files: `fee-record.validator.ts`, `fee-record.service.ts`, `fee-record.controller.ts`, `fee-record.routes.ts`, `routes/index.ts`

**Business logic (service)**:
- `netAmount = monthlyAmount - discountAmount + lateFine`
- `balanceAmount = netAmount - paidAmount`
- `status = paidAmount === 0 ? PENDING : paidAmount >= netAmount ? PAID : PARTIAL`

**Routes**:
- `GET /fee-records`
- `GET /fee-records/:id`
- `POST /fee-records`
- `PATCH /fee-records/:id/payment`
- `GET /fee-records/dashboard/stats`
