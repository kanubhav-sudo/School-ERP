/**
 * Global Search Service — CloudEMS Platform v4
 *
 * Provides centralized, cross-entity search for SUPER_ADMIN.
 * Groups results by entity type: Schools, Users, Teachers, Students.
 *
 * @module services/global-search
 */

import prisma from '../database/prisma'

export interface GlobalSearchResult {
  schools: SearchHit[]
  users: SearchHit[]
  teachers: SearchHit[]
  students: SearchHit[]
  totalHits: number
}

export interface SearchHit {
  id: string
  type: 'school' | 'user' | 'teacher' | 'student'
  title: string
  subtitle?: string
  meta?: Record<string, unknown>
}

/**
 * Runs a global cross-entity search.
 * Limit per entity type: 10 results.
 */
export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  if (!query || query.trim().length < 2) {
    return { schools: [], users: [], teachers: [], students: [], totalHits: 0 }
  }

  const q = query.trim()
  const contains = { contains: q, mode: 'insensitive' as const }

  const [schools, users, teachers, students] = await Promise.all([
    // Schools
    prisma.school.findMany({
      where: {
        OR: [
          { name: contains },
          { slug: contains },
          { contactEmail: contains },
          { city: contains },
          { customDomain: contains },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        city: true,
        state: true,
        contactEmail: true,
      },
    }),

    // Users (platform-level — all schools)
    prisma.user.findMany({
      where: {
        OR: [{ username: contains }, { email: contains }, { phone: contains }],
      },
      take: 10,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        accountStatus: true,
        schoolId: true,
        school: { select: { name: true, slug: true } },
      },
    }),

    // Teachers
    prisma.teacher.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: contains },
          { lastName: contains },
          { email: contains },
          { phone: contains },
          { employeeId: contains },
        ],
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        designation: true,
        schoolId: true,
        school: { select: { name: true, slug: true } },
      },
    }),

    // Students
    prisma.student.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: contains },
          { lastName: contains },
          { admissionNumber: contains },
          { phone: contains },
          { email: contains },
        ],
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        status: true,
        schoolId: true,
        school: { select: { name: true, slug: true } },
      },
    }),
  ])

  const schoolHits: SearchHit[] = schools.map((s) => ({
    id: s.id,
    type: 'school',
    title: s.name,
    subtitle: `${s.slug} • ${s.status}`,
    meta: { city: s.city, state: s.state, email: s.contactEmail },
  }))

  const userHits: SearchHit[] = users.map((u) => ({
    id: u.id,
    type: 'user',
    title: u.username,
    subtitle: `${u.email} • ${u.role}`,
    meta: {
      school: u.school?.name,
      accountStatus: u.accountStatus,
    },
  }))

  const teacherHits: SearchHit[] = teachers.map((t) => ({
    id: t.id,
    type: 'teacher',
    title: `${t.firstName} ${t.lastName}`,
    subtitle: `${t.employeeId} • ${t.designation ?? 'TEACHER'}`,
    meta: { school: t.school?.name, email: t.email },
  }))

  const studentHits: SearchHit[] = students.map((s) => ({
    id: s.id,
    type: 'student',
    title: `${s.firstName} ${s.lastName}`,
    subtitle: `Admission #${s.admissionNumber}`,
    meta: { school: s.school?.name, status: s.status },
  }))

  return {
    schools: schoolHits,
    users: userHits,
    teachers: teacherHits,
    students: studentHits,
    totalHits: schoolHits.length + userHits.length + teacherHits.length + studentHits.length,
  }
}
