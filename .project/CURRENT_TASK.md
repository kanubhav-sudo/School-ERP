# Current Task

**Milestone:** 5 (Finance & Fee Management)
**Current Micro-Checkpoint:** MC-3
**Status:** In Progress

## Just Completed
- **MC-1**: Prisma schema, enums, migration `add_finance_module`, models (`FeePlan`, `FeeRecord`, `FeePayment`, `FeeReminderRule`), updated `Student`, generated Prisma Client, and pushed to `main`.
- **MC-2**: Fee Plan CRUD Backend (`fee-plan.validator.ts`, `fee-plan.service.ts`, `fee-plan.controller.ts`, `fee-plan.routes.ts`, registered in `index.ts`), built and linted.

## Next Up (MC-3: Student Model Modifications - Backend)
Files: `student.validator.ts` (MODIFY), `student.service.ts` (MODIFY)

**Validator**:
- Add `feePlanId?: z.string().uuid().optional()`
- Add `siblingStudentId?: z.string().uuid().optional()`

**Service**:
- Add `feePlanId`, `siblingStudentId` to `studentSelect` (include `feePlan: {id, name, type, monthlyAmount}`)
- Add to `createStudent` data mapping
- Add to `updateStudent` data mapping
- Validate: if `siblingStudentId` provided, must not equal `studentId`
