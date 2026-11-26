import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://school_erp_user:school_erp_password@localhost:5432/school_erp_db'
});

async function main() {
  await client.connect();
  console.log('Connected to database...');

  // 1. Get School and Active Session
  const schoolRes = await client.query('SELECT id, name FROM schools LIMIT 1');
  const schoolId = schoolRes.rows[0].id;

  const sessionRes = await client.query('SELECT id, name FROM academic_sessions WHERE is_active = true LIMIT 1');
  const sessionId = sessionRes.rows[0].id;
  console.log(`School: ${schoolRes.rows[0].name} (${schoolId})`);
  console.log(`Active Session: ${sessionRes.rows[0].name} (${sessionId})`);

  // 2. Get active classes
  const classesRes = await client.query(`
    SELECT id, name, display_order 
    FROM classes 
    WHERE is_active = true 
    ORDER BY display_order, name
  `);
  const activeClasses = classesRes.rows;
  console.log(`Found ${activeClasses.length} active classes.`);

  // 3. Get all subjects
  const subjectsRes = await client.query(`
    SELECT id, name, code 
    FROM subjects 
    WHERE is_active = true
  `);
  const subjectsMap = new Map();
  subjectsRes.rows.forEach(s => subjectsMap.set(s.code, s.id));
  subjectsRes.rows.forEach(s => subjectsMap.set(s.name, s.id));

  console.log('Available subject codes:', Array.from(subjectsMap.keys()));

  // 4. Delete existing duplicate/old Mid-Term exams to start clean
  await client.query(`
    DELETE FROM exam_schedules WHERE exam_id IN (
      SELECT id FROM exams WHERE name LIKE 'Mid-Term%' OR name LIKE 'Mid Term%'
    )
  `);
  await client.query(`
    DELETE FROM admit_cards WHERE exam_id IN (
      SELECT id FROM exams WHERE name LIKE 'Mid-Term%' OR name LIKE 'Mid Term%'
    )
  `);
  await client.query(`
    DELETE FROM report_cards WHERE exam_id IN (
      SELECT id FROM exams WHERE name LIKE 'Mid-Term%' OR name LIKE 'Mid Term%'
    )
  `);
  await client.query(`
    DELETE FROM exam_marks WHERE exam_id IN (
      SELECT id FROM exams WHERE name LIKE 'Mid-Term%' OR name LIKE 'Mid Term%'
    )
  `);
  await client.query(`
    DELETE FROM exams WHERE name LIKE 'Mid-Term%' OR name LIKE 'Mid Term%'
  `);
  console.log('Cleaned up previous Mid-Term exams.');

  // Subject mapping per class tier
  const tierSubjects = {
    'Play Group': [
      { code: 'ART', name: 'Art & Craft', date: '2026-08-27', start: '09:00 AM', end: '11:30 AM', room: 'Activity Room 1' },
      { code: 'ENG-RHY', name: 'English & Rhymes', date: '2026-08-31', start: '09:00 AM', end: '11:30 AM', room: 'Activity Room 1' },
      { code: 'NUM-WORK', name: 'Number Work', date: '2026-09-03', start: '09:00 AM', end: '11:30 AM', room: 'Activity Room 1' },
    ],
    'Nursery': [
      { code: 'ART', name: 'Art & Craft', date: '2026-08-27', start: '09:00 AM', end: '11:30 AM', room: 'Activity Room 2' },
      { code: 'ENG-RHY', name: 'English & Rhymes', date: '2026-08-31', start: '09:00 AM', end: '11:30 AM', room: 'Activity Room 2' },
      { code: 'NUM-WORK', name: 'Number Work', date: '2026-09-03', start: '09:00 AM', end: '11:30 AM', room: 'Activity Room 2' },
    ],
    'LKG': [
      { code: 'ENG-RHY', name: 'English & Rhymes', date: '2026-08-27', start: '09:00 AM', end: '11:30 AM', room: 'Room 101' },
      { code: 'NUM-WORK', name: 'Number Work', date: '2026-08-31', start: '09:00 AM', end: '11:30 AM', room: 'Room 101' },
      { code: 'ART', name: 'Art & Craft', date: '2026-09-03', start: '09:00 AM', end: '11:30 AM', room: 'Room 101' },
    ],
    'UKG': [
      { code: 'ENG-RHY', name: 'English & Rhymes', date: '2026-08-27', start: '09:00 AM', end: '11:30 AM', room: 'Room 102' },
      { code: 'NUM-WORK', name: 'Number Work', date: '2026-08-31', start: '09:00 AM', end: '11:30 AM', room: 'Room 102' },
      { code: 'ART', name: 'Art & Craft', date: '2026-09-03', start: '09:00 AM', end: '11:30 AM', room: 'Room 102' },
    ],
    'Class 1': [
      { code: 'ENG', name: 'English', date: '2026-08-27', start: '09:00 AM', end: '12:00 PM', room: 'Main Hall A' },
      { code: 'HIN', name: 'Hindi', date: '2026-08-29', start: '09:00 AM', end: '12:00 PM', room: 'Main Hall A' },
      { code: 'MATH', name: 'Mathematics', date: '2026-08-31', start: '09:00 AM', end: '12:00 PM', room: 'Main Hall A' },
      { code: 'EVS', name: 'Environmental Studies', date: '2026-09-02', start: '09:00 AM', end: '12:00 PM', room: 'Main Hall A' },
      { code: 'ART', name: 'Art & Craft', date: '2026-09-04', start: '09:00 AM', end: '11:30 AM', room: 'Main Hall A' },
    ],
    'Class 2': [
      { code: 'ENG', name: 'English', date: '2026-08-27', start: '09:00 AM', end: '12:00 PM', room: 'Main Hall B' },
      { code: 'HIN', name: 'Hindi', date: '2026-08-29', start: '09:00 AM', end: '12:00 PM', room: 'Main Hall B' },
      { code: 'MATH', name: 'Mathematics', date: '2026-08-31', start: '09:00 AM', end: '12:00 PM', room: 'Main Hall B' },
      { code: 'EVS', name: 'Environmental Studies', date: '2026-09-02', start: '09:00 AM', end: '12:00 PM', room: 'Main Hall B' },
      { code: 'ART', name: 'Art & Craft', date: '2026-09-04', start: '09:00 AM', end: '11:30 AM', room: 'Main Hall B' },
    ],
    'Class 3': [
      { code: 'ENG', name: 'English', date: '2026-08-27', start: '09:00 AM', end: '12:00 PM', room: 'Block A-201' },
      { code: 'HIN', name: 'Hindi', date: '2026-08-29', start: '09:00 AM', end: '12:00 PM', room: 'Block A-201' },
      { code: 'MATH', name: 'Mathematics', date: '2026-08-31', start: '09:00 AM', end: '12:00 PM', room: 'Block A-201' },
      { code: 'EVS', name: 'Environmental Studies', date: '2026-09-02', start: '09:00 AM', end: '12:00 PM', room: 'Block A-201' },
      { code: 'SST', name: 'Social Studies', date: '2026-09-04', start: '09:00 AM', end: '12:00 PM', room: 'Block A-201' },
    ],
    'Class 4': [
      { code: 'ENG', name: 'English', date: '2026-08-27', start: '09:00 AM', end: '12:00 PM', room: 'Block A-202' },
      { code: 'HIN', name: 'Hindi', date: '2026-08-29', start: '09:00 AM', end: '12:00 PM', room: 'Block A-202' },
      { code: 'MATH', name: 'Mathematics', date: '2026-08-31', start: '09:00 AM', end: '12:00 PM', room: 'Block A-202' },
      { code: 'EVS', name: 'Environmental Studies', date: '2026-09-02', start: '09:00 AM', end: '12:00 PM', room: 'Block A-202' },
      { code: 'SST', name: 'Social Studies', date: '2026-09-04', start: '09:00 AM', end: '12:00 PM', room: 'Block A-202' },
    ],
    'Class 5': [
      { code: 'ENG', name: 'English', date: '2026-08-27', start: '09:00 AM', end: '12:00 PM', room: 'Block B-301' },
      { code: 'HIN', name: 'Hindi', date: '2026-08-29', start: '09:00 AM', end: '12:00 PM', room: 'Block B-301' },
      { code: 'MATH', name: 'Mathematics', date: '2026-08-31', start: '09:00 AM', end: '12:00 PM', room: 'Block B-301' },
      { code: 'SCI', name: 'Science', date: '2026-09-02', start: '09:00 AM', end: '12:00 PM', room: 'Block B-301' },
      { code: 'SST', name: 'Social Studies', date: '2026-09-04', start: '09:00 AM', end: '12:00 PM', room: 'Block B-301' },
      { code: 'CS', name: 'Computer Science', date: '2026-09-07', start: '09:00 AM', end: '11:30 AM', room: 'Computer Lab 1' },
    ],
    'Class 6': [
      { code: 'ENG', name: 'English', date: '2026-08-27', start: '09:00 AM', end: '12:00 PM', room: 'Block B-302' },
      { code: 'HIN', name: 'Hindi', date: '2026-08-29', start: '09:00 AM', end: '12:00 PM', room: 'Block B-302' },
      { code: 'MATH', name: 'Mathematics', date: '2026-08-31', start: '09:00 AM', end: '12:00 PM', room: 'Block B-302' },
      { code: 'SCI', name: 'Science', date: '2026-09-02', start: '09:00 AM', end: '12:00 PM', room: 'Block B-302' },
      { code: 'SST', name: 'Social Studies', date: '2026-09-04', start: '09:00 AM', end: '12:00 PM', room: 'Block B-302' },
      { code: 'CS', name: 'Computer Science', date: '2026-09-07', start: '09:00 AM', end: '11:30 AM', room: 'Computer Lab 2' },
    ],
  };

  // 5. Create Exam and Schedules for each active class
  const createdExams = [];
  for (const cls of activeClasses) {
    const examRes = await client.query(`
      INSERT INTO exams (id, school_id, session_id, class_id, name, start_date, end_date, status, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, 'Mid-Term Examination', '2026-08-27', '2026-09-07', 'PUBLISHED', NOW(), NOW())
      RETURNING id, name, class_id
    `, [schoolId, sessionId, cls.id]);

    const exam = examRes.rows[0];
    createdExams.push(exam);

    const scheds = tierSubjects[cls.name] || tierSubjects['Class 1'];
    for (const s of scheds) {
      const subjectId = subjectsMap.get(s.code) || subjectsMap.get(s.name);
      if (!subjectId) {
        console.error(`Could not find subject for code ${s.code} / ${s.name}`);
        continue;
      }
      await client.query(`
        INSERT INTO exam_schedules (id, school_id, exam_id, subject_id, exam_date, start_time, end_time, room, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [schoolId, exam.id, subjectId, s.date, s.start, s.end, s.room]);
    }
    console.log(`Created exam & ${scheds.length} schedules for ${cls.name}`);
  }

  // 6. Release Admit Cards according to fee clearance policy
  const allStudentsRes = await client.query(`
    SELECT st.id, st.first_name, st.last_name, st.class_id, st.section_id,
      CASE WHEN EXISTS(
        SELECT 1 FROM fee_records fr 
        WHERE fr.student_id = st.id 
        AND fr.status IN ('PENDING', 'PARTIAL', 'OVERDUE') 
        AND fr.balance_amount > 0
        AND (fr.year < 2026 OR (fr.year = 2026 AND fr.month <= 8))
      ) THEN false ELSE true END as fee_cleared
    FROM students st
    WHERE st.is_active = true AND st.deleted_at IS NULL
  `);

  let releasedCount = 0;
  let holdCount = 0;

  for (const st of allStudentsRes.rows) {
    const examForClass = createdExams.find(e => e.class_id === st.class_id);
    if (!examForClass) continue;

    const isReleased = st.fee_cleared;
    const remark = isReleased ? 'Cleared' : 'Fees Not Paid';

    await client.query(`
      INSERT INTO admit_cards (id, school_id, session_id, exam_id, student_id, admin_status, teacher_status, remark, is_released, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 'AUTO', 'NONE', $5, $6, NOW(), NOW())
    `, [schoolId, sessionId, examForClass.id, st.id, remark, isReleased]);

    if (isReleased) releasedCount++;
    else holdCount++;
  }

  console.log(`Admit cards generated: ${releasedCount} Released (Fee Cleared), ${holdCount} On Hold (Fees Pending).`);
  await client.end();
}

main().catch(err => {
  console.error('Error executing setup script:', err);
  process.exit(1);
});
