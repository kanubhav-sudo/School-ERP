/**
 * Database inspection script for planning purposes
 */
import { createRequire } from 'module';
import { execSync } from 'child_process';

// Use pg directly since Prisma uses client engine type
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://school_erp_user:school_erp_password@localhost:5432/school_erp_db'
});

async function main() {
  await client.connect();

  // Get school
  const schoolRes = await client.query('SELECT id, name FROM "School" LIMIT 1');
  console.log('\n=== SCHOOL ===');
  console.log(JSON.stringify(schoolRes.rows[0]));

  // Get active session
  const sessionRes = await client.query('SELECT id, name, "isActive" FROM "AcademicSession" WHERE "isActive" = true LIMIT 1');
  console.log('\n=== ACTIVE SESSION ===');
  console.log(JSON.stringify(sessionRes.rows[0]));

  // Get active classes
  const classRes = await client.query('SELECT id, name FROM "Class" WHERE "isActive" = true AND "deletedAt" IS NULL ORDER BY name');
  console.log('\n=== ACTIVE CLASSES ===');
  console.log(JSON.stringify(classRes.rows));

  // Get sections
  const sectionRes = await client.query('SELECT s.id, s.name, c.name as class_name FROM "Section" s JOIN "Class" c ON s."classId" = c.id WHERE c."isActive" = true AND c."deletedAt" IS NULL ORDER BY c.name, s.name LIMIT 30');
  console.log('\n=== SECTIONS ===');
  console.log(JSON.stringify(sectionRes.rows));

  // Get subjects
  const subjectRes = await client.query('SELECT id, name, code FROM "Subject" WHERE "deletedAt" IS NULL ORDER BY name LIMIT 30');
  console.log('\n=== SUBJECTS ===');
  console.log(JSON.stringify(subjectRes.rows));

  // Get existing exams
  const examRes = await client.query(`
    SELECT e.id, e.name, e.status, e."startDate", e."endDate", c.name as class_name, COUNT(es.id) as schedule_count
    FROM "Exam" e
    JOIN "Class" c ON e."classId" = c.id
    LEFT JOIN "ExamSchedule" es ON es."examId" = e.id
    GROUP BY e.id, e.name, e.status, e."startDate", e."endDate", c.name
    ORDER BY c.name, e.name
  `);
  console.log('\n=== EXISTING EXAMS ===');
  console.log(JSON.stringify(examRes.rows));

  // Get student count by class
  const studentRes = await client.query(`
    SELECT c.name as class_name, s2.name as section_name, COUNT(st.id) as student_count
    FROM "Student" st
    JOIN "Class" c ON st."classId" = c.id
    LEFT JOIN "Section" s2 ON st."sectionId" = s2.id
    WHERE st."isActive" = true AND st."deletedAt" IS NULL
    GROUP BY c.name, s2.name
    ORDER BY c.name, s2.name
  `);
  console.log('\n=== STUDENT COUNTS BY CLASS/SECTION ===');
  console.log(JSON.stringify(studentRes.rows));

  // Fee clearance status
  const feeRes = await client.query(`
    SELECT st.id, st."firstName", st."lastName", st."admissionNumber", c.name as class_name, 
      CASE WHEN EXISTS(
        SELECT 1 FROM "FeeRecord" fr 
        WHERE fr."studentId" = st.id 
        AND fr.status IN ('PENDING', 'PARTIAL', 'OVERDUE') 
        AND fr."balanceAmount" > 0
        AND (fr.year < 2026 OR (fr.year = 2026 AND fr.month <= 8))
      ) THEN 'UNPAID' ELSE 'PAID' END as fee_status
    FROM "Student" st
    JOIN "Class" c ON st."classId" = c.id
    WHERE st."isActive" = true AND st."deletedAt" IS NULL
    ORDER BY c.name, st."firstName"
    LIMIT 20
  `);
  console.log('\n=== FEE STATUS SAMPLE ===');
  console.log(JSON.stringify(feeRes.rows));

  // Check AcademicDocumentTemplate
  const templateRes = await client.query('SELECT id, "documentType", version, "isActive", preset FROM "AcademicDocumentTemplate" ORDER BY version DESC LIMIT 5');
  console.log('\n=== DOCUMENT TEMPLATES ===');
  console.log(JSON.stringify(templateRes.rows));

  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
