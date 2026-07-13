const { z } = require('zod');
const DayOfWeekEnum = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
const TimeString = z.string().regex(timeRegex, 'Time must be in HH:MM 24-hour format (e.g. 08:30)')

const createTimetableSchema = z
  .object({
    sessionId: z.string().uuid('sessionId must be a valid UUID'),
    classId: z.string().uuid('classId must be a valid UUID'),
    sectionId: z.string().uuid('sectionId must be a valid UUID'),
    teacherId: z.string().uuid('teacherId must be a valid UUID'),
    subjectId: z.string().uuid('subjectId must be a valid UUID'),
    dayOfWeek: DayOfWeekEnum,
    periodNumber: z
      .number()
      .int()
      .min(1, 'Period number must be at least 1')
      .max(10, 'Period number must be 10 or fewer'),
    startTime: TimeString,
    endTime: TimeString,
    room: z.string().max(50).trim().optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'startTime must be before endTime',
    path: ['endTime'],
  })
  
const result = createTimetableSchema.safeParse({
    sessionId: "2625fb7e-3c22-49f3-8b7c-3f482d790d0b",
    classId: "2625fb7e-3c22-49f3-8b7c-3f482d790d0b",
    sectionId: "2625fb7e-3c22-49f3-8b7c-3f482d790d0b",
    teacherId: "2625fb7e-3c22-49f3-8b7c-3f482d790d0b",
    subjectId: "2625fb7e-3c22-49f3-8b7c-3f482d790d0b",
    dayOfWeek: "MONDAY",
    periodNumber: 1,
    startTime: "08:00",
    endTime: "08:45",
    room: ""
})
console.log(JSON.stringify(result, null, 2))
