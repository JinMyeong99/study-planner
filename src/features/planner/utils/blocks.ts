import type { Course, StudyBlock } from '../types'

export const createCourseMap = (courses: Course[]) =>
  new Map(courses.map((course) => [course.id, course]))

export const sortPlannerBlocks = (blocks: StudyBlock[]) =>
  [...blocks].sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek ||
      a.startTime.localeCompare(b.startTime) ||
      a.endTime.localeCompare(b.endTime),
  )
